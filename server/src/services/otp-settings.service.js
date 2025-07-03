'use strict';

const { settingDbHandler } = require('./db');
const logger = require('./logger');
const log = new logger('OTPSettingsService').getChildLogger();

/**
 * OTP Settings Service
 * Manages OTP enable/disable functionality
 */
class OTPSettingsService {
    constructor() {
        this.cache = null;
        this.cacheExpiry = null;
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Get OTP settings from database with caching
     * @returns {Promise<Object>} OTP settings
     */
    async getOTPSettings() {
        try {
            // Check cache first
            if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
                return this.cache;
            }

            // Fetch from database
            const otpSettings = await settingDbHandler.getOneByQuery({ name: 'otpSettings' });
            
            let settings;
            if (!otpSettings) {
                // Default settings if not found
                settings = {
                    email_otp_enabled: true,
                    mobile_otp_enabled: true
                };
                log.info('Using default OTP settings');
            } else {
                settings = {
                    email_otp_enabled: otpSettings.extra?.email_otp_enabled ?? true,
                    mobile_otp_enabled: otpSettings.extra?.mobile_otp_enabled ?? true
                };
            }

            // Cache the settings
            this.cache = settings;
            this.cacheExpiry = Date.now() + this.cacheTTL;

            return settings;
        } catch (error) {
            log.error('Error fetching OTP settings:', error);
            // Return default settings on error
            return {
                email_otp_enabled: true,
                mobile_otp_enabled: true
            };
        }
    }

    /**
     * Check if email OTP is enabled
     * @returns {Promise<boolean>} True if email OTP is enabled
     */
    async isEmailOTPEnabled() {
        const settings = await this.getOTPSettings();
        return settings.email_otp_enabled;
    }

    /**
     * Check if mobile OTP is enabled
     * @returns {Promise<boolean>} True if mobile OTP is enabled
     */
    async isMobileOTPEnabled() {
        const settings = await this.getOTPSettings();
        return settings.mobile_otp_enabled;
    }

    /**
     * Clear cache (useful when settings are updated)
     */
    clearCache() {
        this.cache = null;
        this.cacheExpiry = null;
        log.info('OTP settings cache cleared');
    }

    /**
     * Update OTP settings and clear cache
     * @param {Object} settings - New OTP settings
     */
    async updateSettings(settings) {
        try {
            await settingDbHandler.updateOneByQuery(
                { name: 'otpSettings' },
                {
                    $set: {
                        value: 'enabled',
                        extra: settings
                    }
                },
                { upsert: true }
            );
            
            this.clearCache();
            log.info('OTP settings updated:', settings);
        } catch (error) {
            log.error('Error updating OTP settings:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = new OTPSettingsService();
