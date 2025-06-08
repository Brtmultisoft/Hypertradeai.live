const axios = require('axios');

// Test OTP sending functionality
async function testOTPSending() {
    try {
        console.log('=== Testing OTP Sending ===');
        
        const testEmail = 'test@example.com';
        const baseURL = 'http://localhost:2015/api';
        
        console.log(`Testing OTP send to: ${testEmail}`);
        
        const response = await axios.post(`${baseURL}/user/otp/test-send`, {
            email: testEmail
        });
        
        console.log('Response:', response.data);
        
        if (response.data.success) {
            console.log('✅ OTP sending test passed');
            return response.data.result.requestId;
        } else {
            console.log('❌ OTP sending test failed');
            return null;
        }
    } catch (error) {
        console.error('❌ OTP sending test error:', error.response?.data || error.message);
        return null;
    }
}

// Test OTP verification functionality
async function testOTPVerification(requestId) {
    try {
        console.log('\n=== Testing OTP Verification ===');
        
        if (!requestId) {
            console.log('❌ No requestId provided for verification test');
            return;
        }
        
        const baseURL = 'http://localhost:2015/api';
        const testOTP = '1234'; // This will likely fail, but we can test the flow
        
        console.log(`Testing OTP verification with requestId: ${requestId}`);
        
        const response = await axios.post(`${baseURL}/user/otp/test-verify`, {
            otp: testOTP,
            requestId: requestId
        });
        
        console.log('Response:', response.data);
        
        if (response.data.success) {
            console.log('✅ OTP verification test completed');
        } else {
            console.log('❌ OTP verification test failed');
        }
    } catch (error) {
        console.error('❌ OTP verification test error:', error.response?.data || error.message);
    }
}

// Test email configuration
async function testEmailConfig() {
    console.log('\n=== Testing Email Configuration ===');
    
    // Check environment variables
    const requiredEnvVars = [
        'SMTP_HOST',
        'SMTP_PORT', 
        'SMTP_USER_NAME',
        'SMTP_PASSWORD',
        'FROM_EMAIL',
        'BRAND_NAME'
    ];
    
    console.log('Checking environment variables:');
    requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        console.log(`${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
    });
    
    // Check OTPless configuration
    console.log('\nChecking OTPless configuration:');
    console.log(`OTPLESS_CLIENT_ID: ${process.env.OTPLESS_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`OTPLESS_CLIENT_SECRET: ${process.env.OTPLESS_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
}

// Main test function
async function runTests() {
    console.log('🚀 Starting OTP System Tests\n');
    
    // Load environment variables
    require('dotenv').config({ path: './server/.env' });
    
    // Test email configuration
    await testEmailConfig();
    
    // Test OTP sending
    const requestId = await testOTPSending();
    
    // Test OTP verification (will likely fail without real OTP)
    await testOTPVerification(requestId);
    
    console.log('\n🏁 Tests completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testOTPSending,
    testOTPVerification,
    testEmailConfig,
    runTests
};
