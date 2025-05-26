'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Setting Schema Model
 */
const userLoginRequestSchema = new Schema({
    hash: {
        type: String,
        required: true
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Admins'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    expires_at: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now (increased from 5 minutes)
        }
    },
    deleted: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
userLoginRequestSchema.plugin(toJSON);
userLoginRequestSchema.plugin(paginate);

// Add indexes for frequently queried fields
userLoginRequestSchema.index({ hash: 1 });
userLoginRequestSchema.index({ admin_id: 1 });
userLoginRequestSchema.index({ user_id: 1 });
userLoginRequestSchema.index({ expires_at: 1 });
userLoginRequestSchema.index({ deleted: 1 });
userLoginRequestSchema.index({ created_at: -1 });

// Add compound indexes for common query combinations
userLoginRequestSchema.index({ admin_id: 1, user_id: 1 });
userLoginRequestSchema.index({ user_id: 1, deleted: 1 });
userLoginRequestSchema.index({ expires_at: 1, deleted: 1 });

module.exports = mongoose.model('UserLoginRequest', userLoginRequestSchema);