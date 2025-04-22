const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	add: Joi.object().keys({
		amount: Joi.number().required().min(0).max(10000000).label("Amount"),
		txid: Joi.string().trim().required().min(32).max(128).label("Tx ID"),
		address: Joi.string().trim().optional().allow("").label("Address"),
	}),
	update: Joi.object().keys({
		id: Joi.string().trim().required().custom(objectId).label("ID"),
		remark: Joi.string().trim().optional().allow("").min(3).max(250).label("Remark"),
		status: Joi.number().required().min(0).max(2).label("Status"),
	}),
};
