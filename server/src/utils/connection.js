'use strict';
const databaseService = require('../services/database.service');
const log = require('../services/logger').getAppLevelInstance();

/********************************************************
 * UTILITY METHOD FOR HANDLING SERVER DATABASE CONNECTION
 * This now uses the DatabaseService singleton
 ********************************************************/
module.exports = (databaseUrl) => {
	log.info('Connecting to database using DatabaseService');
	return databaseService.connect(databaseUrl);
};