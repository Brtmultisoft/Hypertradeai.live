const Router = require("express").Router();
/**
 * Controllers
 */

const {
    /**
     * CRONS
     */
    cronController,

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
    userController
} = require("../../controllers");

// Import transaction controller
const transactionController = require("../../controllers/admin/transaction.controller");

/**
 * Middlewares
 */

const {
    adminAuthenticateMiddleware,
    validationMiddleware,
    cronMiddleware
} = require("../../middlewares");

/**
 * Validations
 */

const {
    adminAuthValidation,
    adminInfoValidation,
    adminValidation,
    userValidation,
    depositValidation,
    fundDeductValidation,
    fundTransferValidation,
    incomeValidation,
    investmentValidation,
    investmentPlanValidation,
    messageValidation,
    withdrawalValidation,
    settingValidation
} = require("../../validations");

const multerService = require('../../services/multer');

module.exports = () => {
    /**
     * Login Route
     */
    Router.post(
        "/login",
        validationMiddleware(adminAuthValidation.login, "body"),
        adminAuthController.login
    );


    /**********************
     * AUTHORIZED ROUTES
     **********************/
    /**
     * Middlerware for Handling Request Authorization
     */
    Router.use("/", adminAuthenticateMiddleware);

    // GET REPORTS IN CSV FILE
    Router.get('/get-reports-in-csv/:type', adminController.getReportsInCSV);

    // Routes by KARTIK
    Router.get("/setup-db", adminSetupController.setup)
    Router.get("/reset-setup-db", adminController.reset_db)
    Router.post("/user-login-request", validationMiddleware(adminValidation.user_login_request, 'body'), adminController.user_login_request)
    Router.get("/get-all-users-data", adminController.get_all_users_data)
    Router.post("/reset-device-id", adminController.resetDeviceToken)

    Router.put("/update-user-profile", [multerService.uploadFile('avatar').single('user_avatar'), validationMiddleware(adminInfoValidation.updateUserProfile, "body")], adminInfoController.updateUserProfile);
    Router.put("/update-general-settings", validationMiddleware(settingValidation.addUpdate, "body"), adminSettingController.add_update);

    Router.post("/update-content", [multerService.uploadFile('image').single("banner"), validationMiddleware(adminInfoValidation.updateContent, "body")], adminInfoController.updateContent);

    Router.get("/get-profile", adminInfoController.profile);
    Router.put("/update-profile", [multerService.uploadFile('avatar').single('admin_avatar'), validationMiddleware(adminInfoValidation.updateProfile, "body")], adminInfoController.updateProfile);
    Router.put('/change-password', validationMiddleware(adminInfoValidation.changePassword, 'body'), adminInfoController.changePassword);

    Router.get("/get-all-admins", adminController.getAll);
    Router.get("/get-admin/:id", adminController.getOne);
    Router.post("/add-admin", validationMiddleware(adminValidation.add, 'body'), adminController.add);
    Router.put("/update-admin", validationMiddleware(adminValidation.update, 'body'), adminController.update);

    Router.get("/get-all-users", adminUserController.getAll);
    Router.get("/get-daily-task-data", adminUserController.get_daily_task_data);
    Router.get("/get-daily-task-data2", adminUserController.get_daily_task_data2);
    Router.get("/get-user/:id", adminUserController.getOne);
    Router.get("/get-user-by-email/:email", adminUserController.getUserByEmail);
    Router.get("/get-user-count", adminUserController.getCount);
    Router.get("/get-user-downline", adminUserController.getDownline);
    Router.put("/update-user", validationMiddleware(userValidation.update, 'body'), adminUserController.update);
    Router.get("/update-last-investment-amounts", adminUserController.updateLastInvestmentAmounts);
    Router.get("/search-users", adminUserController.searchUsers);

    // User block/unblock endpoints
    Router.post("/block-user", validationMiddleware(userValidation.blockUser, 'body'), adminUserController.blockUser);
    Router.post("/unblock-user", validationMiddleware(userValidation.unblockUser, 'body'), adminUserController.unblockUser);


    // USER SOCIAL VWERIFICATION
    Router.post('/approveSocial/', adminController.approveSocial)
    Router.post('/approveAllSocial/', adminController.approveAllSocial)
    Router.post('/rejectSocial/', adminController.rejectSocial)
    // TODO: check from here
    Router.get("/get-all-messages-inbox", adminMessageController.getAllInbox);
    Router.get("/get-all-messages-sent", adminMessageController.getAllSent);
    Router.get("/get-message/:id", adminMessageController.getOne);
    Router.get("/get-message-count", adminMessageController.getCount);
    Router.post("/add-message", validationMiddleware(messageValidation.add, 'body'), adminMessageController.add);
    Router.put("/update-message", validationMiddleware(messageValidation.update, 'body'), adminMessageController.update);

    Router.get("/get-all-settings", adminSettingController.getAll);
    Router.get("/get-setting/:id", adminSettingController.getOne);
    Router.get("/get-setting-with-name/:name", adminSettingController.getOneByQuery);
    Router.post("/add-setting", validationMiddleware(settingValidation.add, 'body'), adminSettingController.add);
    Router.put("/update-setting", validationMiddleware(settingValidation.update, 'body'), adminSettingController.update);
    Router.delete("/delete-setting/:id", adminSettingController.delete);

    // Get all investment plans
    Router.get('/get-all-investment-plans', adminInvestmentPlanController.getAll);

    // Get a single investment plan by ID
    Router.get('/get-investment-plan/:id', adminInvestmentPlanController.getOne);

    // Add a new investment plan
    Router.post('/add-investment-plan', adminInvestmentPlanController.add);

    // Update an existing investment plan by ID
    Router.put('/update-investment-plan/:id', adminInvestmentPlanController.update);

    // Delete an investment plan by ID
    Router.delete('/delete-investment-plan/:id', adminInvestmentPlanController.delete);

    Router.delete('/delete-investment-plan/:id', adminInvestmentPlanController.delete);
    Router.get("/get-all-investments", adminInvestmentController.getAll);

    // Direct route to get investments without filters
    Router.get("/get-investments-direct", async (req, res) => {
        try {
            const { investmentModel } = require('../../models');
            const investments = await investmentModel.find({}).limit(10).sort({ created_at: -1 }).exec();
            const count = await investmentModel.countDocuments({}).exec();

            return res.status(200).json({
                status: true,
                message: 'Investments fetched successfully',
                result: {
                    list: investments,
                    page: 1,
                    limit: 10,
                    total: count,
                    totalPages: Math.ceil(count / 10)
                }
            });
        } catch (error) {
            console.error('Error fetching investments directly:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch investments',
                error: error.message
            });
        }
    });
    Router.get("/get-all-stacked", adminInvestmentController.getAllStacked);
    Router.get("/get-investment/:id", adminInvestmentController.getOne);
    Router.get("/get-investment-sum", adminInvestmentController.getSum);

    Router.get("/get-all-incomes", adminIncomeController.getAll);

    // Direct route to get incomes without filters
    Router.get("/get-incomes-direct", async (req, res) => {
        try {
            const { incomeModel } = require('../../models');
            const incomes = await incomeModel.find({}).limit(10).sort({ created_at: -1 }).exec();
            const count = await incomeModel.countDocuments({}).exec();

            return res.status(200).json({
                status: true,
                message: 'Incomes fetched successfully',
                result: {
                    list: incomes,
                    page: 1,
                    limit: 10,
                    total: count,
                    totalPages: Math.ceil(count / 10)
                }
            });
        } catch (error) {
            console.error('Error fetching incomes directly:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch incomes',
                error: error.message
            });
        }
    });
    Router.get("/get-income/:id", adminIncomeController.getOne);
    Router.get("/get-income-sum", adminIncomeController.getSum);

    Router.get("/get-all-fund-deducts", adminFundDeductController.getAll);
    Router.get("/get-fund-deduct/:id", adminFundDeductController.getOne);
    Router.get("/get-fund-deduct-sum", adminFundDeductController.getSum);
    Router.post("/add-fund-deduct", validationMiddleware(fundDeductValidation.add, 'body'), adminFundDeductController.add);

    Router.get("/get-all-fund-transfers", adminFundTransferController.getAll);
    Router.get("/test-fund-transfers", async (req, res) => {
        try {
            const { fundTransferModel } = require('../../models');
            const transfers = await fundTransferModel.find().limit(10)
            return res.json({
                status: true,
                message: 'Test fund transfers',
                count: transfers.length,
                data: transfers
            });
        } catch (error) {
            console.error('Error in test endpoint:', error);
            return res.status(500).json({
                status: false,
                message: 'Error fetching test data',
                error: error.message
            });
        }
    });
    Router.get("/get-fund-transfer/:id", adminFundTransferController.getOne);
    Router.get("/get-fund-transfer-sum", adminFundTransferController.getSum);
    Router.post("/add-fund-transfer", validationMiddleware(fundTransferValidation.add, 'body'), adminFundTransferController.add);

    Router.get("/get-all-deposits", adminDepositController.getAll);
    Router.get("/get-deposit/:id", adminDepositController.getOne);
    Router.get("/get-deposit-sum", adminDepositController.getSum);
    Router.put("/update-deposit", validationMiddleware(depositValidation.update, 'body'), adminDepositController.update);

    // Original withdrawal routes
    Router.get("/get-all-withdrawals", adminWithdrawalController.getAllWithdrawals); // Use getAllWithdrawals instead of getAll
    Router.get("/get-withdrawal/:id", adminWithdrawalController.getOne);
    Router.get("/get-withdrawal-sum", adminWithdrawalController.getSum);
    Router.put("/update-withdrawal", validationMiddleware(withdrawalValidation.update, 'body'), adminWithdrawalController.update);

    // New withdrawal management routes
    Router.get("/withdrawals", adminWithdrawalController.getAllWithdrawals);
    Router.get("/withdrawals/:id", adminWithdrawalController.getOne);
    Router.post("/withdrawals/approve", adminWithdrawalController.approveWithdrawal);
    Router.post("/withdrawals/reject", adminWithdrawalController.rejectWithdrawal);

    // Direct endpoints for approval/rejection
    Router.post("/approve-withdrawal/:id", (req, res) => {
        req.body.withdrawalId = req.params.id;
        return adminWithdrawalController.approveWithdrawal(req, res);
    });
    Router.post("/reject-withdrawal/:id", (req, res) => {
        req.body.withdrawalId = req.params.id;
        return adminWithdrawalController.rejectWithdrawal(req, res);
    });
    // Process withdrawal using own_pay.js
    Router.post("/withdrawals/process", async (req, res) => {
        try {
            // Log the incoming request for debugging
            console.log('Process withdrawal request received:', req.body);

            // Modify the request body to match what processWithdrawal expects
            const { withdrawalId, amount, walletAddress } = req.body;

            console.log('Extracted parameters:', { withdrawalId, amount, walletAddress });

            if (!withdrawalId || !amount || !walletAddress) {
                console.error('Missing required parameters:', { withdrawalId, amount, walletAddress });
                return res.status(400).json({
                    status: false,
                    message: 'Missing required parameters'
                });
            }

            // Create a new request object with the expected structure
            const modifiedReq = {
                body: {
                    withdrawalId: withdrawalId,
                    amount: amount,
                    walletAddress: walletAddress
                }
            };

            console.log('Modified request:', modifiedReq);

            // Import the processWithdrawal function from own_pay.js
            const { processWithdrawal } = require('../../own_pay/own_pay');

            // Call processWithdrawal with the modified request and response objects
            console.log('Calling processWithdrawal function');
            return processWithdrawal(modifiedReq, res);
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            return res.status(500).json({
                status: false,
                message: error.message || 'Failed to process withdrawal'
            });
        }
    });

    // Transaction status endpoints - ensure they're authenticated
    Router.get("/check-transaction-status/:txHash", transactionController.checkTransactionStatus);
    Router.get("/transaction-details/:txHash",  transactionController.getTransactionDetails);

    // Announcement routes
    const announcementRoutes = require('./announcement.route');
    Router.use('/', announcementRoutes);

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/

    return Router;
};