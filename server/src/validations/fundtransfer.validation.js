const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { password, objectId, name } = require('./custom.validation');
/**
 * JOI Validation Schema for User Info Route
 */
module.exports = {
	add: Joi.object().keys({
		user_id: Joi.string().trim().required().label("User ID"),
		user_id_from: Joi.string().trim().optional().allow("").custom(objectId).label("From User ID"),
		amount: Joi.number().required().min(0).max(10000000).label("Amount"),
		type: Joi.number().optional().min(0).max(10).label("Type"),
		type_to: Joi.number().optional().allow("").min(0).max(10).label("To Type"),
		remark: Joi.string().trim().required().min(3).max(250).label("Remark"),
		from_wallet: Joi.string().trim().optional().valid('main', 'topup','admin').label("From Wallet"),
		to_wallet: Joi.string().trim().optional().valid('main', 'topup','admin').label("To Wallet")
	})
};
