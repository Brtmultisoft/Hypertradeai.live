'use strict';
const logger = require('../../services/logger');
const log = new logger('TeamRewardController').getChildLogger();
const { teamRewardDbHandler, userDbHandler, incomeDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');

module.exports = {
    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Received request for getAll Team Rewards:', reqObj);
        let responseData = {};
        try {
            // Check if teamRewardDbHandler is defined
            if (!teamRewardDbHandler) {
                log.error('teamRewardDbHandler is not defined');
                responseData.msg = 'Internal server error';
                return responseHelper.error(res, responseData);
            }

            console.log('Getting team rewards for user:', user_id);
            let getList = await teamRewardDbHandler.getAll(reqObj, user_id);
            console.log('Team rewards found:', getList ? (getList.docs ? getList.docs.length : 'No docs property') : 'No results');

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
            let getData = await teamRewardDbHandler.getById(id);

            // Ensure the user can only access their own team rewards
            if (getData.user_id.toString() !== user_id) {
                responseData.msg = 'Unauthorized access';
                return responseHelper.error(res, responseData, 403);
            }

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
            // Check if teamRewardDbHandler is defined
            if (!teamRewardDbHandler) {
                log.error('teamRewardDbHandler is not defined');
                responseData.msg = 'Internal server error';
                return responseHelper.error(res, responseData);
            }

            console.log('Getting team reward sum for user:', user_id);
            let getData = await teamRewardDbHandler.getSum(reqObj, user_id);
            console.log('Team reward sum result:', getData);

            // If no rewards found, return 0
            if (!getData || getData.length === 0) {
                responseData.msg = "Data fetched successfully!";
                responseData.data = [{ reward_amount: 0, count: 0 }];
                return responseHelper.success(res, responseData);
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    // This function will be called by a cron job to check and process team rewards
    processTeamRewards: async () => {
        try {
            // Team reward tiers
            const teamRewardTiers = [
                { team_deposit: 100000, time_period: 30, reward_amount: 15000 },
                { team_deposit: 300000, time_period: 60, reward_amount: 50000 },
                { team_deposit: 1200000, time_period: 90, reward_amount: 500000 }
            ];

            // Get all users
            const users = await userDbHandler.getByQuery({});

            for (const user of users) {
                // Get user's team (all referrals in their downline)
                const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });

                // Calculate total team deposit
                let totalTeamDeposit = 0;
                for (const referral of directReferrals) {
                    totalTeamDeposit += referral.total_investment;

                    // Get indirect referrals (level 2)
                    const indirectReferrals = await userDbHandler.getByQuery({ refer_id: referral._id });
                    for (const indirectReferral of indirectReferrals) {
                        totalTeamDeposit += indirectReferral.total_investment;
                    }
                }

                // Check if user qualifies for any team reward
                for (const tier of teamRewardTiers) {
                    if (totalTeamDeposit >= tier.team_deposit) {
                        // Check if user already has an active team reward of this tier
                        const existingReward = await teamRewardDbHandler.getOneByQuery({
                            user_id: user._id,
                            team_deposit: tier.team_deposit,
                            status: { $in: ['pending', 'completed'] }
                        });

                        if (!existingReward) {
                            // Create new team reward
                            const endDate = new Date();
                            endDate.setDate(endDate.getDate() + tier.time_period);

                            const newReward = {
                                user_id: user._id,
                                team_deposit: tier.team_deposit,
                                time_period: tier.time_period,
                                reward_amount: tier.reward_amount,
                                start_date: new Date(),
                                end_date: endDate,
                                status: 'pending',
                                remarks: `Team deposit of $${tier.team_deposit} achieved. Reward will be processed after ${tier.time_period} days.`
                            };

                            await teamRewardDbHandler.create(newReward);
                            log.info(`Created new team reward for user ${user.username}`);
                        }
                    }
                }
            }

            // Process completed team rewards
            const pendingRewards = await teamRewardDbHandler.getByQuery({
                status: 'pending',
                end_date: { $lte: new Date() }
            });

            for (const reward of pendingRewards) {
                // Create income entry for the reward
                const incomeData = {
                    user_id: reward.user_id,
                    type: 'team_reward',
                    amount: reward.reward_amount,
                    status: 'credited',
                    description: `Team reward for maintaining $${reward.team_deposit} team deposit for ${reward.time_period} days`,
                    extra: {
                        team_deposit: reward.team_deposit,
                        time_period: reward.time_period
                    }
                };

                await incomeDbHandler.create(incomeData);

                // Update user's wallet
                const user = await userDbHandler.getById(reward.user_id);
                await userDbHandler.updateById(reward.user_id, {
                    wallet: user.wallet + reward.reward_amount
                });

                // Update reward status
                await teamRewardDbHandler.updateById(reward._id, {
                    status: 'completed',
                    remarks: `Reward of $${reward.reward_amount} credited to wallet`
                });

                log.info(`Processed team reward for user ${user.username}`);
            }

            return { success: true, message: 'Team rewards processed successfully' };
        } catch (error) {
            log.error('Failed to process team rewards with error::', error);
            return { success: false, message: 'Failed to process team rewards', error };
        }
    }
};
