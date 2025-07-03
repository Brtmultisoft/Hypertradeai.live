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
    console.log('adminInvestmentPlanController.add:', adminInvestmentPlanController.add);
    Router.post('/add-investment-plan', adminInvestmentPlanController.add);

    // Update an existing investment plan by ID
    console.log('adminInvestmentPlanController.update:', adminInvestmentPlanController.update);
    Router.put('/update-investment-plan/:id', adminInvestmentPlanController.update);

    // Delete an investment plan by ID
    console.log('adminInvestmentPlanController.delete:', adminInvestmentPlanController.delete);
    Router.delete('/delete-investment-plan/:id', adminInvestmentPlanController.delete);

    console.log('adminInvestmentController.getAll:', adminInvestmentController.getAll);
    Router.get("/get-all-investments", adminInvestmentController.getAll);

    // Direct route to get investments without filters
    Router.get("/get-investments-direct", async (req, res) => {
        try {
            const { investmentModel } = require('../../models');
            
            // Get query parameters with defaults
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50; // Default to 50
            
            // Using aggregation pipeline to join with users collection
            const pipeline = [
                {
                    $match: {} // Empty match to get all documents
                },
                {
                    $sort: { created_at: -1 } // Sort by creation date
                },
                {
                    $skip: (page - 1) * limit // Pagination offset
                },
                {
                    $limit: limit // Use the limit parameter (default 50)
                },
                {
                    $lookup: {
                        from: "users", // Verify this matches your actual users collection name
                        localField: "user_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$userDetails",
                        preserveNullAndEmptyArrays: true // Keep investments even if user not found
                    }
                },
                {
                    $addFields: {
                        username: { $ifNull: ["$userDetails.username", ""] },
                        email: { $ifNull: ["$userDetails.email", ""] },
                        user_name: { $ifNull: ["$userDetails.name", ""] }
                    }
                },
                {
                    $project: {
                        userDetails: 0 // Remove the joined document to keep response clean
                    }
                }
            ];
    
            // Execute parallel operations
            const [investments, count] = await Promise.all([
                investmentModel.aggregate(pipeline).exec(),
                investmentModel.countDocuments({}).exec()
            ]);
    
            return res.status(200).json({
                status: true,
                message: 'Investments fetched successfully with user details',
                result: {
                    list: investments,
                    page: page,
                    limit: limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching investments with user details:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to fetch investments with user details',
                error: error.message
            });
        }
    });
    console.log('adminInvestmentController.getAllStacked:', adminInvestmentController.getAllStacked);
    Router.get("/get-all-stacked", adminInvestmentController.getAllStacked);
    console.log('adminInvestmentController.getOne:', adminInvestmentController.getOne);
    Router.get("/get-investment/:id", adminInvestmentController.getOne);
    console.log('adminInvestmentController.getSum:', adminInvestmentController.getSum);
    Router.get("/get-investment-sum", adminInvestmentController.getSum);

    console.log('adminIncomeController.getAll:', adminIncomeController.getAll);
    Router.get("/get-all-incomes", adminIncomeController.getAll);

    console.log('adminIncomeController.getOne:', adminIncomeController.getOne);
    Router.get("/get-income/:id", adminIncomeController.getOne);

    console.log('adminIncomeController.getSum:', adminIncomeController.getSum);
    Router.get("/get-income-sum", adminIncomeController.getSum);

    console.log('adminFundDeductController.getAll:', adminFundDeductController.getAll);
    Router.get("/get-all-fund-deducts", adminFundDeductController.getAll);

    console.log('adminFundDeductController.getOne:', adminFundDeductController.getOne);
    Router.get("/get-fund-deduct/:id", adminFundDeductController.getOne);

    console.log('adminFundDeductController.getSum:', adminFundDeductController.getSum);
    Router.get("/get-fund-deduct-sum", adminFundDeductController.getSum);

    console.log('adminFundDeductController.add:', adminFundDeductController.add);
    Router.post("/add-fund-deduct", validationMiddleware(fundDeductValidation.add, 'body'), adminFundDeductController.add);

    console.log('adminFundTransferController.getAll:', adminFundTransferController.getAll);
    Router.get("/get-all-fund-transfers", adminFundTransferController.getAll);

    console.log('adminFundTransferController.getOne:', adminFundTransferController.getOne);
    Router.get("/get-fund-transfer/:id", adminFundTransferController.getOne);

    console.log('adminFundTransferController.getSum:', adminFundTransferController.getSum);
    Router.get("/get-fund-transfer-sum", adminFundTransferController.getSum);

    console.log('validationMiddleware:', validationMiddleware);
    console.log('fundTransferValidation.add:', fundTransferValidation.add);
    console.log('adminFundTransferController.add:', adminFundTransferController.add);
    Router.post("/add-fund-transfer", validationMiddleware(fundTransferValidation.add, 'body'), adminFundTransferController.add);

    console.log('adminDepositController.getAll:', adminDepositController.getAll);
    Router.get("/get-all-deposits", adminDepositController.getAll);

    console.log('adminDepositController.getOne:', adminDepositController.getOne);
    Router.get("/get-deposit/:id", adminDepositController.getOne);

    console.log('adminDepositController.getSum:', adminDepositController.getSum);
    Router.get("/get-deposit-sum", adminDepositController.getSum);

    console.log('adminDepositController.update:', adminDepositController.update);
    Router.put("/update-deposit", validationMiddleware(depositValidation.update, 'body'), adminDepositController.update);

    // Original withdrawal routes
    console.log('adminWithdrawalController.getAllWithdrawals:', adminWithdrawalController.getAllWithdrawals);
    Router.get("/get-all-withdrawals", adminWithdrawalController.getAllWithdrawals);
    console.log('adminWithdrawalController.getOne:', adminWithdrawalController.getOne);
    Router.get("/get-withdrawal/:id", adminWithdrawalController.getOne);
    console.log('adminWithdrawalController.getSum:', adminWithdrawalController.getSum);
    Router.get("/get-withdrawal-sum", adminWithdrawalController.getSum);
    console.log('adminWithdrawalController.update:', adminWithdrawalController.update);
    Router.put("/update-withdrawal", validationMiddleware(withdrawalValidation.update, 'body'), adminWithdrawalController.update);

    // New withdrawal management routes
    Router.get("/withdrawals", adminWithdrawalController.getAllWithdrawals);
    Router.get("/withdrawals/:id", adminWithdrawalController.getOne);
    console.log('adminWithdrawalController.approveWithdrawal:', adminWithdrawalController.approveWithdrawal);
    Router.post("/withdrawals/approve", adminWithdrawalController.approveWithdrawal);

    console.log('adminWithdrawalController.rejectWithdrawal:', adminWithdrawalController.rejectWithdrawal);
    Router.post("/withdrawals/reject", adminWithdrawalController.rejectWithdrawal);

    // Direct endpoints for approval/rejection
    console.log('adminWithdrawalController.approveWithdrawal (direct):', adminWithdrawalController.approveWithdrawal);
    Router.post("/approve-withdrawal/:id", (req, res) => {
        req.body.withdrawalId = req.params.id;
        return adminWithdrawalController.approveWithdrawal(req, res);
    });

    console.log('adminWithdrawalController.rejectWithdrawal (direct):', adminWithdrawalController.rejectWithdrawal);
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

    // Trade Activation routes
    const tradeActivationRoutes = require('./trade.activation.routes');
    Router.use('/', tradeActivationRoutes);

    // Cron Execution routes
    const cronRoutes = require('./cron.routes');
    Router.use('/cron', cronRoutes);

    console.log('adminAuthenticateMiddleware:', adminAuthenticateMiddleware);
    console.log('adminUserController.adminCreateUser:', adminUserController.adminCreateUser);
    Router.post("/create-user", adminUserController.adminCreateUser);
    Router.get("/get-otp-settings", adminSettingController.getOtpSettings);
    Router.put("/update-otp-settings", adminSettingController.updateOtpSettings);

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/

    return Router;
};