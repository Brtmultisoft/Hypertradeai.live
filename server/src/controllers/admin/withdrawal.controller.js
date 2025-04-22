'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminWithdrawalController').getChildLogger();
const { withdrawalDbHandler, userDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
// const { processWithdrawal } = require('../../own_pay/own_pay'); // Now handled in the route

module.exports = {
    // Get all withdrawals with user details and stats
    getAllWithdrawals: async (req, res) => {
        let responseData = {};
        try {
            const { status } = req.query;

            // Build query
            const query = {};
            if (status !== undefined) {
                query.status = parseInt(status);
            }

            // Get withdrawals
            const withdrawalsResult = await withdrawalDbHandler.getAll(query);
            console.log("Withdrawals result:", withdrawalsResult);

            // Ensure we have an array of withdrawals
            let withdrawals = [];

            // Check if the result is already an array
            if (Array.isArray(withdrawalsResult)) {
                withdrawals = withdrawalsResult;
            }
            // Check if the result has a 'result' property that is an array
            else if (withdrawalsResult && Array.isArray(withdrawalsResult.result)) {
                withdrawals = withdrawalsResult.result;
            }
            // Check if the result has a 'data' property that is an array
            else if (withdrawalsResult && Array.isArray(withdrawalsResult.data)) {
                withdrawals = withdrawalsResult.data;
            }
            // Check if the result has a 'list' property that is an array
            else if (withdrawalsResult && Array.isArray(withdrawalsResult.list)) {
                withdrawals = withdrawalsResult.list;
            }

            console.log("Processed withdrawals array:", withdrawals);

            // Get user details for each withdrawal
            const withdrawalsWithUserDetails = await Promise.all(
                withdrawals.map(async (withdrawal) => {
                    try {
                        const user = await userDbHandler.getById(withdrawal.user_id);
                        return {
                            ...withdrawal,
                            user_name: user ? user.name : null,
                            user_email: user ? user.email : null
                        };
                    } catch (error) {
                        log.error(`Error fetching user details for withdrawal ${withdrawal._id}:`, error);
                        return {
                            ...withdrawal,
                            user_name: null,
                            user_email: null
                        };
                    }
                })
            );

            // Get stats
            let stats = {
                pending: 0,
                approved: 0,
                rejected: 0,
                total: withdrawals.length
            };

            // Calculate stats from the withdrawals array
            if (Array.isArray(withdrawals)) {
                stats.pending = withdrawals.filter(w => w.status === 0).length;
                stats.approved = withdrawals.filter(w => w.status === 1).length;
                stats.rejected = withdrawals.filter(w => w.status === 2).length;
                stats.total = withdrawals.length;
            }

            // Try to use count method if available
            try {
                if (typeof withdrawalDbHandler.count === 'function') {
                    stats = {
                        pending: await withdrawalDbHandler.count({ status: 0 }),
                        approved: await withdrawalDbHandler.count({ status: 1 }),
                        rejected: await withdrawalDbHandler.count({ status: 2 }),
                        total: await withdrawalDbHandler.count({})
                    };
                }
            } catch (countError) {
                log.error('Error using count method, using array length instead:', countError);
                // We already set stats using array length, so no need to do anything here
            }

            responseData.msg = 'Withdrawals fetched successfully';
            responseData.data = withdrawalsWithUserDetails;
            responseData.stats = stats;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error in getAllWithdrawals:', error);
            responseData.msg = 'Error fetching withdrawals: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    // Approve a withdrawal
    approveWithdrawal: async (req, res) => {
        let responseData = {};
        try {
            const { withdrawalId, txid } = req.body;
           
            if (!withdrawalId) {
                responseData.msg = 'Withdrawal ID is required';
                return responseHelper.error(res, responseData);
            }

            // Get withdrawal
            const withdrawal = await withdrawalDbHandler.getOneByQuery({_id: withdrawalId});

            if (!withdrawal) {
                responseData.msg = 'Withdrawal not found';
                return responseHelper.error(res, responseData);
            }

            // Check if withdrawal is already processed
            if (withdrawal.status !== 0) {
                responseData.msg = `Withdrawal is already ${withdrawal.status === 1 ? 'approved' : 'rejected'}`;
                return responseHelper.error(res, responseData);
            }

            // Update withdrawal status
                await withdrawalDbHandler.updateOneByQuery({_id: withdrawalId}, {
                    status: 1,
                    txid: txid ,
                    processed_at: new Date()
                });

            responseData.msg = 'Withdrawal approved successfully';
            responseData.txid = txid || 'manual-process';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error in approveWithdrawal:', error);
            responseData.msg = 'Error approving withdrawal: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    // Reject a withdrawal
    rejectWithdrawal: async (req, res) => {
        let responseData = {};
        try {
            const { withdrawalId, reason } = req.body;

            if (!withdrawalId) {
                responseData.msg = 'Withdrawal ID is required';
                return responseHelper.error(res, responseData);
            }

            if (!reason) {
                responseData.msg = 'Rejection reason is required';
                return responseHelper.error(res, responseData);
            }

            // Get withdrawal
            const withdrawal = await withdrawalDbHandler.getById(withdrawalId);

            if (!withdrawal) {
                responseData.msg = 'Withdrawal not found';
                return responseHelper.error(res, responseData);
            }

            // Check if withdrawal is already processed
            if (withdrawal.status !== 0) {
                responseData.msg = `Withdrawal is already ${withdrawal.status === 1 ? 'approved' : 'rejected'}`;
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getById(withdrawal.user_id);

            if (!user) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Refund the amount to user's wallet
            await userDbHandler.updateById(withdrawal.user_id, {
                $inc: {
                    wallet: parseFloat(withdrawal.amount),
                    wallet_withdraw: -parseFloat(withdrawal.amount)
                }
            });

            // Update withdrawal status
            await withdrawalDbHandler.updateById(withdrawalId, {
                status: 2,
                processed_at: new Date(),
                extra: {
                    ...withdrawal.extra,
                    rejectionReason: reason
                }
            });

            responseData.msg = 'Withdrawal rejected successfully';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error in rejectWithdrawal:', error);
            responseData.msg = 'Error rejecting withdrawal: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await withdrawalDbHandler.getAll(reqObj);
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
        let id = req.params.id;
        try {
            let withdrawalData = await withdrawalDbHandler.getById(id);
            console.log("Withdrawal details:", withdrawalData);

            if (!withdrawalData) {
                responseData.msg = "Withdrawal not found";
                return responseHelper.error(res, responseData);
            }

            // Get user details
            try {
                const user = await userDbHandler.getById(withdrawalData.user_id);
                withdrawalData = {
                    ...withdrawalData,
                    user_name: user ? user.name : null,
                    user_email: user ? user.email : null
                };
            } catch (userError) {
                log.error(`Error fetching user details for withdrawal ${id}:`, userError);
                withdrawalData = {
                    ...withdrawalData,
                    user_name: null,
                    user_email: null
                };
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = withdrawalData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch withdrawal data with error:', error);
            responseData.msg = 'Failed to fetch withdrawal data';
            return responseHelper.error(res, responseData);
        }
    },

    update: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            let getByQuery = await withdrawalDbHandler.getOneByQuery({ _id: reqObj.id });
            if (!getByQuery) {
                responseData.msg = "Invailid data";
                return responseHelper.error(res, responseData);
            }
            let updatedObj = {
                approved_at: new Date(),
                remark: reqObj?.remark,
                status: (reqObj.status == 2) ? 2 : ((reqObj.status == 1) ? 1 : 0)
            }

            if (reqObj.status == 2) {
                await userDbHandler.updateOneByQuery({ _id: getByQuery.user_id }, { $inc: { "extra.withdrawals": getByQuery.amount } });
            }

            let updatedData = await withdrawalDbHandler.updateById(reqObj.id, updatedObj);
            responseData.msg = "Data updated successfully!";
            responseData.data = updatedData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let reqObj = req.query;
        try {
            let getData = await withdrawalDbHandler.getCount(reqObj);
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
            let getData = await withdrawalDbHandler.getSum(reqObj);
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