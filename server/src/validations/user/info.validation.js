const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('../custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	updateProfile: Joi.object().keys({
		name: Joi.string().trim().optional().allow("").min(3).max(100).custom(name).label("Name"),
		email: Joi.string().trim().optional().allow("").min(3).max(100).email().label('Email'),
		address: Joi.string().trim().optional().allow("").max(100).label("Address"),
		phone_number: Joi.string().optional().allow("").min(10).max(12).label("Phone Number"),
		dob: Joi.string().optional().label('Wallet Address'),
		wallet_address: Joi.string().optional().label('Wallet Address'),
		withdraw_wallet: Joi.string().optional().label('Withdraw Wallet'),
		country: Joi.string().optional().label('Country'),
		country_code: Joi.string().optional().label('Country Code'),
		state: Joi.string().optional().label('State'),
		city: Joi.string().optional().label('City')
	}),
	changePassword: Joi.object().keys({
		old_password: Joi.string().required().label("Old Password"),
		password: Joi.string().required().min(8).max(20).custom(password).label("New Password"),
	}),
};
