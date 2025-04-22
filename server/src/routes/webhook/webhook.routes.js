const Router = require('express').Router();
/**
 * All Controllers
 */
const {
    moralisController
} = require('../../controllers');

/**
 * All Middlewares
 */

const {
    webhookMiddleware
} = require("../../middlewares");


module.exports = () => {

    /**********************
     * AUTHORIZED ROUTES
     **********************/
    /**
     * Middlerware for Handling Request Authorization
     */
    // Router.use('/', webhookMiddleware)

    Router.post("/deposit", moralisController.deposit_webhook)
    Router.post("/withdraw", moralisController.withdraw_webhook)

    /**************************
     * END OF AUTHORIZED ROUTES
     **************************/
    return Router;
}
