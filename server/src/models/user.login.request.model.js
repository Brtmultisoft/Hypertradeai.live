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
            return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
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

module.exports = mongoose.model('UserLoginRequest', userLoginRequestSchema);