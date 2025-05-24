/**
 * Master script to run trade activation updates in the correct sequence
 * 
 * This script will:
 * 1. First update trade activations with correct data
 * 2. Then fix dates and ensure proper sequencing
 * 3. Provide comprehensive reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with colors
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}🚀 ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}📋 ${msg}${colors.reset}`)
};

// Run a script and return a promise
const runScript = (scriptPath, scriptName) => {
  return new Promise((resolve, reject) => {
    log.step(`Starting ${scriptName}...`);
    
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        log.success(`${scriptName} completed successfully`);
        resolve(code);
      } else {
        log.error(`${scriptName} failed with exit code ${code}`);
        reject(new Error(`${scriptName} failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      log.error(`Failed to start ${scriptName}: ${error.message}`);
      reject(error);
    });
  });
};

// Check if script files exist
const checkScriptFiles = () => {
  const scripts = [
    'update-trade-activations-with-correct-data.js',
    'fix-activation-dates-and-sequence.js'
  ];
  
  const missingScripts = scripts.filter(script => {
    const scriptPath = path.join(__dirname, script);
    return !fs.existsSync(scriptPath);
  });
  
  if (missingScripts.length > 0) {
    log.error(`Missing script files: ${missingScripts.join(', ')}`);
    return false;
  }
  
  return true;
};

// Create backup before running scripts
const createBackupInfo = () => {
  const backupInfo = {
    timestamp: new Date().toISOString(),
    scripts_to_run: [
      'update-trade-activations-with-correct-data.js',
      'fix-activation-dates-and-sequence.js'
    ],
    purpose: 'Update trade activations with correct data and fix dates',
    backup_recommendation: 'Consider creating a database backup before running these scripts'
  };
  
  const backupPath = path.join(__dirname, 'backup-info.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupInfo, null, 2));
  log.info(`Backup info created at: ${backupPath}`);
};

// Main execution function
const runAllScripts = async () => {
  try {
    log.header('Trade Activation Update Process');
    console.log('');
    
    // Check if all required files exist
    if (!checkScriptFiles()) {
      process.exit(1);
    }
    
    // Create backup info
    createBackupInfo();
    
    log.warning('IMPORTANT: Make sure you have a database backup before proceeding!');
    log.info('This process will update trade activations and income records.');
    console.log('');
    
    // Wait for user confirmation in production
    if (process.env.NODE_ENV === 'production') {
      log.warning('Running in production mode. Please confirm you want to proceed.');
      log.info('Press Ctrl+C to cancel, or wait 10 seconds to continue...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    const startTime = Date.now();
    
    // Step 1: Update trade activations with correct data
    log.header('Step 1: Updating trade activations with correct data');
    await runScript(
      path.join(__dirname, 'update-trade-activations-with-correct-data.js'),
      'Trade Activation Data Update'
    );
    
    console.log('');
    log.info('Waiting 5 seconds before next step...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Fix dates and sequence
    log.header('Step 2: Fixing activation dates and sequence');
    await runScript(
      path.join(__dirname, 'fix-activation-dates-and-sequence.js'),
      'Date and Sequence Fix'
    );
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('');
    log.header('🎉 All scripts completed successfully!');
    log.success(`Total execution time: ${duration} seconds`);
    
    // Create completion report
    const completionReport = {
      completed_at: new Date().toISOString(),
      execution_time_seconds: duration,
      scripts_executed: [
        'update-trade-activations-with-correct-data.js',
        'fix-activation-dates-and-sequence.js'
      ],
      status: 'completed_successfully',
      next_steps: [
        'Verify the updated data in the database',
        'Check that profit dates are set to next day after activation',
        'Run the daily profit cron job to test the updated system',
        'Monitor for any issues in the logs'
      ]
    };
    
    const reportPath = path.join(__dirname, 'update-completion-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(completionReport, null, 2));
    log.success(`Completion report created at: ${reportPath}`);
    
    console.log('');
    log.info('Next steps:');
    completionReport.next_steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });
    
  } catch (error) {
    log.error(`Script execution failed: ${error.message}`);
    
    // Create error report
    const errorReport = {
      failed_at: new Date().toISOString(),
      error_message: error.message,
      status: 'failed',
      recommendation: 'Check the error logs and fix any issues before retrying'
    };
    
    const errorPath = path.join(__dirname, 'update-error-report.json');
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    log.error(`Error report created at: ${errorPath}`);
    
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  log.warning('Process interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log.warning('Process terminated');
  process.exit(1);
});

// Display startup information
console.log('');
log.header('Trade Activation Update Script Runner');
console.log('');
log.info('This script will run the following operations:');
console.log('   1. Update trade activations with correct profit data');
console.log('   2. Fix dates to ensure credited dates are next day after activation');
console.log('   3. Create/update corresponding income records');
console.log('   4. Verify data consistency');
console.log('');

// Check environment
if (process.env.NODE_ENV === 'production') {
  log.warning('Running in PRODUCTION environment');
} else {
  log.info('Running in development environment');
}

console.log('');

// Run the scripts
runAllScripts();
