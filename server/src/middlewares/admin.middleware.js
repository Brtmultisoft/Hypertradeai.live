'use strict';
const responseHelper = require('../utils/customResponse');
const logger = require('../services/logger');
const log = new logger('AdminMiddlewareController').getChildLogger();

/***************************************************************
 * MIDDLEWARE FOR HANDLING ADMIN ROUTES
 **************************************************************/
module.exports = async (req, res, next) => {
    try {
        // Check if the user is authenticated as an admin
        if (!req.admin) {
            log.error('Admin authentication required');
            return responseHelper.unAuthorize(res, {
                msg: 'Admin authentication required'
            });
        }
        
        // If admin is authenticated, proceed to the next middleware
        next();
    } catch (error) {
        log.error('Error in admin middleware:', error);
        return responseHelper.error(res, {
            msg: 'Internal server error in admin middleware'
        });
    }
};
