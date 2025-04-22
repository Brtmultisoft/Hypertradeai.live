const { settingDbHandler } = require("../services/db");
const logger = require("../services/logger");
const log = new logger("validationController").getChildLogger();

module.exports = async (req, res, next) => {
    try {
        // Check if the key is provided in the request body
        if (!req.body.key) {
            log.error(`API key is required in request body`);
            return res.status(422).send({
                status: false,
                message: `API key is required in request body. Please include {"key": "XK7PZ8"} in your request.`,
            });
        }

        // Check if the provided key matches the environment variable
        if (req.body.key !== process.env.APP_API_KEY) {
            log.error(`Invalid API Key`);
            return res.status(422).send({
                status: false,
                message: `Invalid API Key`,
            });
        }

        next();
    } catch (error) {
        log.error(`Error validating API key: ${error.message}`);
        return res.status(500).send({
            status: false,
            message: `Internal Server Error`,
        });
    }
};