/**
 * Missed Cron Job Recovery Script
 *
 * This script checks for missed cron jobs and runs them if necessary.
 * It should be run after server startup to ensure no cron jobs are missed.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import required controllers and models
const cronController = require('../controllers/user/cron.controller');
const { cronExecutionDbHandler, tradeActivationDbHandler } = require('../services/db');

/**
 * Check for and recover missed daily profit cron jobs
 */
async function recoverMissedDailyProfitCrons() {
  try {
    console.log('[RECOVERY] Starting missed daily profit cron recovery');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('[RECOVERY] Connecting to MongoDB');
      try {
        const connectDatabase = require('../utils/connection');
        await connectDatabase();
        console.log('[RECOVERY] MongoDB connection established');
      } catch (dbError) {
        console.error('[RECOVERY] Failed to connect to MongoDB:', dbError);
        return { success: false, message: 'Failed to connect to MongoDB', error: dbError.message };
      }
    }

    // Get the current date
    const now = new Date();

    // Check if daily profit cron has run today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if there's a successful execution today
    const todayExecutions = await cronExecutionDbHandler.getByQuery({
      cron_name: 'daily_profit',
      start_time: { $gte: today, $lt: tomorrow },
      status: { $in: ['completed', 'partial_success'] }
    });

    if (todayExecutions.length > 0) {
      console.log('[RECOVERY] Daily profit cron has already run successfully today');
      return { success: true, message: 'Daily profit cron has already run successfully today' };
    }

    // Check if there are any pending trade activations for today
    const pendingActivations = await tradeActivationDbHandler.getByQuery({
      activation_date: { $gte: today, $lt: tomorrow },
      status: 'active',
      profit_status: 'pending'
    });

    if (pendingActivations.length === 0) {
      console.log('[RECOVERY] No pending trade activations found for today');
      return { success: true, message: 'No pending trade activations found for today' };
    }

    console.log(`[RECOVERY] Found ${pendingActivations.length} pending trade activations for today`);

    // Check if it's past the scheduled cron time (1 AM UTC)
    const cronTime = new Date(today);
    cronTime.setUTCHours(1, 0, 0, 0);

    if (now < cronTime) {
      console.log('[RECOVERY] It\'s not yet time for the daily profit cron to run');
      return { success: true, message: 'It\'s not yet time for the daily profit cron to run' };
    }

    // Run the daily profit cron job with 'recovery' trigger type
    console.log('[RECOVERY] Running daily profit cron job');
    const result = await cronController._processDailyTradingProfit('recovery');

    if (result.success) {
      console.log(`[RECOVERY] Successfully recovered daily profit cron job. Processed ${result.processedCount} investments with total profit of $${result.totalProfit}`);
      return { success: true, message: 'Successfully recovered daily profit cron job', result };
    } else {
      console.error(`[RECOVERY] Failed to recover daily profit cron job: ${result.error}`);
      return { success: false, message: 'Failed to recover daily profit cron job', error: result.error };
    }
  } catch (error) {
    console.error('[RECOVERY] Error recovering missed daily profit crons:', error);
    return { success: false, message: 'Error recovering missed daily profit crons', error: error.message };
  }
}

/**
 * Main recovery function
 */
async function recoverMissedCrons() {
  try {
    console.log(`[RECOVERY] Starting missed cron recovery at ${new Date().toISOString()}`);

    // Recover missed daily profit crons
    const dailyProfitResult = await recoverMissedDailyProfitCrons();

    console.log(`[RECOVERY] Missed cron recovery completed at ${new Date().toISOString()}`);

    // Disconnect from MongoDB if we connected in this script
    if (mongoose.connection.readyState === 1 && process.env.NODE_ENV !== 'production') {
      await mongoose.disconnect();
    }

    return {
      success: true,
      dailyProfitResult
    };
  } catch (error) {
    console.error('[RECOVERY] Error recovering missed crons:', error);

    // Disconnect from MongoDB if we connected in this script
    if (mongoose.connection.readyState === 1 && process.env.NODE_ENV !== 'production') {
      await mongoose.disconnect();
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Run the recovery function if this script is executed directly
if (require.main === module) {
  recoverMissedCrons()
    .then(result => {
      console.log('[RECOVERY] Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('[RECOVERY] Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = {
  recoverMissedCrons,
  recoverMissedDailyProfitCrons
};
