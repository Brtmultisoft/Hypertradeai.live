'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating InvestmentPlan Schema Model
 */
const investmentplanSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    amount_from: {
        type: Number,
        default: 50 // Minimum investment amount
    },
    amount_to: {
        type: Number,
        default: 999999999 // Unlimited investment amount
    },
    percentage: {
        type: Number,
        default: 0.266 // Daily trading profit
    },
    days: {
        type: Number,
        default: 1 // Daily profit calculation
    },
    frequency_in_days: {
        type: Number,
        default: 1 // Daily profit distribution
    },
    first_deposit_bonus: {
        type: Object,
        default: {
            100: 7,
            500: 15,
            1000: 50,
            3000: 100,
            5000: 200,
            10000: 500,
            25000: 1250,
            50000: 2500,
            100000: 5000,
            250000: 12500,
            500000: 25000,
            1000000: 50000
        }
    },
    referral_bonus: {
        type: Object,
        default: {
            100: 5,
            500: 50,
            1000: 90,
            3000: 250,
            5000: 500,
            10000: 700,
            25000: 1500,
            50000: 3000,
            100000: 6000,
            250000: 15000,
            500000: 30000,
            1000000: 60000
        }
    },
    team_commission: {
        type: Object,
        default: {
            level1: 16,
            level2: 8,
            level3: 4
        }
    },
    active_member_rewards: {
        type: Array,
        default: [
            { direct: 5, team: 20, reward: 90 },
            { direct: 7, team: 50, reward: 150 },
            { direct: 9, team: 100, reward: 250 },
            { direct: 11, team: 300, reward: 400 },
            { direct: 15, team: 600, reward: 500 },
            { direct: 20, team: 1000, reward: 600 },
            { direct: 30, team: 3000, reward: 1500 },
            { direct: 40, team: 6000, reward: 3000 },
            { direct: 50, team: 10000, reward: 6000 },
            { direct: 60, team: 30000, reward: 12000 },
            { direct: 70, team: 60000, reward: 20000 },
            { direct: 80, team: 100000, reward: 30000 },
            { direct: 90, team: 300000, reward: 50000 },
            { direct: 100, team: 600000, reward: 110000 },
            { direct: 110, team: 1000000, reward: 200000 }
        ]
    },
    status: {
        type: Boolean,
        default: true
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
investmentplanSchema.plugin(toJSON);
investmentplanSchema.plugin(paginate);

// Add indexes for frequently queried fields
investmentplanSchema.index({ title: 1 });
investmentplanSchema.index({ status: 1 });
investmentplanSchema.index({ created_at: -1 });
investmentplanSchema.index({ amount_from: 1 });
investmentplanSchema.index({ amount_to: 1 });
investmentplanSchema.index({ percentage: 1 });

// Add compound indexes for common query combinations
investmentplanSchema.index({ status: 1, created_at: -1 });
investmentplanSchema.index({ amount_from: 1, amount_to: 1 });

module.exports = mongoose.model('InvestmentPlans', investmentplanSchema);