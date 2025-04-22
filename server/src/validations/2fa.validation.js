const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);

/**
 * JOI Validation Schema for 2FA Route
 */

module.exports = {
	verifyOtp: Joi.object().keys({
		token: Joi.string().trim().required().min(5).max(6).label("OTP").error(new Error('To proceed, please enter the OTP code!')),
    }),
	disable2fa: Joi.object().keys({
		token: Joi.string().trim().required().min(5).max(6).label("OTP").error(new Error('To proceed, please enter the OTP code!')),
    }),
};
