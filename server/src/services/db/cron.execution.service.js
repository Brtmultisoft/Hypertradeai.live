'use strict';
const { cronExecutionModel } = require('../../models');
const logger = require('../logger');
const log = new logger('CronExecutionService').getChildLogger();

/**
 * Service for handling cron execution database operations
 */
class CronExecutionService {
    constructor() {
        this._model = cronExecutionModel;
    }

    /**
     * Create a new cron execution record
     * @param {Object} data - Cron execution data
     * @returns {Promise<Object>} Created cron execution record
     */
    async create(data) {
        try {
            log.info('Creating new cron execution record');
            return await this._model.create(data);
        } catch (error) {
            log.error('Error creating cron execution record:', error);
            throw error;
        }
    }

    /**
     * Get cron execution by ID
     * @param {String} id - Cron execution ID
     * @returns {Promise<Object>} Cron execution record
     */
    async getById(id) {
        try {
            log.info(`Getting cron execution with ID: ${id}`);
            return await this._model.findById(id);
        } catch (error) {
            log.error(`Error getting cron execution with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get cron executions by query
     * @param {Object} query - Query object
     * @returns {Promise<Array>} Array of cron execution records
     */
    async getByQuery(query) {
        try {
            log.info('Getting cron executions by query:', query);
            return await this._model.find(query);
        } catch (error) {
            log.error('Error getting cron executions by query:', error);
            throw error;
        }
    }

    /**
     * Get one cron execution by query
     * @param {Object} query - Query object
     * @returns {Promise<Object>} Cron execution record
     */
    async getOneByQuery(query) {
        try {
            log.info('Getting one cron execution by query:', query);
            return await this._model.findOne(query);
        } catch (error) {
            log.error('Error getting one cron execution by query:', error);
            throw error;
        }
    }

    /**
     * Update cron execution by ID
     * @param {String} id - Cron execution ID
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated cron execution record
     */
    async updateById(id, data) {
        try {
            log.info(`Updating cron execution with ID: ${id}`);
            return await this._model.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            log.error(`Error updating cron execution with ID ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update cron execution by query
     * @param {Object} query - Query object
     * @param {Object} data - Update data
     * @returns {Promise<Object>} Updated cron execution record
     */
    async updateByQuery(query, data) {
        try {
            log.info('Updating cron execution by query:', query);
            return await this._model.findOneAndUpdate(query, data, { new: true });
        } catch (error) {
            log.error('Error updating cron execution by query:', error);
            throw error;
        }
    }

    /**
     * Get the latest cron execution for a specific cron job
     * @param {String} cronName - Name of the cron job
     * @returns {Promise<Object>} Latest cron execution record
     */
    async getLatestExecution(cronName) {
        try {
            log.info(`Getting latest execution for cron job: ${cronName}`);
            return await this._model.findOne({ cron_name: cronName })
                .sort({ start_time: -1 })
                .limit(1);
        } catch (error) {
            log.error(`Error getting latest execution for cron job ${cronName}:`, error);
            throw error;
        }
    }

    /**
     * Get cron executions for a specific date
     * @param {String} cronName - Name of the cron job
     * @param {Date} date - Date to check
     * @returns {Promise<Array>} Array of cron execution records
     */
    async getExecutionsForDate(cronName, date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            log.info(`Getting executions for cron job ${cronName} on ${startOfDay.toISOString()}`);
            
            return await this._model.find({
                cron_name: cronName,
                start_time: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            }).sort({ start_time: -1 });
        } catch (error) {
            log.error(`Error getting executions for cron job ${cronName} on ${date}:`, error);
            throw error;
        }
    }
}

module.exports = new CronExecutionService();
