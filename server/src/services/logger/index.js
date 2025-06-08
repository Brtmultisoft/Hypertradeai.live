'use strict';
const bunyan = require('bunyan');
const config = require('../../config/config');
/*************************************
 * SERVICE FOR HANDLING APP LOGGING
 ************************************/
/**
 *  Logger instance
 */
const logger = bunyan.createLogger({
    name: config.brandName || 'HypertradeAI',
    streams: [{
        level: 'trace',
        stream: process.stdout
    }]
});
class Logger {
    constructor(componentName) {
        this._componentName = componentName;
    }
    getChildLogger() {
        return logger.child({
            component: this._componentName
        });
    }
    static getAppLevelInstance(loggerName) {
        if (!loggerName) {
            return logger;
        } else {
            return new Logger(loggerName).getChildLogger();
        }
    }
}
module.exports = Logger;