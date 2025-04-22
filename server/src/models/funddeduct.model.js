'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { toJSON, paginate } = require('./plugins');

/**
 * Creating FundDeduct Schema Model
 */
const funddeductSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    amount: {
        type: Number,
        default: 0
    },
    remark: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// add plugin that converts mongoose to json
funddeductSchema.plugin(toJSON);
funddeductSchema.plugin(paginate);

module.exports = mongoose.model('FundDeducts', funddeductSchema);