'use strict';
const responseHelper = require('../../utils/customResponse');
const logger = require('../../services/logger');
const log = new logger('NotificationController').getChildLogger();
const notificationDbHandler = require('../../services/db/notification.dbHandler');
const Notification = require('../../models/notification.model');

module.exports = {
    /**
     * Get user notifications with pagination and filters
     */
    getNotifications: async (req, res) => {
        let responseData = {};
        try {
            const userId = req.user._id;
            const {
                page = 1,
                limit = 20,
                type,
                category,
                isRead,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            log.info('Getting notifications for user:', {
                userId,
                page,
                limit,
                type,
                category,
                isRead
            });

            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                type,
                category,
                isRead: isRead !== undefined ? isRead === 'true' : null,
                sortBy,
                sortOrder: sortOrder === 'desc' ? -1 : 1
            };

            const result = await Notification.getUserNotifications(userId, options);

            responseData.msg = 'Notifications retrieved successfully';
            responseData.data = result;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get notifications:', error);
            responseData.msg = 'Failed to retrieve notifications';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (req, res) => {
        let responseData = {};
        try {
            const userId = req.user._id;

            log.info('Getting unread count for user:', userId);

            const count = await Notification.getUnreadCount(userId);

            responseData.msg = 'Unread count retrieved successfully';
            responseData.data = { count };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get unread count:', error);
            responseData.msg = 'Failed to retrieve unread count';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (req, res) => {
        let responseData = {};
        try {
            const userId = req.user._id;
            const { notificationId } = req.params;

            log.info('Marking notification as read:', { userId, notificationId });

            const notification = await Notification.markAsRead(notificationId, userId);

            if (!notification) {
                responseData.msg = 'Notification not found';
                return responseHelper.error(res, responseData);
            }

            responseData.msg = 'Notification marked as read';
            responseData.data = notification;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to mark notification as read:', error);
            responseData.msg = 'Failed to mark notification as read';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (req, res) => {
        let responseData = {};
        try {
            const userId = req.user._id;

            log.info('Marking all notifications as read for user:', userId);

            const result = await Notification.markAllAsRead(userId);

            responseData.msg = 'All notifications marked as read';
            responseData.data = { modifiedCount: result.modifiedCount };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to mark all notifications as read:', error);
            responseData.msg = 'Failed to mark all notifications as read';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Delete notification
     */
    deleteNotification: async (req, res) => {
        let responseData = {};
        try {
            const userId = req.user._id;
            const { notificationId } = req.params;

            log.info('Deleting notification:', { userId, notificationId });

            const result = await notificationDbHandler.deleteByQuery({
                _id: notificationId,
                userId: userId
            });

            if (result.deletedCount === 0) {
                responseData.msg = 'Notification not found';
                return responseHelper.error(res, responseData);
            }

            responseData.msg = 'Notification deleted successfully';
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to delete notification:', error);
            responseData.msg = 'Failed to delete notification';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Create notification (for system use)
     */
    createNotification: async (notificationData) => {
        try {
            log.info('Creating notification:', notificationData);

            const notification = await Notification.createNotification(notificationData);
            log.info('Notification created successfully:', notification._id);

            return notification;
        } catch (error) {
            log.error('Failed to create notification:', error);
            throw error;
        }
    },

    /**
     * Create welcome notification for new users
     */
    createWelcomeNotification: async (userId, userData) => {
        try {
            const notificationData = {
                userId: userId,
                title: 'Welcome to HypeTrade AI!',
                message: `Welcome ${userData.name || userData.username}! Your account has been created successfully. Start your trading journey with us.`,
                type: 'success',
                category: 'general',
                priority: 'medium',
                actionUrl: '/dashboard',
                actionText: 'Go to Dashboard'
            };

            return await module.exports.createNotification(notificationData);
        } catch (error) {
            log.error('Failed to create welcome notification:', error);
            throw error;
        }
    },

    /**
     * Create trade notification
     */
    createTradeNotification: async (userId, tradeData) => {
        try {
            const notificationData = {
                userId: userId,
                title: 'Trade Update',
                message: `Your trade has been ${tradeData.status}. Amount: $${tradeData.amount}`,
                type: tradeData.status === 'completed' ? 'success' : 'info',
                category: 'trading',
                priority: 'medium',
                data: tradeData,
                actionUrl: '/trading',
                actionText: 'View Trades'
            };

            return await module.exports.createNotification(notificationData);
        } catch (error) {
            log.error('Failed to create trade notification:', error);
            throw error;
        }
    },

    /**
     * Create payment notification
     */
    createPaymentNotification: async (userId, paymentData) => {
        try {
            const notificationData = {
                userId: userId,
                title: 'Payment Update',
                message: `Payment of $${paymentData.amount} has been ${paymentData.status}`,
                type: paymentData.status === 'completed' ? 'success' : 'warning',
                category: 'payment',
                priority: 'high',
                data: paymentData,
                actionUrl: '/wallet',
                actionText: 'View Wallet'
            };

            return await module.exports.createNotification(notificationData);
        } catch (error) {
            log.error('Failed to create payment notification:', error);
            throw error;
        }
    }
};
