const axios = require('axios');
require('dotenv').config({ path: './.env' });

// Test OTPless API directly using the PHP implementation format
async function testOTPlessDirectly() {
    console.log('🚀 Testing OTPless API directly (based on PHP implementation)\n');
    
    const clientId = process.env.OTPLESS_CLIENT_ID;
    const clientSecret = process.env.OTPLESS_CLIENT_SECRET;
    const apiUrl = 'https://auth.otpless.app/auth/v1';
    
    console.log('Configuration:');
    console.log(`Client ID: ${clientId}`);
    console.log(`Client Secret: ${clientSecret ? '***' + clientSecret.slice(-4) : 'Not set'}`);
    console.log(`API URL: ${apiUrl}\n`);
    
    // Test email
    const testEmail = 'test@example.com';
    
    try {
        console.log('=== Testing OTP Send ===');
        
        // Send OTP - exact format from PHP implementation
        const sendData = {
            email: testEmail,
            expiry: 120,
            otpLength: 4,
            channels: ['EMAIL']
        };
        
        console.log('Send request data:', JSON.stringify(sendData, null, 2));
        
        const sendResponse = await axios.post(`${apiUrl}/initiate/otp`, sendData, {
            headers: {
                'Content-Type': 'application/json',
                'clientId': clientId,
                'clientSecret': clientSecret
            },
            timeout: 30000
        });
        
        console.log('✅ Send Response Status:', sendResponse.status);
        console.log('✅ Send Response Data:', JSON.stringify(sendResponse.data, null, 2));
        
        if (sendResponse.data && sendResponse.data.requestId) {
            console.log(`\n🎉 OTP sent successfully! RequestId: ${sendResponse.data.requestId}`);
            
            // Test verification with a dummy OTP (will fail but tests the endpoint)
            console.log('\n=== Testing OTP Verify ===');
            
            const verifyData = {
                otp: '1234', // Dummy OTP
                requestId: sendResponse.data.requestId
            };
            
            console.log('Verify request data:', JSON.stringify(verifyData, null, 2));
            
            try {
                const verifyResponse = await axios.post(`${apiUrl}/verify/otp`, verifyData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'clientId': clientId,
                        'clientSecret': clientSecret
                    },
                    timeout: 30000
                });
                
                console.log('✅ Verify Response Status:', verifyResponse.status);
                console.log('✅ Verify Response Data:', JSON.stringify(verifyResponse.data, null, 2));
                
                if (verifyResponse.data.isOTPVerified) {
                    console.log('🎉 OTP verified successfully!');
                } else {
                    console.log('❌ OTP verification failed (expected with dummy OTP)');
                }
                
            } catch (verifyError) {
                console.log('❌ Verify Error Status:', verifyError.response?.status);
                console.log('❌ Verify Error Data:', JSON.stringify(verifyError.response?.data, null, 2));
            }
            
        } else {
            console.log('❌ No requestId in send response');
        }
        
    } catch (sendError) {
        console.log('❌ Send Error Status:', sendError.response?.status);
        console.log('❌ Send Error Data:', JSON.stringify(sendError.response?.data, null, 2));
        console.log('❌ Send Error Message:', sendError.message);
    }
}

// Test email configuration
function testEmailConfig() {
    console.log('=== Email Configuration Test ===');
    
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
    
    console.log('\nOTPless configuration:');
    console.log(`OTPLESS_CLIENT_ID: ${process.env.OTPLESS_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`OTPLESS_CLIENT_SECRET: ${process.env.OTPLESS_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
}

// Main test function
async function runTests() {
    console.log('🔧 OTPless Direct API Test (Node.js version of PHP implementation)\n');
    
    // Test configuration
    testEmailConfig();
    console.log('\n');
    
    // Test OTPless API
    await testOTPlessDirectly();
    
    console.log('\n🏁 Tests completed');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testOTPlessDirectly,
    testEmailConfig,
    runTests
};
