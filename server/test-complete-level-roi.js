const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the cron controller
const cronController = require('./src/controllers/user/cron.controller');
const { userDbHandler, investmentPlanDbHandler } = require('./src/services/db');

async function testCompleteLevelRoi() {
  try {
    console.log('======== TESTING COMPLETE LEVEL ROI PROCESSING ========');
    
    // Step 1: Check investment plan percentages
    console.log('\n1️⃣ CHECKING INVESTMENT PLAN PERCENTAGES...');
    const investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
    
    if (!investmentPlan || !investmentPlan.team_commission) {
      console.log('❌ No investment plan or team commission found');
      return;
    }
    
    console.log('✅ Investment plan found:');
    for (let i = 1; i <= 10; i++) {
      const percentage = investmentPlan.team_commission[`level${i}`];
      console.log(`Level ${i}: ${percentage !== undefined ? percentage + '%' : 'UNDEFINED'}`);
    }
    
    // Step 2: Find a test user
    console.log('\n2️⃣ FINDING TEST USER...');
    const testUsers = await userDbHandler.getByQuery({
      total_investment: { $gt: 0 },
      refer_id: { $exists: true, $ne: null }
    });
    
    if (testUsers.length === 0) {
      console.log('❌ No users found with investments and referrals');
      return;
    }
    
    const testUser = testUsers[0];
    console.log(`✅ Test user: ${testUser.username || testUser.email} (ID: ${testUser._id})`);
    console.log(`Investment: $${testUser.total_investment}`);
    
    // Step 3: Test the processTeamCommission function directly
    console.log('\n3️⃣ TESTING PROCESS TEAM COMMISSION...');
    const testAmount = 100; // $100 daily profit
    
    console.log(`Testing with $${testAmount} daily profit...`);
    
    // Call the actual function
    const result = await cronController.processTeamCommission(testUser._id, testAmount);
    
    console.log(`\n📊 RESULT: ${result ? 'SUCCESS' : 'FAILED'}`);
    
    // Step 4: Check what income records were created
    console.log('\n4️⃣ CHECKING CREATED INCOME RECORDS...');
    const { incomeDbHandler } = require('./src/services/db');
    
    // Get recent level ROI income records for this user
    const recentIncomes = await incomeDbHandler.getByQuery({
      user_id_from: testUser._id,
      type: 'level_roi_income',
      created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });
    
    console.log(`Found ${recentIncomes.length} recent level ROI income records:`);
    
    if (recentIncomes.length > 0) {
      // Group by level
      const levelMap = new Map();
      for (const income of recentIncomes) {
        levelMap.set(income.level, income);
      }
      
      console.log('\n📋 Income records by level:');
      for (let i = 1; i <= 10; i++) {
        const income = levelMap.get(i);
        if (income) {
          const user = await userDbHandler.getById(income.user_id);
          console.log(`✅ Level ${i}: $${income.amount.toFixed(4)} to ${user?.username || user?.email || 'Unknown'}`);
        } else {
          console.log(`❌ Level ${i}: No income record found`);
        }
      }
      
      // Calculate total distributed
      const totalDistributed = recentIncomes.reduce((sum, income) => sum + income.amount, 0);
      console.log(`\n💰 Total distributed: $${totalDistributed.toFixed(4)}`);
      console.log(`Expected total: $53.00 (53% of $100)`);
      console.log(`Difference: $${(53 - totalDistributed).toFixed(4)}`);
      
    } else {
      console.log('❌ No income records found - this indicates a problem');
    }
    
    // Step 5: Recommendations
    console.log('\n5️⃣ RECOMMENDATIONS:');
    
    if (recentIncomes.length === 0) {
      console.log('❌ No commissions were distributed. Possible issues:');
      console.log('   - Referral chain is broken');
      console.log('   - Users in chain have no investments');
      console.log('   - Database percentages are missing');
      console.log('   - Function returned false due to error');
    } else if (recentIncomes.length < 10) {
      console.log(`⚠️  Only ${recentIncomes.length} levels received commissions out of 10`);
      console.log('   - Referral chain might be shorter than 10 levels');
      console.log('   - Some upline users might not have investments');
      console.log('   - Missing percentage definitions for higher levels');
    } else {
      console.log('✅ All 10 levels received commissions - system is working correctly!');
    }
    
    console.log('\n======== TEST COMPLETED ========');
    
  } catch (error) {
    console.error('Error testing level ROI:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testCompleteLevelRoi();
