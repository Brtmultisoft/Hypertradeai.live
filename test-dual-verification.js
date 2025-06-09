/**
 * Test script for dual verification (email + mobile) registration
 * This script demonstrates the new mobile number verification functionality
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:2015'; // Adjust based on your server port
const TEST_EMAIL = 'test@example.com';
const TEST_PHONE = '+1234567890'; // Use a valid phone number for testing
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';
const TEST_REFERRAL = 'admin'; // or any valid referral ID

// Test data
const testUserData = {
    name: TEST_NAME,
    password: TEST_PASSWORD,
    confirm_password: TEST_PASSWORD,
    country: 'United States',
    referralId: TEST_REFERRAL
};

/**
 * Test 1: Send OTPs to both email and mobile
 */
async function testSendDualOTPs() {
    console.log('\n=== Test 1: Send Dual OTPs ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/user/dual-verification/send-registration-otps`, {
            email: TEST_EMAIL,
            phone_number: TEST_PHONE
        });

        console.log('✅ Dual OTPs sent successfully');
        console.log('Response:', response.data);
        
        return {
            emailRequestId: response.data.data.emailRequestId,
            mobileRequestId: response.data.data.mobileRequestId
        };
    } catch (error) {
        console.error('❌ Failed to send dual OTPs');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 2: Send mobile OTP only
 */
async function testSendMobileOTP() {
    console.log('\n=== Test 2: Send Mobile OTP Only ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: TEST_PHONE
        });

        console.log('✅ Mobile OTP sent successfully');
        console.log('Response:', response.data);
        
        return response.data.data.requestId;
    } catch (error) {
        console.error('❌ Failed to send mobile OTP');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 3: Send email OTP only
 */
async function testSendEmailOTP() {
    console.log('\n=== Test 3: Send Email OTP Only ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-registration-otp`, {
            email: TEST_EMAIL
        });

        console.log('✅ Email OTP sent successfully');
        console.log('Response:', response.data);
        
        return response.data.data.requestId;
    } catch (error) {
        console.error('❌ Failed to send email OTP');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 4: Verify dual OTPs (requires manual OTP input)
 */
async function testVerifyDualOTPs(emailRequestId, mobileRequestId) {
    console.log('\n=== Test 4: Verify Dual OTPs ===');
    console.log('Please check your email and mobile for OTPs');
    
    // In a real scenario, you would get these OTPs from user input
    // For testing, you can manually enter them here or implement a prompt
    const emailOtp = '1234'; // Replace with actual OTP from email
    const mobileOtp = '5678'; // Replace with actual OTP from mobile
    
    try {
        const response = await axios.post(`${BASE_URL}/user/dual-verification/verify-registration-otps`, {
            email: TEST_EMAIL,
            phone_number: TEST_PHONE,
            emailOtp: emailOtp,
            mobileOtp: mobileOtp,
            emailRequestId: emailRequestId,
            mobileRequestId: mobileRequestId,
            userData: testUserData
        });

        console.log('✅ Dual OTPs verified and user created successfully');
        console.log('Response:', response.data);
        
        return response.data.data.userId;
    } catch (error) {
        console.error('❌ Failed to verify dual OTPs');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 5: Enhanced signup with verification flags
 */
async function testEnhancedSignup() {
    console.log('\n=== Test 5: Enhanced Signup with Verification ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/user/signup-with-verification`, {
            userAddress: 'testuser2@example.com',
            email: 'testuser2@example.com',
            phone_number: '+1987654321',
            password: TEST_PASSWORD,
            name: 'Test User 2',
            country: 'United States',
            referralId: TEST_REFERRAL,
            email_verified: true, // Mark as verified
            phone_verified: true  // Mark as verified
        });

        console.log('✅ Enhanced signup successful');
        console.log('Response:', response.data);
        
        return response.data.data.userId;
    } catch (error) {
        console.error('❌ Enhanced signup failed');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 6: Check if user exists
 */
async function testCheckUser(userAddress) {
    console.log('\n=== Test 6: Check User Exists ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/check-address`, {
            userAddress: userAddress
        });

        console.log('✅ User check successful');
        console.log('Response:', response.data);
        
        return response.data.data;
    } catch (error) {
        console.error('❌ User check failed');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting Dual Verification Tests');
    console.log('====================================');
    
    // Test 1: Send dual OTPs
    const otpIds = await testSendDualOTPs();
    
    // Test 2: Send mobile OTP only
    await testSendMobileOTP();
    
    // Test 3: Send email OTP only
    await testSendEmailOTP();
    
    // Test 4: Verify dual OTPs (commented out as it requires manual OTP input)
    // if (otpIds) {
    //     await testVerifyDualOTPs(otpIds.emailRequestId, otpIds.mobileRequestId);
    // }
    
    // Test 5: Enhanced signup
    const userId = await testEnhancedSignup();
    
    // Test 6: Check if user exists
    if (userId) {
        await testCheckUser('testuser2@example.com');
    }
    
    console.log('\n✅ All tests completed!');
    console.log('\nNote: To test OTP verification, you need to:');
    console.log('1. Use valid email and phone numbers');
    console.log('2. Check your email and mobile for OTPs');
    console.log('3. Update the OTP values in the testVerifyDualOTPs function');
    console.log('4. Uncomment the dual OTP verification test');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testSendDualOTPs,
    testSendMobileOTP,
    testSendEmailOTP,
    testVerifyDualOTPs,
    testEnhancedSignup,
    testCheckUser,
    runTests
};
