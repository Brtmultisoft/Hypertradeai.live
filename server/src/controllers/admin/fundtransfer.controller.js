'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminFundTransferController').getChildLogger();
const { fundTransferDbHandler, userDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const { default: mongoose } = require('mongoose');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Received request for getAll:', reqObj);
        let responseData = {};
        try {
            // Convert type parameter if it's a string
            if (reqObj.type) {
                if (reqObj.type === 'admin') {
                    reqObj.type = 2; // Admin transfers
                } else if (reqObj.type === 'wallet_to_wallet') {
                    reqObj.type = 1; // Self transfers
                } else if (reqObj.type === 'user_to_user') {
                    reqObj.type = 0; // User to user transfers
                }
                // If it's already a number string, it will be handled in the service
            }

            log.info('Processed request parameters:', reqObj);

            // Get fund transfers with user details
            let getList = await fundTransferDbHandler.getAll(reqObj);

            log.info(`Found ${getList.docs?.length || 0} fund transfers`);

            // Format the response for the datatable
            responseData.msg = 'Data fetched successfully!';
            responseData.result = {
                list: getList.docs || [],
                count: getList.totalDocs || 0,
                totalPages: getList.totalPages || 0,
                page: getList.page || 1
            };

            // Log the first few results for debugging
            if (getList.docs && getList.docs.length > 0) {
                log.info('Sample result:', getList.docs[0]);
            }

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch data with error:', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let getData = await fundTransferDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    add: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        let ObjectId = mongoose.Types.ObjectId
        try {
            // Validate user ID
            if (!reqObj.user_id) {
                responseData.msg = "User ID is required";
                return responseHelper.error(res, responseData);
            }

            // Find user by ID or username
            let user;
            if (mongoose.isValidObjectId(reqObj.user_id)) {
                user = await userDbHandler.getOneByQuery({ _id: ObjectId(reqObj.user_id) });
            } else {
                // If not a valid ObjectId, try to find by username
                user = await userDbHandler.getOneByQuery({ username: reqObj.user_id });
            }

            if (!user) {
                responseData.msg = "User not found. Please check the User ID or username";
                return responseHelper.error(res, responseData);
            }

            // Validate amount
            if (!reqObj.amount || reqObj.amount <= 0) {
                responseData.msg = "Amount must be greater than zero";
                return responseHelper.error(res, responseData);
            }

            // Determine wallet type
            const walletType = reqObj.type || 0; // 0: Main wallet, 1: Topup wallet
            const walletField = walletType === 0 ? 'wallet' : 'wallet_topup';
            const walletName = walletType === 0 ? 'Main Wallet' : 'Topup Wallet';

            // Prepare fund transfer data
            let data = {
                user_id: user._id.toString(),
                user_id_from: null, // Admin transfer
                amount: reqObj.amount,
                fee: 0, // No fee for admin transfers
                remark: reqObj.remark || `Admin fund transfer to ${walletName}`,
                type: 2, // Type 2 for admin transfers (0: user-to-user, 1: self transfer, 2: admin transfer)
                from_wallet: 'admin', // Admin is the source
                to_wallet: walletType === 0 ? 'main' : 'topup' // Destination wallet
            };

            // Log the data for debugging
            console.log('Fund transfer data......:', data);

            // Update user's wallet balance
            const updateObj = {};
            updateObj[walletField] = user[walletField] + reqObj.amount;

            // Update user's wallet balance directly
            user[walletField] += reqObj.amount;

            // Now we can use save() since we've fixed the refer_id validation in the model
            await user.save();

            // Create fund transfer record
            await fundTransferDbHandler.create(data);

            responseData.msg = `Successfully transferred $${reqObj.amount} to user ${user.username}'s ${walletName}`;
            responseData.data = {
                user: {
                    _id: user._id,
                    username: user.username,
                    wallet: user.wallet,
                    wallet_topup: user.wallet_topup
                },
                transfer: data
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to process fund transfer with error:', error);
            responseData.msg = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let reqObj = req.query;
        try {
            let getData = await fundTransferDbHandler.getCount(reqObj);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getSum: async (req, res) => {
        let responseData = {};
        let reqObj = req.query;
        try {
            let getData = await fundTransferDbHandler.getSum(reqObj);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
};