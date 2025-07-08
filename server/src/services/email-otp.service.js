'use strict';
const logger = require('./logger');
const log = new logger('EmailOTPService').getChildLogger();
const emailService = require('./sendEmail');
const config = require('../config/config');

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
     * Generate HTML template for registration OTP
     */
    registrationTemplate(otp, expiry, brandName) {
        return `
        <div style="background:linear-gradient(135deg,#181818 0%,#232526 100%);min-height:100vh;padding:0;margin:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto 0 auto;background:#181818;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.32);overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
            <tr>
              <td style="padding:0;text-align:center;background:#181818;">
                <div style="padding:32px 0;">
                  <h1 style="color:#FFD700;font-size:2.1em;margin:0;letter-spacing:1px;font-weight:800;">${brandName}</h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px 32px;">
                <h2 style="color:#FFD700;font-size:1.3em;margin:0 0 12px 0;font-weight:700;">Complete Your Registration</h2>
                <p style="color:#ccc;font-size:1.08em;margin:0 0 24px 0;">Thank you for signing up! Use the code below to verify your email and activate your account.</p>
                <div style="margin:32px 0 24px 0;text-align:center;">
                  <span style="display:inline-block;background:linear-gradient(90deg,#FFD700 0%,#B8860B 100%);color:#181818;font-size:2.5em;font-weight:bold;letter-spacing:12px;padding:18px 36px;border-radius:12px;box-shadow:0 2px 8px rgba(255,215,0,0.10);font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <p style="color:#888;font-size:1em;margin:0 0 16px 0;text-align:center;">This code will expire in <b>${Math.floor(expiry/60)} minutes</b>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;text-align:center;color:#aaa;font-size:0.98em;background:#232526;">
                <p style="margin:0 0 8px 0;">If you did not request this, you can safely ignore this email.</p>
                <p style="margin:0;">Need help? <a href="mailto:support@${brandName.toLowerCase().replace(/\s/g,'')}.com" style="color:#FFD700;text-decoration:none;">Contact Support</a></p>
                <p style="margin:18px 0 0 0;font-size:0.95em;color:#555;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
        `;
    }
    /**
     * Generate HTML template for login OTP
     */
    loginTemplate(otp, expiry, brandName) {
        return `
        <div style="background:linear-gradient(135deg,#181818 0%,#232526 100%);min-height:100vh;padding:0;margin:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto 0 auto;background:#181818;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.32);overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
            <tr>
              <td style="padding:0;text-align:center;background:#181818;">
                <div style="padding:32px 0;">
                  <h1 style="color:#FFD700;font-size:2.1em;margin:0;letter-spacing:1px;font-weight:800;">${brandName}</h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px 32px;">
                <h2 style="color:#FFD700;font-size:1.3em;margin:0 0 12px 0;font-weight:700;">Login Verification</h2>
                <p style="color:#ccc;font-size:1.08em;margin:0 0 24px 0;">Use the code below to complete your login securely.</p>
                <div style="margin:32px 0 24px 0;text-align:center;">
                  <span style="display:inline-block;background:linear-gradient(90deg,#FFD700 0%,#B8860B 100%);color:#181818;font-size:2.5em;font-weight:bold;letter-spacing:12px;padding:18px 36px;border-radius:12px;box-shadow:0 2px 8px rgba(255,215,0,0.10);font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <p style="color:#888;font-size:1em;margin:0 0 16px 0;text-align:center;">This code will expire in <b>${Math.floor(expiry/60)} minutes</b>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;text-align:center;color:#aaa;font-size:0.98em;background:#232526;">
                <p style="margin:0 0 8px 0;">If you did not request this, you can safely ignore this email.</p>
                <p style="margin:0;">Need help? <a href="mailto:support@${brandName.toLowerCase().replace(/\s/g,'')}.com" style="color:#FFD700;text-decoration:none;">Contact Support</a></p>
                <p style="margin:18px 0 0 0;font-size:0.95em;color:#555;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
        `;
    }
    /**
     * Generate HTML template for forgot password OTP
     */
    forgotPasswordTemplate(otp, expiry, brandName) {
        return `
        <div style="background:linear-gradient(135deg,#181818 0%,#232526 100%);min-height:100vh;padding:0;margin:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto 0 auto;background:#181818;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.32);overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
            <tr>
              <td style="padding:0;text-align:center;background:#181818;">
                <div style="padding:32px 0;">
                  <h1 style="color:#FFD700;font-size:2.1em;margin:0;letter-spacing:1px;font-weight:800;">${brandName}</h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px 32px;">
                <h2 style="color:#FFD700;font-size:1.3em;margin:0 0 12px 0;font-weight:700;">Password Reset Verification</h2>
                <p style="color:#ccc;font-size:1.08em;margin:0 0 24px 0;">Use the code below to reset your password securely.</p>
                <div style="margin:32px 0 24px 0;text-align:center;">
                  <span style="display:inline-block;background:linear-gradient(90deg,#FFD700 0%,#B8860B 100%);color:#181818;font-size:2.5em;font-weight:bold;letter-spacing:12px;padding:18px 36px;border-radius:12px;box-shadow:0 2px 8px rgba(255,215,0,0.10);font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <p style="color:#888;font-size:1em;margin:0 0 16px 0;text-align:center;">This code will expire in <b>${Math.floor(expiry/60)} minutes</b>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;text-align:center;color:#aaa;font-size:0.98em;background:#232526;">
                <p style="margin:0 0 8px 0;">If you did not request this, you can safely ignore this email.</p>
                <p style="margin:0;">Need help? <a href="mailto:support@${brandName.toLowerCase().replace(/\s/g,'')}.com" style="color:#FFD700;text-decoration:none;">Contact Support</a></p>
                <p style="margin:18px 0 0 0;font-size:0.95em;color:#555;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
        `;
    }
    /**
     * Generate HTML template for 2FA OTP
     */
    twoFATemplate(otp, expiry, brandName) {
        return `
        <div style="background:linear-gradient(135deg,#181818 0%,#232526 100%);min-height:100vh;padding:0;margin:0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:40px auto 0 auto;background:#181818;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.32);overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
            <tr>
              <td style="padding:0;text-align:center;background:#181818;">
                <div style="padding:32px 0;">
                  <h1 style="color:#FFD700;font-size:2.1em;margin:0;letter-spacing:1px;font-weight:800;">${brandName}</h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 24px 32px;">
                <h2 style="color:#FFD700;font-size:1.3em;margin:0 0 12px 0;font-weight:700;">Two-Factor Authentication</h2>
                <p style="color:#ccc;font-size:1.08em;margin:0 0 24px 0;">Use the code below to complete your 2FA verification.</p>
                <div style="margin:32px 0 24px 0;text-align:center;">
                  <span style="display:inline-block;background:linear-gradient(90deg,#FFD700 0%,#B8860B 100%);color:#181818;font-size:2.5em;font-weight:bold;letter-spacing:12px;padding:18px 36px;border-radius:12px;box-shadow:0 2px 8px rgba(255,215,0,0.10);font-family:'Courier New',monospace;">${otp}</span>
                </div>
                <p style="color:#888;font-size:1em;margin:0 0 16px 0;text-align:center;">This code will expire in <b>${Math.floor(expiry/60)} minutes</b>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;text-align:center;color:#aaa;font-size:0.98em;background:#232526;">
                <p style="margin:0 0 8px 0;">If you did not request this, you can safely ignore this email.</p>
                <p style="margin:0;">Need help? <a href="mailto:support@${brandName.toLowerCase().replace(/\s/g,'')}.com" style="color:#FFD700;text-decoration:none;">Contact Support</a></p>
                <p style="margin:18px 0 0 0;font-size:0.95em;color:#555;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </div>
        `;
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
            const emailSubject = `Your ${config.brandName} Verification Code`;
            const emailBody = this.registrationTemplate(otp, expiry, config.brandName);

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
    async sendRegistrationOTP(email, otpLength = 4, expiry = 300) {
        // Registration OTP
        const normalizedEmail = email.toLowerCase().trim();
        const otp = this.generateOTP(otpLength);
        const requestId = this.generateRequestId();
        this.otpStore.set(requestId, {
            otp,
            email: normalizedEmail,
            createdAt: Date.now(),
            expiresAt: Date.now() + (expiry * 1000),
            verified: false
        });
        const emailSubject = `Your ${config.brandName} Registration OTP`;
        const emailBody = this.registrationTemplate(otp, expiry, config.brandName);
        const emailData = {
            recipientsAddress: normalizedEmail,
            subject: emailSubject,
            body: emailBody
        };
        await emailService.sendEmail(emailData);
        return { success: true, requestId, message: 'Registration OTP sent' };
    }

    /**
     * Send OTP for login
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async sendLoginOTP(email, otpLength = 6, expiry = 300) {
        // Login OTP
        const normalizedEmail = email.toLowerCase().trim();
        const otp = this.generateOTP(otpLength);
        const requestId = this.generateRequestId();
        this.otpStore.set(requestId, {
            otp,
            email: normalizedEmail,
            createdAt: Date.now(),
            expiresAt: Date.now() + (expiry * 1000),
            verified: false
        });
        const emailSubject = `Your ${config.brandName} Login OTP`;
        const emailBody = this.loginTemplate(otp, expiry, config.brandName);
        const emailData = {
            recipientsAddress: normalizedEmail,
            subject: emailSubject,
            body: emailBody
        };
        await emailService.sendEmail(emailData);
        return { success: true, requestId, message: 'Login OTP sent' };
    }

    /**
     * Send OTP for 2FA verification
     * @param {string} email - Email address
     * @returns {Promise<Object>} - Response with requestId
     */
    async send2FAOTP(email, otpLength = 6, expiry = 180) {
        // 2FA OTP
        const normalizedEmail = email.toLowerCase().trim();
        const otp = this.generateOTP(otpLength);
        const requestId = this.generateRequestId();
        this.otpStore.set(requestId, {
            otp,
            email: normalizedEmail,
            createdAt: Date.now(),
            expiresAt: Date.now() + (expiry * 1000),
            verified: false
        });
        const emailSubject = `Your ${config.brandName} 2FA OTP`;
        const emailBody = this.twoFATemplate(otp, expiry, config.brandName);
        const emailData = {
            recipientsAddress: normalizedEmail,
            subject: emailSubject,
            body: emailBody
        };
        await emailService.sendEmail(emailData);
        return { success: true, requestId, message: '2FA OTP sent' };
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
