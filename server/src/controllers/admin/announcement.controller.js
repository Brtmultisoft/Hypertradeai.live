'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminAnnouncementController').getChildLogger();
const { announcementDbHandler } = require('../../services/db');
const { ObjectId } = require('mongodb');

module.exports = {
    /**
     * Create a new announcement
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and message
     */
    createAnnouncement: async (req, res) => {
        try {
            // Safely get admin ID if available
            const adminId = req.user && req.user.sub ? req.user.sub : null;
            const announcementData = {
                ...req.body,
                createdBy: adminId
            };

            // Validate required fields
            if (!announcementData.title || !announcementData.description) {
                return res.status(400).json({
                    status: false,
                    message: 'Title and description are required'
                });
            }

            // Create the announcement
            const announcement = await announcementDbHandler.create(announcementData);

            return res.status(201).json({
                status: true,
                message: 'Announcement created successfully',
                result: announcement
            });
        } catch (error) {
            log.error('Error creating announcement:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to create announcement',
                error: error.message
            });
        }
    },

    /**
     * Get all announcements with pagination and filters
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and announcements list
     */
    getAllAnnouncements: async (req, res) => {
        try {
            const result = await announcementDbHandler.getAll(req.query);

            return res.status(200).json({
                status: true,
                message: 'Announcements retrieved successfully',
                result
            });
        } catch (error) {
            log.error('Error getting announcements:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to retrieve announcements',
                error: error.message
            });
        }
    },

    /**
     * Get a single announcement by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and announcement data
     */
    getAnnouncementById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid announcement ID'
                });
            }

            const announcement = await announcementDbHandler.getById(id);

            if (!announcement) {
                return res.status(404).json({
                    status: false,
                    message: 'Announcement not found'
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Announcement retrieved successfully',
                result: announcement
            });
        } catch (error) {
            log.error('Error getting announcement by ID:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to retrieve announcement',
                error: error.message
            });
        }
    },

    /**
     * Update an announcement by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and updated announcement
     */
    updateAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;
            // Safely get admin ID if available
            const adminId = req.user && req.user.sub ? req.user.sub : null;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid announcement ID'
                });
            }

            // Check if announcement exists
            const existingAnnouncement = await announcementDbHandler.getById(id);
            if (!existingAnnouncement) {
                return res.status(404).json({
                    status: false,
                    message: 'Announcement not found'
                });
            }

            // Update the announcement
            const updateData = {
                ...req.body,
                updatedBy: adminId
            };

            const updatedAnnouncement = await announcementDbHandler.updateById(id, updateData);

            return res.status(200).json({
                status: true,
                message: 'Announcement updated successfully',
                result: updatedAnnouncement
            });
        } catch (error) {
            log.error('Error updating announcement:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to update announcement',
                error: error.message
            });
        }
    },

    /**
     * Delete an announcement by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and message
     */
    deleteAnnouncement: async (req, res) => {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid announcement ID'
                });
            }

            // Check if announcement exists
            const existingAnnouncement = await announcementDbHandler.getById(id);
            if (!existingAnnouncement) {
                return res.status(404).json({
                    status: false,
                    message: 'Announcement not found'
                });
            }

            // Delete the announcement
            await announcementDbHandler.deleteById(id);

            return res.status(200).json({
                status: true,
                message: 'Announcement deleted successfully'
            });
        } catch (error) {
            log.error('Error deleting announcement:', error);
            return res.status(500).json({
                status: false,
                message: 'Failed to delete announcement',
                error: error.message
            });
        }
    }
};
