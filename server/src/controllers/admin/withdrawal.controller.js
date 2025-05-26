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
            const { status, page, limit, search, sort_field, sort_direction } = req.query;

            // Build query
            const query = {};
            if (status !== undefined) {
                query.status = parseInt(status);
            }

            // Create options for pagination
            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10
            };

            // Handle sorting properly - don't pass an object to sort_by
            let sortOptions = {};
            if (sort_field) {
                sortOptions.sort_field = sort_field;
                sortOptions.sort_direction = sort_direction || 'desc';
            } else {
                sortOptions.sort_field = 'created_at';
                sortOptions.sort_direction = 'desc';
            }

            console.log("Withdrawal query:", query);
            console.log("Withdrawal options:", options);
            console.log("Sort options:", sortOptions);

            // Get withdrawals - wrap in try/catch to handle any errors
            let withdrawalsResult;
            try {
                withdrawalsResult = await withdrawalDbHandler.getAll({
                    ...query,
                    page: options.page,
                    limit: options.limit,
                    sort_field: sortOptions.sort_field,
                    sort_direction: sortOptions.sort_direction,
                    search: search
                });

                console.log("Withdrawals result structure:", withdrawalsResult ? Object.keys(withdrawalsResult) : "No result");
            } catch (fetchError) {
                console.error("Error fetching withdrawals:", fetchError);
                // Create a fallback empty result
                withdrawalsResult = {
                    docs: [],
                    totalDocs: 0,
                    limit: options.limit,
                    page: options.page,
                    totalPages: 0
                };
            }

            // Ensure we have an array of withdrawals
            let withdrawals = [];
            let totalDocs = 0;

            // Check if the result is already in the expected format
            if (withdrawalsResult && withdrawalsResult.docs) {
                withdrawals = withdrawalsResult.docs;
                totalDocs = withdrawalsResult.totalDocs;
            }
            // Check if the result is already an array
            else if (Array.isArray(withdrawalsResult)) {
                withdrawals = withdrawalsResult;
                totalDocs = withdrawalsResult.length;
            }
            // Check if the result has a 'result' property that is an array
            else if (withdrawalsResult && Array.isArray(withdrawalsResult.result)) {
                withdrawals = withdrawalsResult.result;
                totalDocs = withdrawalsResult.result.length;
            }
            // Check if the result has a 'data' property that is an array
            else if (withdrawalsResult && Array.isArray(withdrawalsResult.data)) {
                withdrawals = withdrawalsResult.data;
                totalDocs = withdrawalsResult.data.length;
            }
            // Check if the result has a 'list' property that is an array
            else if (withdrawalsResult && Array.isArray(withdrawalsResult.list)) {
                withdrawals = withdrawalsResult.list;
                totalDocs = withdrawalsResult.list.length;
            }

            // If we still don't have withdrawals, try to fetch them directly
            if (withdrawals.length === 0) {
                try {
                    console.log("Attempting to fetch withdrawals directly from the database");
                    const directWithdrawals = await withdrawalDbHandler._model.find(query)
                        .sort({ created_at: -1 })
                        .limit(options.limit)
                        .skip((options.page - 1) * options.limit);

                    if (directWithdrawals && directWithdrawals.length > 0) {
                        console.log(`Found ${directWithdrawals.length} withdrawals directly from the database`);
                        withdrawals = directWithdrawals;
                        totalDocs = await withdrawalDbHandler._model.countDocuments(query);
                    }
                } catch (directError) {
                    console.error("Error fetching withdrawals directly:", directError);
                }
            }

            console.log(`Processed ${withdrawals.length} withdrawals`);

            // Get user details for each withdrawal
            const withdrawalsWithUserDetails = await Promise.all(
                withdrawals.map(async (withdrawal) => {
                    try {
                        // Convert withdrawal to plain object if it's a Mongoose document
                        const plainWithdrawal = withdrawal.toObject ? withdrawal.toObject() : withdrawal;

                        // Get user details
                        let user;
                        try {
                            user = await userDbHandler.getById(plainWithdrawal.user_id);
                        } catch (userError) {
                            console.error(`Error fetching user for withdrawal ${plainWithdrawal._id}:`, userError);
                            user = null;
                        }

                        return {
                            ...plainWithdrawal,
                            user_details: {
                                name: user ? (user.name || user.username) : 'Unknown',
                                email: user ? user.email : 'Unknown'
                            }
                        };
                    } catch (error) {
                        console.error(`Error processing withdrawal ${withdrawal._id || 'unknown'}:`, error);

                        // Return a safe fallback
                        const safeWithdrawal = typeof withdrawal.toObject === 'function'
                            ? withdrawal.toObject()
                            : (typeof withdrawal === 'object' ? withdrawal : {});

                        return {
                            ...safeWithdrawal,
                            user_details: {
                                name: 'Unknown',
                                email: 'Unknown'
                            }
                        };
                    }
                })
            );

            // Get stats
            let stats = {
                pending: 0,
                approved: 0,
                rejected: 0,
                total: totalDocs
            };

            // Calculate stats from the withdrawals array
            try {
                // Try to use the getCount method
                if (typeof withdrawalDbHandler.getCount === 'function') {
                    stats.pending = await withdrawalDbHandler.getCount({ status: 0 });
                    stats.approved = await withdrawalDbHandler.getCount({ status: 1 });
                    stats.rejected = await withdrawalDbHandler.getCount({ status: 2 });
                    stats.total = await withdrawalDbHandler.getCount({});
                } else {
                    // Fallback to direct count
                    stats.pending = await withdrawalDbHandler._model.countDocuments({ status: 0 });
                    stats.approved = await withdrawalDbHandler._model.countDocuments({ status: 1 });
                    stats.rejected = await withdrawalDbHandler._model.countDocuments({ status: 2 });
                    stats.total = await withdrawalDbHandler._model.countDocuments({});
                }
            } catch (countError) {
                log.error('Error using count method, using array length instead:', countError);
                // Fallback to calculating from the current page
                stats.pending = withdrawals.filter(w => w.status === 0 || w.status === '0').length;
                stats.approved = withdrawals.filter(w => w.status === 1 || w.status === '1').length;
                stats.rejected = withdrawals.filter(w => w.status === 2 || w.status === '2').length;
                stats.total = totalDocs;
            }

            // Create result object in the expected format
            const result = {
                docs: withdrawalsWithUserDetails,
                totalDocs: totalDocs,
                limit: parseInt(limit) || 10,
                page: parseInt(page) || 1,
                totalPages: Math.ceil(totalDocs / (parseInt(limit) || 10)),
                hasNextPage: (parseInt(page) || 1) < Math.ceil(totalDocs / (parseInt(limit) || 10)),
                hasPrevPage: (parseInt(page) || 1) > 1
            };

            console.log(`Returning ${withdrawalsWithUserDetails.length} withdrawals with user details`);

            // Log a sample withdrawal for debugging
            if (withdrawalsWithUserDetails.length > 0) {
                console.log('Sample withdrawal:', JSON.stringify(withdrawalsWithUserDetails[0]).substring(0, 500) + '...');
            }

            responseData.msg = 'Withdrawals fetched successfully';
            responseData.result = result;
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

            // Check if this withdrawal includes unlocking staking
            const unlockStaking = withdrawal.extra && withdrawal.extra.unlockStaking === true;

            // Prepare the remark based on whether staking is being unlocked
            let remark = 'Approved by admin';
            if (unlockStaking) {
                remark = 'Approved by admin (includes staking unlock)';
            }

            // Update withdrawal status
            await withdrawalDbHandler.updateOneByQuery({_id: withdrawalId}, {
                status: 1, // Approved
                txid: txid || 'manual-process',
                processed_at: new Date(),
                approved_at: new Date(),
                remark: remark
            });

            // Update user's wallet_withdraw (reduce the pending withdrawal amount)
            // Note: We don't add back to wallet since the funds are now being sent out
            await userDbHandler.updateOneByQuery(
                { _id: withdrawal.user_id },
                { $inc: { wallet_withdraw: -withdrawal.amount } }
            );

            // If this withdrawal includes unlocking staking, ensure the user's investment status is reset
            if (unlockStaking) {
                console.log(`Admin approved withdrawal with staking unlock for user ${withdrawal.user_id}`);

                // Double-check that the user's investment status has been reset
                // This should have been done when the withdrawal was requested, but we'll ensure it here
                await userDbHandler.updateOneByQuery(
                    { _id: withdrawal.user_id },
                    {
                        $set: {
                            total_investment: 0,
                            dailyProfitActivated: false,
                            lastDailyProfitActivation: null
                        }
                    }
                );

                // Also ensure all investments are marked as completed
                try {
                    // Import the investment database handler
                    const { investmentDbHandler } = require('../../services/db');

                    // Update all active investments for this user to 'completed'
                    await investmentDbHandler.updateManyByQuery(
                        {
                            user_id: withdrawal.user_id,
                            status: 'active' // Only update active investments
                        },
                        {
                            $set: {
                                status: 'completed',
                                extra: {
                                    completedReason: 'staking_unlocked_admin_approved',
                                    completedDate: new Date()
                                }
                            }
                        }
                    );
                } catch (investmentError) {
                    console.error('Error updating investments during admin approval:', investmentError);
                    // Don't fail the withdrawal if investment update fails
                }
            }

            responseData.msg = unlockStaking ?
                'Withdrawal approved and staking unlocked successfully' :
                'Withdrawal approved successfully';
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

            // Check if this withdrawal includes unlocking staking
            const unlockStaking = withdrawal.extra && withdrawal.extra.unlockStaking === true;
            const stakingAmount = withdrawal.extra && withdrawal.extra.stakingAmount ? withdrawal.extra.stakingAmount : 0;

            // Create update object for user
            let updateObj = {
                $inc: {
                    wallet: parseFloat(withdrawal.amount),
                    wallet_withdraw: -parseFloat(withdrawal.amount)
                }
            };

            // If this withdrawal included unlocking staking, restore the user's investment status
            if (unlockStaking && stakingAmount > 0) {
                console.log(`Restoring staking for user ${withdrawal.user_id} after withdrawal rejection. Staking amount: ${stakingAmount}`);

                // Restore the user's investment status
                updateObj.$set = {
                    total_investment: stakingAmount // Restore the original investment amount
                };

                // Note: We don't restore dailyProfitActivated as the user will need to reactivate it
            }

            // Update user record
            await userDbHandler.updateOneByQuery({_id : withdrawal.user_id}, updateObj);

            // Update withdrawal status
            await withdrawalDbHandler.updateById(withdrawalId, {
                status: 2, // Rejected
                processed_at: new Date(),
                remark: unlockStaking ? 'Rejected by admin (staking restored)' : 'Rejected by admin',
                extra: {
                    ...withdrawal.extra,
                    rejectionReason: reason,
                    rejectionDate: new Date(),
                    stakingRestored: unlockStaking && stakingAmount > 0
                }
            });

            // If this withdrawal included unlocking staking, restore the investments to active status
            if (unlockStaking && stakingAmount > 0) {
                try {
                    // Import the investment database handler
                    const { investmentDbHandler } = require('../../services/db');

                    // Update all investments that were marked as completed due to staking unlock
                    await investmentDbHandler.updateManyByQuery(
                        {
                            user_id: withdrawal.user_id,
                            status: 'completed',
                            'extra.completedReason': 'staking_unlocked' // Only update those completed due to staking unlock
                        },
                        {
                            $set: {
                                status: 'active', // Restore to active status
                                extra: {
                                    restoredReason: 'withdrawal_rejected',
                                    restoredDate: new Date()
                                }
                            }
                        }
                    );
                } catch (investmentError) {
                    console.error('Error restoring investments after withdrawal rejection:', investmentError);
                    // Don't fail the withdrawal rejection if investment restoration fails
                }
            }

            responseData.msg = unlockStaking && stakingAmount > 0 ?
                'Withdrawal rejected and staking restored successfully' :
                'Withdrawal rejected successfully';
            responseData.data = {
                withdrawal_id: withdrawalId,
                amount: withdrawal.amount,
                status: 'Rejected',
                reason: reason,
                stakingRestored: unlockStaking && stakingAmount > 0
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error in rejectWithdrawal:', error);
            responseData.msg = 'Error rejecting withdrawal: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Received request for getAll:', reqObj);
        let responseData = {};
        try {
            // Log the query parameters for debugging
            console.log('Withdrawal query parameters:', reqObj);

            // Get all withdrawals
            let getList = await withdrawalDbHandler.getAll(reqObj);
            console.log('Withdrawal data retrieved:', JSON.stringify(getList).substring(0, 500) + '...');

            // Process the data to ensure it's in the expected format
            let result = getList;

            // If the result is not in the expected format, transform it
            if (!result.docs && result.data) {
                result = {
                    docs: result.data,
                    totalDocs: result.data.length,
                    limit: parseInt(reqObj.limit) || 10,
                    page: parseInt(reqObj.page) || 1,
                    totalPages: Math.ceil(result.data.length / (parseInt(reqObj.limit) || 10))
                };
            }

            // Ensure we have the expected structure
            if (!result.docs) {
                result = {
                    docs: Array.isArray(result) ? result : [result],
                    totalDocs: Array.isArray(result) ? result.length : 1,
                    limit: parseInt(reqObj.limit) || 10,
                    page: parseInt(reqObj.page) || 1,
                    totalPages: Math.ceil((Array.isArray(result) ? result.length : 1) / (parseInt(reqObj.limit) || 10))
                };
            }

            // Add user details to each withdrawal
            if (Array.isArray(result.docs)) {
                for (let i = 0; i < result.docs.length; i++) {
                    try {
                        const user = await userDbHandler.getById(result.docs[i].user_id);
                        if (user) {
                            result.docs[i].user_details = {
                                name: user.name || user.username,
                                email: user.email
                            };
                        }
                    } catch (userError) {
                        console.error(`Error fetching user details for withdrawal ${result.docs[i]._id}:`, userError);
                    }
                }
            }

            responseData.msg = 'Data fetched successfully!';
            responseData.result = result;
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