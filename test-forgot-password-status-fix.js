/**
 * Test script to verify the forgot password status fix
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testForgotPasswordStatusFix() {
    console.log('🔧 Testing Forgot Password Status Fix');
    console.log('====================================');

    // Test 1: Mobile Forgot Password (the one that was failing)
    console.log('\n📱 Test 1: Mobile Forgot Password');
    try {
        const response = await axios.post(`${BASE_URL}/user/forgot/password-mobile`, {
            phone_number: '7367989866'
        });

        console.log('📡 API Response:', response.data);
        
        if (response.data.status === true) {
            console.log('✅ SUCCESS! API returns status: true');
            console.log('📱 Request ID:', response.data.data.requestId);
            console.log('💡 Frontend should now show OTP dialog');
            
            if (response.data.data.requestId?.startsWith('sms_')) {
                console.log('📱 Using test SMS service - check server console for OTP');
            } else {
                console.log('📱 Using real SMS service - check phone for OTP');
            }
        } else {
            console.log('❌ API returned status: false');
            console.log('📝 Message:', response.data.msg || response.data.message);
        }
    } catch (error) {
        console.log('❌ API Error:', error.response?.data || error.message);
    }

    // Test 2: Email Forgot Password (for comparison)
    console.log('\n📧 Test 2: Email Forgot Password');
    try {
        const response = await axios.post(`${BASE_URL}/user/forgot/password`, {
            email: 'dosod69636@3dboxer.com'
        });

        console.log('📡 API Response:', response.data);
        
        if (response.data.status === true) {
            console.log('✅ SUCCESS! API returns status: true');
            console.log('📧 Request ID:', response.data.data.otp_request_id);
            console.log('💡 Frontend should now show OTP dialog');
        } else {
            console.log('❌ API returned status: false');
            console.log('📝 Message:', response.data.msg || response.data.message);
        }
    } catch (error) {
        console.log('❌ API Error:', error.response?.data || error.message);
    }

    console.log('\n🔍 What Was Fixed:');
    console.log('==================');
    console.log('❌ BEFORE: Frontend checked result.success (undefined)');
    console.log('✅ AFTER: Frontend checks result.status (true/false)');
    console.log('');
    console.log('The API was always returning the correct response:');
    console.log('  {');
    console.log('    "status": true,');
    console.log('    "message": "OTP sent successfully...",');
    console.log('    "data": { "requestId": "..." }');
    console.log('  }');
    console.log('');
    console.log('But the frontend was checking for "success" instead of "status"');

    console.log('\n📱 Frontend Testing:');
    console.log('====================');
    console.log('1. Go to /forgot-password in React app');
    console.log('2. Select "Mobile" method');
    console.log('3. Enter phone: 7367989866');
    console.log('4. Click "Send OTP to Mobile"');
    console.log('5. OTP dialog should now open automatically! ✅');
    console.log('6. Check server console for test SMS OTP');
    console.log('7. Enter OTP in dialog');
    console.log('8. Password dialog should open');
    console.log('9. Complete password reset');

    console.log('\n🎯 Expected Behavior:');
    console.log('=====================');
    console.log('✅ Success message: "OTP sent to your mobile"');
    console.log('✅ OTP dialog opens automatically');
    console.log('✅ Shows phone number in dialog');
    console.log('✅ No more "undefined" errors');
    console.log('✅ Complete flow works end-to-end');

    console.log('\n📱 Test SMS OTP:');
    console.log('================');
    console.log('Look for console message like:');
    console.log('🔔 SMS OTP for +917367989866: 1234 (Request ID: sms_...)');
}

// Run the test
testForgotPasswordStatusFix().catch(console.error);
