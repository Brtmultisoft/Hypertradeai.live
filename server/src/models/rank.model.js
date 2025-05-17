'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Rank Schema Model
 */
const rankSchema = new Schema({
    name: {
        type: String,
        required: true,
        enum: ['ACTIVE', 'PRIME', 'VETERAM', 'ROYAL', 'SUPREME']
    },
    min_trade_balance: {
        type: Number,
        required: true
    },
    active_team: {
        type: Number,
        required: true
    },
    daily_limit_view: {
        type: Number,
        required: true
    },
    trade_booster: {
        type: Number,
        required: true
    },
    level_roi_income: {
        type: Number,
        required: true
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
rankSchema.plugin(toJSON);
rankSchema.plugin(paginate);

// Add indexes for frequently queried fields
rankSchema.index({ name: 1 }, { unique: true });
rankSchema.index({ status: 1 });
rankSchema.index({ min_trade_balance: 1 });
rankSchema.index({ created_at: -1 });

// Add compound indexes for common query combinations
rankSchema.index({ name: 1, status: 1 });

module.exports = mongoose.model('Ranks', rankSchema);
