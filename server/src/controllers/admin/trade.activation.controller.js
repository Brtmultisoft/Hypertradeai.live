'use strict';

const logger = require('../../services/logger');
const log = new logger('AdminTradeActivationController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const tradeActivationDbHandler = require('../../db_handlers/trade.activation.db.handler');

const mongoose = require('mongoose');
const { userDbHandler } = require('../../services/db');

/**
 * Admin Trade Activation Controller
 * Handles admin-specific trade activation operations
 */
const adminTradeActivationController = {
    /**
     * Update profit status for trade activations within a date range
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    updateProfitStatus: async (req, res) => {
        log.info('Received request to update profit status for trade activations');
        let responseData = {};

        try {
            const {
                startDate,
                endDate,
                profitStatus,
                userId = null,
                profitAmount = 0,
                profitError = null,
                cronExecutionId = null
            } = req.body;

            // Validate required fields
            if (!startDate || !endDate || !profitStatus) {
                responseData.msg = 'Start date, end date, and profit status are required';
                return responseHelper.error(res, responseData);
            }

            // Validate profit status
            const validProfitStatuses = ['pending', 'processed', 'failed', 'skipped'];
            if (!validProfitStatuses.includes(profitStatus)) {
                responseData.msg = `Invalid profit status. Must be one of: ${validProfitStatuses.join(', ')}`;
                return responseHelper.error(res, responseData);
            }

            // Parse dates
            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);

            // Set end date to end of day
            parsedEndDate.setHours(23, 59, 59, 999);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                responseData.msg = 'Invalid date format';
                return responseHelper.error(res, responseData);
            }

            // Build query
            const query = {
                activation_date: {
                    $gte: parsedStartDate,
                    $lte: parsedEndDate
                }
            };

            // Add user filter if provided
            if (userId) {
                try {
                    query.user_id = mongoose.Types.ObjectId(userId);
                } catch (error) {
                    responseData.msg = 'Invalid user ID format';
                    return responseHelper.error(res, responseData);
                }
            }

            // Get count of matching activations
            const activationCount = await tradeActivationDbHandler.countByQuery(query);

            if (activationCount === 0) {
                responseData.msg = 'No trade activations found for the specified criteria';
                return responseHelper.error(res, responseData);
            }

            // Prepare update data
            const updateData = {
                profit_status: profitStatus,
                updated_at: new Date()
            };

            // Add additional fields based on profit status
            if (profitStatus === 'processed') {
                updateData.profit_processed_at = new Date();
                updateData.profit_amount = profitAmount || 0;

                if (cronExecutionId) {
                    try {
                        updateData.cron_execution_id = mongoose.Types.ObjectId(cronExecutionId);
                    } catch (error) {
                        log.warn('Invalid cron execution ID format, skipping this field');
                    }
                }
            } else if (profitStatus === 'failed' || profitStatus === 'skipped') {
                updateData.profit_error = profitError || `Manually set to ${profitStatus} by admin`;

                if (cronExecutionId) {
                    try {
                        updateData.cron_execution_id = mongoose.Types.ObjectId(cronExecutionId);
                    } catch (error) {
                        log.warn('Invalid cron execution ID format, skipping this field');
                    }
                }
            }

            // Update all matching activations
            const updateResult = await tradeActivationDbHandler._model.updateMany(
                query,
                { $set: updateData }
            );

            log.info(`Updated ${updateResult.modifiedCount} trade activations to profit status: ${profitStatus}`);

            responseData.msg = 'Trade activation profit status updated successfully';
            responseData.data = {
                matchedCount: updateResult.matchedCount,
                modifiedCount: updateResult.modifiedCount,
                dateRange: {
                    startDate: parsedStartDate,
                    endDate: parsedEndDate
                },
                profitStatus,
                query
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update profit status with error:', error);
            responseData.msg = 'Failed to update profit status: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Update metadata for all trade activations
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    updateTradeActivationMetadata: async (req, res) => {
        log.info('Received request to update trade activation metadata');
        let responseData = {};

        try {
            // Find all trade activations
            const activations = await tradeActivationDbHandler.getByQuery({});
            log.info(`Found ${activations.length} trade activations`);

            let updatedCount = 0;
            let alreadyCompleteCount = 0;
            let errorCount = 0;

            // Process each activation
            for (const activation of activations) {
                try {
                    // Check if metadata is already complete
                    if (
                        activation.metadata &&
                        activation.metadata.username &&
                        activation.metadata.user_email
                    ) {
                        log.info(`Activation ${activation._id} already has complete metadata`);
                        alreadyCompleteCount++;
                        continue;
                    }

                    // Find the user for this activation
                    const user = await userDbHandler.getById(activation.user_id);

                    if (!user) {
                        log.warn(`User not found for activation ${activation._id} with user_id ${activation.user_id}`);
                        errorCount++;
                        continue;
                    }

                    // Create or update metadata object
                    const metadata = activation.metadata || {};

                    // Update email if available
                    if (user.email) {
                        metadata.user_email = user.email;
                    }

                    // Update name - use actual name if available, otherwise use username
                    if (user.name && user.name.trim()) {
                        metadata.name = user.name;
                    } else if (user.username && user.username !== user.email) {
                        metadata.name = user.username;
                    } else {
                        // If username is same as email, use part before @
                        const emailParts = user.email.split('@');
                        metadata.name = emailParts[0] || 'Unknown';
                    }

                    // Get proper username - if username is same as email, use name or first part of email
                    let displayUsername = user.username;
                    if (displayUsername === user.email) {
                        // If name exists, use that
                        if (user.name && user.name.trim()) {
                            displayUsername = user.name;
                        } else {
                            // Otherwise use the part before @ in email
                            const emailParts = user.email.split('@');
                            displayUsername = emailParts[0] || user.username;
                        }
                    }

                    // Update username
                    metadata.username = displayUsername;

                    // Update the activation record
                    await tradeActivationDbHandler.updateById(
                        activation._id,
                        { metadata: metadata }
                    );

                    log.info(`Updated metadata for activation ${activation._id}`);
                    updatedCount++;
                } catch (activationError) {
                    log.error(`Error processing activation ${activation._id}:`, activationError);
                    errorCount++;
                }
            }

            responseData.msg = 'Trade activation metadata update completed successfully';
            responseData.data = {
                totalActivations: activations.length,
                updatedCount,
                alreadyCompleteCount,
                errorCount
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update trade activation metadata with error:', error);
            responseData.msg = 'Failed to update trade activation metadata: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Update metadata for all trade activations
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    updateTradeActivationMetadata: async (req, res) => {
        log.info('Received request to update trade activation metadata');
        let responseData = {};

        try {
            // Find all trade activations
            const activations = await tradeActivationDbHandler._model.find({}).lean();
            log.info(`Found ${activations.length} trade activations`);

            let updatedCount = 0;
            let alreadyCompleteCount = 0;
            let errorCount = 0;

            // Process each activation
            for (const activation of activations) {
                try {
                    // Check if metadata is already complete
                    if (
                        activation.metadata &&
                        activation.metadata.username &&
                        activation.metadata.user_email
                    ) {
                        log.info(`Activation ${activation._id} already has complete metadata`);
                        alreadyCompleteCount++;
                        continue;
                    }

                    // Find the user for this activation
                    const user = await userDbHandler.getById(activation.user_id);

                    if (!user) {
                        log.warn(`User not found for activation ${activation._id} with user_id ${activation.user_id}`);
                        errorCount++;
                        continue;
                    }

                    // Create or update metadata object
                    const metadata = activation.metadata || {};

                    // Update username and email if available
                    if (user.username) {
                        metadata.username = user.username;
                    }

                    if (user.email) {
                        metadata.user_email = user.email;
                    }

                    // Update the activation record
                    await tradeActivationDbHandler.updateById(
                        activation._id,
                        { metadata: metadata }
                    );

                    log.info(`Updated metadata for activation ${activation._id}`);
                    updatedCount++;
                } catch (activationError) {
                    log.error(`Error processing activation ${activation._id}:`, activationError);
                    errorCount++;
                }
            }

            responseData.msg = 'Trade activation metadata update completed successfully';
            responseData.data = {
                totalActivations: activations.length,
                updatedCount,
                alreadyCompleteCount,
                errorCount
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to update trade activation metadata with error:', error);
            responseData.msg = 'Failed to update trade activation metadata: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Sync trade activations for all users with dailyProfitActivated=true
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    syncTradeActivations: async (req, res) => {
        log.info('Received request to sync trade activations');
        let responseData = {};

        try {
            // Find all users with dailyProfitActivated=true
            const users = await userDbHandler.getByQuery({ dailyProfitActivated: true });
            log.info(`Found ${users.length} users with dailyProfitActivated=true`);

            let createdCount = 0;
            let alreadyExistsCount = 0;
            let errors = [];

            // Process each user
            for (const user of users) {
                try {
                    // Check if user has a trade activation record for today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    const existingActivation = await tradeActivationDbHandler.getOneByQuery({
                        user_id: user._id,
                        activation_date: {
                            $gte: today,
                            $lt: tomorrow
                        }
                    });

                    if (existingActivation) {
                        log.info(`User ${user._id} (${user.username || user.email}) already has a trade activation record for today`);
                        alreadyExistsCount++;
                    } else {
                        // Create a new trade activation record
                        const now = new Date();
                        const expiryDate = new Date(now);
                        expiryDate.setDate(expiryDate.getDate() + 1);
                        expiryDate.setHours(0, 0, 0, 0); // Set to midnight

                        // Get proper username - if username is same as email, use name or first part of email
                        let displayUsername = user.username;
                        if (displayUsername === user.email) {
                            // If name exists, use that
                            if (user.name && user.name.trim()) {
                                displayUsername = user.name;
                            } else {
                                // Otherwise use the part before @ in email
                                const emailParts = user.email.split('@');
                                displayUsername = emailParts[0] || user.username;
                            }
                        }

                        // Get proper name for display
                        let displayName = '';
                        if (user.name && user.name.trim()) {
                            displayName = user.name;
                        } else if (user.username && user.username !== user.email) {
                            displayName = user.username;
                        } else {
                            // If username is same as email, use part before @
                            const emailParts = user.email.split('@');
                            displayName = emailParts[0] || 'Unknown';
                        }

                        const activationData = {
                            user_id: user._id,
                            activation_date: now,
                            activation_time: now.toTimeString().split(' ')[0], // HH:MM:SS
                            ip_address: 'Admin generated',
                            device_info: {
                                userAgent: 'Admin generated',
                                platform: 'Admin generated'
                            },
                            status: 'active',
                            expiry_date: expiryDate,
                            metadata: {
                                user_email: user.email,
                                username: displayUsername,
                                name: displayName
                            }
                        };

                        await tradeActivationDbHandler.create(activationData);
                        log.info(`Created trade activation record for user ${user._id} (${user.username || user.email})`);
                        createdCount++;
                    }
                } catch (userError) {
                    log.error(`Error processing user ${user._id}:`, userError);
                    errors.push({
                        userId: user._id,
                        error: userError.message
                    });
                }
            }

            responseData.msg = 'Trade activations sync completed successfully';
            responseData.data = {
                totalUsers: users.length,
                createdCount,
                alreadyExistsCount,
                errors: errors.length > 0 ? errors : null
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to sync trade activations with error:', error);
            responseData.msg = 'Failed to sync trade activations: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Get all trade activations with filtering and pagination
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    getAllTradeActivations: async (req, res) => {
        log.info('Received request to get all trade activations');
        let responseData = {};

        try {
            // Parse query parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const userId = req.query.userId || '';
            const email = req.query.email || '';
            const status = req.query.status || '';
            const profitStatus = req.query.profitStatus || '';
            const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

            // Build query
            let query = {};

            // Add user ID filter if provided
            if (userId) {
                // Check if userId is a valid ObjectId
                if (mongoose.Types.ObjectId.isValid(userId)) {
                    query.user_id = mongoose.Types.ObjectId(userId);
                } else {
                    // If not a valid ObjectId, try to find user by username or other fields
                    const user = await userDbHandler.getByQuery({ username: userId });
                    if (user && user.length > 0) {
                        query.user_id = user[0]._id;
                    } else {
                        // If no user found, return empty result
                        responseData.msg = 'No activations found for the specified user';
                        responseData.data = {
                            activations: [],
                            pagination: {
                                total: 0,
                                page,
                                limit,
                                totalPages: 0,
                                hasNextPage: false,
                                hasPrevPage: false
                            }
                        };
                        return responseHelper.success(res, responseData);
                    }
                }
            }

            // Add email filter if provided
            if (email) {
                // Find user by email
                const user = await userDbHandler.getByQuery({ email: { $regex: email, $options: 'i' } });
                if (user && user.length > 0) {
                    // If userId is already set, use $and to combine conditions
                    if (query.user_id) {
                        query = {
                            $and: [
                                { user_id: query.user_id },
                                { user_id: { $in: user.map(u => u._id) } }
                            ]
                        };
                    } else {
                        query.user_id = { $in: user.map(u => u._id) };
                    }
                } else {
                    // If no user found, return empty result
                    responseData.msg = 'No activations found for the specified email';
                    responseData.data = {
                        activations: [],
                        pagination: {
                            total: 0,
                            page,
                            limit,
                            totalPages: 0,
                            hasNextPage: false,
                            hasPrevPage: false
                        }
                    };
                    return responseHelper.success(res, responseData);
                }
            }

            // Add status filter if provided
            if (status) {
                query.status = status;
            }

            // Add profit status filter if provided
            if (profitStatus) {
                query.profit_status = profitStatus;
            }

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
                    .populate({
                        path: 'cron_execution_id',
                        select: 'cron_name status start_time end_time duration_ms'
                    })
                    .lean(),
                tradeActivationDbHandler._model.countDocuments(query)
            ]);

            // Enhance activations with profit status information
            const enhancedActivations = activations.map(activation => {
                // Add a human-readable profit status message
                let profitStatusMessage = '';
                switch (activation.profit_status) {
                    case 'processed':
                        profitStatusMessage = 'Profit distributed successfully';
                        break;
                    case 'pending':
                        profitStatusMessage = 'Pending profit distribution';
                        break;
                    case 'failed':
                        profitStatusMessage = activation.profit_error || 'Failed to distribute profit';
                        break;
                    case 'skipped':
                        profitStatusMessage = activation.profit_error || 'Skipped profit distribution';
                        break;
                    default:
                        profitStatusMessage = 'Unknown profit status';
                }

                return {
                    ...activation,
                    profit_status_message: profitStatusMessage,
                    profit_distributed: activation.profit_status === 'processed',
                    profit_distribution_time: activation.profit_processed_at ? new Date(activation.profit_processed_at).toLocaleString() : null
                };
            });

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            responseData.msg = 'Trade activations retrieved successfully';
            responseData.data = {
                activations: enhancedActivations,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get trade activations with error:', error);
            responseData.msg = 'Failed to get trade activations: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get profit distribution statistics
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Object} Response
     */
    getProfitDistributionStats: async (req, res) => {
        log.info('Received request to get profit distribution statistics');
        let responseData = {};

        try {
            // Parse query parameters
            const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

            // Build date range query
            let dateQuery = {};
            if (startDate || endDate) {
                dateQuery = {};
                if (startDate) {
                    dateQuery.$gte = startDate;
                }
                if (endDate) {
                    dateQuery.$lte = endDate;
                }
            } else {
                // Get last 30 days data by default
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                dateQuery = { $gte: thirtyDaysAgo };
            }

            // Get statistics for each day in the date range
            const dailyStats = await tradeActivationDbHandler._model.aggregate([
                {
                    $match: {
                        activation_date: dateQuery
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$activation_date" },
                            month: { $month: "$activation_date" },
                            day: { $dayOfMonth: "$activation_date" }
                        },
                        date: { $first: "$activation_date" },
                        total: { $sum: 1 },
                        processed: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "processed"] }, 1, 0]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "pending"] }, 1, 0]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "failed"] }, 1, 0]
                            }
                        },
                        skipped: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "skipped"] }, 1, 0]
                            }
                        },
                        totalProfit: {
                            $sum: "$profit_amount"
                        }
                    }
                },
                {
                    $sort: { date: -1 }
                }
            ]);

            // Get overall statistics
            const overallStats = await tradeActivationDbHandler._model.aggregate([
                {
                    $match: {
                        activation_date: dateQuery
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        processed: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "processed"] }, 1, 0]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "pending"] }, 1, 0]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "failed"] }, 1, 0]
                            }
                        },
                        skipped: {
                            $sum: {
                                $cond: [{ $eq: ["$profit_status", "skipped"] }, 1, 0]
                            }
                        },
                        totalProfit: {
                            $sum: "$profit_amount"
                        }
                    }
                }
            ]);

            // Format daily stats for response
            const formattedDailyStats = dailyStats.map(stat => ({
                date: stat.date,
                dateString: new Date(stat.date).toISOString().split('T')[0],
                total: stat.total,
                processed: stat.processed,
                pending: stat.pending,
                failed: stat.failed,
                skipped: stat.skipped,
                totalProfit: stat.totalProfit || 0,
                successRate: stat.total > 0 ? (stat.processed / stat.total) * 100 : 0
            }));

            // Format overall stats for response
            const formattedOverallStats = overallStats.length > 0 ? {
                total: overallStats[0].total,
                processed: overallStats[0].processed,
                pending: overallStats[0].pending,
                failed: overallStats[0].failed,
                skipped: overallStats[0].skipped,
                totalProfit: overallStats[0].totalProfit || 0,
                successRate: overallStats[0].total > 0 ? (overallStats[0].processed / overallStats[0].total) * 100 : 0
            } : {
                total: 0,
                processed: 0,
                pending: 0,
                failed: 0,
                skipped: 0,
                totalProfit: 0,
                successRate: 0
            };

            responseData.msg = 'Profit distribution statistics retrieved successfully';
            responseData.data = {
                dailyStats: formattedDailyStats,
                overallStats: formattedOverallStats
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get profit distribution statistics with error:', error);
            responseData.msg = 'Failed to get profit distribution statistics: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    }
};

module.exports = adminTradeActivationController;
