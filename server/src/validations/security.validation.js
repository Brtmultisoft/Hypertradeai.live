const JoiBase = require('@hapi/joi');
const JoiDate = require("@hapi/joi-date");

const Joi = JoiBase.extend(JoiDate);
const { objectId } = require('./custom.validation');

/**
 * JOI Validation Schema for Security Routes
 */
module.exports = {
    
    /**
     * Bug bounty report submission validation
     */
    submitBugReport: Joi.object().keys({
        title: Joi.string().trim().required().min(10).max(200).label("Title"),
        severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').required().label("Severity"),
        category: Joi.string().valid(
            'authentication', 
            'authorization', 
            'payment', 
            'injection', 
            'xss', 
            'csrf', 
            'session', 
            'crypto', 
            'file_upload', 
            'api', 
            'business_logic', 
            'other'
        ).required().label("Category"),
        description: Joi.string().trim().required().min(50).max(5000).label("Description"),
        stepsToReproduce: Joi.string().trim().required().min(20).max(3000).label("Steps to Reproduce"),
        proofOfConcept: Joi.string().trim().optional().max(2000).label("Proof of Concept"),
        impact: Joi.string().trim().optional().max(1000).label("Impact"),
        suggestedFix: Joi.string().trim().optional().max(1000).label("Suggested Fix"),
        affectedUrls: Joi.array().items(Joi.string().uri()).optional().label("Affected URLs"),
        contactEmail: Joi.string().email().optional().label("Contact Email")
    }),

    /**
     * Update bug report status validation
     */
    updateBugReportStatus: Joi.object().keys({
        status: Joi.string().valid(
            'submitted', 
            'triaging', 
            'confirmed', 
            'fixed', 
            'rejected', 
            'duplicate'
        ).required().label("Status"),
        reward: Joi.number().positive().max(50000).optional().label("Reward"),
        adminNotes: Joi.string().trim().optional().max(2000).label("Admin Notes"),
        fixedVersion: Joi.string().trim().optional().max(50).label("Fixed Version"),
        publicDisclosure: Joi.boolean().optional().label("Public Disclosure")
    }),

    /**
     * Security scan validation
     */
    runScan: Joi.object().keys({
        type: Joi.string().valid('quick', 'full', 'targeted').optional().default('full').label("Scan Type"),
        targets: Joi.array().items(Joi.string().uri()).optional().label("Target URLs"),
        depth: Joi.number().integer().min(1).max(5).optional().default(3).label("Scan Depth"),
        includePassive: Joi.boolean().optional().default(true).label("Include Passive Checks"),
        excludePatterns: Joi.array().items(Joi.string()).optional().label("Exclude Patterns")
    }),

    /**
     * Security incident handling validation
     */
    handleIncident: Joi.object().keys({
        id: Joi.string().required().label("Incident ID"),
        type: Joi.string().valid(
            'brute_force_attack',
            'account_compromise',
            'payment_fraud',
            'api_abuse',
            'data_breach',
            'malware_detected',
            'unauthorized_access',
            'other'
        ).required().label("Incident Type"),
        severity: Joi.string().valid('critical', 'high', 'medium', 'low').required().label("Severity"),
        description: Joi.string().trim().required().min(10).max(2000).label("Description"),
        affectedSystems: Joi.array().items(Joi.string()).optional().label("Affected Systems"),
        affectedUsers: Joi.array().items(Joi.string()).optional().label("Affected Users"),
        ip: Joi.string().ip().optional().label("IP Address"),
        userId: Joi.string().custom(objectId).optional().label("User ID"),
        timestamp: Joi.date().optional().default(Date.now).label("Timestamp"),
        evidence: Joi.array().items(Joi.string()).optional().label("Evidence"),
        immediateActions: Joi.array().items(Joi.string()).optional().label("Immediate Actions")
    }),

    /**
     * Security event query validation
     */
    getSecurityEvents: Joi.object().keys({
        type: Joi.string().optional().label("Event Type"),
        severity: Joi.string().valid('critical', 'high', 'medium', 'low').optional().label("Severity"),
        startDate: Joi.date().optional().label("Start Date"),
        endDate: Joi.date().optional().label("End Date"),
        ip: Joi.string().ip().optional().label("IP Address"),
        userId: Joi.string().custom(objectId).optional().label("User ID"),
        page: Joi.number().integer().min(1).optional().default(1).label("Page"),
        limit: Joi.number().integer().min(1).max(100).optional().default(50).label("Limit")
    }),

    /**
     * Bug report query validation
     */
    getBugReports: Joi.object().keys({
        status: Joi.string().valid(
            'submitted', 
            'triaging', 
            'confirmed', 
            'fixed', 
            'rejected', 
            'duplicate'
        ).optional().label("Status"),
        severity: Joi.string().valid('Critical', 'High', 'Medium', 'Low').optional().label("Severity"),
        category: Joi.string().valid(
            'authentication', 
            'authorization', 
            'payment', 
            'injection', 
            'xss', 
            'csrf', 
            'session', 
            'crypto', 
            'file_upload', 
            'api', 
            'business_logic', 
            'other'
        ).optional().label("Category"),
        submittedBy: Joi.string().email().optional().label("Submitted By"),
        startDate: Joi.date().optional().label("Start Date"),
        endDate: Joi.date().optional().label("End Date"),
        page: Joi.number().integer().min(1).optional().default(1).label("Page"),
        limit: Joi.number().integer().min(1).max(100).optional().default(20).label("Limit")
    }),

    /**
     * Vulnerability assessment validation
     */
    assessVulnerability: Joi.object().keys({
        vulnerabilityId: Joi.string().required().label("Vulnerability ID"),
        assessment: Joi.string().valid('confirmed', 'false_positive', 'needs_review').required().label("Assessment"),
        priority: Joi.string().valid('critical', 'high', 'medium', 'low').optional().label("Priority"),
        assignedTo: Joi.string().email().optional().label("Assigned To"),
        dueDate: Joi.date().optional().label("Due Date"),
        notes: Joi.string().trim().optional().max(2000).label("Notes"),
        tags: Joi.array().items(Joi.string()).optional().label("Tags")
    }),

    /**
     * Security configuration validation
     */
    updateSecurityConfig: Joi.object().keys({
        rateLimit: Joi.object().keys({
            enabled: Joi.boolean().required(),
            windowMs: Joi.number().integer().min(1000).max(3600000).optional(),
            max: Joi.number().integer().min(1).max(10000).optional()
        }).optional(),
        authentication: Joi.object().keys({
            jwtExpiration: Joi.string().optional(),
            twoFactorRequired: Joi.boolean().optional(),
            passwordMinLength: Joi.number().integer().min(6).max(50).optional(),
            maxLoginAttempts: Joi.number().integer().min(1).max(20).optional()
        }).optional(),
        monitoring: Joi.object().keys({
            logLevel: Joi.string().valid('error', 'warn', 'info', 'debug').optional(),
            alertThresholds: Joi.object().optional(),
            anomalyDetection: Joi.boolean().optional()
        }).optional()
    }),

    /**
     * Penetration test configuration validation
     */
    configurePentest: Joi.object().keys({
        scope: Joi.array().items(Joi.string().uri()).required().label("Test Scope"),
        excludeUrls: Joi.array().items(Joi.string().uri()).optional().label("Exclude URLs"),
        testTypes: Joi.array().items(Joi.string().valid(
            'authentication',
            'authorization', 
            'input_validation',
            'session_management',
            'business_logic',
            'api_security',
            'file_upload',
            'payment_security'
        )).optional().label("Test Types"),
        intensity: Joi.string().valid('low', 'medium', 'high').optional().default('medium').label("Test Intensity"),
        maxConcurrency: Joi.number().integer().min(1).max(20).optional().default(5).label("Max Concurrency"),
        timeout: Joi.number().integer().min(5000).max(300000).optional().default(30000).label("Timeout"),
        credentials: Joi.object().keys({
            username: Joi.string().optional(),
            password: Joi.string().optional(),
            token: Joi.string().optional()
        }).optional().label("Test Credentials")
    }),

    /**
     * Security alert configuration validation
     */
    configureAlerts: Joi.object().keys({
        email: Joi.object().keys({
            enabled: Joi.boolean().required(),
            recipients: Joi.array().items(Joi.string().email()).optional(),
            severity: Joi.string().valid('critical', 'high', 'medium', 'low').optional()
        }).optional(),
        slack: Joi.object().keys({
            enabled: Joi.boolean().required(),
            webhook: Joi.string().uri().optional(),
            channel: Joi.string().optional()
        }).optional(),
        sms: Joi.object().keys({
            enabled: Joi.boolean().required(),
            numbers: Joi.array().items(Joi.string()).optional(),
            severity: Joi.string().valid('critical', 'high').optional()
        }).optional()
    }),

    /**
     * Security metrics query validation
     */
    getSecurityMetrics: Joi.object().keys({
        timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d').optional().default('24h').label("Time Range"),
        metrics: Joi.array().items(Joi.string().valid(
            'attacks',
            'vulnerabilities',
            'incidents',
            'blocked_ips',
            'failed_logins',
            'api_abuse'
        )).optional().label("Metrics"),
        groupBy: Joi.string().valid('hour', 'day', 'week').optional().label("Group By")
    })
};
