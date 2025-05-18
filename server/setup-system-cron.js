/**
 * System Cron Setup Script
 * 
 * This script sets up system cron jobs to ensure the Node.js cron jobs run reliably.
 * It creates a crontab entry that will trigger the daily profit cron job at 1 AM UTC.
 * 
 * Usage:
 * node setup-system-cron.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const TRIGGER_SCRIPT_PATH = path.join(PROJECT_ROOT, 'src', 'scripts', 'trigger-daily-profit.js');
const MONITOR_SCRIPT_PATH = path.join(PROJECT_ROOT, 'src', 'scripts', 'monitor-crons.js');
const LOG_DIR = path.join(PROJECT_ROOT, 'logs');

// Ensure the logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create the trigger script if it doesn't exist
if (!fs.existsSync(TRIGGER_SCRIPT_PATH)) {
  console.error(`Trigger script not found at ${TRIGGER_SCRIPT_PATH}`);
  process.exit(1);
}

// Create the monitor script if it doesn't exist
if (!fs.existsSync(MONITOR_SCRIPT_PATH)) {
  console.error(`Monitor script not found at ${MONITOR_SCRIPT_PATH}`);
  process.exit(1);
}

/**
 * Set up system cron jobs
 */
function setupSystemCron() {
  // Check if we're on a Unix-like system
  if (os.platform() === 'win32') {
    console.log('Windows detected. Setting up Windows Task Scheduler tasks...');
    setupWindowsTasks();
  } else {
    console.log('Unix-like system detected. Setting up crontab entries...');
    setupUnixCron();
  }
}

/**
 * Set up crontab entries on Unix-like systems
 */
function setupUnixCron() {
  // Get the current crontab
  exec('crontab -l', (error, stdout, stderr) => {
    let crontab = '';
    
    if (error) {
      if (error.code === 1) {
        // No crontab for this user
        console.log('No existing crontab found. Creating a new one.');
      } else {
        console.error(`Error getting current crontab: ${error.message}`);
        return;
      }
    } else {
      crontab = stdout;
    }
    
    // Check if our cron jobs are already in the crontab
    const triggerJobExists = crontab.includes(TRIGGER_SCRIPT_PATH);
    const monitorJobExists = crontab.includes(MONITOR_SCRIPT_PATH);
    
    if (!triggerJobExists) {
      // Add the trigger job to run at 1 AM UTC
      crontab += `\n# Daily profit cron job - runs at 1 AM UTC\n`;
      crontab += `0 1 * * * cd ${PROJECT_ROOT} && /usr/bin/node ${TRIGGER_SCRIPT_PATH} >> ${LOG_DIR}/cron-trigger.log 2>&1\n`;
    }
    
    if (!monitorJobExists) {
      // Add the monitor job to run every hour
      crontab += `\n# Cron job monitor - runs every hour\n`;
      crontab += `0 * * * * cd ${PROJECT_ROOT} && /usr/bin/node ${MONITOR_SCRIPT_PATH} >> ${LOG_DIR}/cron-monitor.log 2>&1\n`;
    }
    
    // Write the updated crontab
    fs.writeFileSync('/tmp/crontab.txt', crontab);
    exec('crontab /tmp/crontab.txt', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error setting up crontab: ${error.message}`);
        return;
      }
      
      console.log('Crontab updated successfully!');
      console.log('The following cron jobs have been set up:');
      console.log('1. Daily profit cron job - runs at 1 AM UTC');
      console.log('2. Cron job monitor - runs every hour');
    });
  });
}

/**
 * Set up Windows Task Scheduler tasks
 */
function setupWindowsTasks() {
  // Create a batch file to run the trigger script
  const triggerBatchPath = path.join(PROJECT_ROOT, 'run-daily-profit.bat');
  const triggerBatchContent = `@echo off
cd /d "${PROJECT_ROOT}"
node "${TRIGGER_SCRIPT_PATH}" >> "${LOG_DIR}\\cron-trigger.log" 2>&1
`;
  fs.writeFileSync(triggerBatchPath, triggerBatchContent);
  
  // Create a batch file to run the monitor script
  const monitorBatchPath = path.join(PROJECT_ROOT, 'monitor-crons.bat');
  const monitorBatchContent = `@echo off
cd /d "${PROJECT_ROOT}"
node "${MONITOR_SCRIPT_PATH}" >> "${LOG_DIR}\\cron-monitor.log" 2>&1
`;
  fs.writeFileSync(monitorBatchPath, monitorBatchContent);
  
  // Create the scheduled tasks
  const triggerTaskCmd = `schtasks /create /tn "HypertradeAI Daily Profit" /tr "${triggerBatchPath}" /sc daily /st 01:00 /ru System /f`;
  const monitorTaskCmd = `schtasks /create /tn "HypertradeAI Cron Monitor" /tr "${monitorBatchPath}" /sc hourly /st 00:00 /ru System /f`;
  
  console.log('Creating Windows scheduled tasks...');
  console.log('Please run the following commands as Administrator:');
  console.log(triggerTaskCmd);
  console.log(monitorTaskCmd);
  
  console.log('\nAlternatively, you can set up the tasks manually in Task Scheduler:');
  console.log(`1. Daily profit task: Run "${triggerBatchPath}" daily at 1:00 AM`);
  console.log(`2. Monitor task: Run "${monitorBatchPath}" hourly`);
}

// Run the setup function
setupSystemCron();
