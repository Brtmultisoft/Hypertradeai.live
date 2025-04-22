'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Investment Schema Model
 */
const investmentSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    investment_plan_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'InvestmentPlans'
    },
    referrer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    amount: {
        type: Number,
        required: true,
        min: 50,
        max: 10000
    },
    daily_profit: {
        type: Number,
        default: 2.5
    },
    first_deposit_bonus: {
        type: Number,
        default: 0
    },
    referral_bonus: {
        type: Number,
        default: 0
    },
    team_commission: {
        level1: { type: Number, default: 0 },
        level2: { type: Number, default: 0 },
        level3: { type: Number, default: 0 }
    },
    active_member_reward: {
        type: Number,
        default: 0
    },
    total_earnings: {
        type: Number,
        default: 0
    },
    package_type: {
        type: String,
        default: 'trading'
    },
    type: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled', 1, 2, 0],
        default: 'active'
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    last_profit_date: {
        type: Date,
        default: Date.now
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
investmentSchema.plugin(toJSON);
investmentSchema.plugin(paginate);

module.exports = mongoose.model('Investments', investmentSchema);