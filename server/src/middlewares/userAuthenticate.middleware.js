'use strict';
const passport = require('passport');
const jwt = require('jsonwebtoken');
const responseHelper = require('../utils/customResponse');
const logger = require('../services/logger');
const log = new logger('MiddlewareController').getChildLogger();
const { userDbHandler } = require('../services/db');

/*********************************************
 * SERVICE FOR HANDLING TOKEN AUTHENTICATION
 *********************************************/
module.exports = (req, res, next) => {
    let responseData = {};
    console.log("(&&&&&&&&&");

    // Check if token is present in the Authorization header or the request body
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;

    if (token) {
        try {
            // Decode the JWT token
            const decodedToken = jwt.decode(token);

            // Validate the token format and content
            if (!decodedToken) {
                responseData.msg = 'Invalid token format';
                return responseHelper.unAuthorize(res, responseData);
            }
			console.log(decodedToken)
            req.user = decodedToken; // Attach decoded token data to req.user for access in later steps
            req.headers.authorization = `Bearer ${token}`; // Set the token for Passport to authenticate
        } catch (error) {
            log.error('Failed to decode JWT token with error::', error);
            responseData.msg = 'Failed to decode token';
            return responseHelper.error(res, responseData);
        }
    } else {
        responseData.msg = 'Token not provided';
        return responseHelper.unAuthorize(res, responseData);
    }

    /**
     * Method to Authenticate Jwt token using Passport Jwt Strategy
     */
    passport.authenticate('jwt', { session: false }, async function (error, user, info) {
        // if (error) {
        //     log.error('Failed to validate jwt token with error::', error);
        //     responseData.msg = 'Failed to process request';
        //     return responseHelper.error(res, responseData);
        // }

        // if (!user) {
        //     log.error('Failed to extract jwt token info with error::', error);
        //     responseData.msg = 'Unauthorized request';
        //     return responseHelper.unAuthorize(res, responseData);
        // } else {
        //     let id = user?.sub;
        //     let userData = await userDbHandler.getById(id, { password: 0 });
        //     let time = new Date().getTime();
        //     if (!userData) {
        //         log.error('Failed to get user::', userData);
        //         responseData.msg = 'Unauthorized request';
        //         return responseHelper.unAuthorize(res, responseData);
        //     } else if (!userData.status) {
        //         log.error('User account disabled::', userData);
        //         responseData.msg = 'Your account is disabled, please contact the admin!';
        //         responseData.data = 'account_deactive';
        //         return responseHelper.unAuthorize(res, responseData);
        //     } else if (userData.force_relogin_time && userData.force_relogin_time > user.time) {
        //         log.error('Session expired::', userData);

        //         responseData.msg = userData.force_relogin_type === 'permission_change' ?
        //             'Your permission has been changed by admin, please login again!' :
        //             'Your session has expired, please login again!';
        //         responseData.data = userData.force_relogin_type;
        //         return responseHelper.unAuthorize(res, responseData);
        //     }
        // }

        log.info('Token extracted successfully with data:', user);
        req.user = user; // Add the extracted JWT token data to the request object
        next();
    })(req, res, next);
};
