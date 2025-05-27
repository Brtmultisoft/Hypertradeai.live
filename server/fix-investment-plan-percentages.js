const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import database handlers
const { investmentPlanDbHandler } = require('./src/services/db');

async function fixInvestmentPlanPercentages() {
  try {
    console.log('======== FIXING INVESTMENT PLAN PERCENTAGES ========');
    
    // Correct percentages as per your database values
    const correctPercentages = {
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
    
    console.log('\n✅ Target percentages:');
    for (let i = 1; i <= 10; i++) {
      console.log(`Level ${i}: ${correctPercentages[`level${i}`]}%`);
    }
    
    // Get current investment plan
    const investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
    
    if (!investmentPlan) {
      console.log('\n❌ No active investment plan found');
      return;
    }
    
    console.log(`\n📋 Current investment plan: ${investmentPlan.title}`);
    console.log(`ID: ${investmentPlan._id}`);
    
    // Check current percentages
    console.log('\n🔍 Current percentages:');
    let needsUpdate = false;
    
    for (let i = 1; i <= 10; i++) {
      const levelKey = `level${i}`;
      const currentValue = investmentPlan.team_commission?.[levelKey];
      const targetValue = correctPercentages[levelKey];
      
      if (currentValue === targetValue) {
        console.log(`✅ Level ${i}: ${currentValue}% (correct)`);
      } else if (currentValue !== undefined) {
        console.log(`❌ Level ${i}: ${currentValue}% (should be ${targetValue}%)`);
        needsUpdate = true;
      } else {
        console.log(`❌ Level ${i}: UNDEFINED (should be ${targetValue}%)`);
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      console.log('\n🔧 Updating investment plan with correct percentages...');
      
      // Update the investment plan
      const updateResult = await investmentPlanDbHandler.updateByQuery(
        { _id: investmentPlan._id },
        {
          team_commission: correctPercentages
        }
      );
      
      if (updateResult) {
        console.log('✅ Investment plan updated successfully!');
        
        // Verify the update
        const updatedPlan = await investmentPlanDbHandler.getById(investmentPlan._id);
        console.log('\n✅ Verification - Updated percentages:');
        
        for (let i = 1; i <= 10; i++) {
          const levelKey = `level${i}`;
          const value = updatedPlan.team_commission[levelKey];
          console.log(`Level ${i}: ${value}%`);
        }
        
      } else {
        console.log('❌ Failed to update investment plan');
      }
      
    } else {
      console.log('\n✅ All percentages are already correct!');
    }
    
    console.log('\n======== COMPLETED ========');
    
  } catch (error) {
    console.error('Error fixing investment plan percentages:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixInvestmentPlanPercentages();
