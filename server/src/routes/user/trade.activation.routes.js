'use strict';
const express = require('express');
const router = express.Router();
const { userTradeActivationController } = require('../../controllers');
const { userAuthenticateMiddleware } = require('../../middlewares');

// Apply authentication middleware to all routes
router.use(userAuthenticateMiddleware);

// Activate daily trading
router.post('/activate-daily-trading', userTradeActivationController.activateDailyTrading);

// Get daily trading status
router.get('/daily-trading-status', userTradeActivationController.getDailyTradingStatus);

// Get activation history
router.get('/activation-history', userTradeActivationController.getActivationHistory);

module.exports = router;
