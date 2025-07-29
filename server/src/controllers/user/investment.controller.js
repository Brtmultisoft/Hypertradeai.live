'use strict';
const logger = require('../../services/logger');
const log = new logger('InveatmentController').getChildLogger();
const { investmentDbHandler, investmentPlanDbHandler, userDbHandler, incomeDbHandler, settingDbHandler } = require('../../services/db');
const { getTopLevelByRefer } = require('../../services/commonFun');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const {ethers} = require("ethers")
const { userModel } = require('../../models');
const {distributeLevelIncome, distributeGlobalAutoPoolMatrixIncome, processTeamCommission} = require("./cron.controller")

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { now } = require('mongoose')

// Create a trading package investment
const createTradingPackageInvestment = async (user_id, amount, plan) => {
    try {
        console.log('Creating trading package investment with:');
        console.log('- User ID:', user_id);
        console.log('- Amount:', amount);
        console.log('- Plan ID:', plan._id);
        console.log('- Plan percentage:', plan.percentage);

        // Create the investment object
        const investmentData = {
            user_id,
            investment_plan_id: plan._id,
            amount: amount,
            daily_profit: plan.percentage || 0.266,
            status: "active", // Use numeric status 1 for active (for compatibility with both string and numeric status checks)
            package_type: 'trading',
            type: 0, // For compatibility with existing code
            start_date: new Date(),
            last_profit_date: new Date(),
            extra: {
                plan_name: 'Trading Package'
            }
        };

        console.log('Investment data prepared:', JSON.stringify(investmentData));

        // Create investment entry for trading package
        const investment = await investmentDbHandler.create(investmentData);

        console.log('Investment created successfully:', investment._id);
        return investment;
    } catch (error) {
        console.error('Failed to create trading package investment:', error);
        log.error('Failed to create trading package investment:', error);
        throw error;
    }
};

// Legacy function for backward compatibility
// const createInvestmentPackages = async (user_id, slotValue, amount) => {
//     const packages = ['x3', 'x6', 'x9'];
//     const investments = [];

//     try {
//         // Create investment entries for all three packages
//         for (const packageType of packages) {
//             const investment = await investmentDbHandler.create({
//                 user_id,
//                 slot_value: slotValue,
//                 amount: amount,
//                 package_type: packageType,
//                 status: 1
//             });
//             investments.push(investment);
//         }

//         return investments;
//     } catch (error) {
//         log.error('Failed to create investment packages:', error);
//         throw error;
//     }
// };

module.exports = {
    // New method for trading package investment
    addTradingPackage: async (req, res) => {
        let responseData = {};
        try {
            // Debug: Log request body
            console.log('Request body:', req.body);

            const { amount } = req.body;
            const user_id = req.user.sub;

            // Debug: Log user ID
            console.log('User ID:', user_id);
            console.log('Investment amount:', amount);

            if (amount < 50 ) {
                responseData.msg = "Investment amount must be more than $50";
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getOneByQuery({_id : user_id });

            // Debug: Log user data
            console.log('User data:', user ? 'User found' : 'User not found');
            if (user) {
                console.log('User wallet balance:', user.wallet);
                console.log('User last investment amount:', user.last_investment_amount);
            }

            if (!user) {
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
            }

            // Check if user has sufficient balance in wallet_topup
            if (user.wallet_topup < amount) {
                responseData.msg = "Insufficient top-up wallet balance";
                return responseHelper.error(res, responseData);
            }


            // Get investment plan
            console.log('Fetching investment plans...');
            let plans = await investmentPlanDbHandler.getAll({});

            // If plans is not an array or is empty, try to get plans directly using mongoose
            if (!plans || !Array.isArray(plans) || plans.length === 0) {
                try {
                    console.log('Plans not found using handler, trying direct mongoose query...');
                    const mongoose = require('mongoose');
                    const InvestmentPlan = mongoose.model('InvestmentPlans');
                    const mongoosePlans = await InvestmentPlan.find({});

                    console.log('Direct mongoose query found plans:', mongoosePlans.length);
                    if (mongoosePlans && mongoosePlans.length > 0) {
                        plans = mongoosePlans;
                    }
                } catch (err) {
                    console.error('Error finding plans with mongoose:', err);
                }
            }

            // Debug: Log investment plans
            console.log('Investment plans found:', plans ? plans.length : 0);
            console.log('First plan:', plans && plans[0] ? plans[0].title : 'No plan');

            if (!plans || plans.length === 0) {
                console.log('No investment plans found. Creating default plan...');

                // Create default investment plan with fixed values as per the plan
                const defaultPlan = {
                    title: 'Trading Package',
                    amount_from: 50, // Minimum investment $50
                    amount_to: 0,    // No maximum (unlimited)
                    percentage: 0.266,    // 0.266% daily ROI
                    days: 1,          // Daily distribution
                    frequency_in_days: 1,
                    referral_bonus: 3, // 3% direct referral commission
                    team_commission: {
                        level1: 25, // 25% of ROI income for level 1
                        level2: 10, // 10% of ROI income for level 2
                        level3: 5,  // 5% of ROI income for level 3
                        level4: 4,  // 4% of ROI income for level 4
                        level5: 3,  // 3% of ROI income for level 5
                        level6: 2,  // 2% of ROI income for level 6
                        level7: 1   // 1% of ROI income for level 7
                    },
                    status: true,
                    extra: {
                        description: 'MLM Trading Package with 8% daily ROI and 7-level team commission structure',
                        min_direct_referrals_for_level_roi: 1 // Require at least 1 direct referral for level ROI
                    }
                };

                try {
                    await investmentPlanDbHandler.create(defaultPlan);
                    console.log('Default investment plan created successfully');

                    // Get the newly created plan
                    plans = await investmentPlanDbHandler.getAll({});

                    if (!plans || plans.length === 0) {
                        responseData.msg = "Failed to create investment plan";
                        return responseHelper.error(res, responseData);
                    }
                } catch (planError) {
                    console.error('Error creating default investment plan:', planError);
                    responseData.msg = "No investment plans available";
                    return responseHelper.error(res, responseData);
                }
            }

            const plan = plans[0]; // Use the first plan

            // Debug: Log plan details
            console.log('Using plan:', plan.title);
            console.log('Plan percentage:', plan.percentage);

            // Process first deposit bonus if this is user's first investment
            const userInvestments = await investmentDbHandler.getByQuery({ user_id: user_id });

            // Debug: Log user investments
            console.log('User investments count:', userInvestments.length);

            let firstDepositBonus = 0;

            // if (userInvestments.length === 0) {
            //     // This is the first deposit, calculate bonus
            //     console.log('First deposit detected, calculating bonus');
            //     console.log('First deposit bonus structure:', plan.first_deposit_bonus);

            //     const bonusThresholds = Object.keys(plan.first_deposit_bonus)
            //         .map(Number)
            //         .sort((a, b) => a - b);

            //     console.log('Bonus thresholds:', bonusThresholds);

            //     // Find the highest threshold that is less than or equal to the investment amount
            //     let applicableThreshold = 0;
            //     for (const threshold of bonusThresholds) {
            //         if (amount >= threshold) {
            //             applicableThreshold = threshold;
            //         } else {
            //             break;
            //         }
            //     }

            //     console.log('Applicable threshold:', applicableThreshold);

            //     if (applicableThreshold > 0) {
            //         firstDepositBonus = plan.first_deposit_bonus[applicableThreshold];
            //         console.log('First deposit bonus amount:', firstDepositBonus);

            //         // Create first deposit bonus income record
            //         const bonusIncome = await incomeDbHandler.create({
            //             user_id: ObjectId(user_id),
            //             investment_id: null, // Will be updated after investment is created
            //             type: 'first_deposit_bonus',
            //             amount: firstDepositBonus,
            //             status: 'credited',
            //             description: 'First deposit bonus',
            //             extra: {
            //                 investmentAmount: amount,
            //                 bonusThreshold: applicableThreshold
            //             }
            //         });

            //         console.log('Bonus income created:', bonusIncome ? 'Success' : 'Failed');

            //         // Add bonus to user's wallet
            //         const walletUpdate = await userDbHandler.updateOneByQuery({_id: user_id}, {
            //             $inc: { wallet: firstDepositBonus }
            //         });

            //         console.log('Wallet updated with bonus:', walletUpdate ? 'Success' : 'Failed');
            //     }
            // }

            // Referral bonus will be processed after successful investment creation

            // Create the investment
            console.log('Creating investment with plan:', plan.title);
            const investment = await createTradingPackageInvestment(user_id, amount, plan);
            console.log('Investment created:', investment ? 'Success' : 'Failed');
            if (investment) {
                console.log('Investment ID:', investment._id);
            }

            // Update user's wallet_topup and total investment
            console.log('Updating user wallet_topup. Current wallet_topup balance:', user.wallet_topup);
            console.log('Amount to deduct:', amount);

            try {
                // Use updateOneByQuery instead of updateById for more reliable updates
                const walletUpdate = await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    {
                        $inc: {
                            wallet_topup: -amount,
                            total_investment: amount
                        },
                        $set: {
                            last_investment_amount: amount
                        }
                    }
                );

                console.log('Wallet update result:', JSON.stringify(walletUpdate));

                // Verify the update was successful
                if (!walletUpdate || !walletUpdate.acknowledged || walletUpdate.modifiedCount === 0) {
                    throw new Error('Wallet update failed');
                }

                // Get updated user data to confirm the change
                const updatedUser = await userDbHandler.getById(user_id);
                console.log('Updated wallet_topup balance:', updatedUser.wallet_topup);
                console.log('User wallet_topup updated after investment: Success');
            } catch (walletError) {
                console.error('Error updating wallet_topup:', walletError);
                throw new Error(`Failed to update wallet_topup: ${walletError.message}`);
            }

            // Team commission (Level ROI income) will be processed by the daily cron job
            console.log('Team commission (Level ROI income) will be processed by the daily cron job');
            // Not processing team commission in real-time as per requirement

            // Update first deposit bonus income with investment ID if applicable
            if (firstDepositBonus > 0) {
                console.log('Updating first deposit bonus income with investment ID');
                const bonusUpdate = await incomeDbHandler.updateByQuery(
                    {
                        user_id: ObjectId(user_id),
                        type: 'first_deposit_bonus',
                        'extra.investmentAmount': amount
                    },
                    { $set: { investment_id: investment._id } }
                );

                console.log('Bonus income updated:', bonusUpdate ? 'Success' : 'Failed');
            }

            // Process referral bonus AFTER successful investment creation
            try {
                console.log('==================== PROCESSING REFERRAL BONUS AFTER INVESTMENT ====================');
                if (!user.refer_id || user.refer_id === 'admin') {
                    console.log('No referrer ID found or referrer is admin. Skipping referral bonus.');
                } else {
                    const referrer = await userDbHandler.getById(user.refer_id);

                    if (referrer) {
                        console.log(`Found referrer: ${referrer.username} (${referrer.email})`);

                        // Check if referrer has invested (required for referral bonus)
                        let hasReferrerInvested = referrer.total_investment > 0;
                        console.log('Referrer has total_investment > 0:', hasReferrerInvested);

                        // If not found by total_investment, check for active investments
                        if (!hasReferrerInvested) {
                            console.log('Checking for active investments since total_investment is 0 or null');
                            const referrerInvestments = await investmentDbHandler.getByQuery({
                                user_id: referrer._id,
                                status: { $in: [1, 'active'] }
                            });
                            hasReferrerInvested = referrerInvestments && referrerInvestments.length > 0;
                        }

                        console.log('Final determination - Has referrer invested:', hasReferrerInvested ? 'Yes' : 'No');

                        if (hasReferrerInvested) {
                            // Check if referral bonus already exists for this specific investment to prevent duplicates
                            const existingReferralBonus = await incomeDbHandler.getByQuery({
                                user_id: ObjectId(referrer._id),
                                user_id_from: ObjectId(user_id),
                                investment_id: ObjectId(investment._id),
                                type: 'referral_bonus'
                            });

                            if (existingReferralBonus.length === 0) {
                                // Calculate referral bonus - fixed 3% of investment amount
                                const referralBonusRate = 3;
                                const referralBonus = (amount * referralBonusRate) / 100;
                                console.log(`Referral bonus: ${referralBonusRate}% of $${amount} = $${referralBonus}`);

                                // Create referral bonus income record
                                const referralIncome = await incomeDbHandler.create({
                                    user_id: ObjectId(referrer._id),
                                    user_id_from: ObjectId(user_id),
                                    investment_id: ObjectId(investment._id), // Link to the investment
                                    type: 'referral_bonus',
                                    amount: referralBonus,
                                    status: 'credited',
                                    description: 'Direct Referral Commission',
                                    extra: {
                                        referralAmount: amount,
                                        commissionRate: referralBonusRate,
                                        fromUser: user_id,
                                        investmentId: investment._id,
                                        timestamp: new Date().toISOString()
                                    }
                                });

                                console.log('Referral income created:', referralIncome ? referralIncome._id : 'Failed');

                                if (referralIncome) {
                                    // Update referrer's wallet and income tracking
                                    const referrerCheck = await userDbHandler.getById(referrer._id);
                                    if (!referrerCheck.extra) {
                                        await userDbHandler.updateOneByQuery(
                                            {_id: referrer._id},
                                            { $set: { extra: { directIncome: 0, totalIncome: 0 } } }
                                        );
                                        console.log('Initialized extra field for referrer');
                                    }

                                    const referrerUpdate = await userDbHandler.updateOneByQuery(
                                        {_id: referrer._id},
                                        {
                                            $inc: {
                                                wallet: referralBonus,
                                                "extra.directIncome": referralBonus,
                                                "extra.totalIncome": referralBonus
                                            }
                                        }
                                    );

                                    console.log('Referrer wallet updated with bonus:', referrerUpdate && referrerUpdate.modifiedCount > 0 ? 'Success' : 'Failed');
                                }
                            } else {
                                console.log('Referral bonus already exists for this specific investment, skipping');
                            }
                        } else {
                            console.log('Referrer has not invested. Skipping referral bonus.');
                        }
                    } else {
                        console.log('Referrer not found in database. Skipping referral bonus.');
                    }
                }
                console.log('==================== END REFERRAL BONUS PROCESSING ====================');
            } catch (error) {
                console.error('Error processing referral bonus:', error);
                // Don't throw error here to allow the investment to complete successfully
            }

            responseData.msg = "Trading package investment successful!";
            responseData.data = {
                investment: investment,
                firstDepositBonus: firstDepositBonus
            };
            return responseHelper.success(res, responseData);

        }catch(error) {
            console.error('Trading package investment failed with error:', error);
            log.error('Trading package investment failed:', error);
            responseData.msg = "Failed to process investment";
            return responseHelper.error(res, responseData);
        }
    },

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            // reqObj.type = 0;
            let getList = await investmentDbHandler.getAllInUser(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
    getAllStacked: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            reqObj.type = 1;
            let getList = await investmentDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
    getAllStackedToken: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            reqObj.type = 2;
            let getList = await investmentDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let id = req.params.id;
        try {
            let getData = await investmentPlanDbHandler.getById(id);
            console.log("*************");
            console.log(id)
            console.log(getData)
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    add: async (req, res) => {
        let responseData = {};
        try {
            const { amount } = req.body;
            const user_id = req.user.sub;

            // Validate amount
            if (amount < 50) {
                responseData.msg = "Investment amount must be at least $50";
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getById(user_id);
            if (!user) {
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
            }

            // Check if user has sufficient balance in wallet_topup
            if (user.wallet_topup < amount) {
                responseData.msg = "Insufficient top-up wallet balance";
                return responseHelper.error(res, responseData);
            }

            // Check if investment amount is greater than or equal to last investment
            if (user.last_investment_amount > 0 && amount < user.last_investment_amount) {
                responseData.msg = `New investment amount must be greater than or equal to your last investment of $${user.last_investment_amount}`;
                return responseHelper.error(res, responseData);
            }

            // Get investment plan
            const plans = await investmentPlanDbHandler.getAll({});
            if (!plans || plans.length === 0) {
                responseData.msg = "No investment plans available";
                return responseHelper.error(res, responseData);
            }
            const plan = plans[0]; // Use the first plan

            // Process first deposit bonus if this is user's first investment
            const userInvestments = await investmentDbHandler.getByQuery({ user_id: user_id });
            // let firstDepositBonus = 0;

            // if (userInvestments.length === 0) {
            //     // This is the first deposit, calculate bonus
            //     const bonusThresholds = Object.keys(plan.first_deposit_bonus)
            //         .map(Number)
            //         .sort((a, b) => a - b);

            //     // Find the highest threshold that is less than or equal to the investment amount
            //     let applicableThreshold = 0;
            //     for (const threshold of bonusThresholds) {
            //         if (amount >= threshold) {
            //             applicableThreshold = threshold;
            //         } else {
            //             break;
            //         }
            //     }

            //     if (applicableThreshold > 0) {
            //         firstDepositBonus = plan.first_deposit_bonus[applicableThreshold];

            //         // Create first deposit bonus income record
            //         await incomeDbHandler.create({
            //             user_id: ObjectId(user_id),
            //             investment_id: null, // Will be updated after investment is created
            //             type: 'first_deposit_bonus',
            //             amount: firstDepositBonus,
            //             status: 'credited',
            //             description: 'First deposit bonus',
            //             extra: {
            //                 investmentAmount: amount,
            //                 bonusThreshold: applicableThreshold
            //             }
            //         });

            //         // Add bonus to user's wallet
            //         await userDbHandler.updateByQuery({_id: user_id}, {
            //             $inc: { wallet: firstDepositBonus }
            //         });
            //     }
            // }

            // Referral bonus will be processed after successful investment creation

            // Create the investment
            const investment = await createTradingPackageInvestment(user_id, amount, plan);

            // Update user's wallet_topup and total investment
            console.log('Updating user wallet_topup in add method. Current wallet_topup balance:', user.wallet_topup);
            console.log('Amount to deduct:', amount);

            try {
                // Use updateOneByQuery instead of updateById for more reliable updates
                const walletUpdate = await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    {
                        $inc: {
                            wallet_topup: -amount,
                            total_investment: amount
                        },
                        $set: {
                            last_investment_amount: amount
                        }
                    }
                );

                console.log('Wallet update result in add method:', JSON.stringify(walletUpdate));

                // Verify the update was successful
                if (!walletUpdate || !walletUpdate.acknowledged || walletUpdate.modifiedCount === 0) {
                    throw new Error('Wallet update failed in add method');
                }

                // Get updated user data to confirm the change
                const updatedUser = await userDbHandler.getById(user_id);
                console.log('Updated wallet_topup balance in add method:', updatedUser.wallet_topup);
            } catch (walletError) {
                console.error('Error updating wallet_topup in add method:', walletError);
                throw new Error(`Failed to update wallet_topup in add method: ${walletError.message}`);
            }

            // Process team commission
            try {
                console.log('Processing team commission for investment');
                const teamCommissionResult = await processTeamCommission(user_id, amount);
                console.log('Team commission processing result:', teamCommissionResult ? 'Success' : 'Failed');
            } catch (commissionError) {
                console.error('Error processing team commission:', commissionError);
                // Don't throw error here to allow the investment to complete
            }

            // Update first deposit bonus income with investment ID if applicable
            if (firstDepositBonus > 0) {
                await incomeDbHandler.updateByQuery(
                    {
                        user_id: ObjectId(user_id),
                        type: 'first_deposit_bonus',
                        'extra.investmentAmount': amount
                    },
                    { $set: { investment_id: investment._id } }
                );
            }

            // Process referral bonus AFTER successful investment creation
            try {
                console.log('Processing referral bonus after successful investment');
                if (user.refer_id && user.refer_id !== 'admin') {
                    const referrer = await userDbHandler.getById(user.refer_id);
                    if (referrer) {
                        console.log(`Found referrer: ${referrer.username} (${referrer.email})`);

                        // Calculate referral bonus
                        const bonusThresholds = Object.keys(plan.referral_bonus)
                            .map(Number)
                            .sort((a, b) => a - b);

                        // Find the highest threshold that is less than or equal to the investment amount
                        let applicableThreshold = 0;
                        for (const threshold of bonusThresholds) {
                            if (amount >= threshold) {
                                applicableThreshold = threshold;
                            } else {
                                break;
                            }
                        }

                        if (applicableThreshold > 0) {
                            const referralBonus = plan.referral_bonus[applicableThreshold];
                            console.log(`Applicable threshold: $${applicableThreshold}, Bonus: $${referralBonus}`);

                            // Check if referral bonus already exists for this specific investment to prevent duplicates
                            const existingReferralBonus = await incomeDbHandler.getByQuery({
                                user_id: ObjectId(referrer._id),
                                user_id_from: ObjectId(user_id),
                                investment_id: ObjectId(investment._id),
                                type: 'referral_bonus'
                            });

                            if (existingReferralBonus.length === 0) {
                                console.log('No existing referral bonus found, creating new one');

                                // Create referral bonus income record only if none exists
                                const directIncomeRecord = await incomeDbHandler.create({
                                    user_id: ObjectId(referrer._id),
                                    user_id_from: ObjectId(user_id),
                                    investment_id: ObjectId(investment._id), // Link to the investment
                                    type: 'referral_bonus',
                                    amount: referralBonus,
                                    status: 'credited',
                                    description: 'Direct Referral Commission',
                                    extra: {
                                        referralAmount: amount,
                                        bonusThreshold: applicableThreshold,
                                        fromUser: user_id,
                                        investmentId: investment._id,
                                        timestamp: new Date().toISOString()
                                    }
                                });

                                console.log('Referral income record created:', directIncomeRecord ? directIncomeRecord._id : 'Failed');

                                if (directIncomeRecord) {
                                    // Add bonus to referrer's wallet and update directIncome tracking
                                    const referrerData = await userDbHandler.getById(referrer._id);
                                    if (!referrerData.extra) {
                                        // Initialize the extra field if it doesn't exist
                                        await userDbHandler.updateOneByQuery(
                                            {_id: referrer._id},
                                            { $set: { extra: { directIncome: 0, totalIncome: 0 } } }
                                        );
                                        console.log('Initialized extra field for referrer');
                                    }

                                    // Update referrer's wallet and income tracking
                                    const walletUpdateResult = await userDbHandler.updateByQuery(
                                        {_id: referrer._id},
                                        {
                                            $inc: {
                                                wallet: referralBonus,
                                                "extra.directIncome": referralBonus,
                                                "extra.totalIncome": referralBonus
                                            }
                                        }
                                    );

                                    console.log('Referrer wallet updated with bonus:', walletUpdateResult ? 'Success' : 'Failed');
                                }
                            } else {
                                console.log('Referral bonus already exists for this specific investment, skipping');
                            }
                        } else {
                            console.log('Investment amount does not meet minimum threshold for referral bonus');
                        }
                    } else {
                        console.log('Referrer not found in database');
                    }
                } else {
                    console.log('User has no referrer or referrer is admin');
                }
            } catch (referralError) {
                console.error('Error processing referral bonus:', referralError);
                // Don't throw error here to allow the investment to complete successfully
            }

            responseData.msg = "Trading package investment successful!";
            responseData.data = {
                investment: investment,
                firstDepositBonus: firstDepositBonus
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Trading package investment failed:', error);
            responseData.msg = "Failed to process investment";
            return responseHelper.error(res, responseData);
        }
    },
    addMembership : async (req, res) => {
        console.log(req.body)
        let responseData = {};
        try {
            const {membershipType} = req.body;
            const user_id = req.user.sub;

             const amount = membershipType == "prime" ? 2500 : 5000;
             const user = await userDbHandler.getById(user_id);
             if(!user){
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
             }
            //  if(user.wallet < amount){
            //      responseData.msg = "Insufficient Balance";
            //      return responseHelper.error(res, responseData);
            //  }

            console.log('Updating user wallet for membership. Current wallet balance:', user.wallet);
            console.log('Membership amount to deduct:', amount);

            try {
                const walletUpdate = await userDbHandler.updateOneByQuery(
                    {_id : user_id},
                    {
                        $inc : {
                            wallet : -amount
                        },
                        $set : {
                            isPrimeMember : membershipType == "prime" ? true : user.isPrimeMember,
                            isFounderMember : membershipType == "founder" ? true : user.isFounderMember
                        }
                    }
                );

                console.log('Membership wallet update result:', JSON.stringify(walletUpdate));

                // Verify the update was successful
                if (!walletUpdate || !walletUpdate.acknowledged || walletUpdate.modifiedCount === 0) {
                    throw new Error('Membership wallet update failed');
                }

                // Get updated user data to confirm the change
                const updatedUser = await userDbHandler.getById(user_id);
                console.log('Updated wallet balance after membership:', updatedUser.wallet);
            } catch (walletError) {
                console.error('Error updating wallet for membership:', walletError);
                throw new Error(`Failed to update wallet for membership: ${walletError.message}`);
            }

            try {
                console.log('Creating membership investment record');
                const investmentData = {
                    user_id : user_id,
                    amount : amount,
                    package_type : membershipType,
                    status : "active",
                    type : membershipType == "prime" ? 3 : 4,
                };

                console.log('Membership investment data:', JSON.stringify(investmentData));

                const investment = await investmentDbHandler.create(investmentData);

                console.log('Membership investment created:', investment ? 'Success' : 'Failed');
                if (investment) {
                    console.log('Membership investment ID:', investment._id);
                }
            } catch (investmentError) {
                console.error('Error creating membership investment:', investmentError);
                throw new Error(`Failed to create membership investment: ${investmentError.message}`);
            }
             responseData.msg = `${membershipType.charAt(0).toUpperCase() + membershipType.slice(1)} membership activated successfully!`;
             responseData.data = {
                 membershipType: membershipType
             };
             return responseHelper.success(res, responseData);

        } catch (error) {
            console.error('Membership activation failed:', error);
            responseData.msg = "Failed to activate membership";
            return responseHelper.error(res, responseData);
        }
    },
    add2: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = { _id: ObjectId(user.sub) };
        let reqObj = req.body;

        try {
            let amount = reqObj.amount;

            // Check if amount is valid
            if (amount <= 0) {
                responseData.msg = "Amount must be greater than zero.";
                return responseHelper.error(res, responseData);
            }

            // Fetch user wallet balance
            const userRecord = await userDbHandler.getById(user_id);
            if (!userRecord) {
                responseData.msg = "User not found.";
                return responseHelper.error(res, responseData);
            }

            const walletBalance = userRecord.wallet_topup || 0;

            // Check if amount is greater than wallet balance
            if (amount > walletBalance) {
                responseData.msg = "Insufficient wallet balance.";
                return responseHelper.error(res, responseData);
            }

            // Ensure stacked_amount is a number
            let wallet = parseFloat(userRecord.wallet) || 0;
            //  Note wallet_topup is Total Bought ICO
            //  Note wallet is Stacked ICO
            // Deduct amount from wallet
            await userDbHandler.updateOneByQuery(user_id, {
                $inc: { wallet_topup: -amount }
            }).then(async response => {
                if (!response.acknowledged || response.modifiedCount === 0) throw "Amount not deducted!";

                // Update stacked amount
                await userDbHandler.updateOneByQuery(user_id, {
                    $inc: { wallet: +amount }
                }).then(async response => {
                    if (!response.acknowledged || response.modifiedCount === 0) throw "User Topup Value is not updated!";
                }).catch(e => { throw `Error while updating topup amount: ${e}` });
            }).catch(e => { throw `Error while deducting amount: ${e}` });
            let data = {
                user_id: user_id,
                type: 1,
                amount: amount,

                status: 2
            }

            let iData = await investmentDbHandler.create(data);
            responseData.msg = "Stacked successful!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update data with error:', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    add3: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = { _id: ObjectId(user.sub) };
        let reqObj = req.body;

        try {
            let amount = reqObj.amount;

            let investment_plan_id = reqObj.investment_plan_id;

            await userDbHandler.updateOneByQuery(user_id,
                {
                    $inc: { wallet_token: +amount }
                }
            ).then(async response => {

                if (!response.acknowledged || response.modifiedCount === 0) throw `Amount not deducted !!!`

                await userDbHandler.updateOneByQuery({ _id: user_id },
                    {
                        $inc: { topup: amount }
                    }
                ).then(async response => {
                    if (!response.acknowledged || response.modifiedCount === 0) throw `User Topup Value is not updated !!!`
                }).catch(e => { throw `Error while updating topup amount: ${e}` })

            }).catch(e => { throw `Error while adding token amount: ${e}` })

            let data = {
                user_id: user_id,
                type: 2,
                amount: amount,

                status: 2
            }

            let iData = await investmentDbHandler.create(data);
            responseData.msg = "Stacked successful!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update data with error:', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    getCount: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await investmentDbHandler.getCount(reqObj, user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    // Add function to get user's investments across all packages
    getAllUserInvestments: async (req, res) => {
        let responseData = {};
        try {
            const user_id = req.user.sub;
            const investments = await investmentDbHandler.getByQuery({
                user_id,
                status: { $in: ['1', 'active'] },
                package_type: 'trading'
            });

            responseData.msg = "Investments fetched successfully";
            responseData.data = investments;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch user investments:', error);
            responseData.msg = "Failed to fetch investments";
            return responseHelper.error(res, responseData);
        }
    },

    getSum: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            console.log('Getting investment sum for user:', user_id);
            let getData = await investmentDbHandler.getSum(reqObj, user_id);
            console.log('Investment sum result:', getData);

            // If no investments found, return default values
            if (!getData || getData.length === 0) {
                responseData.msg = "Data fetched successfully!";
                responseData.data = [{ amount: 0, count: 0 }];
                return responseHelper.success(res, responseData);
            }

            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },


};