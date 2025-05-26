'use strict';

/***********************************************
 * SERVICE FOR HANDLING MONGODB QUERIES
 ***********************************************/
module.exports = {
	adminDbHandler: require('./admin.service'),
	userDbHandler: require('./user.service'),
	userreDbHandler: require('./userre.service'),
	verificationDbHandler: require('./verification.service'),
	counterDbHandler: require('./counter.service'),
	depositDbHandler: require('./deposit.service'),
	fundDeductDbHandler: require('./funddeduct.service'),
	fundTransferDbHandler: require('./fundtransfer.service'),
	incomeDbHandler: require('./income.service'),
	investmentDbHandler: require('./investment.service'),
	investmentPlanDbHandler: require('./investmentplan.service'),
	messageDbHandler: require('./message.service'),
	teamRewardDbHandler: require('./teamreward.service'),
	rankDbHandler: require('./rank.service'),
	withdrawalDbHandler: require('./withdrawal.service'),
	settingDbHandler: require('./setting.service'),
	userLoginRequestDbHandler: require('./user.login.request.service'),
	socialLinksDbHandler: require('./social.links.service'),
	announcementDbHandler: require('./announcement.service'),
	tradeActivationDbHandler: require('./trade.activation.service'),
	cronExecutionDbHandler: require('./cron.execution.service')
};