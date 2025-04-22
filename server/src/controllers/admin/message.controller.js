'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminMessageController').getChildLogger();
const { messageDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    getAllInbox: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await messageDbHandler.getAll(reqObj, null, null, 'inbox');
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getAllSent: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await messageDbHandler.getAll(reqObj, null, null, 'sent');
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
            let getData = await messageDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let is_read = req?.query?.is_read ? true : false;
        try {
            let getData = await messageDbHandler.getCount(null, is_read);
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
        try {
            let data = {
                user_id: reqObj.user_id,
                user_id_from: null,
                subject: reqObj.subject,
                message: reqObj.message,
            }

            await messageDbHandler.create(data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },

    update: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            let getByQuery = await messageDbHandler.getByQuery({ _id: reqObj.id });
            if (!getByQuery.length) {
                responseData.msg = "Invailid data";
                return responseHelper.error(res, responseData);
            }

            let updatedObj = {
                is_read: reqObj.is_read
            }

            let updatedData = await messageDbHandler.updateById(id, updatedObj);
            responseData.msg = "Data updated successfully!";
            responseData.data = updatedData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    }
};