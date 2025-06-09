# Mobile Number Verification Implementation Guide

This guide explains the new mobile number verification functionality added to the registration process.

## Overview

The system now supports:
1. **Email-only verification** (existing)
2. **Mobile-only verification** (new)
3. **Dual verification** (email + mobile) (new)
4. **Enhanced signup** with verification flags (new)

## New Features Added

### 1. SMS OTP Service
- **File**: `server/src/services/sms-otp.service.js`
- **Purpose**: Fallback SMS OTP service for testing
- **Features**:
  - In-memory OTP storage
  - Automatic OTP generation
  - Expiry management
  - Console logging for testing

### 2. Enhanced OTPless Service
- **File**: `server/src/services/otpless.service.js`
- **Updates**:
  - Added `sendSMSOTP()` method
  - Added SMS fallback support
  - Improved phone number validation
  - Enhanced error handling

### 3. Dual Verification Controller
- **File**: `server/src/controllers/user/dual.verification.controller.js`
- **Methods**:
  - `sendRegistrationOTPs()` - Send OTPs to both email and mobile
  - `verifyRegistrationOTPs()` - Verify both OTPs and create user

### 4. Enhanced OTPless Controller
- **File**: `server/src/controllers/user/otpless.controller.js`
- **New Methods**:
  - `sendRegistrationMobileOTP()` - Send mobile OTP only
  - `verifyRegistrationMobileOTP()` - Verify mobile OTP only

### 5. Enhanced Auth Controller
- **File**: `server/src/controllers/user/auth.controller.js`
- **New Method**:
  - `signupWithVerification()` - Create user with verification flags

### 6. Updated User Model
- **File**: `server/src/models/user.model.js`
- **New Fields**:
  - `mobile_otp_request_id` - Store mobile OTP request ID
  - `mobile_otp_verified` - Track mobile verification status

## API Endpoints

### Mobile OTP Only

#### Send Mobile OTP
```
POST /user/otpless/send-mobile-registration-otp
Content-Type: application/json

{
  "phone_number": "+1234567890"
}
```

#### Verify Mobile OTP
```
POST /user/otpless/verify-mobile-registration-otp
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "otp": "1234",
  "requestId": "sms_1234567890_abc123"
}
```

### Dual Verification (Email + Mobile)

#### Send Dual OTPs
```
POST /user/dual-verification/send-registration-otps
Content-Type: application/json

{
  "email": "user@example.com",
  "phone_number": "+1234567890"
}
```

#### Verify Dual OTPs and Register
```
POST /user/dual-verification/verify-registration-otps
Content-Type: application/json

{
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "emailOtp": "1234",
  "mobileOtp": "5678",
  "emailRequestId": "email_request_id",
  "mobileRequestId": "mobile_request_id",
  "userData": {
    "name": "John Doe",
    "password": "SecurePassword123!",
    "confirm_password": "SecurePassword123!",
    "country": "United States",
    "referralId": "admin"
  }
}
```

### Enhanced Signup
```
POST /user/signup-with-verification
Content-Type: application/json

{
  "userAddress": "user@example.com",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "country": "United States",
  "referralId": "admin",
  "email_verified": true,
  "phone_verified": true
}
```

## Phone Number Format

The system accepts phone numbers in various formats:
- `+1234567890` (with country code)
- `1234567890` (US number without +)
- `+919876543210` (international format)

**Validation Rules**:
- Minimum 10 digits
- Maximum 16 digits
- Must start with + or digit
- Pattern: `/^[\+]?[1-9]\d{1,14}$/`

## Testing

### Using the Test Scripts

1. **Test Mobile OTP Only**:
   ```bash
   node test-mobile-otp.js
   ```

2. **Test Dual Verification**:
   ```bash
   node test-dual-verification.js
   ```

### Manual Testing

1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. Send mobile OTP:
   ```bash
   curl -X POST http://localhost:2015/user/otpless/send-mobile-registration-otp \
     -H "Content-Type: application/json" \
     -d '{"phone_number": "+1234567890"}'
   ```

3. Check console for test OTP (when using fallback service)

4. Verify mobile OTP:
   ```bash
   curl -X POST http://localhost:2015/user/otpless/verify-mobile-registration-otp \
     -H "Content-Type: application/json" \
     -d '{"phone_number": "+1234567890", "otp": "1234", "requestId": "REQUEST_ID"}'
   ```

## Production Setup

### For Real SMS Service Integration

1. **Twilio Integration** (recommended):
   ```javascript
   // In sms-otp.service.js
   const twilio = require('twilio');
   const client = twilio(accountSid, authToken);
   
   await client.messages.create({
     body: `Your OTP is: ${otp}`,
     from: '+1234567890', // Your Twilio number
     to: phoneNumber
   });
   ```

2. **AWS SNS Integration**:
   ```javascript
   const AWS = require('aws-sdk');
   const sns = new AWS.SNS();
   
   await sns.publish({
     Message: `Your OTP is: ${otp}`,
     PhoneNumber: phoneNumber
   }).promise();
   ```

3. **Update Environment Variables**:
   ```env
   # Add to .env
   SMS_SERVICE=twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

## Error Handling

The system includes comprehensive error handling:

1. **Invalid Phone Number**: Returns validation error
2. **OTP Expired**: Returns expiry error
3. **OTP Already Used**: Returns usage error
4. **Service Failure**: Falls back to alternative service
5. **Network Issues**: Returns appropriate error messages

## Security Considerations

1. **OTP Expiry**: Default 5 minutes
2. **One-time Use**: OTPs are invalidated after verification
3. **Rate Limiting**: Implement rate limiting for OTP requests
4. **Phone Validation**: Strict phone number format validation
5. **Secure Storage**: OTPs stored securely (encrypted in production)

## Monitoring

Monitor the following metrics:
- OTP delivery success rate
- OTP verification success rate
- Service fallback usage
- Phone number validation failures
- User registration completion rate

## Troubleshooting

### Common Issues

1. **OTP Not Received**:
   - Check phone number format
   - Verify SMS service configuration
   - Check service logs

2. **OTP Verification Failed**:
   - Ensure OTP hasn't expired
   - Check for typos in OTP
   - Verify request ID matches

3. **Service Errors**:
   - Check OTPless credentials
   - Verify network connectivity
   - Review service logs

### Debug Mode

Enable debug logging:
```javascript
// In your service
log.setLevel('debug');
```

Check console output for detailed OTP information when using the fallback service.

## Future Enhancements

1. **Multiple SMS Providers**: Add support for multiple SMS services
2. **International Support**: Better international phone number handling
3. **Voice OTP**: Add voice call OTP option
4. **WhatsApp OTP**: Integrate WhatsApp Business API
5. **Analytics**: Add detailed analytics and reporting
