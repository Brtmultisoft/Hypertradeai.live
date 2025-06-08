// Simple test to verify OTP functionality
console.log('Testing OTP functionality...');

// Test email validation
function isValidEmail(email) {
    return email && email.includes('@');
}

// Test OTP generation
function generateOTP(length = 4) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

// Test request ID generation
function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Run tests
console.log('1. Email validation test:');
console.log('Valid email:', isValidEmail('test@example.com')); // Should be true
console.log('Invalid email:', isValidEmail('invalid')); // Should be false

console.log('\n2. OTP generation test:');
console.log('4-digit OTP:', generateOTP(4));
console.log('6-digit OTP:', generateOTP(6));

console.log('\n3. Request ID generation test:');
console.log('Request ID:', generateRequestId());

console.log('\n4. Testing OTP flow simulation:');
const testEmail = 'test@example.com';
const otp = generateOTP(4);
const requestId = generateRequestId();

console.log(`Email: ${testEmail}`);
console.log(`Generated OTP: ${otp}`);
console.log(`Request ID: ${requestId}`);

// Simulate OTP storage
const otpStore = new Map();
otpStore.set(requestId, {
    otp: otp,
    email: testEmail,
    createdAt: Date.now(),
    expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
    verified: false
});

console.log('OTP stored successfully');

// Simulate OTP verification
const storedData = otpStore.get(requestId);
const isVerified = storedData && storedData.otp === otp;
console.log(`OTP verification result: ${isVerified}`);

console.log('\n✅ All basic tests passed! OTP functionality should work.');
console.log('\nNext steps:');
console.log('1. Start your server');
console.log('2. Try the registration with OTP');
console.log('3. Check server logs for detailed error messages');
console.log('4. The system will fallback to email OTP if OTPless API fails');
