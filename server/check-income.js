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

async function checkRecentIncome() {
  try {
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');

    // Register and use the Income model
    const Income = mongoose.model('Income', incomeSchema);

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Find recent daily profit incomes
    const incomes = await Income.find({
      type: 'daily_profit',
      created_at: { $gte: yesterday }
    }).sort({ created_at: -1 }).limit(5);

    console.log('Recent daily profit incomes:', JSON.stringify(incomes, null, 2));

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRecentIncome();
