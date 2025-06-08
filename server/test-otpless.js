const axios = require('axios');
require('dotenv').config();

/**
 * Test script to verify OTPless configuration
 */
async function testOTPlessAPI() {
    console.log('Testing OTPless API Configuration...\n');
    
    // Configuration
    const clientId = process.env.OTPLESS_CLIENT_ID || 'SKDIAGIQVENDA8ID3H2T53SV4Z8QEEFS';
    const clientSecret = process.env.OTPLESS_CLIENT_SECRET || '805r9z2uzpqylxrrrt0bh0y67l8z1qv3';
    const testEmail = 'test@example.com'; // Change this to your test email
    
    console.log('Configuration:');
    console.log('Client ID:', clientId);
    console.log('Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'Not set');
    console.log('Test Email:', testEmail);
    console.log('\n');
    
    try {
        // Test 1: Send OTP
        console.log('Test 1: Sending OTP...');
        
        const sendData = {
            email: testEmail,
            expiry: 120,
            otpLength: 4,
            channels: ['EMAIL']
        };
        
        console.log('Request data:', JSON.stringify(sendData, null, 2));
        
        const sendResponse = await axios.post(
            'https://auth.otpless.app/auth/v1/initiate/otp',
            sendData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'clientId': clientId,
                    'clientSecret': clientSecret
                },
                timeout: 30000
            }
        );
        
        console.log('Send OTP Response Status:', sendResponse.status);
        console.log('Send OTP Response Data:', JSON.stringify(sendResponse.data, null, 2));
        
        if (sendResponse.data && sendResponse.data.requestId) {
            console.log('✅ OTP sent successfully!');
            console.log('Request ID:', sendResponse.data.requestId);
            
            // Test 2: Verify OTP (this will fail since we don't have the actual OTP)
            console.log('\nTest 2: Testing OTP verification (will fail with test OTP)...');
            
            const verifyData = {
                otp: '1234', // Test OTP
                requestId: sendResponse.data.requestId
            };
            
            try {
                const verifyResponse = await axios.post(
                    'https://auth.otpless.app/auth/v1/verify/otp',
                    verifyData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'clientId': clientId,
                            'clientSecret': clientSecret
                        },
                        timeout: 30000
                    }
                );
                
                console.log('Verify OTP Response Status:', verifyResponse.status);
                console.log('Verify OTP Response Data:', JSON.stringify(verifyResponse.data, null, 2));
                
            } catch (verifyError) {
                console.log('Verify OTP Error (expected):', verifyError.response?.data || verifyError.message);
            }
            
        } else {
            console.log('❌ Failed to get request ID from response');
        }
        
    } catch (error) {
        console.error('❌ Error testing OTPless API:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 This looks like an authentication error. Please check:');
            console.log('1. Your OTPless Client ID and Client Secret are correct');
            console.log('2. Your OTPless account is active');
            console.log('3. The API credentials have the right permissions');
        }
    }
}

/**
 * Test the local OTPless service
 */
async function testLocalService() {
    console.log('\n\nTesting Local OTPless Service...\n');
    
    try {
        const OTPlessService = require('./src/services/otpless.service');
        
        const testEmail = 'test@example.com'; // Change this to your test email
        
        console.log('Testing sendOTP method...');
        const result = await OTPlessService.sendOTP(testEmail, 4, 120);
        
        console.log('Local service result:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('✅ Local OTPless service is working!');
        } else {
            console.log('❌ Local OTPless service failed:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing local service:', error.message);
    }
}

// Run tests
async function runTests() {
    await testOTPlessAPI();
    await testLocalService();
    
    console.log('\n\n📋 Summary:');
    console.log('1. If OTP sending works, your OTPless configuration is correct');
    console.log('2. Check your email (including spam folder) for the test OTP');
    console.log('3. Update the test email to your actual email for real testing');
    console.log('4. The OTP verification test will fail since we use a dummy OTP');
    console.log('\n🔧 Next steps:');
    console.log('1. Update your .env file with correct OTPless credentials');
    console.log('2. Test the registration flow in your application');
    console.log('3. Check server logs for detailed error messages');
}

runTests().catch(console.error);
