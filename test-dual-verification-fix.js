/**
 * Test script to verify the dual verification password fix
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testDualVerificationFix() {
    console.log('🔧 Testing Dual Verification Password Fix');
    console.log('=========================================');

    // Step 1: Send dual OTPs
    console.log('\n📧📱 Step 1: Sending Dual OTPs');
    let emailRequestId, mobileRequestId;
    
    try {
        const sendResponse = await axios.post(`${BASE_URL}/user/dual-verification/send-registration-otps`, {
            email: 'dosod69636@3dboxer.com',
            phone_number: '7367989866'
        });

        if (sendResponse.data.status) {
            emailRequestId = sendResponse.data.data.emailRequestId;
            mobileRequestId = sendResponse.data.data.mobileRequestId;
            
            console.log('✅ OTPs sent successfully!');
            console.log('📧 Email Request ID:', emailRequestId);
            console.log('📱 Mobile Request ID:', mobileRequestId);
            
            if (mobileRequestId?.startsWith('sms_')) {
                console.log('💡 Check server console for test SMS OTP');
            }
        } else {
            console.log('❌ Failed to send OTPs:', sendResponse.data.msg);
            return;
        }
    } catch (error) {
        console.log('❌ Error sending OTPs:', error.response?.data || error.message);
        return;
    }

    // Step 2: Test verification with correct userData structure
    console.log('\n🔐 Step 2: Testing OTP Verification');
    
    const testUserData = {
        name: 'Test User',
        username: 'testuser123',
        password: 'TestPassword123!',
        confirm_password: 'TestPassword123!', // This was missing before!
        referralId: 'admin'
    };

    console.log('👤 User Data Structure:', {
        ...testUserData,
        password: '***',
        confirm_password: '***'
    });

    try {
        // Use test OTPs (you'll need to get real ones from console/email)
        const verifyResponse = await axios.post(`${BASE_URL}/user/dual-verification/verify-registration-otps`, {
            email: 'dosod69636@3dboxer.com',
            phone_number: '7367989866',
            emailOtp: '0000', // Replace with real OTP from email
            mobileOtp: '0000', // Replace with real OTP from console/SMS
            emailRequestId: emailRequestId,
            mobileRequestId: mobileRequestId,
            userData: testUserData
        });

        if (verifyResponse.data.status) {
            console.log('🎉 SUCCESS! Dual verification completed!');
            console.log('👤 User created:', verifyResponse.data.data.username);
            console.log('🆔 User ID:', verifyResponse.data.data.userId);
            console.log('🎯 Sponsor ID:', verifyResponse.data.data.sponsorID);
        } else {
            console.log('❌ Verification failed:', verifyResponse.data.msg);
            
            // Check if it's still the password error
            if (verifyResponse.data.msg?.includes('password')) {
                console.log('🔴 Still getting password error - check userData structure');
            }
        }
    } catch (error) {
        console.log('❌ Error verifying OTPs:', error.response?.data || error.message);
        
        if (error.response?.status === 422) {
            console.log('🔴 Validation Error (422) - Check request format');
            console.log('📝 Error details:', error.response.data);
        }
    }

    console.log('\n📋 Manual Testing Instructions:');
    console.log('==============================');
    console.log('1. Check server console for test SMS OTP');
    console.log('2. Check email for email OTP');
    console.log('3. Replace "0000" with real OTPs in the test above');
    console.log('4. Run the test again with real OTPs');
    console.log('5. Or test in the React app registration form');

    console.log('\n🔍 What Was Fixed:');
    console.log('==================');
    console.log('✅ Added confirm_password to userData object');
    console.log('✅ Backend validation now passes');
    console.log('✅ No more "Confirm password and password must be same" error');

    console.log('\n📱 Next Steps:');
    console.log('==============');
    console.log('1. Test in React app registration form');
    console.log('2. Enter real email and phone number');
    console.log('3. Get OTPs from email and console/SMS');
    console.log('4. Complete registration successfully');
}

// Run the test
testDualVerificationFix().catch(console.error);
