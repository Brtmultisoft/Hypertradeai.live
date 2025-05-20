/**
 * Script to check yesterday's trade activations and verify if profits were distributed
 *
 * This script will:
 * 1. Find all trade activations from yesterday
 * 2. Check if these activations have been processed (profit_status)
 * 3. Check if the users have active investments
 * 4. Display a summary of activations that should have received profits but didn't
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
  profit_error: {
    type: String,
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
  amount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  }
});

const userSchema = new Schema({
  email: String,
  username: String,
  wallet: {
    type: Number,
    default: 0
  },
  dailyProfitActivated: Boolean
});

const cronExecutionSchema = new Schema({
  cron_name: String,
  start_time: Date,
  end_time: Date,
  status: String,
  processed_count: Number,
  total_amount: Number,
  error_count: Number,
  error_details: Array,
  execution_details: Object
});

async function checkYesterdayActivations() {
  try {
    console.log('Connecting to MongoDB...');
    // Use the connection string directly since .env might not be loaded correctly
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    console.log('Connected to MongoDB successfully');

    // Register models
    const TradeActivation = mongoose.model('TradeActivations', tradeActivationSchema);
    const Investment = mongoose.model('Investments', investmentSchema);
    const User = mongoose.model('Users', userSchema);
    const CronExecution = mongoose.model('CronExecution', cronExecutionSchema);

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`Checking activations between ${yesterday.toISOString()} and ${today.toISOString()}`);

    // Find yesterday's trade activations
    const activations = await TradeActivation.find({
      activation_date: {
        $gte: yesterday,
        $lt: today
      },
      status: 'active'
    }).sort({ activation_date: 1 });

    console.log(`Found ${activations.length} trade activations for yesterday`);

    // Check cron execution records for yesterday
    const cronExecutions = await CronExecution.find({
      cron_name: 'daily_profit',
      start_time: {
        $gte: yesterday,
        $lt: today
      }
    }).sort({ start_time: -1 });

    console.log(`Found ${cronExecutions.length} cron execution records for yesterday`);

    if (cronExecutions.length > 0) {
      console.log('Latest cron execution details:');
      console.log(JSON.stringify(cronExecutions[0], null, 2));
    }

    // Check each activation
    let pendingActivations = 0;
    let processedActivations = 0;
    let skippedActivations = 0;
    let usersWithActiveInvestments = 0;
    let activationsWithoutInvestments = 0;

    const activationDetails = [];

    for (const activation of activations) {
      // Check profit status
      if (activation.profit_status === 'pending') {
        pendingActivations++;
      } else if (activation.profit_status === 'processed') {
        processedActivations++;
      } else if (activation.profit_status === 'skipped') {
        skippedActivations++;
      }

      // Check if user has active investments
      const activeInvestments = await Investment.find({
        user_id: activation.user_id,
        status: 'active'
      });

      const user = await User.findById(activation.user_id);

      if (activeInvestments.length > 0) {
        usersWithActiveInvestments++;

        // If user has active investments but profit wasn't processed, this is an issue
        if (activation.profit_status !== 'processed') {
          activationDetails.push({
            activation_id: activation._id,
            user_id: activation.user_id,
            email: user ? user.email : 'Unknown',
            username: user ? user.username : 'Unknown',
            activation_date: activation.activation_date,
            profit_status: activation.profit_status,
            profit_error: activation.profit_error,
            active_investments: activeInvestments.length,
            investment_amount: activeInvestments.reduce((sum, inv) => sum + inv.amount, 0)
          });
        }
      } else {
        activationsWithoutInvestments++;
      }
    }

    console.log('\nSummary:');
    console.log(`Total activations: ${activations.length}`);
    console.log(`Pending activations: ${pendingActivations}`);
    console.log(`Processed activations: ${processedActivations}`);
    console.log(`Skipped activations: ${skippedActivations}`);
    console.log(`Users with active investments: ${usersWithActiveInvestments}`);
    console.log(`Activations without investments: ${activationsWithoutInvestments}`);

    console.log('\nUsers who should have received profits but didn\'t:');
    console.log(JSON.stringify(activationDetails, null, 2));
    console.log(`Total: ${activationDetails.length} users`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
checkYesterdayActivations();
