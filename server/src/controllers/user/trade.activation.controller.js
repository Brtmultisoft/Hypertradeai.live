'use strict';
const logger = require('../../services/logger');
const log = new logger('TradeActivationController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const tradeActivationDbHandler = require('../../db_handlers/trade.activation.db.handler');
const { userDbHandler } = require('../../services/db');
const mongoose = require('mongoose');

const { hasUserInvested } = require('./cron.controller');

/**
 * Controller for handling trade activation operations
 */
module.exports = {
    /**
     * Activate daily trading for a user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    activateDailyTrading: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request to activate daily trading for User:', id);
        let responseData = {};

        try {
            // Get user data
            const userData = await userDbHandler.getById(id);
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Check if user is blocked
            if (userData.is_blocked) {
                responseData.msg = 'Your account has been blocked. You cannot activate daily trading.';
                responseData.block_reason = userData.block_reason || 'No reason provided';
                return responseHelper.forbidden(res, responseData);
            }

            // Check if user has made an investment
            const hasInvested = await hasUserInvested(id);
            if (!hasInvested) {
                responseData.msg = 'You need to make an investment before activating daily trading';
                return responseHelper.error(res, responseData);
            }

            // Check if user has already activated trading today
            const todayActivation = await tradeActivationDbHandler.getTodayActivation(id);
            if (todayActivation) {
                responseData.msg = 'You have already activated daily trading today';
                responseData.data = {
                    activation: todayActivation
                };
                return responseHelper.success(res, responseData);
            }

            // Create a new trade activation record
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0); // Set to midnight

            // Convert id to ObjectId if it's a string
            const userIdObj = typeof id === 'string' ? mongoose.Types.ObjectId(id) : id;

            // Get proper username - if username is same as email, use name or first part of email
            let displayUsername = userData.username;
            if (displayUsername === userData.email) {
                // If name exists, use that
                if (userData.name && userData.name.trim()) {
                    displayUsername = userData.name;
                } else {
                    // Otherwise use the part before @ in email
                    const emailParts = userData.email.split('@');
                    displayUsername = emailParts[0] || userData.username;
                }
            }

            // Get proper name for display
            let displayName = '';
            if (userData.name && userData.name.trim()) {
                displayName = userData.name;
            } else if (userData.username && userData.username !== userData.email) {
                displayName = userData.username;
            } else {
                // If username is same as email, use part before @
                const emailParts = userData.email.split('@');
                displayName = emailParts[0] || 'Unknown';
            }

            const activationData = {
                user_id: userIdObj,
                activation_date: now,
                activation_time: now.toTimeString().split(' ')[0], // HH:MM:SS
                ip_address: req.ip || req.connection.remoteAddress,
                device_info: {
                    userAgent: req.headers['user-agent'],
                    platform: req.headers['sec-ch-ua-platform']
                },
                status: 'active',
                expiry_date: tomorrow,
                metadata: {
                    user_email: userData.email,
                    username: displayUsername,
                    name: displayName
                }
            };

            const activation = await tradeActivationDbHandler.create(activationData);

            // Update user's daily profit activation status
            await userDbHandler.updateById(id, {
                dailyProfitActivated: true,
                lastDailyProfitActivation: now
            });

            log.info(`Daily trading activated for user ${id}`);
            responseData.msg = 'Daily trading activated successfully';
            responseData.data = {
                activation: activation,
                user: {
                    dailyProfitActivated: true,
                    lastDailyProfitActivation: now
                }
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to activate daily trading with error:', error);
            responseData.msg = 'Failed to activate daily trading: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get daily trading activation status for a user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    getDailyTradingStatus: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request to get daily trading status for User:', id);
        let responseData = {};

        try {
            // Get user data
            const userData = await userDbHandler.getById(id);
            if (!userData) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Convert id to ObjectId if it's a string
            const userIdObj = typeof id === 'string' ? mongoose.Types.ObjectId(id) : id;

            // Check if user has already activated trading today
            const todayActivation = await tradeActivationDbHandler.getTodayActivation(userIdObj);

            responseData.msg = 'Daily trading status retrieved successfully';
            responseData.data = {
                isActivated: !!todayActivation,
                activation: todayActivation || null,
                user: {
                    dailyProfitActivated: userData.dailyProfitActivated || false,
                    lastDailyProfitActivation: userData.lastDailyProfitActivation || null
                }
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get daily trading status with error:', error);
            responseData.msg = 'Failed to get daily trading status: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get activation history for a user with date filtering and pagination
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    getActivationHistory: async (req, res) => {
        let user = req.user;
        let id = user.sub;
        log.info('Received request to get activation history for User:', id);
        let responseData = {};

        try {
            // Parse query parameters - simplified to only include pagination and date filtering
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

            // Convert id to ObjectId if it's a string
            const userIdObj = typeof id === 'string' ? mongoose.Types.ObjectId(id) : id;

            // Build query
            let query = { user_id: userIdObj };

            // Add date range filter if provided
            if (startDate || endDate) {
                query.activation_date = {};
                if (startDate) {
                    query.activation_date.$gte = startDate;
                }
                if (endDate) {
                    query.activation_date.$lte = endDate;
                }
            } else {
                // Get last 10 days data by default
                const tenDaysAgo = new Date();
                tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                query.activation_date = { $gte: tenDaysAgo };
            }

            // Create sort object - always sort by activation_date descending (newest first)
            const sort = { activation_date: -1 };

            // Use Promise.all for parallel execution of find and count
            const [activations, totalCount] = await Promise.all([
                tradeActivationDbHandler._model.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                tradeActivationDbHandler._model.countDocuments(query)
            ]);

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            responseData.msg = 'Activation history retrieved successfully';
            responseData.data = {
                activations: activations,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                },
                filters: {
                    startDate: startDate ? startDate.toISOString() : null,
                    endDate: endDate ? endDate.toISOString() : null
                }
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get activation history with error:', error);
            responseData.msg = 'Failed to get activation history: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    }
};
