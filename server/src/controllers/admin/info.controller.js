'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminController').getChildLogger();
const { adminDbHandler, settingDbHandler, userDbHandler } = require('../../services/db');
const bcrypt = require('bcryptjs');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const { settingModel } = require('../../models');
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

// Method to create hash password on update
let _createHashPassword = async (password) => {
    let salt = config.bcrypt.saltValue;
    const saltpass = await bcrypt.genSalt(salt);
    // now we set user password to hashed password
    let hashedPassword = await bcrypt.hash(password, saltpass);
    return hashedPassword;
}

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
   *  Method to update User Profile
   */
    updateUserProfile: async (req, res) => {
        let reqObj = req.body;
        let admin = req.admin;
        let id = admin.sub;
        log.info('Recieved request for User Profile update:', reqObj);
        let responseData = {};
        try {
            let userData = await userDbHandler.getById(reqObj?.id, { password: 0 });
            if (!userData) {
                responseData.msg = 'Invalid user!';
                return responseHelper.error(res, responseData);
            }

            let checkEmail = await userDbHandler.getByQuery({ _id: { $ne: reqObj?.id }, email: reqObj?.email });
            let checkPhoneNumber = await userDbHandler.getByQuery({ _id: { $ne: reqObj?.id }, phone_number: reqObj?.phone_number });

            if (reqObj.phone_number != undefined && checkPhoneNumber.length >= config.phoneCheck) {
                responseData.msg = 'Phone Number Already Exist !';
                return responseHelper.error(res, responseData);
            }
            if (reqObj.email != undefined && checkEmail.length >= config.emailCheck) {
                responseData.msg = 'Email Already Exist !';
                return responseHelper.error(res, responseData);
            }

            let avatar = userData?.avatar;
            if (req.file) {
                avatar = req.file.location;
            }

            let updatedObj = {
                name: reqObj?.name,
                address: reqObj?.address,
                dob: reqObj?.dob,
                phone_number: reqObj?.phone_number,
                wallet_address: reqObj?.wallet_address,
                country: reqObj?.country,
                country_code: reqObj?.country_code,
                state: reqObj?.state,
                city: reqObj?.city,
                avatar: avatar
            }

            if (reqObj?.password) {
                updatedObj.password = await _createHashPassword(reqObj.password);
            }

            if (config.loginByType != 'email' && reqObj?.email) {
                updatedObj.email = reqObj?.email;
            }
            if (config.loginByType != 'address' && reqObj?.address) {
                updatedObj.address = reqObj?.address;
            }

            await userDbHandler.updateById(reqObj?.id, updatedObj);
            let userUpdatedData = await userDbHandler.getById(reqObj?.id, { password: 0 });
            responseData.data = userUpdatedData;
            responseData.msg = `Data updated sucessfully !`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'Failed to get user login';
            return responseHelper.error(res, responseData);
        }
    },

    updateContent: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        let id = admin.sub;
        let reqObj = req.body;
        try {

            // BROKE
            await settingModel.updateOne(
                { name: "content" },
                {
                    name: "content",
                    "extra.heading": reqObj?.heading,
                    "extra.facebookPage": reqObj?.facebookPage,
                    "extra.telegramPage": reqObj?.telegramPage,
                    "extra.instagramPage": reqObj?.instagramPage,
                    "extra.linkedinPage": reqObj?.linkedinPage,
                    "extra.twitterPage": reqObj?.twitterPage,
                    "extra.first_youtubeVideo": reqObj?.first_youtubeVideo,
                    "extra.second_youtubeVideo": reqObj?.second_youtubeVideo,
                    "extra.third_youtubeVideo": reqObj?.third_youtubeVideo,
                    "extra.facebook_task": reqObj?.facebook_task,
                    "extra.twitter_task": reqObj?.twitter_task,
                    "extra.instagram_task": reqObj?.instagram_task,
                    "extra.banner": req?.file?.key
                },
                { upsert: true }
            )

            responseData.msg = "Data updated successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    },

    profile: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        let id = admin.sub;
        try {
            let getDetail = await adminDbHandler.getById(id, { password: 0 });
            responseData.msg = "Data fetched successfully!";
            responseData.data = getDetail;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    updateProfile: async (req, res) => {
        let responseData = {};
        let admin = req.admin;
        let id = admin.sub;
        let reqObj = req.body;
        try {
            let updatedData = {
                name: reqObj.name,
                //email: reqObj.email,
                phone_number: reqObj?.phone_number,
            }
            if (reqObj.old_password) {
                let reqOldPassword = reqObj.old_password;
                let adminPassword = getByQuery[0].password;
                let isPasswordMatch = await _comparePassword(reqOldPassword, adminPassword);
                if (!isPasswordMatch) {
                    responseData.msg = "Old password is not correct!";
                    return responseHelper.error(res, responseData);
                }
                if (reqObj.password) {
                    updatedData.password = await _createHashPassword(reqObj.password);
                }
            }

            let updateAdmin = await adminDbHandler.updateById(id, updatedData);
            responseData.msg = "Data updated successfully!";
            responseData.data = updateAdmin;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle change password
     */
    changePassword: async (req, res) => {
        let reqObj = req.body;
        let admin = req.admin;
        let id = admin.sub;
        log.info('Recieved request for Admin Profile update:', reqObj);
        let responseData = {};
        try {
            let adminData = await adminDbHandler.getById(id);
            let comparePassword = await _comparePassword(reqObj.old_password, adminData.password);
            if (!comparePassword) {
                responseData.msg = `Invalid old password !`;
                return responseHelper.error(res, responseData);
            }
            let compareNewAndOld = await _comparePassword(reqObj.password, adminData.password);
            if (compareNewAndOld) {
                responseData.msg = `New password must be different from old password !`;
                return responseHelper.error(res, responseData);
            }
            let updatedObj = {
                password: await _encryptPassword(reqObj.password)
            }
            await adminDbHandler.updateById(id, updatedObj);
            responseData.msg = `Data updated sucessfully !`;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('failed to update with error::', error);
            responseData.msg = 'Failed to update data';
            return responseHelper.error(res, responseData);
        }
    }
};
