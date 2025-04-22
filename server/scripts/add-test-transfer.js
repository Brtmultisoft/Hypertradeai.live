const mongoose = require('mongoose');
const { fundTransferModel } = require('../src/models');

async function addTestTransfer() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/hypertradeai');
        console.log('Connected to MongoDB');

        // Create a test fund transfer
        const testTransfer = {
            user_id: "admin", // Recipient
            user_id_from: null, // Admin transfer
            amount: 100,
            fee: 0,
            remark: "Test admin transfer",
            type: 2, // Admin transfer
            from_wallet: "admin",
            to_wallet: "topup",
            status: true
        };

        // Save to database
        const result = await fundTransferModel.create(testTransfer);
        console.log('Test transfer created:', result);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the function
addTestTransfer();
