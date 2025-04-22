'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating TeamReward Schema Model
 */
const teamRewardSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    team_deposit: {
        type: Number,
        required: true
    },
    time_period: {
        type: Number,
        required: true // in days
    },
    reward_amount: {
        type: Number,
        required: true
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    remarks: {
        type: String,
        default: ''
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
teamRewardSchema.plugin(toJSON);
teamRewardSchema.plugin(paginate);

module.exports = mongoose.model('TeamRewards', teamRewardSchema);
