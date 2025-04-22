const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	add: Joi.object().keys({
		"investment_plan_id": Joi.string().required().label('investment_plan_id'),
		"user_id": Joi.string().optional().label('user_id'),
		"amount": Joi.number().optional().label('amount'),
		"level" : Joi.number().optional().label('level'),
	}),
	add2: Joi.object().keys({
		"userAddress": Joi.string().optional().label('userAddress'),
		"amount": Joi.number().optional().label('amount')
	}),
	add3: Joi.object().keys({
		"userAddress": Joi.string().optional().label('userAddress'),
		"amount": Joi.number().optional().label('amount')
	}),
	update: Joi.object().keys({
	}),
};
