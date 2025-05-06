'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminFundDeductController').getChildLogger();
const { fundDeductDbHandler, userDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const { default: mongoose } = require('mongoose');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await fundDeductDbHandler.getAll(reqObj);
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
        let id = req.params.id;
        try {
            let getData = await fundDeductDbHandler.getById(id);
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
        let reqObj = req.body;
        let ObjectId = mongoose.Types.ObjectId
        try {

            const user = await userDbHandler.getOneByQuery({ _id: ObjectId(reqObj.user_id) })
            if (!user) {
                responseData.msg = "Invalid User !!!";
                return responseHelper.error(res, responseData);
            }

            let fee = reqObj.amount * 0;

            let data = {
                user_id: reqObj.user_id,
                amount: reqObj.amount,
                fee: fee,
                remark: reqObj.remark,
                type: reqObj.type,
            }
               console.log(" recived...........data", data)

            if (reqObj.type == 0) {
                if (user.wallet < reqObj.amount) {
                    responseData.msg = "Insufficient Fund!";
                    return responseHelper.error(res, responseData);
                }
                user.wallet = parseFloat(user.wallet) - parseFloat(reqObj.amount)
                // await userDbHandler.updateOneByQuery({ _id: ObjectId(reqObj.user_id) }, { $inc: { wallet: -reqObj.amount } });
            }
            else if (reqObj.type == 1) {
                if (user.wallet_topup < reqObj.amount) {
                    responseData.msg = "Insufficient Fund!"
                    return responseHelper.error(res, responseData);
                }
                user.wallet_topup = parseFloat(user.wallet_topup) - parseFloat(reqObj.amount)
                // await userDbHandler.updateOneByQuery({ _id: ObjectId(reqObj.user_id) }, { $inc: { wallet_topup: -reqObj.amount } });
            } else {
                throw "Wrong type!"
            }
        console.log("amount checked.....")
            // user.extra[`${reqObj.type}`] -= reqObj.amount
            await user.save()
            console.log("user saving.......")
            await fundDeductDbHandler.create(data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error.message);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let reqObj = req.query;
        try {
            let getData = await fundDeductDbHandler.getCount(reqObj);
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
        let reqObj = req.query;
        try {
            let getData = await fundDeductDbHandler.getSum(reqObj);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },
};