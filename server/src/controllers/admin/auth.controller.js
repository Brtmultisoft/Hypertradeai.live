'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminAuthController').getChildLogger();
const {
    adminDbHandler
} = require('../../services/db');
const databaseService = require('../../services/database.service');
const bcrypt = require('bcryptjs');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
/*******************
 * PRIVATE FUNCTIONS
 ********************/
/**
 * Method to Compare password using enhanced password service
 */
let _comparePassword = async (reqPassword, userPassword) => {
    try {
        // Import password service
        const passwordService = require('../../services/password.service');

        // Compare passwords with enhanced security
        return await passwordService.comparePassword(reqPassword, userPassword);
    } catch (error) {
        log.error('Error comparing passwords:', error);
        throw error;
    }
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
        log.info('Received request for Admin Login:', reqObj);
        let responseData = {};

        // Import security audit service
        const securityAuditService = require('../../services/security-audit.service');

        // Get client IP address
        const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        try {
            // Ensure database connection is established before proceeding
            if (!databaseService.isConnectedToDatabase()) {
                log.info('Database not connected, attempting to connect...');
                try {
                    await databaseService.connect();
                    log.info('Database connection established for admin login');
                } catch (dbError) {
                    log.error('Failed to connect to database for admin login:', dbError);
                    responseData.msg = 'Database connection error. Please try again later.';

                    // Log failed login attempt due to database error
                    securityAuditService.logLoginAttempt(
                        reqObj.email,
                        null,
                        clientIp,
                        false,
                        'Database connection error'
                    );

                    return responseHelper.error(res, responseData);
                }
            }

            let emails = process.env['ADMIN_EMAILS'].split(",");
            let query = {
                email: reqObj.email
            };

            // Check if admin email is present in the database
            let adminData = await adminDbHandler.getByQuery(query);

            // If admin found, process login
            if (adminData && adminData.length) {
                log.info('Admin login found');
                let reqPassword = reqObj.password;
                let adminPassword = adminData[0].password;

                // Compare password
                let isPasswordMatch = await _comparePassword(reqPassword, adminPassword);
                if (!isPasswordMatch) {
                    responseData.msg = 'Password does not match';

                    // Log failed login attempt due to incorrect password
                    securityAuditService.logLoginAttempt(
                        reqObj.email,
                        adminData[0]._id.toString(),
                        clientIp,
                        false,
                        'Incorrect password'
                    );

                    return responseHelper.error(res, responseData);
                }

                if (!adminData[0].status) {
                    responseData.msg = "Your account is disabled. Please contact admin!";

                    // Log failed login attempt due to disabled account
                    securityAuditService.logLoginAttempt(
                        reqObj.email,
                        adminData[0]._id.toString(),
                        clientIp,
                        false,
                        'Account disabled'
                    );

                    return responseHelper.error(res, responseData);
                }

                let time = new Date().getTime();

                // Prepare token data with enhanced security
                let tokenData = {
                    sub: adminData[0]._id,
                    email: adminData[0].email,
                    time: time,
                    role: 'admin',
                    ip: clientIp.replace(/::ffff:/, '') // Store IP in token for additional validation
                };

                // Update admin data
                adminData[0].last_login = new Date();
                adminData[0].force_relogin_time = time;
                adminData[0].force_relogin_type = 'session_expired';
                adminData[0].last_login_ip = clientIp;
                adminData[0].login_count = (adminData[0].login_count || 0) + 1;

                try {
                    await adminData[0].save();
                } catch (saveError) {
                    log.error('Error saving admin data:', saveError);
                    // Continue anyway - we can still log in the user
                }

                // Generate JWT token
                let jwtToken = _generateAdminToken(tokenData);

                // Log successful login
                securityAuditService.logLoginAttempt(
                    reqObj.email,
                    adminData[0]._id.toString(),
                    clientIp,
                    true
                );

                responseData.msg = 'Welcome';
                responseData.data = {
                    authToken: jwtToken,
                    email: adminData[0].email,
                    name: adminData[0].name,
                    is_super_admin: adminData[0].is_super_admin
                };
                return responseHelper.success(res, responseData);
            }
            // If admin not found but email is in allowed list, create new admin
            else if (emails.includes(reqObj.email)) {
                let time = new Date().getTime();

                // Prepare new admin data
                const newAdminData = {
                    email: reqObj.email,
                    password: reqObj.password, // Will be hashed by the model
                    last_login: new Date(),
                    last_login_ip: clientIp,
                    login_count: 1,
                    is_super_admin: true,
                    force_relogin_time: time,
                    force_relogin_type: 'session_expired',
                    status: true
                };

                // Create new admin
                let newAdmin = await adminDbHandler.create(newAdminData);
                log.info('New admin account created');

                // Prepare token data with enhanced security
                let tokenData = {
                    sub: newAdmin._id,
                    email: newAdmin.email,
                    time: time,
                    role: 'admin',
                    ip: clientIp.replace(/::ffff:/, '') // Store IP in token for additional validation
                };

                // Generate JWT token
                let jwtToken = _generateAdminToken(tokenData);

                // Log successful account creation and login
                securityAuditService.logSecurityEvent(
                    'ADMIN_ACCOUNT_CREATION',
                    { email: newAdmin.email },
                    newAdmin._id.toString(),
                    clientIp,
                    true
                );

                securityAuditService.logLoginAttempt(
                    reqObj.email,
                    newAdmin._id.toString(),
                    clientIp,
                    true
                );

                responseData.msg = 'Welcome! New admin account created.';
                responseData.data = {
                    authToken: jwtToken,
                    email: newAdmin.email,
                    name: newAdmin.name || '',
                    is_super_admin: newAdmin.is_super_admin
                };
                return responseHelper.success(res, responseData);
            }

            // If admin not found and email not in allowed list
            responseData.msg = 'User doesn\'t exist';

            // Log failed login attempt due to non-existent user
            securityAuditService.logLoginAttempt(
                reqObj.email,
                null,
                clientIp,
                false,
                'User does not exist'
            );

            return responseHelper.error(res, responseData);
        } catch (error) {
            log.error('Failed to process admin login with error:', error);

            // Check if it's a database connection error
            if (error.name === 'MongoNotConnectedError' || error.message?.includes('Client must be connected')) {
                responseData.msg = 'Database connection error. Please try again later.';
            } else {
                responseData.msg = 'Failed to process login. Please try again.';
            }

            // Log failed login attempt due to server error
            securityAuditService.logLoginAttempt(
                reqObj.email,
                null,
                clientIp,
                false,
                `Server error: ${error.message}`
            );

            return responseHelper.error(res, responseData);
        }
    }
};