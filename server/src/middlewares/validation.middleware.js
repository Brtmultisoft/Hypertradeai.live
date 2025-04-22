"use strict";
const logger = require("../services/logger");
const log = new logger("validationController").getChildLogger();

module.exports = (joiSchema, reqProperty) => {
  
  return (req, res, next) => {
    const { error } = joiSchema.validate(req[reqProperty]);
    if (error) {
      log.error(
        `request validation failed with error :: ${JSON.stringify(
          error
        )} for data : ${JSON.stringify(req[reqProperty])}`
      );
      return res.status(422).send({
        status: false,
        message: error.message,
      });
    }
    next();
  };
};
