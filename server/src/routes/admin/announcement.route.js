'use strict';
const express = require('express');
const router = express.Router();
const announcementController = require('../../controllers/admin/announcement.controller');
const { adminAuthenticateMiddleware } = require('../../middlewares');

// Apply authentication middleware to all routes
router.use(adminAuthenticateMiddleware);

// Create a new announcement
router.post('/create-announcement', announcementController.createAnnouncement);

// Get all announcements with pagination and filters
router.get('/get-all-announcements', announcementController.getAllAnnouncements);

// Get a single announcement by ID
router.get('/get-announcement/:id', announcementController.getAnnouncementById);

// Update an announcement
router.put('/update-announcement/:id', announcementController.updateAnnouncement);

// Delete an announcement
router.delete('/delete-announcement/:id', announcementController.deleteAnnouncement);

module.exports = router;
