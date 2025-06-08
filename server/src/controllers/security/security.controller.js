'use strict';

const logger = require('../../services/logger');
const log = new logger('SecurityController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const SecurityDashboard = require('../../security/security-dashboard');
const VulnerabilityScanner = require('../../security/vulnerability-scanner');
const PenetrationTestingSuite = require('../../security/penetration-testing-suite');
const AdvancedSecurityMonitor = require('../../security/advanced-security-monitor');
const { securityEventDbHandler, bugBountyDbHandler } = require('../../services/db');

/**
 * Security Controller
 * Handles security-related API endpoints for bug bounty program management
 */
module.exports = {

    /**
     * Get security dashboard data
     */
    getDashboard: async (req, res) => {
        let responseData = {};
        try {
            log.info('Getting security dashboard data');
            
            const dashboardData = await SecurityDashboard.getDashboardData();
            
            responseData.msg = 'Security dashboard data retrieved successfully';
            responseData.data = dashboardData;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting security dashboard:', error);
            responseData.msg = 'Failed to retrieve security dashboard data';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Run security scan
     */
    runSecurityScan: async (req, res) => {
        let responseData = {};
        try {
            const { type = 'full' } = req.body;
            
            log.info(`Starting ${type} security scan`);
            
            const scanner = new VulnerabilityScanner();
            const scanResult = await scanner.runFullScan();
            
            responseData.msg = 'Security scan completed successfully';
            responseData.data = {
                scanId: scanResult.scanId,
                summary: scanResult.summary,
                vulnerabilities: scanResult.vulnerabilities.slice(0, 10), // Top 10 for API response
                totalVulnerabilities: scanResult.vulnerabilities.length
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error running security scan:', error);
            responseData.msg = 'Failed to run security scan';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Run penetration test
     */
    runPenetrationTest: async (req, res) => {
        let responseData = {};
        try {
            log.info('Starting penetration test');
            
            const pentestSuite = new PenetrationTestingSuite();
            const testResult = await pentestSuite.runFullPenetrationTest();
            
            responseData.msg = 'Penetration test completed successfully';
            responseData.data = {
                testId: testResult.testId,
                summary: testResult.summary,
                exploits: testResult.exploits.slice(0, 10), // Top 10 for API response
                totalExploits: testResult.exploits.length
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error running penetration test:', error);
            responseData.msg = 'Failed to run penetration test';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Submit bug bounty report
     */
    submitBugReport: async (req, res) => {
        let responseData = {};
        try {
            const {
                title,
                severity,
                category,
                description,
                stepsToReproduce,
                proofOfConcept,
                impact,
                suggestedFix,
                affectedUrls
            } = req.body;
            
            // Validate required fields
            if (!title || !severity || !category || !description || !stepsToReproduce) {
                responseData.msg = 'Missing required fields';
                return responseHelper.error(res, responseData);
            }
            
            // Create bug report
            const bugReport = {
                title,
                severity,
                category,
                description,
                stepsToReproduce,
                proofOfConcept,
                impact,
                suggestedFix,
                affectedUrls: affectedUrls || [],
                submittedBy: req.user?.email || 'anonymous',
                submittedAt: new Date(),
                status: 'submitted',
                reportId: `BR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Store in database
            const savedReport = await bugBountyDbHandler.create(bugReport);
            
            // Log security event
            await securityEventDbHandler.create({
                type: 'bug_report_submitted',
                severity: severity.toLowerCase(),
                details: {
                    reportId: bugReport.reportId,
                    category,
                    submittedBy: bugReport.submittedBy
                },
                timestamp: new Date()
            });
            
            log.info('Bug bounty report submitted', {
                reportId: bugReport.reportId,
                severity,
                category
            });
            
            responseData.msg = 'Bug report submitted successfully';
            responseData.data = {
                reportId: bugReport.reportId,
                status: 'submitted',
                estimatedReward: this.calculateEstimatedReward(severity, category)
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error submitting bug report:', error);
            responseData.msg = 'Failed to submit bug report';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get bug bounty reports
     */
    getBugReports: async (req, res) => {
        let responseData = {};
        try {
            const { status, severity, category, page = 1, limit = 20 } = req.query;
            
            // Build query
            const query = {};
            if (status) query.status = status;
            if (severity) query.severity = severity;
            if (category) query.category = category;
            
            // Get reports with pagination
            const reports = await bugBountyDbHandler.getByQuery(
                query,
                {
                    sort: { submittedAt: -1 },
                    skip: (page - 1) * limit,
                    limit: parseInt(limit)
                }
            );
            
            const totalReports = await bugBountyDbHandler.countByQuery(query);
            
            responseData.msg = 'Bug reports retrieved successfully';
            responseData.data = {
                reports: reports.map(report => ({
                    reportId: report.reportId,
                    title: report.title,
                    severity: report.severity,
                    category: report.category,
                    status: report.status,
                    submittedAt: report.submittedAt,
                    submittedBy: report.submittedBy
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalReports,
                    pages: Math.ceil(totalReports / limit)
                }
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting bug reports:', error);
            responseData.msg = 'Failed to retrieve bug reports';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get specific bug report
     */
    getBugReport: async (req, res) => {
        let responseData = {};
        try {
            const { reportId } = req.params;
            
            const report = await bugBountyDbHandler.getOneByQuery({ reportId });
            
            if (!report) {
                responseData.msg = 'Bug report not found';
                return responseHelper.error(res, responseData);
            }
            
            responseData.msg = 'Bug report retrieved successfully';
            responseData.data = report;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting bug report:', error);
            responseData.msg = 'Failed to retrieve bug report';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Update bug report status (Admin only)
     */
    updateBugReportStatus: async (req, res) => {
        let responseData = {};
        try {
            const { reportId } = req.params;
            const { status, reward, adminNotes } = req.body;
            
            const validStatuses = ['submitted', 'triaging', 'confirmed', 'fixed', 'rejected', 'duplicate'];
            if (!validStatuses.includes(status)) {
                responseData.msg = 'Invalid status';
                return responseHelper.error(res, responseData);
            }
            
            const updateData = {
                status,
                updatedAt: new Date(),
                updatedBy: req.admin?.email || req.user?.email
            };
            
            if (reward) updateData.reward = reward;
            if (adminNotes) updateData.adminNotes = adminNotes;
            
            const updatedReport = await bugBountyDbHandler.updateOneByQuery(
                { reportId },
                { $set: updateData }
            );
            
            if (!updatedReport.modifiedCount) {
                responseData.msg = 'Bug report not found';
                return responseHelper.error(res, responseData);
            }
            
            // Log status change
            await securityEventDbHandler.create({
                type: 'bug_report_status_changed',
                details: {
                    reportId,
                    newStatus: status,
                    updatedBy: updateData.updatedBy,
                    reward
                },
                timestamp: new Date()
            });
            
            log.info('Bug report status updated', {
                reportId,
                status,
                updatedBy: updateData.updatedBy
            });
            
            responseData.msg = 'Bug report status updated successfully';
            responseData.data = { reportId, status, reward };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error updating bug report status:', error);
            responseData.msg = 'Failed to update bug report status';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get security events
     */
    getSecurityEvents: async (req, res) => {
        let responseData = {};
        try {
            const { type, severity, page = 1, limit = 50 } = req.query;
            
            // Build query
            const query = {};
            if (type) query.type = type;
            if (severity) query.severity = severity;
            
            // Get events with pagination
            const events = await securityEventDbHandler.getByQuery(
                query,
                {
                    sort: { timestamp: -1 },
                    skip: (page - 1) * limit,
                    limit: parseInt(limit)
                }
            );
            
            const totalEvents = await securityEventDbHandler.countByQuery(query);
            
            responseData.msg = 'Security events retrieved successfully';
            responseData.data = {
                events,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalEvents,
                    pages: Math.ceil(totalEvents / limit)
                }
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting security events:', error);
            responseData.msg = 'Failed to retrieve security events';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Get bug bounty program statistics
     */
    getBugBountyStats: async (req, res) => {
        let responseData = {};
        try {
            const [
                totalReports,
                confirmedReports,
                fixedReports,
                totalRewards,
                topResearchers
            ] = await Promise.all([
                bugBountyDbHandler.countByQuery({}),
                bugBountyDbHandler.countByQuery({ status: 'confirmed' }),
                bugBountyDbHandler.countByQuery({ status: 'fixed' }),
                this.calculateTotalRewards(),
                this.getTopResearchers()
            ]);
            
            const stats = {
                totalReports,
                confirmedReports,
                fixedReports,
                rejectedReports: await bugBountyDbHandler.countByQuery({ status: 'rejected' }),
                totalRewards,
                averageReward: totalRewards / (confirmedReports || 1),
                topResearchers,
                severityBreakdown: await this.getSeverityBreakdown(),
                categoryBreakdown: await this.getCategoryBreakdown()
            };
            
            responseData.msg = 'Bug bounty statistics retrieved successfully';
            responseData.data = stats;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting bug bounty stats:', error);
            responseData.msg = 'Failed to retrieve bug bounty statistics';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Handle security incident
     */
    handleSecurityIncident: async (req, res) => {
        let responseData = {};
        try {
            const incident = req.body;
            
            const result = await SecurityDashboard.handleSecurityIncident(incident);
            
            responseData.msg = 'Security incident handled successfully';
            responseData.data = result;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error handling security incident:', error);
            responseData.msg = 'Failed to handle security incident';
            return responseHelper.error(res, responseData);
        }
    },

    /**
     * Utility methods
     */
    calculateEstimatedReward(severity, category) {
        const baseRewards = {
            'Critical': 5000,
            'High': 1000,
            'Medium': 300,
            'Low': 50
        };
        
        const categoryMultipliers = {
            'authentication': 1.5,
            'payment': 2.0,
            'authorization': 1.3,
            'injection': 1.8,
            'xss': 1.2,
            'default': 1.0
        };
        
        const baseReward = baseRewards[severity] || 50;
        const multiplier = categoryMultipliers[category] || categoryMultipliers.default;
        
        return Math.round(baseReward * multiplier);
    },

    async calculateTotalRewards() {
        try {
            const reports = await bugBountyDbHandler.getByQuery({ 
                status: { $in: ['confirmed', 'fixed'] },
                reward: { $exists: true }
            });
            
            return reports.reduce((total, report) => total + (report.reward || 0), 0);
        } catch (error) {
            return 0;
        }
    },

    async getTopResearchers() {
        try {
            const reports = await bugBountyDbHandler.getByQuery({
                status: { $in: ['confirmed', 'fixed'] }
            });
            
            const researchers = {};
            reports.forEach(report => {
                if (report.submittedBy && report.submittedBy !== 'anonymous') {
                    if (!researchers[report.submittedBy]) {
                        researchers[report.submittedBy] = {
                            email: report.submittedBy,
                            reports: 0,
                            totalReward: 0
                        };
                    }
                    researchers[report.submittedBy].reports++;
                    researchers[report.submittedBy].totalReward += report.reward || 0;
                }
            });
            
            return Object.values(researchers)
                .sort((a, b) => b.totalReward - a.totalReward)
                .slice(0, 10);
        } catch (error) {
            return [];
        }
    },

    async getSeverityBreakdown() {
        try {
            const severities = ['Critical', 'High', 'Medium', 'Low'];
            const breakdown = {};
            
            for (const severity of severities) {
                breakdown[severity] = await bugBountyDbHandler.countByQuery({ severity });
            }
            
            return breakdown;
        } catch (error) {
            return {};
        }
    },

    async getCategoryBreakdown() {
        try {
            const categories = ['authentication', 'payment', 'authorization', 'injection', 'xss', 'other'];
            const breakdown = {};
            
            for (const category of categories) {
                breakdown[category] = await bugBountyDbHandler.countByQuery({ category });
            }
            
            return breakdown;
        } catch (error) {
            return {};
        }
    }
};
