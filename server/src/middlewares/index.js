'use strict';

/***********************************************
 * SERVICE FOR HANDLING MONGODB QUERIES
 ***********************************************/
module.exports = {
	adminAuthenticateMiddleware: require('./adminAuthenticate.middleware'),
	adminMiddleware: require('./admin.middleware'),
	userAuthenticateMiddleware: require('./userAuthenticate.middleware'),
	verificationMiddleware: require('./verification.middleware'),
	validationMiddleware: require('./validation.middleware'),
	user2FaMiddleware: require('./user2Fa.middleware'),
	cronMiddleware: require('./cron.middleware'),
	webhookMiddleware: require('./webhook.middleware')
};
