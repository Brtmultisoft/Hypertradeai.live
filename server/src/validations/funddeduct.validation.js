const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	add: Joi.object().keys({
		user_id: Joi.string().trim().required().custom(objectId).label("User ID"),
		amount: Joi.number().required().min(0).max(10000000).label("Amount"),
		remark: Joi.string().trim().required().min(3).max(250).label("Message"),
		type: Joi.string().required().label("Type")
	})
};
