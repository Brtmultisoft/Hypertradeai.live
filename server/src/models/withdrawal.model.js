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

module.exports = mongoose.model('Withdrawals', withdrawalSchema);