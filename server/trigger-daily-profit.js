/**
 * Manual Daily Profit Trigger Script
 * 
 * This script manually triggers the daily profit cron job.
 * It can be used to test the cron job or to run it manually if the scheduled job fails.
 * 
 * Usage: node trigger-daily-profit.js
 */

// Load environment variables
require('dotenv').config();

// Import required modules
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a log file for this run
const logFile = path.join(logsDir, 'daily-profit-manual.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Function to log to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
}

// Import the cron controller
const cronController = require('./src/controllers/user/cron.controller');

/**
 * Manually trigger the daily profit cron job
 */
async function triggerDailyProfit() {
  log(`[MANUAL] Manually triggering daily profit cron job at ${new Date().toISOString()}`);
  
  try {
    // Connect to the database if not already connected
    if (mongoose.connection.readyState !== 1) {
      log('[MANUAL] Connecting to database...');
      await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      log('[MANUAL] Connected to database');
    }
    
    // Call the internal function directly with 'manual' trigger type
    log('[MANUAL] Calling _processDailyTradingProfit function...');
    const result = await cronController._processDailyTradingProfit('manual');
    
    if (result && result.success) {
      log(`[MANUAL] Daily profit processing completed successfully`);
      log(`[MANUAL] Processed ${result.processedCount} investments with total profit of $${result.totalProfit}`);
      log(`[MANUAL] Cron execution ID: ${result.cronExecutionId}`);
    } else {
      log(`[MANUAL] Daily profit processing failed: ${result ? result.error : 'Unknown error'}`);
    }
  } catch (error) {
    log(`[MANUAL] Error triggering daily profit cron job: ${error.message}`);
    log(error.stack);
  } finally {
    // Close the log stream
    logStream.end();
    
    // Exit the process
    process.exit(0);
  }
}

// Run the function
triggerDailyProfit();
