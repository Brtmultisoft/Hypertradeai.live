'use strict';
const { investmentPlanDbHandler } = require('../../services/db');
const logger = require('../../services/logger');
const log = new logger('AdminInvestmentPlanController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const Investment = require('../../models/investment.model');
const Income = require('../../models/income.model');
const User = require('../../models/user.model');

module.exports = {
    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Received request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await investmentPlanDbHandler.getByQuery({});
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    createPlan: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            // Check if user is admin (you may need to implement this check based on your auth system)
            // For now, we'll assume this endpoint is protected by admin middleware

            // Validate the request data
            if (!reqObj.title) {
                responseData.msg = 'Plan title is required';
                return responseHelper.error(res, responseData);
            }

            // Prepare the investment plan data with fixed values as per the plan
            const planData = {
                title: reqObj.title || 'Trading Package',
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

            // Check if a plan already exists
            const existingPlans = await investmentPlanDbHandler.getByQuery({});

            let result;
            if (existingPlans.length > 0) {
                // Update the existing plan
                result = await investmentPlanDbHandler.updateById(existingPlans[0]._id, planData);
                responseData.msg = 'Investment plan updated successfully!';
            } else {
                // Create a new plan
                result = await investmentPlanDbHandler.create(planData);
                responseData.msg = 'Investment plan created successfully!';
            }

            responseData.data = result;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to create/update investment plan with error:', error);
            responseData.msg = 'Failed to create/update investment plan';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let getData = await investmentPlanDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    // createInvestment: async (req, res) => {
    //     let responseData = {};
    //     const { amount, referrer_id } = req.body;
    //     const user_id = req.user.sub;

    //     try {
    //         // Validate investment amount
    //         if (amount < 50 || amount > 10000) {
    //             responseData.msg = 'Investment amount must be between $50 and $10,000';
    //             return responseHelper.error(res, responseData);
    //         }

    //         // Get investment plan
    //         const plan = await investmentPlanDbHandler.getByQuery({ status: true });
    //         if (!plan || plan.length === 0) {
    //             responseData.msg = 'No active investment plan found';
    //             return responseHelper.error(res, responseData);
    //         }

    //         // Check if first deposit
    //         const existingInvestments = await Investment.countDocuments({ user_id });
    //         const isFirstDeposit = existingInvestments === 0;

    //         // Calculate first deposit bonus
    //         let firstDepositBonus = 0;
    //         if (isFirstDeposit) {
    //             for (const [depositAmount, bonus] of Object.entries(plan[0].first_deposit_bonus)) {
    //                 if (amount >= parseInt(depositAmount)) {
    //                     firstDepositBonus = bonus;
    //                 }
    //             }
    //         }

    //         // Create investment
    //         const investment = new Investment({
    //             user_id,
    //             investment_plan_id: plan[0]._id,
    //             referrer_id,
    //             amount,
    //             daily_profit: plan[0].percentage,
    //             first_deposit_bonus,
    //             status: 'active',
    //             start_date: new Date(),
    //             last_profit_date: new Date()
    //         });

    //         await investment.save();

    //         // Create first deposit bonus income if applicable
    //         if (firstDepositBonus > 0) {
    //             const bonusIncome = new Income({
    //                 user_id,
    //                 investment_id: investment._id,
    //                 type: 'first_deposit_bonus',
    //                 amount: firstDepositBonus,
    //                 status: 'pending',
    //                 description: 'First deposit bonus'
    //             });
    //             await bonusIncome.save();
    //         }

    //         // Handle referral bonus if applicable
    //         if (referrer_id) {
    //             const referralBonus = calculateReferralBonus(amount, plan[0]);
    //             if (referralBonus > 0) {
    //                 const referrerIncome = new Income({
    //                     user_id: referrer_id,
    //                     investment_id: investment._id,
    //                     type: 'referral_bonus',
    //                     amount: referralBonus,
    //                     status: 'pending',
    //                     description: 'Referral bonus'
    //                 });
    //                 await referrerIncome.save();
    //             }
    //         }

    //         responseData.msg = 'Investment created successfully';
    //         responseData.data = investment;
    //         return responseHelper.success(res, responseData);
    //     } catch (error) {
    //         log.error('Failed to create investment:', error);
    //         responseData.msg = 'Failed to create investment';
    //         return responseHelper.error(res, responseData);
    //     }
    // },

    calculateDailyProfits: async () => {
        try {
            const activeInvestments = await Investment.find({ status: 'active' });
            const plan = await investmentPlanDbHandler.getByQuery({ status: true });

            for (const investment of activeInvestments) {
                const daysSinceLastProfit = Math.floor((new Date() - investment.last_profit_date) / (1000 * 60 * 60 * 24));

                if (daysSinceLastProfit >= 1) {
                    const dailyProfit = (investment.amount * investment.daily_profit) / 100;

                    const income = new Income({
                        user_id: investment.user_id,
                        investment_id: investment._id,
                        type: 'daily_profit',
                        amount: dailyProfit,
                        status: 'pending',
                        description: 'Daily trading profit'
                    });
                    await income.save();

                    // Update investment
                    investment.total_earnings += dailyProfit;
                    investment.last_profit_date = new Date();
                    await investment.save();

                    // Calculate and distribute team commissions
                    await distributeTeamCommissions(investment, dailyProfit, plan[0]);
                }
            }
        } catch (error) {
            log.error('Error calculating daily profits:', error);
        }
    }
};

function calculateReferralBonus(amount, plan) {
    let bonus = 0;
    for (const [depositAmount, referralBonus] of Object.entries(plan.referral_bonus)) {
        if (amount >= parseInt(depositAmount)) {
            bonus = referralBonus;
        }
    }
    return bonus;
}

async function distributeTeamCommissions(investment, dailyProfit, plan) {
    try {
        let currentUser = await User.findById(investment.user_id);
        let level = 1;

        while (currentUser.refer_id && level <= 3) {
            const referrer = await User.findById(currentUser.refer_id);
            if (!referrer) break;

            const commissionPercentage = plan.team_commission[`level${level}`];
            const commissionAmount = (dailyProfit * commissionPercentage) / 100;

            const commissionIncome = new Income({
                user_id: referrer._id,
                investment_id: investment._id,
                type: 'team_commission',
                amount: commissionAmount,
                level,
                status: 'pending',
                description: `Level ${level} team commission`
            });
            await commissionIncome.save();

            currentUser = referrer;
            level++;
        }
    } catch (error) {
        log.error('Error distributing team commissions:', error);
    }
}

