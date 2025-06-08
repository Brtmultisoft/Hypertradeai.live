#!/usr/bin/env node
'use strict';

/**
 * NoSQL Injection Testing Script
 * Demonstrates vulnerabilities in the current authentication system
 */

const axios = require('axios');
const colors = require('colors');

class NoSQLInjectionTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.vulnerabilities = [];
        this.testResults = [];
    }

    /**
     * Run all NoSQL injection tests
     */
    async runAllTests() {
        console.log('🔍 Starting NoSQL Injection Tests'.cyan.bold);
        console.log('=' .repeat(50).gray);
        
        try {
            // Test authentication bypass
            await this.testAuthenticationBypass();
            
            // Test user enumeration
            await this.testUserEnumeration();
            
            // Test search injection
            await this.testSearchInjection();
            
            // Test advanced injection techniques
            await this.testAdvancedInjection();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test execution failed:'.red, error.message);
        }
    }

    /**
     * Test authentication bypass vulnerabilities
     */
    async testAuthenticationBypass() {
        console.log('\n🎯 Testing Authentication Bypass...'.yellow.bold);
        
        const payloads = [
            {
                name: 'Basic NoSQL Injection',
                userAddress: { "$ne": null },
                password: { "$ne": null }
            },
            {
                name: 'Regex Injection',
                userAddress: { "$regex": ".*" },
                password: { "$regex": ".*" }
            },
            {
                name: 'Exists Injection',
                userAddress: { "$exists": true },
                password: { "$exists": true }
            },
            {
                name: 'Greater Than Injection',
                userAddress: { "$gt": "" },
                password: { "$gt": "" }
            },
            {
                name: 'Where Clause Injection',
                userAddress: { "$where": "this.email" },
                password: "anything"
            },
            {
                name: 'OR Injection',
                userAddress: { "$or": [{"email": {"$ne": null}}, {"username": {"$ne": null}}] },
                password: "anything"
            }
        ];

        for (const payload of payloads) {
            try {
                const response = await this.makeRequest('POST', '/api/user/login', {
                    userAddress: payload.userAddress,
                    password: payload.password
                });

                if (response.status === 200 && response.data.status === true) {
                    console.log(`✅ ${payload.name}: VULNERABLE`.red.bold);
                    this.vulnerabilities.push({
                        type: 'Authentication Bypass',
                        method: payload.name,
                        payload: payload,
                        severity: 'Critical',
                        endpoint: '/api/user/login'
                    });
                } else {
                    console.log(`❌ ${payload.name}: Protected`.green);
                }
            } catch (error) {
                if (error.response?.status === 400) {
                    console.log(`❌ ${payload.name}: Protected (Input Validation)`.green);
                } else {
                    console.log(`⚠️  ${payload.name}: Error - ${error.message}`.yellow);
                }
            }
        }
    }

    /**
     * Test user enumeration vulnerabilities
     */
    async testUserEnumeration() {
        console.log('\n🔍 Testing User Enumeration...'.yellow.bold);
        
        const payloads = [
            {
                name: 'Email Enumeration',
                userAddress: { "$regex": ".*@.*" },
                password: "test"
            },
            {
                name: 'Admin User Search',
                userAddress: { "$regex": "admin" },
                password: "test"
            },
            {
                name: 'User Count Injection',
                userAddress: { "$where": "this.email.length > 0" },
                password: "test"
            }
        ];

        for (const payload of payloads) {
            try {
                const response = await this.makeRequest('POST', '/api/user/login', {
                    userAddress: payload.userAddress,
                    password: payload.password
                });

                // Even failed logins can reveal user existence through different error messages
                if (response.data.message && response.data.message !== "Invalid Credentials!") {
                    console.log(`✅ ${payload.name}: VULNERABLE (Different Error Message)`.red.bold);
                    this.vulnerabilities.push({
                        type: 'User Enumeration',
                        method: payload.name,
                        payload: payload,
                        severity: 'Medium',
                        endpoint: '/api/user/login'
                    });
                } else {
                    console.log(`❌ ${payload.name}: Protected`.green);
                }
            } catch (error) {
                console.log(`⚠️  ${payload.name}: Error - ${error.message}`.yellow);
            }
        }
    }

    /**
     * Test search injection vulnerabilities
     */
    async testSearchInjection() {
        console.log('\n🔎 Testing Search Injection...'.yellow.bold);
        
        // Note: These tests require authentication
        console.log('ℹ️  Search injection tests require valid authentication token'.blue);
        
        const searchPayloads = [
            {
                name: 'Regex Injection in Search',
                search: { "$regex": ".*" }
            },
            {
                name: 'Where Clause in Search',
                search: { "$where": "this.password" }
            },
            {
                name: 'Exists Injection in Search',
                search: { "$exists": true }
            }
        ];

        for (const payload of searchPayloads) {
            try {
                const response = await this.makeRequest('GET', '/api/searchUsers', {
                    search: JSON.stringify(payload.search)
                });

                if (response.status === 200 && response.data.data?.docs?.length > 0) {
                    console.log(`✅ ${payload.name}: VULNERABLE`.red.bold);
                    this.vulnerabilities.push({
                        type: 'Search Injection',
                        method: payload.name,
                        payload: payload,
                        severity: 'High',
                        endpoint: '/api/searchUsers'
                    });
                } else {
                    console.log(`❌ ${payload.name}: Protected`.green);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log(`⚠️  ${payload.name}: Requires Authentication`.yellow);
                } else {
                    console.log(`❌ ${payload.name}: Protected`.green);
                }
            }
        }
    }

    /**
     * Test advanced injection techniques
     */
    async testAdvancedInjection() {
        console.log('\n🚀 Testing Advanced Injection Techniques...'.yellow.bold);
        
        const advancedPayloads = [
            {
                name: 'JavaScript Injection',
                userAddress: { "$where": "function() { return true; }" },
                password: "test"
            },
            {
                name: 'Sleep Injection (DoS)',
                userAddress: { "$where": "sleep(5000) || true" },
                password: "test"
            },
            {
                name: 'Data Extraction',
                userAddress: { "$where": "this.password.length > 0" },
                password: "test"
            },
            {
                name: 'Blind NoSQL Injection',
                userAddress: { "$regex": "^a" },
                password: "test"
            }
        ];

        for (const payload of advancedPayloads) {
            const startTime = Date.now();
            
            try {
                const response = await this.makeRequest('POST', '/api/user/login', {
                    userAddress: payload.userAddress,
                    password: payload.password
                });

                const responseTime = Date.now() - startTime;
                
                if (payload.name.includes('Sleep') && responseTime > 4000) {
                    console.log(`✅ ${payload.name}: VULNERABLE (Response time: ${responseTime}ms)`.red.bold);
                    this.vulnerabilities.push({
                        type: 'DoS via Injection',
                        method: payload.name,
                        payload: payload,
                        severity: 'High',
                        endpoint: '/api/user/login',
                        responseTime: responseTime
                    });
                } else if (response.status === 200 && response.data.status === true) {
                    console.log(`✅ ${payload.name}: VULNERABLE`.red.bold);
                    this.vulnerabilities.push({
                        type: 'Advanced Injection',
                        method: payload.name,
                        payload: payload,
                        severity: 'Critical',
                        endpoint: '/api/user/login'
                    });
                } else {
                    console.log(`❌ ${payload.name}: Protected`.green);
                }
            } catch (error) {
                const responseTime = Date.now() - startTime;
                if (payload.name.includes('Sleep') && responseTime > 4000) {
                    console.log(`✅ ${payload.name}: VULNERABLE (Timeout: ${responseTime}ms)`.red.bold);
                } else {
                    console.log(`❌ ${payload.name}: Protected`.green);
                }
            }
        }
    }

    /**
     * Make HTTP request
     */
    async makeRequest(method, endpoint, data = {}, headers = {}) {
        const config = {
            method,
            url: `${this.baseUrl}${endpoint}`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NoSQL-Injection-Tester/1.0',
                ...headers
            }
        };

        if (method.toUpperCase() === 'GET') {
            config.params = data;
        } else {
            config.data = data;
        }

        return await axios(config);
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n' + '='.repeat(50).gray);
        console.log('📊 TEST RESULTS SUMMARY'.cyan.bold);
        console.log('='.repeat(50).gray);

        if (this.vulnerabilities.length === 0) {
            console.log('✅ No NoSQL injection vulnerabilities found!'.green.bold);
            return;
        }

        console.log(`🚨 Found ${this.vulnerabilities.length} vulnerabilities:`.red.bold);
        
        const severityCounts = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0
        };

        this.vulnerabilities.forEach((vuln, index) => {
            severityCounts[vuln.severity]++;
            
            console.log(`\n${index + 1}. ${vuln.type} - ${vuln.method}`.yellow.bold);
            console.log(`   Severity: ${vuln.severity}`.red);
            console.log(`   Endpoint: ${vuln.endpoint}`.blue);
            console.log(`   Payload: ${JSON.stringify(vuln.payload, null, 2)}`.gray);
        });

        console.log('\n📈 Severity Breakdown:'.cyan.bold);
        Object.entries(severityCounts).forEach(([severity, count]) => {
            if (count > 0) {
                const color = severity === 'Critical' ? 'red' : severity === 'High' ? 'yellow' : 'blue';
                console.log(`   ${severity}: ${count}`[color]);
            }
        });

        console.log('\n🛡️  Recommendations:'.green.bold);
        console.log('   1. Implement input sanitization for all user inputs');
        console.log('   2. Use parameterized queries instead of direct object injection');
        console.log('   3. Add input validation middleware');
        console.log('   4. Implement rate limiting for authentication endpoints');
        console.log('   5. Use the provided secure authentication controller');

        console.log('\n🔧 Fix Implementation:'.blue.bold);
        console.log('   Use: server/src/security/nosql-injection-fix.js');
        console.log('   Replace: server/src/controllers/user/auth.controller.js');
    }
}

// CLI execution
if (require.main === module) {
    const tester = new NoSQLInjectionTester();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const baseUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
    
    tester.baseUrl = baseUrl;
    
    console.log(`🎯 Testing target: ${baseUrl}`.blue.bold);
    
    tester.runAllTests()
        .then(() => {
            console.log('\n✅ Testing completed'.green.bold);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Testing failed:'.red.bold, error.message);
            process.exit(1);
        });
}

module.exports = NoSQLInjectionTester;
