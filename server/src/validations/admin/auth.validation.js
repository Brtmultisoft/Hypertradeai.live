const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
/**
 * JOI Validation Schema for Admin Auth Route
 */
module.exports = {
    login: Joi.object().keys({
        email: Joi.string().required().label('Email'),
        password: Joi.string().min(8).required().label('Password')
    }),
};
