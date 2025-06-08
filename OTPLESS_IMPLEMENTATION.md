# OTPless Authentication Implementation

This document describes the implementation of OTPless authentication with 2FA functionality in the Hypertradeai.live application.

## Overview

The implementation provides:
- **OTPless Registration**: Users can register using email OTP verification instead of traditional password-based registration
- **OTPless Login**: Users can login using email OTP instead of passwords
- **2FA Toggle**: Users can enable/disable 2FA and choose between TOTP (Google Authenticator) and OTPless (Email OTP) methods
- **Seamless Integration**: Works alongside existing authentication system

## Backend Implementation

### 1. Database Schema Updates

**User Model** (`server/src/models/user.model.js`):
```javascript
// New fields added:
otpless_enabled: Boolean (default: false)
otpless_request_id: String (stores current OTP session)
otpless_verified: Boolean (default: false)
two_fa_method: String (enum: ['totp', 'otpless'], default: 'totp')
```

### 2. OTPless Service

**File**: `server/src/services/otpless.service.js`

Handles all OTPless API interactions:
- `sendOTP(email, otpLength, expiry)` - Send OTP to email
- `verifyOTP(otp, requestId)` - Verify OTP
- `sendRegistrationOTP(email)` - Send OTP for registration (5 min expiry)
- `sendLoginOTP(email)` - Send OTP for login (2 min expiry)
- `send2FAOTP(email)` - Send OTP for 2FA (3 min expiry)

### 3. OTPless Controller

**File**: `server/src/controllers/user/otpless.controller.js`

Endpoints:
- `POST /user/otpless/send-registration-otp` - Send registration OTP
- `POST /user/otpless/verify-registration-otp` - Verify registration OTP and create user
- `POST /user/otpless/send-login-otp` - Send login OTP
- `POST /user/otpless/verify-login-otp` - Verify login OTP
- `POST /user/otpless/send-2fa-otp` - Send 2FA OTP
- `POST /user/otpless/verify-2fa-otp` - Verify 2FA OTP and complete login

### 4. 2FA Method Toggle

**File**: `server/src/controllers/user/2fa.controller.js`

New endpoint:
- `POST /user/toggle-2fa-method` - Switch between TOTP and OTPless 2FA methods

## Frontend Implementation

### 1. Auth Service Updates

**File**: `client/src/services/auth.service.js`

New methods:
- `sendRegistrationOTP(email)`
- `verifyRegistrationOTP(email, otp, requestId, userData)`
- `sendLoginOTP(email)`
- `verifyLoginOTP(email, otp, requestId)`
- `send2FAOTP(email, tempToken)`
- `verify2FAOTP(otp, requestId, tempToken)`
- `toggle2FAMethod(method)`

### 2. OTP Input Component

**File**: `client/src/components/auth/OTPInput.jsx`

Reusable OTP input component with:
- Configurable OTP length (4 or 6 digits)
- Auto-focus and navigation between inputs
- Paste support
- Resend functionality with cooldown
- Loading and error states

### 3. Updated Login Page

**File**: `client/src/pages/auth/Login.jsx`

Features:
- Tab-based login method selection (Password vs OTPless)
- OTP verification dialog
- 2FA verification dialog (supports both TOTP and OTPless)
- Seamless flow between login → OTP → 2FA (if enabled)

### 4. Updated Registration Page

**File**: `client/src/pages/auth/Register.jsx`

Features:
- Tab-based registration method selection
- OTP verification for email-based registration
- Automatic user creation after OTP verification

### 5. 2FA Settings Page

**File**: `client/src/pages/settings/TwoFactorAuth.jsx`

Features:
- Toggle 2FA on/off
- Switch between TOTP and OTPless methods
- Method-specific setup flows

## Configuration

### Environment Variables

Add to your `.env` file:
```bash
# OTPless Configuration
OTPLESS_CLIENT_ID=your-client-id
OTPLESS_CLIENT_SECRET=your-client-secret
OTPLESS_API_KEY=your-api-key
```

### OTPless API Setup

1. Sign up at [OTPless](https://otpless.app/)
2. Get your Client ID, Client Secret, and API Key
3. Configure your domain and email templates
4. Update the environment variables

## Usage Flow

### Registration with OTPless

1. User selects "OTPless Registration" tab
2. User fills in registration form
3. User clicks "Send OTP"
4. OTP is sent to user's email
5. User enters OTP in verification dialog
6. Account is created and verified automatically

### Login with OTPless

1. User selects "OTPless Login" tab
2. User enters email address
3. User clicks "Send OTP"
4. OTP is sent to user's email
5. User enters OTP
6. If 2FA is enabled, additional verification step
7. User is logged in

### 2FA Configuration

1. User goes to Settings → Two-Factor Authentication
2. User toggles 2FA on
3. User selects preferred method (TOTP or OTPless)
4. For OTPless: User verifies email OTP
5. 2FA is enabled with selected method

## Security Features

- **OTP Expiry**: Different expiry times for different use cases
- **Request ID Validation**: Each OTP session has unique request ID
- **Rate Limiting**: Built-in cooldown for resend functionality
- **Session Management**: Temporary tokens for multi-step authentication
- **Method Flexibility**: Users can choose their preferred 2FA method

## Testing

To test the implementation:

1. **Backend**: Start the server and test API endpoints with Postman
2. **Frontend**: Use the updated login/registration forms
3. **Integration**: Test the complete flow from registration to login with 2FA

## Troubleshooting

### Common Issues

1. **OTP not received**: Check spam folder, verify email configuration
2. **Invalid OTP**: Ensure OTP is entered within expiry time
3. **Request ID mismatch**: Clear browser cache and try again
4. **2FA not working**: Verify 2FA method is properly configured

### Debug Mode

Enable debug logging in the OTPless service to troubleshoot API issues.

## Future Enhancements

- SMS OTP support
- WhatsApp OTP integration
- Backup codes for 2FA
- Admin dashboard for OTP analytics
- Custom OTP templates

## Support

For issues related to:
- **OTPless API**: Contact OTPless support
- **Implementation**: Check the code comments and logs
- **Configuration**: Verify environment variables and API credentials
