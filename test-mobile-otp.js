/**
 * Test script for mobile OTP functionality
 * This script tests the mobile number verification during registration
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:2015'; // Adjust based on your server port
const TEST_PHONE = '+1234567890'; // Test phone number
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'Test User';
const TEST_REFERRAL = 'admin';

/**
 * Test 1: Send mobile OTP only
 */
async function testSendMobileOTP() {
    console.log('\n=== Test 1: Send Mobile OTP ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: TEST_PHONE
        });

        console.log('✅ Mobile OTP sent successfully');
        console.log('Response:', response.data);
        
        // The response should include the test OTP for our fallback service
        if (response.data.data && response.data.data.testOTP) {
            console.log(`🔔 Test OTP: ${response.data.data.testOTP}`);
        }
        
        return response.data.data.requestId;
    } catch (error) {
        console.error('❌ Failed to send mobile OTP');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 2: Verify mobile OTP
 */
async function testVerifyMobileOTP(requestId, otp) {
    console.log('\n=== Test 2: Verify Mobile OTP ===');
    
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/verify-mobile-registration-otp`, {
            phone_number: TEST_PHONE,
            otp: otp,
            requestId: requestId
        });

        console.log('✅ Mobile OTP verified successfully');
        console.log('Response:', response.data);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to verify mobile OTP');
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test 3: Send dual OTPs (email + mobile)
 */
async function testSendDualOTPs() {
    console.log('\n=== Test 3: Send Dual OTPs (Email + Mobile) ===');
    
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
 * Test 4: Complete registration with mobile verification
 */
async function testCompleteRegistrationWithMobile() {
    console.log('\n=== Test 4: Complete Registration with Mobile Verification ===');
    
    try {
        // First send mobile OTP
        const mobileRequestId = await testSendMobileOTP();
        if (!mobileRequestId) {
            console.error('❌ Could not send mobile OTP');
            return false;
        }

        // For testing, we'll use a dummy OTP since we're using the fallback service
        // In the real implementation, the user would receive the OTP via SMS
        const testOTP = '1234'; // This should match what the fallback service generates
        
        // Verify mobile OTP
        const mobileVerified = await testVerifyMobileOTP(mobileRequestId, testOTP);
        if (!mobileVerified) {
            console.error('❌ Could not verify mobile OTP');
            return false;
        }

        // Now create user with verified mobile
        const response = await axios.post(`${BASE_URL}/user/signup-with-verification`, {
            userAddress: 'testmobile@example.com',
            email: 'testmobile@example.com',
            phone_number: TEST_PHONE,
            password: TEST_PASSWORD,
            name: TEST_NAME,
            country: 'United States',
            referralId: TEST_REFERRAL,
            email_verified: true,
            phone_verified: true
        });

        console.log('✅ Registration with mobile verification completed');
        console.log('Response:', response.data);
        
        return response.data.data.userId;
    } catch (error) {
        console.error('❌ Failed to complete registration with mobile verification');
        console.error('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 5: Test phone number validation
 */
async function testPhoneValidation() {
    console.log('\n=== Test 5: Phone Number Validation ===');
    
    const testPhones = [
        '+1234567890',    // Valid US number
        '1234567890',     // US number without +
        '+919876543210',  // Valid Indian number
        '123',            // Invalid - too short
        '+123456789012345678', // Invalid - too long
        'invalid'         // Invalid format
    ];

    for (const phone of testPhones) {
        try {
            console.log(`Testing phone: ${phone}`);
            const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
                phone_number: phone
            });
            console.log(`✅ ${phone} - Valid`);
        } catch (error) {
            console.log(`❌ ${phone} - Invalid: ${error.response?.data?.msg || error.message}`);
        }
    }
}

/**
 * Test 6: Test SMS OTP service directly
 */
async function testSMSOTPService() {
    console.log('\n=== Test 6: SMS OTP Service Direct Test ===');
    
    try {
        // Import the SMS OTP service directly
        const smsOTPService = require('./server/src/services/sms-otp.service');
        
        // Send OTP
        const sendResult = await smsOTPService.sendOTP(TEST_PHONE, 4, 300);
        console.log('Send OTP result:', sendResult);
        
        if (sendResult.success) {
            // Verify OTP
            const verifyResult = await smsOTPService.verifyOTP(sendResult.testOTP, sendResult.requestId);
            console.log('Verify OTP result:', verifyResult);
            
            if (verifyResult.success) {
                console.log('✅ SMS OTP service working correctly');
            } else {
                console.log('❌ SMS OTP verification failed');
            }
        } else {
            console.log('❌ SMS OTP sending failed');
        }
        
    } catch (error) {
        console.error('❌ SMS OTP service test failed:', error.message);
    }
}

/**
 * Main test function
 */
async function runMobileOTPTests() {
    console.log('🚀 Starting Mobile OTP Tests');
    console.log('============================');
    
    // Test 1: Send mobile OTP
    const requestId = await testSendMobileOTP();
    
    // Test 2: Verify mobile OTP (using test OTP)
    if (requestId) {
        // For testing with fallback service, we can use a predictable OTP
        // In production, user would enter the OTP they received via SMS
        await testVerifyMobileOTP(requestId, '1234');
    }
    
    // Test 3: Send dual OTPs
    await testSendDualOTPs();
    
    // Test 4: Complete registration with mobile verification
    await testCompleteRegistrationWithMobile();
    
    // Test 5: Phone validation
    await testPhoneValidation();
    
    // Test 6: Direct SMS service test
    await testSMSOTPService();
    
    console.log('\n✅ All mobile OTP tests completed!');
    console.log('\nNote: The fallback SMS service is used for testing.');
    console.log('In production, integrate with a real SMS service like Twilio.');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runMobileOTPTests().catch(console.error);
}

module.exports = {
    testSendMobileOTP,
    testVerifyMobileOTP,
    testSendDualOTPs,
    testCompleteRegistrationWithMobile,
    testPhoneValidation,
    testSMSOTPService,
    runMobileOTPTests
};
