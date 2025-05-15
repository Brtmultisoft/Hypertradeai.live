const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for Profile Route
 */
const number_validation = /^[0-9]*$/;
const float_number_validation = /^[0-9.]*$/;
module.exports = {
	add: Joi.object().keys({
		name: Joi.string().trim().optional().allow("").min(3).max(100).custom(name).label("Name"),
		username: Joi.string().trim().optional().allow("").min(6).max(20).label("User Name"),
		email: Joi.string().trim().optional().allow("").min(3).max(100).email().label('Email'),

		address: Joi.string().trim().optional().allow("").min(32).max(64).label("Address"),
		phone_number: Joi.string().optional().allow("").min(10).max(12).label("Phone Number"),
		status: Joi.boolean().optional().label("Status"),
		password: Joi.string().optional().allow("").min(8).max(20).custom(password).label('Password'),
		confirm_password: Joi.string().optional().allow("").min(8).max(20).valid(Joi.ref('password')).error(new Error('Confirm password and password must be same')),
	}),
	update: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
		name: Joi.string().trim().optional().allow("").min(3).max(100).custom(name).label("Name"),
		username: Joi.string().trim().optional().allow("").min(6).max(20).label("User Name"),
		email: Joi.string().trim().optional().allow("").min(3).max(100).email().label('Email'),
		address: Joi.string().trim().optional().allow("").min(32).max(64).label("Address"),
		phone_number: Joi.string().optional().allow("").min(10).max(12).label("Phone Number"),
		avatar: Joi.string().optional().allow("").label('Profile Photo'),
		status: Joi.boolean().optional().label("Status"),
		wallet: Joi.string().optional().allow("").label('wallet'),
		wallet_topup : Joi.string().optional().allow("").label('wallet_topup'),
		old_password: Joi.string().optional().min(8).allow("").label('Password'),
		password: Joi.string().optional().allow("").min(8).max(20).custom(password).label('Password'),
		confirm_password: Joi.string().optional().allow("").min(8).max(20).valid(Joi.ref('password')).error(new Error('Confirm password and password must be same')),
	}),

	blockUser: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
		block_reason: Joi.string().trim().optional().allow("").max(500).label("Block Reason"),
	}),

	unblockUser: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
	}),

};
