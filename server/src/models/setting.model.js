'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Setting Schema Model
 */
const settingSchema = new Schema({
    name: {
        type: String,
        default: null
    },
    value: {
        type: String,
        default: null
    },
    status: {
        type: Boolean,
        default: true
    },
    extra: {
        type: Object,
        default: {}
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
settingSchema.plugin(toJSON);
settingSchema.plugin(paginate);

// Add indexes for frequently queried fields
settingSchema.index({ name: 1 }, { unique: true });
settingSchema.index({ status: 1 });
settingSchema.index({ created_at: -1 });

// Add compound indexes for common query combinations
settingSchema.index({ name: 1, status: 1 });

// Check if model already exists to prevent OverwriteModelError
module.exports = mongoose.models.Settings || mongoose.model('Settings', settingSchema);