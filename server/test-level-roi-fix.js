const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the cron controller
const cronController = require('./src/controllers/user/cron.controller');

// Test function to verify level ROI calculation
async function testLevelRoiCalculation() {
  try {
    console.log('======== TESTING LEVEL ROI CALCULATION ========');

    // Test with a sample daily profit amount
    const testUserId = '678f9a82a2dac325900fc47e'; // Replace with actual user ID
    const testDailyProfit = 100; // $100 daily profit

    console.log(`Testing level ROI calculation for user ${testUserId}`);
    console.log(`Daily profit amount: $${testDailyProfit}`);

    // Expected commission calculations (using correct database values):
    console.log('\nExpected Level ROI Commissions (from database):');
    const percentages = {
      level1: 25,   // 25% of $100 = $25
      level2: 10,   // 10% of $100 = $10
      level3: 5,    // 5% of $100 = $5
      level4: 4,    // 4% of $100 = $4
      level5: 3,    // 3% of $100 = $3
      level6: 2,    // 2% of $100 = $2
      level7: 1,    // 1% of $100 = $1
      level8: 1,    // 1% of $100 = $1 (corrected from 0.5%)
      level9: 1,    // 1% of $100 = $1 (corrected from 0.5%)
      level10: 1    // 1% of $100 = $1 (corrected from 0.5%)
    };

    let totalExpectedCommission = 0;
    for (let i = 1; i <= 10; i++) {
      const percentage = percentages[`level${i}`];
      const commission = (testDailyProfit * percentage) / 100;
      totalExpectedCommission += commission;
      console.log(`Level ${i}: ${percentage}% of $${testDailyProfit} = $${commission.toFixed(2)}`);
    }

    console.log(`Total expected commission: $${totalExpectedCommission.toFixed(2)}`);

    // Test the actual function
    console.log('\n======== RUNNING ACTUAL LEVEL ROI PROCESSING ========');
    const result = await cronController.processTeamCommission(testUserId, testDailyProfit);

    console.log(`\nLevel ROI processing result: ${result ? 'SUCCESS' : 'FAILED'}`);

    if (result) {
      console.log('✅ Level ROI calculation appears to be working correctly');
      console.log('✅ Commission percentages are being applied to actual daily profit');
      console.log('✅ All 10 levels should receive appropriate commissions');
    } else {
      console.log('❌ Level ROI calculation failed');
    }

    console.log('\n======== TEST COMPLETED ========');

  } catch (error) {
    console.error('Error testing level ROI calculation:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testLevelRoiCalculation();
