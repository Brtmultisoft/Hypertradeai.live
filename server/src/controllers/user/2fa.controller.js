'use strict';
const logger = require('../../services/logger');
const log = new logger('2faController').getChildLogger();
const { userDbHandler, verificationDbHandler } = require('../../services/db');
const bcrypt = require('bcryptjs');
const config = require('../../config/config');
const jwtService = require('../../services/jwt');
const responseHelper = require('../../utils/customResponse');

const qrcode = require("qrcode");
const { authenticator } = require("otplib");

// Configure authenticator options
authenticator.options = {
    step: 30,        // Time step in seconds (30 is standard)
    window: 1,       // Allow ±1 time step (±30 seconds)
    digits: 6,       // 6-digit codes
    algorithm: 'sha1' // SHA1 algorithm (standard for Google Authenticator)
};

/**************************
 * END OF PRIVATE FUNCTIONS
 **************************/
module.exports = {

    generate2faSecret: async(req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for User 2FA Secret:', reqObj);
        let responseData = {};
        try {
            let query = {
                email: req.user.email
            }
            const user = await userDbHandler.getOneByQuery(query);

            if (user.two_fa_enabled && user.two_fa_method === 'totp') {
                responseData.msg = "Google Authenticator 2FA already verified and enabled!";
                responseData.data = {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method
                };
                return responseHelper.error(res, responseData);
            }

            // If user already has a TOTP secret but hasn't enabled 2FA yet, reuse the existing secret
            let secret;
            if (user.two_fa_secret && user.two_fa_method === 'totp' && !user.two_fa_enabled) {
                log.info('Reusing existing TOTP secret for user:', user.email);
                secret = user.two_fa_secret;
            } else {
                log.info('Generating new TOTP secret for user:', user.email);
                secret = authenticator.generateSecret();
                user.two_fa_secret = secret;
                user.two_fa_method = 'totp';
                await user.save();
            }

            const appName = config.brandName || 'HypertradeAI';

            // Generate QR code URI
            const otpAuthUrl = authenticator.keyuri(user.email, appName, secret);

            // Generate QR code with smaller size and error correction
            const qrImageDataUrl = await qrcode.toDataURL(otpAuthUrl, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 256
            });

            responseData.msg = user.two_fa_secret && user.two_fa_method === 'totp' && !user.two_fa_enabled
                ? `Using existing Google Authenticator secret. Please verify with your current setup.`
                : `Google Authenticator secret generated successfully!`;
            responseData.data = {
                secret: secret,
                qrImageDataUrl: qrImageDataUrl,
                two_fa_enabled: user.two_fa_enabled,
                two_fa_method: user.two_fa_method,
                manual_entry_key: secret,
                app_name: appName,
                account_name: user.email,
                otpauth_url: otpAuthUrl,
                current_token: authenticator.generate(secret), // For debugging - shows current valid token
                debug_info: {
                    secret_reused: user.two_fa_secret === secret,
                    timestamp: new Date().toISOString()
                }
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get user 2fa secret with error::', error);
            responseData.msg = 'Failed to generate Google Authenticator secret';
            return responseHelper.error(res, responseData);
        }
    },

    verifyOtp: async(req, res) => {
        let reqObj = req.body;
        log.info('Recieved request for User 2FA verify Otp:', reqObj);
        let responseData = {};
        try {
            let query = {
                email: req.user.email
            }
            const user = await userDbHandler.getOneByQuery(query);
            if (user.two_fa_enabled && user.two_fa_method === 'totp') {
                responseData.msg = "Google Authenticator 2FA already verified and enabled!";
                responseData.data = {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method
                };
                return responseHelper.error(res, responseData);
            }

            const token = reqObj.token.replace(/\s/g, ""); // Remove all whitespace

            // Log for debugging
            log.info('Verifying TOTP token:', {
                token: token,
                tokenLength: token.length,
                secret: user.two_fa_secret ? 'present' : 'missing',
                secretLength: user.two_fa_secret ? user.two_fa_secret.length : 0,
                currentServerToken: user.two_fa_secret ? authenticator.generate(user.two_fa_secret) : 'no-secret'
            });

            // Validate token format
            if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
                responseData.msg = "Please enter a valid 6-digit code from your authenticator app.";
                return responseHelper.error(res, responseData);
            }

            // Validate secret exists
            if (!user.two_fa_secret) {
                responseData.msg = "2FA secret not found. Please set up Google Authenticator again.";
                return responseHelper.error(res, responseData);
            }

            // Use authenticator.verify with window tolerance for better compatibility
            const verifyOptions = {
                token: token,
                secret: user.two_fa_secret,
                window: 2 // Allow ±2 time steps (±60 seconds) for clock drift
            };

            const isValid = authenticator.verify(verifyOptions);

            log.info('TOTP verification result:', {
                isValid: isValid,
                token: token,
                secretPresent: !!user.two_fa_secret,
                currentTime: new Date().toISOString(),
                currentToken: authenticator.generate(user.two_fa_secret)
            });

            if (!isValid) {
                responseData.msg = "The entered Google Authenticator code is invalid or expired. Please ensure your device time is synchronized and try the current code from your app.";
                responseData.data = {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method
                };
                return responseHelper.error(res, responseData);
            }

            // Success - enable 2FA
            user.two_fa_enabled = true;
            user.two_fa_method = 'totp';
            await user.save();

            responseData.msg = `Google Authenticator 2FA enabled successfully!`;
            responseData.data = {
                two_fa_enabled: user.two_fa_enabled,
                two_fa_method: user.two_fa_method,
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to verify Google Authenticator OTP with error::', error);
            responseData.msg = 'Failed to verify Google Authenticator code';
            return responseHelper.error(res, responseData);
        }
    },

    disable2fa: async(req, res) => {
        let reqObj = req.body;
        log.info('Received request to disable 2FA:', reqObj);
        let responseData = {};
        try {
            let query = {
                email: req.user.email
            }
            const user = await userDbHandler.getOneByQuery(query);

            if (!user.two_fa_enabled) {
                responseData.msg = "2FA is not enabled!";
                responseData.data = {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method
                };
                return responseHelper.error(res, responseData);
            }

            // Verify current password for security
            if (!reqObj.password) {
                responseData.msg = "Password is required to disable 2FA";
                return responseHelper.error(res, responseData);
            }

            const isPasswordValid = await bcrypt.compare(reqObj.password, user.password);
            if (!isPasswordValid) {
                responseData.msg = "Invalid password!";
                return responseHelper.error(res, responseData);
            }

            // Disable 2FA
            user.two_fa_enabled = false;
            user.two_fa_secret = "";
            user.two_fa_method = "otpless"; // Reset to default
            await user.save();

            responseData.msg = `2FA disabled successfully!`;
            responseData.data = {
                two_fa_enabled: user.two_fa_enabled,
                two_fa_method: user.two_fa_method,
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to disable 2FA with error::', error);
            responseData.msg = 'Failed to disable 2FA';
            return responseHelper.error(res, responseData);
        }
    },

    toggle2FAMethod: async(req, res) => {
        let reqObj = req.body;
        log.info('Received request to toggle 2FA method:', reqObj);
        let responseData = {};
        try {
            let query = {
                email: req.user.email
            }
            const user = await userDbHandler.getOneByQuery(query);

            const method = reqObj.method; // 'totp' or 'otpless'

            if (!method || !['totp', 'otpless'].includes(method)) {
                responseData.msg = "Invalid 2FA method. Must be 'totp' or 'otpless'";
                return responseHelper.error(res, responseData);
            }

            if (method === 'otpless') {
                // Enable OTPless method
                user.two_fa_enabled = true;
                user.two_fa_method = 'otpless';
                user.two_fa_secret = ""; // Clear TOTP secret
                await user.save();

                responseData.msg = `Email OTP 2FA enabled successfully!`;
                responseData.data = {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method,
                };
                return responseHelper.success(res, responseData);
            } else {
                // For TOTP, just update method but don't enable until verification
                user.two_fa_method = 'totp';
                user.two_fa_enabled = false; // Will be enabled after TOTP verification
                await user.save();

                responseData.msg = `2FA method set to Google Authenticator. Please complete setup to enable.`;
                responseData.data = {
                    two_fa_enabled: user.two_fa_enabled,
                    two_fa_method: user.two_fa_method,
                    setup_required: true
                };
                return responseHelper.success(res, responseData);
            }
        } catch (error) {
            log.error('failed to toggle 2FA method with error::', error);
            responseData.msg = 'Failed to toggle 2FA method';
            return responseHelper.error(res, responseData);
        }
    },

    // Debug endpoint to get current valid token
    getCurrentToken: async(req, res) => {
        let responseData = {};
        try {
            let query = {
                email: req.user.email
            }
            const user = await userDbHandler.getOneByQuery(query);

            if (!user.two_fa_secret) {
                responseData.msg = "No 2FA secret found. Please set up Google Authenticator first.";
                return responseHelper.error(res, responseData);
            }

            const currentToken = authenticator.generate(user.two_fa_secret);

            responseData.msg = "Current valid token retrieved successfully";
            responseData.data = {
                current_token: currentToken,
                secret: user.two_fa_secret,
                two_fa_enabled: user.two_fa_enabled,
                two_fa_method: user.two_fa_method,
                timestamp: new Date().toISOString(),
                expires_in_seconds: 30 - (Math.floor(Date.now() / 1000) % 30)
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to get current token with error::', error);
            responseData.msg = 'Failed to get current token';
            return responseHelper.error(res, responseData);
        }
    },

};