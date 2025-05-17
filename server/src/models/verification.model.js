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

// Add indexes for frequently queried fields
VerificationSchema.index({ token: 1 });
VerificationSchema.index({ user_id: 1 });
VerificationSchema.index({ verification_type: 1 });
VerificationSchema.index({ created_at: -1 });

// Add compound indexes for common query combinations
VerificationSchema.index({ user_id: 1, verification_type: 1 });
VerificationSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Verifications', VerificationSchema);
