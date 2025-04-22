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

module.exports = mongoose.model('Counters', counterSchema);
