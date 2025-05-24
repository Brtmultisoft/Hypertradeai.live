/**
 * Script to update previous trade activations with correct data and dates
 *
 * This script will:
 * 1. Find all trade activations with pending or incorrect profit status
 * 2. Update them with correct profit data and status
 * 3. Ensure credited dates are set to the next day after activation
 * 4. Create corresponding income records if missing
 * 5. Update profit details with accurate information
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
  activation_time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  profit_status: {
    type: String,
    enum: ['pending', 'processed', 'failed', 'skipped'],
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
  profit_error: {
    type: String,
    default: null
  },
  cron_execution_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CronExecution',
    default: null
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const userSchema = new Schema({
  username: String,
  email: String,
  total_investment: { type: Number, default: 0 },
  wallet: { type: Number, default: 0 },
  extra: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const investmentSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  investment_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlans' },
  last_profit_date: { type: Date, default: null }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const investmentPlanSchema = new Schema({
  title: String,
  percentage: { type: Number, default: 0.266 },
  min_amount: Number,
  max_amount: Number
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const incomeSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  investment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investments'
  },
  type: {
    type: String,
    enum: ['daily_profit', 'level_roi_income', 'team_reward', 'referral_bonus', 'rank_bonus', 'other']
  },
  amount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'credited', 'cancelled', 'failed'],
    default: 'pending'
  },
  description: {
    type: String,
    default: ''
  },
  extra: {
    type: Object,
    default: {}
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Register models
const TradeActivation = mongoose.model('TradeActivations', tradeActivationSchema);
const User = mongoose.model('Users', userSchema);
const Investment = mongoose.model('Investments', investmentSchema);
const InvestmentPlan = mongoose.model('InvestmentPlans', investmentPlanSchema);
const Income = mongoose.model('Incomes', incomeSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Calculate daily profit based on investment amount and ROI rate
const calculateDailyProfit = (investmentAmount, roiRate = 0.266) => {
  return (investmentAmount * roiRate) / 100;
};

// Get next day date
const getNextDay = (date) => {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(1, 0, 0, 0); // Set to 1 AM next day
  return nextDay;
};

// Update trade activation with correct data
const updateTradeActivation = async (activation, user, investment, investmentPlan) => {
  try {
    console.log(`\nUpdating activation ${activation._id} for user ${user.email || user.username}`);

    // Calculate correct profit amount
    const roiRate = investmentPlan ? investmentPlan.percentage : 0.266;
    const dailyProfit = calculateDailyProfit(investment.amount, roiRate);

    // Set credited date to next day after activation
    const creditedDate = getNextDay(activation.activation_date);

    console.log(`- Investment amount: $${investment.amount}`);
    console.log(`- ROI rate: ${roiRate}%`);
    console.log(`- Daily profit: $${dailyProfit.toFixed(4)}`);
    console.log(`- Activation date: ${activation.activation_date.toISOString()}`);
    console.log(`- Credited date: ${creditedDate.toISOString()}`);

    // Update trade activation record
    const updateData = {
      profit_status: 'processed',
      profit_processed_at: creditedDate,
      profit_amount: dailyProfit,
      profit_details: {
        investment_id: investment._id,
        investment_amount: investment.amount,
        profit_rate: roiRate,
        processing_date: creditedDate.toISOString(),
        updated_by_script: true,
        script_run_date: new Date().toISOString()
      },
      profit_error: null
    };

    await TradeActivation.findByIdAndUpdate(activation._id, { $set: updateData });
    console.log(`✅ Updated trade activation ${activation._id}`);

    return {
      success: true,
      dailyProfit,
      creditedDate,
      roiRate
    };
  } catch (error) {
    console.error(`❌ Error updating activation ${activation._id}:`, error);
    return { success: false, error: error.message };
  }
};

// Create or update income record
const createOrUpdateIncomeRecord = async (activation, user, investment, dailyProfit, creditedDate, roiRate) => {
  try {
    // Check if income record already exists
    const existingIncome = await Income.findOne({
      user_id: user._id,
      type: 'daily_profit',
      'extra.activation_id': activation._id
    });

    if (existingIncome) {
      console.log(`- Income record already exists: ${existingIncome._id}`);

      // Update existing income record with correct data
      await Income.findByIdAndUpdate(existingIncome._id, {
        $set: {
          amount: dailyProfit,
          status: 'credited',
          created_at: creditedDate,
          updated_at: new Date(),
          extra: {
            ...existingIncome.extra,
            investmentAmount: investment.amount,
            profitPercentage: roiRate,
            processingDate: creditedDate.toISOString(),
            activation_id: activation._id,
            updated_by_script: true
          }
        }
      });

      console.log(`✅ Updated existing income record ${existingIncome._id}`);
      return { success: true, incomeId: existingIncome._id, action: 'updated' };
    } else {
      // Create new income record
      const incomeData = {
        user_id: user._id,
        investment_id: investment._id,
        type: 'daily_profit',
        amount: dailyProfit,
        status: 'credited',
        description: 'Daily ROI',
        extra: {
          investmentAmount: investment.amount,
          profitPercentage: roiRate,
          processingDate: creditedDate.toISOString(),
          activation_id: activation._id,
          created_by_script: true
        },
        created_at: creditedDate,
        updated_at: creditedDate
      };

      const newIncome = await Income.create(incomeData);
      console.log(`✅ Created new income record ${newIncome._id}`);
      return { success: true, incomeId: newIncome._id, action: 'created' };
    }
  } catch (error) {
    console.error(`❌ Error creating/updating income record:`, error);
    return { success: false, error: error.message };
  }
};

// Main function to update trade activations
const updateTradeActivations = async () => {
  try {
    console.log('🚀 Starting trade activation update process...\n');

    // First, let's check what we have in the database
    const totalActivations = await TradeActivation.countDocuments();
    const pendingCount = await TradeActivation.countDocuments({ profit_status: 'pending' });
    const processedCount = await TradeActivation.countDocuments({ profit_status: 'processed' });
    const zeroAmountCount = await TradeActivation.countDocuments({ profit_amount: { $lte: 0 } });

    console.log(`📊 Database Overview:`);
    console.log(`   Total activations: ${totalActivations}`);
    console.log(`   Pending: ${pendingCount}`);
    console.log(`   Processed: ${processedCount}`);
    console.log(`   Zero amounts: ${zeroAmountCount}`);
    console.log('');

    // Find all trade activations that need updating
    const activations = await TradeActivation.find({
      $or: [
        { profit_status: 'pending' },
        { profit_status: 'failed' },
        { profit_amount: { $lte: 0 } },
        { profit_processed_at: null },
        { profit_status: 'processed', profit_amount: { $lte: 0 } }
      ]
    }).sort({ activation_date: 1 });

    console.log(`📋 Query criteria used:`);
    console.log(`   - Pending activations`);
    console.log(`   - Failed activations`);
    console.log(`   - Zero or negative profit amounts`);
    console.log(`   - Missing profit_processed_at dates`);
    console.log(`   - Processed but with zero amounts`);

    console.log(`📊 Found ${activations.length} trade activations to update\n`);

    if (activations.length === 0) {
      console.log('✅ No trade activations need updating');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;
    let incomeCreatedCount = 0;
    let incomeUpdatedCount = 0;

    // Process each activation
    for (const activation of activations) {
      try {
        console.log(`\n📋 Processing activation ${activation._id}...`);

        // Get user data
        const user = await User.findById(activation.user_id);
        if (!user) {
          console.log(`❌ User not found for activation ${activation._id}`);
          errorCount++;
          continue;
        }

        // Get user's active investment
        const investment = await Investment.findOne({
          user_id: user._id,
          status: 'active'
        }).sort({ created_at: -1 });

        if (!investment) {
          console.log(`❌ No active investment found for user ${user.email || user.username}`);
          errorCount++;
          continue;
        }

        // Get investment plan
        const investmentPlan = await InvestmentPlan.findById(investment.investment_plan_id);

        // Update trade activation
        const updateResult = await updateTradeActivation(activation, user, investment, investmentPlan);

        if (updateResult.success) {
          // Create or update income record
          const incomeResult = await createOrUpdateIncomeRecord(
            activation,
            user,
            investment,
            updateResult.dailyProfit,
            updateResult.creditedDate,
            updateResult.roiRate
          );

          if (incomeResult.success) {
            if (incomeResult.action === 'created') {
              incomeCreatedCount++;
            } else {
              incomeUpdatedCount++;
            }
          }

          updatedCount++;
        } else {
          errorCount++;
        }

        // Add small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing activation ${activation._id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`✅ Total activations processed: ${activations.length}`);
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Income records created: ${incomeCreatedCount}`);
    console.log(`📝 Income records updated: ${incomeUpdatedCount}`);

  } catch (error) {
    console.error('❌ Error in main update process:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
const runScript = async () => {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();
  console.log('✅ Connected to MongoDB\n');

  await updateTradeActivations();

  console.log('\n🎉 Script completed successfully!');
};

// Execute the script
runScript().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
