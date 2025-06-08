const Router = require('express').Router();

/**
 * Security Controller
 */
const { securityController } = require('../../controllers');

/**
 * Middlewares
 */
const {
    adminAuthenticateMiddleware,
    userAuthenticateMiddleware,
    validationMiddleware
} = require('../../middlewares');

/**
 * Validations
 */
const { securityValidation } = require('../../validations');

module.exports = () => {

    /***************************
     * PUBLIC ROUTES (Bug Bounty Submission)
     ***************************/
    
    /**
     * Submit bug bounty report
     * Public endpoint for security researchers
     */
    Router.post(
        '/bug-bounty/submit',
        validationMiddleware(securityValidation.submitBugReport, 'body'),
        securityController.submitBugReport
    );

    /**
     * Get bug bounty program information
     */
    Router.get('/bug-bounty/program-info', (req, res) => {
        res.json({
            status: true,
            message: 'Bug bounty program information',
            data: {
                programName: 'HyperTradeAI Bug Bounty Program',
                version: '2.0',
                scope: {
                    inScope: [
                        'Authentication & Authorization Systems',
                        'Payment Processing & Wallet Management',
                        'API Security & Rate Limiting',
                        'Data Validation & Sanitization',
                        'Session Management',
                        'Cryptographic Implementations',
                        'File Upload Security',
                        'Database Security',
                        'Business Logic Flaws',
                        'CSRF/XSS Vulnerabilities'
                    ],
                    outOfScope: [
                        'Social Engineering Attacks',
                        'Physical Security',
                        'DDoS/DoS Attacks',
                        'Third-party Services',
                        'Spam/Phishing',
                        'Self-XSS'
                    ]
                },
                rewards: {
                    critical: '$2,000 - $10,000',
                    high: '$500 - $2,000',
                    medium: '$100 - $500',
                    low: '$25 - $100'
                },
                contact: 'security@hypertradeai.live',
                lastUpdated: '2025-01-01'
            }
        });
    });

    /***************************
     * USER AUTHENTICATED ROUTES
     ***************************/
    Router.use('/user', userAuthenticateMiddleware);

    /**
     * Get user's bug reports
     */
    Router.get('/user/bug-reports', securityController.getBugReports);

    /**
     * Get specific bug report
     */
    Router.get('/user/bug-reports/:reportId', securityController.getBugReport);

    /***************************
     * ADMIN AUTHENTICATED ROUTES
     ***************************/
    Router.use('/admin', adminAuthenticateMiddleware);

    /**
     * Security Dashboard
     */
    Router.get('/admin/dashboard', securityController.getDashboard);

    /**
     * Security Scanning
     */
    Router.post(
        '/admin/scan',
        validationMiddleware(securityValidation.runScan, 'body'),
        securityController.runSecurityScan
    );

    /**
     * Penetration Testing
     */
    Router.post('/admin/pentest', securityController.runPenetrationTest);

    /**
     * Bug Bounty Management
     */
    Router.get('/admin/bug-reports', securityController.getBugReports);
    Router.get('/admin/bug-reports/:reportId', securityController.getBugReport);
    Router.put(
        '/admin/bug-reports/:reportId/status',
        validationMiddleware(securityValidation.updateBugReportStatus, 'body'),
        securityController.updateBugReportStatus
    );

    /**
     * Security Events
     */
    Router.get('/admin/security-events', securityController.getSecurityEvents);

    /**
     * Bug Bounty Statistics
     */
    Router.get('/admin/bug-bounty-stats', securityController.getBugBountyStats);

    /**
     * Security Incident Handling
     */
    Router.post(
        '/admin/handle-incident',
        validationMiddleware(securityValidation.handleIncident, 'body'),
        securityController.handleSecurityIncident
    );

    return Router;
};
