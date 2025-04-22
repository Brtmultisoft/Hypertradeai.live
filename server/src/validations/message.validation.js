const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	add: Joi.object().keys({
		user_id: Joi.string().trim().optional().allow("").custom(objectId).label("User ID"),
		subject: Joi.string().trim().required().allow("").min(3).max(50).custom(name).label("Subject"),
		message: Joi.string().trim().required().min(3).max(250).label("Message"),
		status: Joi.boolean().optional().label("Status"),
	}),
	update: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
		is_read: Joi.boolean().required().label("Is Read Status"),
	}),
};
