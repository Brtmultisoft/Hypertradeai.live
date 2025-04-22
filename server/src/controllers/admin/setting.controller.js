'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminSettingController').getChildLogger();
const { settingDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await settingDbHandler.getByQuery({});
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
            let getData = await settingDbHandler.getById(id);
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
                name: reqObj.name.replace(/\s+/g, '-').toLowerCase(),
                value: reqObj.value
            }

            await settingDbHandler.create(data);
            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },
    add_update: async (req, res) => {
        let responseData = {};
        console.log(req)
        let reqObj = req.body;
        try {
            await settingDbHandler.updateOneByQuery(
                { name: 'Keys' },
                {
                    $set: {
                        value: reqObj.key,
                    }
                }
            )
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
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.body;
        try {
            let getByQuery = await settingDbHandler.getByQuery({ _id: reqObj.id });
            if (!getByQuery.length) {
                responseData.msg = "Invailid data";
                return responseHelper.error(res, responseData);
            }
            let updatedObj = {
                name: reqObj.name.replace(/\s+/g, '-').toLowerCase(),
                value: reqObj.value
            }

            if (reqObj.status !== undefined) {
                updatedObj.status = reqObj.status;
            }

            let updatedData = await settingDbHandler.updateById(id, updatedObj);
            responseData.msg = "Data updated successfully!";
            responseData.data = updatedData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    },

    delete: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            await settingDbHandler.deleteById(id);
            responseData.msg = "Data deleted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to delete data with error::', error);
            responseData.msg = 'Failed to delete data';
            return responseHelper.error(res, responseData);
        }
    },

    getOneByQuery: async (req, res) => {
        let responseData = {};
        let name = req.params.name;
        try {
            let getData = await settingDbHandler.getOneByQuery({ name });
            if (!getData) throw "No Content Found !"
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