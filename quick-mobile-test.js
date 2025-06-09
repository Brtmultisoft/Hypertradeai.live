/**
 * Quick Mobile OTP Test Script
 * Run this to quickly test mobile OTP functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015';
const TEST_PHONE = '+1234567890';

async function quickTest() {
    console.log('🚀 Quick Mobile OTP Test');
    console.log('========================');
    
    try {
        // Step 1: Send mobile OTP
        console.log('\n📱 Step 1: Sending mobile OTP...');
        const sendResponse = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: TEST_PHONE
        });
        
        console.log('✅ OTP sent successfully!');
        console.log('Response:', sendResponse.data);
        
        const requestId = sendResponse.data.data.requestId;
        const testOTP = sendResponse.data.data.testOTP;
        
        if (testOTP) {
            console.log(`\n🔔 Your test OTP is: ${testOTP}`);
            console.log(`📋 Request ID: ${requestId}`);
            
            // Step 2: Verify mobile OTP
            console.log('\n✅ Step 2: Verifying mobile OTP...');
            const verifyResponse = await axios.post(`${BASE_URL}/user/otpless/verify-mobile-registration-otp`, {
                phone_number: TEST_PHONE,
                otp: testOTP,
                requestId: requestId
            });
            
            console.log('✅ OTP verified successfully!');
            console.log('Response:', verifyResponse.data);
            
            // Step 3: Create user with verified mobile
            console.log('\n👤 Step 3: Creating user with verified mobile...');
            const signupResponse = await axios.post(`${BASE_URL}/user/signup-with-verification`, {
                userAddress: 'quicktest@example.com',
                email: 'quicktest@example.com',
                phone_number: TEST_PHONE,
                password: 'TestPassword123!',
                name: 'Quick Test User',
                country: 'United States',
                referralId: 'admin',
                email_verified: true,
                phone_verified: true
            });
            
            console.log('✅ User created successfully!');
            console.log('Response:', signupResponse.data);
            
            console.log('\n🎉 All tests passed! Mobile verification is working correctly.');
            
        } else {
            console.log('⚠️  No test OTP in response. Check if fallback service is working.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the server is running on port 2015');
            console.log('   Run: cd server && npm start');
        }
    }
}

// Run the test
quickTest();
