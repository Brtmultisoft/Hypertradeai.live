'use strict';
const InvestmentPlan = require('../models/investmentplan.model');
const logger = require('../services/logger');
const log = logger.getAppLevelInstance();

/**
 * Seed default investment plan for HebrewServe business plan
 */
const seedDefaultInvestmentPlan = async () => {
    // try {
    //     // Check if there's already an investment plan
    //     const existingPlan = await InvestmentPlan.findOne({ title: 'HebrewServe Trading Package' });

    //     if (!existingPlan) {
    //         log.info('Creating default investment plan for HebrewServe business plan');

    //         // Create default investment plan
    //         await InvestmentPlan.create({
    //             title: 'HebrewServe Trading Package',
    //             amount_from: 50,
    //             amount_to: 10000,
    //             percentage: 2.5,
    //             days: 1,
    //             frequency_in_days: 1,
    //             first_deposit_bonus: {
    //                 100: 7,
    //                 500: 15,
    //                 1000: 50,
    //                 3000: 100,
    //                 5000: 200,
    //                 10000: 500
    //             },
    //             referral_bonus: {
    //                 100: 5,
    //                 500: 50,
    //                 1000: 90,
    //                 3000: 250,
    //                 5000: 500,
    //                 10000: 700
    //             },
    //             team_commission: {
    //                 level1: 16,
    //                 level2: 8,
    //                 level3: 4
    //             },
    //             active_member_rewards: [
    //                 { direct: 5, team: 20, reward: 90 },
    //                 { direct: 7, team: 50, reward: 150 },
    //                 { direct: 9, team: 100, reward: 250 },
    //                 { direct: 11, team: 300, reward: 400 },
    //                 { direct: 15, team: 600, reward: 500 },
    //                 { direct: 20, team: 1000, reward: 600 },
    //                 { direct: 30, team: 3000, reward: 1500 },
    //                 { direct: 40, team: 6000, reward: 3000 },
    //                 { direct: 50, team: 10000, reward: 6000 },
    //                 { direct: 60, team: 30000, reward: 12000 },
    //                 { direct: 70, team: 60000, reward: 20000 },
    //                 { direct: 80, team: 100000, reward: 30000 },
    //                 { direct: 90, team: 300000, reward: 50000 },
    //                 { direct: 100, team: 600000, reward: 110000 },
    //                 { direct: 110, team: 1000000, reward: 200000 }
    //             ],
    //             status: true
    //         });

    //         log.info('Default investment plan created successfully');
    //     } else {
    //         log.info('Default investment plan already exists');
    //     }
    // } catch (error) {
    //     log.error('Error seeding default investment plan:', error);
    // }
};

module.exports = seedDefaultInvestmentPlan;
