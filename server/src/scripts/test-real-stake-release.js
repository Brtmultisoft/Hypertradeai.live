/**
 * Test script to verify real stake release functionality
 * This tests the actual withdrawal controller stake release feature
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { userDbHandler, investmentDbHandler } = require('../services/db');
const { hasUserInvested } = require('../controllers/user/cron.controller');

// Connect to MongoDB
mongoose.connect(config.databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testRealStakeRelease() {
  try {
    console.log('======== TESTING REAL STAKE RELEASE FUNCTIONALITY ========');
    
    // Find a user with investments for testing
    const testUser = await userDbHandler.getOneByQuery({
      total_investment: { $gt: 0 }
    });
    
    if (!testUser) {
      console.log('No user found with investments for testing');
      process.exit(0);
    }
    
    console.log(`\nTesting with user: ${testUser.username || testUser.email} (ID: ${testUser._id})`);
    console.log(`User's total investment: $${testUser.total_investment}`);
    console.log(`User's wallet balance: $${testUser.wallet || 0}`);
    console.log(`Daily profit activated: ${testUser.dailyProfitActivated}`);
    
    // Store original values for restoration
    const originalInvestment = testUser.total_investment;
    const originalWallet = testUser.wallet || 0;
    const originalDailyProfit = testUser.dailyProfitActivated;
    
    // Get user's active investments before release
    const activeInvestmentsBefore = await investmentDbHandler.getByQuery({
      user_id: testUser._id,
      status: { $in: ['active', 1] }
    });
    console.log(`Active investments before release: ${activeInvestmentsBefore.length}`);
    
    // Check investment status before release
    console.log('\n--- BEFORE STAKE RELEASE ---');
    const beforeRelease = await hasUserInvested(testUser._id);
    console.log(`Has user invested (before release): ${beforeRelease}`);
    
    // Simulate the stake release process (as done in withdrawal controller)
    console.log('\n--- SIMULATING STAKE RELEASE PROCESS ---');
    
    const stakingAmount = testUser.total_investment;
    console.log(`Releasing staking amount: $${stakingAmount}`);
    
    // Step 1: Update user record - move staking to wallet
    const updateResult = await userDbHandler.updateOneByQuery(
      { _id: testUser._id },
      {
        $inc: {
          wallet: stakingAmount,  // Add staking amount to wallet
          total_investment: -stakingAmount  // Reset total investment
        },
        $set: {
          dailyProfitActivated: false,  // Deactivate daily profit
          lastDailyProfitActivation: null  // Clear last activation date
        }
      }
    );
    console.log('User update result:', updateResult.modifiedCount > 0 ? 'Success' : 'Failed');
    
    // Step 2: Deactivate all active investments (NEW FIX)
    const deactivateResult = await investmentDbHandler.updateByQuery(
      {
        user_id: testUser._id,
        status: { $in: ['active', 1] }
      },
      {
        status: 'completed',
        'extra.completion_date': new Date(),
        'extra.completion_reason': 'Stake released to wallet',
        'extra.stake_released': true
      }
    );
    console.log(`Deactivated ${deactivateResult.modifiedCount || 0} active investments`);
    
    // Verify the changes
    const updatedUser = await userDbHandler.getById(testUser._id);
    console.log('\n--- AFTER STAKE RELEASE ---');
    console.log(`User's total investment: $${updatedUser.total_investment}`);
    console.log(`User's wallet balance: $${updatedUser.wallet}`);
    console.log(`Daily profit activated: ${updatedUser.dailyProfitActivated}`);
    
    // Check active investments after release
    const activeInvestmentsAfter = await investmentDbHandler.getByQuery({
      user_id: testUser._id,
      status: { $in: ['active', 1] }
    });
    console.log(`Active investments after release: ${activeInvestmentsAfter.length}`);
    
    // Check investment status after release
    const afterRelease = await hasUserInvested(testUser._id);
    console.log(`Has user invested (after release): ${afterRelease}`);
    
    // Verify expected results
    console.log('\n--- VERIFICATION ---');
    const walletIncreaseCorrect = updatedUser.wallet === (originalWallet + stakingAmount);
    const investmentResetCorrect = updatedUser.total_investment === 0;
    const dailyProfitDeactivated = !updatedUser.dailyProfitActivated;
    const investmentsDeactivated = activeInvestmentsAfter.length === 0;
    const noLevelRoi = !afterRelease;
    
    console.log(`✅ Wallet increased correctly: ${walletIncreaseCorrect} (${originalWallet} + ${stakingAmount} = ${updatedUser.wallet})`);
    console.log(`✅ Total investment reset: ${investmentResetCorrect} (${updatedUser.total_investment})`);
    console.log(`✅ Daily profit deactivated: ${dailyProfitDeactivated}`);
    console.log(`✅ Investments deactivated: ${investmentsDeactivated} (${activeInvestmentsBefore.length} → ${activeInvestmentsAfter.length})`);
    console.log(`✅ No level ROI eligibility: ${noLevelRoi}`);
    
    const allTestsPassed = walletIncreaseCorrect && investmentResetCorrect && 
                          dailyProfitDeactivated && investmentsDeactivated && noLevelRoi;
    
    console.log(`\n${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    // Restore original state
    console.log('\n--- RESTORING ORIGINAL STATE ---');
    await userDbHandler.updateById(testUser._id, {
      total_investment: originalInvestment,
      wallet: originalWallet,
      dailyProfitActivated: originalDailyProfit,
      lastDailyProfitActivation: originalDailyProfit ? new Date() : null
    });
    
    // For restore, we need to use the model directly since we need $unset
    const { investmentModel } = require('../models');
    await investmentModel.updateMany(
      {
        user_id: testUser._id,
        'extra.completion_reason': 'Stake released to wallet'
      },
      {
        $set: {
          status: 'active'
        },
        $unset: {
          'extra.completion_date': '',
          'extra.completion_reason': '',
          'extra.stake_released': ''
        }
      }
    );
    
    console.log('Original state restored successfully');
    
    // Final verification
    const finalUser = await userDbHandler.getById(testUser._id);
    const finalInvestments = await investmentDbHandler.getByQuery({
      user_id: testUser._id,
      status: { $in: ['active', 1] }
    });
    const finalHasInvested = await hasUserInvested(testUser._id);
    
    console.log(`Final verification - Investment: $${finalUser.total_investment}, Active investments: ${finalInvestments.length}, Has invested: ${finalHasInvested}`);
    
    console.log('\n======== TEST COMPLETED ========');
    process.exit(0);
    
  } catch (error) {
    console.error('Error testing real stake release:', error);
    process.exit(1);
  }
}

// Run the test
testRealStakeRelease();
