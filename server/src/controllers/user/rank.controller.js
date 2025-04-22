'use strict';
const logger = require('../../services/logger');
const log = new logger('RankController').getChildLogger();
const { rankDbHandler, userDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');

module.exports = {
    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Received request for getAll Ranks:', reqObj);
        let responseData = {};
        try {
            let getList = await rankDbHandler.getAll(reqObj);
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
            let getData = await rankDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getUserRank: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        try {
            let userData = await userDbHandler.getById(user_id);
            let rankData = await rankDbHandler.getOneByQuery({ name: userData.rank });
            responseData.msg = "Data fetched successfully!";
            responseData.data = rankData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    // This function will be called by a cron job to update user ranks
    updateUserRanks: async () => {
        try {
            // Get all ranks ordered by min_trade_balance (highest to lowest)
            const ranks = await rankDbHandler.getByQuery({}, {}).sort({ min_trade_balance: -1 });
            
            // Get all users
            const users = await userDbHandler.getByQuery({});
            
            for (const user of users) {
                // Get user's direct referrals (active team)
                const directReferrals = await userDbHandler.getByQuery({ refer_id: user._id });
                const activeTeamCount = directReferrals.length;
                
                // Find the highest rank the user qualifies for
                let newRank = 'ACTIVE'; // Default rank
                for (const rank of ranks) {
                    if (user.total_investment >= rank.min_trade_balance && activeTeamCount >= rank.active_team) {
                        newRank = rank.name;
                        break; // Found the highest rank, exit loop
                    }
                }
                
                // Update user's rank if it has changed
                if (user.rank !== newRank) {
                    // Get the rank details
                    const rankDetails = await rankDbHandler.getOneByQuery({ name: newRank });
                    
                    // Update user with new rank and related benefits
                    await userDbHandler.updateById(user._id, {
                        rank: newRank,
                        trade_booster: rankDetails.trade_booster,
                        level_roi_income: rankDetails.level_roi_income
                    });
                    
                    log.info(`Updated user ${user.username} rank to ${newRank}`);
                }
            }
            
            return { success: true, message: 'User ranks updated successfully' };
        } catch (error) {
            log.error('Failed to update user ranks with error::', error);
            return { success: false, message: 'Failed to update user ranks', error };
        }
    }
};
