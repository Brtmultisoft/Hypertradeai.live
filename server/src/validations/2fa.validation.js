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
		password: Joi.string().trim().required().min(6).max(50).label("Password").error(new Error('Password is required to disable 2FA!')),
    }),
	toggle2FAMethod: Joi.object().keys({
		method: Joi.string().trim().required().valid('totp', 'otpless').label("2FA Method").error(new Error('Invalid 2FA method. Must be "totp" or "otpless"')),
    }),
};
