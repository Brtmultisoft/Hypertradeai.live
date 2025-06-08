'use strict';

const logger = require('../services/logger');
const log = new logger('SecurityMonitor').getChildLogger();
const { userDbHandler, securityEventDbHandler } = require('../services/db');
const config = require('../config/config');
const crypto = require('crypto');
const geoip = require('geoip-lite');

/**
 * Advanced Security Monitoring System
 * Detects and responds to security threats in real-time
 */
class AdvancedSecurityMonitor {
    constructor() {
        this.suspiciousPatterns = new Map();
        this.ipAttempts = new Map();
        this.userAttempts = new Map();
        this.anomalyThresholds = {
            maxLoginAttempts: 5,
            maxApiCalls: 1000,
            maxWithdrawalAttempts: 3,
            suspiciousTimeWindow: 15 * 60 * 1000, // 15 minutes
            geoLocationRadius: 1000 // km
        };
        this.startCleanupInterval();
    }

    /**
     * Monitor authentication attempts
     */
    async monitorAuthAttempt(req, success, userId = null) {
        const ip = this.getClientIP(req);
        const userAgent = req.headers['user-agent'];
        const timestamp = new Date();
        
        try {
            // Track IP-based attempts
            if (!this.ipAttempts.has(ip)) {
                this.ipAttempts.set(ip, []);
            }
            
            const ipAttempts = this.ipAttempts.get(ip);
            ipAttempts.push({ timestamp, success, userId, userAgent });
            
            // Keep only recent attempts
            const recentAttempts = ipAttempts.filter(
                attempt => timestamp - attempt.timestamp < this.anomalyThresholds.suspiciousTimeWindow
            );
            this.ipAttempts.set(ip, recentAttempts);
            
            // Check for suspicious patterns
            await this.detectSuspiciousAuth(ip, recentAttempts, req);
            
            // Log security event
            await this.logSecurityEvent({
                type: 'auth_attempt',
                ip,
                userId,
                success,
                userAgent,
                timestamp,
                geoLocation: this.getGeoLocation(ip)
            });
            
        } catch (error) {
            log.error('Error monitoring auth attempt:', error);
        }
    }

    /**
     * Monitor payment/withdrawal attempts
     */
    async monitorPaymentAttempt(req, type, amount, userId, success = true) {
        const ip = this.getClientIP(req);
        const timestamp = new Date();
        
        try {
            // Track user-based payment attempts
            if (!this.userAttempts.has(userId)) {
                this.userAttempts.set(userId, []);
            }
            
            const userAttempts = this.userAttempts.get(userId);
            userAttempts.push({ timestamp, type, amount, success, ip });
            
            // Keep only recent attempts
            const recentAttempts = userAttempts.filter(
                attempt => timestamp - attempt.timestamp < this.anomalyThresholds.suspiciousTimeWindow
            );
            this.userAttempts.set(userId, recentAttempts);
            
            // Check for suspicious payment patterns
            await this.detectSuspiciousPayment(userId, recentAttempts, req);
            
            // Log security event
            await this.logSecurityEvent({
                type: 'payment_attempt',
                ip,
                userId,
                paymentType: type,
                amount,
                success,
                timestamp,
                geoLocation: this.getGeoLocation(ip)
            });
            
        } catch (error) {
            log.error('Error monitoring payment attempt:', error);
        }
    }

    /**
     * Monitor API usage patterns
     */
    async monitorApiUsage(req, endpoint, responseTime) {
        const ip = this.getClientIP(req);
        const userId = req.user?.sub;
        const timestamp = new Date();
        
        try {
            // Track API usage patterns
            const key = `${ip}_${endpoint}`;
            if (!this.suspiciousPatterns.has(key)) {
                this.suspiciousPatterns.set(key, []);
            }
            
            const patterns = this.suspiciousPatterns.get(key);
            patterns.push({ timestamp, responseTime, userId });
            
            // Keep only recent patterns
            const recentPatterns = patterns.filter(
                pattern => timestamp - pattern.timestamp < this.anomalyThresholds.suspiciousTimeWindow
            );
            this.suspiciousPatterns.set(key, recentPatterns);
            
            // Check for API abuse
            if (recentPatterns.length > this.anomalyThresholds.maxApiCalls) {
                await this.handleSuspiciousActivity('api_abuse', {
                    ip,
                    endpoint,
                    requestCount: recentPatterns.length,
                    userId
                });
            }
            
        } catch (error) {
            log.error('Error monitoring API usage:', error);
        }
    }

    /**
     * Detect suspicious authentication patterns
     */
    async detectSuspiciousAuth(ip, attempts, req) {
        const failedAttempts = attempts.filter(a => !a.success);
        const successfulAttempts = attempts.filter(a => a.success);
        
        // Too many failed attempts
        if (failedAttempts.length >= this.anomalyThresholds.maxLoginAttempts) {
            await this.handleSuspiciousActivity('brute_force_attack', {
                ip,
                failedAttempts: failedAttempts.length,
                timeWindow: this.anomalyThresholds.suspiciousTimeWindow
            });
        }
        
        // Multiple user accounts from same IP
        const uniqueUsers = new Set(attempts.map(a => a.userId).filter(Boolean));
        if (uniqueUsers.size > 10) {
            await this.handleSuspiciousActivity('account_enumeration', {
                ip,
                uniqueUsers: uniqueUsers.size
            });
        }
        
        // Unusual user agent patterns
        const userAgents = new Set(attempts.map(a => a.userAgent));
        if (userAgents.size > 5) {
            await this.handleSuspiciousActivity('user_agent_rotation', {
                ip,
                userAgents: Array.from(userAgents)
            });
        }
    }

    /**
     * Detect suspicious payment patterns
     */
    async detectSuspiciousPayment(userId, attempts, req) {
        const withdrawalAttempts = attempts.filter(a => a.type === 'withdrawal');
        
        // Too many withdrawal attempts
        if (withdrawalAttempts.length >= this.anomalyThresholds.maxWithdrawalAttempts) {
            await this.handleSuspiciousActivity('excessive_withdrawals', {
                userId,
                withdrawalAttempts: withdrawalAttempts.length,
                totalAmount: withdrawalAttempts.reduce((sum, a) => sum + a.amount, 0)
            });
        }
        
        // Large amount withdrawals
        const largeWithdrawals = withdrawalAttempts.filter(a => a.amount > 10000);
        if (largeWithdrawals.length > 0) {
            await this.handleSuspiciousActivity('large_withdrawal', {
                userId,
                amounts: largeWithdrawals.map(a => a.amount)
            });
        }
        
        // Geographic anomaly detection
        const uniqueIPs = [...new Set(attempts.map(a => a.ip))];
        if (uniqueIPs.length > 1) {
            await this.checkGeographicAnomalies(userId, uniqueIPs);
        }
    }

    /**
     * Check for geographic anomalies
     */
    async checkGeographicAnomalies(userId, ips) {
        try {
            const locations = ips.map(ip => {
                const geo = geoip.lookup(ip);
                return geo ? { ip, lat: geo.ll[0], lon: geo.ll[1], country: geo.country } : null;
            }).filter(Boolean);
            
            if (locations.length < 2) return;
            
            // Calculate distances between locations
            for (let i = 0; i < locations.length - 1; i++) {
                for (let j = i + 1; j < locations.length; j++) {
                    const distance = this.calculateDistance(
                        locations[i].lat, locations[i].lon,
                        locations[j].lat, locations[j].lon
                    );
                    
                    if (distance > this.anomalyThresholds.geoLocationRadius) {
                        await this.handleSuspiciousActivity('geographic_anomaly', {
                            userId,
                            locations: [locations[i], locations[j]],
                            distance: Math.round(distance)
                        });
                    }
                }
            }
        } catch (error) {
            log.error('Error checking geographic anomalies:', error);
        }
    }

    /**
     * Handle suspicious activity
     */
    async handleSuspiciousActivity(type, details) {
        try {
            log.warn(`Suspicious activity detected: ${type}`, details);
            
            // Log to security events
            await this.logSecurityEvent({
                type: 'suspicious_activity',
                subType: type,
                details,
                timestamp: new Date(),
                severity: this.getSeverityLevel(type)
            });
            
            // Take automated actions based on severity
            await this.takeAutomatedAction(type, details);
            
            // Send alerts if necessary
            if (this.shouldSendAlert(type)) {
                await this.sendSecurityAlert(type, details);
            }
            
        } catch (error) {
            log.error('Error handling suspicious activity:', error);
        }
    }

    /**
     * Take automated security actions
     */
    async takeAutomatedAction(type, details) {
        switch (type) {
            case 'brute_force_attack':
                // Temporarily block IP
                await this.blockIP(details.ip, 3600000); // 1 hour
                break;
                
            case 'excessive_withdrawals':
                // Temporarily suspend user withdrawals
                await this.suspendUserWithdrawals(details.userId, 24 * 3600000); // 24 hours
                break;
                
            case 'api_abuse':
                // Rate limit IP more aggressively
                await this.enhanceRateLimit(details.ip, 300000); // 5 minutes
                break;
                
            case 'large_withdrawal':
                // Flag for manual review
                await this.flagForManualReview(details.userId, 'large_withdrawal');
                break;
        }
    }

    /**
     * Utility methods
     */
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               req.ip;
    }

    getGeoLocation(ip) {
        try {
            const geo = geoip.lookup(ip);
            return geo ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                timezone: geo.timezone,
                coordinates: geo.ll
            } : null;
        } catch (error) {
            return null;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(deg) {
        return deg * (Math.PI/180);
    }

    getSeverityLevel(type) {
        const severityMap = {
            'brute_force_attack': 'high',
            'account_enumeration': 'medium',
            'excessive_withdrawals': 'high',
            'large_withdrawal': 'medium',
            'api_abuse': 'medium',
            'geographic_anomaly': 'low',
            'user_agent_rotation': 'low'
        };
        return severityMap[type] || 'low';
    }

    shouldSendAlert(type) {
        const alertTypes = ['brute_force_attack', 'excessive_withdrawals', 'large_withdrawal'];
        return alertTypes.includes(type);
    }

    async logSecurityEvent(event) {
        try {
            // Store in database for analysis
            await securityEventDbHandler.create({
                ...event,
                hash: crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex')
            });
        } catch (error) {
            log.error('Error logging security event:', error);
        }
    }

    async sendSecurityAlert(type, details) {
        // Implementation for sending alerts (email, Slack, etc.)
        log.warn(`SECURITY ALERT: ${type}`, details);
    }

    async blockIP(ip, duration) {
        // Implementation for IP blocking
        log.info(`Blocking IP ${ip} for ${duration}ms`);
    }

    async suspendUserWithdrawals(userId, duration) {
        // Implementation for suspending user withdrawals
        log.info(`Suspending withdrawals for user ${userId} for ${duration}ms`);
    }

    async enhanceRateLimit(ip, duration) {
        // Implementation for enhanced rate limiting
        log.info(`Enhanced rate limiting for IP ${ip} for ${duration}ms`);
    }

    async flagForManualReview(userId, reason) {
        // Implementation for flagging users for manual review
        log.info(`Flagging user ${userId} for manual review: ${reason}`);
    }

    startCleanupInterval() {
        // Clean up old data every hour
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000);
    }

    cleanupOldData() {
        const cutoff = Date.now() - this.anomalyThresholds.suspiciousTimeWindow;
        
        // Clean IP attempts
        for (const [ip, attempts] of this.ipAttempts.entries()) {
            const recent = attempts.filter(a => a.timestamp.getTime() > cutoff);
            if (recent.length === 0) {
                this.ipAttempts.delete(ip);
            } else {
                this.ipAttempts.set(ip, recent);
            }
        }
        
        // Clean user attempts
        for (const [userId, attempts] of this.userAttempts.entries()) {
            const recent = attempts.filter(a => a.timestamp.getTime() > cutoff);
            if (recent.length === 0) {
                this.userAttempts.delete(userId);
            } else {
                this.userAttempts.set(userId, recent);
            }
        }
        
        // Clean suspicious patterns
        for (const [key, patterns] of this.suspiciousPatterns.entries()) {
            const recent = patterns.filter(p => p.timestamp.getTime() > cutoff);
            if (recent.length === 0) {
                this.suspiciousPatterns.delete(key);
            } else {
                this.suspiciousPatterns.set(key, recent);
            }
        }
    }
}

// Export singleton instance
module.exports = new AdvancedSecurityMonitor();
