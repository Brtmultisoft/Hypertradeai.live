/**
 * Test script to verify the API interceptor fix
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testAPIFix() {
    console.log('🔧 Testing API Interceptor Fix');
    console.log('==============================');
    console.log('Base URL:', BASE_URL);

    // Test 1: Dual verification endpoint
    console.log('\n📧📱 Test 1: Dual Verification Endpoint');
    try {
        const response = await axios.post(`${BASE_URL}/user/dual-verification/send-registration-otps`, {
            email: 'rajatsinha547@gmail.com',
            phone_number: '7367989866'
        });

        console.log('✅ SUCCESS! Dual verification endpoint working!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
        if (response.data.status) {
            console.log('\n🎉 OTPs sent successfully!');
            console.log('📧 Email Request ID:', response.data.data.emailRequestId);
            console.log('📱 Mobile Request ID:', response.data.data.mobileRequestId);
        }
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.statusText);
        console.log('Response:', error.response?.data);
        console.log('Message:', error.message);
    }

    // Test 2: Mobile registration OTP
    console.log('\n📱 Test 2: Mobile Registration OTP');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: '7367989866'
        });

        console.log('✅ SUCCESS! Mobile OTP endpoint working!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.statusText);
        console.log('Response:', error.response?.data);
    }

    // Test 3: Email registration OTP (existing)
    console.log('\n📧 Test 3: Email Registration OTP');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-registration-otp`, {
            email: 'rajatsinha547@gmail.com'
        });

        console.log('✅ SUCCESS! Email OTP endpoint working!');
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.statusText);
        console.log('Response:', error.response?.data);
    }

    console.log('\n🏁 API testing completed!');
    console.log('\n💡 If all tests show SUCCESS, the frontend should work now!');
    console.log('   Try the registration form again.');
    console.log('\n📱 Check server console for test OTPs like:');
    console.log('   🔔 SMS OTP for +917367989866: 1234 (Request ID: ...)');
}

// Run the test
testAPIFix().catch(console.error);
