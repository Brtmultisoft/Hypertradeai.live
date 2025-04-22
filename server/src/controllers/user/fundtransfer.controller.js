'use strict';
const logger = require('../../services/logger');
const log = new logger('FundTransferController').getChildLogger();
const { fundTransferDbHandler, userDbHandler } = require('../../services/db');
const { getWalletField } = require('../../services/commonFun');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            // Get user by ID to get the username
            const userInfo = await userDbHandler.getById(user_id);
            const username = userInfo?.username;

            // Get transfers where user is either sender or receiver
            let getList = await fundTransferDbHandler.getAll(reqObj, username || user_id);
            console.log('getList', getList);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
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
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.body;

        try {
            const min = 10;
            const max = 100000000;
            const transferType = reqObj.type || 0; // 0: User to user, 1: Self transfer
            const fromWallet = reqObj.from_wallet || 'topup'; // Default: topup wallet
            const toWallet = reqObj.to_wallet || 'topup'; // Default: topup wallet
            const userFrom = await userDbHandler.getById(user_id);

            // Validate amount
            if (reqObj.amount < min) {
                responseData.msg = `Minimum fund transfer ${min}!`;
                return responseHelper.error(res, responseData);
            }

            if (reqObj.amount > max) {
                responseData.msg = `Maximum fund transfer ${max}!`;
                return responseHelper.error(res, responseData);
            }

            // Check if user has sufficient balance in the source wallet
            const sourceWalletField = fromWallet === 'main' ? 'wallet' : 'wallet_topup';

            if (userFrom[sourceWalletField] < reqObj.amount) {
                responseData.msg = `Insufficient balance in ${fromWallet} wallet!`;
                return responseHelper.error(res, responseData);
            }



            // Handle different transfer types
            if (transferType === 1) {
                // Self transfer
                log.info(`Initiating self transfer for user ${user_id} for amount ${reqObj.amount} from ${fromWallet} to ${toWallet}`);

                // No fee for self transfers
                const fee = 0;
                const net_amount = reqObj.amount;

                // Determine source and destination wallet fields
                const sourceField = fromWallet === 'main' ? 'wallet' : 'wallet_topup';
                const destField = toWallet === 'main' ? 'wallet' : 'wallet_topup';

                // Update user's wallets
                const updateObj = { $inc: {} };
                updateObj.$inc[sourceField] = -reqObj.amount;
                updateObj.$inc[destField] = net_amount;

                await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    updateObj
                );

                // Create transfer record
                const data = {
                    user_id: userFrom.username, // Self transfer
                    user_id_from: user_id,
                    amount: reqObj.amount,
                    fee: fee,
                    remark: reqObj.remark,
                    type: 1, // Self transfer type
                    from_wallet: fromWallet,
                    to_wallet: toWallet
                };

                await fundTransferDbHandler.create(data);
                responseData.msg = `Funds transferred to your ${toWallet} wallet successfully!`;
                return responseHelper.success(res, responseData);

            } else {
                // User to user transfer
                const fee = 0; // No transfer fee
                const net_amount = reqObj.amount;
                const userTo = await userDbHandler.getByQuery({ username: reqObj.user_id });

                if (!userTo) {
                    responseData.msg = `Invalid User!`;
                    return responseHelper.error(res, responseData);
                }

                if (reqObj.user_id === userFrom.username) {
                    responseData.msg = `Cannot transfer to yourself. Use self transfer option instead.`;
                    return responseHelper.error(res, responseData);
                }

                log.info(`Initiating fund transfer from user ${user_id} to ${reqObj.user_id} for amount ${reqObj.amount} from ${fromWallet} wallet to ${toWallet} wallet`);

                // Determine source and destination wallet fields
                const sourceField = fromWallet === 'main' ? 'wallet' : 'wallet_topup';
                const destField = toWallet === 'main' ? 'wallet' : 'wallet_topup';

                // Update the sender's wallet
                const senderUpdate = {
                    $inc: {}
                };
                senderUpdate.$inc[sourceField] = -reqObj.amount;
                await userDbHandler.updateOneByQuery({_id:user_id}, senderUpdate);

                // Update the recipient's wallet
                const recipientUpdate = { $inc: {} };
                recipientUpdate.$inc[destField] = net_amount;
                const updateResult = await userDbHandler.updateOneByQuery(
                    { username: reqObj.user_id },
                    recipientUpdate
                );

                if (updateResult.modifiedCount === 0) {
                    log.warn(`No user found with username: ${reqObj.user_id}`);
                    responseData.msg = `User not found or update failed!`;
                    return responseHelper.error(res, responseData);
                }

                const data = {
                    user_id: reqObj.user_id,
                    user_id_from: user_id,
                    amount: reqObj.amount,
                    fee: fee,
                    remark: reqObj.remark,
                    type: 0, // User to user transfer type
                    from_wallet: fromWallet,
                    to_wallet: toWallet
                };

                await fundTransferDbHandler.create(data);
                responseData.msg = `Funds transferred from your ${fromWallet} wallet to recipient's ${toWallet} wallet successfully!`;
                return responseHelper.success(res, responseData);
            }
        } catch (error) {
            log.error('Failed to update data with error:', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    getCount: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            // Get user by ID to get the username
            const userInfo = await userDbHandler.getById(user_id);
            const username = userInfo?.username;

            // Get count of transfers where user is either sender or receiver
            let getData = await fundTransferDbHandler.getCount(reqObj, username || user_id);
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
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            // Get user by ID to get the username
            const userInfo = await userDbHandler.getById(user_id);
            const username = userInfo?.username;

            // Get sum of transfers where user is either sender or receiver
            let getData = await fundTransferDbHandler.getSum(reqObj, username || user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    }
};