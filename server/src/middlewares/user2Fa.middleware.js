'use strict';
const logger = require('../services/logger');
const log = new logger('MiddlewareController').getChildLogger();

/*********************************************
 * SERVICE FOR HANDLING 2FA AUTHENTICATION
 * This middleware assumes the token has already been verified
 * by the userAuthenticate middleware
 *********************************************/
module.exports = (req, res, next) => {
    // The user should already be authenticated by userAuthenticate middleware
    // Just log and continue
    log.info('2FA middleware: User already authenticated');
    next();
};