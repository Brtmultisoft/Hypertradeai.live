'use strict';

const { cronExecutionDbHandler, tradeActivationDbHandler } = require('../../services/db');
const { paginationHelper } = require('../../helpers');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

/**
 * Get cron execution history with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with cron execution history
 */
const getCronExecutionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, cron_name, status, start_date, end_date, triggered_by } = req.query;
    
    // Build query
    const query = {};
    
    if (cron_name) {
      query.cron_name = cron_name;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (triggered_by) {
      query.triggered_by = triggered_by;
    }
    
    if (start_date || end_date) {
      query.start_time = {};
      
      if (start_date) {
        const startDate = new Date(start_date);
        startDate.setHours(0, 0, 0, 0);
        query.start_time.$gte = startDate;
      }
      
      if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        query.start_time.$lte = endDate;
      }
    }
    
    // Get paginated results
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { start_time: -1 }
    };
    
    const cronExecutions = await cronExecutionDbHandler._model.paginate(query, options);
    
    return res.status(200).json({
      status: true,
      message: 'Cron execution history retrieved successfully',
      data: paginationHelper.getPaginationResponse(cronExecutions)
    });
  } catch (error) {
    console.error('Error getting cron execution history:', error);
    return res.status(500).json({
      status: false,
      message: 'Error getting cron execution history',
      error: error.message
    });
  }
};

/**
 * Get cron execution details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with cron execution details
 */
const getCronExecutionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid cron execution ID'
      });
    }
    
    // Get cron execution details
    const cronExecution = await cronExecutionDbHandler.getById(id);
    
    if (!cronExecution) {
      return res.status(404).json({
        status: false,
        message: 'Cron execution not found'
      });
    }
    
    // Get trade activations for this cron execution
    const tradeActivations = await tradeActivationDbHandler.getByQuery({
      cron_execution_id: ObjectId(id)
    });
    
    // Count activations by status
    const activationStats = {
      total: tradeActivations.length,
      processed: 0,
      failed: 0,
      skipped: 0,
      pending: 0
    };
    
    tradeActivations.forEach(activation => {
      if (activation.profit_status === 'processed') {
        activationStats.processed++;
      } else if (activation.profit_status === 'failed') {
        activationStats.failed++;
      } else if (activation.profit_status === 'skipped') {
        activationStats.skipped++;
      } else if (activation.profit_status === 'pending') {
        activationStats.pending++;
      }
    });
    
    return res.status(200).json({
      status: true,
      message: 'Cron execution details retrieved successfully',
      data: {
        cronExecution,
        activationStats
      }
    });
  } catch (error) {
    console.error('Error getting cron execution details:', error);
    return res.status(500).json({
      status: false,
      message: 'Error getting cron execution details',
      error: error.message
    });
  }
};

/**
 * Get trade activations for a specific cron execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with trade activations
 */
const getCronExecutionActivations = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid cron execution ID'
      });
    }
    
    // Build query
    const query = {
      cron_execution_id: ObjectId(id)
    };
    
    if (status) {
      query.profit_status = status;
    }
    
    // Get paginated results
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { activation_date: -1 },
      populate: {
        path: 'user_id',
        select: 'email username'
      }
    };
    
    const tradeActivations = await tradeActivationDbHandler._model.paginate(query, options);
    
    return res.status(200).json({
      status: true,
      message: 'Trade activations retrieved successfully',
      data: paginationHelper.getPaginationResponse(tradeActivations)
    });
  } catch (error) {
    console.error('Error getting trade activations:', error);
    return res.status(500).json({
      status: false,
      message: 'Error getting trade activations',
      error: error.message
    });
  }
};

/**
 * Get daily profit summary by date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with daily profit summary
 */
const getDailyProfitSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to last 7 days if no dates provided
    const endDate = end_date ? new Date(end_date) : new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = start_date ? new Date(start_date) : new Date();
    if (!start_date) {
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);
    
    // Get daily profit cron executions in date range
    const cronExecutions = await cronExecutionDbHandler.getByQuery({
      cron_name: 'daily_profit',
      start_time: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    // Group by date
    const dailySummary = {};
    
    cronExecutions.forEach(execution => {
      const date = new Date(execution.start_time);
      date.setHours(0, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];
      
      if (!dailySummary[dateString]) {
        dailySummary[dateString] = {
          date: dateString,
          executions: 0,
          successful: 0,
          failed: 0,
          total_profit: 0,
          processed_count: 0,
          error_count: 0,
          total_duration_ms: 0
        };
      }
      
      dailySummary[dateString].executions++;
      
      if (execution.status === 'completed' || execution.status === 'partial_success') {
        dailySummary[dateString].successful++;
        dailySummary[dateString].total_profit += execution.total_amount || 0;
        dailySummary[dateString].processed_count += execution.processed_count || 0;
      } else {
        dailySummary[dateString].failed++;
      }
      
      dailySummary[dateString].error_count += execution.error_count || 0;
      dailySummary[dateString].total_duration_ms += execution.duration_ms || 0;
    });
    
    // Convert to array and sort by date
    const summaryArray = Object.values(dailySummary).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    return res.status(200).json({
      status: true,
      message: 'Daily profit summary retrieved successfully',
      data: summaryArray
    });
  } catch (error) {
    console.error('Error getting daily profit summary:', error);
    return res.status(500).json({
      status: false,
      message: 'Error getting daily profit summary',
      error: error.message
    });
  }
};

module.exports = {
  getCronExecutionHistory,
  getCronExecutionDetails,
  getCronExecutionActivations,
  getDailyProfitSummary
};
