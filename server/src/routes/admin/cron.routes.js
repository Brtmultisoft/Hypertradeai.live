'use strict';

const express = require('express');
const router = express.Router();
const cronController = require('../../controllers/admin/cron.controller');
const { adminMiddleware } = require('../../middlewares');

/**
 * @route GET /api/v1/admin/cron/executions
 * @desc Get cron execution history with pagination
 * @access Admin
 */
router.get('/executions', adminMiddleware, cronController.getCronExecutionHistory);

/**
 * @route GET /api/v1/admin/cron/executions/:id
 * @desc Get cron execution details by ID
 * @access Admin
 */
router.get('/executions/:id', adminMiddleware, cronController.getCronExecutionDetails);

/**
 * @route GET /api/v1/admin/cron/executions/:id/activations
 * @desc Get trade activations for a specific cron execution
 * @access Admin
 */
router.get('/executions/:id/activations', adminMiddleware, cronController.getCronExecutionActivations);

/**
 * @route GET /api/v1/admin/cron/daily-profit-summary
 * @desc Get daily profit summary by date
 * @access Admin
 */
router.get('/daily-profit-summary', adminMiddleware, cronController.getDailyProfitSummary);

module.exports = router;
