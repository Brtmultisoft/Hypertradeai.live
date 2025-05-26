'use strict';
const logger = require('../../services/logger');
const log = new logger('UserAnnouncementController').getChildLogger();
const { announcementDbHandler } = require('../../services/db');
const { ObjectId } = require('mongodb');

module.exports = {
    /**
     * Get all active announcements for users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and announcements list
     */
    getAnnouncements: async (req, res) => {
        try {
            // Only return active announcements for users
            const query = {
                ...req.query,
                isActive: true
            };

            const result = await announcementDbHandler.getAll(query);

            return res.status(200).json({
                status: true,
                message: 'Announcements retrieved successfully',
                result
            });
        } catch (error) {
            log.error('Error getting announcements for user:', error);
            // Return empty result instead of error to prevent app crashes
            return res.status(200).json({
                status: true,
                message: 'No announcements available',
                result: {
                    list: [],
                    total: 0,
                    page: 1,
                    limit: 10,
                    pages: 0
                }
            });
        }
    },

    /**
     * Get a single announcement by ID for users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and announcement data
     */
    getAnnouncementById: async (req, res) => {
        try {
            const { id } = req.params;

            if (!ObjectId.isValid(id)) {
                return res.status(200).json({
                    status: true,
                    message: 'Announcement not found',
                    result: null
                });
            }

            // Only return active announcements for users
            const announcement = await announcementDbHandler.getOneByQuery({
                _id: id,
                isActive: true
            });

            if (!announcement) {
                return res.status(200).json({
                    status: true,
                    message: 'Announcement not found',
                    result: null
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Announcement retrieved successfully',
                result: announcement
            });
        } catch (error) {
            log.error('Error getting announcement by ID for user:', error);
            return res.status(200).json({
                status: true,
                message: 'Announcement not found',
                result: null
            });
        }
    },

    /**
     * Get announcements by category for users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} Response with status and announcements list
     */
    getAnnouncementsByCategory: async (req, res) => {
        try {
            const { category } = req.params;

            // Only return active announcements for users
            const query = {
                isActive: true,
                category
            };

            const announcements = await announcementDbHandler.getManyByQuery(query);

            return res.status(200).json({
                status: true,
                message: 'Announcements retrieved successfully',
                result: {
                    list: announcements,
                    total: announcements.length
                }
            });
        } catch (error) {
            log.error('Error getting announcements by category for user:', error);
            // Return empty result instead of error to prevent app crashes
            return res.status(200).json({
                status: true,
                message: 'No announcements available for this category',
                result: {
                    list: [],
                    total: 0
                }
            });
        }
    }
};
