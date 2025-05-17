'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Message Schema Model
 */
const messageSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    user_id_from: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Users',
        default: null
    },
    subject: {
        type: String,
        default: null
    },
    message: {
        type: String,
        default: null
    },
    type: {
        type: Number,
        default: 0
    },
    is_read: {
        type: Boolean,
        default: false
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
messageSchema.plugin(toJSON);
messageSchema.plugin(paginate);

// Add indexes for frequently queried fields
messageSchema.index({ user_id: 1 });
messageSchema.index({ user_id_from: 1 });
messageSchema.index({ is_read: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ created_at: -1 });
messageSchema.index({ type: 1 });

// Add compound indexes for common query combinations
messageSchema.index({ user_id: 1, is_read: 1 });
messageSchema.index({ user_id: 1, created_at: -1 });
messageSchema.index({ user_id: 1, status: 1 });
messageSchema.index({ user_id_from: 1, user_id: 1 });

// Add text index for search functionality
messageSchema.index({ subject: 'text', message: 'text' });

module.exports = mongoose.model('Messages', messageSchema);