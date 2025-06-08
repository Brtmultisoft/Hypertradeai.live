const jwt = require('jsonwebtoken');

// JWT token from the request
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODI1OGVhYTA0ZWI0MzYxMzk0ZGJkYTIiLCJ1c2VybmFtZSI6ImJsb2NrQHRlc3QuY29tIiwiZW1haWwiOiJibG9ja0B0ZXN0LmNvbSIsIm5hbWUiOiJibG9jayB1c2VyIiwidGltZSI6MTc0OTM3MzY5NDgzMiwiaWF0IjoxNzQ5MzczNjk0LCJqdGkiOiI4NWI0MTc4ZWMyNDZhOTA2LTE3NDkzNzM2OTQ5MDMtYjE5NTA4YWQ1YTMwM2ZkNiIsIm5iZiI6MTc0OTM3MzY5NCwiZXhwIjoxNzQ5OTc4NDk0LCJhdWQiOiJleGFtcGxlLmNvbSIsImlzcyI6ImV4YW1wbGUuY29tIn0.C1WkyyfZCzSYo9qyVVd4P3KaMPNyInKwWoFnnj0eQEs';

console.log('=== JWT Token Analysis ===');

// Decode without verification to see the payload
try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('Header:', JSON.stringify(decoded.header, null, 2));
    console.log('Payload:', JSON.stringify(decoded.payload, null, 2));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.payload.exp;
    const iat = decoded.payload.iat;
    
    console.log('\n=== Time Analysis ===');
    console.log('Current time (Unix):', now);
    console.log('Token issued at (iat):', iat);
    console.log('Token expires at (exp):', exp);
    console.log('Current time (readable):', new Date(now * 1000).toISOString());
    console.log('Token issued (readable):', new Date(iat * 1000).toISOString());
    console.log('Token expires (readable):', new Date(exp * 1000).toISOString());
    
    if (exp < now) {
        console.log('❌ TOKEN IS EXPIRED!');
        console.log('Expired', Math.floor((now - exp) / 3600), 'hours ago');
    } else {
        console.log('✅ Token is still valid');
        console.log('Expires in', Math.floor((exp - now) / 3600), 'hours');
    }
    
} catch (error) {
    console.error('Error decoding token:', error);
}

// Try to verify with actual secret keys from .env
const commonSecrets = [
    '9889D22341540031D3386132A7BDD38F4830474543C795D019561C0A308F502B', // JWT_SECRET_KEY_USER
    '0f47727fa3bade3e164b0bfe758360dd6df7947b1966e83296ae5e0cab805394', // JWT_SECRET
    'your-secret-key',
    'secret',
    'jwt-secret'
];

console.log('\n=== Verification Attempts ===');
for (const secret of commonSecrets) {
    try {
        const verified = jwt.verify(token, secret);
        console.log(`✅ Token verified with secret: "${secret}"`);
        console.log('Verified payload:', JSON.stringify(verified, null, 2));
        break;
    } catch (error) {
        console.log(`❌ Failed with secret: "${secret}" - ${error.message}`);
    }
}
