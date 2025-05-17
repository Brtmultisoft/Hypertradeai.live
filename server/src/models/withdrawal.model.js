'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Withdrawal Schema Model
 */
const withdrawalSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    amount: {
        type: Number,
        default: 0
    },
    fee: {
        type: Number,
        default: 0
    },
    net_amount: {
        type: Number,
        default: 0
    },
    amount_coin: {
        type: Number,
        default: 0
    },
    rate: {
        type: Number,
        default: 1
    },
    txid: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    data: {
        type: Object,
        default: {}
    },
    currency: {
        type: String,
        default: 'USDT'
    },
    currency_coin: {
        type: String,
        default: 'USDT'
    },
    remark: {
        type: String,
        default: "PENDING"
    },
    status: {
        type: Number,
        enum: [0, 1, 2],
        default: 0
    },
    approved_at: {
        type: Date
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
withdrawalSchema.plugin(toJSON);
withdrawalSchema.plugin(paginate);

// Add indexes for frequently queried fields
withdrawalSchema.index({ user_id: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ created_at: -1 });
withdrawalSchema.index({ approved_at: -1 });
withdrawalSchema.index({ txid: 1 });
withdrawalSchema.index({ currency: 1 });
withdrawalSchema.index({ amount: -1 });

// Add compound indexes for common query combinations
withdrawalSchema.index({ user_id: 1, status: 1 });
withdrawalSchema.index({ user_id: 1, created_at: -1 });
withdrawalSchema.index({ status: 1, created_at: -1 });
withdrawalSchema.index({ currency: 1, status: 1 });

module.exports = mongoose.model('Withdrawals', withdrawalSchema);