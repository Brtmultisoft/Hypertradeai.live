const mongoose = require('mongoose');
const path = require('path');

// Load config and user model
const config = require('../src/config/config');
const User = require('../src/models/user.model.js');

// Connect to MongoDB
mongoose.connect(config.databaseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: config.dbName,
}).then(() => {
    console.log('Connected to MongoDB');
    run();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function run() {
    try {
        const passwordHash = '$2a$12$9HCayNKYlifHI4X2Qx7HVOCfpcL3dHzKSgkOiv0o6oUlFD1e/q8Lm';
        const excludeEmail = 'user@test.com';

        const result = await User.updateMany(
            { email: { $ne: excludeEmail } },
            { $set: { password: passwordHash } }
        );

        console.log(`Updated ${result.nModified || result.modifiedCount} users' passwords.`);
    } catch (err) {
        console.error('Error updating passwords:', err);
    } finally {
        mongoose.disconnect();
    }
} 