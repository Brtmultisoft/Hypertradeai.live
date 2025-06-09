/**
 * Test script to verify OTPless credentials and API connectivity
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015/api/v1';

async function testOTPlessCredentials() {
    console.log('🔑 Testing OTPless Credentials & API Connectivity');
    console.log('================================================');

    // Test 1: Email OTP (should work if credentials are valid)
    console.log('\n📧 Test 1: Email OTP (Credential Validation)');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-registration-otp`, {
            email: 'rajatsinha547@gmail.com'
        });

        if (response.data.status) {
            console.log('✅ Email OTP SUCCESS - OTPless credentials are working!');
            console.log('📧 Email Request ID:', response.data.data?.requestId);
            
            if (response.data.data?.requestId?.startsWith('email_')) {
                console.log('⚠️  Email fell back to test service');
            } else {
                console.log('🎉 Real email OTP sent via OTPless API');
            }
        } else {
            console.log('❌ Email OTP failed:', response.data.msg);
        }
    } catch (error) {
        console.log('❌ Email OTP request failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }

    // Test 2: SMS OTP (main test)
    console.log('\n📱 Test 2: SMS OTP (Main Test)');
    try {
        const response = await axios.post(`${BASE_URL}/user/otpless/send-mobile-registration-otp`, {
            phone_number: '7367989866'
        });

        if (response.data.status) {
            console.log('✅ SMS OTP request successful!');
            console.log('📱 SMS Request ID:', response.data.data?.requestId);
            
            if (response.data.data?.requestId?.startsWith('sms_')) {
                console.log('⚠️  SMS fell back to test service - CHECK CONSOLE FOR TEST OTP');
                console.log('💡 Look for: 🔔 SMS OTP for +917367989866: 1234');
            } else {
                console.log('🎉 Real SMS OTP should be sent to +917367989866');
                console.log('📱 Check your phone for the OTP message!');
            }
        } else {
            console.log('❌ SMS OTP failed:', response.data.msg);
        }
    } catch (error) {
        console.log('❌ SMS OTP request failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
    }

    // Test 3: Direct API test (bypass our service)
    console.log('\n🔧 Test 3: Direct OTPless API Test');
    try {
        const directResponse = await axios.post('https://auth.otpless.app/auth/v1/initiate/otp', {
            phoneNumber: '+917367989866',
            expiry: 300,
            otpLength: 4,
            channels: ['SMS']
        }, {
            headers: {
                'Content-Type': 'application/json',
                'clientId': 'STI693NK1HU80RZE71581X4CEQ0KTP6I',
                'clientSecret': 'e2pc3vyrd21ynptcqix7tulspet51b24'
            },
            timeout: 30000
        });

        console.log('✅ Direct OTPless API SUCCESS!');
        console.log('📱 Direct Response:', directResponse.data);
        console.log('🎉 Real SMS should be sent to +917367989866');

    } catch (error) {
        console.log('❌ Direct OTPless API failed');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('🔑 Credentials issue - Invalid clientId or clientSecret');
        } else if (error.response?.status === 400) {
            console.log('📝 Request format issue - Check API parameters');
        } else if (error.response?.status === 403) {
            console.log('🚫 Access denied - Account might be suspended or SMS not enabled');
        }
    }

    console.log('\n🔍 Debugging Guide:');
    console.log('==================');
    console.log('1. If Email OTP works but SMS fails:');
    console.log('   - OTPless credentials are valid');
    console.log('   - SMS feature might not be enabled on the account');
    console.log('   - Check OTPless dashboard for SMS configuration');
    console.log('');
    console.log('2. If both Email and SMS fail:');
    console.log('   - Check OTPless credentials in .env file');
    console.log('   - Verify account is active and not suspended');
    console.log('');
    console.log('3. If Direct API test works:');
    console.log('   - Issue is in our service implementation');
    console.log('   - Check server logs for detailed error messages');
    console.log('');
    console.log('4. Expected real SMS format:');
    console.log('   "Your verification code is: 1234"');
    console.log('   Sent to: +917367989866');

    console.log('\n📱 Next Steps:');
    console.log('==============');
    console.log('1. Check server console for detailed logs');
    console.log('2. If SMS falls back, look for test OTP in console');
    console.log('3. If real SMS works, check phone +917367989866');
    console.log('4. Try registration form in React app');
}

// Run the test
testOTPlessCredentials().catch(console.error);
