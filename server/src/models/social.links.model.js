'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating Income Schema Model
 */
const socialLinksSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    url: {
        type: String
    },
    extra: {
        type: Object,
        default: {}
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
socialLinksSchema.plugin(toJSON);
socialLinksSchema.plugin(paginate);

// Add indexes for frequently queried fields
socialLinksSchema.index({ user_id: 1 });
socialLinksSchema.index({ created_at: -1 });

module.exports = mongoose.model('SocialLinks', socialLinksSchema);