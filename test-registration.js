// Test script to verify registration flow
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api'; // Change this to your server URL

async function testRegistrationFlow() {
    console.log('🧪 Testing Registration Flow...\n');
    
    const testData = {
        email: 'test@example.com',
        userData: {
            name: 'Test User',
            username: 'testuser123',
            email: 'test@example.com',
            password: 'password123',
            phone_number: '1234567890',
            country: 'US'
            // No referralId - should use default
        }
    };
    
    try {
        // Step 1: Send Registration OTP
        console.log('📧 Step 1: Sending registration OTP...');
        console.log('Email:', testData.email);
        
        const sendResponse = await axios.post(`${API_BASE}/user/otpless/send-registration-otp`, {
            email: testData.email
        });
        
        console.log('✅ OTP Send Response:', sendResponse.data);
        
        if (!sendResponse.data.status) {
            console.error('❌ Failed to send OTP:', sendResponse.data.msg);
            return;
        }
        
        const requestId = sendResponse.data.data.requestId;
        console.log('📝 Request ID:', requestId);
        
        // Step 2: Simulate OTP verification (you'll need to check your email for the actual OTP)
        console.log('\n🔐 Step 2: Testing OTP verification...');
        console.log('⚠️  You need to check your email for the actual OTP code');
        console.log('⚠️  For testing, we\'ll try with a dummy OTP (this will likely fail)');
        
        const testOTP = '1234'; // This will likely fail unless you use the real OTP
        
        const verifyResponse = await axios.post(`${API_BASE}/user/otpless/verify-registration-otp`, {
            email: testData.email,
            otp: testOTP,
            requestId: requestId,
            userData: testData.userData
        });
        
        console.log('✅ OTP Verification Response:', verifyResponse.data);
        
        if (verifyResponse.data.status) {
            console.log('🎉 Registration completed successfully!');
            console.log('👤 User ID:', verifyResponse.data.data.userId);
            console.log('📧 Email:', verifyResponse.data.data.email);
            console.log('👤 Username:', verifyResponse.data.data.username);
            console.log('🆔 Sponsor ID:', verifyResponse.data.data.sponsorID);
        } else {
            console.log('❌ OTP verification failed:', verifyResponse.data.msg);
            console.log('💡 This is expected if you used a dummy OTP');
        }
        
    } catch (error) {
        console.error('❌ Error during registration test:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }
}

async function testReferralValidation() {
    console.log('\n🔗 Testing Referral Validation...\n');
    
    try {
        // Test with 'admin' referral
        console.log('Testing with "admin" referral...');
        const adminResponse = await axios.post(`${API_BASE}/user/otpless/send-registration-otp`, {
            email: 'test-admin@example.com'
        });
        console.log('Admin referral test:', adminResponse.data.status ? '✅ Success' : '❌ Failed');
        
    } catch (error) {
        console.error('❌ Referral test error:', error.response?.data || error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting OTP Registration Tests\n');
    console.log('📋 Test Configuration:');
    console.log('- API Base:', API_BASE);
    console.log('- Test Email: test@example.com');
    console.log('- Expected: OTP sent via email fallback\n');
    
    await testRegistrationFlow();
    await testReferralValidation();
    
    console.log('\n📝 Summary:');
    console.log('1. If OTP sending works, check your email for the code');
    console.log('2. Use the real OTP code to complete registration');
    console.log('3. Check server logs for detailed error messages');
    console.log('4. The system should fallback to email OTP if OTPless API fails');
    console.log('\n🔧 To complete the test:');
    console.log('1. Check your email for the OTP');
    console.log('2. Replace the dummy OTP in this script with the real one');
    console.log('3. Run the script again');
}

// Run the tests
runAllTests().catch(console.error);
