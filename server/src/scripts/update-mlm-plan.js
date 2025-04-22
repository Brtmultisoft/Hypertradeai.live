require('dotenv').config();
const mongoose = require('mongoose');
const { investmentPlanModel } = require('../models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/mlm_db')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if a plan already exists
      const existingPlans = await investmentPlanModel.find({});
      console.log(`Found ${existingPlans.length} existing plans`);
      
      if (existingPlans.length > 0) {
        // Update the existing plan
        console.log('Updating existing plan...');
        const updateResult = await investmentPlanModel.updateOne(
          { _id: existingPlans[0]._id },
          {
            $set: {
              title: 'Trading Package',
              amount_from: 50,        // Minimum investment $50
              amount_to: 1000000,     // Unlimited max investment
              percentage: 8,          // 8% daily ROI
              days: 1,                // Daily profit calculation
              frequency_in_days: 1,   // Daily profit distribution
              referral_bonus: 3,      // 3% direct referral bonus
              team_commission: {
                level1: 25,           // 25% of ROI income from level 1
                level2: 10,           // 10% of ROI income from level 2
                level3: 5,            // 5% of ROI income from level 3
                level4: 4,            // 4% of ROI income from level 4
                level5: 3,            // 3% of ROI income from level 5
                level6: 2,            // 2% of ROI income from level 6
                level7: 1             // 1% of ROI income from level 7
              },
              status: true
            }
          }
        );
        console.log('Update result:', updateResult);
      } else {
        // Create a new plan
        console.log('Creating new plan...');
        const newPlan = new investmentPlanModel({
          title: 'Trading Package',
          amount_from: 50,        // Minimum investment $50
          amount_to: 1000000,     // Unlimited max investment
          percentage: 8,          // 8% daily ROI
          days: 1,                // Daily profit calculation
          frequency_in_days: 1,   // Daily profit distribution
          referral_bonus: 3,      // 3% direct referral bonus
          team_commission: {
            level1: 25,           // 25% of ROI income from level 1
            level2: 10,           // 10% of ROI income from level 2
            level3: 5,            // 5% of ROI income from level 3
            level4: 4,            // 4% of ROI income from level 4
            level5: 3,            // 3% of ROI income from level 5
            level6: 2,            // 2% of ROI income from level 6
            level7: 1             // 1% of ROI income from level 7
          },
          status: true
        });
        
        const saveResult = await newPlan.save();
        console.log('New plan created:', saveResult);
      }
      
      console.log('MLM plan updated successfully');
    } catch (error) {
      console.error('Error updating MLM plan:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));
