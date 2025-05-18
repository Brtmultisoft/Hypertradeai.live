'use strict';
const jwtDecode = require('jsonwebtoken');
const responseHelper = require('../utils/customResponse');
const config = require('../config/config');
const logger = require('../services/logger');
const log = new logger('MiddlewareController').getChildLogger();
const { adminDbHandler } = require('../services/db');
const databaseService = require('../services/database.service');
/***************************************************************
 * SERVICE FOR HANDLING ADMIN AUTH TOKEN AUTHENTICATION
 **************************************************************/
module.exports = async (req, res, next) => {
	/**
	 * Method to Authenticate Admin token
	 */
	let reqHeaders = req.get('Authorization');
	let responseData = {};

	try {
		// Check if Authorization header exists
		if (!reqHeaders || !reqHeaders.startsWith('Bearer ')) {
			responseData.msg = 'Authorization header missing or invalid';
			return responseHelper.unAuthorize(res, responseData);
		}

		let adminAuthToken = reqHeaders.split(' ')[1];

		// Verify the token
		log.info('Validating admin auth token');
		let decodedToken = jwtDecode.verify(adminAuthToken, config.adminJwtTokenInfo.secretKey);
		log.info('Admin auth token extracted successfully');

		let admin = decodedToken;

		// If admin data not found then return unauthorized response
		if (!admin) {
			log.error('Failed to extract JWT token info');
			responseData.msg = 'Unauthorized request';
			return responseHelper.unAuthorize(res, responseData);
		}

		// Ensure database connection is established
		if (!databaseService.isConnectedToDatabase()) {
			log.info('Database not connected, attempting to connect...');
			try {
				await databaseService.connect();
				log.info('Database connection established for admin authentication');
			} catch (dbError) {
				log.error('Failed to connect to database for admin authentication:', dbError);
				responseData.msg = 'Database connection error. Please try again later.';
				return responseHelper.error(res, responseData);
			}
		}

		// Get admin data from database
		let id = admin.sub;
		let adminData = await adminDbHandler.getById(id, { password: 0 });
		let time = new Date().getTime();

		// Validate admin data
		if (!adminData) {
			log.error('Failed to get admin data');
			responseData.msg = 'Unauthorized request';
			return responseHelper.unAuthorize(res, responseData);
		}
		else if (!adminData.status) {
			log.error('Admin account is disabled');
			responseData.msg = 'Your account is disabled. Please contact admin!';
			responseData.data = 'account_deactive';
			return responseHelper.unAuthorize(res, responseData);
		}
		else if (adminData.force_relogin_time && adminData.force_relogin_time > admin.time) {
			log.error('Admin session expired or permissions changed');

			if (!adminData.is_super_admin && adminData.force_relogin_type == 'permission_change') {
				responseData.msg = 'Your permissions have been changed. Please login again!';
			}
			else {
				responseData.msg = 'Your session has expired. Please login again!';
			}
			responseData.data = adminData.force_relogin_type;
			return responseHelper.unAuthorize(res, responseData);
		}

		// Set admin data in request and proceed
		req.admin = decodedToken;
		next();
	} catch (error) {
		log.error('Failed to validate admin auth token with error:', error);

		// Handle specific error types
		if (error.name === 'TokenExpiredError') {
			responseData.msg = 'Token has expired';
		} else if (error.name === 'JsonWebTokenError') {
			responseData.msg = 'Invalid token';
		} else if (error.name === 'MongoNotConnectedError' || error.message?.includes('Client must be connected')) {
			responseData.msg = 'Database connection error. Please try again later.';
			return responseHelper.error(res, responseData);
		} else {
			responseData.msg = 'Unauthorized request';
		}

		return responseHelper.unAuthorize(res, responseData);
	}
};