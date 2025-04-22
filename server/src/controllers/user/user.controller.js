'use strict';
const logger = require('../../services/logger');
const log = new logger('UserController').getChildLogger();
const { userDbHandler, verificationDbHandler } = require('../../services/db');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');
const templates = require('../../utils/templates/template');
const emailService = require('../../services/sendEmail');
const { getChildLevelsByRefer, getSingleDimensional } = require('../../services/commonFun');

/*******************
 * PRIVATE FUNCTIONS
 ********************/
/**
 * Method to Compare password
 */
let _comparePassword = (reqPassword, userPassword) => {
    return new Promise((resolve, reject) => {
        //compare password with bcrypt method, password and hashed password both are required
        bcrypt.compare(reqPassword, userPassword, function (err, isMatch) {
            if (err) reject(err);
            resolve(isMatch);
        });
    });
};
/**
 * Method to generate jwt token
 */
let _generateUserToken = (tokenData) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAuthenticationToken(tokenData);
    return token;
};
/**
 * Method to generate jwt token
 */
let _generateVerificationToken = (tokenData, verification_type) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtVerificationToken(tokenData, verification_type);
    return token;
};
/**
 * Method to update user Email verification Database
 */
let _handleVerificationDataUpdate = async (id) => {
    log.info('Received request for deleting verification token::', id);
    let deletedInfo = await verificationDbHandler.deleteById(id);
    return deletedInfo;
};

let _encryptPassword = (password) => {
    let salt = config.bcrypt.saltValue;
    // generate a salt
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(salt, function (err, salt) {
            if (err) reject(err);
            // hash the password with new salt
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) reject(err);
                // override the plain password with the hashed one
                resolve(hash);
            });
        });
    });
};
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to get All User
     */

    searchUsers: async (req, res) => {
        let responseData = {};
        try {
            const { search } = req.query;

            if (!search || search.length < 2) {
                responseData.msg = 'Search query must be at least 2 characters';
                return responseHelper.error(res, responseData);
            }

            // Search for users by username, name, or email
            const users = await userDbHandler.getByQuery(
                {
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { name: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                },
                { _id: 1, username: 1, name: 1, email: 1 }
            );

            responseData.msg = `Found ${users.length} users matching '${search}'`;
            responseData.data = { docs: users };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Error searching users:', error);
            responseData.msg = 'Failed to search users';
            return responseHelper.error(res, responseData);
        }
    },

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll Users:', reqObj);
        let responseData = {};
        try {
            let getList;
            if (reqObj?.limit == -1) {
                getList = await userDbHandler.getByQuery({ refer_id: user_id }, { 'username': 1, 'name': 1, 'email': 1, 'status': 1 });
            }
            else {
                getList = await userDbHandler.getAll(reqObj, user_id);
            }

            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch users data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOneBYUsername: async (req, res) => {
        let username = req.params.username;
        let responseData = {};
        try {
            let getDetail = await userDbHandler.getOneByQuery({ username: username }, { password: 0 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = getDetail;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getDownline: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getDownline Users:', reqObj);
        let responseData = {};
        try {
            let getList = await getChildLevelsByRefer(user_id, true, 20);
            // getList = await getSingleDimensional(getList)
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch users data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getDownlineLength: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getDownline Users:', reqObj);
        let responseData = {};
        try {
            let getList = await getChildLevelsByRefer(user_id, true, 20);
            getList = await getSingleDimensional(getList)
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList.length
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch users data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

};