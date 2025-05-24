/**
 * Script to fix activation dates and ensure proper sequencing
 *
 * This script will:
 * 1. Find all trade activations and income records
 * 2. Ensure income records are dated the next day after activation
 * 3. Fix any date inconsistencies
 * 4. Update profit processing dates to be sequential
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();

// Define schemas (simplified for this script)
const tradeActivationSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  activation_date: { type: Date, required: true },
  profit_status: { type: String, enum: ['pending', 'processed', 'failed', 'skipped'], default: 'pending' },
  profit_processed_at: { type: Date, default: null },
  profit_amount: { type: Number, default: 0 },
  profit_details: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const incomeSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  type: { type: String },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'credited', 'cancelled', 'failed'], default: 'pending' },
  extra: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const userSchema = new Schema({
  username: String,
  email: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Register models
const TradeActivation = mongoose.model('TradeActivations', tradeActivationSchema);
const Income = mongoose.model('Incomes', incomeSchema);
const User = mongoose.model('Users', userSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get next day at 1 AM
const getNextDayAt1AM = (date) => {
  const nextDay = new Date(date);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1); // Use UTC to avoid timezone issues
  nextDay.setUTCHours(1, 0, 0, 0); // Set to 1 AM UTC next day
  return nextDay;
};

// Fix dates for a specific activation and its related income records
const fixActivationDates = async (activation) => {
  try {
    const user = await User.findById(activation.user_id);
    const userIdentifier = user ? (user.email || user.username || activation.user_id) : activation.user_id;

    console.log(`\n🔧 Fixing dates for activation ${activation._id} (User: ${userIdentifier})`);
    console.log(`   Activation date: ${activation.activation_date.toISOString()}`);

    // Calculate correct profit processing date (next day at 1 AM)
    const correctProfitDate = getNextDayAt1AM(activation.activation_date);
    console.log(`   Correct profit date: ${correctProfitDate.toISOString()}`);

    // Update trade activation profit_processed_at
    if (activation.profit_status === 'processed') {
      await TradeActivation.findByIdAndUpdate(activation._id, {
        $set: {
          profit_processed_at: correctProfitDate,
          'profit_details.processing_date': correctProfitDate.toISOString(),
          'profit_details.date_fixed_by_script': true,
          'profit_details.script_run_date': new Date().toISOString()
        }
      });
      console.log(`   ✅ Updated activation profit_processed_at`);
    }

    // Find and update related income records
    const relatedIncomes = await Income.find({
      user_id: activation.user_id,
      type: 'daily_profit',
      $or: [
        { 'extra.activation_id': activation._id },
        {
          created_at: {
            $gte: new Date(activation.activation_date.getTime() - 24 * 60 * 60 * 1000), // 1 day before
            $lte: new Date(activation.activation_date.getTime() + 48 * 60 * 60 * 1000)  // 2 days after
          }
        }
      ]
    });

    console.log(`   📝 Found ${relatedIncomes.length} related income records`);

    for (const income of relatedIncomes) {
      // Update income record dates
      await Income.findByIdAndUpdate(income._id, {
        $set: {
          created_at: correctProfitDate,
          updated_at: correctProfitDate,
          'extra.activation_id': activation._id,
          'extra.processingDate': correctProfitDate.toISOString(),
          'extra.date_fixed_by_script': true
        }
      });
      console.log(`   ✅ Updated income record ${income._id} date to ${correctProfitDate.toISOString()}`);
    }

    return {
      success: true,
      activationId: activation._id,
      incomeRecordsUpdated: relatedIncomes.length,
      correctProfitDate
    };

  } catch (error) {
    console.error(`❌ Error fixing dates for activation ${activation._id}:`, error);
    return {
      success: false,
      activationId: activation._id,
      error: error.message
    };
  }
};

// Main function to fix all activation dates
const fixAllActivationDates = async () => {
  try {
    console.log('🚀 Starting date fixing process...\n');

    // Find all processed trade activations
    const activations = await TradeActivation.find({
      profit_status: 'processed'
    }).sort({ activation_date: 1 });

    console.log(`📊 Found ${activations.length} processed trade activations to fix\n`);

    if (activations.length === 0) {
      console.log('✅ No processed trade activations found');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let totalIncomeRecordsUpdated = 0;

    // Process each activation
    for (const activation of activations) {
      const result = await fixActivationDates(activation);

      if (result.success) {
        successCount++;
        totalIncomeRecordsUpdated += result.incomeRecordsUpdated;
      } else {
        errorCount++;
      }

      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('\n📈 Date Fixing Summary:');
    console.log(`✅ Total activations processed: ${activations.length}`);
    console.log(`✅ Successfully fixed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total income records updated: ${totalIncomeRecordsUpdated}`);

    // Additional verification
    console.log('\n🔍 Running verification...');
    await verifyDateConsistency();

  } catch (error) {
    console.error('❌ Error in main date fixing process:', error);
  }
};

// Verify date consistency
const verifyDateConsistency = async () => {
  try {
    // Check for activations where profit_processed_at is not the next day
    const inconsistentActivations = await TradeActivation.aggregate([
      {
        $match: {
          profit_status: 'processed',
          profit_processed_at: { $ne: null }
        }
      },
      {
        $addFields: {
          activationDay: { $dateToString: { format: "%Y-%m-%d", date: "$activation_date" } },
          profitDay: { $dateToString: { format: "%Y-%m-%d", date: "$profit_processed_at" } },
          daysDiff: {
            $divide: [
              { $subtract: ["$profit_processed_at", "$activation_date"] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { daysDiff: { $lt: 0.5 } }, // Same day or too early
            { daysDiff: { $gt: 1.5 } }  // More than 1.5 days later
          ]
        }
      }
    ]);

    console.log(`⚠️  Found ${inconsistentActivations.length} activations with inconsistent dates`);

    if (inconsistentActivations.length > 0) {
      console.log('📋 Inconsistent activations:');
      inconsistentActivations.forEach(activation => {
        console.log(`   - ${activation._id}: Activation ${activation.activationDay}, Profit ${activation.profitDay} (${activation.daysDiff.toFixed(2)} days diff)`);
      });
    }

    // Check income records consistency
    const inconsistentIncomes = await Income.aggregate([
      {
        $match: {
          type: 'daily_profit',
          status: 'credited'
        }
      },
      {
        $lookup: {
          from: 'tradeactivations',
          localField: 'extra.activation_id',
          foreignField: '_id',
          as: 'activation'
        }
      },
      {
        $match: {
          'activation.0': { $exists: true }
        }
      },
      {
        $addFields: {
          activationDate: { $arrayElemAt: ['$activation.activation_date', 0] },
          daysDiff: {
            $divide: [
              { $subtract: ['$created_at', { $arrayElemAt: ['$activation.activation_date', 0] }] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $match: {
          $or: [
            { daysDiff: { $lt: 0.5 } },
            { daysDiff: { $gt: 1.5 } }
          ]
        }
      }
    ]);

    console.log(`⚠️  Found ${inconsistentIncomes.length} income records with inconsistent dates`);

    if (inconsistentIncomes.length === 0) {
      console.log('✅ All dates are now consistent!');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
};

// Run the script
const runScript = async () => {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();

  await fixAllActivationDates();

  console.log('\n🎉 Date fixing script completed successfully!');

  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
};

// Execute the script
runScript().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
