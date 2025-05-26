'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Income Schema Model
 */
const incomeSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    investment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Investments',
        default: null
    },
    type: {
        type: String,
        enum: ['daily_profit', 'first_deposit_bonus', 'referral_bonus', 'team_commission', 'active_member_reward', 'trade_booster', 'level_roi_income', 'team_reward'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    level: {
        type: Number,
        default: 0 // For team commission levels (1, 2, 3)
    },
    status: {
        type: String,
        enum: ['pending', 'credited', 'cancelled'],
        default: 'pending'
    },
    description: {
        type: String,
        required: false
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
incomeSchema.plugin(toJSON);
incomeSchema.plugin(paginate);

// Add indexes for frequently queried fields
incomeSchema.index({ user_id: 1 });
incomeSchema.index({ investment_id: 1 });
incomeSchema.index({ type: 1 });
incomeSchema.index({ status: 1 });
incomeSchema.index({ created_at: -1 });
incomeSchema.index({ amount: -1 });
incomeSchema.index({ level: 1 });

// Add compound indexes for common query combinations
incomeSchema.index({ user_id: 1, type: 1 });
incomeSchema.index({ user_id: 1, status: 1 });
incomeSchema.index({ user_id: 1, created_at: -1 });
incomeSchema.index({ type: 1, status: 1 });
incomeSchema.index({ user_id: 1, type: 1, created_at: -1 });

module.exports = mongoose.model('Incomes', incomeSchema);