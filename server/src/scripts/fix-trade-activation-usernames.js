'use strict';

/**
 * Script to fix trade activations where username is the same as email
 * 
 * This script will:
 * 1. Find all trade activations where username is the same as email
 * 2. Update the username to be either the user's name or the part before @ in the email
 * 
 * Usage: node fix-trade-activation-usernames.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { tradeActivationModel, userModel } = require('../models');
const logger = require('../services/logger');
const log = new logger('FixTradeActivationUsernames').getChildLogger();

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

// Fix username for a trade activation
const fixUsername = async (activation, userData) => {
  try {
    // Get current metadata
    const metadata = activation.metadata || {};
    const currentUsername = metadata.username;
    const email = metadata.user_email || userData.email;
    
    // Skip if username is not the same as email or if email is not available
    if (!email || currentUsername !== email) {
      return { updated: false, reason: 'Username is not the same as email' };
    }
    
    // Get proper username
    let displayUsername = currentUsername;
    
    // If name exists, use that
    if (userData.name && userData.name.trim()) {
      displayUsername = userData.name;
    } else {
      // Otherwise use the part before @ in email
      const emailParts = email.split('@');
      displayUsername = emailParts[0] || currentUsername;
    }
    
    // Skip if no change
    if (displayUsername === currentUsername) {
      return { updated: false, reason: 'No change needed' };
    }
    
    // Update metadata
    metadata.username = displayUsername;
    
    // Update the activation record
    await tradeActivationModel.findByIdAndUpdate(
      activation._id,
      { metadata: metadata }
    );
    
    log.info(`Updated username for activation ${activation._id} from "${currentUsername}" to "${displayUsername}"`);
    return { updated: true };
  } catch (error) {
    log.error(`Error fixing username for activation ${activation._id}:`, error);
    return { updated: false, reason: error.message };
  }
};

// Main function to fix trade activations
const fixTradeActivations = async () => {
  try {
    // Find all trade activations
    const activations = await tradeActivationModel.find({}).lean();
    log.info(`Found ${activations.length} trade activations`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each activation
    for (const activation of activations) {
      try {
        // Skip if no metadata or no username/email
        if (!activation.metadata || !activation.metadata.username || !activation.metadata.user_email) {
          log.info(`Activation ${activation._id} has incomplete metadata, skipping`);
          skippedCount++;
          continue;
        }
        
        // Skip if username is not the same as email
        if (activation.metadata.username !== activation.metadata.user_email) {
          log.info(`Activation ${activation._id} already has a different username, skipping`);
          skippedCount++;
          continue;
        }
        
        // Find the user for this activation
        const user = await userModel.findById(activation.user_id).lean();
        
        if (!user) {
          log.warn(`User not found for activation ${activation._id} with user_id ${activation.user_id}`);
          errorCount++;
          continue;
        }
        
        // Fix the username
        const result = await fixUsername(activation, user);
        
        if (result.updated) {
          updatedCount++;
        } else {
          log.info(`Skipped activation ${activation._id}: ${result.reason}`);
          skippedCount++;
        }
      } catch (activationError) {
        log.error(`Error processing activation ${activation._id}:`, activationError);
        errorCount++;
      }
    }
    
    log.info(`Fix completed. Results:
      - Total activations: ${activations.length}
      - Updated: ${updatedCount}
      - Skipped: ${skippedCount}
      - Errors: ${errorCount}
    `);
  } catch (error) {
    log.error('Error fixing trade activations:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    log.info('MongoDB disconnected');
  }
};

// Run the script
connectDB().then(() => {
  log.info('Starting trade activation username fix...');
  fixTradeActivations();
});
