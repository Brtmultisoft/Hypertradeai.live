'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminIncomeController').getChildLogger();
const { incomeDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            console.log('Income query params:', reqObj);
            let getList = await incomeDbHandler.getAll(reqObj);
            console.log('Income results:', getList);

            // If we have no results, try without type filter
            if (!getList.list || getList.list.length === 0) {
                console.log('No incomes found with type filter, trying without type filter');
                delete reqObj.type;
                getList = await incomeDbHandler.getAll(reqObj);
                console.log('Income results without type filter:', getList);
            }

            // If we still have no results, try a direct database query
            if (!getList.list || getList.list.length === 0) {
                console.log('Still no incomes found, trying direct query');
                const { incomeModel } = require('../../models');
                const directResults = await incomeModel.find({}).limit(10).sort({ created_at: -1 }).exec();
                console.log('Direct query found', directResults.length, 'incomes');

                if (directResults && directResults.length > 0) {
                    const count = await incomeModel.countDocuments({}).exec();
                    getList = {
                        list: directResults,
                        page: 1,
                        limit: 10,
                        total: count,
                        totalPages: Math.ceil(count / 10)
                    };
                }
            }

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
            let getData = await incomeDbHandler.getById(id);
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
        let reqObj = req.query;
        try {
            let getData = await incomeDbHandler.getCount(reqObj);
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
            let getData = await incomeDbHandler.getSum(reqObj);
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