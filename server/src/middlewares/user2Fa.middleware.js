'use strict';
const passport = require('passport');
const responseHelper = require('../utils/customResponse');
const logger = require('../services/logger');
const log = new logger('MiddlewareController').getChildLogger();

const { userDbHandler } = require('../services/db');

/*********************************************
 * SERVICE FOR HANDLING TOKEN AUTHENTICATION
 *********************************************/
module.exports = (req, res, next) => {
	let responseData = {};
	/**
	 * Method to Authenticate Jwt token using Passport Jwt Strategy
	 */
	passport.authenticate('jwt', { session: false }, async function (error, user, info) {// eslint-disable-line
		//If error, then return the error
		// if (error) {
		// 	log.error('failed to validate jwt token with error::', error);
		// 	responseData.msg = 'Failed to process request';
		// 	return responseHelper.error(res, responseData);
		// }
		// //if user data not found then return the unauthorized response
		// if (!user) {
		// 	log.error('failed to extract jwt token info with error::', error);
		// 	responseData.msg = 'unAuthorized request';
		// 	return responseHelper.unAuthorize(res, responseData);
		// }
		// else {
		// 	let query = {
		// 		email: user.email
		// 	}
		// 	let userData = await userDbHandler.getOneByQuery(query, { password: 0 });
		// 	let time = new Date().getTime();
		// 	if (!userData) {
		// 		log.error('failed to get user::', userData);
		// 		responseData.msg = 'unAuthorized request';
		// 		return responseHelper.unAuthorize(res, responseData);
		// 	}
		// 	else if (!userData.status) {
		// 		log.error('failed to get user::', userData);
		// 		responseData.msg = 'Your account is disabled please contact to admin!';
		// 		responseData.data = 'account_deactive';
		// 		return responseHelper.unAuthorize(res, responseData);
		// 	}
		// 	else if (userData.force_relogin_time && userData.force_relogin_time > user.time) {
		// 		log.error('failed to get user::', userData);

		// 		if (userData.force_relogin_type == 'permission_change') {
		// 			responseData.msg = 'Your permission has been changed by admin please login again!';
		// 		}
		// 		else {
		// 			responseData.msg = 'Your session has been expired please login again!';
		// 		}
		// 		responseData.data = userData.force_relogin_type;
		// 		return responseHelper.unAuthorize(res, responseData);
		// 	}
		// }

		log.info('token extracted successfully with data:', user);
		//push the extracted jwt token data to the request object
		req.user = user;
		next();
	})(req, res, next);
};