'use strict';
const express = require('express');
const router = express.Router();
const announcementController = require('../../controllers/user/announcement.controller');
const { userAuthenticateMiddleware } = require('../../middlewares');

// Apply authentication middleware to all routes
router.use(userAuthenticateMiddleware);

// Get all active announcements
router.get('/get-announcements', announcementController.getAnnouncements);

// Get a single announcement by ID
router.get('/get-announcement/:id', announcementController.getAnnouncementById);

// Get announcements by category
router.get('/get-announcements-by-category/:category', announcementController.getAnnouncementsByCategory);

module.exports = router;
