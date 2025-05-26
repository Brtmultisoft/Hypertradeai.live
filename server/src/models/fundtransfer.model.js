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

// Add indexes for frequently queried fields
fundtransferSchema.index({ user_id: 1 });
fundtransferSchema.index({ user_id_from: 1 });
fundtransferSchema.index({ status: 1 });
fundtransferSchema.index({ created_at: -1 });
fundtransferSchema.index({ type: 1 });
fundtransferSchema.index({ from_wallet: 1 });
fundtransferSchema.index({ to_wallet: 1 });
fundtransferSchema.index({ amount: -1 });

// Add compound indexes for common query combinations
fundtransferSchema.index({ user_id: 1, status: 1 });
fundtransferSchema.index({ user_id: 1, created_at: -1 });
fundtransferSchema.index({ user_id_from: 1, user_id: 1 });
fundtransferSchema.index({ from_wallet: 1, to_wallet: 1 });
fundtransferSchema.index({ user_id: 1, type: 1 });

module.exports = mongoose.model('FundTransfers', fundtransferSchema);