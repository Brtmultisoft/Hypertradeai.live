/**
 * Test script to verify the validation fix for dual verification
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testValidationFix() {
    console.log('🔧 Testing Validation Fix for Dual Verification');
    console.log('===============================================');

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
        } else {
            console.log('❌ Failed to send OTPs:', sendResponse.data.msg);
            return;
        }
    } catch (error) {
        console.log('❌ Error sending OTPs:', error.response?.data || error.message);
        return;
    }

    // Step 2: Test verification with CORRECT userData structure (no email/phone)
    console.log('\n🔐 Step 2: Testing OTP Verification with Fixed Structure');
    
    const testUserData = {
        // ✅ CORRECT: Only these fields should be in userData
        name: 'Test User',
        username: 'testuser123',
        password: 'TestPassword123!',
        confirm_password: 'TestPassword123!',
        referralId: 'admin'
        // ❌ REMOVED: email and phone_number (these are passed separately)
    };

    console.log('👤 Correct User Data Structure:', {
        ...testUserData,
        password: '***',
        confirm_password: '***'
    });

    console.log('\n📝 Request Structure:');
    console.log('- email: passed as separate parameter');
    console.log('- phone_number: passed as separate parameter');
    console.log('- userData: contains only name, username, password, confirm_password, referralId');

    try {
        const verifyResponse = await axios.post(`${BASE_URL}/user/dual-verification/verify-registration-otps`, {
            email: 'dosod69636@3dboxer.com', // ✅ Separate parameter
            phone_number: '7367989866', // ✅ Separate parameter
            emailOtp: '0000', // Replace with real OTP
            mobileOtp: '0000', // Replace with real OTP
            emailRequestId: emailRequestId,
            mobileRequestId: mobileRequestId,
            userData: testUserData // ✅ Clean userData object
        });

        if (verifyResponse.data.status) {
            console.log('🎉 SUCCESS! Validation fix working!');
            console.log('👤 User created:', verifyResponse.data.data.username);
            console.log('🆔 User ID:', verifyResponse.data.data.userId);
            console.log('🎯 Sponsor ID:', verifyResponse.data.data.sponsorID);
        } else {
            console.log('❌ Verification failed:', verifyResponse.data.msg);
        }
    } catch (error) {
        console.log('❌ Error verifying OTPs:', error.response?.data || error.message);
        
        if (error.response?.status === 422) {
            console.log('🔴 Still getting validation error (422)');
            console.log('📝 Error details:', error.response.data);
            
            if (error.response.data.message?.includes('not allowed')) {
                console.log('💡 Field not allowed - check userData structure');
            }
        }
    }

    console.log('\n🔍 What Was Fixed:');
    console.log('==================');
    console.log('✅ Removed email from userData object');
    console.log('✅ Removed phone_number from userData object');
    console.log('✅ Email and phone passed as separate parameters');
    console.log('✅ userData now contains only allowed fields');

    console.log('\n📋 Before vs After:');
    console.log('===================');
    console.log('❌ BEFORE (BROKEN):');
    console.log('   userData: { name, username, password, confirm_password, email, phone_number, referralId }');
    console.log('   Error: "userData.email is not allowed"');
    console.log('');
    console.log('✅ AFTER (FIXED):');
    console.log('   email: "dosod69636@3dboxer.com" (separate parameter)');
    console.log('   phone_number: "7367989866" (separate parameter)');
    console.log('   userData: { name, username, password, confirm_password, referralId }');

    console.log('\n📱 Manual Testing:');
    console.log('==================');
    console.log('1. Get real OTPs from email and console/SMS');
    console.log('2. Replace "0000" with real OTPs in the test above');
    console.log('3. Run the test again');
    console.log('4. Or test in React app registration form');
    console.log('5. Should now work without validation errors!');
}

// Run the test
testValidationFix().catch(console.error);
