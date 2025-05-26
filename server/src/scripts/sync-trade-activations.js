'use strict';

/**
 * Script to check all users with dailyProfitActivated=true and ensure they have
 * a corresponding trade activation record for today.
 * 
 * This script will:
 * 1. Find all users with dailyProfitActivated=true
 * 2. For each user, check if they have a trade activation record for today
 * 3. If no record exists, create a new trade activation record
 * 
 * Usage: node sync-trade-activations.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { userModel, tradeActivationModel } = require('../models');
const logger = require('../services/logger');
const log = new logger('SyncTradeActivations').getChildLogger();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    log.info('MongoDB connected successfully');
  } catch (error) {
    log.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create trade activation record for a user
const createTradeActivation = async (user) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to midnight

    const activationData = {
      user_id: user._id,
      activation_date: now,
      activation_time: now.toTimeString().split(' ')[0], // HH:MM:SS
      ip_address: 'Script generated',
      device_info: {
        userAgent: 'Script generated',
        platform: 'Script generated'
      },
      status: 'active',
      expiry_date: tomorrow,
      metadata: {
        user_email: user.email,
        username: user.username
      }
    };

    const activation = await tradeActivationModel.create(activationData);
    log.info(`Created trade activation record for user ${user._id} (${user.username || user.email})`);
    return activation;
  } catch (error) {
    log.error(`Error creating trade activation for user ${user._id}:`, error);
    return null;
  }
};

// Check if user has a trade activation record for today
const hasTradeActivationForToday = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const count = await tradeActivationModel.countDocuments({
      user_id: userId,
      activation_date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    return count > 0;
  } catch (error) {
    log.error(`Error checking trade activation for user ${userId}:`, error);
    return false;
  }
};

// Main function to sync trade activations
const syncTradeActivations = async () => {
  try {
    // Find all users with dailyProfitActivated=true
    const users = await userModel.find({ dailyProfitActivated: true });
    log.info(`Found ${users.length} users with dailyProfitActivated=true`);
    
    let createdCount = 0;
    let alreadyExistsCount = 0;
    
    // Process each user
    for (const user of users) {
      // Check if user has a trade activation record for today
      const hasActivation = await hasTradeActivationForToday(user._id);
      
      if (hasActivation) {
        log.info(`User ${user._id} (${user.username || user.email}) already has a trade activation record for today`);
        alreadyExistsCount++;
      } else {
        // Create a new trade activation record
        const activation = await createTradeActivation(user);
        if (activation) {
          createdCount++;
        }
      }
    }
    
    log.info(`Sync completed. Created ${createdCount} new trade activation records. ${alreadyExistsCount} users already had records.`);
  } catch (error) {
    log.error('Error syncing trade activations:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    log.info('MongoDB disconnected');
  }
};

// Run the script
connectDB().then(() => {
  log.info('Starting trade activation sync...');
  syncTradeActivations();
});
