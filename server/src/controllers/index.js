/***************************
 * ROUTE CONTROLLER METHODS
 ***************************/
/**
 * All User Controller
 */
const userUploadController = require('./user/upload.controller');
const userAuthController = require('./user/auth.controller');
const userInfoController = require('./user/info.controller');
const userController = require('./user/user.controller');
const user2FAController = require('./user/2fa.controller');
const userSupportController = require('./user/support.controller');
const userDepositController = require('./user/deposit.controller');
const userFundTransferController = require('./user/fundtransfer.controller');
const userIncomeController = require('./user/income.controller');
const userInvestmentController = require('./user/investment.controller');
const userInvestmentPlanController = require('./user/investmentplan.controller');
const userMessageController = require('./user/message.controller');
const userSettingController = require('./user/setting.controller');
const userWithdrawalController = require('./user/withdrawal.controller');
const userRankController = require('./user/rank.controller');
const userTeamRewardController = require('./user/teamreward.controller');


/**
 * CRON Controller
 */

const cronController = require('./user/cron.controller')

/**
 * WEBHOOK Controller
 */

const moralisController = require('./webhook/webhook.controller')

/**
 * PUBLIC Route Controller
 */

const publicController = require('./public/public.controller')

/**
 * All Admin Controller
 */
const adminAuthController = require('./admin/auth.controller');
const adminInfoController = require('./admin/info.controller');
const adminController = require('./admin/admin.controller');
const adminUserController = require('./admin/user.controller');
const adminDepositController = require('./admin/deposit.controller');
const adminFundDeductController = require('./admin/funddeduct.controller');
const adminFundTransferController = require('./admin/fundtransfer.controller');
const adminIncomeController = require('./admin/income.controller');
const adminInvestmentController = require('./admin/investment.controller');
const adminInvestmentPlanController = require('./admin/investmentplan.controller');
const adminMessageController = require('./admin/message.controller');
const adminSettingController = require('./admin/setting.controller');
const adminWithdrawalController = require('./admin/withdrawal.controller');

const adminSetupController = require('./admin/setup.controller')

module.exports = {
    /**
     * All Admin Contollers
     */
    adminSetupController,
    adminAuthController,
    adminInfoController,
    adminController,
    adminUserController,
    adminDepositController,
    adminFundDeductController,
    adminFundTransferController,
    adminIncomeController,
    adminInvestmentController,
    adminInvestmentPlanController,
    adminMessageController,
    adminSettingController,
    adminWithdrawalController,

    /**
     * CRON
     */

    cronController,

    /**
     * Webhook Controller
     */

    moralisController,

    /**
     * Public Controller
     */

    publicController,

    /**
     * All User Controllers
     */
    userUploadController,
    userAuthController,
    userInfoController,
    userController,
    user2FAController,
    userSupportController,
    userDepositController,
    userFundTransferController,
    userIncomeController,
    userInvestmentController,
    userInvestmentPlanController,
    userMessageController,
    userSettingController,
    userWithdrawalController,
    userRankController,
    userTeamRewardController,
};