'use strict';
const mongoose = require('mongoose');
const config = require('../config/config');
const { processTeamCommission } = require('../controllers/user/cron.controller');
const { userModel, investmentModel } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.DB_URL || 'mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Function to test level ROI income distribution
async function testLevelRoiIncome() {
  try {
    console.log('======== TESTING LEVEL ROI INCOME DISTRIBUTION ========');
    
    // Find user "deepak"
    const deepak = await userModel.findOne({ username: 'deepak' });
    if (!deepak) {
      console.error('User "deepak" not found');
      process.exit(1);
    }
    
    console.log(`Found user deepak: ${deepak.username} (ID: ${deepak._id})`);
    console.log(`Deepak's total investment: $${deepak.total_investment}`);
    
    // Process team commission for deepak
    console.log('\nProcessing level ROI income for deepak...');
    const result = await processTeamCommission(deepak._id, deepak.total_investment);
    
    console.log(`\nLevel ROI income processing result: ${result ? 'Success' : 'Failed'}`);
    console.log('======== TEST COMPLETED ========');
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing level ROI income:', error);
    process.exit(1);
  }
}

// Run the test
testLevelRoiIncome();
