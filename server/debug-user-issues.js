const mongoose = require('mongoose');
const config = require('./src/config/config');

// Import models
const { userModel, incomeModel, investmentModel, depositModel } = require('./src/models');

/**
 * Debug script to investigate user issues
 * Usage: node debug-user-issues.js
 */

async function debugUserIssues() {
    try {
        // Connect to database
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log('Connected to MongoDB');

        const userEmail = 'rajeev12000@gmail.com';
        
        // 1. Find the user
        console.log('\n=== USER INVESTIGATION ===');
        const user = await userModel.findOne({ email: userEmail });
        
        if (!user) {
            console.log(`❌ User with email ${userEmail} not found`);
            return;
        }
        
        console.log(`✅ User found: ${user.username} (ID: ${user._id})`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`💰 Wallet: $${user.wallet || 0}`);
        console.log(`💳 Wallet Topup: $${user.wallet_topup || 0}`);
        console.log(`📊 Total Investment: $${user.total_investment || 0}`);
        console.log(`🔗 Refer ID: ${user.refer_id}`);
        console.log(`🚫 Is Blocked: ${user.is_blocked || false}`);
        console.log(`✅ Status: ${user.status}`);
        console.log(`📅 Created: ${user.created_at}`);

        // 2. Check deposits
        console.log('\n=== DEPOSIT HISTORY ===');
        const deposits = await depositModel.find({ user_id: user._id }).sort({ created_at: -1 });
        console.log(`📥 Total Deposits: ${deposits.length}`);
        
        let totalDeposited = 0;
        deposits.forEach((deposit, index) => {
            console.log(`${index + 1}. Amount: $${deposit.amount}, Status: ${deposit.status}, Date: ${deposit.created_at}`);
            if (deposit.status === 1) { // Approved deposits
                totalDeposited += deposit.net_amount || deposit.amount;
            }
        });
        console.log(`💵 Total Approved Deposits: $${totalDeposited}`);

        // 3. Check investments
        console.log('\n=== INVESTMENT HISTORY ===');
        const investments = await investmentModel.find({ user_id: user._id }).sort({ created_at: -1 });
        console.log(`📈 Total Investments: ${investments.length}`);
        
        let totalInvested = 0;
        investments.forEach((investment, index) => {
            console.log(`${index + 1}. Amount: $${investment.amount}, Status: ${investment.status}, Date: ${investment.created_at}`);
            totalInvested += investment.amount;
        });
        console.log(`💸 Total Invested: $${totalInvested}`);

        // 4. Check referral bonuses received by this user's referrer
        console.log('\n=== REFERRAL BONUS ANALYSIS ===');
        if (user.refer_id && user.refer_id !== 'admin') {
            const referrer = await userModel.findById(user.refer_id);
            if (referrer) {
                console.log(`👤 Referrer: ${referrer.username} (${referrer.email})`);
                
                // Find all referral bonuses given to the referrer from this user
                const referralBonuses = await incomeModel.find({
                    user_id: user.refer_id,
                    user_id_from: user._id,
                    type: 'referral_bonus'
                }).sort({ created_at: -1 });
                
                console.log(`🎁 Referral bonuses given to referrer: ${referralBonuses.length}`);
                
                let totalReferralBonus = 0;
                referralBonuses.forEach((bonus, index) => {
                    console.log(`${index + 1}. Amount: $${bonus.amount}, Status: ${bonus.status}, Date: ${bonus.created_at}`);
                    console.log(`   Extra: ${JSON.stringify(bonus.extra)}`);
                    totalReferralBonus += bonus.amount;
                });
                console.log(`💰 Total Referral Bonus: $${totalReferralBonus}`);
                
                // Check for duplicates
                if (referralBonuses.length > 1) {
                    console.log(`⚠️  WARNING: Multiple referral bonuses detected! This indicates duplicate bonus issue.`);
                }
            }
        } else {
            console.log('👤 No referrer found or referrer is admin');
        }

        // 5. Investment validation check
        console.log('\n=== INVESTMENT VALIDATION CHECK ===');
        const minInvestment = 50;
        const maxInvestment = 10000;
        
        console.log(`💰 Current wallet_topup: $${user.wallet_topup || 0}`);
        console.log(`📏 Min investment: $${minInvestment}`);
        console.log(`📏 Max investment: $${maxInvestment}`);
        console.log(`🚫 Is blocked: ${user.is_blocked || false}`);
        console.log(`✅ Status: ${user.status}`);
        
        // Check what investment amounts would be valid
        if (user.wallet_topup >= minInvestment) {
            const maxPossibleInvestment = Math.min(user.wallet_topup, maxInvestment);
            console.log(`✅ Can invest between $${minInvestment} and $${maxPossibleInvestment}`);
        } else {
            console.log(`❌ Cannot invest: wallet_topup ($${user.wallet_topup}) is less than minimum ($${minInvestment})`);
        }

        // 6. Check for any pending/failed transactions
        console.log('\n=== TRANSACTION STATUS ===');
        const pendingDeposits = await depositModel.find({ user_id: user._id, status: 0 });
        const rejectedDeposits = await depositModel.find({ user_id: user._id, status: 2 });
        
        console.log(`⏳ Pending deposits: ${pendingDeposits.length}`);
        console.log(`❌ Rejected deposits: ${rejectedDeposits.length}`);

        // 7. Summary and recommendations
        console.log('\n=== SUMMARY & RECOMMENDATIONS ===');
        
        if (user.wallet_topup < minInvestment) {
            console.log('🔍 INVESTMENT ISSUE: User cannot invest due to insufficient wallet_topup balance');
            console.log(`   Current balance: $${user.wallet_topup}`);
            console.log(`   Required minimum: $${minInvestment}`);
            console.log('   Solution: User needs to make a successful deposit first');
        }
        
        if (referralBonuses && referralBonuses.length > 1) {
            console.log('🔍 REFERRAL ISSUE: Multiple referral bonuses detected');
            console.log('   This indicates the duplicate referral bonus bug');
            console.log('   Solution: Implement duplicate prevention in investment controller');
        }

    } catch (error) {
        console.error('Error during investigation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the debug function
debugUserIssues();
