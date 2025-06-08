'use strict';
const axios = require('axios');
const logger = require('./logger');
const log = new logger('OTPlessService').getChildLogger();
const emailOTPService = require('./email-otp.service');

/**
 * OTPless Service for handling OTP operations
 */
class OTPlessService {
    constructor() {
        this.apiUrl = 'https://auth.otpless.app/auth/v1';
        this.clientId = process.env.OTPLESS_CLIENT_ID;
        this.clientSecret = process.env.OTPLESS_CLIENT_SECRET;

        // Log configuration for debugging
        log.info('OTPless Service initialized', {
            clientId: this.clientId,
            clientSecret: this.clientSecret ? '***' + this.clientSecret.slice(-4) : 'Not set',
            apiUrl: this.apiUrl
        });

        // Validate configuration
        if (!this.clientId || !this.clientSecret) {
            log.error('OTPless configuration missing - clientId or clientSecret not provided');
        }
    }

    /**
     * Send OTP to email - Based on PHP implementation from text file
     * @param {string} email - Email address to send OTP
     * @param {number} otpLength - Length of OTP (4 or 6)
     * @param {number} expiry - OTP expiry time in seconds
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendOTP(email, otpLength = 4, expiry = 120) {
        console.log("Hitting OTPless API...");

        try {
            log.info(`Sending OTP to email: ${email}`, { otpLength, expiry });

            // Validate configuration
            if (!this.clientId || !this.clientSecret) {
                throw new Error('OTPless configuration missing - clientId or clientSecret not provided');
            }

            // Validate email
            if (!email || !email.includes('@')) {
                throw new Error('Invalid email address');
            }

            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();

            // Based on PHP implementation from text file - exact format
            const data = {
                email: normalizedEmail,
                expiry: expiry,
                otpLength: otpLength,
                channels: ['EMAIL']  // Array format as in PHP
            };

            log.info('Sending OTP request data:', data);
            log.info('Using headers:', {
                clientId: this.clientId,
                clientSecret: this.clientSecret ? '***' + this.clientSecret.slice(-4) : 'Not set'
            });

            // Use the exact endpoint from PHP implementation
            const response = await axios.post(`${this.apiUrl}/initiate/otp`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'clientId': this.clientId,
                    'clientSecret': this.clientSecret
                },
                timeout: 30000
            });

            log.info('OTP API response status:', response.status);
            log.info('OTP API response data:', response.data);

            // Check for requestId as in PHP implementation
            if (response.data && response.data.requestId) {
                log.info('OTP sent successfully', { email: normalizedEmail, requestId: response.data.requestId });

                return {
                    success: true,
                    requestId: response.data.requestId,
                    message: 'OTP sent successfully to your email!'
                };
            } else {
                log.error('No requestId in response:', response.data);
                return {
                    success: false,
                    error: 'Failed to send OTP: ' + JSON.stringify(response.data),
                    details: response.data
                };
            }

        } catch (error) {
            log.error('OTPless API failed, trying email fallback:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                email: email
            });

            // Fallback to email OTP service
            log.info('Using email OTP fallback service');
            try {
                const fallbackResult = await emailOTPService.sendOTP(email, otpLength, expiry);
                if (fallbackResult.success) {
                    log.info('Email OTP fallback successful');
                    return fallbackResult;
                }
            } catch (fallbackError) {
                log.error('Email OTP fallback also failed:', fallbackError);
            }

            let errorMessage = 'Failed to send OTP';

            if (error.response?.status === 401) {
                errorMessage = 'Authentication failed - Invalid OTPless credentials';
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Invalid request parameters';
            } else if (error.response?.status === 429) {
                errorMessage = 'Rate limit exceeded - Please try again later';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage,
                details: error.response?.data,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Verify OTP - Based on PHP implementation from text file
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyOTP(otp, requestId) {
        try {
            log.info(`Verifying OTP for requestId: ${requestId}`, { otp: otp.length + ' digits' });

            // Validate inputs
            if (!otp || !requestId) {
                throw new Error('OTP and requestId are required');
            }

            // Based on PHP implementation from text file - exact format
            const data = {
                otp: otp.toString(),
                requestId: requestId
            };

            log.info('OTP verification request data:', { requestId, otpLength: otp.length });

            // Use the exact endpoint from PHP implementation
            const response = await axios.post(`${this.apiUrl}/verify/otp`, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'clientId': this.clientId,
                    'clientSecret': this.clientSecret
                },
                timeout: 30000
            });

            log.info('OTP verification API response:', response.data);

            // Check isOTPVerified as in PHP implementation
            const isVerified = response.data.isOTPVerified === true;

            log.info('OTP verification result', { requestId, isVerified });

            if (isVerified) {
                return {
                    success: true,
                    isVerified: true,
                    requestId: response.data.requestId || requestId,
                    message: 'OTP verified successfully!'
                };
            } else {
                return {
                    success: false,
                    isVerified: false,
                    error: 'OTP verification failed: Incorrect or Expired OTP'
                };
            }

        } catch (error) {
            log.error('OTPless verify failed, trying email fallback:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                requestId: requestId
            });

            // Fallback to email OTP service
            log.info('Using email OTP verification fallback');
            try {
                const fallbackResult = await emailOTPService.verifyOTP(otp, requestId);
                if (fallbackResult.success) {
                    log.info('Email OTP verification fallback successful');
                    return fallbackResult;
                }
            } catch (fallbackError) {
                log.error('Email OTP verification fallback also failed:', fallbackError);
            }

            return {
                success: false,
                isVerified: false,
                error: error.response?.data?.message || error.message || 'Failed to verify OTP',
                details: error.response?.data
            };
        }
    }

    /**
     * Send OTP for registration
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendRegistrationOTP(email) {
        return this.sendOTP(email, 4, 300); // 5 minutes expiry for registration
    }

    /**
     * Send OTP for login (2FA)
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendLoginOTP(email) {
        log.info('Sending login OTP for 2FA to:', email);
        return await this.sendOTP(email, 6, 300); // 6-digit OTP, 5 minutes expiry
    }

    /**
     * Verify OTP for login (2FA)
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyLoginOTP(otp, requestId) {
        log.info('Verifying login OTP for 2FA:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Send OTP for forgot password
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendForgotPasswordOTP(email) {
        log.info('Sending forgot password OTP to:', email);
        return await this.sendOTP(email, 6, 600); // 6-digit OTP, 10 minutes expiry
    }

    /**
     * Verify OTP for forgot password
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyForgotPasswordOTP(otp, requestId) {
        log.info('Verifying forgot password OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Send OTP for 2FA verification
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async send2FAOTP(email) {
        log.info('Sending 2FA OTP to:', email);
        return await this.sendOTP(email, 6, 180); // 6-digit OTP, 3 minutes expiry for 2FA
    }

    /**
     * Verify registration OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyRegistrationOTP(otp, requestId) {
        log.info('Verifying registration OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }

    /**
     * Verify 2FA OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verify2FAOTP(otp, requestId) {
        log.info('Verifying 2FA OTP:', { requestId, otpLength: otp.length });
        return await this.verifyOTP(otp, requestId);
    }
}

module.exports = new OTPlessService();
