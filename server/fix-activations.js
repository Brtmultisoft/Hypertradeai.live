/**
 * Script to directly fix trade activations from yesterday
 *
 * This script will:
 * 1. Find all trade activations from yesterday with profit_status = 'pending'
 * 2. Process each user's investment and update their wallet
 * 3. Update the trade activation records
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

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
  profit_error: {
    type: String,
    default: null
  },
  profit_details: {
    type: Object,
    default: {}
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
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  last_profit_date: {
    type: Date,
    default: null
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const userSchema = new Schema({
  email: String,
  username: String,
  wallet: {
    type: Number,
    default: 0
  },
  dailyProfitActivated: Boolean
});

const investmentPlanSchema = new Schema({
  title: String,
  percentage: {
    type: Number,
    default: 0.266 // Default daily ROI percentage
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
  reference_id: mongoose.Schema.Types.ObjectId,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const cronExecutionSchema = new Schema({
  cron_name: String,
  start_time: Date,
  end_time: Date,
  status: String,
  processed_count: Number,
  total_amount: Number,
  error_count: Number,
  error_details: Array,
  execution_details: Object,
  triggered_by: {
    type: String,
    enum: ['automatic', 'manual', 'backup', 'recovery'],
    default: 'manual'
  }
});

async function fixActivations() {
  try {
    console.log('Connecting to MongoDB...');
    // Use the connection string directly since .env might not be loaded correctly
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('Connected to MongoDB successfully');

    // Register models
    const TradeActivation = mongoose.model('TradeActivations', tradeActivationSchema);
    const Investment = mongoose.model('Investments', investmentSchema);
    const User = mongoose.model('Users', userSchema);
    const InvestmentPlan = mongoose.model('InvestmentPlans', investmentPlanSchema);
    const Income = mongoose.model('Income', incomeSchema);
    const CronExecution = mongoose.model('CronExecution', cronExecutionSchema);

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Processing missed activations between ${yesterday.toISOString()} and ${today.toISOString()}`);

    // Create a new cron execution record for this manual process
    const cronExecution = new CronExecution({
      cron_name: 'daily_profit',
      start_time: new Date(),
      status: 'running',
      triggered_by: 'manual',
      server_info: {
        hostname: require('os').hostname(),
        platform: process.platform,
        nodeVersion: process.version
      }
    });

    await cronExecution.save();
    console.log(`Created cron execution record with ID: ${cronExecution._id}`);

    // Find yesterday's pending trade activations
    const pendingActivations = await TradeActivation.find({
      activation_date: {
        $gte: yesterday,
        $lt: today
      },
      status: 'active',
      profit_status: 'pending'
    });

    console.log(`Found ${pendingActivations.length} pending trade activations for yesterday`);

    if (pendingActivations.length === 0) {
      console.log('No pending activations to process');
      await CronExecution.findByIdAndUpdate(cronExecution._id, {
        end_time: new Date(),
        status: 'completed',
        processed_count: 0,
        total_amount: 0
      });
      await mongoose.disconnect();
      return;
    }

    let processedCount = 0;
    let totalProfit = 0;
    let errors = [];
    const startTime = Date.now();

    // Process each activation
    for (const activation of pendingActivations) {
      try {
        // Get user data
        const user = await User.findById(activation.user_id);
        if (!user) {
          console.log(`User not found for activation ${activation._id}`);
          errors.push({
            activation_id: activation._id,
            error: 'User not found'
          });
          continue;
        }

        console.log(`Processing activation for user ${user.email || user.username}`);

        // Check if user has active investments
        const activeInvestments = await Investment.find({
          user_id: activation.user_id,
          status: 'active'
        });

        if (activeInvestments.length === 0) {
          console.log(`No active investments found for user ${user.email || user.username}`);
          await TradeActivation.findByIdAndUpdate(activation._id, {
            profit_status: 'skipped',
            profit_error: 'No active investment found',
            cron_execution_id: cronExecution._id
          });
          continue;
        }

        // Process each investment
        for (const investment of activeInvestments) {
          // Get the investment plan
          const investmentPlan = await InvestmentPlan.findById(investment.investment_plan_id);

          // Use the plan's percentage value or fall back to 0.266% if not available
          const roiRate = investmentPlan ? investmentPlan.percentage : 0.266;
          console.log(`Using ROI rate: ${roiRate}% for investment ${investment._id}`);

          // Calculate daily profit
          const dailyProfit = (investment.amount * roiRate) / 100;
          totalProfit += dailyProfit;

          // Create income record
          const incomeRecord = new Income({
            user_id: user._id,
            amount: dailyProfit,
            type: 'daily_profit',
            description: `Daily profit from investment of $${investment.amount}`,
            reference_id: investment._id,
            status: 'completed'
          });

          await incomeRecord.save();
          console.log(`Created income record with ID: ${incomeRecord._id}`);

          // Update user wallet
          await User.findByIdAndUpdate(user._id, {
            $inc: { wallet: dailyProfit }
          });
          console.log(`Updated user wallet with profit: $${dailyProfit}`);

          // Update investment last profit date
          await Investment.findByIdAndUpdate(investment._id, {
            last_profit_date: new Date()
          });
          console.log(`Updated investment last profit date`);

          // Update trade activation record directly in the database
          await mongoose.connection.db.collection('tradeactivations').updateOne(
            { _id: ObjectId(activation._id) },
            {
              $set: {
                profit_status: 'processed',
                profit_processed_at: new Date(),
                profit_amount: dailyProfit,
                profit_details: {
                  investment_id: investment._id,
                  investment_amount: investment.amount,
                  profit_rate: roiRate,
                  income_id: incomeRecord._id
                },
                cron_execution_id: cronExecution._id
              }
            }
          );
          console.log(`Updated trade activation record directly in database`);

          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing activation ${activation._id}:`, error);
        errors.push({
          activation_id: activation._id,
          error: error.message
        });
      }
    }

    // Update the cron execution record
    const endTime = Date.now();
    const duration = endTime - startTime;

    await CronExecution.findByIdAndUpdate(cronExecution._id, {
      end_time: new Date(),
      duration_ms: duration,
      status: errors.length > 0 ? 'partial_success' : 'completed',
      processed_count: processedCount,
      total_amount: totalProfit,
      error_count: errors.length,
      error_details: errors.length > 0 ? errors : [],
      execution_details: {
        total_activations: pendingActivations.length,
        processed_count: processedCount,
        skipped_count: pendingActivations.length - processedCount
      }
    });

    console.log('\nSummary:');
    console.log(`Total activations processed: ${pendingActivations.length}`);
    console.log(`Successfully processed: ${processedCount}`);
    console.log(`Total profit distributed: $${totalProfit.toFixed(2)}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Duration: ${duration}ms`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
fixActivations();
