const { authenticator } = require("otplib");

// Configure authenticator options
authenticator.options = {
    step: 30,        // Time step in seconds (30 is standard)
    window: 1,       // Allow ±1 time step (±30 seconds)
    digits: 6,       // 6-digit codes
    algorithm: 'sha1' // SHA1 algorithm (standard for Google Authenticator)
};

// Test TOTP functionality
function testTOTP() {
    console.log('=== TOTP Test ===');

    // Generate a secret
    const secret = authenticator.generateSecret();
    console.log('Generated Secret:', secret);
    console.log('Secret Length:', secret.length);

    // Generate current token
    const token = authenticator.generate(secret);
    console.log('Generated Token:', token);
    console.log('Token Length:', token.length);

    // Verify the token using check method
    const isValidCheck = authenticator.check(token, secret);
    console.log('Token Valid (check):', isValidCheck);

    // Verify the token using verify method with window
    const isValidVerify = authenticator.verify({
        token: token,
        secret: secret,
        window: 2
    });
    console.log('Token Valid (verify with window):', isValidVerify);

    // Test with the specific secret from your logs
    const testSecret = 'BQBV4LCHAJLEQCQK';
    console.log('\n=== Testing with your secret ===');
    console.log('Test Secret:', testSecret);

    const testToken = authenticator.generate(testSecret);
    console.log('Generated Token for your secret:', testToken);

    const testValidCheck = authenticator.check(testToken, testSecret);
    console.log('Token valid for your secret (check):', testValidCheck);

    const testValidVerify = authenticator.verify({
        token: testToken,
        secret: testSecret,
        window: 2
    });
    console.log('Token valid for your secret (verify):', testValidVerify);

    // Generate OTP Auth URL
    const email = 'block@test.com';
    const appName = 'HypertradeAI';
    const otpAuthUrl = authenticator.keyuri(email, appName, testSecret);
    console.log('\nOTP Auth URL:', otpAuthUrl);

    console.log('\n=== Manual Entry Details ===');
    console.log('Account Name:', email);
    console.log('Secret Key:', testSecret);
    console.log('App Name:', appName);
    console.log('Current Token:', testToken);

    // Test verification with different time windows
    console.log('\n=== Time Window Test ===');
    for (let i = -2; i <= 2; i++) {
        const timeStep = Math.floor(Date.now() / 1000 / 30) + i;
        const windowToken = authenticator.generate(testSecret, { epoch: timeStep * 30 * 1000 });
        console.log(`Window ${i}: ${windowToken}`);
    }
}

testTOTP();
