/**
 * Debug script to check actual trade activation data
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

const userSchema = new Schema({
  username: String,
  email: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Register models
const TradeActivation = mongoose.model('TradeActivations', tradeActivationSchema);
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

const debugActivations = async () => {
  try {
    console.log('🔍 Debugging Trade Activations...\n');
    
    // Get all activations with detailed breakdown
    const allActivations = await TradeActivation.find({}).sort({ activation_date: -1 });
    
    console.log(`📊 Total activations found: ${allActivations.length}\n`);
    
    // Group by status
    const statusGroups = {};
    const profitAmountGroups = {
      zero: [],
      positive: [],
      negative: []
    };
    
    for (const activation of allActivations) {
      // Group by status
      if (!statusGroups[activation.profit_status]) {
        statusGroups[activation.profit_status] = [];
      }
      statusGroups[activation.profit_status].push(activation);
      
      // Group by profit amount
      if (activation.profit_amount === 0) {
        profitAmountGroups.zero.push(activation);
      } else if (activation.profit_amount > 0) {
        profitAmountGroups.positive.push(activation);
      } else {
        profitAmountGroups.negative.push(activation);
      }
    }
    
    console.log('📈 Status Breakdown:');
    for (const [status, activations] of Object.entries(statusGroups)) {
      console.log(`   ${status}: ${activations.length}`);
    }
    
    console.log('\n💰 Profit Amount Breakdown:');
    console.log(`   Zero amounts: ${profitAmountGroups.zero.length}`);
    console.log(`   Positive amounts: ${profitAmountGroups.positive.length}`);
    console.log(`   Negative amounts: ${profitAmountGroups.negative.length}`);
    
    // Show recent activations with details
    console.log('\n📋 Recent 10 Activations (with details):');
    for (let i = 0; i < Math.min(10, allActivations.length); i++) {
      const activation = allActivations[i];
      
      let userEmail = 'Unknown';
      try {
        const user = await User.findById(activation.user_id);
        userEmail = user ? (user.email || user.username) : 'Not found';
      } catch (error) {
        userEmail = 'Error loading';
      }
      
      const activationDate = activation.activation_date.toISOString().split('T')[0];
      const profitDate = activation.profit_processed_at ? 
        activation.profit_processed_at.toISOString().split('T')[0] : 'Not set';
      
      console.log(`   ${i + 1}. ${userEmail}`);
      console.log(`      ID: ${activation._id}`);
      console.log(`      Activation: ${activationDate}`);
      console.log(`      Status: ${activation.profit_status}`);
      console.log(`      Amount: $${activation.profit_amount}`);
      console.log(`      Profit Date: ${profitDate}`);
      console.log(`      Has Details: ${Object.keys(activation.profit_details || {}).length > 0}`);
      console.log('');
    }
    
    // Check for specific issues
    console.log('🔍 Specific Issue Analysis:');
    
    // Pending activations
    const pendingActivations = await TradeActivation.find({ profit_status: 'pending' });
    console.log(`   Pending activations: ${pendingActivations.length}`);
    
    // Zero amount processed activations
    const zeroAmountProcessed = await TradeActivation.find({ 
      profit_status: 'processed', 
      profit_amount: { $lte: 0 } 
    });
    console.log(`   Processed with zero amount: ${zeroAmountProcessed.length}`);
    
    // Missing profit_processed_at
    const missingProcessedAt = await TradeActivation.find({ 
      profit_status: 'processed', 
      profit_processed_at: null 
    });
    console.log(`   Processed without date: ${missingProcessedAt.length}`);
    
    // Date inconsistencies
    const dateInconsistencies = await TradeActivation.aggregate([
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
            { daysDiff: { $lt: 0.5 } },
            { daysDiff: { $gt: 1.5 } }
          ]
        }
      }
    ]);
    console.log(`   Date inconsistencies: ${dateInconsistencies.length}`);
    
    if (pendingActivations.length > 0) {
      console.log('\n📋 Pending Activations Details:');
      for (let i = 0; i < Math.min(5, pendingActivations.length); i++) {
        const activation = pendingActivations[i];
        let userEmail = 'Unknown';
        try {
          const user = await User.findById(activation.user_id);
          userEmail = user ? (user.email || user.username) : 'Not found';
        } catch (error) {
          userEmail = 'Error loading';
        }
        
        console.log(`   ${i + 1}. ${userEmail} - ${activation.activation_date.toISOString().split('T')[0]} - ${activation._id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the debug
const main = async () => {
  await connectDB();
  await debugActivations();
};

main().catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
