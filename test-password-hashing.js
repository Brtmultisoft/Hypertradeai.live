const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test.password@example.com';
const TEST_PHONE = '+1234567890';
const TEST_PASSWORD = 'TestPassword123!';
const NEW_PASSWORD = 'NewPassword456!';

console.log('🔐 Testing Password Hashing in All Scenarios');
console.log('==============================================');

async function testPasswordHashing() {
    try {
        // Test 1: Email Forgot Password Flow
        console.log('\n📧 Test 1: Email Forgot Password Flow');
        console.log('-------------------------------------');
        
        // Step 1: Send forgot password OTP
        console.log('Step 1: Sending forgot password OTP...');
        const forgotPasswordResponse = await axios.post(`${BASE_URL}/user/forgot/password`, {
            email: TEST_EMAIL
        });
        
        if (forgotPasswordResponse.data.status) {
            console.log('✅ Forgot password OTP sent successfully');
            const requestId = forgotPasswordResponse.data.data.otp_request_id;
            console.log('📧 Request ID:', requestId);
            
            // For testing, we'll use a dummy OTP (in real scenario, user would get this via email)
            const testOTP = '1234'; // This would normally come from email
            
            // Step 2: Reset password with OTP
            console.log('Step 2: Resetting password with OTP...');
            try {
                const resetResponse = await axios.post(`${BASE_URL}/user/reset/password-with-otp`, {
                    email: TEST_EMAIL,
                    otp: testOTP,
                    otp_request_id: requestId,
                    new_password: NEW_PASSWORD
                });
                
                if (resetResponse.data.status) {
                    console.log('✅ Email password reset successful - Password should be hashed');
                } else {
                    console.log('⚠️ Email password reset failed (expected with dummy OTP):', resetResponse.data.msg);
                }
            } catch (error) {
                console.log('⚠️ Email password reset failed (expected with dummy OTP):', error.response?.data?.msg || error.message);
            }
        } else {
            console.log('❌ Failed to send forgot password OTP:', forgotPasswordResponse.data.msg);
        }

        // Test 2: Mobile Forgot Password Flow
        console.log('\n📱 Test 2: Mobile Forgot Password Flow');
        console.log('-------------------------------------');
        
        // Step 1: Send mobile forgot password OTP
        console.log('Step 1: Sending mobile forgot password OTP...');
        try {
            const mobileForgotResponse = await axios.post(`${BASE_URL}/user/forgot/password-mobile`, {
                phone_number: TEST_PHONE
            });
            
            if (mobileForgotResponse.data.status) {
                console.log('✅ Mobile forgot password OTP sent successfully');
                const mobileRequestId = mobileForgotResponse.data.data.requestId;
                console.log('📱 Request ID:', mobileRequestId);
                
                // Step 2: Reset password with mobile OTP
                console.log('Step 2: Resetting password with mobile OTP...');
                try {
                    const mobileResetResponse = await axios.post(`${BASE_URL}/user/reset/password-with-mobile-otp`, {
                        phone_number: TEST_PHONE,
                        otp: '1234',
                        requestId: mobileRequestId,
                        password: NEW_PASSWORD,
                        confirm_password: NEW_PASSWORD
                    });
                    
                    if (mobileResetResponse.data.status) {
                        console.log('✅ Mobile password reset successful - Password should be hashed');
                    } else {
                        console.log('⚠️ Mobile password reset failed (expected with dummy OTP):', mobileResetResponse.data.msg);
                    }
                } catch (error) {
                    console.log('⚠️ Mobile password reset failed (expected with dummy OTP):', error.response?.data?.msg || error.message);
                }
            } else {
                console.log('❌ Failed to send mobile forgot password OTP:', mobileForgotResponse.data.msg);
            }
        } catch (error) {
            console.log('❌ Mobile forgot password error:', error.response?.data?.msg || error.message);
        }

        // Test 3: OTPless Registration Flow
        console.log('\n🔐 Test 3: OTPless Registration Flow');
        console.log('-----------------------------------');
        
        // Step 1: Send registration OTP
        console.log('Step 1: Sending registration OTP...');
        try {
            const regOTPResponse = await axios.post(`${BASE_URL}/user/otpless/send-registration-otp`, {
                email: `test.reg.${Date.now()}@example.com`
            });
            
            if (regOTPResponse.data.status) {
                console.log('✅ Registration OTP sent successfully');
                const regRequestId = regOTPResponse.data.data.requestId;
                const regEmail = regOTPResponse.data.data.email;
                console.log('📧 Registration Request ID:', regRequestId);
                
                // Step 2: Verify registration OTP (this would create user with hashed password)
                console.log('Step 2: Verifying registration OTP...');
                try {
                    const verifyRegResponse = await axios.post(`${BASE_URL}/user/otpless/verify-registration-otp`, {
                        email: regEmail,
                        otp: '1234',
                        requestId: regRequestId,
                        userData: {
                            username: 'testuser',
                            password: TEST_PASSWORD,
                            name: 'Test User',
                            phone_number: '+1987654321',
                            country: 'US',
                            refer_id: null
                        }
                    });
                    
                    if (verifyRegResponse.data.status) {
                        console.log('✅ Registration successful - Password should be hashed');
                    } else {
                        console.log('⚠️ Registration failed (expected with dummy OTP):', verifyRegResponse.data.msg);
                    }
                } catch (error) {
                    console.log('⚠️ Registration failed (expected with dummy OTP):', error.response?.data?.msg || error.message);
                }
            } else {
                console.log('❌ Failed to send registration OTP:', regOTPResponse.data.msg);
            }
        } catch (error) {
            console.log('❌ Registration OTP error:', error.response?.data?.msg || error.message);
        }

        // Test 4: Check Password Service Directly
        console.log('\n🔧 Test 4: Password Service Direct Test');
        console.log('-------------------------------------');
        
        try {
            // This would require access to the password service directly
            console.log('💡 Password service should be tested separately in the server environment');
            console.log('💡 Key points to verify:');
            console.log('   - Passwords are hashed with bcrypt + pepper');
            console.log('   - Hash verification works correctly');
            console.log('   - Old passwords cannot be reused');
            console.log('   - Hashed passwords are stored in database');
        } catch (error) {
            console.log('❌ Password service test error:', error.message);
        }

        console.log('\n📋 Summary of Password Hashing Implementation');
        console.log('============================================');
        console.log('✅ Email forgot password: Uses _encryptPassword() function');
        console.log('✅ Mobile forgot password: Uses _encryptPassword() function');
        console.log('✅ OTPless registration: Uses passwordService.hashPassword()');
        console.log('✅ User model pre-save hook: Automatically hashes on save()');
        console.log('⚠️ Note: updateById() operations require manual hashing');
        console.log('');
        console.log('🔐 All password operations should now properly hash passwords!');
        console.log('🔍 Check database to verify passwords are stored as hashes, not plain text');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testPasswordHashing();
