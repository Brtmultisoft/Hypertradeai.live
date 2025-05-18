const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the income schema
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

// Define the user schema (simplified)
const userSchema = new Schema({
  email: String,
  username: String,
  wallet: {
    type: Number,
    default: 0
  }
});

async function verifyProfits() {
  try {
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    
    // Register models
    const Income = mongoose.model('Income', incomeSchema);
    const User = mongoose.model('User', userSchema);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find income records created today
    const incomes = await Income.find({
      type: 'daily_profit',
      created_at: { $gte: today }
    }).sort({ created_at: -1 });
    
    console.log(`Found ${incomes.length} daily profit income records created today`);
    
    // Get user details for each income record
    const incomeDetails = [];
    let totalProfit = 0;
    
    for (const income of incomes) {
      try {
        const user = await User.findById(income.user_id);
        if (user) {
          incomeDetails.push({
            income_id: income._id,
            user_id: income.user_id,
            email: user.email || 'Unknown',
            username: user.username || 'Unknown',
            amount: income.amount,
            wallet_balance: user.wallet,
            created_at: income.created_at
          });
          totalProfit += income.amount;
        } else {
          incomeDetails.push({
            income_id: income._id,
            user_id: income.user_id,
            email: 'User not found',
            username: 'User not found',
            amount: income.amount,
            wallet_balance: 'Unknown',
            created_at: income.created_at
          });
          totalProfit += income.amount;
        }
      } catch (error) {
        console.error(`Error getting user details for income ${income._id}:`, error);
      }
    }
    
    console.log('Income details:');
    console.log(JSON.stringify(incomeDetails, null, 2));
    console.log(`Total profit distributed: $${totalProfit.toFixed(2)}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyProfits();
