const { authenticator } = require("otplib");

// Configure authenticator options
authenticator.options = {
    step: 30,        // Time step in seconds (30 is standard)
    window: 1,       // Allow ±1 time step (±30 seconds)
    digits: 6,       // 6-digit codes
    algorithm: 'sha1' // SHA1 algorithm (standard for Google Authenticator)
};

// Test function to verify a specific token against a secret
function testVerification(secret, token) {
    console.log('=== TOTP Verification Test ===');
    console.log('Secret:', secret);
    console.log('Token to verify:', token);
    
    // Clean the token (remove spaces)
    const cleanToken = token.replace(/\s/g, '');
    console.log('Clean token:', cleanToken);
    
    // Validate token format
    if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
        console.log('❌ Invalid token format');
        return false;
    }
    
    // Generate current server token
    const currentToken = authenticator.generate(secret);
    console.log('Current server token:', currentToken);
    
    // Test with check method
    const isValidCheck = authenticator.check(cleanToken, secret);
    console.log('Valid (check method):', isValidCheck);
    
    // Test with verify method and window
    const isValidVerify = authenticator.verify({
        token: cleanToken,
        secret: secret,
        window: 2
    });
    console.log('Valid (verify method with window):', isValidVerify);
    
    // Show time window tokens
    console.log('\n=== Time Window Tokens ===');
    for (let i = -2; i <= 2; i++) {
        const timeStep = Math.floor(Date.now() / 1000 / 30) + i;
        const windowToken = authenticator.generate(secret, { epoch: timeStep * 30 * 1000 });
        const match = windowToken === cleanToken ? ' ✅ MATCH' : '';
        console.log(`Window ${i}: ${windowToken}${match}`);
    }
    
    return isValidVerify;
}

// Test with your specific secret and a token you enter
const secret = 'IJNBOBJWKUWCEXRZ'; // Latest secret from server logs for user litoji2664@2mik.com

// Get token from command line argument
const token = process.argv[2];

if (!token) {
    console.log('Usage: node test-totp-endpoint.js <6-digit-token>');
    console.log('Example: node test-totp-endpoint.js 123456');
    
    // Show current valid token
    const currentToken = authenticator.generate(secret);
    console.log('\nCurrent valid token for your secret:', currentToken);
} else {
    testVerification(secret, token);
}
