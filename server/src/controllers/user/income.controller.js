'use strict';
const logger = require('../../services/logger');
const log = new logger('IncomeController').getChildLogger();
const { incomeDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');

module.exports = {

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await incomeDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getDailyRoi: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Received request for getDailyRoi:', reqObj);
        let responseData = {};
        try {
            // Add type filter for daily profit
            reqObj.type = 'daily_profit';
            let getList = await incomeDbHandler.getAll(reqObj, user_id);

            // Ensure we only return daily_profit type incomes
            if (getList && getList.list) {
                getList.list = getList.list.filter(income => income.type === 'daily_profit');
            }

            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch daily ROI data with error:', error);
            responseData.msg = 'Failed to fetch daily ROI data';
            return responseHelper.error(res, responseData);
        }
    },

    getDirectIncome: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Received request for getDirectIncome:', reqObj);
        let responseData = {};
        try {
            console.log('Fetching direct income for user:', user_id);

            // Add type filter for referral bonus
            reqObj.type = 'referral_bonus';

            // Ensure we're using string comparison for type
            reqObj.exact_type_match = true;

            // Add sorting parameters if provided
            if (reqObj.sort_field) {
                reqObj.sort_by = `${reqObj.sort_field}:${reqObj.sort_direction || 'asc'}`;
            }

            // Add search functionality
            if (reqObj.search) {
                console.log('Searching with term:', reqObj.search);
                // The search functionality is handled in the income.service.js
            }

            // Check if we should include user data
            if (reqObj.include_user_data === 'true' || reqObj.include_user_data === true) {
                reqObj.populate_users = true;
                console.log('Including user data in response');
            }

            // Check if we should populate referral information
            if (reqObj.populate_referrals === 'true' || reqObj.populate_referrals === true) {
                reqObj.populate_referrals = true;
                console.log('Including referral user data in response');
            }

            // Check if specific user fields are requested
            if (reqObj.include_user_fields) {
                reqObj.user_fields = reqObj.include_user_fields.split(',');
                console.log('Including specific user fields:', reqObj.user_fields);
            }

            // Get direct income records with populated user information
            let getList = await incomeDbHandler.getAll(reqObj, user_id);

            console.log('Direct income records found:', getList?.list?.length || 0);

            // Double-check to ensure we only return referral_bonus type incomes
            if (getList && getList.list) {
                getList.list = getList.list.filter(income => {
                    const isReferralBonus = income.type === 'referral_bonus';
                    if (!isReferralBonus) {
                        console.log('Filtered out non-referral_bonus income:', income.type);
                    }
                    return isReferralBonus;
                });

                console.log('After filtering, direct income records:', getList.list.length);

                // Populate user information from user_id_from
                const { userDbHandler } = require('../../services/db');

                // Process each income record to add user information
                const populatedList = await Promise.all(getList.list.map(async (income) => {
                    // Format the date for better readability
                    if (income.created_at) {
                        income.formatted_date = new Date(income.created_at).toLocaleString();
                    }

                    // Create projection object based on requested fields or use defaults
                    const projection = {};

                    // If specific fields were requested, use them
                    if (reqObj.user_fields && Array.isArray(reqObj.user_fields)) {
                        reqObj.user_fields.forEach(field => {
                            projection[field] = 1;
                        });
                    } else {
                        // Default fields
                        projection.username = 1;
                        projection.email = 1;
                        projection.name = 1;
                    }

                    // Always include _id
                    projection._id = 1;

                    console.log('Using user projection:', projection);

                    // 1. Fetch information about the user who was referred (generated the commission)
                    // First try to get user from user_id_from field
                    let fromUserId = income.user_id_from;

                    // If not available, try to get from extra.fromUser field
                    if (!fromUserId && income.extra && income.extra.fromUser) {
                        fromUserId = income.extra.fromUser;
                        console.log('Using fromUser ID from extra object:', fromUserId);
                    }

                    if (fromUserId && typeof fromUserId === 'string') {
                        try {
                            const fromUser = await userDbHandler.getById(fromUserId, projection);

                            if (fromUser) {
                                // Convert to plain object if it's a Mongoose document
                                const userObj = fromUser.toObject ? fromUser.toObject() : fromUser;

                                // Add user information directly to the income object
                                income.username = userObj.username || '';
                                income.email = userObj.email || '';
                                income.name = userObj.name || '';

                                // Add extra fields for the referred user
                                income.extra_from_username = userObj.username || '';
                                income.extra_from_email = userObj.email || '';
                                income.extra_from_name = userObj.name || '';

                                // Also keep the user_id_from object for backward compatibility
                                income.user_id_from = {
                                    _id: fromUserId,
                                    username: userObj.username || '',
                                    email: userObj.email || '',
                                    name: userObj.name || ''
                                };

                                // Store the commission rate from extra if available
                                if (income.extra && income.extra.commissionRate) {
                                    income.commission_rate = income.extra.commissionRate;
                                }
                            }
                        } catch (err) {
                            console.error('Error fetching user data:', err);
                        }
                    } else if (income.user_id_from && typeof income.user_id_from === 'object') {
                        // If user_id_from is already an object, extract the data
                        income.username = income.user_id_from.username || '';
                        income.email = income.user_id_from.email || '';
                        income.name = income.user_id_from.name || '';

                        // Add extra fields for the referred user
                        income.extra_from_username = income.user_id_from.username || '';
                        income.extra_from_email = income.user_id_from.email || '';
                        income.extra_from_name = income.user_id_from.name || '';
                    }

                    // 2. Fetch information about the user who received the commission (current user)
                    if (income.user_id && typeof income.user_id === 'string') {
                        try {
                            const toUser = await userDbHandler.getById(income.user_id, projection);

                            if (toUser) {
                                // Convert to plain object if it's a Mongoose document
                                const userObj = toUser.toObject ? toUser.toObject() : toUser;

                                // Add user information directly to the income object
                                income.receiver_username = userObj.username || '';
                                income.receiver_email = userObj.email || '';
                                income.receiver_name = userObj.name || '';
                            }
                        } catch (err) {
                            console.error('Error fetching receiver user data:', err);
                        }
                    }

                    // Also check for user_from fields from the aggregation pipeline
                    if (!income.username && income.username_from) {
                        income.username = income.username_from;
                    }

                    if (!income.email && income.user_from_email) {
                        income.email = income.user_from_email;
                    }

                    if (!income.name && income.user_from_name) {
                        income.name = income.user_from_name;
                    }

                    // Always ensure these fields are present in the response
                    income.user_from_email = income.user_from_email || income.email || '';
                    income.user_from_name = income.user_from_name || income.name || '';
                    income.username_from = income.username_from || income.username || '';

                    return income;
                }));

                getList.list = populatedList;
            }

            responseData.msg = 'Direct income data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            console.error('Failed to fetch direct income data:', error);
            log.error('Failed to fetch direct income data with error:', error);
            responseData.msg = 'Failed to fetch direct income data';
            return responseHelper.error(res, responseData);
        }
    },

    getLevelRoi: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Received request for getLevelRoi:', reqObj);
        let responseData = {};
        try {
            // Add type filter for level ROI income
            reqObj.type = 'level_roi_income';
            let getList = await incomeDbHandler.getAll(reqObj, user_id);

            // Ensure we only return level_roi_income type incomes
            if (getList && getList.list) {
                getList.list = getList.list.filter(income => income.type === 'level_roi_income');
            }

            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch level ROI data with error:', error);
            responseData.msg = 'Failed to fetch level ROI data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
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
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await incomeDbHandler.getCount(reqObj, user_id);
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
            let getData = await incomeDbHandler.getSum(reqObj, user_id);
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