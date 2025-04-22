const mongoose = require('mongoose');
const { fundTransferModel, userModel } = require('../src/models');

async function addMultipleTransfers() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/hypertradeai');
        console.log('Connected to MongoDB');

        // Get some users from the database
        const users = await userModel.find().limit(5);
        
        if (users.length === 0) {
            console.log('No users found in the database. Creating test transfers with dummy IDs.');
        }

        // Create test transfers
        const transfers = [
            // Admin transfer (type 2)
            {
                user_id: users.length > 0 ? users[0]._id.toString() : "user1",
                user_id_from: null,
                amount: 100,
                fee: 0,
                remark: "Admin transfer to user",
                type: 2, // Admin transfer
                from_wallet: "admin",
                to_wallet: "topup",
                status: true,
                created_at: new Date()
            },
            // User to user transfer (type 0)
            {
                user_id: users.length > 1 ? users[1]._id.toString() : "user2",
                user_id_from: users.length > 0 ? users[0]._id.toString() : "user1",
                amount: 50,
                fee: 0,
                remark: "User to user transfer",
                type: 0, // User to user
                from_wallet: "topup",
                to_wallet: "topup",
                status: true,
                created_at: new Date()
            },
            // Self transfer (type 1)
            {
                user_id: users.length > 0 ? users[0]._id.toString() : "user1",
                user_id_from: users.length > 0 ? users[0]._id.toString() : "user1",
                amount: 25,
                fee: 0,
                remark: "Self transfer between wallets",
                type: 1, // Self transfer
                from_wallet: "topup",
                to_wallet: "main",
                status: true,
                created_at: new Date()
            }
        ];

        // Save to database
        const result = await fundTransferModel.insertMany(transfers);
        console.log(`${result.length} test transfers created`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
addMultipleTransfers();
