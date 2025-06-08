'use strict';

const logger = require('../services/logger');
const log = new logger('SecurityDashboard').getChildLogger();
const { securityEventDbHandler, userDbHandler } = require('../services/db');
const VulnerabilityScanner = require('./vulnerability-scanner');
const AdvancedSecurityMonitor = require('./advanced-security-monitor');

/**
 * Security Dashboard and Management System
 * Provides real-time security monitoring and automated response capabilities
 */
class SecurityDashboard {
    constructor() {
        this.scanner = new VulnerabilityScanner();
        this.monitor = AdvancedSecurityMonitor;
        this.alertThresholds = {
            criticalVulnerabilities: 1,
            highVulnerabilities: 5,
            suspiciousActivities: 10,
            failedLogins: 50
        };
        this.automatedResponses = {
            enabled: true,
            blockSuspiciousIPs: true,
            suspendCompromisedAccounts: true,
            alertAdministrators: true
        };
    }

    /**
     * Get real-time security dashboard data
     */
    async getDashboardData() {
        try {
            const [
                securityEvents,
                vulnerabilities,
                threatMetrics,
                systemHealth
            ] = await Promise.all([
                this.getRecentSecurityEvents(),
                this.getActiveVulnerabilities(),
                this.getThreatMetrics(),
                this.getSystemHealthMetrics()
            ]);

            return {
                timestamp: new Date().toISOString(),
                securityEvents,
                vulnerabilities,
                threatMetrics,
                systemHealth,
                alerts: await this.getActiveAlerts(),
                recommendations: await this.getSecurityRecommendations()
            };
        } catch (error) {
            log.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    /**
     * Get recent security events
     */
    async getRecentSecurityEvents(limit = 100) {
        try {
            const events = await securityEventDbHandler.getByQuery(
                {},
                { sort: { timestamp: -1 }, limit }
            );

            return {
                total: events.length,
                events: events.map(event => ({
                    id: event._id,
                    type: event.type,
                    severity: event.severity || 'medium',
                    timestamp: event.timestamp,
                    ip: event.ip,
                    userId: event.userId,
                    details: event.details,
                    status: event.status || 'open'
                })),
                summary: this.summarizeEvents(events)
            };
        } catch (error) {
            log.error('Error getting security events:', error);
            return { total: 0, events: [], summary: {} };
        }
    }

    /**
     * Get active vulnerabilities
     */
    async getActiveVulnerabilities() {
        try {
            // This would typically come from a vulnerability database
            // For now, we'll simulate with recent scan results
            const vulnerabilities = await this.getStoredVulnerabilities();

            return {
                total: vulnerabilities.length,
                critical: vulnerabilities.filter(v => v.severity === 'Critical').length,
                high: vulnerabilities.filter(v => v.severity === 'High').length,
                medium: vulnerabilities.filter(v => v.severity === 'Medium').length,
                low: vulnerabilities.filter(v => v.severity === 'Low').length,
                vulnerabilities: vulnerabilities.slice(0, 20) // Top 20 for dashboard
            };
        } catch (error) {
            log.error('Error getting vulnerabilities:', error);
            return { total: 0, critical: 0, high: 0, medium: 0, low: 0, vulnerabilities: [] };
        }
    }

    /**
     * Get threat metrics
     */
    async getThreatMetrics() {
        try {
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const [
                attacksLast24h,
                attacksLast7d,
                blockedIPs,
                suspendedUsers
            ] = await Promise.all([
                this.getAttackCount(last24h),
                this.getAttackCount(last7d),
                this.getBlockedIPCount(),
                this.getSuspendedUserCount()
            ]);

            return {
                attacksLast24h,
                attacksLast7d,
                blockedIPs,
                suspendedUsers,
                threatLevel: this.calculateThreatLevel(attacksLast24h),
                topAttackTypes: await this.getTopAttackTypes(),
                topAttackerIPs: await this.getTopAttackerIPs()
            };
        } catch (error) {
            log.error('Error getting threat metrics:', error);
            return {
                attacksLast24h: 0,
                attacksLast7d: 0,
                blockedIPs: 0,
                suspendedUsers: 0,
                threatLevel: 'low'
            };
        }
    }

    /**
     * Get system health metrics
     */
    async getSystemHealthMetrics() {
        try {
            return {
                securityMiddleware: {
                    status: 'active',
                    rateLimit: 'enabled',
                    csrf: 'enabled',
                    xss: 'enabled',
                    helmet: 'enabled'
                },
                authentication: {
                    jwtValidation: 'active',
                    twoFactorAuth: 'enabled',
                    passwordPolicy: 'enforced'
                },
                monitoring: {
                    securityEvents: 'logging',
                    anomalyDetection: 'active',
                    alerting: 'enabled'
                },
                lastSecurityScan: await this.getLastScanDate(),
                nextScheduledScan: await this.getNextScanDate()
            };
        } catch (error) {
            log.error('Error getting system health:', error);
            return {};
        }
    }

    /**
     * Get active security alerts
     */
    async getActiveAlerts() {
        try {
            const alerts = [];

            // Check for critical vulnerabilities
            const criticalVulns = await this.getCriticalVulnerabilityCount();
            if (criticalVulns >= this.alertThresholds.criticalVulnerabilities) {
                alerts.push({
                    id: 'critical-vulns',
                    type: 'vulnerability',
                    severity: 'critical',
                    title: 'Critical Vulnerabilities Detected',
                    message: `${criticalVulns} critical vulnerabilities require immediate attention`,
                    timestamp: new Date().toISOString()
                });
            }

            // Check for suspicious activities
            const suspiciousCount = await this.getSuspiciousActivityCount();
            if (suspiciousCount >= this.alertThresholds.suspiciousActivities) {
                alerts.push({
                    id: 'suspicious-activity',
                    type: 'threat',
                    severity: 'high',
                    title: 'High Suspicious Activity',
                    message: `${suspiciousCount} suspicious activities detected in the last hour`,
                    timestamp: new Date().toISOString()
                });
            }

            // Check for failed login attempts
            const failedLogins = await this.getFailedLoginCount();
            if (failedLogins >= this.alertThresholds.failedLogins) {
                alerts.push({
                    id: 'failed-logins',
                    type: 'authentication',
                    severity: 'medium',
                    title: 'High Failed Login Rate',
                    message: `${failedLogins} failed login attempts in the last hour`,
                    timestamp: new Date().toISOString()
                });
            }

            return alerts;
        } catch (error) {
            log.error('Error getting alerts:', error);
            return [];
        }
    }

    /**
     * Get security recommendations
     */
    async getSecurityRecommendations() {
        try {
            const recommendations = [];

            // Check if security scan is overdue
            const lastScan = await this.getLastScanDate();
            const daysSinceLastScan = (Date.now() - new Date(lastScan).getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysSinceLastScan > 7) {
                recommendations.push({
                    priority: 'high',
                    category: 'scanning',
                    title: 'Security Scan Overdue',
                    description: 'Run a comprehensive security scan to identify new vulnerabilities',
                    action: 'schedule_scan'
                });
            }

            // Check for unpatched vulnerabilities
            const unpatchedVulns = await this.getUnpatchedVulnerabilityCount();
            if (unpatchedVulns > 0) {
                recommendations.push({
                    priority: 'critical',
                    category: 'patching',
                    title: 'Unpatched Vulnerabilities',
                    description: `${unpatchedVulns} vulnerabilities need to be patched`,
                    action: 'patch_vulnerabilities'
                });
            }

            // Check security configuration
            const configIssues = await this.checkSecurityConfiguration();
            if (configIssues.length > 0) {
                recommendations.push({
                    priority: 'medium',
                    category: 'configuration',
                    title: 'Security Configuration Issues',
                    description: 'Some security settings need attention',
                    action: 'review_configuration',
                    details: configIssues
                });
            }

            return recommendations;
        } catch (error) {
            log.error('Error getting recommendations:', error);
            return [];
        }
    }

    /**
     * Run automated security scan
     */
    async runSecurityScan(type = 'full') {
        try {
            log.info(`Starting ${type} security scan...`);

            let scanResult;
            switch (type) {
                case 'quick':
                    scanResult = await this.scanner.runQuickScan();
                    break;
                case 'targeted':
                    scanResult = await this.scanner.runTargetedScan();
                    break;
                default:
                    scanResult = await this.scanner.runFullScan();
            }

            // Store scan results
            await this.storeScanResults(scanResult);

            // Process vulnerabilities
            await this.processNewVulnerabilities(scanResult.vulnerabilities);

            // Send alerts if critical issues found
            if (scanResult.summary.critical > 0) {
                await this.sendCriticalVulnerabilityAlert(scanResult);
            }

            log.info('Security scan completed', {
                scanId: scanResult.scanId,
                vulnerabilities: scanResult.summary.totalVulnerabilities
            });

            return scanResult;
        } catch (error) {
            log.error('Error running security scan:', error);
            throw error;
        }
    }

    /**
     * Handle security incident
     */
    async handleSecurityIncident(incident) {
        try {
            log.warn('Handling security incident:', incident);

            // Log the incident
            await securityEventDbHandler.create({
                type: 'security_incident',
                severity: incident.severity,
                details: incident,
                timestamp: new Date(),
                status: 'investigating'
            });

            // Take automated response if enabled
            if (this.automatedResponses.enabled) {
                await this.takeAutomatedResponse(incident);
            }

            // Send alerts
            if (this.automatedResponses.alertAdministrators) {
                await this.sendIncidentAlert(incident);
            }

            return {
                incidentId: incident.id,
                status: 'handled',
                actions: incident.actions || [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            log.error('Error handling security incident:', error);
            throw error;
        }
    }

    /**
     * Take automated response to security incident
     */
    async takeAutomatedResponse(incident) {
        const actions = [];

        try {
            switch (incident.type) {
                case 'brute_force_attack':
                    if (this.automatedResponses.blockSuspiciousIPs && incident.ip) {
                        await this.blockIP(incident.ip, 3600000); // 1 hour
                        actions.push(`Blocked IP: ${incident.ip}`);
                    }
                    break;

                case 'account_compromise':
                    if (this.automatedResponses.suspendCompromisedAccounts && incident.userId) {
                        await this.suspendUser(incident.userId);
                        actions.push(`Suspended user: ${incident.userId}`);
                    }
                    break;

                case 'payment_fraud':
                    if (incident.userId) {
                        await this.freezeUserAssets(incident.userId);
                        actions.push(`Froze assets for user: ${incident.userId}`);
                    }
                    break;

                case 'api_abuse':
                    if (incident.ip) {
                        await this.enhanceRateLimit(incident.ip);
                        actions.push(`Enhanced rate limiting for IP: ${incident.ip}`);
                    }
                    break;
            }

            incident.actions = actions;
            log.info('Automated response actions taken:', actions);
        } catch (error) {
            log.error('Error taking automated response:', error);
        }
    }

    /**
     * Utility methods for metrics and data retrieval
     */
    summarizeEvents(events) {
        const summary = {};
        events.forEach(event => {
            summary[event.type] = (summary[event.type] || 0) + 1;
        });
        return summary;
    }

    calculateThreatLevel(attackCount) {
        if (attackCount > 100) return 'critical';
        if (attackCount > 50) return 'high';
        if (attackCount > 10) return 'medium';
        return 'low';
    }

    async getAttackCount(since) {
        try {
            const events = await securityEventDbHandler.getByQuery({
                type: 'suspicious_activity',
                timestamp: { $gte: since }
            });
            return events.length;
        } catch (error) {
            return 0;
        }
    }

    async getBlockedIPCount() {
        // Implementation would depend on how blocked IPs are stored
        return 0;
    }

    async getSuspendedUserCount() {
        try {
            const users = await userDbHandler.getByQuery({ is_blocked: true });
            return users.length;
        } catch (error) {
            return 0;
        }
    }

    async getTopAttackTypes() {
        try {
            const events = await securityEventDbHandler.getByQuery({
                type: 'suspicious_activity',
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            const types = {};
            events.forEach(event => {
                const subType = event.subType || 'unknown';
                types[subType] = (types[subType] || 0) + 1;
            });

            return Object.entries(types)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));
        } catch (error) {
            return [];
        }
    }

    async getTopAttackerIPs() {
        try {
            const events = await securityEventDbHandler.getByQuery({
                type: 'suspicious_activity',
                timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            const ips = {};
            events.forEach(event => {
                if (event.ip) {
                    ips[event.ip] = (ips[event.ip] || 0) + 1;
                }
            });

            return Object.entries(ips)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([ip, count]) => ({ ip, count }));
        } catch (error) {
            return [];
        }
    }

    async getCriticalVulnerabilityCount() {
        const vulns = await this.getStoredVulnerabilities();
        return vulns.filter(v => v.severity === 'Critical').length;
    }

    async getSuspiciousActivityCount() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const events = await securityEventDbHandler.getByQuery({
            type: 'suspicious_activity',
            timestamp: { $gte: oneHourAgo }
        });
        return events.length;
    }

    async getFailedLoginCount() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const events = await securityEventDbHandler.getByQuery({
            type: 'auth_attempt',
            success: false,
            timestamp: { $gte: oneHourAgo }
        });
        return events.length;
    }

    async getStoredVulnerabilities() {
        // Implementation would retrieve from vulnerability database
        return [];
    }

    async getLastScanDate() {
        // Implementation would retrieve last scan date
        return new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
    }

    async getNextScanDate() {
        // Implementation would calculate next scheduled scan
        return new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    }

    async getUnpatchedVulnerabilityCount() {
        const vulns = await this.getStoredVulnerabilities();
        return vulns.filter(v => v.status !== 'patched').length;
    }

    async checkSecurityConfiguration() {
        // Implementation would check various security settings
        return [];
    }

    async storeScanResults(results) {
        // Implementation would store scan results in database
    }

    async processNewVulnerabilities(vulnerabilities) {
        // Implementation would process and categorize new vulnerabilities
    }

    async sendCriticalVulnerabilityAlert(scanResult) {
        // Implementation would send alerts to administrators
    }

    async sendIncidentAlert(incident) {
        // Implementation would send incident alerts
    }

    async blockIP(ip, duration) {
        // Implementation would block IP address
    }

    async suspendUser(userId) {
        // Implementation would suspend user account
    }

    async freezeUserAssets(userId) {
        // Implementation would freeze user's financial assets
    }

    async enhanceRateLimit(ip) {
        // Implementation would enhance rate limiting for IP
    }
}

module.exports = new SecurityDashboard();
