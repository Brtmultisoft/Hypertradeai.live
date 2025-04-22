const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('../custom.validation');
/**
 * JOI Validation Schema for Admin Route
 */
module.exports = {
	add: Joi.object().keys({
		name: Joi.string().trim().required().max(100).custom(name).label("Name"),
		email: Joi.string().trim().required().min(3).max(100).email().label('Email'),
		phone_number: Joi.string().min(10).max(12).optional().allow("").label("Phone Number"),
		status: Joi.boolean().optional().label("Status"),
		password: Joi.string().required().min(8).max(20).custom(password).label('Password'),
		confirm_password: Joi.string().min(8).valid(Joi.ref('password')).required().error(new Error('Confirm password and password must be same')),
	}),
	user_login_request: Joi.object().keys({
		user_id: Joi.string().trim().required().custom(objectId).label("User ID"),
	}),
	update: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
		name: Joi.string().trim().required().max(100).custom(name).label("Name"),
		email: Joi.string().trim().required().min(3).max(100).email().label('Email'),
		phone_number: Joi.string().min(10).max(12).optional().allow("").label("Phone Number"),
		status: Joi.boolean().optional().label("Status"),
		old_password: Joi.string().optional().min(8).allow("").label('Password'),
		password: Joi.string().optional().min(8).max(20).custom(password).allow("").label('New Password'),
		//confirm_password: Joi.string().optional().min(8).valid(Joi.ref('password')).allow("").error(new Error('Confirm password and new password must be same')),
	})
};
