/**
 * Script to check the cron job configuration
 *
 * This script will:
 * 1. Check if the CRON_STATUS environment variable is set correctly
 * 2. Check if the cron job is scheduled correctly
 * 3. Check if the cron job has run recently
 * 4. Check if there are any errors in the cron execution records
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Define schemas
const cronExecutionSchema = new Schema({
  cron_name: String,
  start_time: Date,
  end_time: Date,
  status: String,
  processed_count: Number,
  total_amount: Number,
  error_count: Number,
  error_details: Array,
  execution_details: Object
});

async function checkCronConfig() {
  try {
    console.log('Checking cron job configuration...');

    // Check environment variables
    console.log('\n1. Environment Variables:');
    console.log(`CRON_STATUS: ${process.env.CRON_STATUS}`);
    if (process.env.CRON_STATUS !== '1') {
      console.log('WARNING: CRON_STATUS is not set to 1. Cron jobs are disabled!');
    }

    console.log(`APP_API_KEY: ${process.env.APP_API_KEY ? 'Set' : 'Not set'}`);
    if (!process.env.APP_API_KEY) {
      console.log('WARNING: APP_API_KEY is not set. Cron jobs will fail authentication!');
    }

    // Check cron controller file
    console.log('\n2. Cron Controller Configuration:');
    const cronControllerPath = path.join(__dirname, 'src', 'controllers', 'user', 'cron.controller.js');

    if (fs.existsSync(cronControllerPath)) {
      const cronControllerContent = fs.readFileSync(cronControllerPath, 'utf8');

      // Check if daily profit cron is scheduled
      const dailyProfitCronRegex = /cron\.schedule\(['"]0 0 \* \* \*['"],\s*processDailyTradingProfitWithErrorHandling/;
      const isDailyProfitCronScheduled = dailyProfitCronRegex.test(cronControllerContent);

      console.log(`Daily profit cron scheduled: ${isDailyProfitCronScheduled ? 'Yes' : 'No'}`);

      if (!isDailyProfitCronScheduled) {
        console.log('WARNING: Daily profit cron job is not properly scheduled!');
      }

      // Check backup cron
      const backupCronRegex = /cron\.schedule\(['"]30 0 \* \* \*['"],/;
      const isBackupCronScheduled = backupCronRegex.test(cronControllerContent);

      console.log(`Backup cron scheduled: ${isBackupCronScheduled ? 'Yes' : 'No'}`);

      if (!isBackupCronScheduled) {
        console.log('WARNING: Backup cron job is not properly scheduled!');
      }
    } else {
      console.log(`ERROR: Cron controller file not found at ${cronControllerPath}`);
    }

    // Check system cron configuration
    console.log('\n3. System Cron Configuration:');

    if (process.platform === 'win32') {
      console.log('Running on Windows. Checking scheduled tasks...');

      // On Windows, we would check scheduled tasks
      // This is a simplified check - in a real scenario, you'd use the Windows API
      const triggerBatchPath = path.join(__dirname, 'trigger-daily-profit.bat');
      const monitorBatchPath = path.join(__dirname, 'monitor-crons.bat');

      console.log(`Trigger batch file exists: ${fs.existsSync(triggerBatchPath) ? 'Yes' : 'No'}`);
      console.log(`Monitor batch file exists: ${fs.existsSync(monitorBatchPath) ? 'Yes' : 'No'}`);
    } else {
      console.log('Running on Linux/Unix. Checking crontab...');

      // On Linux, we would check crontab
      // This is a simplified check - in a real scenario, you'd use the crontab command
      const setupCronPath = path.join(__dirname, 'setup-system-cron.js');

      console.log(`Setup cron script exists: ${fs.existsSync(setupCronPath) ? 'Yes' : 'No'}`);
    }

    // Connect to MongoDB and check cron execution records
    console.log('\n4. Cron Execution Records:');
    console.log('Connecting to MongoDB...');

    // Use the connection string directly since .env might not be loaded correctly
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('Connected to MongoDB successfully');

    // Register models
    const CronExecution = mongoose.model('CronExecution', cronExecutionSchema);

    // Get recent cron executions
    const recentExecutions = await CronExecution.find({
      cron_name: 'daily_profit'
    }).sort({ start_time: -1 }).limit(5);

    console.log(`Found ${recentExecutions.length} recent cron execution records`);

    if (recentExecutions.length > 0) {
      console.log('\nRecent cron executions:');

      for (const execution of recentExecutions) {
        console.log(`\nExecution ID: ${execution._id}`);
        console.log(`Start time: ${execution.start_time}`);
        console.log(`End time: ${execution.end_time || 'Not completed'}`);
        console.log(`Status: ${execution.status}`);
        console.log(`Processed count: ${execution.processed_count}`);
        console.log(`Total amount: ${execution.total_amount}`);
        console.log(`Error count: ${execution.error_count}`);

        if (execution.error_count > 0 && execution.error_details && execution.error_details.length > 0) {
          console.log('Error details:');
          console.log(JSON.stringify(execution.error_details, null, 2));
        }

        if (execution.execution_details) {
          console.log('Execution details:');
          console.log(JSON.stringify(execution.execution_details, null, 2));
        }
      }

      // Check if the most recent execution was successful
      const latestExecution = recentExecutions[0];
      if (latestExecution.status === 'completed' || latestExecution.status === 'partial_success') {
        console.log('\nLatest cron execution was successful');

        if (latestExecution.processed_count === 0) {
          console.log('WARNING: Latest cron execution processed 0 records!');
        }
      } else {
        console.log('\nWARNING: Latest cron execution was not successful!');
      }
    } else {
      console.log('No cron execution records found');
    }

    // Check log files
    console.log('\n5. Log Files:');
    const logDir = path.join(__dirname, 'logs');

    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir);
      console.log(`Found ${logFiles.length} log files in ${logDir}`);

      const cronLogFile = path.join(logDir, 'cron-execution.log');
      if (fs.existsSync(cronLogFile)) {
        console.log(`Cron execution log file exists: ${cronLogFile}`);

        // Read the last few lines of the log file
        const logContent = fs.readFileSync(cronLogFile, 'utf8');
        const logLines = logContent.trim().split('\n');

        if (logLines.length > 0) {
          console.log('\nLast log entry:');
          try {
            const lastLog = JSON.parse(logLines[logLines.length - 1]);
            console.log(JSON.stringify(lastLog, null, 2));
          } catch (error) {
            console.log(logLines[logLines.length - 1]);
          }
        } else {
          console.log('Log file is empty');
        }
      } else {
        console.log(`WARNING: Cron execution log file not found: ${cronLogFile}`);
      }
    } else {
      console.log(`WARNING: Log directory not found: ${logDir}`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

    console.log('\nCron configuration check completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
checkCronConfig();
