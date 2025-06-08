const axios = require('axios');
require('dotenv').config();

async function quickTest() {
    const clientId = process.env.OTPLESS_CLIENT_ID;
    const clientSecret = process.env.OTPLESS_CLIENT_SECRET;
    
    console.log('Quick OTPless test with original server credentials');
    console.log('Client ID:', clientId);
    
    try {
        const response = await axios.post('https://auth.otpless.app/auth/v1/initiate/otp', {
            email: 'test@example.com',
            expiry: 120,
            otpLength: 4,
            channels: ['EMAIL']
        }, {
            headers: {
                'Content-Type': 'application/json',
                'clientId': clientId,
                'clientSecret': clientSecret
            },
            timeout: 5000
        });
        
        console.log('✅ SUCCESS:', response.status, response.data);
        
    } catch (error) {
        console.log('❌ ERROR:', error.response?.status, error.response?.data || error.message);
    }
}

quickTest();
