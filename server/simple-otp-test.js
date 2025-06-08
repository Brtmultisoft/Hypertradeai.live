const axios = require('axios');
require('dotenv').config();

async function testOTP() {
    console.log('Testing OTPless with original server credentials...\n');
    
    const clientId = process.env.OTPLESS_CLIENT_ID;
    const clientSecret = process.env.OTPLESS_CLIENT_SECRET;
    
    console.log('Client ID:', clientId);
    console.log('Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'Not set');
    
    try {
        const data = {
            email: 'test@example.com',
            expiry: 120,
            otpLength: 4,
            channels: ['EMAIL']
        };
        
        console.log('\nSending OTP request...');
        console.log('Data:', JSON.stringify(data, null, 2));
        
        const response = await axios.post('https://auth.otpless.app/auth/v1/initiate/otp', data, {
            headers: {
                'Content-Type': 'application/json',
                'clientId': clientId,
                'clientSecret': clientSecret
            },
            timeout: 10000
        });
        
        console.log('\n✅ Success!');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('\n❌ Error!');
        console.log('Status:', error.response?.status);
        console.log('Error:', JSON.stringify(error.response?.data, null, 2));
        console.log('Message:', error.message);
    }
}

testOTP();
