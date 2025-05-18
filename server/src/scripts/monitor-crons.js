/**
 * Cron Job Monitoring Script
 * 
 * This script checks if cron jobs are running as expected and sends alerts if they're not.
 * It should be scheduled to run every hour using a system cron job or a service like PM2.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuration
const CRON_LOG_PATH = path.resolve(__dirname, '../../logs/cron-execution.log');
const ALERT_THRESHOLD_HOURS = 25; // Alert if a cron job hasn't run in this many hours
const CRON_JOBS = [
  { name: 'daily_roi', expectedTime: '01:00', maxDelayHours: 2 }
];

/**
 * Check if cron jobs are running as expected
 */
async function monitorCronJobs() {
  console.log(`[MONITOR] Starting cron job monitoring at ${new Date().toISOString()}`);
  
  try {
    // Check if log file exists
    if (!fs.existsSync(CRON_LOG_PATH)) {
      console.error(`[MONITOR] Cron log file not found at ${CRON_LOG_PATH}`);
      await sendAlert('Cron log file not found', `No cron log file found at ${CRON_LOG_PATH}. Cron jobs may not be running.`);
      return;
    }
    
    // Read log file
    const logContent = fs.readFileSync(CRON_LOG_PATH, 'utf8');
    const logLines = logContent.trim().split('\n');
    
    if (logLines.length === 0) {
      console.error('[MONITOR] Cron log file is empty');
      await sendAlert('Cron log file is empty', 'The cron log file exists but is empty. Cron jobs may not be running.');
      return;
    }
    
    // Parse log entries
    const logEntries = logLines.map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error(`[MONITOR] Error parsing log line: ${line}`);
        return null;
      }
    }).filter(entry => entry !== null);
    
    // Group log entries by job
    const jobEntries = {};
    for (const entry of logEntries) {
      if (!jobEntries[entry.job]) {
        jobEntries[entry.job] = [];
      }
      jobEntries[entry.job].push(entry);
    }
    
    // Check each cron job
    for (const job of CRON_JOBS) {
      const entries = jobEntries[job.name] || [];
      
      // Sort entries by timestamp (newest first)
      entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (entries.length === 0) {
        console.error(`[MONITOR] No log entries found for job ${job.name}`);
        await sendAlert(
          `No log entries for ${job.name}`,
          `No log entries found for cron job ${job.name}. The job may not be running.`
        );
        continue;
      }
      
      // Get the most recent entry
      const latestEntry = entries[0];
      const latestTimestamp = new Date(latestEntry.timestamp);
      const now = new Date();
      const hoursSinceLastRun = (now - latestTimestamp) / (1000 * 60 * 60);
      
      console.log(`[MONITOR] Job ${job.name} last ran ${hoursSinceLastRun.toFixed(2)} hours ago`);
      
      // Check if the job hasn't run in the expected time frame
      if (hoursSinceLastRun > ALERT_THRESHOLD_HOURS) {
        console.error(`[MONITOR] Job ${job.name} hasn't run in ${hoursSinceLastRun.toFixed(2)} hours`);
        await sendAlert(
          `Cron job ${job.name} not running`,
          `Cron job ${job.name} hasn't run in ${hoursSinceLastRun.toFixed(2)} hours. Last run: ${latestTimestamp.toISOString()}`
        );
      }
      
      // Check if the last run was successful
      if (latestEntry.status !== 'success') {
        console.error(`[MONITOR] Last run of job ${job.name} failed with status ${latestEntry.status}`);
        await sendAlert(
          `Cron job ${job.name} failed`,
          `Last run of cron job ${job.name} at ${latestTimestamp.toISOString()} failed with status ${latestEntry.status}`
        );
      }
    }
    
    console.log(`[MONITOR] Cron job monitoring completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`[MONITOR] Error monitoring cron jobs: ${error.message}`);
    console.error(error.stack);
    await sendAlert('Error monitoring cron jobs', `Error: ${error.message}\n\nStack: ${error.stack}`);
  }
}

/**
 * Send an alert via email or other notification channels
 */
async function sendAlert(subject, message) {
  console.log(`[ALERT] ${subject}: ${message}`);
  
  // Log the alert
  try {
    const alertLogPath = path.resolve(__dirname, '../../logs/cron-alerts.log');
    const alertEntry = {
      timestamp: new Date().toISOString(),
      subject,
      message
    };
    
    // Ensure logs directory exists
    if (!fs.existsSync(path.dirname(alertLogPath))) {
      fs.mkdirSync(path.dirname(alertLogPath), { recursive: true });
    }
    
    // Append to log file
    fs.appendFileSync(alertLogPath, JSON.stringify(alertEntry) + '\n');
  } catch (logError) {
    console.error(`[MONITOR] Error logging alert: ${logError.message}`);
  }
  
  // Send email alert if SMTP is configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER_NAME && process.env.SMTP_PASSWORD) {
    try {
      // Implementation for sending email alerts would go here
      // This would typically use nodemailer or a similar library
      console.log('[ALERT] Email alert would be sent here');
    } catch (emailError) {
      console.error(`[MONITOR] Error sending email alert: ${emailError.message}`);
    }
  }
}

// Run the monitoring function
monitorCronJobs();
