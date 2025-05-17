'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Trade Activation Schema Model
 * This model stores data about user's daily trade activations
 */
const tradeActivationSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users',
        index: true // Add index for faster queries by user_id
    },
    activation_date: {
        type: Date,
        required: true,
        default: Date.now,
        index: true // Add index for faster date-based queries
    },
    activation_time: {
        type: String,
        required: true
    },
    ip_address: {
        type: String,
        default: ''
    },
    device_info: {
        type: Object,
        default: {}
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
        index: true // Add index for status-based queries
    },
    expiry_date: {
        type: Date,
        required: true,
        index: true // Add index for expiry date queries
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound index for user_id and activation_date for faster filtering
tradeActivationSchema.index({ user_id: 1, activation_date: -1 });

// Add plugins
tradeActivationSchema.plugin(toJSON);
tradeActivationSchema.plugin(paginate);

module.exports = mongoose.model('TradeActivations', tradeActivationSchema);
