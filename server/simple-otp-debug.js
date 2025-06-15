require('dotenv').config();

console.log('=== SIMPLE OTP DEBUG SCRIPT ===\n');

// Check environment variables first
console.log('1. ENVIRONMENT VARIABLES:');
console.log('   FROM_EMAIL:', process.env.FROM_EMAIL);
console.log('   SMTP_HOST:', process.env.SMTP_HOST);
console.log('   SMTP_PORT:', process.env.SMTP_PORT);
console.log('   SMTP_USER_NAME:', process.env.SMTP_USER_NAME);
console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('   OTPLESS_CLIENT_ID:', process.env.OTPLESS_CLIENT_ID ? '***SET***' : 'NOT SET');
console.log('   OTPLESS_CLIENT_SECRET:', process.env.OTPLESS_CLIENT_SECRET ? '***SET***' : 'NOT SET');
console.log('');

// Test SMTP connection
async function testSMTP() {
    console.log('2. TESTING SMTP CONNECTION:');
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER_NAME,
                pass: process.env.SMTP_PASSWORD
            }
        });

        console.log('   Verifying SMTP connection...');
        await transporter.verify();
        console.log('   ✅ SMTP connection successful');
        
        // Try sending a test email
        console.log('   Sending test email...');
        const info = await transporter.sendMail({
            from: `"${process.env.BRAND_NAME}" <${process.env.FROM_EMAIL}>`,
            to: 'test@example.com', // Change this to your email for testing
            subject: 'OTP Test Email',
            html: '<h1>Test Email</h1><p>This is a test email to verify SMTP is working.</p>'
        });
        
        console.log('   ✅ Test email sent successfully');
        console.log('   Message ID:', info.messageId);
        
    } catch (error) {
        console.log('   ❌ SMTP test failed:', error.message);
        console.log('   Error code:', error.code);
        console.log('   Error response:', error.response);
    }
    console.log('');
}

// Test OTPless API
async function testOTPless() {
    console.log('3. TESTING OTPLESS API:');
    try {
        const axios = require('axios');
        
        const data = {
            email: 'test@example.com',
            otpLength: 4,
            expiry: 120
        };

        const config = {
            method: 'post',
            url: 'https://auth.otpless.app/auth/v1/initiate/email',
            headers: {
                'clientId': process.env.OTPLESS_CLIENT_ID,
                'clientSecret': process.env.OTPLESS_CLIENT_SECRET,
                'Content-Type': 'application/json'
            },
            data: data
        };

        console.log('   Making OTPless API request...');
        const response = await axios(config);
        console.log('   ✅ OTPless API response:', response.data);
        
    } catch (error) {
        console.log('   ❌ OTPless API test failed:', error.message);
        if (error.response) {
            console.log('   Response status:', error.response.status);
            console.log('   Response data:', error.response.data);
        }
    }
    console.log('');
}

// Test email service directly
async function testEmailService() {
    console.log('4. TESTING EMAIL SERVICE DIRECTLY:');
    try {
        const config = require('./src/config/config');
        const emailService = require('./src/services/sendEmail');
        
        console.log('   Config loaded:', {
            serviceActive: config.emailServiceInfo.serviceActive,
            fromEmail: config.emailServiceInfo.fromEmail,
            smtpHost: config.emailServiceInfo.smtp.host
        });
        
        const emailData = {
            recipientsAddress: 'test@example.com', // Change this to your email
            subject: 'Direct Email Service Test',
            body: '<h1>Direct Test</h1><p>Testing email service directly</p>'
        };
        
        console.log('   Sending email via email service...');
        const result = await emailService.sendEmail(emailData);
        console.log('   ✅ Email service test successful:', result);
        
    } catch (error) {
        console.log('   ❌ Email service test failed:', error.message);
        console.log('   Error details:', error);
    }
    console.log('');
}

// Run all tests
async function runTests() {
    try {
        await testSMTP();
        await testOTPless();
        await testEmailService();
        
        console.log('=== RECOMMENDATIONS ===');
        console.log('1. Check if emails are going to spam folder');
        console.log('2. Verify SMTP credentials with your email provider');
        console.log('3. Check OTPless dashboard for API usage and errors');
        console.log('4. Test with a real email address instead of test@example.com');
        console.log('5. Check server logs for detailed error messages');
        
    } catch (error) {
        console.error('Test execution failed:', error);
    }
}

runTests();
