'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Deposit Schema Model
 */
const depositSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    amount: { // base coin
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
    amount_coin: { // conversion one
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
        default: null
    },
    status: {
        type: Number,
        enum: [0, 1, 2],
        default: 0
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
depositSchema.plugin(toJSON);
depositSchema.plugin(paginate);

// Add indexes for frequently queried fields
depositSchema.index({ user_id: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ created_at: -1 });
depositSchema.index({ txid: 1 });
depositSchema.index({ currency: 1 });
depositSchema.index({ amount: -1 });

// Add compound indexes for common query combinations
depositSchema.index({ user_id: 1, status: 1 });
depositSchema.index({ user_id: 1, created_at: -1 });
depositSchema.index({ status: 1, created_at: -1 });
depositSchema.index({ currency: 1, status: 1 });

module.exports = mongoose.model('Deposits', depositSchema);