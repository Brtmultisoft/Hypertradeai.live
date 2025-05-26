/**
 * Script to check current trade activation status before running updates
 *
 * This script will:
 * 1. Analyze current trade activation data
 * 2. Check for pending/failed activations
 * 3. Verify date consistency
 * 4. Provide recommendations
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();

// Define schemas
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

// Analyze trade activations
const analyzeTradeActivations = async () => {
  console.log('📊 Analyzing Trade Activations...\n');

  // Get overall statistics
  const totalActivations = await TradeActivation.countDocuments();
  const pendingActivations = await TradeActivation.countDocuments({ profit_status: 'pending' });
  const processedActivations = await TradeActivation.countDocuments({ profit_status: 'processed' });
  const failedActivations = await TradeActivation.countDocuments({ profit_status: 'failed' });
  const skippedActivations = await TradeActivation.countDocuments({ profit_status: 'skipped' });

  console.log('📈 Overall Statistics:');
  console.log(`   Total activations: ${totalActivations}`);
  console.log(`   Pending: ${pendingActivations}`);
  console.log(`   Processed: ${processedActivations}`);
  console.log(`   Failed: ${failedActivations}`);
  console.log(`   Skipped: ${skippedActivations}`);

  // Check for activations with zero profit amount
  const zeroAmountActivations = await TradeActivation.countDocuments({
    profit_status: 'processed',
    profit_amount: { $lte: 0 }
  });

  console.log(`   Processed with zero amount: ${zeroAmountActivations}`);

  // Check for activations without profit_processed_at date
  const noProcessedDateActivations = await TradeActivation.countDocuments({
    profit_status: 'processed',
    profit_processed_at: null
  });

  console.log(`   Processed without date: ${noProcessedDateActivations}`);

  return {
    total: totalActivations,
    pending: pendingActivations,
    processed: processedActivations,
    failed: failedActivations,
    skipped: skippedActivations,
    zeroAmount: zeroAmountActivations,
    noProcessedDate: noProcessedDateActivations
  };
};

// Check date consistency
const checkDateConsistency = async () => {
  console.log('\n📅 Checking Date Consistency...\n');

  // Find activations where profit date is not the next day
  const inconsistentDates = await TradeActivation.aggregate([
    {
      $match: {
        profit_status: 'processed',
        profit_processed_at: { $ne: null }
      }
    },
    {
      $addFields: {
        daysDiff: {
          $divide: [
            { $subtract: ['$profit_processed_at', '$activation_date'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $match: {
        $or: [
          { daysDiff: { $lt: 0.5 } }, // Same day or earlier
          { daysDiff: { $gt: 1.5 } }  // More than 1.5 days later
        ]
      }
    }
  ]);

  console.log(`🔍 Date Consistency Results:`);
  console.log(`   Activations with inconsistent dates: ${inconsistentDates.length}`);

  if (inconsistentDates.length > 0) {
    console.log('\n   Sample inconsistent dates:');
    inconsistentDates.slice(0, 5).forEach(activation => {
      console.log(`   - ${activation._id}: ${activation.daysDiff.toFixed(2)} days difference`);
    });
  }

  return inconsistentDates.length;
};

// Check income records
const checkIncomeRecords = async () => {
  console.log('\n💰 Checking Income Records...\n');

  const totalIncomes = await Income.countDocuments({ type: 'daily_profit' });
  const creditedIncomes = await Income.countDocuments({ type: 'daily_profit', status: 'credited' });
  const pendingIncomes = await Income.countDocuments({ type: 'daily_profit', status: 'pending' });

  console.log(`📊 Income Statistics:`);
  console.log(`   Total daily profit incomes: ${totalIncomes}`);
  console.log(`   Credited: ${creditedIncomes}`);
  console.log(`   Pending: ${pendingIncomes}`);

  // Check for income records without activation_id
  const incomesWithoutActivationId = await Income.countDocuments({
    type: 'daily_profit',
    'extra.activation_id': { $exists: false }
  });

  console.log(`   Without activation_id: ${incomesWithoutActivationId}`);

  return {
    total: totalIncomes,
    credited: creditedIncomes,
    pending: pendingIncomes,
    withoutActivationId: incomesWithoutActivationId
  };
};

// Get recent activations for detailed analysis
const getRecentActivations = async () => {
  console.log('\n📋 Recent Activations Analysis...\n');

  const recentActivations = await TradeActivation.find({})
    .sort({ activation_date: -1 })
    .limit(10);

  console.log('🕐 Last 10 activations:');
  for (let i = 0; i < recentActivations.length; i++) {
    const activation = recentActivations[i];

    // Get user info separately
    let userIdentifier = 'Unknown';
    try {
      const user = await User.findById(activation.user_id);
      userIdentifier = user ? (user.email || user.username || activation.user_id) : activation.user_id;
    } catch (error) {
      userIdentifier = activation.user_id;
    }

    const activationDate = activation.activation_date.toISOString().split('T')[0];
    const profitDate = activation.profit_processed_at ?
      activation.profit_processed_at.toISOString().split('T')[0] : 'Not set';

    console.log(`   ${i + 1}. ${userIdentifier} - ${activationDate} - ${activation.profit_status} - $${activation.profit_amount} - ${profitDate}`);
  }
};

// Provide recommendations
const provideRecommendations = (stats, inconsistentDates, incomeStats) => {
  console.log('\n💡 Recommendations:\n');

  const issues = [];
  const recommendations = [];

  if (stats.pending > 0) {
    issues.push(`${stats.pending} pending activations need processing`);
    recommendations.push('Run the update script to process pending activations');
  }

  if (stats.failed > 0) {
    issues.push(`${stats.failed} failed activations need attention`);
    recommendations.push('Review failed activations and retry processing');
  }

  if (stats.zeroAmount > 0) {
    issues.push(`${stats.zeroAmount} processed activations have zero profit amount`);
    recommendations.push('Update profit amounts for processed activations');
  }

  if (stats.noProcessedDate > 0) {
    issues.push(`${stats.noProcessedDate} processed activations missing profit_processed_at date`);
    recommendations.push('Set proper processing dates for all processed activations');
  }

  if (inconsistentDates > 0) {
    issues.push(`${inconsistentDates} activations have inconsistent profit processing dates`);
    recommendations.push('Fix dates to ensure profit is credited the next day after activation');
  }

  if (incomeStats.withoutActivationId > 0) {
    issues.push(`${incomeStats.withoutActivationId} income records missing activation_id reference`);
    recommendations.push('Link income records to their corresponding trade activations');
  }

  if (issues.length === 0) {
    console.log('✅ No major issues found! The system appears to be in good shape.');
  } else {
    console.log('⚠️  Issues found:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log('\n🔧 Recommended actions:');
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    console.log('\n📝 To fix these issues, run:');
    console.log('   node run-trade-activation-update.js');
  }
};

// Main analysis function
const runAnalysis = async () => {
  try {
    console.log('🔍 Trade Activation Status Check\n');
    console.log('=====================================\n');

    const stats = await analyzeTradeActivations();
    const inconsistentDates = await checkDateConsistency();
    const incomeStats = await checkIncomeRecords();
    await getRecentActivations();

    console.log('\n=====================================\n');
    provideRecommendations(stats, inconsistentDates, incomeStats);

    // Create analysis report
    const report = {
      timestamp: new Date().toISOString(),
      trade_activations: stats,
      inconsistent_dates: inconsistentDates,
      income_records: incomeStats,
      recommendations: {
        needs_update: stats.pending > 0 || stats.failed > 0 || stats.zeroAmount > 0 ||
                     stats.noProcessedDate > 0 || inconsistentDates > 0 ||
                     incomeStats.withoutActivationId > 0,
        priority_issues: []
      }
    };

    if (stats.pending > 0) report.recommendations.priority_issues.push('pending_activations');
    if (stats.zeroAmount > 0) report.recommendations.priority_issues.push('zero_profit_amounts');
    if (inconsistentDates > 0) report.recommendations.priority_issues.push('inconsistent_dates');

    const fs = require('fs');
    const reportPath = require('path').join(__dirname, 'activation-status-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the analysis
const main = async () => {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();
  await runAnalysis();
};

main().catch(error => {
  console.error('💥 Analysis failed:', error);
  process.exit(1);
});
