'use strict';
const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/user/notification.controller');
const { userAuthenticateMiddleware } = require('../../middlewares');

// Apply authentication middleware to all routes
router.use(userAuthenticateMiddleware);

/**
 * Get user notifications with pagination and filters
 * GET /api/user/notifications
 * Query params: page, limit, type, category, isRead, sortBy, sortOrder
 */
router.get('/', notificationController.getNotifications);

/**
 * Get unread notification count
 * GET /api/user/notifications/unread-count
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * Mark notification as read
 * PUT /api/user/notifications/:notificationId/read
 */
router.put('/:notificationId/read', notificationController.markAsRead);

/**
 * Mark all notifications as read
 * PUT /api/user/notifications/mark-all-read
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * Delete notification
 * DELETE /api/user/notifications/:notificationId
 */
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
