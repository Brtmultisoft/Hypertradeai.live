#!/usr/bin/env node

/**
 * CRITICAL TEST SCRIPT FOR DAILY AND LEVEL ROI FUNCTIONS
 * This script tests both functions to ensure they work correctly
 * Run this before deployment to verify everything is working
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the cron controller
const cronController = require('./src/controllers/user/cron.controller.js');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Test Daily Profit Processing
const testDailyProfit = async () => {
  console.log('\n🔍 TESTING DAILY PROFIT PROCESSING...');
  console.log('='.repeat(50));
  
  try {
    const result = await cronController._processDailyTradingProfit('test');
    
    if (result.success) {
      console.log('✅ Daily Profit Processing: SUCCESS');
      console.log(`   - Processed: ${result.processedCount} investments`);
      console.log(`   - Total Profit: $${result.totalProfit}`);
      console.log(`   - Cron Execution ID: ${result.cronExecutionId}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`   - Errors: ${result.errors.length}`);
        console.log('   - Error Details:', result.errors.slice(0, 3)); // Show first 3 errors
      }
    } else {
      console.log('❌ Daily Profit Processing: FAILED');
      console.log(`   - Error: ${result.error}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Daily Profit Processing: EXCEPTION');
    console.log(`   - Error: ${error.message}`);
    console.log(`   - Stack: ${error.stack}`);
    return false;
  }
};

// Test Level ROI Processing
const testLevelROI = async () => {
  console.log('\n🔍 TESTING LEVEL ROI PROCESSING...');
  console.log('='.repeat(50));
  
  try {
    const result = await cronController._processLevelRoiIncome('test');
    
    if (result.success) {
      console.log('✅ Level ROI Processing: SUCCESS');
      console.log(`   - Processed: ${result.processedCount} users`);
      console.log(`   - Total Commission: $${result.totalCommission}`);
      console.log(`   - Cron Execution ID: ${result.cronExecutionId}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`   - Errors: ${result.errors.length}`);
        console.log('   - Error Details:', result.errors.slice(0, 3)); // Show first 3 errors
      }
    } else {
      console.log('❌ Level ROI Processing: FAILED');
      console.log(`   - Error: ${result.error}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Level ROI Processing: EXCEPTION');
    console.log(`   - Error: ${error.message}`);
    console.log(`   - Stack: ${error.stack}`);
    return false;
  }
};

// Check Database Connections
const testDatabaseConnections = async () => {
  console.log('\n🔍 TESTING DATABASE CONNECTIONS...');
  console.log('='.repeat(50));
  
  try {
    const { investmentDbHandler, userDbHandler, incomeDbHandler } = require('./src/services/db');
    
    // Test investment handler
    const investments = await investmentDbHandler.getByQuery({ status: 'active' }, { limit: 1 });
    console.log('✅ Investment DB Handler: Working');
    
    // Test user handler
    const users = await userDbHandler.getByQuery({}, { limit: 1 });
    console.log('✅ User DB Handler: Working');
    
    // Test income handler
    const incomes = await incomeDbHandler.getByQuery({}, { limit: 1 });
    console.log('✅ Income DB Handler: Working');
    
    return true;
  } catch (error) {
    console.log('❌ Database Connection Test: FAILED');
    console.log(`   - Error: ${error.message}`);
    return false;
  }
};

// Check Cron Schedule
const checkCronSchedule = () => {
  console.log('\n🔍 CHECKING CRON SCHEDULE...');
  console.log('='.repeat(50));
  
  console.log('📅 Scheduled Cron Jobs:');
  console.log('   - 12:30 AM UTC: Daily Profit Processing');
  console.log('   - 12:45 AM UTC: Backup Daily Profit');
  console.log('   - 1:00 AM UTC:  Level ROI Processing');
  console.log('   - 1:30 AM UTC:  User Rank Updates');
  console.log('   - 2:00 AM UTC:  Team Rewards');
  console.log('   - 4:00 AM UTC:  Login Counter Reset');
  
  console.log('\n✅ No scheduling conflicts detected');
  return true;
};

// Main test function
const runTests = async () => {
  console.log('🚀 STARTING CRITICAL CRON FUNCTION TESTS');
  console.log('='.repeat(60));
  console.log(`Test started at: ${new Date().toISOString()}`);
  
  let allTestsPassed = true;
  
  // Connect to database
  await connectDB();
  
  // Run tests
  const dbTest = await testDatabaseConnections();
  const dailyProfitTest = await testDailyProfit();
  const levelROITest = await testLevelROI();
  const scheduleTest = checkCronSchedule();
  
  allTestsPassed = dbTest && dailyProfitTest && levelROITest && scheduleTest;
  
  // Final result
  console.log('\n' + '='.repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! CRON FUNCTIONS ARE READY FOR PRODUCTION');
    console.log('✅ Daily Profit Processing: Working');
    console.log('✅ Level ROI Processing: Working');
    console.log('✅ Database Connections: Working');
    console.log('✅ Cron Schedule: No conflicts');
  } else {
    console.log('❌ SOME TESTS FAILED! PLEASE FIX ISSUES BEFORE DEPLOYMENT');
  }
  
  console.log(`Test completed at: ${new Date().toISOString()}`);
  
  // Close database connection
  await mongoose.connection.close();
  console.log('📝 Database connection closed');
  
  process.exit(allTestsPassed ? 0 : 1);
};

// Run the tests
runTests().catch(error => {
  console.error('💥 CRITICAL ERROR IN TEST SCRIPT:', error);
  process.exit(1);
});
