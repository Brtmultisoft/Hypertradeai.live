const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the investment schema
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

// Define the investment plan schema
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

async function checkInvestments() {
  try {
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');

    // Register models
    const Investment = mongoose.model('Investment', investmentSchema);
    const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);

    // User IDs from May 17 activations
    const userIds = [
      "678f9a82a2dac325900fc47e", // user@test.com
      "6820aa03d0c748e9551b8947", // hypetradeai0001@gmail.com
      "6821a2add0c748e9551b8d31", // sarabjeet01461@gmail.com
      "6821a543d0c748e9551b8f14", // nk1023509@gmail.com
      "6821a955d0c748e9551b8f7c", // gautam.papneja@gmail.com
      "6821a3d5d0c748e9551b8dd7", // manjeetsinghbitta96@gmail.com
      "68219ba6d0c748e9551b8ac4", // hypetradeai0002@gmail.com
      "68258eaa04eb4361394dbda2"  // block@test.com
    ];

    // Find active investments for these users
    const investments = await Investment.find({
      user_id: { $in: userIds.map(id => mongoose.Types.ObjectId(id)) },
      status: 'active'
    });

    console.log(`Found ${investments.length} active investments for users who activated on May 17`);

    // Get investment plans
    const investmentPlanIds = [...new Set(investments.map(inv => inv.investment_plan_id))];
    const investmentPlans = await InvestmentPlan.find({
      _id: { $in: investmentPlanIds }
    });

    // Create a map of plan IDs to percentages
    const planPercentages = {};
    investmentPlans.forEach(plan => {
      planPercentages[plan._id.toString()] = plan.percentage;
    });

    // Calculate expected profits
    const expectedProfits = [];
    let totalProfit = 0;

    for (const investment of investments) {
      const planId = investment.investment_plan_id ? investment.investment_plan_id.toString() : null;
      const percentage = planId && planPercentages[planId] ? planPercentages[planId] : 0.266; // Default to 0.266% if plan not found

      const dailyProfit = (investment.amount * percentage) / 100;
      totalProfit += dailyProfit;

      expectedProfits.push({
        investment_id: investment._id,
        user_id: investment.user_id,
        amount: investment.amount,
        percentage: percentage,
        daily_profit: dailyProfit,
        last_profit_date: investment.last_profit_date
      });
    }

    console.log('Expected profits:');
    console.log(JSON.stringify(expectedProfits, null, 2));
    console.log(`Total expected profit: $${totalProfit.toFixed(2)}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInvestments();
