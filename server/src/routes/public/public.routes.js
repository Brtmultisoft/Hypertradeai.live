const Router = require('express').Router();
/**
 * All Controllers
 */
const {
    publicController
} = require('../../controllers');

/**
 * All Middlewares
 */

const {
    webhookMiddleware
} = require("../../middlewares");


module.exports = () => {


    // Router.get("/get-reports-in-csv/:name", publicController.getReportsByQuery);

    return Router;
}
