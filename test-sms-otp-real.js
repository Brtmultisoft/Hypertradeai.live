/**
 * Test script to specifically test SMS OTP functionality
 * This will help us debug why SMS OTPs are not being sent to real phones
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testSMSOTP() {
    console.log('📱 Testing Real SMS OTP Functionality');
    console.log('====================================');

    // Test with Indian phone number
    const phoneNumber = '7367989866';
    const email = 'rajatsinha547@gmail.com';

    console.log('📱 Phone Number:', phoneNumber);
    console.log('📧 Email:', email);
    console.log('🌍 Expected Format: +917367989866 (India)');

    // Test 1: Dual verification (should send both email and SMS)
    console.log('\n🔄 Test 1: Dual Verification (Email + SMS)');
    try {
        const response = await axios.post(`${BASE_URL}/user/dual-verification/send-registration-otps`, {
            email: email,
            phone_number: phoneNumber
        });

        console.log('✅ Dual verification request successful!');
        console.log('📧 Email Request ID:', response.data.data?.emailRequestId);
        console.log('📱 SMS Request ID:', response.data.data?.mobileRequestId);
        
        if (response.data.data?.mobileRequestId?.startsWith('sms_')) {
            console.log('⚠️  SMS fell back to test service (Request ID starts with "sms_")');
            console.log('💡 Check server console for test SMS OTP');
        } else {
            console.log('🎉 Real SMS OTP should be sent to +917367989866');
        }

        console.log('\nFull Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Dual verification failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }

    // Test 2: SMS only
    console.log('\n🔄 Test 2: SMS OTP Only');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: phoneNumber
        });

        console.log('✅ SMS OTP request successful!');
        console.log('📱 SMS Request ID:', response.data.data?.requestId);
        
        if (response.data.data?.requestId?.startsWith('sms_')) {
            console.log('⚠️  SMS fell back to test service');
            console.log('💡 Check server console for test SMS OTP');
        } else {
            console.log('🎉 Real SMS OTP should be sent to +917367989866');
        }

        console.log('\nFull Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ SMS OTP failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }

    // Test 3: Email only (for comparison)
    console.log('\n🔄 Test 3: Email OTP Only (for comparison)');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-registration-otp`, {
            email: email
        });

        console.log('✅ Email OTP request successful!');
        console.log('📧 Email Request ID:', response.data.data?.requestId);
        console.log('💡 Check your email for OTP');

        console.log('\nFull Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Email OTP failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }

    console.log('\n🔍 Debugging Information:');
    console.log('=========================');
    console.log('1. Check server console for detailed SMS API logs');
    console.log('2. Look for messages like:');
    console.log('   🔔 ATTEMPTING TO SEND REAL SMS OTP TO: +917367989866');
    console.log('   ❌ OTPless SMS API FAILED!');
    console.log('   🔄 FALLING BACK TO TEST SMS SERVICE');
    console.log('3. If you see "FALLING BACK", check the error details');
    console.log('4. Real SMS should arrive at +917367989866 if OTPless API works');
    console.log('5. Test SMS will show in console like: 🔔 SMS OTP for +917367989866: 1234');

    console.log('\n📱 Expected Behavior:');
    console.log('====================');
    console.log('✅ Real SMS: OTP arrives on phone +917367989866');
    console.log('⚠️  Test SMS: OTP shows in server console only');
    console.log('📧 Email: OTP arrives in email inbox');
}

// Run the test
testSMSOTP().catch(console.error);
