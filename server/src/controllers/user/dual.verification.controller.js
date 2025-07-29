'use strict';
const logger = require('../../services/logger');
const log = new logger('DualVerificationController').getChildLogger();
const { userDbHandler } = require('../../services/db');
const otplessService = require('../../services/otpless.service');
const responseHelper = require('../../utils/customResponse');
const jwtService = require('../../services/jwt');

/**
 * Dual Verification Controller for handling email + mobile verification during registration
 */
const dualVerificationController = {
    /**
     * Send OTP to both email and mobile for registration
     */
    sendRegistrationOTPs: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for dual registration OTPs:', { 
            email: reqObj.email, 
            phone_number: reqObj.phone_number 
        });
        let responseData = {};

        try {
            const { email, phone_number } = reqObj;

            // Validate email and phone
            if (!email || !email.includes('@')) {
                responseData.msg = 'Valid email is required';
                return responseHelper.error(res, responseData);
            }

            if (!phone_number) {
                responseData.msg = 'Valid phone number is required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email and phone
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone_number.trim();

            // Check if user already exists with email or phone
            const existingUserByEmail = await userDbHandler.getByQuery({ email: normalizedEmail });
            const existingUserByPhone = await userDbHandler.getByQuery({ phone_number: normalizedPhone });

            if (existingUserByEmail && existingUserByEmail.length > 0) {
                responseData.msg = 'Email already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            if (existingUserByPhone && existingUserByPhone.length > 0) {
                responseData.msg = 'Phone number already registered. Please login instead.';
                return responseHelper.error(res, responseData);
            }

            log.info('Sending registration OTPs to email and mobile:', { 
                email: normalizedEmail, 
                phone: normalizedPhone 
            });

            // Send OTP to email
            const emailOtpResult = await otplessService.sendRegistrationOTP(normalizedEmail);
            
            // Send OTP to mobile
            const mobileOtpResult = await otplessService.sendRegistrationSMSOTP(normalizedPhone);

            // Check if both OTPs were sent successfully
            if (emailOtpResult.success && mobileOtpResult.success) {
                responseData.msg = 'OTPs sent successfully to both email and mobile';
                responseData.data = {
                    emailRequestId: emailOtpResult.requestId,
                    mobileRequestId: mobileOtpResult.requestId,
                    email: normalizedEmail,
                    phone_number: normalizedPhone
                };
                log.info('Both registration OTPs sent successfully:', { 
                    email: normalizedEmail, 
                    emailRequestId: emailOtpResult.requestId,
                    phone: normalizedPhone,
                    mobileRequestId: mobileOtpResult.requestId
                });
                return responseHelper.success(res, responseData);
            } else {
                // Handle partial success or complete failure
                let errorMessages = [];
                if (!emailOtpResult.success) {
                    errorMessages.push(`Email OTP: ${emailOtpResult.error}`);
                }
                if (!mobileOtpResult.success) {
                    errorMessages.push(`Mobile OTP: ${mobileOtpResult.error}`);
                }

                responseData.msg = 'Failed to send OTPs: ' + errorMessages.join(', ');
                responseData.details = {
                    emailResult: emailOtpResult,
                    mobileResult: mobileOtpResult
                };
                return responseHelper.error(res, responseData);
            }

        } catch (error) {
            log.error('Failed to send dual registration OTPs:', error);
            responseData.msg = 'Failed to send OTPs. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Verify both email and mobile OTPs and create user
     */
    verifyRegistrationOTPs: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for dual registration OTP verification:', {
            email: reqObj.email,
            phone_number: reqObj.phone_number,
            emailRequestId: reqObj.emailRequestId,
            mobileRequestId: reqObj.mobileRequestId,
            hasUserData: !!reqObj.userData
        });
        let responseData = {};

        try {
            const { 
                email, 
                phone_number, 
                emailOtp, 
                mobileOtp, 
                emailRequestId, 
                mobileRequestId, 
                userData 
            } = reqObj;

            // Validate required fields
            if (!email || !phone_number || !emailOtp || !mobileOtp || 
                !emailRequestId || !mobileRequestId || !userData) {
                responseData.msg = 'All fields are required: email, phone_number, emailOtp, mobileOtp, emailRequestId, mobileRequestId, and userData';
                return responseHelper.error(res, responseData);
            }

            // Normalize email and phone
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPhone = phone_number.trim();

            log.info('Verifying dual registration OTPs:', {
                email: normalizedEmail,
                phone: normalizedPhone,
                emailRequestId,
                mobileRequestId,
                emailOtpLength: emailOtp.length,
                mobileOtpLength: mobileOtp.length
            });

            // Verify email OTP
            const emailVerificationResult = await otplessService.verifyRegistrationOTP(emailOtp, emailRequestId);
            
            // Verify mobile OTP
            const mobileVerificationResult = await otplessService.verifyRegistrationSMSOTP(mobileOtp, mobileRequestId);

            log.info('OTP verification results:', {
                emailVerified: emailVerificationResult.success && emailVerificationResult.isVerified,
                mobileVerified: mobileVerificationResult.success && mobileVerificationResult.isVerified
            });

            // Check if both OTPs are verified
            if ((!emailVerificationResult.success || !emailVerificationResult.isVerified) ||
                (!mobileVerificationResult.success || !mobileVerificationResult.isVerified)) {
                
                let errorMessages = [];
                if (!emailVerificationResult.success || !emailVerificationResult.isVerified) {
                    errorMessages.push(`Email OTP: ${emailVerificationResult.error || 'Invalid or expired'}`);
                }
                if (!mobileVerificationResult.success || !mobileVerificationResult.isVerified) {
                    errorMessages.push(`Mobile OTP: ${mobileVerificationResult.error || 'Invalid or expired'}`);
                }

                responseData.msg = 'OTP verification failed: ' + errorMessages.join(', ');
                return responseHelper.error(res, responseData);
            }

            // Check if user already exists (double check)
            const existingUserByEmail = await userDbHandler.getByQuery({ email: normalizedEmail });
            const existingUserByPhone = await userDbHandler.getByQuery({ phone_number: normalizedPhone });

            if ((existingUserByEmail && existingUserByEmail.length > 0) || 
                (existingUserByPhone && existingUserByPhone.length > 0)) {
                responseData.msg = 'Email or phone number already registered';
                return responseHelper.error(res, responseData);
            }

            // Handle referral system (matching existing auth controller logic)
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

            // Get placement ID using the hardcoded admin ID
            const { getPlacementId } = require('../../services/commonFun');
            let placement_id = await getPlacementId("678f9a82a2dac325900fc47e", 3); // 3x matrix
            if (!placement_id) {
                responseData.msg = 'No placement available!';
                return responseHelper.error(res, responseData);
            }

            // Generate a unique sponsor ID
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

            // Create user with dual verification
            const newUserData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: userData.username || normalizedEmail, // Use email as username if not provided
                trace_id: trace_id,
                sponsorID: sponsorID,
                email: normalizedEmail,
                phone_number: normalizedPhone,
                password: userData.password, // Password will be encrypted by the pre-save hook
                name: userData.name,
                country: userData.country,
                email_verified: true,
                phone_verified: true,
                mobile_otp_verified: true,
                otpless_enabled: true,
                otpless_verified: true,
                two_fa_method: 'otpless'
            };

            log.info('Creating new user with dual verification:', {
                email: newUserData.email,
                phone: newUserData.phone_number,
                username: newUserData.username,
                sponsorID: newUserData.sponsorID,
                trace_id: newUserData.trace_id
            });

            const newUser = await userDbHandler.create(newUserData);
            log.info('User created successfully with dual verification:', newUser._id);

            // Create welcome notification
            try {
                const notificationController = require('./notification.controller');
                await notificationController.createWelcomeNotification(newUser._id, newUserData);
                log.info('Welcome notification created for user:', newUser._id);
            } catch (notificationError) {
                log.error('Failed to create welcome notification:', notificationError);
                // Don't fail registration if notification creation fails
            }

            responseData.msg = 'Registration completed successfully with email and mobile verification';
            responseData.data = {
                userId: newUser._id,
                email: newUser.email,
                phone_number: newUser.phone_number,
                username: newUser.username,
                sponsorID: newUser.sponsorID
            };
            return responseHelper.success(res, responseData);

        } catch (error) {
            log.error('Failed to verify dual registration OTPs:', error);
            responseData.msg = 'Failed to verify OTPs. Please try again.';
            responseData.error = error.message;
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Register user directly without OTP verification (when OTP is disabled)
     */
    registerWithoutOTP: async (req, res) => {
        let reqObj = req.body;
        log.info('Received request for direct registration without OTP:', {
            email: reqObj.email,
            phone_number: reqObj.phone_number,
            hasUserData: !!reqObj.userData
        });
        let responseData = {};

        try {
            const { email, phone_number, userData } = reqObj;

            // Validate required fields
            if (!userData) {
                responseData.msg = 'userData is required';
                return responseHelper.error(res, responseData);
            }

            // Get email and phone from top level or userData
            const finalEmail = email || userData.email;
            const finalPhone = phone_number || userData.phone_number;

            if (!finalEmail || !finalPhone) {
                responseData.msg = 'Email and phone number are required';
                return responseHelper.error(res, responseData);
            }

            // Normalize email and phone
            const normalizedEmail = finalEmail.toLowerCase().trim();
            const normalizedPhone = finalPhone.trim();

            log.info('Processing direct registration:', {
                email: normalizedEmail,
                phone: normalizedPhone,
                username: userData.username,
                name: userData.name
            });

            // Check if user already exists
            const existingUserByEmail = await userDbHandler.getByQuery({ email: normalizedEmail });
            const existingUserByPhone = await userDbHandler.getByQuery({ phone_number: normalizedPhone });

            if ((existingUserByEmail && existingUserByEmail.length > 0) ||
                (existingUserByPhone && existingUserByPhone.length > 0)) {
                responseData.msg = 'Email or phone number already registered';
                return responseHelper.error(res, responseData);
            }

            // Check if username already exists
            if (userData.username) {
                const existingUserByUsername = await userDbHandler.getByQuery({ username: userData.username });
                if (existingUserByUsername && existingUserByUsername.length > 0) {
                    responseData.msg = 'Username already taken';
                    return responseHelper.error(res, responseData);
                }
            }

            // Handle referral system (matching existing auth controller logic)
            let trace_id = userData.referrer || userData.referralId;

            // If no referral ID provided, set default to admin
            if (!trace_id || trace_id.trim() === '') {
                trace_id = 'admin';
                log.info('No referral ID provided, setting default to admin');
            }

            let refer_id = null;
            let placement_id = null;

            // Check if it's a sponsor ID (any format)
            let sponsorUser = await userDbHandler.getOneByQuery({ sponsorID: trace_id }, { _id: 1 });
            if (sponsorUser) {
                refer_id = sponsorUser._id;
            }

            // If not a sponsor ID, check username
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

            // Set placement_id same as refer_id for now
            placement_id = refer_id;

            // Generate sponsor ID with HS prefix (no validation)
            const generateSponsorId = () => {
                const randomNum = Math.floor(Math.random() * 900000) + 100000;
                return `HS${randomNum}`;
            };

            const sponsorID = generateSponsorId();

            // Create user without OTP verification
            const newUserData = {
                refer_id: refer_id,
                placement_id: placement_id,
                username: userData.username || normalizedEmail,
                trace_id: trace_id,
                sponsorID: sponsorID,
                email: normalizedEmail,
                phone_number: normalizedPhone,
                password: userData.password,
                name: userData.name,
                country: userData.country,
                email_verified: false, // Not verified since no OTP
                phone_verified: false, // Not verified since no OTP
                mobile_otp_verified: false,
                otpless_enabled: false,
                otpless_verified: false,
                two_fa_method: 'otpless' // Use default enum value
            };

            log.info('Creating new user without OTP verification:', {
                email: newUserData.email,
                phone: newUserData.phone_number,
                username: newUserData.username,
                sponsorID: newUserData.sponsorID,
                trace_id: newUserData.trace_id
            });

            const newUser = await userDbHandler.create(newUserData);
            log.info('User created successfully without OTP verification:', newUser._id);

            // Create welcome notification
            try {
                const notificationController = require('./notification.controller');
                await notificationController.createWelcomeNotification(newUser._id, newUserData);
                log.info('Welcome notification created for user:', newUser._id);
            } catch (notificationError) {
                log.error('Failed to create welcome notification:', notificationError);
                // Don't fail registration if notification creation fails
            }

            // Generate JWT token for the new user
            const jwtPayload = {
                sub: newUser._id,
                email: newUser.email,
                username: newUser.username,
                sponsorID: newUser.sponsorID
            };

            // Create a new instance for jwt service
            const tokenService = new jwtService();
            const token = tokenService.createJwtAuthenticationToken(jwtPayload);

            responseData.msg = 'Registration successful!';
            responseData.data = {
                user: {
                    _id: newUser._id,
                    email: newUser.email,
                    username: newUser.username,
                    name: newUser.name,
                    phone_number: newUser.phone_number,
                    sponsorID: newUser.sponsorID,
                    email_verified: newUser.email_verified,
                    phone_verified: newUser.phone_verified
                },
                token: token
            };

            log.info('Direct registration completed successfully for user:', newUser._id);
            return responseHelper.success(res, responseData);

        } catch (err) {
            log.error('Error in direct registration without OTP:', err);
            responseData.msg = err.message || 'Registration failed';
            return responseHelper.error(res, responseData);
        }
    }
};

module.exports = dualVerificationController;
