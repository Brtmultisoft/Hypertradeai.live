'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Cron Execution Schema Model
 * This model stores data about cron job executions
 */
const cronExecutionSchema = new Schema({
    cron_name: {
        type: String,
        required: true,
        enum: ['daily_profit', 'level_roi', 'team_rewards', 'user_ranks', 'active_member_rewards', 'reset_daily_login'],
        index: true // Add index for faster queries by cron name
    },
    start_time: {
        type: Date,
        required: true,
        default: Date.now,
        index: true // Add index for faster date-based queries
    },
    end_time: {
        type: Date,
        default: null
    },
    duration_ms: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['running', 'completed', 'failed', 'partial_success'],
        default: 'running',
        index: true // Add index for status-based queries
    },
    processed_count: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        default: 0
    },
    error_count: {
        type: Number,
        default: 0
    },
    error_details: {
        type: Array,
        default: []
    },
    execution_details: {
        type: Object,
        default: {}
    },
    triggered_by: {
        type: String,
        enum: ['automatic', 'manual', 'backup', 'recovery'],
        default: 'automatic'
    },
    server_info: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Compound indexes for common query combinations
cronExecutionSchema.index({ cron_name: 1, start_time: -1 });
cronExecutionSchema.index({ status: 1, cron_name: 1 });
cronExecutionSchema.index({ created_at: -1 });

// Add plugins
cronExecutionSchema.plugin(toJSON);
cronExecutionSchema.plugin(paginate);

module.exports = mongoose.model('CronExecution', cronExecutionSchema);
