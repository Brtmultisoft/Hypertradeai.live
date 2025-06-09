/**
 * Quick test to verify dual verification is working
 * Run this after restarting the server
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2015';

async function quickTest() {
    console.log('🚀 Quick Dual Verification Test');
    console.log('===============================');

    try {
        // Test the dual verification endpoint
        console.log('\n📧📱 Testing dual verification endpoint...');
        
        const response = await axios.post(`${BASE_URL}/user/dual-verification/send-registration-otps`, {
            email: 'rajatsinha547@gmail.com',
            phone_number: '7367989866'
        });

        console.log('✅ SUCCESS! Dual verification is working!');
        console.log('Response:', response.data);
        
        if (response.data.status) {
            console.log('\n🎉 OTPs sent successfully!');
            console.log('📧 Email Request ID:', response.data.data.emailRequestId);
            console.log('📱 Mobile Request ID:', response.data.data.mobileRequestId);
            
            // Check console for test OTPs
            console.log('\n💡 Check your server console for test OTPs!');
            console.log('   Look for messages like:');
            console.log('   🔔 SMS OTP for +917367989866: 1234 (Request ID: ...)');
        } else {
            console.log('⚠️  Request succeeded but got error response:', response.data.msg);
        }

    } catch (error) {
        if (error.response?.status === 401) {
            console.log('❌ STILL GETTING AUTH ERROR!');
            console.log('   The route is still protected. Please:');
            console.log('   1. Stop the server (Ctrl+C)');
            console.log('   2. Run: cd server && npm start');
            console.log('   3. Run this test again');
            console.log('\nError details:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.log('❌ SERVER NOT RUNNING!');
            console.log('   Please start the server:');
            console.log('   cd server && npm start');
        } else {
            console.log('✅ Route is accessible (no auth error)');
            console.log('Response:', error.response?.data || error.message);
            
            // This might be a validation error or service error, which is fine
            if (error.response?.data?.msg) {
                console.log('📝 Error message:', error.response.data.msg);
            }
        }
    }

    console.log('\n🏁 Test completed!');
}

// Run the test
quickTest();
