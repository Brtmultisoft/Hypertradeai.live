"use strict";
const logger = require("../services/logger");
const log = new logger("validationController").getChildLogger();

module.exports = (req, res, next) => {
    if (req.body.tag !== process.env.APP_API_KEY) {
        log.error(
            `Invalid Key`
        );
        return res.status(422).send({
            status: false,
            message: `Invalid Key`,
        });
    }

    next();
};