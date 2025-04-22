const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	add: Joi.object().keys({
		name: Joi.string().trim().required().allow("").min(3).max(50).custom(name).label("Name"),
		value: Joi.string().trim().required().min(3).max(250).label("Value"),
		status: Joi.boolean().optional().label("Status"),
	}),
	update: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
		name: Joi.string().trim().required().allow("").min(3).max(50).custom(name).label("Name"),
		value: Joi.string().trim().required().min(3).max(250).label("Value"),
		status: Joi.boolean().optional().label("Status"),
	}),
	addUpdate: Joi.object().keys({
        key: Joi.string().trim().required().label("key"),
    }),
};
