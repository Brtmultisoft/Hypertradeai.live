const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { userDbHandler, investmentPlanDbHandler, incomeDbHandler } = require('./src/services/db');
const cronController = require('./src/controllers/user/cron.controller');

async function testAllLevelsComplete() {
  try {
    console.log('======== TESTING ALL LEVELS COMPLETE DISTRIBUTION ========');
    
    // Step 1: Ensure database has correct percentages
    console.log('\n1️⃣ CHECKING/FIXING DATABASE PERCENTAGES...');
    
    const correctPercentages = {
      level1: 25, level2: 10, level3: 5, level4: 4, level5: 3,
      level6: 2, level7: 1, level8: 1, level9: 1, level10: 1
    };
    
    let investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
    
    if (!investmentPlan) {
      console.log('❌ No investment plan found');
      return;
    }
    
    // Check and fix percentages if needed
    let needsUpdate = false;
    for (let i = 1; i <= 10; i++) {
      const levelKey = `level${i}`;
      const current = investmentPlan.team_commission?.[levelKey];
      const expected = correctPercentages[levelKey];
      
      if (current !== expected) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
      console.log('🔧 Updating investment plan with correct percentages...');
      await investmentPlanDbHandler.updateByQuery(
        { _id: investmentPlan._id },
        { team_commission: correctPercentages }
      );
      investmentPlan = await investmentPlanDbHandler.getById(investmentPlan._id);
      console.log('✅ Investment plan updated');
    }
    
    console.log('✅ Database percentages verified:');
    for (let i = 1; i <= 10; i++) {
      const percentage = investmentPlan.team_commission[`level${i}`];
      console.log(`Level ${i}: ${percentage}%`);
    }
    
    // Step 2: Find users with referral chains
    console.log('\n2️⃣ FINDING USERS WITH REFERRAL CHAINS...');
    
    const usersWithReferrals = await userDbHandler.getByQuery({
      total_investment: { $gt: 0 },
      refer_id: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${usersWithReferrals.length} users with investments and referrals`);
    
    if (usersWithReferrals.length === 0) {
      console.log('❌ No users found to test with');
      return;
    }
    
    // Step 3: Test with multiple users
    console.log('\n3️⃣ TESTING LEVEL ROI FOR MULTIPLE USERS...');
    
    const testAmount = 100; // $100 daily profit
    const testUsers = usersWithReferrals.slice(0, 3); // Test with first 3 users
    
    for (let userIndex = 0; userIndex < testUsers.length; userIndex++) {
      const testUser = testUsers[userIndex];
      console.log(`\n--- TESTING USER ${userIndex + 1}: ${testUser.username || testUser.email} ---`);
      console.log(`User ID: ${testUser._id}`);
      console.log(`Investment: $${testUser.total_investment}`);
      
      // Clear any recent test data
      await incomeDbHandler.deleteMany({
        user_id_from: testUser._id,
        type: 'level_roi_income',
        created_at: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
      });
      
      // Test the level ROI processing
      console.log(`\n🧪 Processing level ROI for $${testAmount} daily profit...`);
      
      const startTime = Date.now();
      const result = await cronController.processTeamCommission(testUser._id, testAmount);
      const endTime = Date.now();
      
      console.log(`Result: ${result ? 'SUCCESS' : 'FAILED'}`);
      console.log(`Processing time: ${endTime - startTime}ms`);
      
      if (result) {
        // Check what was created
        const createdIncomes = await incomeDbHandler.getByQuery({
          user_id_from: testUser._id,
          type: 'level_roi_income',
          created_at: { $gte: new Date(startTime) }
        });
        
        console.log(`\n📊 RESULTS FOR USER ${userIndex + 1}:`);
        console.log(`Created ${createdIncomes.length} income records`);
        
        // Analyze by level
        const levelMap = new Map();
        let totalDistributed = 0;
        
        for (const income of createdIncomes) {
          levelMap.set(income.level, income);
          totalDistributed += income.amount;
        }
        
        console.log('\n📋 Level-by-level breakdown:');
        for (let level = 1; level <= 10; level++) {
          const income = levelMap.get(level);
          const expectedPercentage = correctPercentages[`level${level}`];
          const expectedAmount = (testAmount * expectedPercentage) / 100;
          
          if (income) {
            const user = await userDbHandler.getById(income.user_id);
            const isCorrect = Math.abs(income.amount - expectedAmount) < 0.0001;
            console.log(`${isCorrect ? '✅' : '❌'} Level ${level}: $${income.amount.toFixed(4)} to ${user?.username || user?.email || 'Unknown'} (expected: $${expectedAmount.toFixed(4)})`);
          } else {
            console.log(`❌ Level ${level}: MISSING (expected: $${expectedAmount.toFixed(4)})`);
          }
        }
        
        console.log(`\n💰 Total distributed: $${totalDistributed.toFixed(4)}`);
        console.log(`Expected total: $53.00 (53% of $${testAmount})`);
        console.log(`Difference: $${Math.abs(53 - totalDistributed).toFixed(4)}`);
        
        // Check if all levels were processed
        const levelsProcessed = createdIncomes.length;
        if (levelsProcessed === 10) {
          console.log('✅ ALL 10 LEVELS PROCESSED CORRECTLY!');
        } else {
          console.log(`⚠️  Only ${levelsProcessed} levels processed out of 10`);
          
          // Analyze why levels were missed
          console.log('\n🔍 Analyzing missing levels...');
          
          // Trace the referral chain manually
          let currentUser = await userDbHandler.getById(testUser.refer_id);
          let level = 1;
          
          while (currentUser && level <= 10) {
            const hasInvestment = currentUser.total_investment > 0;
            const wasProcessed = levelMap.has(level);
            
            console.log(`Level ${level}: ${currentUser.username || currentUser.email} - Investment: $${currentUser.total_investment || 0} - Processed: ${wasProcessed ? 'YES' : 'NO'}`);
            
            if (!hasInvestment) {
              console.log(`  ⚠️  User has no investment - commission skipped`);
            }
            
            // Move to next level
            if (currentUser.refer_id) {
              if (currentUser.refer_id === 'admin') {
                const adminUser = await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" });
                currentUser = adminUser;
              } else {
                currentUser = await userDbHandler.getById(currentUser.refer_id);
              }
            } else {
              console.log(`  ⚠️  End of referral chain at level ${level}`);
              break;
            }
            level++;
          }
        }
        
      } else {
        console.log('❌ Level ROI processing failed');
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
    // Step 4: Summary and recommendations
    console.log('\n4️⃣ SUMMARY AND RECOMMENDATIONS:');
    
    console.log('\n✅ What should happen for ALL users:');
    console.log('1. All 10 levels should receive commissions if upline users exist');
    console.log('2. Only invested upline users should receive commissions');
    console.log('3. Commission amounts should match database percentages exactly');
    console.log('4. Total distributed should be 53% of daily profit');
    
    console.log('\n🔧 If issues found:');
    console.log('1. Check referral chain length (might be < 10 levels)');
    console.log('2. Verify upline users have investments');
    console.log('3. Ensure database percentages are complete');
    console.log('4. Check for errors in processing logs');
    
    console.log('\n======== TEST COMPLETED ========');
    
  } catch (error) {
    console.error('Error testing all levels:', error);
  } finally {
    process.exit(0);
  }
}

// Run the comprehensive test
testAllLevelsComplete();
