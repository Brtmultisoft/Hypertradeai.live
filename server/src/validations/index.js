/**
 * JOI Validation
 */
module.exports = {
	/* Admin Validation */
	adminAuthValidation: require('./admin/auth.validation'),
	adminInfoValidation: require('./admin/info.validation'),
	adminValidation: require('./admin/admin.validation'),

	/* User Validation */
	userAuthValidation: require('./user/auth.validation'),
	userInfoValidation: require('./user/info.validation'),

	/* Common Validation */
	userValidation: require('./user.validation'),
	twoFaValidation: require('./2fa.validation'),
	supportValidation: require('./support.validation'),
	depositValidation: require('./deposit.validation'),
	fundDeductValidation: require('./funddeduct.validation'),
	fundTransferValidation: require('./fundtransfer.validation'),
	incomeValidation: require('./income.validation'),
	investmentValidation: require('./investment.validation'),
	investmentPlanValidation: require('./investmentplan.validation'),
	messageValidation: require('./message.validation'),
	withdrawalValidation: require('./withdrawal.validation'),
	settingValidation: require('./setting.validation'),
};
