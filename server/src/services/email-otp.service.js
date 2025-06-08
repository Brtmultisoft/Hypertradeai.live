'use strict';
const logger = require('./logger');
const log = new logger('EmailOTPService').getChildLogger();
const emailService = require('./sendEmail');

/**
 * Fallback Email OTP Service for testing when OTPless API is not working
 */
class EmailOTPService {
    constructor() {
        this.otpStore = new Map(); // In production, use Redis or database
        this.otpExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        log.info('Email OTP Service initialized');
    }

    /**
     * Generate a random OTP
     * @param {number} length - Length of OTP
     * @returns {string} - Generated OTP
     */
    generateOTP(length = 4) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }

    /**
     * Generate a unique request ID
     * @returns {string} - Generated request ID
     */
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Send OTP to email
     * @param {string} email - Email address to send OTP
     * @param {number} otpLength - Length of OTP (4 or 6)
     * @param {number} expiry - OTP expiry time in seconds
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendOTP(email, otpLength = 4, expiry = 120) {
        try {
            log.info(`Sending OTP to email: ${email}`, { otpLength, expiry });
            
            // Validate email
            if (!email || !email.includes('@')) {
                throw new Error('Invalid email address');
            }
            
            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();
            
            // Generate OTP and request ID
            const otp = this.generateOTP(otpLength);
            const requestId = this.generateRequestId();
            
            // Store OTP with expiry
            const otpData = {
                otp: otp,
                email: normalizedEmail,
                createdAt: Date.now(),
                expiresAt: Date.now() + (expiry * 1000),
                verified: false
            };
            
            this.otpStore.set(requestId, otpData);
            
            log.info('Generated OTP:', { requestId, email: normalizedEmail, otp: otp });
            
            // Send email with simple template
            const config = require('../config/config');
            const emailSubject = `Your ${config.brandName} Verification Code`;
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #333; margin: 0;">${config.brandName}</h2>
                            <p style="color: #666; margin: 5px 0 0 0;">Secure Authentication</p>
                        </div>

                        <h3 style="color: #333; margin-bottom: 20px;">Your Verification Code</h3>

                        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                            Hello,<br><br>
                            You have requested a verification code for your ${config.brandName} account.
                            Please use the following code to complete your registration:
                        </p>

                        <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                                ${otp}
                            </h1>
                        </div>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                <strong>⚠️ Important:</strong> This code will expire in ${Math.floor(expiry / 60)} minutes.
                                Do not share this code with anyone.
                            </p>
                        </div>

                        <p style="color: #666; line-height: 1.6; margin: 20px 0;">
                            If you didn't request this code, please ignore this email or contact our support team
                            if you have concerns about your account security.
                        </p>

                        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                This is an automated message from ${config.brandName}. Please do not reply to this email.
                            </p>
                            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                                © ${new Date().getFullYear()} ${config.brandName}. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            log.info('Preparing to send email:', {
                email: normalizedEmail,
                subject: emailSubject,
                otpLength: otp.length,
                requestId: requestId,
                timestamp: new Date().toISOString()
            });

            try {
                const emailData = {
                    recipientsAddress: normalizedEmail,
                    subject: emailSubject,
                    body: emailBody
                };

                log.info('Sending email with data:', {
                    to: normalizedEmail,
                    subject: emailSubject,
                    requestId: requestId,
                    timestamp: new Date().toISOString()
                });

                const emailResult = await emailService.sendEmail(emailData);
                log.info('OTP email sent successfully', {
                    email: normalizedEmail,
                    requestId: requestId,
                    emailResult: emailResult,
                    timestamp: new Date().toISOString()
                });
            } catch (emailError) {
                log.error('Failed to send OTP email:', {
                    error: emailError,
                    email: normalizedEmail,
                    requestId: requestId,
                    errorMessage: emailError.message,
                    errorStack: emailError.stack,
                    timestamp: new Date().toISOString()
                });

                // Fail the request if email fails
                throw new Error(`Email sending failed: ${emailError.message}`);
            }
            
            return {
                success: true,
                requestId: requestId,
                message: 'OTP sent successfully to your email'
            };

        } catch (error) {
            log.error('Failed to send OTP:', error);
            
            return {
                success: false,
                error: error.message || 'Failed to send OTP',
                details: error
            };
        }
    }

    /**
     * Verify OTP
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
            
            // Get stored OTP data
            const otpData = this.otpStore.get(requestId);
            
            if (!otpData) {
                log.warn('OTP data not found for requestId:', requestId);
                return {
                    success: true,
                    isVerified: false,
                    requestId: requestId,
                    message: 'Invalid or expired OTP session'
                };
            }
            
            // Check if OTP has expired
            if (Date.now() > otpData.expiresAt) {
                log.warn('OTP expired for requestId:', requestId);
                this.otpStore.delete(requestId); // Clean up expired OTP
                return {
                    success: true,
                    isVerified: false,
                    requestId: requestId,
                    message: 'OTP has expired'
                };
            }
            
            // Check if OTP has already been verified
            if (otpData.verified) {
                log.warn('OTP already verified for requestId:', requestId);
                return {
                    success: true,
                    isVerified: false,
                    requestId: requestId,
                    message: 'OTP has already been used'
                };
            }
            
            // Verify OTP
            const isVerified = otpData.otp === otp.toString();
            
            if (isVerified) {
                // Mark as verified
                otpData.verified = true;
                this.otpStore.set(requestId, otpData);
                log.info('OTP verified successfully', { requestId, email: otpData.email });
            } else {
                log.warn('Invalid OTP provided', { requestId, provided: otp, expected: otpData.otp });
            }
            
            return {
                success: true,
                isVerified: isVerified,
                requestId: requestId,
                message: isVerified ? 'OTP verified successfully' : 'Invalid OTP'
            };

        } catch (error) {
            log.error('Failed to verify OTP:', error);
            
            return {
                success: false,
                isVerified: false,
                error: error.message || 'Failed to verify OTP',
                details: error
            };
        }
    }

    /**
     * Clean up expired OTPs (should be called periodically)
     */
    cleanupExpiredOTPs() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [requestId, otpData] of this.otpStore.entries()) {
            if (now > otpData.expiresAt) {
                this.otpStore.delete(requestId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            log.info(`Cleaned up ${cleanedCount} expired OTPs`);
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
     * Send OTP for login
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendLoginOTP(email) {
        return this.sendOTP(email, 4, 120); // 2 minutes expiry for login
    }

    /**
     * Send OTP for 2FA verification
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async send2FAOTP(email) {
        return this.sendOTP(email, 6, 180); // 3 minutes expiry for 2FA
    }

    /**
     * Verify registration OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyRegistrationOTP(otp, requestId) {
        return this.verifyOTP(otp, requestId);
    }

    /**
     * Verify login OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyLoginOTP(otp, requestId) {
        return this.verifyOTP(otp, requestId);
    }

    /**
     * Verify 2FA OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verify2FAOTP(otp, requestId) {
        return this.verifyOTP(otp, requestId);
    }
}

// Start cleanup interval (every 10 minutes)
const emailOTPService = new EmailOTPService();
setInterval(() => {
    emailOTPService.cleanupExpiredOTPs();
}, 10 * 60 * 1000);

module.exports = emailOTPService;
