const config = require('./src/config/config');
const emailService = require('./src/services/sendEmail');
const otplessService = require('./src/services/otpless.service');
const emailOTPService = require('./src/services/email-otp.service');

console.log('=== COMPREHENSIVE OTP TESTING SCRIPT ===\n');

// Test 1: Check Configuration
async function testConfiguration() {
    console.log('1. TESTING CONFIGURATION:');
    console.log('   Email Service Config:', {
        serviceActive: config.emailServiceInfo.serviceActive,
        fromEmail: config.emailServiceInfo.fromEmail,
        fromName: config.emailServiceInfo.fromName,
        smtpHost: config.emailServiceInfo.smtp.host,
        smtpPort: config.emailServiceInfo.smtp.port,
        smtpUser: config.emailServiceInfo.smtp.userName,
        smtpPasswordSet: !!config.emailServiceInfo.smtp.password
    });
    
    console.log('   OTPless Config:', {
        clientIdSet: !!process.env.OTPLESS_CLIENT_ID,
        clientSecretSet: !!process.env.OTPLESS_CLIENT_SECRET,
        apiKeySet: !!process.env.OTPLESS_API_KEY
    });
    console.log('');
}

// Test 2: Test SMTP Connection
async function testSMTPConnection() {
    console.log('2. TESTING SMTP CONNECTION:');
    try {
        const nodeMailer = require('nodemailer');
        const transporter = nodeMailer.createTransporter({
            host: config.emailServiceInfo.smtp.host,
            port: config.emailServiceInfo.smtp.port,
            secure: false,
            auth: {
                user: config.emailServiceInfo.smtp.userName,
                pass: config.emailServiceInfo.smtp.password
            }
        });
        
        await transporter.verify();
        console.log('   ✅ SMTP connection verified successfully');
    } catch (error) {
        console.log('   ❌ SMTP connection failed:', error.message);
        console.log('   Error details:', {
            code: error.code,
            command: error.command,
            response: error.response
        });
    }
    console.log('');
}

// Test 3: Test Email Service
async function testEmailService() {
    console.log('3. TESTING EMAIL SERVICE:');
    try {
        const testEmail = {
            recipientsAddress: 'test@example.com', // Change this to your test email
            subject: 'OTP Test Email',
            body: '<h1>Test OTP Email</h1><p>Your OTP is: <strong>1234</strong></p>'
        };
        
        console.log('   Attempting to send test email...');
        const result = await emailService.sendEmail(testEmail);
        console.log('   ✅ Email service test successful:', result);
    } catch (error) {
        console.log('   ❌ Email service test failed:', error.message);
        console.log('   Error details:', {
            code: error.code,
            command: error.command,
            response: error.response,
            stack: error.stack
        });
    }
    console.log('');
}

// Test 4: Test OTPless Service
async function testOTPlessService() {
    console.log('4. TESTING OTPLESS SERVICE:');
    try {
        console.log('   Testing OTPless email OTP...');
        const result = await otplessService.sendOTP('test@example.com', 4, 120);
        console.log('   ✅ OTPless service test result:', result);
    } catch (error) {
        console.log('   ❌ OTPless service test failed:', error.message);
        console.log('   Error details:', error);
    }
    console.log('');
}

// Test 5: Test Email OTP Service (Fallback)
async function testEmailOTPService() {
    console.log('5. TESTING EMAIL OTP SERVICE (FALLBACK):');
    try {
        console.log('   Testing fallback email OTP service...');
        const result = await emailOTPService.sendOTP('test@example.com', 4, 120);
        console.log('   ✅ Email OTP service test result:', result);
    } catch (error) {
        console.log('   ❌ Email OTP service test failed:', error.message);
        console.log('   Error details:', error);
    }
    console.log('');
}

// Test 6: Check Network Connectivity
async function testNetworkConnectivity() {
    console.log('6. TESTING NETWORK CONNECTIVITY:');
    try {
        const axios = require('axios');
        
        // Test SMTP server connectivity
        console.log('   Testing SMTP server connectivity...');
        const smtpTest = await axios.get(`http://${config.emailServiceInfo.smtp.host}:${config.emailServiceInfo.smtp.port}`, {
            timeout: 5000
        }).catch(err => {
            if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
                return { status: 'connection_refused' };
            }
            throw err;
        });
        
        if (smtpTest.status === 'connection_refused') {
            console.log('   ⚠️  SMTP server connection refused (this might be normal for SMTP)');
        } else {
            console.log('   ✅ SMTP server is reachable');
        }
        
        // Test OTPless API connectivity
        console.log('   Testing OTPless API connectivity...');
        const otplessTest = await axios.get('https://auth.otpless.app/auth/v1/initiate/email', {
            timeout: 5000,
            validateStatus: () => true // Accept any status code
        });
        console.log('   ✅ OTPless API is reachable, status:', otplessTest.status);
        
    } catch (error) {
        console.log('   ❌ Network connectivity test failed:', error.message);
    }
    console.log('');
}

// Test 7: Check Environment Variables
async function testEnvironmentVariables() {
    console.log('7. CHECKING ENVIRONMENT VARIABLES:');
    const requiredVars = [
        'FROM_EMAIL',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER_NAME',
        'SMTP_PASSWORD',
        'OTPLESS_CLIENT_ID',
        'OTPLESS_CLIENT_SECRET'
    ];
    
    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`   ✅ ${varName}: Set (${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : value})`);
        } else {
            console.log(`   ❌ ${varName}: Not set`);
        }
    });
    console.log('');
}

// Main test function
async function runAllTests() {
    try {
        await testConfiguration();
        await testEnvironmentVariables();
        await testSMTPConnection();
        await testNetworkConnectivity();
        await testEmailService();
        await testOTPlessService();
        await testEmailOTPService();
        
        console.log('=== TEST SUMMARY ===');
        console.log('All tests completed. Check the results above for any issues.');
        console.log('If OTPs are not being received, the most common issues are:');
        console.log('1. SMTP credentials are incorrect or expired');
        console.log('2. SMTP server is blocking connections');
        console.log('3. OTPless API credentials are invalid');
        console.log('4. Network connectivity issues');
        console.log('5. Email provider is marking emails as spam');
        
    } catch (error) {
        console.error('Test execution failed:', error);
    }
}

// Run tests
runAllTests();
