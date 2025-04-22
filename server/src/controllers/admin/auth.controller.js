'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminAuthController').getChildLogger();
const {
    adminDbHandler
} = require('../../services/db');
const bcrypt = require('bcryptjs');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
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
let _generateAdminToken = (tokenData) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAdminAuthenticationToken(tokenData);
    return token;
};
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to handle admin login
     */
    login: async (req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for Admin Login:', reqObj);
        let responseData = {};
        try {
            let emails = process.env['ADMIN_EMAILS'].split(",");
            let query = {
                email: reqObj.email
            };
            //check if admin email is present in the database, then only login request will process
            let adminData = await adminDbHandler.getByQuery(query);
            //if no admin found, return error
            if (adminData.length) {
                log.info('Admin login found', adminData);
                let reqPassword = reqObj.password;
                let adminPassword = adminData[0].password;
                //compare req body password and user password,
                let isPasswordMatch = await _comparePassword(reqPassword, adminPassword);
                //if password does not match, return error
                if (!isPasswordMatch) {
                    responseData.msg = 'Password not match';
                    return responseHelper.error(res, responseData);
                }

                if (!adminData[0].status) {
                    responseData.msg = "Your account is Disabled please contact to admin!";
                    return responseHelper.error(res, responseData);
                }
                let time = new Date().getTime();
                //patch token data obj
                let tokenData = {
                    sub: adminData[0]._id,
                    email: adminData[0].email,
                    time: time
                };
                adminData[0].last_login = new Date();
                adminData[0].force_relogin_time = time;
                adminData[0].force_relogin_type = 'session_expired';

                await adminData[0].save();
                //update the response Data
                //generate jwt token with the token obj
                let jwtToken = _generateAdminToken(tokenData);
                responseData.msg = 'Welcome';
                responseData.data = {
                    authToken: jwtToken,
                    email: adminData[0].email,
                    name: adminData[0].name
                };
                return responseHelper.success(res, responseData);
            } else if (emails.includes(reqObj.email)) {
                let time = new Date().getTime();
                reqObj.last_login = new Date();
                reqObj.is_super_admin = true;
                reqObj.force_relogin_time = time;
                reqObj.force_relogin_type = 'session_expired';
                let newAdmin = await adminDbHandler.create(reqObj);
                // create the first user also
                log.info('new admin login created', newAdmin);
                //patch token data obj

                let tokenData = {
                    sub: newAdmin._id,
                    email: newAdmin.email,
                    time: time
                };
                //update the response Data
                //generate jwt token with the token obj
                let jwtToken = _generateAdminToken(tokenData);
                responseData.msg = 'Welcome';
                responseData.data = { authToken: jwtToken, email: newAdmin.email, name: '' };
                return responseHelper.success(res, responseData);
            }
            responseData.msg = 'User doesn\'t exists';
            return responseHelper.error(res, responseData);
        } catch (error) {
            log.error('failed to get admin login with error::', error);
            responseData.msg = 'Failed to get admin login';
            return responseHelper.error(res, responseData);
        }
    }
};