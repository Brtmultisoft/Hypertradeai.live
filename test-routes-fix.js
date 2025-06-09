/**
 * Test script to verify the dual verification routes are working
 * Run this after fixing the route authentication issue
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015';

async function testRoutes() {
    console.log('🔧 Testing Dual Verification Routes');
    console.log('===================================');

    // Test 1: Send dual registration OTPs
    console.log('\n📧📱 Test 1: Send Dual Registration OTPs');
    try {
        const response = await axios.post(`${BASE_URL}/user/dual-verification/send-registration-otps`, {
            email: 'test@example.com',
            phone_number: '+1234567890'
        });

        console.log('✅ Dual OTPs endpoint working!');
        console.log('Response:', response.data);
        
        if (response.data.status) {
            console.log('📧 Email Request ID:', response.data.data.emailRequestId);
            console.log('📱 Mobile Request ID:', response.data.data.mobileRequestId);
        }
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ STILL GETTING AUTH ERROR - Route is still protected!');
            console.log('Error:', error.response.data);
        } else {
            console.log('✅ Route is accessible (no auth error)');
            console.log('Response:', error.response?.data || error.message);
        }
    }

    // Test 2: Send mobile registration OTP
    console.log('\n📱 Test 2: Send Mobile Registration OTP');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: '+1234567890'
        });

        console.log('✅ Mobile OTP endpoint working!');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ STILL GETTING AUTH ERROR - Route is still protected!');
            console.log('Error:', error.response.data);
        } else {
            console.log('✅ Route is accessible (no auth error)');
            console.log('Response:', error.response?.data || error.message);
        }
    }

    // Test 3: Send mobile forgot password OTP
    console.log('\n🔐 Test 3: Send Mobile Forgot Password OTP');
    try {
        const response = await axios.post(`${BASE_URL}/user/forgot/password-mobile`, {
            phone_number: '+1234567890'
        });

        console.log('✅ Mobile forgot password endpoint working!');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ STILL GETTING AUTH ERROR - Route is still protected!');
            console.log('Error:', error.response.data);
        } else {
            console.log('✅ Route is accessible (no auth error)');
            console.log('Response:', error.response?.data || error.message);
        }
    }

    // Test 4: Check existing registration OTP (should work)
    console.log('\n📧 Test 4: Send Email Registration OTP (existing)');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-registration-otp`, {
            email: 'test@example.com'
        });

        console.log('✅ Email OTP endpoint working!');
        console.log('Response:', response.data);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ Email OTP route also protected - something wrong with route order!');
            console.log('Error:', error.response.data);
        } else {
            console.log('✅ Route is accessible (no auth error)');
            console.log('Response:', error.response?.data || error.message);
        }
    }

    console.log('\n🏁 Route testing completed!');
    console.log('\nIf you see "STILL GETTING AUTH ERROR", restart the server:');
    console.log('1. Stop the server (Ctrl+C)');
    console.log('2. Run: cd server && npm start');
    console.log('3. Run this test again');
}

// Run the test
testRoutes().catch(console.error);
