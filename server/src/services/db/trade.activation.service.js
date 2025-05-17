'use strict';
const { tradeActivationModel } = require('../../models');
const logger = require('../logger');
const log = new logger('TradeActivationService').getChildLogger();

/**
 * Service for handling trade activation database operations
 */
class TradeActivationService {
    constructor() {
        this._model = tradeActivationModel;
    }

    /**
     * Create a new trade activation record
     * @param {Object} data - Trade activation data
     * @returns {Promise<Object>} Created trade activation record
     */
    async create(data) {
        try {
            log.info('Creating new trade activation record');
            return await this._model.create(data);
        } catch (error) {
            log.error('Error creating trade activation record:', error);
            throw error;
        }
    }

    /**
     * Get trade activation by ID
     * @param {String} id - Trade activation ID
     * @returns {Promise<Object>} Trade activation record
     */
    async getById(id) {
        try {
            log.info(`Getting trade activation with ID: ${id}`);
            return await this._model.findById(id);
        } catch (error) {
            log.error(`Error getting trade activation with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get trade activations by query
     * @param {Object} query - Query object
     * @returns {Promise<Array>} Array of trade activation records
     */
    async getByQuery(query) {
        try {
            log.info('Getting trade activations by query:', query);
            return await this._model.find(query);
        } catch (error) {
            log.error('Error getting trade activations by query:', error);
            throw error;
        }
    }

    /**
     * Get one trade activation by query
     * @param {Object} query - Query object
     * @returns {Promise<Object>} Trade activation record
     */
    async getOneByQuery(query) {
        try {
            log.info('Getting one trade activation by query:', query);
            return await this._model.findOne(query);
        } catch (error) {
            log.error('Error getting one trade activation by query:', error);
            throw error;
        }
    }

    /**
     * Update trade activation by ID
     * @param {String} id - Trade activation ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated trade activation record
     */
    async updateById(id, data) {
        try {
            log.info(`Updating trade activation with ID: ${id}`);
            return await this._model.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            log.error(`Error updating trade activation with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update trade activation by query
     * @param {Object} query - Query object
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated trade activation record
     */
    async updateByQuery(query, data) {
        try {
            log.info('Updating trade activation by query:', query);
            return await this._model.findOneAndUpdate(query, data, { new: true });
        } catch (error) {
            log.error('Error updating trade activation by query:', error);
            throw error;
        }
    }

    /**
     * Delete trade activation by ID
     * @param {String} id - Trade activation ID
     * @returns {Promise<Object>} Deleted trade activation record
     */
    async deleteById(id) {
        try {
            log.info(`Deleting trade activation with ID: ${id}`);
            return await this._model.findByIdAndDelete(id);
        } catch (error) {
            log.error(`Error deleting trade activation with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get today's trade activation for a user
     * @param {String} userId - User ID
     * @returns {Promise<Object>} Today's trade activation record
     */
    async getTodayActivation(userId) {
        try {
            log.info(`Getting today's trade activation for user: ${userId}`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            return await this._model.findOne({
                user_id: userId,
                activation_date: {
                    $gte: today,
                    $lt: tomorrow
                }
            });
        } catch (error) {
            log.error(`Error getting today's trade activation for user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new TradeActivationService();
