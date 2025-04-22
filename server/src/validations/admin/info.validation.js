const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('../custom.validation');
/**
 * JOI Validation Schema for Admin Route
 */
module.exports = {
	updateProfile: Joi.object().keys({
		id: Joi.string().trim().optional().custom(objectId).label("ID"),
		name: Joi.string().trim().required().min(3).max(100).custom(name).label("Name"),
		email: Joi.string().trim().optional().min(3).max(100).email().allow("").label('Email'),
		phone_number: Joi.string().optional().min(10).max(12).allow("").label("Phone Number"),
		old_password: Joi.string().optional().min(8).allow("").label('Password'),
		password: Joi.string().optional().min(8).max(20).custom(password).allow("").label('New Password'),
		confirm_password: Joi.string().optional().min(8).valid(Joi.ref('password')).allow("").error(new Error('Confirm password and new password must be same')),
	}),
	updateUserProfile: Joi.object().keys({
		id: Joi.string().trim().optional().custom(objectId).label("ID"),
		name: Joi.string().trim().required().min(3).max(100).custom(name).label("Name"),
		email: Joi.string().trim().optional().min(3).max(100).email().allow("").label('Email'),
		address: Joi.string().trim().optional().allow("").max(64).label("Address"),
		phone_number: Joi.string().optional().min(10).max(12).allow("").label("Phone Number"),
		dob: Joi.string().optional().label('Wallet Address'),
		wallet_address: Joi.string().optional().label('Wallet Address'),
		country: Joi.string().optional().label('Country'),
		country_code: Joi.string().optional().label('Country Code'),
		state: Joi.string().optional().label('State'),
		city: Joi.string().optional().label('City'),
		old_password: Joi.string().optional().min(8).allow("").label('Password'),
		password: Joi.string().optional().min(8).max(20).custom(password).allow("").label('New Password'),
		confirm_password: Joi.string().optional().min(8).valid(Joi.ref('password')).allow("").error(new Error('Confirm password and new password must be same')),
	}),
	updateContent: Joi.object().keys({
		heading: Joi.string().trim().required().min(3).max(100).custom(name).label("Heading"),
		banner: Joi.optional(),
		facebookPage: Joi.optional(),
		telegramPage: Joi.optional(),
		instagramPage: Joi.optional(),
		linkedinPage: Joi.optional(),
		twitterPage: Joi.optional(),
		first_youtubeVideo: Joi.optional(),
		second_youtubeVideo: Joi.optional(),
		third_youtubeVideo: Joi.optional(),
		facebook_task: Joi.optional(),
		twitter_task: Joi.optional(),
		instagram_task: Joi.optional(),
	}),
	changePassword: Joi.object().keys({
		old_password: Joi.string().required().label("Old Password"),
		password: Joi.string().required().min(8).max(20).custom(password).label("New Password"),
	}),
};
