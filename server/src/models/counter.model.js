'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating Counter Schema Model
 */
const counterSchema = new Schema({
    model: {
        type: String,
        required: true,
        trim: true
    },
    seq: { type: Number, default: 0 }
});

// Add index for model field (should be unique)
counterSchema.index({ model: 1 }, { unique: true });

module.exports = mongoose.model('Counters', counterSchema);
