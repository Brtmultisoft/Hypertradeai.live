const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import database handlers
const { investmentPlanDbHandler } = require('./src/services/db');

async function verifyLevelRoiDatabase() {
  try {
    console.log('======== VERIFYING LEVEL ROI DATABASE VALUES ========');
    
    // Get investment plan from database
    const investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
    
    if (investmentPlan) {
      console.log('\n✅ Investment Plan Found:');
      console.log(`Title: ${investmentPlan.title}`);
      console.log(`Percentage: ${investmentPlan.percentage}%`);
      console.log(`Status: ${investmentPlan.status}`);
      
      if (investmentPlan.team_commission) {
        console.log('\n✅ Team Commission Structure:');
        console.log('Database Values:');
        
        for (let i = 1; i <= 10; i++) {
          const levelKey = `level${i}`;
          const percentage = investmentPlan.team_commission[levelKey];
          if (percentage !== undefined) {
            console.log(`  Level ${i}: ${percentage}%`);
          } else {
            console.log(`  Level ${i}: NOT DEFINED`);
          }
        }
        
        // Calculate total commission percentage
        let totalCommission = 0;
        for (let i = 1; i <= 10; i++) {
          const levelKey = `level${i}`;
          const percentage = investmentPlan.team_commission[levelKey];
          if (percentage !== undefined) {
            totalCommission += percentage;
          }
        }
        
        console.log(`\nTotal Commission Percentage: ${totalCommission}%`);
        
        // Test calculation with $100 daily profit
        console.log('\n======== COMMISSION CALCULATION TEST ========');
        console.log('If a user receives $100 daily profit:');
        
        let totalCommissionAmount = 0;
        for (let i = 1; i <= 10; i++) {
          const levelKey = `level${i}`;
          const percentage = investmentPlan.team_commission[levelKey];
          if (percentage !== undefined) {
            const commissionAmount = (100 * percentage) / 100;
            totalCommissionAmount += commissionAmount;
            console.log(`  Level ${i}: ${percentage}% of $100 = $${commissionAmount.toFixed(2)}`);
          }
        }
        
        console.log(`\nTotal Commission Distributed: $${totalCommissionAmount.toFixed(2)}`);
        console.log(`Remaining for Company: $${(100 - totalCommissionAmount).toFixed(2)}`);
        
      } else {
        console.log('\n❌ No team_commission structure found in investment plan');
      }
      
    } else {
      console.log('\n❌ No active investment plan found in database');
    }
    
    // Also check all investment plans
    console.log('\n======== ALL INVESTMENT PLANS ========');
    const allPlans = await investmentPlanDbHandler.getAll({});
    
    if (allPlans && allPlans.list && allPlans.list.length > 0) {
      console.log(`Found ${allPlans.list.length} investment plans:`);
      
      allPlans.list.forEach((plan, index) => {
        console.log(`\nPlan ${index + 1}:`);
        console.log(`  ID: ${plan._id}`);
        console.log(`  Title: ${plan.title}`);
        console.log(`  Status: ${plan.status}`);
        console.log(`  Percentage: ${plan.percentage}%`);
        
        if (plan.team_commission) {
          console.log(`  Team Commission:`, plan.team_commission);
        } else {
          console.log(`  Team Commission: NOT DEFINED`);
        }
      });
    } else {
      console.log('No investment plans found');
    }
    
    console.log('\n======== VERIFICATION COMPLETED ========');
    
  } catch (error) {
    console.error('Error verifying database values:', error);
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyLevelRoiDatabase();
