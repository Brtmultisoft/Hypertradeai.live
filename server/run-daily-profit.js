const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

// Define schemas
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

const investmentPlanSchema = new Schema({
  title: {
    type: String,
    require: true
  },
  percentage: {
    type: Number,
    default: 0.26 // Daily trading profit
  }
});

const userSchema = new Schema({
  email: String,
  username: String,
  wallet: {
    type: Number,
    default: 0
  },
  extra: {
    type: Object,
    default: {}
  },
  dailyProfitActivated: Boolean,
  lastDailyProfitActivation: Date
});

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
    enum: ['daily_profit', 'level_roi', 'team_reward', 'referral_bonus', 'rank_bonus', 'other']
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

async function processDailyTradingProfit() {
  try {
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    
    // Register models
    const Investment = mongoose.model('Investment', investmentSchema);
    const InvestmentPlan = mongoose.model('InvestmentPlan', investmentPlanSchema);
    const User = mongoose.model('User', userSchema);
    const Income = mongoose.model('Income', incomeSchema);
    
    // Get all active investments
    const activeInvestments = await Investment.find({ status: 'active' });
    
    console.log(`Processing daily profit for ${activeInvestments.length} active investments`);
    let processedCount = 0;
    let totalProfit = 0;
    
    // Set today's date for profit calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    
    for (const investment of activeInvestments) {
      // Get the last profit date for reference
      const lastProfitDate = new Date(investment.last_profit_date || investment.created_at);
      
      // Log the last profit date for debugging
      console.log(`Investment ID: ${investment._id}, Last profit date: ${lastProfitDate}`);
      
      // Get user information
      const user = await User.findById(investment.user_id);
      if (!user) {
        console.error(`User not found for investment ${investment._id}. Skipping...`);
        continue;
      }
      
      // Check if user is in our list of May 17 activations
      if (!userIds.includes(investment.user_id.toString())) {
        console.log(`User ${user._id} (${user.email}) did not activate on May 17. Skipping...`);
        continue;
      }
      
      console.log(`Processing ROI for user ${user._id} (${user.email})`);
      
      // Get the investment plan to use its percentage value
      const investmentPlan = await InvestmentPlan.findById(investment.investment_plan_id);
      
      // Use the plan's percentage value or fall back to 0.26% if not available
      const roiRate = investmentPlan ? investmentPlan.percentage : 0.26;
      console.log(`Using ROI rate: ${roiRate}% for investment ${investment._id}`);
      
      // Calculate daily profit based on the investment amount and ROI rate
      const dailyProfit = (investment.amount * roiRate) / 100;
      totalProfit += dailyProfit;
      
      console.log(`Processing profit for investment ${investment._id}: $${dailyProfit} (${roiRate}% of $${investment.amount})`);
      
      try {
        // Add profit to user's wallet
        const walletUpdate = await User.findByIdAndUpdate(
          investment.user_id,
          {
            $inc: {
              wallet: +dailyProfit,
              "extra.dailyProfit": dailyProfit
            }
          },
          { new: true }
        );
        
        console.log(`Wallet update result for user ${investment.user_id}: ${walletUpdate ? 'Success' : 'Failed'}`);
        if (walletUpdate) {
          console.log(`New wallet balance: $${walletUpdate.wallet}`);
        }
        
        // Create income record
        const incomeRecord = await Income.create({
          user_id: ObjectId(investment.user_id),
          investment_id: investment._id,
          type: 'daily_profit',
          amount: dailyProfit,
          status: 'credited',
          description: 'Daily ROI',
          extra: {
            investmentAmount: investment.amount,
            profitPercentage: roiRate
          }
        });
        
        console.log(`Income record created: ${incomeRecord ? 'Success' : 'Failed'}`);
        
        // Update last profit date
        const dateUpdate = await Investment.findByIdAndUpdate(
          investment._id,
          {
            last_profit_date: today
          },
          { new: true }
        );
        
        console.log(`Last profit date updated: ${dateUpdate ? 'Success' : 'Failed'}`);
        
        processedCount++;
      } catch (investmentError) {
        console.error(`Error processing profit for investment ${investment._id}:`, investmentError);
      }
    }
    
    console.log(`Daily profit processing completed. Processed ${processedCount} investments with total profit of $${totalProfit.toFixed(2)}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    
    return { success: true, processedCount, totalProfit };
  } catch (error) {
    console.error('Error processing daily trading profit:', error);
    return { success: false, error: error.message };
  }
}

processDailyTradingProfit();
