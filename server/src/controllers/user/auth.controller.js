'use strict';
const logger = require('../../services/logger');
const log = new logger('AuthController').getChildLogger();
const { userDbHandler, verificationDbHandler, userLoginRequestDbHandler } = require('../../services/db');
const { getPlacementId, getTerminalId } = require('../../services/commonFun');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');
const jwtService = require('../../services/jwt');
const emailService = require('../../services/sendEmail');
const responseHelper = require('../../utils/customResponse');
const templates = require('../../utils/templates/template');
const { authenticator } = require("otplib");

// Configure authenticator options (remove invalid encoding option)
authenticator.options = {
    step: 30,        // Time step in seconds (30 is standard)
    window: 1,       // Allow ±1 time step (±30 seconds)
    digits: 6,       // 6-digit codes
    algorithm: 'sha1' // SHA1 algorithm (standard for Google Authenticator)
};

const Web3 = require('web3');
const web3 = new Web3.default('https://bsc-dataseed1.binance.org:443');

const contractABI = process.env.VITE_APP_DEPOSIT_CONTRACT_ABI;
const contractAddress = process.env.VITE_APP_DEPOSIT_CONTRACT_ADDRESS;



const crypto = require('crypto');
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
    /*******************
     * PRIVATE FUNCTIONS
     ********************/
    /**
     * Method to Compare password
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
let _generateUserToken = (tokenData, exp = 0) => {
    //create a new instance for jwt service
    let tokenService = new jwtService();
    let token = tokenService.createJwtAuthenticationToken(tokenData, exp);
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
let _handleVerificationDataUpdate = async(id) => {
    log.info('Received request for deleting verification token::', id);
    let deletedInfo = await verificationDbHandler.deleteById(id);
    return deletedInfo;
};

let _encryptPassword = async (password) => {
    try {
        // Import password service
        const passwordService = require('../../services/password.service');

        // Hash password with enhanced security
        return await passwordService.hashPassword(password);
    } catch (error) {
        log.error('Error encrypting password:', error);
        throw error;
    }
};

let generateRandomPassword = (length = 12) => {
    try {
        // Import password service
        const passwordService = require('../../services/password.service');

        // Generate secure random password
        return passwordService.generateRandomPassword(length);
    } catch (error) {
        log.error('Error generating random password:', error);
        // Fallback to simple random password if service fails
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return password;
    }
};
const generateTraceId = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let traceId = 'ROB';
    for (let i = 0; i < 5; i++) {
        traceId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return traceId;
};

// Generate a unique sponsor ID (NB + 5 digits)
const generateSponsorId = async() => {
    const prefix = 'NB';
    let isUnique = false;
    let sponsorId = '';

    while (!isUnique) {
        // Generate a random 5-digit number
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        sponsorId = `${prefix}${randomNum}`;

        // Check if this sponsor ID already exists
        const existingUser = await userDbHandler.getOneByQuery({ sponsorID: sponsorId });
        if (!existingUser) {
            isUnique = true;
        }
    }

    return sponsorId;
};
/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {
    /**
     * Method to handle user login
     */


    // old login

    //     login: async (req, res) => {
    //     let reqObj = req.body;
    //     log.info('Recieved request for User Login:', reqObj);
    //     let responseData = {};
    //     try {
    //         let query = {};
    //         if (config.loginByType == 'email') {
    //             query.username = reqObj?.email.toLowerCase();
    //         }
    //         else if (config.loginByType == 'address') {
    //             query.username = reqObj?.address.toLowerCase();
    //         }
    //         else {
    //             query.username = reqObj?.username;
    //         }

    //         let getUser = await userDbHandler.getByQuery(query);
    //         if (!getUser.length) {
    //             // if we didn't got the user and the email entered matched with our env emails of the first user
    //             // then we will create him for the first time
    //             if (query.username === process.env.TOP_ID) {

    //                 let submitData = {
    //                     refer_id: null,
    //                     [`${config.loginByType}`]: query.username,
    //                     username: query.username,
    //                     password: reqObj?.password,

    //                     is_default: true
    //                 }
    //                 getUser = [await userDbHandler.create(submitData)]

    //                 // log.info('Top User created in the database collection', newUser);
    //                 // responseData.msg = "Top user created successfully, please try again !!!"
    //                 // return responseHelper.success(res, responseData);

    //             } else {
    //                 responseData.msg = "Invalid Credentials!";

    //                 return responseHelper.success(res, responseData);
    //             }
    //         }

    //         let checkPassword = (config.loginByType != 'address') ? await _comparePassword(reqObj?.password, getUser[0].password) : null;


    //         if (config.loginByType != 'address' && !checkPassword) {
    //             responseData.msg = "Invalid Credentials!";
    //             return responseHelper.success2(res, responseData);
    //         }

    //         if (process.env.EMAIL_VERIFICATION === '1' && config.loginByType == 'email' && !getUser[0].email_verified) {
    //             responseData.msg = "Email not verified yet!";
    //             return responseHelper.success2(res, responseData);
    //         }
    //         if (!getUser[0].status) {
    //             responseData.msg = "Your account is Disabled please contact to admin!";
    //             return responseHelper.success2(res, responseData);
    //         }

    //         let time = new Date().getTime();

    //         let updatedObj = {
    //             force_relogin_time: time,
    //             force_relogin_type: 'session_expired'
    //         }
    //         let updatedObj2 = {

    //             force_relogin_time: time,
    //             force_relogin_type: 'session_expired'
    //         }



    //         if (getUser[0]?.two_fa_enabled) {
    //             let returnResponse = {
    //                 two_fa_enabled: true,
    //                 loginStep2VerificationToken: await _generateUserToken({ email: getUser[0].email }, "5m"),
    //             };

    //             responseData.msg = `Please complete 2-factor authentication !`;
    //             responseData.data = returnResponse;
    //             return responseHelper.success(res, responseData);
    //         }
    //         else {
    //             let tokenData = {
    //                 sub: getUser[0]._id,
    //                 username: getUser[0].username,
    //                 email: getUser[0].email,
    //                 address: getUser[0].address,

    //                 name: getUser[0].name,
    //                 time: time
    //             };

    //             let token = _generateUserToken(tokenData);
    //             let returnResponse = {
    //                 user_id: getUser[0]._id,
    //                 //username: getUser[0].username,
    //                 name: getUser[0].name,
    //                 username: getUser[0].username,
    //                 email: getUser[0].email,
    //                 address: getUser[0].address,
    //                 email_verify: getUser[0].email_verified,

    //                 avatar: getUser[0]?.avatar,
    //                 token: token,
    //                 two_fa_enabled: getUser[0]?.two_fa_enabled
    //             }
    //             responseData.msg = `Welcome ${getUser[0].username} !`;
    //             responseData.data = returnResponse;
    //             return responseHelper.success(res, responseData);
    //         }

    //     } catch (error) {
    //         log.error('failed to get user signin with error::', error);
    //         responseData.msg = 'Failed to get user login';
    //         return responseHelper.success2(res, responseData);
    //     }
    // },
    checkAddress: async(req, res) => {
        let reqObj = req.body;
        log.info('Received request for checking user address:', reqObj);
        let responseData = {};
        try {
            // Check both username and wallet_address fields
            const user = await userDbHandler.getOneByQuery({
                $or: [
                    { username: reqObj.userAddress },
                    { wallet_address: reqObj.userAddress }
                ]
            });

            console.log("Found user:", user);

            if (!user) {
                responseData.msg = "User not found!";
                responseData.data = {
                    isRegistered: false
                };
                return responseHelper.success(res, responseData);
            }

            responseData.msg = "User found!";
            responseData.data = {
                isRegistered: true,
                userId: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                wallet_address: user.wallet_address
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to check address with error:', error);
            responseData.msg = 'Failed to check address';
            return responseHelper.error(res, responseData);
        }
    },
    login: async(req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for User Login:', reqObj);
        let responseData = {};
        try {
            let query = {
                $or: [
                    { username: reqObj ?.userAddress },
                    { email: reqObj ?.userAddress ?.toLowerCase() } // Also check if userAddress matches an email
                ]
            };

            let getUser = await userDbHandler.getByQuery(query);

            if (!getUser || getUser.length === 0) {
                responseData.msg = "Invalid Credentials!";
                return responseHelper.error(res, responseData);
            }
            console.log(getUser);

            // Check if user is blocked
            if (getUser[0].is_blocked) {
                responseData.msg = "Your account has been blocked. Please contact support for assistance.";
                responseData.block_reason = getUser[0].block_reason || 'No reason provided';
                return responseHelper.forbidden(res, responseData);
            }

            // Check if password matches
            try {
                const checkPassword = await _comparePassword(reqObj ?.password, getUser[0].password);
                if (!checkPassword) {
                    console.log('Password comparison failed for user:', getUser[0].username);
                    responseData.msg = "Invalid Credentials!";
                    return responseHelper.error(res, responseData);
                }
            } catch (err) {
                console.error('Error comparing passwords:', err);
                responseData.msg = "Invalid Credentials!";
                return responseHelper.error(res, responseData);
            }


            let time = new Date().getTime();

            // Get current date (without time) for comparing last login date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get user's last login date
            const lastLoginDate = getUser[0].last_login_date ? new Date(getUser[0].last_login_date) : null;
            lastLoginDate ?.setHours(0, 0, 0, 0);

            // Check if this is the first login of the day
            const isNewDay = !lastLoginDate || lastLoginDate.getTime() !== today.getTime();

            // Update login tracking fields - don't set force_relogin_time to avoid immediate session expiration
            const updateFields = {
                // Don't set force_relogin_time during login
                // force_relogin_time: time,
                // force_relogin_type: 'session_expired',
                last_login_date: new Date()
            };

            // If it's a new day, reset the daily login counter
            if (isNewDay) {
                updateFields.daily_logins = 1;
                console.log(`New day login for user ${getUser[0].username}. Reset daily logins to 1.`);
            } else {
                // Increment the daily login counter
                updateFields.daily_logins = (getUser[0].daily_logins || 0) + 1;
                console.log(`User ${getUser[0].username} logged in ${updateFields.daily_logins} times today.`);
            }

            // Check if user has met their daily login requirement for their current rank
            const dailyLoginRequirement = getUser[0].daily_limit_view || 1;
            const hasMetLoginRequirement = updateFields.daily_logins >= dailyLoginRequirement;

            // User's rank benefits are active only if they meet the daily login requirement
            // Note: The user's rank itself is determined by investment and team size in the cron job
            updateFields.rank_benefits_active = hasMetLoginRequirement;

            if (hasMetLoginRequirement) {
                console.log(`User ${getUser[0].username} has met the daily login requirement (${dailyLoginRequirement}) for rank ${getUser[0].rank}.`);
                console.log(`Rank benefits activated: Trade Booster ${getUser[0].trade_booster}%, Level ROI Income: ${getUser[0].level_roi_income}`);
            } else {
                console.log(`User ${getUser[0].username} has not met the daily login requirement yet. ` +
                    `Current: ${updateFields.daily_logins}, Required: ${dailyLoginRequirement}`);
                console.log(`Rank benefits deactivated. Using base ACTIVE rank benefits.`);
            }

            // Update user record
            await userDbHandler.updateById(getUser[0]._id, updateFields);

            // Always proceed with normal login first, then check 2FA
            let tokenData = {
                sub: getUser[0]._id,
                username: getUser[0].username,
                email: getUser[0].email,
                address: getUser[0].address,
                name: getUser[0].name,
                time: time
            };

            let token = _generateUserToken(tokenData);
            let returnResponse = {
                user_id: getUser[0]._id.toString(), // Convert ObjectId to string
                name: getUser[0].name,
                username: getUser[0].username,
                email: getUser[0].email,
                address: getUser[0].address,
                email_verify: getUser[0].email_verified,
                avatar: getUser[0] ?.avatar,
                token: token,
                two_fa_enabled: getUser[0] ?.two_fa_enabled,
                sponsorID: getUser[0].sponsorID
            };

            // Check if 2FA is enabled and handle based on method
            if (getUser[0].two_fa_enabled) {
                log.info('2FA is enabled for user:', getUser[0].username, 'Method:', getUser[0].two_fa_method);

                // Add common 2FA info to response
                returnResponse.requires_2fa_verification = true;
                returnResponse.two_fa_method = getUser[0].two_fa_method || 'otpless';

                // Remove token from response when 2FA is required
                delete returnResponse.token;

                if (getUser[0].two_fa_method === 'totp') {
                    // For TOTP (Google Authenticator), just indicate that 2FA is required
                    log.info('TOTP 2FA required for user:', getUser[0].username);

                    returnResponse.two_fa_message = 'Please enter the code from your authenticator app';

                    // Debug: Log the response data to ensure user_id is included
                    log.info('TOTP 2FA response data:', {
                        user_id: returnResponse.user_id,
                        two_fa_method: returnResponse.two_fa_method,
                        requires_2fa_verification: returnResponse.requires_2fa_verification
                    });

                    responseData.msg = 'Login successful! Please verify using your authenticator app for 2FA.';
                    responseData.data = returnResponse;
                    return responseHelper.success(res, responseData);
                } else {
                    // For OTPless (email), send OTP
                    log.info('Email OTP 2FA required for user, sending OTP:', getUser[0].username);

                    try {
                        // Import OTPless service
                        const otplessService = require('../../services/otpless.service');

                        // Send OTP for 2FA verification
                        const otpResult = await otplessService.sendLoginOTP(getUser[0].email);

                        if (otpResult.success) {
                            log.info('2FA OTP sent successfully', {
                                email: getUser[0].email,
                                requestId: otpResult.requestId
                            });

                            returnResponse.otp_request_id = otpResult.requestId;
                            returnResponse.two_fa_message = 'OTP sent to your email for 2FA verification';

                            responseData.msg = 'Login successful! Please verify OTP sent to your email for 2FA.';
                            responseData.data = returnResponse;
                            return responseHelper.success(res, responseData);

                        } else if (otpResult.disabled) {
                            log.info('2FA OTP is disabled by admin settings');
                            // Skip 2FA when OTP is disabled and proceed with normal login
                            returnResponse.token = token; // Add token back to response
                            returnResponse.two_fa_warning = '2FA OTP is currently disabled by administrator.';
                            responseData.msg = 'Login successful! (2FA OTP is disabled)';
                            responseData.data = returnResponse;
                            return responseHelper.success(res, responseData);
                        } else {
                            log.error('Failed to send 2FA OTP:', otpResult.error);
                            // Still allow login but notify about 2FA failure
                            returnResponse.two_fa_warning = 'Failed to send 2FA OTP. Please contact support.';
                            responseData.msg = 'Login successful! (2FA OTP failed to send)';
                            responseData.data = returnResponse;
                            return responseHelper.success(res, responseData);
                        }

                    } catch (otpError) {
                        log.error('Error sending 2FA OTP:', otpError);
                        // Still allow login but notify about 2FA failure
                        returnResponse.two_fa_warning = 'Failed to send 2FA OTP. Please contact support.';
                        responseData.msg = 'Login successful! (2FA OTP failed to send)';
                        responseData.data = returnResponse;
                        return responseHelper.success(res, responseData);
                    }
                }
            }

            // Normal login without 2FA
            responseData.msg = 'Welcome!';
            responseData.data = returnResponse;
            console.log(responseData);
            return responseHelper.success(res, responseData);


        } catch (error) {
            log.error('failed to get user signin with error::', error);
            responseData.msg = 'Failed to get user login';
            return responseHelper.success2(res, responseData);
        }
    },

    /**
     * Method to verify 2FA OTP after successful login
     */
    verify2FAOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for 2FA verification:', reqObj);
        let responseData = {};

        try {
            const { otp, otp_request_id, user_id } = reqObj;

            // Validate required fields
            if (!otp || !user_id) {
                responseData.msg = 'OTP and user_id are required';
                return responseHelper.error(res, responseData);
            }

            // Get user details
            const user = await userDbHandler.getById(user_id);
            if (!user) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            let verificationResult;

            // Handle verification based on 2FA method
            if (user.two_fa_method === 'totp') {
                // Verify TOTP code using Google Authenticator
                log.info('Verifying TOTP code for user:', user.username);

                const cleanOtp = otp.replace(/\s/g, '');

                // Validate token format
                if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
                    responseData.msg = 'Please enter a valid 6-digit code from your authenticator app.';
                    return responseHelper.error(res, responseData);
                }

                // Validate secret exists
                if (!user.two_fa_secret) {
                    responseData.msg = '2FA secret not found. Please contact support.';
                    return responseHelper.error(res, responseData);
                }

                // Use authenticator.verify with window tolerance for better compatibility
                const verifyOptions = {
                    token: cleanOtp,
                    secret: user.two_fa_secret,
                    window: 2 // Allow ±2 time steps (±60 seconds) for clock drift
                };

                const isValid = authenticator.verify(verifyOptions);

                if (!isValid) {
                    log.error('TOTP verification failed for user:', user.username);
                    responseData.msg = 'Invalid or expired authenticator code. Please ensure your device time is synchronized and try the current code from your app.';
                    return responseHelper.error(res, responseData);
                }

                verificationResult = { success: true, isVerified: true };
                log.info('TOTP verified successfully for user:', user.username);
            } else {
                // Verify email OTP using OTPless service
                log.info('Verifying email OTP for user:', user.username);

                if (!otp_request_id) {
                    responseData.msg = 'otp_request_id is required for email OTP verification';
                    return responseHelper.error(res, responseData);
                }

                const otplessService = require('../../services/otpless.service');
                verificationResult = await otplessService.verifyLoginOTP(otp, otp_request_id);

                if (!verificationResult.success || !verificationResult.isVerified) {
                    log.error('Email OTP verification failed:', verificationResult.error);
                    responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                    return responseHelper.error(res, responseData);
                }

                log.info('Email OTP verified successfully for user:', user.username);
            }

            // Generate token for complete login after 2FA verification
            let time = new Date().getTime();
            let tokenData = {
                sub: user._id,
                username: user.username,
                email: user.email,
                address: user.address,
                name: user.name,
                time: time
            };

            let token = _generateUserToken(tokenData);

            // Update user's last login
            await userDbHandler.updateById(user._id, {
                last_login_date: new Date()
            });

            let returnResponse = {
                user_id: user._id.toString(), // Convert ObjectId to string
                name: user.name,
                username: user.username,
                email: user.email,
                address: user.address,
                email_verify: user.email_verified,
                avatar: user.avatar,
                token: token,
                two_fa_enabled: user.two_fa_enabled
            };

            responseData.msg = '2FA verification successful! Login completed.';
            responseData.data = returnResponse;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify 2FA OTP:', error);
            responseData.msg = 'Failed to verify 2FA OTP';
            return responseHelper.error(res, responseData);
        }
    },


    /**
     * Method to handle user login request from Admin Side
     */
    userLoginRequest: async(req, res) => {
        let reqObj = req.body;
        log.info('Received request for User Login Request:', reqObj);
        let responseData = {}
        try {
            // Validate the hash parameter
            if (!reqObj.hash) {
                log.error('Hash parameter is missing');
                responseData.msg = 'Hash parameter is required';
                return responseHelper.error(res, responseData);
            }

            // Find the login request by hash
            const loginRequest = await userLoginRequestDbHandler.getOneByQuery({ hash: reqObj.hash });
            if (!loginRequest) {
                log.error(`Invalid or expired hash: ${reqObj.hash}`);
                responseData.msg = `Invalid or expired login request`;
                return responseHelper.error(res, responseData);
            }

            // Get the user associated with the login request
            let getUser = await userDbHandler.getByQuery({ _id: loginRequest.user_id });
            if (!getUser.length) {
                log.error(`User not found for ID: ${loginRequest.user_id}`);
                responseData.msg = "User not found";
                return responseHelper.error(res, responseData);
            }

            // Get admin login timestamp and attempt ID if provided
            const adminLoginTimestamp = reqObj.admin_login_timestamp || Date.now().toString();
            const loginAttemptId = reqObj.login_attempt_id || '';
            log.info(`Admin login timestamp: ${adminLoginTimestamp}, Login attempt ID: ${loginAttemptId}`);

            // Generate timestamp for token
            let time = new Date().getTime();

            // Update user's session information
            let updatedObj = {
                last_login_date: new Date(),
                admin_login_active: true,
                admin_login_timestamp: adminLoginTimestamp,
                login_attempt_id: loginAttemptId
            }

            // Update the user record
            const updateResult = await userDbHandler.updateById(getUser[0]._id, updatedObj);
            if (!updateResult) {
                log.error(`Failed to update user session data for ID: ${getUser[0]._id}`);
                responseData.msg = "Failed to update user session";
                return responseHelper.error(res, responseData);
            }

            // Delete the login request to prevent reuse
            try {
                log.info(`Deleting login request with ID: ${loginRequest._id}`);
                await userLoginRequestDbHandler.deleteById(loginRequest._id);
                log.info(`Successfully deleted login request with ID: ${loginRequest._id}`);
            } catch (deleteError) {
                log.error(`Error deleting login request: ${deleteError}`);
                // Continue processing even if deletion fails
            }

            // Create token data for the user
            let tokenData = {
                sub: getUser[0]._id,
                username: getUser[0].username,
                email: getUser[0].email,
                address: getUser[0].address,
                name: getUser[0].name,
                time: time,
                admin_login: true, // Flag to indicate this is an admin-initiated login
                admin_login_timestamp: adminLoginTimestamp, // Include the timestamp in the token
                login_attempt_id: loginAttemptId // Include the login attempt ID in the token
            };

            // Generate JWT token
            let token = _generateUserToken(tokenData);

            // Prepare response data
            let returnResponse = {
                user_id: getUser[0]._id.toString(), // Convert ObjectId to string
                name: getUser[0].name,
                username: getUser[0].username,
                email: getUser[0].email,
                address: getUser[0].address,
                email_verify: getUser[0].email_verified,
                avatar: getUser[0] ?.avatar,
                token: token,
                two_fa_enabled: getUser[0] ?.two_fa_enabled,
                admin_login: true,
                admin_login_timestamp: adminLoginTimestamp,
                login_attempt_id: loginAttemptId,
                force_relogin_time: null, // Explicitly set to null to prevent forced logout
                force_relogin_type: null
            }

            responseData.msg = `Welcome ${getUser[0].username}!`;
            responseData.data = returnResponse;
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to process user login request with error:', error);
            responseData.msg = 'Failed to process login request';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle user login step2
     */
    loginStep2: async(req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for User Login:', reqObj);
        let responseData = {};
        try {
            let query = {
                email: req.user.email
            }
            let getUser = await userDbHandler.getByQuery(query);
            if (!getUser.length) {
                responseData.msg = "Invalid Request!";
                return responseHelper.error(res, responseData);
            }
            if (!getUser[0].email_verified) {
                responseData.msg = "Email not verified yet!";
                return responseHelper.error(res, responseData);
            }
            if (!getUser[0].status) {
                responseData.msg = "Your account is Disabled please contact to admin!";
                return responseHelper.error(res, responseData);
            }

            const otp = req.body.two_fa_token.replaceAll(" ", "");

            if (!authenticator.check(otp, getUser[0].two_fa_secret)) {
                responseData.msg = "The entered OTP is invalid!";
                return responseHelper.error(res, responseData);
            } else {
                let time = new Date().getTime();

                let updatedObj = {
                    force_relogin_time: time,
                    force_relogin_type: 'session_expired'
                }
                await userDbHandler.updateById(getUser[0]._id, updatedObj);
                let tokenData = {
                    sub: getUser[0]._id,
                    username: getUser[0].username,
                    email: getUser[0].email,
                    address: getUser[0].address,
                    name: getUser[0].name,
                    time: time
                };

                let token = _generateUserToken(tokenData);
                let returnResponse = {
                    user_id: getUser[0]._id.toString(), // Convert ObjectId to string
                    //username: getUser[0].username,
                    name: getUser[0].name,
                    username: getUser[0].username,
                    email: getUser[0].email,
                    address: getUser[0].address,
                    email_verify: getUser[0].email_verified,
                    avatar: getUser[0] ?.avatar,
                    token: token,
                    two_fa_enabled: getUser[0] ?.two_fa_enabled
                }
                responseData.msg = `Welcome ${getUser[0].username} !`;
                responseData.data = returnResponse;
                return responseHelper.success(res, responseData);
            }

        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'Failed to get user login';
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to check If Refer ID exists
     */
    checkReferID: async(req, res) => {
        let responseData = {}

        try {
            if (!req.body ?.refer_id) throw "Invalid Refer ID !!!"

            // Special case for 'admin' refer_id
            if (req.body.refer_id === 'admin') {
                // Try to find the admin user with ID 678f9a82a2dac325900fc47e
                const adminUser = await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" }, { _id: 1 })
                if (adminUser) {
                    responseData.msg = "Admin ID Verified Successfully!"
                    responseData.data = {
                        _id: adminUser._id.toString()
                    }
                    return responseHelper.success(res, responseData);
                }

                // If specific admin ID not found, try to find any user with is_default=true
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 })
                if (defaultUser) {
                    responseData.msg = "Default Admin Verified Successfully!"
                    responseData.data = {
                        _id: defaultUser._id.toString()
                    }
                    return responseHelper.success(res, responseData);
                }
            }

            // Check if it's a sponsor ID
            if (req.body.refer_id.startsWith('NB') || req.body.refer_id.startsWith('SI')) {
                const sponsorUser = await userDbHandler.getOneByQuery({ sponsorID: req.body.refer_id }, { _id: 1 })
                if (sponsorUser) {
                    responseData.msg = "Sponsor ID Verified Successfully!"
                    responseData.data = {
                        _id: sponsorUser._id.toString()
                    }
                    return responseHelper.success(res, responseData);
                }
            }

            // If not a sponsor ID or sponsor ID not found, check trace_id
            const user = await userDbHandler.getOneByQuery({ trace_id: req.body.refer_id }, { _id: 1 })
            if (!user) {
                // If not found by trace_id, check username
                const usernameUser = await userDbHandler.getOneByQuery({ username: req.body.refer_id }, { _id: 1 })
                if (!usernameUser) throw "Invalid User !!!"

                responseData.msg = "Username Verified Successfully!"
                responseData.data = {
                    _id: usernameUser._id.toString()
                }
                return responseHelper.success(res, responseData);
            }

            responseData.msg = "Refer ID Verified Successfully!"
            responseData.data = {
                _id: user._id.toString()
            }
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error(`Error while verifying referID: ${error}`)
            responseData.msg = error
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to get a default sponsor ID
     */
    getDefaultSponsor: async(req, res) => {
        let responseData = {}

        try {
            // First try to find the admin user with ID 678f9a82a2dac325900fc47e
            const adminUser = await userDbHandler.getOneByQuery({ _id: "678f9a82a2dac325900fc47e" }, { sponsorID: 1, username: 1 })

            if (adminUser && adminUser.sponsorID) {
                responseData.msg = "Admin sponsor found"
                responseData.data = {
                    refer_id: adminUser.sponsorID
                }
                return responseHelper.success(res, responseData);
            }

            // If admin user doesn't have a sponsorID, find any user with is_default=true
            const defaultUser = await userDbHandler.getOneByQuery({ is_default: true, sponsorID: { $exists: true, $ne: '' } }, { sponsorID: 1, username: 1 })

            if (defaultUser && defaultUser.sponsorID) {
                responseData.msg = "Default sponsor found"
                responseData.data = {
                    refer_id: defaultUser.sponsorID
                }
                return responseHelper.success(res, responseData);
            }

            // If no default user with sponsorID, find any user with a sponsorID
            const anyUser = await userDbHandler.getOneByQuery({ sponsorID: { $exists: true, $ne: '' } }, { sponsorID: 1, username: 1 })

            if (anyUser && anyUser.sponsorID) {
                responseData.msg = "Sponsor found"
                responseData.data = {
                    refer_id: anyUser.sponsorID
                }
                return responseHelper.success(res, responseData);
            }

            // If no user with sponsorID found, return admin as default
            responseData.msg = "No sponsor found, using default"
            responseData.data = {
                refer_id: 'admin'
            }
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error(`Error while getting default sponsor: ${error}`)
            responseData.msg = "Failed to get default sponsor"
            responseData.data = {
                refer_id: 'admin' // Fallback to admin
            }
            return responseHelper.success(res, responseData);
        }
    },
    /**
     * Method to handle user signup
     */

    // signup: async (req, res) => {
    //     let reqObj = req.body;
    //     log.info('Received request for User Signup:', reqObj);
    //     let responseData = {};

    //     try {
    //         let query = {};
    //         if (config.loginByType == 'email') {
    //             query.username = reqObj?.email.toLowerCase();
    //         } else if (config.loginByType == 'address') {
    //             query.username = reqObj?.address.toLowerCase();
    //         } else {
    //             query.username = reqObj?.username;
    //         }

    //         let refer_id = reqObj?.refer_id;
    //         let position = reqObj?.position;

    //         // Set refer_id to default (owner address) if not provided
    //         if (!refer_id) {
    //             const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1, address: 1 });
    //             refer_id = defaultUser._id; // Default referrer (owner address)
    //         }

    //         let placement_id = reqObj?.placement_id ? reqObj?.placement_id : refer_id;

    //         // Validate existing users (username, email, phone number)
    //         let checkUsername = await userDbHandler.getByQuery(query);
    //         let checkEmail = await userDbHandler.getByQuery({ email: reqObj?.email });
    //         let checkPhoneNumber = await userDbHandler.getByQuery({ phone_number: reqObj?.phone_number });
    //         let referUser = await userDbHandler.getById(refer_id);

    //         if (checkUsername.length) {
    //             responseData.msg = `${config.loginByName} already exists!`;
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (reqObj?.email && config.loginByType != 'address' && checkEmail.length >= config.emailCheck) {
    //             responseData.msg = 'Email already exists!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (reqObj?.phone_number && config.loginByType != 'address' && checkPhoneNumber.length >= config.phoneCheck) {
    //             responseData.msg = 'Phone number already exists!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (!referUser) {
    //             responseData.msg = 'Invalid refer ID!';
    //             return responseHelper.error(res, responseData);
    //         }
    //         // Interacting with the smart contract for package price and transfer
    //         const userAddress = reqObj?.address?.toLowerCase();

    //         // Fetch the contract instance
    //         const contract = new web3.eth.Contract(contractABI, contractAddress);

    //         // Fetch the owner's address dynamically
    //         const ownerAddress = await contract.methods.owner().call(); // Assuming the contract has an 'owner' function

    //         // Get package price from the contract (replace 'getPakagePriceBnb' with the actual method name)
    //         const packagePriceBnb = await contract.methods.getPakagePriceBnb().call(); // Get package price in BNB

    //         // Set the package amount directly (e.g., 0.142 BNB)
    //         const userAmount = web3.utils.toWei(packagePriceBnb.toString(), 'ether'); // Convert to Wei

    //         // Perform the token transfer via the smart contract
    //         const tx = await contract.methods
    //            .transferTokens(userAddress, userAmount) // Assuming the smart contract has a `transferTokens` function
    //            .send({ from: ownerAddress }); // The admin wallet address that will sign the transaction

    //         if (!tx.status) {
    //             responseData.msg = 'Failed to transfer tokens!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         // Prepare user data for database insertion
    //         let submitData = {
    //             refer_id: refer_id,
    //             placement_id: placement_id,
    //             username: query.username,
    //             email: reqObj?.email?.toLowerCase(),
    //             address: userAddress,
    //             password: reqObj?.password,
    //             name: reqObj?.name,
    //             phone_number: reqObj?.phone_number
    //         };

    //         // Create the user in the database
    //         let newUser = await userDbHandler.create(submitData);
    //         log.info('User created in the database collection', newUser);

    //         // Send a verification email if required
    //         if (process.env.EMAIL_VERIFICATION === '1' && config.loginByType != 'address' && config.loginByType != 'username') {
    //             let emailBody = {
    //                 recipientsAddress: newUser.email,
    //                 subject: `${config.brandName} Account Registration Credentials`,
    //                 body: `
    //                     <p>Dear ${newUser.name || newUser.username},</p>
    //                     <p>Your account has been created successfully! Below are your registration details:</p>
    //                     <p><strong>Username:</strong> ${newUser.username}</p>
    //                     <p><strong>Password:</strong> ${reqObj?.password}</p>
    //                     <p>Please keep these credentials secure. If you did not register, please contact support immediately.</p>
    //                     <p>Thank you for joining ${config.brandName}!</p>
    //                 `
    //             };

    //             let emailInfo = await emailService.sendEmail(emailBody);
    //             if (emailInfo) {
    //                 log.info('Registration email sent successfully', emailInfo);
    //                 responseData.msg = 'Your account has been created successfully! Your registration credentials have been sent to your email.';
    //                 return responseHelper.success(res, responseData);
    //             } else {
    //                 responseData.msg = 'Failed to send registration email.';
    //                 return responseHelper.error(res, responseData);
    //             }
    //         } else {
    //             responseData.msg = "Your account has been created successfully!";
    //             return responseHelper.success(res, responseData);
    //         }
    //     } catch (error) {
    //         log.error('Failed to get user signup with error::', error);
    //         responseData.msg = 'Failed to create user';
    //         return responseHelper.error(res, responseData);
    //     }
    // },



    signup: async(req, res) => {
        let reqObj = req.body;
        log.info('Received request for User Signup:', reqObj);
        let responseData = {};

        try {
            let query = {};

            // Check if username

            let checkUsername = await userDbHandler.getByQuery({ username: reqObj ?.userAddress });


            if (checkUsername.length) {
                responseData.msg = `user already exists!`;
                return responseHelper.error(res, responseData);
            }
            let trace_id = reqObj ?.referralId;
            let refer_id = null;

            // If a valid referral ID is provided, find the referring user
            if (trace_id) {
                // First check if it's a sponsor ID
                if (trace_id.startsWith('NB') || trace_id.startsWith('SI')) {
                    let sponsorUser = await userDbHandler.getOneByQuery({ sponsorID: trace_id }, { _id: 1 });
                    if (sponsorUser) {
                        refer_id = sponsorUser._id;
                    }
                }

                // If not a sponsor ID or sponsor ID not found, check username
                if (!refer_id) {
                    let referUser = await userDbHandler.getOneByQuery({ username: trace_id }, { _id: 1 });
                    if (referUser) {
                        refer_id = referUser._id;
                    }
                }

                // If still not found, check if it's 'admin'
                if (!refer_id && trace_id === 'admin') {
                    const adminUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                    if (adminUser) {
                        refer_id = adminUser._id;
                    }
                }

                // If no valid refer_id found, return error
                if (!refer_id) {
                    responseData.msg = 'Invalid referral ID!';
                    return responseHelper.error(res, responseData);
                }
            }

            // If no referral ID is provided, assign default refer_id and generate a trace_id
            if (!trace_id) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                refer_id = defaultUser ? defaultUser._id : null;
                if (!refer_id) {
                    responseData.msg = 'Default referral setup missing!';
                    return responseHelper.error(res, responseData);
                }

                // Generate a unique trace_id
                trace_id = generateTraceId();
                while (await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 })) {
                    trace_id = generateTraceId(); // Ensure uniqueness
                }
            }

            let placement_id = await getPlacementId("678f9a82a2dac325900fc47e", 3); // 3x matrix
            if (!placement_id) {
                responseData.msg = 'No placement available!';
                return responseHelper.error(res, responseData);
            }


            // Generate a unique sponsor ID for the user
            const sponsorID = await generateSponsorId();

            let submitData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: reqObj ?.userAddress || reqObj ?.email ?.toLowerCase(), // Use email as username if userAddress is not provided
                trace_id: trace_id,
                sponsorID: sponsorID, // Add the generated sponsor ID
                email: reqObj ?.email ?.toLowerCase(), // Store email
                password: reqObj ?.password, // Password will be encrypted by the pre-save hook in the user model
                name: reqObj ?.name, // Store name
                phone_number: reqObj ?.phone_number, // Store phone number
                country: reqObj ?.country // Store country
            };

            // If this is the admin/default user, set refer_id to "admin"
            if (reqObj ?.userAddress === "0x4379df369c1F5e336662aF35ffe549F857A05EcF" || reqObj ?.is_default) {
                submitData.refer_id = "admin";
                submitData.is_default = true;
            }

            let newUser = await userDbHandler.create(submitData);
            log.info('User created in the database collection', newUser);

            // Include the sponsor ID in the response
            responseData.msg = 'Your account has been created successfully!';
            responseData.data = {
                sponsorID: sponsorID // Return the sponsor ID to the user
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get user signup with error::', error);
            responseData.msg = 'Failed to create user';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Enhanced signup method with optional email and mobile verification
     */
    signupWithVerification: async(req, res) => {
        let reqObj = req.body;
        log.info('Received request for User Signup with Verification:', reqObj);
        let responseData = {};

        try {
            // Check if username already exists
            let checkUsername = await userDbHandler.getByQuery({ username: reqObj?.userAddress });

            if (checkUsername.length) {
                responseData.msg = `User already exists!`;
                return responseHelper.error(res, responseData);
            }

            // Check if email already exists (if provided)
            if (reqObj?.email) {
                let checkEmail = await userDbHandler.getByQuery({ email: reqObj.email.toLowerCase() });
                if (checkEmail.length) {
                    responseData.msg = 'Email already exists!';
                    return responseHelper.error(res, responseData);
                }
            }

            // Check if phone number already exists (if provided)
            if (reqObj?.phone_number) {
                let checkPhone = await userDbHandler.getByQuery({ phone_number: reqObj.phone_number });
                if (checkPhone.length) {
                    responseData.msg = 'Phone number already exists!';
                    return responseHelper.error(res, responseData);
                }
            }

            // Handle referral system
            let trace_id = reqObj?.referralId;
            let refer_id = null;

            if (trace_id) {
                // First check if it's a sponsor ID
                if (trace_id.startsWith('NB') || trace_id.startsWith('SI')) {
                    let sponsorUser = await userDbHandler.getOneByQuery({ sponsorID: trace_id }, { _id: 1 });
                    if (sponsorUser) {
                        refer_id = sponsorUser._id;
                    }
                }

                // If not a sponsor ID or sponsor ID not found, check username
                if (!refer_id) {
                    let referUser = await userDbHandler.getOneByQuery({ username: trace_id }, { _id: 1 });
                    if (referUser) {
                        refer_id = referUser._id;
                    }
                }

                // If still not found, check if it's 'admin'
                if (!refer_id && trace_id === 'admin') {
                    const adminUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                    if (adminUser) {
                        refer_id = adminUser._id;
                    }
                }

                // If no valid refer_id found, return error
                if (!refer_id) {
                    responseData.msg = 'Invalid referral ID!';
                    return responseHelper.error(res, responseData);
                }
            }

            // If no referral ID is provided, assign default refer_id and generate a trace_id
            if (!trace_id) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                refer_id = defaultUser ? defaultUser._id : null;
                if (!refer_id) {
                    responseData.msg = 'Default referral setup missing!';
                    return responseHelper.error(res, responseData);
                }

                // Generate a unique trace_id
                trace_id = generateTraceId();
                while (await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 })) {
                    trace_id = generateTraceId(); // Ensure uniqueness
                }
            }

            let placement_id = await getPlacementId("678f9a82a2dac325900fc47e", 3); // 3x matrix
            if (!placement_id) {
                responseData.msg = 'No placement available!';
                return responseHelper.error(res, responseData);
            }

            // Generate a unique sponsor ID for the user
            const sponsorID = await generateSponsorId();

            // Determine verification status based on provided verification flags
            const emailVerified = reqObj?.email_verified === true;
            const phoneVerified = reqObj?.phone_verified === true;

            let submitData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: reqObj?.userAddress || reqObj?.email?.toLowerCase(),
                trace_id: trace_id,
                sponsorID: sponsorID,
                email: reqObj?.email?.toLowerCase(),
                password: reqObj?.password,
                name: reqObj?.name,
                phone_number: reqObj?.phone_number,
                country: reqObj?.country,
                email_verified: emailVerified,
                phone_verified: phoneVerified,
                mobile_otp_verified: phoneVerified
            };

            // If this is the admin/default user, set refer_id to "admin"
            if (reqObj?.userAddress === "0x4379df369c1F5e336662aF35ffe549F857A05EcF" || reqObj?.is_default) {
                submitData.refer_id = "admin";
                submitData.is_default = true;
            }

            let newUser = await userDbHandler.create(submitData);
            log.info('User created in the database collection with verification status:', {
                userId: newUser._id,
                email_verified: emailVerified,
                phone_verified: phoneVerified
            });

            // Create welcome notification
            try {
                const notificationController = require('./notification.controller');
                await notificationController.createWelcomeNotification(newUser._id, submitData);
                log.info('Welcome notification created for user:', newUser._id);
            } catch (notificationError) {
                log.error('Failed to create welcome notification:', notificationError);
                // Don't fail registration if notification creation fails
            }

            // Include the sponsor ID in the response
            responseData.msg = 'Your account has been created successfully!';
            responseData.data = {
                userId: newUser._id,
                sponsorID: sponsorID,
                email_verified: emailVerified,
                phone_verified: phoneVerified
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to get user signup with verification with error::', error);
            responseData.msg = 'Failed to create user';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to handle forgot password by sending OTP to mobile number
     */
    forgotPasswordMobile: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for mobile forgot password with OTP:', reqBody);
        let phoneNumber = reqBody.phone_number;
        let responseData = {};

        try {
            // Validate phone number
            if (!phoneNumber) {
                responseData.msg = 'Phone number is required';
                return responseHelper.error(res, responseData);
            }

            // Normalize phone number
            const normalizedPhone = phoneNumber.trim();

            let query = {
                phone_number: normalizedPhone
            };

            let userData = await userDbHandler.getByQuery(query);
            if (!userData.length) {
                log.error('User phone number does not exist for forgot password request');
                responseData.msg = 'Phone number is not registered with us. Please register yourself!';
                return responseHelper.error(res, responseData);
            }

            if (!userData[0].status) {
                responseData.msg = "Your account is disabled. Please contact admin!";
                return responseHelper.error(res, responseData);
            }

            // Send OTP using OTPless service for mobile
            log.info('Sending mobile forgot password OTP to:', normalizedPhone);

            try {
                const otplessService = require('../../services/otpless.service');
                const otpResult = await otplessService.sendForgotPasswordSMSOTP(normalizedPhone);

                if (otpResult.success) {
                    log.info('Mobile forgot password OTP sent successfully', {
                        phone: normalizedPhone,
                        requestId: otpResult.requestId
                    });

                    responseData.msg = 'OTP sent successfully to your mobile number for password reset';
                    responseData.data = {
                        requestId: otpResult.requestId,
                        phone_number: normalizedPhone,
                        message: 'Please check your mobile for the OTP code'
                    };
                    return responseHelper.success(res, responseData);

                } else if (otpResult.disabled) {
                    log.info('Mobile OTP is disabled by admin settings for forgot password');
                    responseData.msg = 'Mobile OTP is currently disabled. Please use alternative password reset method or contact support.';
                    responseData.data = {
                        phone_number: normalizedPhone,
                        otp_disabled: true
                    };
                    return responseHelper.success(res, responseData);
                } else {
                    log.error('Failed to send mobile forgot password OTP:', otpResult.error);
                    responseData.msg = 'Failed to send OTP. Please try again.';
                    return responseHelper.error(res, responseData);
                }

            } catch (otpError) {
                log.error('Error sending mobile forgot password OTP:', otpError);
                responseData.msg = 'Failed to send OTP. Please try again.';
                return responseHelper.error(res, responseData);
            }
        } catch (error) {
            log.error('Failed to process mobile forgot password request with error:', error);
            responseData.msg = 'Failed to process forgot password request';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to reset password with mobile OTP verification
     */
    resetPasswordWithMobileOTP: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for mobile password reset with OTP:', {
            phone_number: reqBody.phone_number,
            requestId: reqBody.requestId,
            hasOtp: !!reqBody.otp,
            hasPassword: !!reqBody.password
        });

        let responseData = {};

        try {
            const { phone_number, otp, requestId, password, confirm_password } = reqBody;

            // Validate required fields
            if (!phone_number || !otp || !requestId || !password || !confirm_password) {
                responseData.msg = 'All fields are required: phone_number, otp, requestId, password, confirm_password';
                return responseHelper.error(res, responseData);
            }

            // Validate password match
            if (password !== confirm_password) {
                responseData.msg = 'Password and confirm password do not match';
                return responseHelper.error(res, responseData);
            }

            // Normalize phone number
            const normalizedPhone = phone_number.trim();

            // Find user by phone number
            let userData = await userDbHandler.getByQuery({ phone_number: normalizedPhone });
            if (!userData.length) {
                responseData.msg = 'Phone number not found';
                return responseHelper.error(res, responseData);
            }

            const user = userData[0];

            // Verify mobile OTP
            log.info('Verifying mobile OTP for password reset:', {
                phone: normalizedPhone,
                requestId,
                otpLength: otp.length
            });

            try {
                const otplessService = require('../../services/otpless.service');
                const verificationResult = await otplessService.verifyForgotPasswordSMSOTP(otp, requestId);

                if (!verificationResult.success || !verificationResult.isVerified) {
                    log.error('Mobile OTP verification failed for password reset:', verificationResult.error);
                    responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                    return responseHelper.error(res, responseData);
                }

                log.info('Mobile OTP verified successfully for password reset');

                // Check if new password is different from current password
                let comparePassword = await _comparePassword(password, user.password);
                if (comparePassword) {
                    responseData.msg = 'New password cannot be the same as your current password';
                    return responseHelper.error(res, responseData);
                }

                // Encrypt new password
                let encryptedPassword = await _encryptPassword(password);

                // Update user password
                const updateData = {
                    password: encryptedPassword
                };

                await userDbHandler.updateById(user._id, updateData);
                log.info('Password updated successfully for user:', user._id);

                responseData.msg = 'Password reset successful! You can now login with your new password.';
                responseData.data = {
                    userId: user._id,
                    phone_number: normalizedPhone,
                    message: 'Password has been reset successfully'
                };
                return responseHelper.success(res, responseData);

            } catch (otpError) {
                log.error('Error verifying mobile OTP for password reset:', otpError);
                responseData.msg = 'Failed to verify OTP. Please try again.';
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to reset password with mobile OTP:', error);
            responseData.msg = 'Failed to reset password. Please try again.';
            return responseHelper.error(res, responseData);
        }
    },
    // signup: async (req, res) => {
    //     let reqObj = req.body;
    //     log.info('Received request for User Signup:', reqObj);
    //     let responseData = {};

    //     try {
    //         let query = {};
    //         if (config.loginByType == 'email') {
    //             query.username = reqObj?.email.toLowerCase();
    //         } else if (config.loginByType == 'address') {
    //             query.username = reqObj?.address.toLowerCase();
    //         } else {
    //             query.username = reqObj?.username;
    //         }

    //         let trace_id = reqObj?.refer_id;
    //         let refer_id = null;

    //         // If a valid referral ID is provided, find the referring user
    //         if (trace_id && /^[A-Z0-9]{8}$/.test(trace_id)) {
    //             let referUser = await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 });
    //             if (referUser) {
    //                 refer_id = referUser._id;
    //             } else {
    //                 responseData.msg = 'Invalid referral ID!';
    //                 return responseHelper.error(res, responseData);
    //             }
    //         }

    //         // If no referral ID is provided, assign default refer_id and generate a trace_id
    //         if (!trace_id) {
    //             const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
    //             refer_id = defaultUser ? defaultUser._id : null;
    //             if (!refer_id) {
    //                 responseData.msg = 'Default referral setup missing!';
    //                 return responseHelper.error(res, responseData);
    //             }

    //             // Generate a unique trace_id
    //             trace_id = generateTraceId();
    //             while (await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 })) {
    //                 trace_id = generateTraceId(); // Ensure uniqueness
    //             }
    //         }

    //         let placement_id = reqObj?.placement_id ? reqObj?.placement_id : refer_id;

    //         // Check if username, email, or phone number already exists
    //         let checkUsername = await userDbHandler.getByQuery(query);
    //         let checkEmail = await userDbHandler.getByQuery({ email: reqObj?.email });
    //         let checkPhoneNumber = await userDbHandler.getByQuery({ phone_number: reqObj?.phone_number });

    //         if (checkUsername.length) {
    //             responseData.msg = `${config.loginByName} already exists!`;
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (reqObj?.email && config.loginByType != 'address' && checkEmail.length >= config.emailCheck) {
    //             responseData.msg = 'Email already exists!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (reqObj?.phone_number && config.loginByType != 'address' && checkPhoneNumber.length >= config.phoneCheck) {
    //             responseData.msg = 'Phone number already exists!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         let submitData = {
    //             refer_id: refer_id,
    //             placement_id: placement_id,
    //             username: query.username,
    //             email: reqObj?.email?.toLowerCase(),
    //             address: reqObj?.address?.toLowerCase(),
    //             password: reqObj?.password,
    //             name: reqObj?.name,
    //             phone_number: reqObj?.phone_number,
    //             trace_id: trace_id // Assigning the generated trace_id
    //         };

    //         let newUser = await userDbHandler.create(submitData);
    //         log.info('User created in the database collection', newUser);

    //         // Send registration email
    //         let emailBody = {
    //             recipientsAddress: newUser.email,
    //             subject: `${config.brandName} Account Registration Credentials`,
    //             body: `
    //                 <p>Dear ${newUser.name || newUser.username},</p>
    //                 <p>Your account has been created successfully! Below are your registration details:</p>
    //                 <p><strong>Username:</strong> ${newUser.username}</p>
    //                 <p><strong>Password:</strong> ${reqObj?.password}</p>
    //                 <p><strong>Your Referral Code (trace_id):</strong> ${trace_id}</p>
    //                 <p>Please keep these credentials secure. If you did not register, please contact support immediately.</p>
    //                 <p>Thank you for joining ${config.brandName}!</p>
    //             `
    //         };

    //         let emailInfo = await emailService.sendEmail(emailBody);
    //         if (emailInfo) {
    //             log.info('Registration email sent successfully', emailInfo);
    //             responseData.msg = 'Your account has been created successfully! Your registration credentials have been sent to your email.';
    //             return responseHelper.success(res, responseData);
    //         } else {
    //             responseData.msg = 'Failed to send registration email.';
    //             return responseHelper.error(res, responseData);
    //         }
    //     } catch (error) {
    //         log.error('Failed to get user signup with error::', error);
    //         responseData.msg = 'Failed to create user';
    //         return responseHelper.error(res, responseData);
    //     }
    // },

    // signup: async (req, res) => {
    //     let reqObj = req.body;
    //     log.info('Recieved request for User Signup:', reqObj);
    //     let responseData = {};

    //     console.log(reqObj);
    //     try {
    //         let query = {};
    //         if (config.loginByType == 'email') {
    //             query.username = reqObj?.email.toLowerCase();
    //         }
    //         else if (config.loginByType == 'address') {
    //             query.username = reqObj?.address.toLowerCase();
    //         }

    //         else {
    //             query.username = reqObj?.username;
    //         }
    //         let refer_id = reqObj?.refer_id;
    //         let position = reqObj?.position;
    //         if (!refer_id) {
    //             const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
    //             refer_id = defaultUser._id;
    //         }

    //         let placement_id = reqObj?.placement_id ? reqObj?.placement_id : refer_id;

    //         let checkUsername = await userDbHandler.getByQuery(query);

    //         let checkEmail = await userDbHandler.getByQuery({ email: reqObj?.email });
    //         let checkPhoneNumber = await userDbHandler.getByQuery({ phone_number: reqObj?.phone_number });
    //         let referUser = await userDbHandler.getById(refer_id);


    //         if (checkUsername.length) {
    //             responseData.msg = `${config.loginByName} already exist!`;
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (reqObj?.email && config.loginByType != 'address' && checkEmail.length >= config.emailCheck) {
    //             responseData.msg = 'Email already exist!';
    //             return responseHelper.error(res, responseData);
    //         }
    //         if (reqObj?.phone_number && config.loginByType != 'address' && checkPhoneNumber.length >= config.phoneCheck) {
    //             responseData.msg = 'Phone number already exist!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         if (!referUser) {
    //             responseData.msg = 'Invailid refer ID!';
    //             return responseHelper.error(res, responseData);
    //         }

    //         let submitData = {
    //             refer_id: refer_id,
    //             placement_id: placement_id,
    //             username: query.username,
    //             email: reqObj?.email?.toLowerCase(),
    //             address: reqObj?.address?.toLowerCase(),
    //             password: reqObj?.password,

    //             name: reqObj?.name,
    //             phone_number: reqObj?.phone_number
    //         }

    //         let newUser = await userDbHandler.create(submitData);
    //         log.info('User created in the database collection', newUser);

    //         if (process.env.EMAIL_VERIFICATION === '1' && config.loginByType != 'address' && config.loginByType != 'username') {
    //             // //patch token data obj
    //             // let tokenData = {
    //             //     email: newUser.email,
    //             //     name: newUser.name,
    //             //     username: newUser.username,
    //             // };

    //             // let verificationType = 'email';
    //             // //generate email verification token
    //             // let emailVerificationToken = _generateVerificationToken(tokenData, verificationType);
    //             // //send verification email after user successfully created
    //             // //patch email verification templateBody
    //             // let templateBody = {
    //             //     type: verificationType,
    //             //     token: emailVerificationToken,
    //             //     name: newUser.username,

    //             // };
    //             // let emailBody = {
    //             //     recipientsAddress: newUser.email,
    //             //     subject: `${config.brandName} Account Registration Credentials `,
    //             //     body: templates.emailVerification(templateBody)
    //             // };
    //             // let emailInfo = await emailService.sendEmail(emailBody);
    //             // if (emailInfo) {
    //             //     log.info('email verification mail sent successfully', emailInfo);
    //             //     let emailObj = {
    //             //         token: emailVerificationToken,
    //             //         user_id: newUser._id,
    //             //         verification_type: verificationType
    //             //     };
    //             //     let newEmailVerification = await verificationDbHandler.create(emailObj);
    //             //     log.info('new email verification entry created successfully in the database', newEmailVerification);
    //             //     responseData.msg = 'Your account has been created successfully! Please verify your email. Verification link has been sent on your registered email Id';
    //             //     return responseHelper.success(res, responseData);
    //             // }
    //             let emailBody = {
    //                 recipientsAddress: newUser.email,
    //                 subject: `${config.brandName} Account Registration Credentials`,
    //                 body: `
    //                     <p>Dear ${newUser.name || newUser.username},</p>
    //                     <p>Your account has been created successfully! Below are your registration details:</p>
    //                     <p><strong>Username:</strong> ${newUser.username}</p>
    //                     <p><strong>Password:</strong> ${reqObj?.password}</p>
    //                     <p>Please keep these credentials secure. If you did not register, please contact support immediately.</p>
    //                     <p>Thank you for joining ${config.brandName}!</p>
    //                 `
    //             };

    //             let emailInfo = await emailService.sendEmail(emailBody);
    //             if (emailInfo) {
    //                 log.info('Registration email sent successfully', emailInfo);
    //                 responseData.msg = 'Your account has been created successfully! Your registration credentials have been sent to your email.';
    //                 return responseHelper.success(res, responseData);
    //             } else {
    //                 responseData.msg = 'Failed to send registration email.';
    //                 return responseHelper.error(res, responseData);
    //             }
    //         }
    //         else {
    //             responseData.msg = "Your account has been created successfully!";
    //             return responseHelper.success(res, responseData);
    //         }
    //     } catch (error) {
    //         log.error('failed to get user signup with error::', error);
    //         responseData.msg = 'Failed to create user';
    //         return responseHelper.error(res, responseData);
    //     }
    // },
    signupLR: async(req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for User Signup:', reqObj);
        let responseData = {};
        console.log(reqObj);
        try {
            let query = {};
            if (config.loginByType == 'email') {
                query.username = reqObj ?.email.toLowerCase();
            } else if (config.loginByType == 'address') {
                query.username = reqObj ?.address.toLowerCase();
            } else {
                query.username = reqObj ?.username;
            }
            let refer_id = reqObj ?.refer_id;
            let position = reqObj ?.position;
            if (!refer_id) {
                const defaultUser = await userDbHandler.getOneByQuery({ is_default: true }, { _id: 1 });
                refer_id = defaultUser._id;
            }

            let placement_id = reqObj ?.placement_id ? reqObj ?.placement_id : refer_id;

            if (position) {
                placement_id = await getTerminalId(refer_id, position);
            } else if (1) {
                placement_id = await getPlacementId(refer_id, 2);
            }


            let checkUsername = await userDbHandler.getByQuery(query);
            let checkEmail = await userDbHandler.getByQuery({ email: reqObj ?.email });
            let checkPhoneNumber = await userDbHandler.getByQuery({ phone_number: reqObj ?.phone_number });
            let referUser = await userDbHandler.getById(refer_id);

            /* NOT REQUIRED
            let checkIfExists = await userDbHandler.getByQuery({
                $or: [{
                    username: query.username
                }, {
                    email: query.username
                }, {
                    address: query.username
                }]
            })
            if (checkIfExists.length) {
                responseData.msg = `${config.loginByName} already exist!`;
                return responseHelper.error(res, responseData);
            }
            */

            if (checkUsername.length) {
                responseData.msg = `${config.loginByName} already exist!`;
                return responseHelper.error(res, responseData);
            }
            if (reqObj ?.email && config.loginByType != 'address' && checkEmail.length >= config.emailCheck) {
                responseData.msg = 'Email already exist!';
                return responseHelper.error(res, responseData);
            }
            if (reqObj ?.phone_number && config.loginByType != 'address' && checkPhoneNumber.length >= config.phoneCheck) {
                responseData.msg = 'Phone number already exist!';
                return responseHelper.error(res, responseData);
            }
            if (!referUser) {
                responseData.msg = 'Invailid refer ID!';
                return responseHelper.error(res, responseData);
            }

            let submitData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: query.username,
                email: reqObj ?.email ?.toLowerCase(),
                address: reqObj ?.address ?.toLowerCase(),
                password: reqObj ?.password,
                name: reqObj ?.name,

                phone_number: reqObj ?.phone_number
            }

            if (position) {
                submitData['position'] = position
            }

            let newUser = await userDbHandler.create(submitData);
            log.info('User created in the database collection', newUser);

            if (process.env.EMAIL_VERIFICATION === '1' && config.loginByType != 'address' && config.loginByType != 'username') {
                //patch token data obj
                let tokenData = {
                    email: newUser.email,
                    name: newUser.name,
                    username: newUser.username
                };

                let verificationType = 'email';
                //generate email verification token
                let emailVerificationToken = _generateVerificationToken(tokenData, verificationType);
                //send verification email after user successfully created
                //patch email verification templateBody
                let templateBody = {
                    type: verificationType,
                    token: emailVerificationToken,
                    name: newUser.username
                };
                let emailBody = {
                    recipientsAddress: newUser.email,
                    subject: `${config.brandName} Account Verification Link`,
                    body: templates.emailVerification(templateBody)
                };
                let emailInfo = await emailService.sendEmail(emailBody);
                if (emailInfo) {
                    log.info('email verification mail sent successfully', emailInfo);
                    let emailObj = {
                        token: emailVerificationToken,
                        user_id: newUser._id,
                        verification_type: verificationType
                    };
                    let newEmailVerification = await verificationDbHandler.create(emailObj);
                    log.info('new email verification entry created successfully in the database', newEmailVerification);
                    responseData.msg = 'Your account has been created successfully! Please verify your email. Verification link has been sent on your registered email Id';
                    return responseHelper.success(res, responseData);
                }
            } else {
                responseData.msg = "Your account has been created successfully!";
                return responseHelper.success(res, responseData);
            }
        } catch (error) {
            log.error('failed to get user signup with error::', error);
            responseData.msg = 'Failed to create user';
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle forgot password by sending OTP to email (no email links)
     */
    forgotPassword: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for forgot password with OTP:', reqBody);
        let userEmail = reqBody.email;
        let responseData = {};

        try {
            // Validate email
            if (!userEmail || !userEmail.includes('@')) {
                responseData.msg = 'Valid email is required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email
            const normalizedEmail = userEmail.toLowerCase().trim();

            let query = {
                email: normalizedEmail
            };

            let userData = await userDbHandler.getByQuery(query);
            if (!userData.length) {
                log.error('User email does not exist for forgot password request');
                responseData.msg = 'User is not registered with us. Please register yourself!';
                return responseHelper.error(res, responseData);
            }

            if (!userData[0].status) {
                responseData.msg = "Your account is disabled. Please contact admin!";
                return responseHelper.error(res, responseData);
            }

            // Send OTP using OTPless service (no email links)
            log.info('Sending forgot password OTP to:', normalizedEmail);

            try {
                const otplessService = require('../../services/otpless.service');
                const otpResult = await otplessService.sendForgotPasswordOTP(normalizedEmail);

                if (otpResult.success) {
                    log.info('Forgot password OTP sent successfully', {
                        email: normalizedEmail,
                        requestId: otpResult.requestId
                    });

                    responseData.msg = 'OTP sent successfully to your email for password reset';
                    responseData.data = {
                        otp_request_id: otpResult.requestId,
                        email: normalizedEmail,
                        message: 'Please check your email for the OTP code'
                    };
                    return responseHelper.success(res, responseData);

                } else if (otpResult.disabled) {
                    log.info('Email OTP is disabled by admin settings for forgot password');
                    responseData.msg = 'Email OTP is currently disabled. Please use alternative password reset method or contact support.';
                    responseData.data = {
                        email: normalizedEmail,
                        otp_disabled: true
                    };
                    return responseHelper.success(res, responseData);
                } else {
                    log.error('Failed to send forgot password OTP:', otpResult.error);
                    responseData.msg = 'Failed to send OTP. Please try again.';
                    return responseHelper.error(res, responseData);
                }

            } catch (otpError) {
                log.error('Error sending forgot password OTP:', otpError);
                responseData.msg = 'Failed to send OTP. Please try again.';
                return responseHelper.error(res, responseData);
            }
        } catch (error) {
            log.error('Failed to process forgot password request with error:', error);
            responseData.msg = 'Failed to process forgot password request';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to verify forgot password OTP (without resetting password)
     */
    verifyForgotPasswordOTP: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for forgot password OTP verification:', reqBody);
        let responseData = {};

        try {
            const { otp, otp_request_id } = reqBody;

            // Validate required fields
            if (!otp || !otp_request_id) {
                responseData.msg = 'OTP and otp_request_id are required';
                return responseHelper.error(res, responseData);
            }

            // Verify OTP using OTPless service
            const otplessService = require('../../services/otpless.service');
            const verificationResult = await otplessService.verifyForgotPasswordOTP(otp, otp_request_id);

            if (verificationResult.success && verificationResult.isVerified) {
                log.info('Forgot password OTP verified successfully');
                responseData.msg = 'OTP verified successfully';
                responseData.data = {
                    verified: true,
                    otp_request_id: otp_request_id
                };
                return responseHelper.success(res, responseData);
            } else {
                log.error('Forgot password OTP verification failed:', verificationResult.error);
                responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to verify forgot password OTP:', error);
            responseData.msg = 'Failed to verify OTP';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to verify forgot password mobile OTP (without resetting password)
     */
    verifyForgotPasswordMobileOTP: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for forgot password mobile OTP verification:', reqBody);
        let responseData = {};

        try {
            const { otp, requestId } = reqBody;

            // Validate required fields
            if (!otp || !requestId) {
                responseData.msg = 'OTP and requestId are required';
                return responseHelper.error(res, responseData);
            }

            // Verify mobile OTP using OTPless service
            const otplessService = require('../../services/otpless.service');
            const verificationResult = await otplessService.verifyForgotPasswordSMSOTP(otp, requestId);

            if (verificationResult.success && verificationResult.isVerified) {
                log.info('Forgot password mobile OTP verified successfully');
                responseData.msg = 'Mobile OTP verified successfully';
                responseData.data = {
                    verified: true,
                    requestId: requestId
                };
                return responseHelper.success(res, responseData);
            } else {
                log.error('Forgot password mobile OTP verification failed:', verificationResult.error);
                responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to verify forgot password mobile OTP:', error);
            responseData.msg = 'Failed to verify mobile OTP';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to reset password with already verified OTP (email)
     */
    resetPasswordWithVerifiedOTP: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for password reset with verified OTP:', { email: reqBody.email });
        let responseData = {};

        try {
            const { email, otp_request_id, new_password } = reqBody;

            // Validate required fields
            if (!email || !otp_request_id || !new_password) {
                responseData.msg = 'Email, otp_request_id, and new_password are required';
                return responseHelper.error(res, responseData);
            }

            // Find user by email
            const user = await userDbHandler.findByQuery({ email: email.toLowerCase() });
            if (!user) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            log.info('User found for password reset:', user._id);

            // Check if new password is different from current password
            let comparePassword = await _comparePassword(new_password, user.password);
            if (comparePassword) {
                responseData.msg = 'New password cannot be the same as your current password';
                return responseHelper.error(res, responseData);
            }

            // Encrypt new password
            let encryptedPassword = await _encryptPassword(new_password);

            // Update user password (OTP already verified)
            await userDbHandler.updateById(user._id, { password: encryptedPassword });
            log.info('Password updated successfully for user:', user._id);

            responseData.msg = 'Password reset successfully';
            responseData.data = { success: true };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to reset password with verified OTP:', error);
            responseData.msg = 'Failed to reset password';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to reset password with already verified mobile OTP
     */
    resetPasswordWithVerifiedMobileOTP: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for password reset with verified mobile OTP:', { phone_number: reqBody.phone_number });
        let responseData = {};

        try {
            const { phone_number, requestId, password, confirm_password } = reqBody;

            // Validate required fields
            if (!phone_number || !requestId || !password || !confirm_password) {
                responseData.msg = 'Phone number, requestId, password, and confirm_password are required';
                return responseHelper.error(res, responseData);
            }

            // Check if passwords match
            if (password !== confirm_password) {
                responseData.msg = 'Passwords do not match';
                return responseHelper.error(res, responseData);
            }

            // Find user by phone number
            const user = await userDbHandler.findByQuery({ phone_number });
            if (!user) {
                responseData.msg = 'User not found with this phone number';
                return responseHelper.error(res, responseData);
            }

            log.info('User found for mobile password reset:', user._id);

            // Check if new password is different from current password
            let comparePassword = await _comparePassword(password, user.password);
            if (comparePassword) {
                responseData.msg = 'New password cannot be the same as your current password';
                return responseHelper.error(res, responseData);
            }

            // Encrypt new password
            let encryptedPassword = await _encryptPassword(password);

            // Update user password (OTP already verified)
            await userDbHandler.updateById(user._id, { password: encryptedPassword });
            log.info('Password updated successfully for user:', user._id);

            responseData.msg = 'Password reset successfully';
            responseData.data = { success: true };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to reset password with verified mobile OTP:', error);
            responseData.msg = 'Failed to reset password';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Method to reset password with OTP verification
     */
    resetPasswordWithOTP: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for password reset with OTP:', reqBody);
        let responseData = {};

        try {
            const { email, otp, otp_request_id, new_password } = reqBody;

            // Validate required fields
            if (!email || !otp || !otp_request_id || !new_password) {
                responseData.msg = 'Email, OTP, otp_request_id, and new_password are required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();

            // Get user details
            let userData = await userDbHandler.getByQuery({ email: normalizedEmail });
            if (!userData.length) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Verify OTP using OTPless service
            const otplessService = require('../../services/otpless.service');
            const verificationResult = await otplessService.verifyOTP(otp, otp_request_id);

            if (!verificationResult.success || !verificationResult.isVerified) {
                log.error('OTP verification failed for password reset:', verificationResult.error);
                responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                return responseHelper.error(res, responseData);
            }

            log.info('Password reset OTP verified successfully for user:', userData[0].username);

            // Check if new password is different from current password
            let comparePassword = await _comparePassword(new_password, userData[0].password);
            if (comparePassword) {
                responseData.msg = 'New password cannot be the same as your current password';
                return responseHelper.error(res, responseData);
            }

            // Encrypt new password
            let encryptedPassword = await _encryptPassword(new_password);

            // Update user password
            let updateUserQuery = {
                password: encryptedPassword
            };

            let updatedUser = await userDbHandler.updateById(userData[0]._id, updateUserQuery);
            if (!updatedUser) {
                log.error('Failed to reset user password');
                responseData.msg = 'Failed to reset password';
                return responseHelper.error(res, responseData);
            }

            log.info('Password reset successfully for user:', userData[0].username);

            responseData.msg = 'Password updated successfully! Please login with your new password.';
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to reset password with OTP:', error);
            responseData.msg = 'Failed to reset password';
            return responseHelper.error(res, responseData);
        }
    },
    resetPassword: async(req, res) => {
        let reqBody = req.body;
        let resetPasswordToken = reqBody.token;
        log.info('Recieved request for password reset====>:', resetPasswordToken, reqBody);
        let newPassword = reqBody.password;
        let responseData = {};
        try {
            let query = {
                token: resetPasswordToken,
                verification_type: 'password'
            };
            let passwordTokenInfo = await verificationDbHandler.getByQuery(query);
            if (!passwordTokenInfo.length) {
                log.error('Invalid password reset token:', resetPasswordToken);
                responseData.msg = 'Invalid Password reset request or token expired';
                return responseHelper.error(res, responseData);
            }
            log.info("tokenInfo", passwordTokenInfo);
            let userId = passwordTokenInfo[0].user_id;
            let userDetail = await userDbHandler.getById(userId);
            let comparePassword = await _comparePassword(newPassword, userDetail.password);
            console.log("compare_password===>", comparePassword);
            if (comparePassword) {
                log.error('Use old password:', newPassword);
                responseData.msg = 'New password can not be same as old password';
                return responseHelper.error(res, responseData);
            }

            let encryptedPassword = await _encryptPassword(newPassword);
            let updateUserQuery = {
                password: encryptedPassword
            };
            let updatedUser = await userDbHandler.updateById(userId, updateUserQuery);
            if (!updatedUser) {
                log.error('failed to reset user password', updatedUser);
                responseData.msg = 'Failed to reset password';
                return responseHelper.error(res, responseData);
            }
            //delete the password token from db;
            let removedTokenInfo = await _handleVerificationDataUpdate(passwordTokenInfo[0]._id);
            log.info('password verification token has been removed::', removedTokenInfo);
            responseData.msg = 'Password updated successfully! Please Login to continue';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to reset password with error::', error);
            responseData.msg = 'Failed to reset password';
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle email token verification
     */
    verifyEmail: async(req, res) => {
        let emailToken = req.emailToken;
        log.info('Received request for email verification ::', emailToken);
        let responseData = {};
        try {
            let query = {
                token: emailToken,
                verification_type: 'email'
            };
            let emailInfo = await verificationDbHandler.getByQuery(query);
            if (!emailInfo.length) {
                responseData.msg = 'Invalid email verification request or token expired';
                return responseHelper.error(res, responseData);
            }
            //update user email verification status
            let userId = emailInfo[0].user_id;
            let updateObj = {
                email_verified: true
            };
            let updatedUser = await userDbHandler.updateById(userId, updateObj);
            if (!updatedUser) {
                log.info('failed to verify user email');
                responseData.msg = 'Failed to verify email';
                return responseHelper.error(res, responseData);
            }
            log.info('user email verification status updated successfully', updatedUser);
            let removedTokenInfo = await _handleVerificationDataUpdate(emailInfo[0]._id);
            log.info('email verification token has been removed::', removedTokenInfo);
            responseData.msg = 'Your email has been successfully verified! Please login to continue';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to process email verification::', error);
            responseData.msg = 'Failed to verify user email';
            return responseHelper.error(res, responseData);
        }
    },
    /**
     * Method to handle resend email verification link
     */
    resendEmailVerification: async(req, res) => {
        let reqBody = req.body;
        log.info('Received request for handling resend email verification link:', reqBody);
        let responseData = {};
        let userEmail = reqBody.email;
        try {
            let query = {
                email: userEmail
            };
            //check if user email is present in the database, then onlyy process the request
            let userData = await userDbHandler.getByQuery(query);
            //if no user found, return error
            if (!userData.length) {
                responseData.msg = 'Invalid Email Id';
                return responseHelper.error(res, responseData);
            }
            let verificationType = 'email';
            let emailQuery = {
                user_id: userData[0]._id,
                verification_type: verificationType
            };
            let emailTokenInfo = await verificationDbHandler.getByQuery(emailQuery);
            if (!emailTokenInfo.length) {
                log.error('Pre saved email token info not found!');
                responseData.msg = 'Invalid request';
                return responseHelper.error(res, responseData);
            }
            //Allow maximum of 2 resend attempts only
            if (emailTokenInfo[0].attempts >= 2) {
                log.error('maximum resend email attempts');
                //responseData.msg = 'Maximum resend attempts';
                responseData.msg = 'You have exceeded the maximum number of attempts. Please try again after 24 hours.';
                return responseHelper.error(res, responseData);
            }

            let password = generateRandomPassword(8);
            let updatedObj = {
                password: await _encryptPassword(password)
            }
            await userDbHandler.updateById(userData[0]._id, updatedObj);

            let tokenData = {
                email: userData[0].email,
            };
            //generate new email verification token
            let newEmailVerificationToken = _generateVerificationToken(tokenData, verificationType);
            //send verification email after user successfully created
            //patch email verification templateBody
            let templateBody = {
                type: verificationType,
                token: newEmailVerificationToken,
                name: userData[0].username,
                password: password
            };
            let emailBody = {
                recipientsAddress: userData[0].email,
                subject: 'Resend: A link to verify your email',
                body: templates.emailVerificationUser(templateBody)
            };
            let emailInfo = await emailService.sendEmail(emailBody);
            if (!emailInfo) {
                log.error('failed to resend email verification mail');
                responseData.msg = 'Failed to send email verification email';
                return responseHelper.error(res, responseData);
            }
            log.info('new email verification mail sent successfully', emailInfo);
            let updateEmailVerificationObj = {
                token: newEmailVerificationToken,
                attempts: emailTokenInfo[0].attempts + 1
            };
            let updateQuery = {
                _id: emailTokenInfo[0]._id
            };
            let option = {
                upsert: false
            };
            let updatedEmailVerification = await verificationDbHandler.updateByQuery(updateQuery, updateEmailVerificationObj, option);
            if (!updatedEmailVerification) {
                log.info('failed to update email verification updated successfully in the database', updatedEmailVerification);
            }
            log.info('email verification updated successfully in the database', updatedEmailVerification);
            //update response data
            responseData.msg = 'Email verification link has been sent successfully';
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to resend email verification link with error::', error);
            responseData.msg = 'Failed to resend verification link';
            return responseHelper.error(res, responseData);
        }
    },

    // Get OTP settings (public endpoint)
    getOTPSettings: async (req, res) => {
        let responseData = {};
        try {
            log.info('Getting OTP settings from public endpoint');
            const otpSettingsService = require('../../services/otp-settings.service');

            log.info('Checking email OTP status');
            const emailOtpEnabled = await otpSettingsService.isEmailOTPEnabled();
            log.info('Email OTP enabled:', emailOtpEnabled);

            log.info('Checking mobile OTP status');
            const mobileOtpEnabled = await otpSettingsService.isMobileOTPEnabled();
            log.info('Mobile OTP enabled:', mobileOtpEnabled);

            responseData.msg = "OTP settings retrieved successfully";
            responseData.data = {
                email_otp_enabled: emailOtpEnabled,
                mobile_otp_enabled: mobileOtpEnabled
            };
            log.info('Returning OTP settings:', responseData.data);
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to get OTP settings with error:', error);
            responseData.msg = "Failed to get OTP settings: " + error.message;
            return responseHelper.error(res, responseData);
        }
    }
};