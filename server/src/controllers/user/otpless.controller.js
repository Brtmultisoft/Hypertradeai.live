'use strict';
const logger = require('../../services/logger');
const log = new logger('OTPlessController').getChildLogger();
const { userDbHandler } = require('../../services/db');
const otplessService = require('../../services/otpless.service');
const responseHelper = require('../../utils/customResponse');
const jwtService = require('../../services/jwt');
const passwordService = require('../../services/password.service');

/**
 * OTPless Controller for handling OTPless authentication
 */
const otplessController = {
    /**
     * Send OTP for registration
     */
    sendRegistrationOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for registration OTP:', { email: reqObj.email });
        let responseData = {};

        try {
            const { email } = reqObj;

            // Validate email
            if (!email || !email.includes('@')) {
                responseData.msg = 'Valid email is required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();

            // Check if user already exists
            const existingUser = await userDbHandler.getByQuery({ email: normalizedEmail });
            if (existingUser && existingUser.length > 0) {
                responseData.msg = 'Email already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            log.info('Sending registration OTP to:', normalizedEmail);

            // Send OTP
            const otpResult = await otplessService.sendRegistrationOTP(normalizedEmail);

            log.info('OTP service result:', otpResult);

            if (otpResult.success) {
                responseData.msg = 'OTP sent successfully to your email';
                responseData.data = {
                    requestId: otpResult.requestId,
                    email: normalizedEmail
                };
                log.info('Registration OTP sent successfully:', { email: normalizedEmail, requestId: otpResult.requestId });
                return responseHelper.success(res, responseData);
            } else {
                log.error('OTP service failed:', {
                    error: otpResult.error,
                    details: otpResult.details,
                    statusCode: otpResult.statusCode,
                    email: normalizedEmail
                });
                responseData.msg = otpResult.error || 'Failed to send OTP';
                responseData.details = otpResult.details;
                responseData.statusCode = otpResult.statusCode;
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to send registration OTP:', error);
            responseData.msg = 'Failed to send OTP. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Verify registration OTP and create user
     */
    verifyRegistrationOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for registration OTP verification:', {
            email: reqObj.email,
            requestId: reqObj.requestId,
            hasUserData: !!reqObj.userData
        });
        let responseData = {};

        try {
            const { email, otp, requestId, userData } = reqObj;

            // Validate required fields
            if (!email || !otp || !requestId || !userData) {
                responseData.msg = 'Email, OTP, requestId, and user data are required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();

            log.info('Verifying registration OTP:', {
                email: normalizedEmail,
                requestId,
                otpLength: otp.length
            });

            // Verify OTP
            const verificationResult = await otplessService.verifyRegistrationOTP(otp, requestId);

            log.info('OTP verification result:', verificationResult);

            if (!verificationResult.success || !verificationResult.isVerified) {
                responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                return responseHelper.error(res, responseData);
            }

            // Check if user already exists (double check)
            const existingUser = await userDbHandler.getByQuery({ email: normalizedEmail });
            if (existingUser && existingUser.length > 0) {
                responseData.msg = 'Email already registered';
                return responseHelper.error(res, responseData);
            }

            // Handle referral system properly (matching existing auth controller logic)
            let trace_id = userData.referrer || userData.referralId;
            let refer_id = null;

            // If a valid referral ID is provided, find the referring user
            if (trace_id) {
                // First check if it's a sponsor ID
                if (trace_id.startsWith('HS') || trace_id.startsWith('SI')) {
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

                // If no valid refer_id found, return error (matching existing logic)
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

                // Generate a unique trace_id (matching existing logic)
                const generateTraceId = () => {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    let traceId = 'ROB';
                    for (let i = 0; i < 5; i++) {
                        traceId += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    return traceId;
                };

                trace_id = generateTraceId();
                while (await userDbHandler.getOneByQuery({ trace_id: trace_id }, { _id: 1 })) {
                    trace_id = generateTraceId(); // Ensure uniqueness
                }
            }

            // Get placement ID using the hardcoded admin ID (matching existing logic)
            const { getPlacementId } = require('../../services/commonFun');
            let placement_id = await getPlacementId("678f9a82a2dac325900fc47e", 3); // 3x matrix
            if (!placement_id) {
                responseData.msg = 'No placement available!';
                return responseHelper.error(res, responseData);
            }

            // Generate a unique sponsor ID (matching existing logic)
            const generateSponsorId = async () => {
                const prefix = 'HS';
                let isUnique = false;
                let sponsorId = '';

                while (!isUnique) {
                    const randomNum = Math.floor(10000 + Math.random() * 90000);
                    sponsorId = `${prefix}${randomNum}`;
                    const existingUser = await userDbHandler.getOneByQuery({ sponsorID: sponsorId });
                    if (!existingUser) {
                        isUnique = true;
                    }
                }
                return sponsorId;
            };

            const sponsorID = await generateSponsorId();

            // Create user with OTPless verification and proper referral data (matching existing structure)
            const newUserData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: userData.username || normalizedEmail, // Use email as username if not provided
                trace_id: trace_id,
                sponsorID: sponsorID, // Add the generated sponsor ID
                email: normalizedEmail, // Store email
                password: userData.password, // Pass plain password, let pre-save hook hash it
                name: userData.name, // Store name
                phone_number: userData.phone_number || userData.phone, // Store phone number
                country: userData.country, // Store country
                email_verified: true,
                otpless_enabled: true,
                otpless_verified: true,
                two_fa_method: 'otpless'
            };

            log.info('Creating new user with data:', {
                email: newUserData.email,
                username: newUserData.username,
                sponsorID: newUserData.sponsorID,
                trace_id: newUserData.trace_id
            });

            const newUser = await userDbHandler.create(newUserData);
            log.info('User created successfully with OTPless verification:', newUser._id);

            // Create welcome notification
            try {
                const notificationController = require('./notification.controller');
                await notificationController.createWelcomeNotification(newUser._id, newUserData);
                log.info('Welcome notification created for user:', newUser._id);
            } catch (notificationError) {
                log.error('Failed to create welcome notification:', notificationError);
                // Don't fail registration if notification creation fails
            }

            responseData.msg = 'Registration completed successfully';
            responseData.data = {
                userId: newUser._id,
                email: newUser.email,
                username: newUser.username,
                sponsorID: newUser.sponsorID
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify registration OTP:', error);
            responseData.msg = 'Failed to verify OTP. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Send OTP for login
     */
    sendLoginOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for login OTP:', { email: reqObj.email });
        let responseData = {};

        try {
            const { email } = reqObj;

            // Validate email
            if (!email || !email.includes('@')) {
                responseData.msg = 'Valid email is required';
                return responseHelper.error(res, responseData);
            }

            // Check if user exists
            const user = await userDbHandler.getByQuery({ email: email.toLowerCase() });
            if (!user || user.length === 0) {
                responseData.msg = 'No account found with this email';
                return responseHelper.error(res, responseData);
            }

            const userData = user[0];

            // Check if user account is active
            if (!userData.status) {
                responseData.msg = 'Your account is disabled. Please contact support.';
                return responseHelper.error(res, responseData);
            }

            // Send OTP
            const otpResult = await otplessService.sendLoginOTP(email);
            
            if (otpResult.success) {
                // Store requestId in user record temporarily
                await userDbHandler.updateById(userData._id, {
                    otpless_request_id: otpResult.requestId
                });

                responseData.msg = 'OTP sent successfully to your email';
                responseData.data = {
                    requestId: otpResult.requestId,
                    email: email,
                    requiresTwoFA: userData.two_fa_enabled,
                    twoFAMethod: userData.two_fa_method
                };
                return responseHelper.success(res, responseData);
            } else {
                responseData.msg = otpResult.error || 'Failed to send OTP';
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to send login OTP:', error);
            responseData.msg = 'Failed to send OTP. Please try again.';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Verify login OTP
     */
    verifyLoginOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for login OTP verification:', { 
            email: reqObj.email, 
            requestId: reqObj.requestId 
        });
        let responseData = {};

        try {
            const { email, otp, requestId } = reqObj;

            // Validate required fields
            if (!email || !otp || !requestId) {
                responseData.msg = 'Email, OTP, and requestId are required';
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getByQuery({ email: email.toLowerCase() });
            if (!user || user.length === 0) {
                responseData.msg = 'Invalid login credentials';
                return responseHelper.error(res, responseData);
            }

            const userData = user[0];

            // Verify stored requestId matches
            if (userData.otpless_request_id !== requestId) {
                responseData.msg = 'Invalid or expired OTP session';
                return responseHelper.error(res, responseData);
            }

            // Verify OTP
            const verificationResult = await otplessService.verifyLoginOTP(otp, requestId);
            
            if (!verificationResult.success || !verificationResult.isVerified) {
                responseData.msg = verificationResult.error || 'Invalid or expired OTP';
                return responseHelper.error(res, responseData);
            }

            // Clear the requestId
            await userDbHandler.updateById(userData._id, {
                otpless_request_id: '',
                otpless_verified: true
            });

            // Check if 2FA is enabled
            if (userData.two_fa_enabled) {
                // Generate temporary token for 2FA step
                const tempTokenData = {
                    sub: userData._id,
                    email: userData.email,
                    step: '2fa_required',
                    time: new Date().getTime()
                };
                
                const tempToken = jwtService.createJWTToken(tempTokenData, '10m'); // 10 minutes expiry
                
                responseData.msg = '2FA verification required';
                responseData.data = {
                    requiresTwoFA: true,
                    twoFAMethod: userData.two_fa_method,
                    tempToken: tempToken
                };
                return responseHelper.success(res, responseData);
            }

            // Generate final login token
            const tokenData = {
                sub: userData._id,
                username: userData.username,
                email: userData.email,
                address: userData.address,
                name: userData.name,
                time: new Date().getTime()
            };

            const token = jwtService.createJWTToken(tokenData);

            // Update last login
            await userDbHandler.updateById(userData._id, {
                last_login: new Date(),
                access_token: token
            });

            responseData.msg = 'Login successful';
            responseData.data = {
                token: token,
                user: {
                    id: userData._id,
                    username: userData.username,
                    email: userData.email,
                    name: userData.name
                }
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify login OTP:', error);
            responseData.msg = 'Failed to verify OTP. Please try again.';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Send 2FA OTP
     */
    send2FAOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for 2FA OTP:', { email: reqObj.email });
        let responseData = {};

        try {
            const { tempToken } = reqObj;

            // Validate temp token
            if (!tempToken) {
                responseData.msg = 'Authentication token required';
                return responseHelper.error(res, responseData);
            }

            // Verify temp token
            let decodedToken;
            try {
                decodedToken = jwtService.verifyJWTToken(tempToken);
                if (decodedToken.step !== '2fa_required') {
                    throw new Error('Invalid token step');
                }
            } catch (error) {
                responseData.msg = 'Invalid or expired authentication token';
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getById(decodedToken.sub);
            if (!user) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Check if 2FA is enabled and method is OTPless
            if (!user.two_fa_enabled) {
                responseData.msg = '2FA is not enabled for this account';
                return responseHelper.error(res, responseData);
            }

            // Send 2FA OTP
            const otpResult = await otplessService.send2FAOTP(user.email);

            if (otpResult.success) {
                // Store requestId in user record
                await userDbHandler.updateById(user._id, {
                    otpless_request_id: otpResult.requestId
                });

                responseData.msg = '2FA OTP sent successfully to your email';
                responseData.data = {
                    requestId: otpResult.requestId
                };
                return responseHelper.success(res, responseData);
            } else {
                responseData.msg = otpResult.error || 'Failed to send 2FA OTP';
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to send 2FA OTP:', error);
            responseData.msg = 'Failed to send 2FA OTP. Please try again.';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Send mobile OTP for registration
     */
    sendRegistrationMobileOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for mobile registration OTP:', { phone_number: reqObj.phone_number });
        let responseData = {};

        try {
            const { phone_number } = reqObj;

            // Validate phone number
            if (!phone_number) {
                responseData.msg = 'Valid phone number is required';
                return responseHelper.error(res, responseData);
            }

            // Normalize phone number
            const normalizedPhone = phone_number.trim();

            // Check if phone number already exists
            const existingUser = await userDbHandler.getByQuery({ phone_number: normalizedPhone });
            if (existingUser && existingUser.length > 0) {
                responseData.msg = 'Phone number already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            log.info('Sending mobile registration OTP to:', normalizedPhone);

            // Send mobile OTP
            const otpResult = await otplessService.sendRegistrationSMSOTP(normalizedPhone);

            log.info('Mobile OTP service result:', otpResult);

            if (otpResult.success) {
                responseData.msg = 'OTP sent successfully to your mobile number';
                responseData.data = {
                    requestId: otpResult.requestId,
                    phone_number: normalizedPhone
                };
                log.info('Mobile registration OTP sent successfully:', { phone: normalizedPhone, requestId: otpResult.requestId });
                return responseHelper.success(res, responseData);
            } else {
                log.error('Mobile OTP service failed:', {
                    error: otpResult.error,
                    details: otpResult.details,
                    statusCode: otpResult.statusCode,
                    phone: normalizedPhone
                });
                responseData.msg = otpResult.error || 'Failed to send mobile OTP';
                responseData.details = otpResult.details;
                responseData.statusCode = otpResult.statusCode;
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to send mobile registration OTP:', error);
            responseData.msg = 'Failed to send mobile OTP. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Verify mobile OTP for registration
     */
    verifyRegistrationMobileOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for mobile registration OTP verification:', {
            phone_number: reqObj.phone_number,
            requestId: reqObj.requestId
        });
        let responseData = {};

        try {
            const { phone_number, otp, requestId } = reqObj;

            // Validate required fields
            if (!phone_number || !otp || !requestId) {
                responseData.msg = 'Phone number, OTP, and requestId are required';
                return responseHelper.error(res, responseData);
            }

            // Normalize phone number
            const normalizedPhone = phone_number.trim();

            log.info('Verifying mobile registration OTP:', {
                phone: normalizedPhone,
                requestId,
                otpLength: otp.length
            });

            // Verify mobile OTP
            const verificationResult = await otplessService.verifyRegistrationSMSOTP(otp, requestId);

            log.info('Mobile OTP verification result:', verificationResult);

            if (!verificationResult.success || !verificationResult.isVerified) {
                responseData.msg = verificationResult.error || 'Invalid or expired mobile OTP';
                return responseHelper.error(res, responseData);
            }

            responseData.msg = 'Mobile OTP verified successfully';
            responseData.data = {
                phone_number: normalizedPhone,
                verified: true
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify mobile registration OTP:', error);
            responseData.msg = 'Failed to verify mobile OTP. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Verify 2FA OTP and complete login
     */
    verify2FAOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for 2FA OTP verification:', { requestId: reqObj.requestId });
        let responseData = {};

        try {
            const { otp, requestId, tempToken } = reqObj;

            // Validate required fields
            if (!otp || !requestId || !tempToken) {
                responseData.msg = 'OTP, requestId, and authentication token are required';
                return responseHelper.error(res, responseData);
            }

            // Verify temp token
            let decodedToken;
            try {
                decodedToken = jwtService.verifyJWTToken(tempToken);
                if (decodedToken.step !== '2fa_required') {
                    throw new Error('Invalid token step');
                }
            } catch (error) {
                responseData.msg = 'Invalid or expired authentication token';
                return responseHelper.error(res, responseData);
            }

            // Get user
            const user = await userDbHandler.getById(decodedToken.sub);
            if (!user) {
                responseData.msg = 'User not found';
                return responseHelper.error(res, responseData);
            }

            // Verify stored requestId matches
            if (user.otpless_request_id !== requestId) {
                responseData.msg = 'Invalid or expired 2FA session';
                return responseHelper.error(res, responseData);
            }

            // Verify 2FA OTP
            const verificationResult = await otplessService.verify2FAOTP(otp, requestId);

            if (!verificationResult.success || !verificationResult.isVerified) {
                responseData.msg = verificationResult.error || 'Invalid or expired 2FA OTP';
                return responseHelper.error(res, responseData);
            }

            // Clear the requestId
            await userDbHandler.updateById(user._id, {
                otpless_request_id: ''
            });

            // Generate final login token
            const tokenData = {
                sub: user._id,
                username: user.username,
                email: user.email,
                address: user.address,
                name: user.name,
                time: new Date().getTime()
            };

            const token = jwtService.createJWTToken(tokenData);

            // Update last login
            await userDbHandler.updateById(user._id, {
                last_login: new Date(),
                access_token: token
            });

            responseData.msg = 'Login successful';
            responseData.data = {
                token: token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name
                }
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify 2FA OTP:', error);
            responseData.msg = 'Failed to verify 2FA OTP. Please try again.';
            return responseHelper.error(res, responseData);
        }
    }
};

module.exports = otplessController;
