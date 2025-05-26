'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Userre Schema Model
 */
const userreSchema = new Schema({
    placement_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Userres',
        default: null
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    placement_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    pool: {
        type: Number,
        default: 0
    },
    is_re: {
        type: Boolean,
        default: false // for the first one true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
userreSchema.plugin(toJSON);
userreSchema.plugin(paginate);

// Add indexes for frequently queried fields
userreSchema.index({ placement_id: 1 });
userreSchema.index({ user_id: 1 });
userreSchema.index({ placement_user_id: 1 });
userreSchema.index({ is_re: 1 });
userreSchema.index({ created_at: -1 });
userreSchema.index({ pool: -1 });

// Add compound indexes for common query combinations
userreSchema.index({ user_id: 1, placement_id: 1 });
userreSchema.index({ user_id: 1, is_re: 1 });
userreSchema.index({ placement_user_id: 1, is_re: 1 });

module.exports = mongoose.model('Userres', userreSchema);