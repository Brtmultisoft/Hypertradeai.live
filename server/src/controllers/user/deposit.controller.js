'use strict';
const logger = require('../../services/logger');
const log = new logger('DepositController').getChildLogger();
const { depositDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll Deposits:', reqObj);
        let responseData = {};
        try {
            let getList = await depositDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let id = req.params.id;
        try {
            let getData = await depositDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    add: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.body;
        try {
            if (reqObj?.txid) {
                reqObj.txid = reqObj.txid.toLowerCase();
            }
            if (reqObj?.address) {
                reqObj.address = reqObj.address.toLowerCase();
            }

            let getByQuery = await depositDbHandler.getByQuery({ txid: reqObj.txid });
            if (getByQuery.length) {
                responseData.msg = "This txid already taken";
                return responseHelper.error(res, responseData);
            }
            let fee = reqObj.amount * 0;
            let rate = 1;
            let net_amount = reqObj.amount - fee;
            let amount_coin = net_amount*rate;
            let currency = 'USDT';
            let currency_coin = 'USDT';

            let data = {
                user_id: user_id,
                amount: reqObj.amount,
                fee: fee,
                net_amount: net_amount,
                amount_coin: amount_coin,
                rate: rate,
                txid: reqObj.txid,
                address: reqObj?.address,
                currency: currency,
                currency_coin: currency_coin
            }

            if(reqObj.status != undefined){
                data.status = (reqObj.status == 2) ? 2 : ((reqObj.status == 1) ? 1 : 0);
            }

            await depositDbHandler.create(data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await depositDbHandler.getCount(reqObj, user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getSum: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await depositDbHandler.getSum(reqObj, user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    }
};