/**
 * Test script to verify the forgot password flow is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testForgotPasswordFlow() {
    console.log('🔐 Testing Forgot Password Flow');
    console.log('===============================');

    // Test 1: Email Forgot Password
    console.log('\n📧 Test 1: Email Forgot Password');
    try {
        const emailResponse = await axios.post(`${BASE_URL}/user/forgot/password`, {
            email: 'dosod69636@3dboxer.com'
        });

        if (emailResponse.data.status) {
            console.log('✅ Email OTP sent successfully!');
            console.log('📧 Email Request ID:', emailResponse.data.data.otp_request_id);
            console.log('💡 Check email inbox for OTP');
        } else {
            console.log('❌ Email OTP failed:', emailResponse.data.msg);
        }
    } catch (error) {
        console.log('❌ Email OTP error:', error.response?.data || error.message);
    }

    // Test 2: Mobile Forgot Password
    console.log('\n📱 Test 2: Mobile Forgot Password');
    try {
        const mobileResponse = await axios.post(`${BASE_URL}/user/forgot/password-mobile`, {
            phone_number: '7367989866'
        });

        if (mobileResponse.data.status) {
            console.log('✅ Mobile OTP sent successfully!');
            console.log('📱 Mobile Request ID:', mobileResponse.data.data.requestId);
            console.log('💡 Check server console for test SMS OTP');
        } else {
            console.log('❌ Mobile OTP failed:', mobileResponse.data.msg);
        }
    } catch (error) {
        console.log('❌ Mobile OTP error:', error.response?.data || error.message);
    }

    // Test 3: Email Password Reset
    console.log('\n🔐 Test 3: Email Password Reset');
    try {
        const emailResetResponse = await axios.post(`${BASE_URL}/user/reset/password-with-otp`, {
            email: 'dosod69636@3dboxer.com',
            otp: '0000', // Replace with real OTP
            requestId: 'EMAIL_REQUEST_ID', // Replace with real request ID
            password: 'NewPassword123!',
            confirm_password: 'NewPassword123!'
        });

        if (emailResetResponse.data.status) {
            console.log('✅ Email password reset successful!');
            console.log('👤 User ID:', emailResetResponse.data.data.userId);
        } else {
            console.log('❌ Email password reset failed:', emailResetResponse.data.msg);
        }
    } catch (error) {
        console.log('❌ Email password reset error:', error.response?.data || error.message);
    }

    // Test 4: Mobile Password Reset
    console.log('\n🔐 Test 4: Mobile Password Reset');
    try {
        const mobileResetResponse = await axios.post(`${BASE_URL}/user/reset/password-with-mobile-otp`, {
            phone_number: '7367989866',
            otp: '0000', // Replace with real OTP
            requestId: 'MOBILE_REQUEST_ID', // Replace with real request ID
            password: 'NewPassword123!',
            confirm_password: 'NewPassword123!'
        });

        if (mobileResetResponse.data.status) {
            console.log('✅ Mobile password reset successful!');
            console.log('👤 User ID:', mobileResetResponse.data.data.userId);
        } else {
            console.log('❌ Mobile password reset failed:', mobileResetResponse.data.msg);
        }
    } catch (error) {
        console.log('❌ Mobile password reset error:', error.response?.data || error.message);
    }

    console.log('\n📋 Frontend Testing Instructions:');
    console.log('=================================');
    console.log('1. Go to /forgot-password in your React app');
    console.log('2. Choose Email or Mobile method');
    console.log('3. Enter email: dosod69636@3dboxer.com OR phone: 7367989866');
    console.log('4. Click "Send OTP"');
    console.log('5. Check for OTP:');
    console.log('   - Email: Check inbox');
    console.log('   - Mobile: Check server console for test OTP');
    console.log('6. OTP dialog should open automatically');
    console.log('7. Enter the OTP');
    console.log('8. Password dialog should open');
    console.log('9. Enter new password and confirm');
    console.log('10. Click "Reset Password"');
    console.log('11. Should redirect to login page');

    console.log('\n🔍 Expected Flow:');
    console.log('=================');
    console.log('Step 1: Contact form → Send OTP');
    console.log('Step 2: OTP dialog opens → Enter OTP');
    console.log('Step 3: Password dialog opens → Enter new password');
    console.log('Step 4: Success → Redirect to login');

    console.log('\n🐛 Troubleshooting:');
    console.log('===================');
    console.log('- If OTP dialog doesn\'t open: Check console for errors');
    console.log('- If password dialog doesn\'t open: Check OTP validation');
    console.log('- If password reset fails: Check OTP and password format');
    console.log('- For mobile: Check server console for test SMS OTP');

    console.log('\n📱 Test OTP Format:');
    console.log('===================');
    console.log('Email OTP: Check email inbox');
    console.log('Mobile OTP: Look for console message like:');
    console.log('🔔 SMS OTP for +917367989866: 1234 (Request ID: sms_...)');
}

// Run the test
testForgotPasswordFlow().catch(console.error);
