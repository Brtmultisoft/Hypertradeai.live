'use strict';

const express = require('express');
const router = express.Router();
const adminTradeActivationController = require('../../controllers/admin/trade.activation.controller');
const { adminAuthenticateMiddleware } = require('../../middlewares');

/**
 * @route GET /api/admin/trade-activations
 * @description Get all trade activations with filtering and pagination
 * @access Admin
 */
router.get('/trade-activations', adminTradeActivationController.getAllTradeActivations);

/**
 * @route GET /api/admin/trade-activations/profit-stats
 * @description Get profit distribution statistics
 * @access Admin
 */
router.get('/trade-activations/profit-stats', adminTradeActivationController.getProfitDistributionStats);

/**
 * @route POST /api/admin/trade-activations/sync
 * @description Sync trade activations for all users with dailyProfitActivated=true
 * @access Admin
 */
router.post('/trade-activations/sync', adminTradeActivationController.syncTradeActivations);

/**
 * @route POST /api/admin/trade-activations/update-metadata
 * @description Update metadata (username, email) for all trade activations
 * @access Admin
 */
router.post('/trade-activations/update-metadata', adminTradeActivationController.updateTradeActivationMetadata);

/**
 * @route POST /api/admin/trade-activations/update-profit-status
 * @description Update profit status for trade activations within a date range
 * @access Admin
 */
router.post('/trade-activations/update-profit-status', adminTradeActivationController.updateProfitStatus);

module.exports = router;
