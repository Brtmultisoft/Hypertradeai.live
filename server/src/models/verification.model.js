'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Creating Verification Schema Model
 */
const VerificationSchema = new Schema({
	token: {
		type: String,
		required: true,
		trim: true,
		unique: true
	},
	otp: {
		type: String,
		default: ''
	},
	user_id: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'Users'
	},
	attempts: {
		type: Number,
		default: 0
	},
	verification_type: {
		type: String,
		required: true,
		enum: ['email', 'password', 'mobile']
	}
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Verifications', VerificationSchema);
