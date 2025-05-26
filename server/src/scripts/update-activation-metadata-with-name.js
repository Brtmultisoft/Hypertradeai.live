'use strict';

/**
 * Script to update all trade activation metadata with proper name and email
 * 
 * This script will:
 * 1. Find all trade activations
 * 2. For each activation, fetch the user data
 * 3. Update the metadata with proper name and email
 * 
 * Usage: node update-activation-metadata-with-name.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { tradeActivationModel, userModel } = require('../models');
const logger = require('../services/logger');
const log = new logger('UpdateActivationMetadata').getChildLogger();

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

// Update metadata for a trade activation
const updateMetadata = async (activation, userData) => {
  try {
    // Create or update metadata object
    const metadata = activation.metadata || {};
    
    // Update email
    if (userData.email) {
      metadata.user_email = userData.email;
    }
    
    // Update name - use actual name if available, otherwise use username
    if (userData.name && userData.name.trim()) {
      metadata.name = userData.name;
    } else if (userData.username && userData.username !== userData.email) {
      metadata.name = userData.username;
    } else {
      // If username is same as email, use part before @
      const emailParts = userData.email.split('@');
      metadata.name = emailParts[0] || 'Unknown';
    }
    
    // Update username - this is for backward compatibility
    // If username is same as email, use the name or part before @
    let displayUsername = userData.username;
    if (displayUsername === userData.email) {
      if (userData.name && userData.name.trim()) {
        displayUsername = userData.name;
      } else {
        const emailParts = userData.email.split('@');
        displayUsername = emailParts[0] || userData.username;
      }
    }
    metadata.username = displayUsername;
    
    // Update the activation record
    await tradeActivationModel.findByIdAndUpdate(
      activation._id,
      { metadata: metadata }
    );
    
    log.info(`Updated metadata for activation ${activation._id}`);
    return true;
  } catch (error) {
    log.error(`Error updating metadata for activation ${activation._id}:`, error);
    return false;
  }
};

// Check if metadata needs update
const needsUpdate = (activation) => {
  return (
    !activation.metadata ||
    !activation.metadata.name ||
    (activation.metadata.username === activation.metadata.user_email)
  );
};

// Main function to update trade activations
const updateTradeActivations = async () => {
  try {
    // Find all trade activations
    const activations = await tradeActivationModel.find({}).lean();
    log.info(`Found ${activations.length} trade activations`);
    
    let updatedCount = 0;
    let alreadyCompleteCount = 0;
    let errorCount = 0;
    
    // Process each activation
    for (const activation of activations) {
      try {
        // Check if metadata already has name and username is not same as email
        if (!needsUpdate(activation)) {
          log.info(`Activation ${activation._id} already has complete metadata`);
          alreadyCompleteCount++;
          continue;
        }
        
        // Find the user for this activation
        const user = await userModel.findById(activation.user_id).lean();
        
        if (!user) {
          log.warn(`User not found for activation ${activation._id} with user_id ${activation.user_id}`);
          errorCount++;
          continue;
        }
        
        // Update the metadata
        const updated = await updateMetadata(activation, user);
        
        if (updated) {
          updatedCount++;
        } else {
          errorCount++;
        }
      } catch (activationError) {
        log.error(`Error processing activation ${activation._id}:`, activationError);
        errorCount++;
      }
    }
    
    log.info(`Update completed. Results:
      - Total activations: ${activations.length}
      - Updated: ${updatedCount}
      - Already complete: ${alreadyCompleteCount}
      - Errors: ${errorCount}
    `);
  } catch (error) {
    log.error('Error updating trade activations:', error);
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    log.info('MongoDB disconnected');
  }
};

// Run the script
connectDB().then(() => {
  log.info('Starting trade activation metadata update...');
  updateTradeActivations();
});
