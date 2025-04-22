'use strict';
const server = require('./src/server');
const log = require('./src/services/logger').getAppLevelInstance();
const cron = require('node-cron');
const axios = require('axios');
const investmentPlanController = require('./src/controllers/user/investmentplan.controller');
const seedDefaultInvestmentPlan = require('./src/seeders/investmentplan.seeder');

/*************************************************************************************/
/* START PROCESS UNHANDLED METHODS */
/*************************************************************************************/
process.on('unhandledRejection', (reason, p) => {
	log.error('Unhandled Rejection at:', p, 'reason:', reason);
	log.error(`API server exiting due to unhandledRejection...`);
	process.exit(1);
});
process.on('uncaughtException', (err) => {
	log.error('Uncaught Exception:', err);
	log.error(`API server exiting due to uncaughtException...`);
	process.exit(1);
});
/*************************************************************************************/
/* END PROCESS UNHANDLED METHODS */
/*************************************************************************************/

// Daily profit calculation cron job - COMMENTED OUT (using the one in cron.controller.js instead)
// cron.schedule('0 0 * * *', async () => {
// 	try {
// 		if (process.env.CRON_STATUS === '0') return;
// 		log.info('Starting daily profit calculation...');
// 		await investmentPlanController.calculateDailyProfits();
// 		log.info('Daily profit calculation completed successfully.');
// 	} catch (error) {
// 		log.error('Error in daily profit calculation:', error);
// 	}
// });

// Active member rewards check cron job - COMMENTED OUT (using the one in cron.controller.js instead)
// cron.schedule('0 1 * * *', async () => {
// 	try {
// 		if (process.env.CRON_STATUS === '0') return;
// 		log.info('Starting active member rewards check...');
// 		const activeUsers = await User.find({ status: 'active' });
// 		for (const user of activeUsers) {
// 			await investmentPlanController.checkActiveMemberRewards(user._id);
// 		}
// 		log.info('Active member rewards check completed successfully.');
// 	} catch (error) {
// 		log.error('Error in active member rewards check:', error);
// 	}
// });

/**
 * Run seed scripts
 */
seedDefaultInvestmentPlan().then(() => {
    log.info('Seed scripts completed');
}).catch(err => {
    log.error('Error running seed scripts:', err);
});

/**
 * START THE SERVER
 */
const appServer = new server();
appServer.start();
