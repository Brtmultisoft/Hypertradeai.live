const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import database handlers
const { investmentPlanDbHandler, incomeDbHandler, userDbHandler } = require('./src/services/db');

async function checkLevelRoiCorrectness() {
  try {
    console.log('======== CHECKING LEVEL ROI CORRECTNESS ========');
    
    // Your specified database values
    const expectedPercentages = {
      level1: 25,
      level2: 10,
      level3: 5,
      level4: 4,
      level5: 3,
      level6: 2,
      level7: 1,
      level8: 1,
      level9: 1,
      level10: 1
    };
    
    console.log('\n✅ EXPECTED DATABASE VALUES:');
    for (let i = 1; i <= 10; i++) {
      console.log(`Level ${i}: ${expectedPercentages[`level${i}`]}%`);
    }
    
    // Get actual database values
    console.log('\n🔍 CHECKING ACTUAL DATABASE VALUES:');
    const investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
    
    if (investmentPlan && investmentPlan.team_commission) {
      console.log('\n📊 ACTUAL DATABASE VALUES:');
      let allCorrect = true;
      
      for (let i = 1; i <= 10; i++) {
        const levelKey = `level${i}`;
        const actualValue = investmentPlan.team_commission[levelKey];
        const expectedValue = expectedPercentages[levelKey];
        
        if (actualValue === expectedValue) {
          console.log(`✅ Level ${i}: ${actualValue}% (CORRECT)`);
        } else if (actualValue !== undefined) {
          console.log(`❌ Level ${i}: ${actualValue}% (WRONG - should be ${expectedValue}%)`);
          allCorrect = false;
        } else {
          console.log(`❌ Level ${i}: NOT DEFINED (should be ${expectedValue}%)`);
          allCorrect = false;
        }
      }
      
      console.log(`\n${allCorrect ? '✅' : '❌'} DATABASE VALUES: ${allCorrect ? 'ALL CORRECT' : 'SOME INCORRECT'}`);
      
    } else {
      console.log('\n❌ NO INVESTMENT PLAN OR TEAM COMMISSION FOUND IN DATABASE');
    }
    
    // Check recent level ROI income records to see what percentages are actually being used
    console.log('\n🔍 CHECKING RECENT LEVEL ROI INCOME RECORDS:');
    
    const recentLevelRoi = await incomeDbHandler.getByQuery(
      { 
        type: 'level_roi_income',
        created_at: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      {},
      { created_at: -1 },
      10 // Get last 10 records
    );
    
    if (recentLevelRoi && recentLevelRoi.length > 0) {
      console.log(`\nFound ${recentLevelRoi.length} recent level ROI records:`);
      
      for (const record of recentLevelRoi) {
        const user = await userDbHandler.getById(record.user_id);
        const fromUser = record.extra?.fromUser || 'Unknown';
        const dailyProfit = record.extra?.dailyProfitAmount || 0;
        const commissionPercentage = record.extra?.commissionPercentage || 0;
        const expectedPercentage = expectedPercentages[`level${record.level}`];
        
        const isCorrect = commissionPercentage === expectedPercentage;
        
        console.log(`\n${isCorrect ? '✅' : '❌'} Level ${record.level} Commission:`);
        console.log(`  To: ${user?.username || user?.email || 'Unknown'}`);
        console.log(`  From: ${fromUser}`);
        console.log(`  Daily Profit: $${dailyProfit}`);
        console.log(`  Commission: $${record.amount} (${commissionPercentage}%)`);
        console.log(`  Expected: ${expectedPercentage}%`);
        console.log(`  Status: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      }
    } else {
      console.log('\n⚠️  NO RECENT LEVEL ROI RECORDS FOUND (last 24 hours)');
    }
    
    // Test calculation with sample values
    console.log('\n🧮 CALCULATION TEST:');
    console.log('If a user receives $100 daily profit, commissions should be:');
    
    let totalExpected = 0;
    for (let i = 1; i <= 10; i++) {
      const percentage = expectedPercentages[`level${i}`];
      const commission = (100 * percentage) / 100;
      totalExpected += commission;
      console.log(`Level ${i}: ${percentage}% of $100 = $${commission.toFixed(2)}`);
    }
    
    console.log(`\nTotal Expected Commission: $${totalExpected.toFixed(2)}`);
    console.log(`Company Keeps: $${(100 - totalExpected).toFixed(2)}`);
    
    // Summary
    console.log('\n======== SUMMARY ========');
    console.log('✅ = Correct');
    console.log('❌ = Incorrect');
    console.log('⚠️  = Warning/Missing');
    
    console.log('\nNext Steps:');
    console.log('1. If database values are incorrect, update the investment plan');
    console.log('2. If recent records show wrong percentages, the code needs fixing');
    console.log('3. Test with actual level ROI processing to verify');
    
  } catch (error) {
    console.error('Error checking level ROI correctness:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkLevelRoiCorrectness();
