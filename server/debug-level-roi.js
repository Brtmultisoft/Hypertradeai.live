const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import database handlers
const { userDbHandler, investmentPlanDbHandler } = require('./src/services/db');

async function debugLevelRoi() {
  try {
    console.log('======== DEBUGGING LEVEL ROI PROCESSING ========');
    
    // Get investment plan percentages
    const investmentPlan = await investmentPlanDbHandler.getOneByQuery({ status: true });
    let percentages = {};
    
    if (investmentPlan && investmentPlan.team_commission) {
      percentages = investmentPlan.team_commission;
      console.log('\n✅ Database percentages found:');
      for (let i = 1; i <= 10; i++) {
        const levelKey = `level${i}`;
        const percentage = percentages[levelKey];
        console.log(`Level ${i}: ${percentage !== undefined ? percentage + '%' : 'UNDEFINED'}`);
      }
    } else {
      console.log('\n❌ No investment plan found in database');
      return;
    }
    
    // Find a user with referral chain to test
    console.log('\n🔍 Finding users with referral chains...');
    
    // Get users who have investments and refer_id
    const usersWithReferrals = await userDbHandler.getByQuery({
      total_investment: { $gt: 0 },
      refer_id: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${usersWithReferrals.length} users with investments and referrals`);
    
    if (usersWithReferrals.length === 0) {
      console.log('❌ No users found with referral chains to test');
      return;
    }
    
    // Test with first user
    const testUser = usersWithReferrals[0];
    console.log(`\n🧪 Testing with user: ${testUser.username || testUser.email} (ID: ${testUser._id})`);
    console.log(`User investment: $${testUser.total_investment}`);
    console.log(`User refer_id: ${testUser.refer_id}`);
    
    // Simulate level ROI processing
    console.log('\n🔄 Simulating level ROI processing...');
    
    let currentUser = await userDbHandler.getById(testUser.refer_id);
    let level = 1;
    const maxLevel = 10;
    const testAmount = 100; // $100 daily profit
    
    console.log(`\nTracing upline chain for ${maxLevel} levels:`);
    
    while (currentUser && level <= maxLevel) {
      console.log(`\n--- LEVEL ${level} ---`);
      console.log(`User: ${currentUser.username || currentUser.email} (ID: ${currentUser._id})`);
      console.log(`Investment: $${currentUser.total_investment || 0}`);
      console.log(`Refer ID: ${currentUser.refer_id}`);
      
      // Check percentage for this level
      const commissionPercentage = percentages[`level${level}`];
      if (commissionPercentage === undefined) {
        console.log(`❌ PROBLEM: No percentage defined for level ${level}`);
        break;
      }
      
      console.log(`Commission percentage: ${commissionPercentage}%`);
      
      // Check if user has invested
      const hasInvestment = currentUser.total_investment > 0;
      console.log(`Has investment: ${hasInvestment ? 'YES' : 'NO'}`);
      
      if (hasInvestment) {
        const commissionAmount = (testAmount * commissionPercentage) / 100;
        console.log(`✅ Would receive: $${commissionAmount.toFixed(4)} (${commissionPercentage}% of $${testAmount})`);
      } else {
        console.log(`❌ Would skip: No investment`);
      }
      
      // Move to next level
      if (currentUser.refer_id) {
        if (currentUser.refer_id === 'admin') {
          console.log(`Found admin refer_id, looking up admin user...`);
          const adminUser = await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" });
          if (adminUser) {
            console.log(`✅ Admin user found: ${adminUser.username || adminUser.email}`);
            currentUser = adminUser;
          } else {
            console.log(`❌ Admin user not found, breaking chain`);
            break;
          }
        } else {
          const nextUser = await userDbHandler.getById(currentUser.refer_id);
          if (nextUser) {
            console.log(`✅ Next user found: ${nextUser.username || nextUser.email}`);
            currentUser = nextUser;
          } else {
            console.log(`❌ Next user not found, breaking chain`);
            break;
          }
        }
      } else {
        console.log(`❌ No refer_id, end of chain`);
        break;
      }
      
      level++;
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`- Started at level 1`);
    console.log(`- Reached level ${level - 1}`);
    console.log(`- Target was level ${maxLevel}`);
    
    if (level - 1 < maxLevel) {
      console.log(`\n⚠️  ISSUE: Only processed ${level - 1} levels out of ${maxLevel}`);
      console.log(`Possible reasons:`);
      console.log(`1. Referral chain is shorter than 10 levels`);
      console.log(`2. Some users in chain don't exist`);
      console.log(`3. Admin user lookup failed`);
      console.log(`4. Missing percentage definitions`);
    } else {
      console.log(`\n✅ SUCCESS: All ${maxLevel} levels would be processed`);
    }
    
    console.log('\n======== DEBUG COMPLETED ========');
    
  } catch (error) {
    console.error('Error debugging level ROI:', error);
  } finally {
    process.exit(0);
  }
}

// Run the debug
debugLevelRoi();
