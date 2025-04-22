'use strict';
const jwtDecode = require('jsonwebtoken');
const responseHelper = require('../utils/customResponse');
const config = require('../config/config');
const logger = require('../services/logger');
const log = new logger('MiddlewareController').getChildLogger();
const { adminDbHandler } = require('../services/db');
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
		let adminAuthToken = reqHeaders.split(' ')[1];
		log.info('Received request for validating admin auth token', adminAuthToken);
		let decodedToken = jwtDecode.verify(adminAuthToken, config.adminJwtTokenInfo.secretKey);
		log.info('admin auth token extracted successfully with data:', decodedToken);

		let admin = decodedToken;

		//if admin data not found then return the unauthorized response
		if (!admin) {
			log.error('failed to extract jwt token info with error::', error);
			responseData.msg = 'unAuthorized request';
			return responseHelper.unAuthorize(res, responseData);
		}
		else {
			let id = admin.sub;
			let adminData = await adminDbHandler.getById(id, { password: 0 });
			let time = new Date().getTime();
			if (!adminData) {
				log.error('failed to get admin::', adminData);
				responseData.msg = 'unAuthorized request';
				return responseHelper.unAuthorize(res, responseData);
			}
			else if (!adminData.status) {
				log.error('failed to get admin::', adminData);
				responseData.msg = 'Your account is disabled please contact to admin!';
				responseData.data = 'account_deactive';
				return responseHelper.unAuthorize(res, responseData);
			}
			else if (adminData.force_relogin_time && adminData.force_relogin_time > admin.time) {
				log.error('failed to get admin::', adminData);

				if (!adminData.is_super_admin && adminData.force_relogin_type == 'permission_change') {
					responseData.msg = 'Your permission has been changed by admin please login again!';
				}
				else {
					responseData.msg = 'Your session has been expired please login again!';
				}
				responseData.data = adminData.force_relogin_type;
				return responseHelper.unAuthorize(res, responseData);
			}
		}

		req.admin = decodedToken;
		next();
	} catch (error) {
		log.error('failed to validate admin auth token with error::', error);
		if (error.TokenExpiredError) {
			responseData.msg = 'Token has been expired';
		} else {
			responseData.msg = 'Unauthorized request';
		}
		return responseHelper.unAuthorize(res, responseData);
	}
};