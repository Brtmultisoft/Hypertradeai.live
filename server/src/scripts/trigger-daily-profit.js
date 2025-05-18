/**
 * Manual Trigger Script for Daily Profit Cron Job
 * 
 * This script manually triggers the daily profit cron job.
 * It can be used if the automatic cron job fails to run.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import the cron controller
const cronController = require('../controllers/user/cron.controller');

/**
 * Manually trigger the daily profit cron job
 */
async function triggerDailyProfit() {
  console.log(`[MANUAL] Manually triggering daily profit cron job at ${new Date().toISOString()}`);
  
  try {
    // Call the internal function directly
    const result = await cronController._processDailyTradingProfit();
    
    if (result.success) {
      console.log(`[MANUAL] Daily profit processing completed successfully`);
      console.log(`[MANUAL] Processed ${result.processedCount} investments with total profit of $${result.totalProfit}`);
    } else {
      console.error(`[MANUAL] Daily profit processing failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`[MANUAL] Error triggering daily profit cron job: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the function
triggerDailyProfit();
