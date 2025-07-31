/**
 * Debug script to check investment status and update mechanism
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const { userDbHandler, investmentDbHandler } = require('../services/db');

// Connect to MongoDB
mongoose.connect(config.databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugInvestmentStatus() {
  try {
    console.log('======== DEBUGGING INVESTMENT STATUS ========');
    
    // Find a user with investments
    const testUser = await userDbHandler.getOneByQuery({
      total_investment: { $gt: 0 }
    });
    
    if (!testUser) {
      console.log('No user found with investments');
      process.exit(0);
    }
    
    console.log(`\nUser: ${testUser.username || testUser.email} (ID: ${testUser._id})`);
    
    // Get all investments for this user
    const allInvestments = await investmentDbHandler.getByQuery({
      user_id: testUser._id
    });
    
    console.log(`\nTotal investments found: ${allInvestments.length}`);
    
    allInvestments.forEach((inv, index) => {
      console.log(`\nInvestment ${index + 1}:`);
      console.log(`- ID: ${inv._id}`);
      console.log(`- Amount: ${inv.amount}`);
      console.log(`- Status: ${inv.status} (type: ${typeof inv.status})`);
      console.log(`- Package type: ${inv.package_type}`);
      console.log(`- Created at: ${inv.created_at}`);
      console.log(`- Completion date: ${inv.completion_date}`);
      console.log(`- Completion reason: ${inv.completion_reason}`);
    });
    
    // Check active investments with different queries
    console.log('\n--- CHECKING ACTIVE INVESTMENTS ---');
    
    const activeInvestments1 = await investmentDbHandler.getByQuery({
      user_id: testUser._id,
      status: 'active'
    });
    console.log(`Active investments (status: 'active'): ${activeInvestments1.length}`);
    
    const activeInvestments2 = await investmentDbHandler.getByQuery({
      user_id: testUser._id,
      status: 1
    });
    console.log(`Active investments (status: 1): ${activeInvestments2.length}`);
    
    const activeInvestments3 = await investmentDbHandler.getByQuery({
      user_id: testUser._id,
      status: { $in: ['active', 1] }
    });
    console.log(`Active investments (status: ['active', 1]): ${activeInvestments3.length}`);
    
    // Test update operation
    console.log('\n--- TESTING UPDATE OPERATION ---');
    
    if (activeInvestments3.length > 0) {
      const testInvestment = activeInvestments3[0];
      console.log(`Testing update on investment: ${testInvestment._id}`);
      console.log(`Current status: ${testInvestment.status} (type: ${typeof testInvestment.status})`);
      
      // Try to update this specific investment
      const updateResult = await investmentDbHandler.updateByQuery(
        { 
          _id: testInvestment._id
        },
        {
          $set: {
            status: 'completed',
            completion_date: new Date(),
            completion_reason: 'Debug test update'
          }
        }
      );
      
      console.log(`Update result: ${JSON.stringify(updateResult)}`);
      
      // Check if it was updated
      const updatedInvestment = await investmentDbHandler.getById(testInvestment._id);
      console.log(`After update - Status: ${updatedInvestment.status}`);
      console.log(`After update - Completion date: ${updatedInvestment.completion_date}`);
      console.log(`After update - Completion reason: ${updatedInvestment.completion_reason}`);
      
      // Restore original status
      await investmentDbHandler.updateByQuery(
        { 
          _id: testInvestment._id
        },
        {
          $set: {
            status: testInvestment.status,
            completion_date: null,
            completion_reason: null
          }
        }
      );
      console.log('Restored original status');
    }
    
    console.log('\n======== DEBUG COMPLETED ========');
    process.exit(0);
    
  } catch (error) {
    console.error('Error debugging investment status:', error);
    process.exit(1);
  }
}

// Run the debug
debugInvestmentStatus();
