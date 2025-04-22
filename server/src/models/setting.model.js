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

module.exports = mongoose.model('Settings', settingSchema);