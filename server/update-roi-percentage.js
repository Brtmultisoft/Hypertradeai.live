/**
 * Script to update ROI percentage in the database
 * 
 * This script will:
 * 1. Update all investment plans to use 0.266% instead of 2.5% or 0.26%
 * 2. Update all investments with the correct daily_profit value
 * 3. Log the changes made
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();

// Define schemas
const investmentPlanSchema = new Schema({
  title: {
    type: String,
    require: true
  },
  percentage: {
    type: Number,
    default: 0.266 // Daily trading profit
  }
});

const investmentSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  investment_plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentPlans'
  },
  amount: {
    type: Number,
    default: 0
  },
  daily_profit: {
    type: Number,
    default: 0.266
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  }
});

async function updateRoiPercentage() {
  try {
    console.log('Connecting to MongoDB...');
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('Connected to MongoDB successfully');

    // Register models
    const InvestmentPlan = mongoose.model('InvestmentPlans', investmentPlanSchema);
    const Investment = mongoose.model('Investments', investmentSchema);

    // 1. Update all investment plans
    console.log('Updating investment plans...');
    const investmentPlanUpdateResult = await InvestmentPlan.updateMany(
      { percentage: { $ne: 0.266 } }, // Find all plans that don't have 0.266%
      { $set: { percentage: 0.266 } }
    );

    console.log(`Updated ${investmentPlanUpdateResult.modifiedCount} investment plans`);

    // 2. Update all investments
    console.log('Updating investments...');
    const investmentUpdateResult = await Investment.updateMany(
      { daily_profit: { $ne: 0.266 } }, // Find all investments that don't have 0.266%
      { $set: { daily_profit: 0.266 } }
    );

    console.log(`Updated ${investmentUpdateResult.modifiedCount} investments`);

    // 3. Get all investment plans to verify
    const allPlans = await InvestmentPlan.find({});
    console.log('\nCurrent investment plans:');
    allPlans.forEach(plan => {
      console.log(`- Plan: ${plan.title}, Percentage: ${plan.percentage}%`);
    });

    // 4. Get a sample of investments to verify
    const sampleInvestments = await Investment.find({}).limit(5);
    console.log('\nSample investments:');
    sampleInvestments.forEach(investment => {
      console.log(`- Investment ID: ${investment._id}, Amount: $${investment.amount}, Daily Profit Rate: ${investment.daily_profit}%`);
    });

    console.log('\nROI percentage update completed successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating ROI percentage:', error);
    process.exit(1);
  }
}

// Run the function
updateRoiPercentage();
