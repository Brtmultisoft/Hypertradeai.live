/**
 * Script to update trade activation status and profit details
 * 
 * This script will:
 * 1. Find all processed trade activations
 * 2. Update the profit_details.profit_rate to 0.266%
 * 3. Optionally recalculate the profit amount based on the new rate
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();

// Define schemas
const tradeActivationSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  activation_date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  profit_status: {
    type: String,
    enum: ['pending', 'processed', 'skipped'],
    default: 'pending'
  },
  profit_processed_at: {
    type: Date,
    default: null
  },
  profit_amount: {
    type: Number,
    default: 0
  },
  profit_details: {
    type: Object,
    default: {}
  },
  cron_execution_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CronExecution',
    default: null
  }
});

const investmentSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  amount: {
    type: Number,
    default: 0
  }
});

const incomeSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  amount: Number,
  type: String,
  description: String,
  reference_id: mongoose.Schema.Types.ObjectId
});

const userSchema = new Schema({
  email: String,
  username: String,
  wallet: {
    type: Number,
    default: 0
  }
});

async function updateActivationStatus() {
  try {
    console.log('Connecting to MongoDB...');
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('Connected to MongoDB successfully');

    // Register models
    const TradeActivation = mongoose.model('TradeActivations', tradeActivationSchema);
    const Investment = mongoose.model('Investments', investmentSchema);
    const Income = mongoose.model('Income', incomeSchema);
    const User = mongoose.model('Users', userSchema);

    // 1. Find all processed trade activations
    console.log('Finding processed trade activations...');
    const processedActivations = await TradeActivation.find({
      profit_status: 'processed',
      'profit_details.profit_rate': { $ne: 0.266 } // Find activations with profit rate not equal to 0.266%
    });

    console.log(`Found ${processedActivations.length} processed activations with incorrect profit rate`);

    // 2. Update each activation
    let updatedCount = 0;
    let recalculatedCount = 0;
    let totalProfitDifference = 0;

    for (const activation of processedActivations) {
      try {
        // Get the profit details
        const profitDetails = activation.profit_details || {};
        const investmentId = profitDetails.investment_id;
        const investmentAmount = profitDetails.investment_amount;
        const oldProfitRate = profitDetails.profit_rate || 0;
        const oldProfitAmount = activation.profit_amount || 0;

        // Calculate what the profit should have been with 0.266%
        const correctProfitAmount = (investmentAmount * 0.266) / 100;
        const profitDifference = correctProfitAmount - oldProfitAmount;

        console.log(`Activation ${activation._id}:`);
        console.log(`- Old profit rate: ${oldProfitRate}%, amount: $${oldProfitAmount}`);
        console.log(`- Correct profit rate: 0.266%, amount: $${correctProfitAmount}`);
        console.log(`- Difference: $${profitDifference}`);

        // Update the profit rate in the activation record
        profitDetails.profit_rate = 0.266;
        
        const updateData = {
          'profit_details': profitDetails
        };

        // Update the activation
        await TradeActivation.findByIdAndUpdate(
          activation._id,
          { $set: updateData }
        );

        updatedCount++;
        console.log(`Updated activation ${activation._id}`);

        // Optional: If you want to recalculate and adjust the profit amount
        // This is commented out by default as it would require updating user wallets and income records
        /*
        if (Math.abs(profitDifference) > 0.001) { // Only adjust if there's a significant difference
          // Update the profit amount in the activation record
          await TradeActivation.findByIdAndUpdate(
            activation._id,
            { 
              $set: {
                'profit_amount': correctProfitAmount,
                'profit_details': profitDetails
              }
            }
          );

          // Update the income record if it exists
          if (profitDetails.income_id) {
            await Income.findByIdAndUpdate(
              profitDetails.income_id,
              { $set: { amount: correctProfitAmount } }
            );
          }

          // Adjust user wallet
          if (activation.user_id) {
            await User.findByIdAndUpdate(
              activation.user_id,
              { $inc: { wallet: profitDifference } }
            );
          }

          recalculatedCount++;
          totalProfitDifference += profitDifference;
        }
        */
      } catch (error) {
        console.error(`Error updating activation ${activation._id}:`, error);
      }
    }

    console.log('\nSummary:');
    console.log(`Total activations processed: ${processedActivations.length}`);
    console.log(`Updated profit rate: ${updatedCount}`);
    console.log(`Recalculated profit amounts: ${recalculatedCount}`);
    console.log(`Total profit difference: $${totalProfitDifference.toFixed(2)}`);

    console.log('\nActivation status update completed successfully');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating activation status:', error);
    process.exit(1);
  }
}

// Run the function
updateActivationStatus();
