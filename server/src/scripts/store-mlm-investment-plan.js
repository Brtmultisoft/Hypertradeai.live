'use strict';

const mongoose = require('mongoose');
const { investmentPlanModel } = require('../models');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.mongodb.url, config.mongodb.options)
  .then(() => {
    console.log('Connected to MongoDB');
    storeInvestmentPlan();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function storeInvestmentPlan() {
  try {
    console.log('Starting to store MLM investment plan');

    // Check if a plan already exists
    const existingPlans = await investmentPlanModel.find({});

    // MLM investment plan data - exactly as specified by the user
    const mlmPlanData = {
      title: 'Trading Package',
      amount_from: 50,        // Minimum investment $50
      amount_to: 1000000,     // Unlimited max investment (using a high value)
      percentage: 8,          // 8% daily ROI
      days: 1,                // Daily profit calculation
      frequency_in_days: 1,   // Daily profit distribution
      referral_bonus: 3,      // 3% direct referral commission
      team_commission: {
        level1: 25,           // 25% of ROI income from level 1
        level2: 10,           // 10% of ROI income from level 2
        level3: 5,            // 5% of ROI income from level 3
        level4: 4,            // 4% of ROI income from level 4
        level5: 3,            // 3% of ROI income from level 5
        level6: 2,            // 2% of ROI income from level 6
        level7: 1             // 1% of ROI income from level 7
      },
      status: true,
      extra: {
        description: 'MLM Trading Package with 8% daily ROI and 7-level team commission structure',
        min_direct_referrals_for_level_roi: 1  // Require at least 1 direct referral to activate level ROI income
      }
    };

    let result;

    if (existingPlans.length > 0) {
      // Update the existing plan
      console.log('Updating existing investment plan with ID:', existingPlans[0]._id);

      result = await investmentPlanModel.findByIdAndUpdate(
        existingPlans[0]._id,
        mlmPlanData,
        { new: true }
      );

      console.log('Investment plan updated successfully');
    } else {
      // Create a new plan
      console.log('Creating new investment plan');

      const newPlan = new investmentPlanModel(mlmPlanData);
      result = await newPlan.save();

      console.log('Investment plan created successfully');
    }

    console.log('Investment plan details:', result);

    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    console.log('Investment plan stored successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error storing investment plan:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}
