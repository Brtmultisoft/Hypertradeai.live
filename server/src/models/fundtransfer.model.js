'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating FundTransfer Schema Model
 */
const fundtransferSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'Users'
    },
    user_id_from: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    amount: {
        type: Number,
        default: 0
    },
    fee: {
        type: Number,
        default: 0
    },
    remark: {
        type: String,
        default: ''
    },
    type: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        default: true
    },
    from_wallet: {
        type: String,
        enum: ['main', 'topup', 'admin'],
        default: 'topup'
    },
    to_wallet: {
        type: String,
        enum: ['main', 'topup', 'admin'],
        default: 'topup'
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
fundtransferSchema.plugin(toJSON);
fundtransferSchema.plugin(paginate);

module.exports = mongoose.model('FundTransfers', fundtransferSchema);