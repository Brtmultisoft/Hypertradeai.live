const mongoose = require('mongoose');
const config = require('./src/config/config');

// Import models
const { userModel, incomeModel } = require('./src/models');

/**
 * Script to fix duplicate referral bonuses and prevent future duplicates
 * Usage: node fix-duplicate-referral-bonuses.js
 */

async function fixDuplicateReferralBonuses() {
    try {
        // Connect to database
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log('Connected to MongoDB');

        console.log('\n=== ANALYZING DUPLICATE REFERRAL BONUSES ===');

        // Find all referral bonuses grouped by user_id and user_id_from
        const duplicates = await incomeModel.aggregate([
            {
                $match: {
                    type: 'referral_bonus',
                    user_id_from: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        user_id: '$user_id',
                        user_id_from: '$user_id_from'
                    },
                    count: { $sum: 1 },
                    records: { $push: '$$ROOT' }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log(`Found ${duplicates.length} sets of duplicate referral bonuses`);

        let totalDuplicatesRemoved = 0;
        let totalAmountToRefund = 0;

        for (const duplicate of duplicates) {
            const { user_id, user_id_from } = duplicate._id;
            const records = duplicate.records;
            
            console.log(`\n--- Processing duplicates for referrer ${user_id} from user ${user_id_from} ---`);
            console.log(`Found ${records.length} duplicate records`);

            // Get user details
            const referrer = await userModel.findById(user_id);
            const referredUser = await userModel.findById(user_id_from);

            if (referrer && referredUser) {
                console.log(`Referrer: ${referrer.username} (${referrer.email})`);
                console.log(`Referred User: ${referredUser.username} (${referredUser.email})`);
            }

            // Sort records by creation date (keep the first one, remove the rest)
            records.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            
            const keepRecord = records[0];
            const removeRecords = records.slice(1);

            console.log(`Keeping record: ${keepRecord._id} (Amount: $${keepRecord.amount}, Date: ${keepRecord.created_at})`);

            let refundAmount = 0;
            for (const record of removeRecords) {
                console.log(`Removing duplicate: ${record._id} (Amount: $${record.amount}, Date: ${record.created_at})`);
                refundAmount += record.amount;
                
                // Remove the duplicate record
                await incomeModel.findByIdAndDelete(record._id);
                totalDuplicatesRemoved++;
            }

            if (refundAmount > 0 && referrer) {
                // Deduct the duplicate amount from referrer's wallet
                console.log(`Deducting $${refundAmount} from referrer's wallet`);
                
                await userModel.findByIdAndUpdate(user_id, {
                    $inc: {
                        wallet: -refundAmount,
                        'extra.directIncome': -refundAmount,
                        'extra.totalIncome': -refundAmount
                    }
                });

                totalAmountToRefund += refundAmount;
            }
        }

        console.log('\n=== SUMMARY ===');
        console.log(`Total duplicate records removed: ${totalDuplicatesRemoved}`);
        console.log(`Total amount refunded: $${totalAmountToRefund}`);

        // Now let's check the specific user mentioned
        console.log('\n=== CHECKING SPECIFIC USER: rajeev12000@gmail.com ===');
        const specificUser = await userModel.findOne({ email: 'rajeev12000@gmail.com' });
        
        if (specificUser && specificUser.refer_id && specificUser.refer_id !== 'admin') {
            const referralBonuses = await incomeModel.find({
                user_id: specificUser.refer_id,
                user_id_from: specificUser._id,
                type: 'referral_bonus'
            });

            console.log(`Referral bonuses for this user: ${referralBonuses.length}`);
            
            if (referralBonuses.length > 1) {
                console.log('⚠️  This user still has duplicate referral bonuses that need attention');
            } else if (referralBonuses.length === 1) {
                console.log('✅ This user now has only one referral bonus record');
            } else {
                console.log('ℹ️  This user has no referral bonus records');
            }
        }

        console.log('\n=== CREATING PREVENTION INDEX ===');
        
        // Create a compound unique index to prevent future duplicates
        try {
            await incomeModel.collection.createIndex(
                { 
                    user_id: 1, 
                    user_id_from: 1, 
                    type: 1 
                },
                { 
                    unique: true,
                    partialFilterExpression: { 
                        type: 'referral_bonus',
                        user_id_from: { $exists: true, $ne: null }
                    },
                    name: 'unique_referral_bonus_per_user'
                }
            );
            console.log('✅ Created unique index to prevent future duplicate referral bonuses');
        } catch (indexError) {
            if (indexError.code === 11000) {
                console.log('ℹ️  Unique index already exists');
            } else {
                console.log('❌ Error creating unique index:', indexError.message);
            }
        }

    } catch (error) {
        console.error('Error during fix process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the fix function
fixDuplicateReferralBonuses();
