'use strict';
const logger = require('./logger');
const log = new logger('SMSOTPService').getChildLogger();

/**
 * SMS OTP Service - Fallback implementation for mobile OTP
 * This service provides a simple in-memory OTP storage for testing
 * In production, you should integrate with a proper SMS service like Twilio, AWS SNS, etc.
 */
class SMSOTPService {
    constructor() {
        this.otpStorage = new Map(); // In-memory storage for testing
        this.otpExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
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
     * @returns {string} - Unique request ID
     */
    generateRequestId() {
        return 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Send SMS OTP (Mock implementation for testing)
     * @param {string} phoneNumber - Phone number to send OTP
     * @param {number} otpLength - Length of OTP
     * @param {number} expiry - Expiry time in seconds
     * @returns {Promise<Object>} - Response with requestId and OTP (for testing)
     */
    async sendOTP(phoneNumber, otpLength = 4, expiry = 300) {
        try {
            log.info(`Sending SMS OTP to phone: ${phoneNumber}`, { otpLength, expiry });

            // Validate phone number
            if (!phoneNumber) {
                throw new Error('Phone number is required');
            }

            // Normalize phone number
            let normalizedPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
            if (!normalizedPhone.startsWith('+')) {
                if (normalizedPhone.length === 10) {
                    normalizedPhone = '+1' + normalizedPhone;
                } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) {
                    normalizedPhone = '+' + normalizedPhone;
                } else {
                    normalizedPhone = '+1' + normalizedPhone;
                }
            }

            // Generate OTP and request ID
            const otp = this.generateOTP(otpLength);
            const requestId = this.generateRequestId();
            const expiryTime = Date.now() + (expiry * 1000);

            // Store OTP in memory (for testing)
            this.otpStorage.set(requestId, {
                phoneNumber: normalizedPhone,
                otp: otp,
                expiryTime: expiryTime,
                verified: false
            });

            // In a real implementation, you would send SMS here
            // For testing, we'll log the OTP
            log.info('SMS OTP generated (FOR TESTING ONLY):', {
                phoneNumber: normalizedPhone,
                otp: otp,
                requestId: requestId,
                expiryTime: new Date(expiryTime).toISOString()
            });

            // Simulate SMS sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For testing purposes, also log to console
            console.log(`\n🔔 SMS OTP for ${normalizedPhone}: ${otp} (Request ID: ${requestId})\n`);

            return {
                success: true,
                requestId: requestId,
                message: 'OTP sent successfully to your mobile number!',
                phoneNumber: normalizedPhone,
                // Include OTP in response for testing (remove in production)
                testOTP: otp
            };

        } catch (error) {
            log.error('Failed to send SMS OTP:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS OTP'
            };
        }
    }

    /**
     * Verify SMS OTP
     * @param {string} otp - OTP entered by user
     * @param {string} requestId - Request ID from OTP initiation
     * @returns {Promise<Object>} - Verification result
     */
    async verifyOTP(otp, requestId) {
        try {
            log.info(`Verifying SMS OTP for requestId: ${requestId}`, { otpLength: otp.length });

            // Validate inputs
            if (!otp || !requestId) {
                throw new Error('OTP and requestId are required');
            }

            // Get stored OTP data
            const otpData = this.otpStorage.get(requestId);
            if (!otpData) {
                return {
                    success: false,
                    isVerified: false,
                    error: 'Invalid or expired request ID'
                };
            }

            // Check if OTP has expired
            if (Date.now() > otpData.expiryTime) {
                this.otpStorage.delete(requestId);
                return {
                    success: false,
                    isVerified: false,
                    error: 'OTP has expired'
                };
            }

            // Check if OTP has already been verified
            if (otpData.verified) {
                return {
                    success: false,
                    isVerified: false,
                    error: 'OTP has already been used'
                };
            }

            // Verify OTP
            if (otp === otpData.otp) {
                // Mark as verified
                otpData.verified = true;
                this.otpStorage.set(requestId, otpData);

                log.info('SMS OTP verified successfully', { requestId, phoneNumber: otpData.phoneNumber });

                return {
                    success: true,
                    isVerified: true,
                    requestId: requestId,
                    phoneNumber: otpData.phoneNumber,
                    message: 'OTP verified successfully!'
                };
            } else {
                return {
                    success: false,
                    isVerified: false,
                    error: 'Invalid OTP'
                };
            }

        } catch (error) {
            log.error('Failed to verify SMS OTP:', error);
            return {
                success: false,
                isVerified: false,
                error: error.message || 'Failed to verify SMS OTP'
            };
        }
    }

    /**
     * Clean up expired OTPs (should be called periodically)
     */
    cleanupExpiredOTPs() {
        const now = Date.now();
        for (const [requestId, otpData] of this.otpStorage.entries()) {
            if (now > otpData.expiryTime) {
                this.otpStorage.delete(requestId);
                log.info('Cleaned up expired OTP', { requestId, phoneNumber: otpData.phoneNumber });
            }
        }
    }

    /**
     * Get current OTP storage size (for monitoring)
     */
    getStorageSize() {
        return this.otpStorage.size;
    }
}

// Clean up expired OTPs every 10 minutes
const smsOTPService = new SMSOTPService();
setInterval(() => {
    smsOTPService.cleanupExpiredOTPs();
}, 10 * 60 * 1000);

module.exports = smsOTPService;
