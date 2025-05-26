'use strict';
const server = require('./src/server');
const log = require('./src/services/logger').getAppLevelInstance();
const cron = require('node-cron');
const axios = require('axios');
const investmentPlanController = require('./src/controllers/user/investmentplan.controller');
const seedDefaultInvestmentPlan = require('./src/seeders/investmentplan.seeder');
const seedDefaultAnnouncements = require('./src/seeders/announcement.seeder');
require("./src/controllers/user/cron.controller")
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
Promise.all([
    seedDefaultInvestmentPlan(),
    seedDefaultAnnouncements()
]).then(() => {
    log.info('Seed scripts completed');
}).catch(err => {
    log.error('Error running seed scripts:', err);
});

/**
 * Import the recovery script
 */
const { recoverMissedCrons } = require('./src/scripts/recover-missed-crons');

/**
 * START THE SERVER
 */
const appServer = new server();
appServer.start()
  .catch(error => {
    log.error('Failed to start server:', error);
    process.exit(1);
  });

/**
 * Run the recovery script after server startup
 */
setTimeout(async () => {
  try {
    log.info('Running missed cron recovery script...');
    const result = await recoverMissedCrons();
    if (result.success) {
      log.info('Missed cron recovery completed successfully');
    } else {
      log.error('Missed cron recovery failed:', result.error);
    }
  } catch (error) {
    log.error('Error running missed cron recovery script:', error);
  }
}, 10000); // Wait 10 seconds after server startup
