const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the trade activation schema
const tradeActivationSchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Users'
  },
  activation_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  activation_time: {
    type: String,
    required: true
  },
  ip_address: {
    type: String,
    default: ''
  },
  device_info: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  expiry_date: {
    type: Date,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Define the user schema (simplified)
const userSchema = new Schema({
  email: String,
  username: String,
  dailyProfitActivated: Boolean,
  lastDailyProfitActivation: Date
});

async function checkMay17Activations() {
  try {
    await mongoose.connect('mongodb+srv://dev3brt:dev3brt@hypertradeai.qopdrdq.mongodb.net/hypertradeai?retryWrites=true&w=majority&appName=HypertradeAI');
    
    // Register models
    const TradeActivation = mongoose.model('TradeActivation', tradeActivationSchema);
    const User = mongoose.model('User', userSchema);
    
    // Set date range for May 17, 2025
    const startDate = new Date('2025-05-17T00:00:00Z');
    const endDate = new Date('2025-05-17T23:59:59Z');
    
    console.log(`Checking activations between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    // Find activations on May 17
    const activations = await TradeActivation.find({
      activation_date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ activation_date: 1 });
    
    console.log(`Found ${activations.length} activations on May 17, 2025`);
    
    // Get user details for each activation
    const activationDetails = [];
    for (const activation of activations) {
      try {
        const user = await User.findById(activation.user_id);
        if (user) {
          activationDetails.push({
            activation_id: activation._id,
            user_id: activation.user_id,
            email: user.email || 'Unknown',
            username: user.username || 'Unknown',
            activation_date: activation.activation_date,
            activation_time: activation.activation_time,
            status: activation.status
          });
        } else {
          activationDetails.push({
            activation_id: activation._id,
            user_id: activation.user_id,
            email: 'User not found',
            username: 'User not found',
            activation_date: activation.activation_date,
            activation_time: activation.activation_time,
            status: activation.status
          });
        }
      } catch (error) {
        console.error(`Error getting user details for activation ${activation._id}:`, error);
      }
    }
    
    console.log('Activation details:');
    console.log(JSON.stringify(activationDetails, null, 2));
    
    // Alternatively, check users with lastDailyProfitActivation on May 17
    const usersWithActivation = await User.find({
      lastDailyProfitActivation: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    console.log(`Found ${usersWithActivation.length} users with lastDailyProfitActivation on May 17, 2025`);
    
    const userDetails = usersWithActivation.map(user => ({
      user_id: user._id,
      email: user.email || 'Unknown',
      username: user.username || 'Unknown',
      lastDailyProfitActivation: user.lastDailyProfitActivation
    }));
    
    console.log('User activation details:');
    console.log(JSON.stringify(userDetails, null, 2));
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMay17Activations();
