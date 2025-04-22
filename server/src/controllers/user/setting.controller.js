'use strict';
const logger = require('../../services/logger');
const log = new logger('SettingController').getChildLogger();
const { settingDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const { getSignedUrl } = require('../../services/multer');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
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
        let user = req.user;
        let user_id = user.sub;
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

    getObject: async (req, res) => {
        let responseData = {}
        let user = req.user
        let user_id = user.sub
        try {

            const key = req.body.banner
            const url = getSignedUrl(key)

            responseData.msg = "Data fetched successfully!"
            responseData.data = { url }
            return responseHelper.success(res, responseData)
        } catch (error) {
            log.error('failed to fetch data with error::', error)
            responseData.msg = 'Failed to fetch data'
            return responseHelper.error(res, responseData)
        }
    },

    getOneByQuery: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
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