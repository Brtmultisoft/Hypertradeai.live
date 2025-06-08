'use strict';
const Notification = require('../../models/notification.model');
const logger = require('../logger');
const log = new logger('NotificationDbHandler').getChildLogger();

module.exports = {
    /**
     * Create a new notification
     */
    create: async (notificationData) => {
        try {
            log.info('Creating notification:', notificationData);
            const notification = new Notification(notificationData);
            const savedNotification = await notification.save();
            log.info('Notification created successfully:', savedNotification._id);
            return savedNotification;
        } catch (error) {
            log.error('Error creating notification:', error);
            throw error;
        }
    },

    /**
     * Get notification by ID
     */
    getById: async (id) => {
        try {
            log.info('Getting notification by ID:', id);
            const notification = await Notification.findById(id);
            return notification;
        } catch (error) {
            log.error('Error getting notification by ID:', error);
            throw error;
        }
    },

    /**
     * Get notifications by query
     */
    getByQuery: async (query, projection = {}, options = {}) => {
        try {
            log.info('Getting notifications by query:', query);
            const notifications = await Notification.find(query, projection, options);
            return notifications;
        } catch (error) {
            log.error('Error getting notifications by query:', error);
            throw error;
        }
    },

    /**
     * Get one notification by query
     */
    getOneByQuery: async (query, projection = {}) => {
        try {
            log.info('Getting one notification by query:', query);
            const notification = await Notification.findOne(query, projection);
            return notification;
        } catch (error) {
            log.error('Error getting one notification by query:', error);
            throw error;
        }
    },

    /**
     * Update notification by ID
     */
    updateById: async (id, updateData) => {
        try {
            log.info('Updating notification by ID:', { id, updateData });
            const notification = await Notification.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            return notification;
        } catch (error) {
            log.error('Error updating notification by ID:', error);
            throw error;
        }
    },

    /**
     * Update notifications by query
     */
    updateByQuery: async (query, updateData, options = {}) => {
        try {
            log.info('Updating notifications by query:', { query, updateData });
            const result = await Notification.updateMany(query, updateData, options);
            return result;
        } catch (error) {
            log.error('Error updating notifications by query:', error);
            throw error;
        }
    },

    /**
     * Delete notification by ID
     */
    deleteById: async (id) => {
        try {
            log.info('Deleting notification by ID:', id);
            const result = await Notification.findByIdAndDelete(id);
            return result;
        } catch (error) {
            log.error('Error deleting notification by ID:', error);
            throw error;
        }
    },

    /**
     * Delete notifications by query
     */
    deleteByQuery: async (query) => {
        try {
            log.info('Deleting notifications by query:', query);
            const result = await Notification.deleteMany(query);
            return result;
        } catch (error) {
            log.error('Error deleting notifications by query:', error);
            throw error;
        }
    },

    /**
     * Count notifications by query
     */
    countByQuery: async (query) => {
        try {
            log.info('Counting notifications by query:', query);
            const count = await Notification.countDocuments(query);
            return count;
        } catch (error) {
            log.error('Error counting notifications by query:', error);
            throw error;
        }
    },

    /**
     * Get notifications with pagination
     */
    getWithPagination: async (query, page = 1, limit = 20, sort = { createdAt: -1 }) => {
        try {
            log.info('Getting notifications with pagination:', { query, page, limit, sort });
            
            const skip = (page - 1) * limit;
            
            const [notifications, total] = await Promise.all([
                Notification.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                Notification.countDocuments(query)
            ]);

            return {
                notifications,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            log.error('Error getting notifications with pagination:', error);
            throw error;
        }
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId, userId) => {
        try {
            log.info('Marking notification as read:', { notificationId, userId });
            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, userId: userId },
                { 
                    isRead: true, 
                    readAt: new Date() 
                },
                { new: true }
            );
            return notification;
        } catch (error) {
            log.error('Error marking notification as read:', error);
            throw error;
        }
    },

    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead: async (userId) => {
        try {
            log.info('Marking all notifications as read for user:', userId);
            const result = await Notification.updateMany(
                { userId: userId, isRead: false },
                { 
                    isRead: true, 
                    readAt: new Date() 
                }
            );
            return result;
        } catch (error) {
            log.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    /**
     * Get unread count for a user
     */
    getUnreadCount: async (userId) => {
        try {
            log.info('Getting unread count for user:', userId);
            const count = await Notification.countDocuments({
                userId: userId,
                isRead: false,
                isActive: true,
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $gt: new Date() } }
                ]
            });
            return count;
        } catch (error) {
            log.error('Error getting unread count:', error);
            throw error;
        }
    },

    /**
     * Clean up expired notifications
     */
    cleanupExpired: async () => {
        try {
            log.info('Cleaning up expired notifications');
            const result = await Notification.deleteMany({
                expiresAt: { $lte: new Date() }
            });
            log.info('Expired notifications cleaned up:', result.deletedCount);
            return result;
        } catch (error) {
            log.error('Error cleaning up expired notifications:', error);
            throw error;
        }
    }
};
