#!/usr/bin/env node
'use strict';

/**
 * Security Test Runner
 * Automated security testing and bug bounty preparation script
 */

const logger = require('../services/logger');
const log = new logger('SecurityTestRunner').getChildLogger();
const VulnerabilityScanner = require('./vulnerability-scanner');
const PenetrationTestingSuite = require('./penetration-testing-suite');
const SecurityDashboard = require('./security-dashboard');
const fs = require('fs').promises;
const path = require('path');

class SecurityTestRunner {
    constructor() {
        this.config = {
            outputDir: path.join(__dirname, 'reports'),
            testEnvironment: process.env.SECURITY_TEST_ENV || 'staging',
            baseUrl: process.env.SECURITY_TEST_URL || 'http://localhost:3000',
            parallel: true,
            generateReport: true,
            sendAlerts: false
        };
        
        this.testSuites = {
            vulnerability: new VulnerabilityScanner(),
            penetration: new PenetrationTestingSuite(),
            dashboard: SecurityDashboard
        };
        
        this.results = {
            startTime: null,
            endTime: null,
            duration: null,
            summary: {},
            vulnerabilities: [],
            exploits: [],
            recommendations: []
        };
    }

    /**
     * Run all security tests
     */
    async runAllTests() {
        try {
            console.log('🔒 Starting HyperTradeAI Security Test Suite');
            console.log('=' .repeat(50));
            
            this.results.startTime = new Date();
            
            // Ensure output directory exists
            await fs.mkdir(this.config.outputDir, { recursive: true });
            
            // Run test suites
            if (this.config.parallel) {
                await this.runTestsInParallel();
            } else {
                await this.runTestsSequentially();
            }
            
            this.results.endTime = new Date();
            this.results.duration = this.results.endTime - this.results.startTime;
            
            // Generate comprehensive report
            if (this.config.generateReport) {
                await this.generateComprehensiveReport();
            }
            
            // Display summary
            this.displaySummary();
            
            // Send alerts if critical issues found
            if (this.config.sendAlerts && this.hasCriticalIssues()) {
                await this.sendSecurityAlerts();
            }
            
            console.log('\n✅ Security testing completed successfully');
            return this.results;
            
        } catch (error) {
            console.error('❌ Security testing failed:', error.message);
            log.error('Security testing failed:', error);
            throw error;
        }
    }

    /**
     * Run tests in parallel for faster execution
     */
    async runTestsInParallel() {
        console.log('🚀 Running tests in parallel...\n');
        
        const testPromises = [
            this.runVulnerabilityScanning(),
            this.runPenetrationTesting(),
            this.runSecurityDashboardTests()
        ];
        
        const results = await Promise.allSettled(testPromises);
        
        // Process results
        results.forEach((result, index) => {
            const testNames = ['Vulnerability Scanning', 'Penetration Testing', 'Dashboard Tests'];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${testNames[index]} completed`);
            } else {
                console.log(`❌ ${testNames[index]} failed: ${result.reason.message}`);
                log.error(`${testNames[index]} failed:`, result.reason);
            }
        });
    }

    /**
     * Run tests sequentially for detailed monitoring
     */
    async runTestsSequentially() {
        console.log('🔄 Running tests sequentially...\n');
        
        try {
            await this.runVulnerabilityScanning();
            console.log('✅ Vulnerability scanning completed\n');
        } catch (error) {
            console.log('❌ Vulnerability scanning failed\n');
            log.error('Vulnerability scanning failed:', error);
        }
        
        try {
            await this.runPenetrationTesting();
            console.log('✅ Penetration testing completed\n');
        } catch (error) {
            console.log('❌ Penetration testing failed\n');
            log.error('Penetration testing failed:', error);
        }
        
        try {
            await this.runSecurityDashboardTests();
            console.log('✅ Dashboard tests completed\n');
        } catch (error) {
            console.log('❌ Dashboard tests failed\n');
            log.error('Dashboard tests failed:', error);
        }
    }

    /**
     * Run vulnerability scanning
     */
    async runVulnerabilityScanning() {
        console.log('🔍 Running vulnerability scan...');
        
        const scanResult = await this.testSuites.vulnerability.runFullScan();
        
        this.results.vulnerabilities = scanResult.vulnerabilities;
        this.results.summary.vulnerabilityScanning = {
            total: scanResult.summary.totalVulnerabilities,
            critical: scanResult.summary.critical,
            high: scanResult.summary.high,
            medium: scanResult.summary.medium,
            low: scanResult.summary.low
        };
        
        console.log(`   Found ${scanResult.summary.totalVulnerabilities} vulnerabilities`);
        console.log(`   Critical: ${scanResult.summary.critical}, High: ${scanResult.summary.high}`);
        
        return scanResult;
    }

    /**
     * Run penetration testing
     */
    async runPenetrationTesting() {
        console.log('🎯 Running penetration tests...');
        
        const pentestResult = await this.testSuites.penetration.runFullPenetrationTest();
        
        this.results.exploits = pentestResult.exploits;
        this.results.summary.penetrationTesting = {
            totalExploits: pentestResult.summary.totalExploits,
            criticalFindings: pentestResult.summary.criticalFindings,
            highFindings: pentestResult.summary.highFindings,
            mediumFindings: pentestResult.summary.mediumFindings,
            lowFindings: pentestResult.summary.lowFindings
        };
        
        console.log(`   Found ${pentestResult.summary.totalExploits} exploitable vulnerabilities`);
        console.log(`   Critical: ${pentestResult.summary.criticalFindings}, High: ${pentestResult.summary.highFindings}`);
        
        return pentestResult;
    }

    /**
     * Run security dashboard tests
     */
    async runSecurityDashboardTests() {
        console.log('📊 Running dashboard tests...');
        
        const dashboardData = await this.testSuites.dashboard.getDashboardData();
        
        this.results.summary.dashboard = {
            securityEvents: dashboardData.securityEvents.total,
            activeVulnerabilities: dashboardData.vulnerabilities.total,
            threatLevel: dashboardData.threatMetrics.threatLevel,
            alerts: dashboardData.alerts.length
        };
        
        console.log(`   Security events: ${dashboardData.securityEvents.total}`);
        console.log(`   Active vulnerabilities: ${dashboardData.vulnerabilities.total}`);
        console.log(`   Threat level: ${dashboardData.threatMetrics.threatLevel}`);
        
        return dashboardData;
    }

    /**
     * Generate comprehensive security report
     */
    async generateComprehensiveReport() {
        console.log('📝 Generating comprehensive report...');
        
        const report = {
            metadata: {
                testSuite: 'HyperTradeAI Security Test Suite',
                version: '2.0',
                environment: this.config.testEnvironment,
                baseUrl: this.config.baseUrl,
                startTime: this.results.startTime,
                endTime: this.results.endTime,
                duration: this.results.duration,
                generatedAt: new Date().toISOString()
            },
            executive_summary: this.generateExecutiveSummary(),
            detailed_findings: {
                vulnerabilities: this.results.vulnerabilities,
                exploits: this.results.exploits,
                security_events: this.results.summary.dashboard
            },
            risk_assessment: this.generateRiskAssessment(),
            recommendations: this.generateRecommendations(),
            compliance_status: this.generateComplianceStatus(),
            next_steps: this.generateNextSteps()
        };
        
        // Save report in multiple formats
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // JSON report
        const jsonPath = path.join(this.config.outputDir, `security-report-${timestamp}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
        
        // Markdown report
        const markdownPath = path.join(this.config.outputDir, `security-report-${timestamp}.md`);
        await fs.writeFile(markdownPath, this.generateMarkdownReport(report));
        
        // CSV summary
        const csvPath = path.join(this.config.outputDir, `security-summary-${timestamp}.csv`);
        await fs.writeFile(csvPath, this.generateCSVSummary());
        
        console.log(`   Reports saved to: ${this.config.outputDir}`);
        
        return report;
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary() {
        const totalVulns = this.results.vulnerabilities.length;
        const totalExploits = this.results.exploits.length;
        const criticalIssues = this.getCriticalIssuesCount();
        
        return {
            overview: `Security assessment identified ${totalVulns} vulnerabilities and ${totalExploits} exploitable issues.`,
            risk_level: this.calculateOverallRiskLevel(),
            critical_issues: criticalIssues,
            immediate_actions_required: criticalIssues > 0,
            compliance_status: this.calculateComplianceScore(),
            key_findings: this.getKeyFindings()
        };
    }

    /**
     * Generate risk assessment
     */
    generateRiskAssessment() {
        return {
            overall_risk: this.calculateOverallRiskLevel(),
            risk_factors: this.identifyRiskFactors(),
            business_impact: this.assessBusinessImpact(),
            likelihood: this.assessLikelihood(),
            mitigation_priority: this.prioritizeMitigation()
        };
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Critical vulnerabilities
        if (this.getCriticalVulnerabilitiesCount() > 0) {
            recommendations.push({
                priority: 'Critical',
                category: 'Vulnerability Management',
                title: 'Address Critical Vulnerabilities',
                description: 'Immediately patch or mitigate all critical vulnerabilities',
                timeline: 'Within 24 hours'
            });
        }
        
        // Authentication issues
        if (this.hasAuthenticationIssues()) {
            recommendations.push({
                priority: 'High',
                category: 'Authentication',
                title: 'Strengthen Authentication',
                description: 'Implement stronger authentication mechanisms and 2FA',
                timeline: 'Within 1 week'
            });
        }
        
        // Payment security
        if (this.hasPaymentSecurityIssues()) {
            recommendations.push({
                priority: 'Critical',
                category: 'Payment Security',
                title: 'Secure Payment Processing',
                description: 'Implement additional payment security controls',
                timeline: 'Within 48 hours'
            });
        }
        
        return recommendations;
    }

    /**
     * Display test summary
     */
    displaySummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 SECURITY TEST SUMMARY');
        console.log('='.repeat(50));
        
        console.log(`⏱️  Duration: ${Math.round(this.results.duration / 1000)}s`);
        console.log(`🔍 Vulnerabilities: ${this.results.vulnerabilities.length}`);
        console.log(`🎯 Exploits: ${this.results.exploits.length}`);
        console.log(`⚠️  Critical Issues: ${this.getCriticalIssuesCount()}`);
        console.log(`📈 Risk Level: ${this.calculateOverallRiskLevel()}`);
        
        if (this.hasCriticalIssues()) {
            console.log('\n🚨 CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED');
        }
        
        console.log('\n📁 Reports generated in:', this.config.outputDir);
    }

    /**
     * Utility methods
     */
    hasCriticalIssues() {
        return this.getCriticalIssuesCount() > 0;
    }

    getCriticalIssuesCount() {
        const criticalVulns = this.results.vulnerabilities.filter(v => v.severity === 'Critical').length;
        const criticalExploits = this.results.exploits.filter(e => e.severity === 'Critical').length;
        return criticalVulns + criticalExploits;
    }

    getCriticalVulnerabilitiesCount() {
        return this.results.vulnerabilities.filter(v => v.severity === 'Critical').length;
    }

    hasAuthenticationIssues() {
        return this.results.vulnerabilities.some(v => v.type.toLowerCase().includes('auth')) ||
               this.results.exploits.some(e => e.type.toLowerCase().includes('auth'));
    }

    hasPaymentSecurityIssues() {
        return this.results.vulnerabilities.some(v => v.endpoint?.includes('withdrawal') || v.endpoint?.includes('deposit')) ||
               this.results.exploits.some(e => e.endpoint?.includes('withdrawal') || e.endpoint?.includes('deposit'));
    }

    calculateOverallRiskLevel() {
        const criticalCount = this.getCriticalIssuesCount();
        if (criticalCount > 0) return 'Critical';
        
        const highCount = this.results.vulnerabilities.filter(v => v.severity === 'High').length +
                         this.results.exploits.filter(e => e.severity === 'High').length;
        if (highCount > 5) return 'High';
        if (highCount > 0) return 'Medium';
        
        return 'Low';
    }

    calculateComplianceScore() {
        // Simplified compliance scoring
        const totalIssues = this.results.vulnerabilities.length + this.results.exploits.length;
        if (totalIssues === 0) return 100;
        if (totalIssues < 5) return 85;
        if (totalIssues < 10) return 70;
        if (totalIssues < 20) return 50;
        return 25;
    }

    identifyRiskFactors() {
        const factors = [];
        if (this.getCriticalIssuesCount() > 0) factors.push('Critical vulnerabilities present');
        if (this.hasAuthenticationIssues()) factors.push('Authentication weaknesses');
        if (this.hasPaymentSecurityIssues()) factors.push('Payment security issues');
        return factors;
    }

    assessBusinessImpact() {
        if (this.hasPaymentSecurityIssues()) return 'High - Financial loss possible';
        if (this.getCriticalIssuesCount() > 0) return 'Medium - Data breach possible';
        return 'Low - Limited impact';
    }

    assessLikelihood() {
        const exploitCount = this.results.exploits.length;
        if (exploitCount > 5) return 'High';
        if (exploitCount > 0) return 'Medium';
        return 'Low';
    }

    prioritizeMitigation() {
        return this.results.vulnerabilities
            .concat(this.results.exploits)
            .sort((a, b) => {
                const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .slice(0, 10);
    }

    getKeyFindings() {
        return this.results.vulnerabilities
            .filter(v => v.severity === 'Critical' || v.severity === 'High')
            .slice(0, 5)
            .map(v => v.type);
    }

    generateMarkdownReport(report) {
        // Implementation for markdown report generation
        return `# Security Assessment Report\n\n${JSON.stringify(report, null, 2)}`;
    }

    generateCSVSummary() {
        // Implementation for CSV summary generation
        return 'Type,Severity,Count\nVulnerabilities,Critical,' + this.getCriticalVulnerabilitiesCount();
    }

    generateComplianceStatus() {
        return {
            score: this.calculateComplianceScore(),
            standards: ['OWASP Top 10', 'PCI DSS', 'ISO 27001'],
            gaps: this.identifyComplianceGaps()
        };
    }

    identifyComplianceGaps() {
        const gaps = [];
        if (this.hasAuthenticationIssues()) gaps.push('Authentication controls');
        if (this.hasPaymentSecurityIssues()) gaps.push('Payment card security');
        return gaps;
    }

    generateNextSteps() {
        return [
            'Review and prioritize identified vulnerabilities',
            'Implement critical security fixes',
            'Enhance monitoring and alerting',
            'Schedule regular security assessments',
            'Update security policies and procedures'
        ];
    }

    async sendSecurityAlerts() {
        // Implementation for sending security alerts
        console.log('🚨 Sending security alerts...');
    }
}

// CLI execution
if (require.main === module) {
    const runner = new SecurityTestRunner();
    runner.runAllTests()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = SecurityTestRunner;
