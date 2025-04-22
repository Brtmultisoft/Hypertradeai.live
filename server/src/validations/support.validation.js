const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);

/**
 * JOI Validation Schema for Support Route
 */

module.exports = {
  add: Joi.object().keys({
    subject: Joi.string().trim().min(3).max(100).required().label("Subject"),
    message: Joi.string().trim().max(250).min(3).required().label("Message"),
  })
};
