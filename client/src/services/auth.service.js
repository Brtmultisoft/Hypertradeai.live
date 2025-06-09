import api from './api';

const AuthService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/user/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/user/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Registration failed' };
    }
  },

  // Forgot password with OTP
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/user/forgot/password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to process forgot password request' };
    }
  },

  // Reset password with OTP
  resetPasswordWithOTP: async (email, otp, requestId, newPassword) => {
    try {
      const response = await api.post('/user/reset/password-with-otp', {
        email,
        otp,
        requestId,
        password: newPassword,
        confirm_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to reset password' };
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to reset password' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.get('/user/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Logout failed' };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get user profile' };
    }
  },

  // OTPless Authentication Methods

  // Send registration OTP
  sendRegistrationOTP: async (email) => {
    try {
      const response = await api.post('/user/otpless/send-registration-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to send registration OTP' };
    }
  },

  // Verify registration OTP
  verifyRegistrationOTP: async (email, otp, requestId, userData) => {
    try {
      const response = await api.post('/user/otpless/verify-registration-otp', {
        email,
        otp,
        requestId,
        userData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify registration OTP' };
    }
  },

  // Send login OTP
  sendLoginOTP: async (email) => {
    try {
      const response = await api.post('/user/otpless/send-login-otp', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to send login OTP' };
    }
  },

  // Verify login OTP
  verifyLoginOTP: async (email, otp, requestId) => {
    try {
      const response = await api.post('/user/otpless/verify-login-otp', {
        email,
        otp,
        requestId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify login OTP' };
    }
  },

  // Send 2FA OTP
  send2FAOTP: async (email, tempToken) => {
    try {
      const response = await api.post('/user/otpless/send-2fa-otp', {
        email,
        tempToken
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to send 2FA OTP' };
    }
  },

  // Verify 2FA OTP
  verify2FAOTP: async (otp, requestId, userId) => {
    try {
      const response = await api.post('/user/verify-2fa-otp', {
        otp,
        otp_request_id: requestId,
        user_id: userId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify 2FA OTP' };
    }
  },

  // Toggle 2FA method
  toggle2FAMethod: async (method) => {
    try {
      const response = await api.post('/user/toggle-2fa-method', { method });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to toggle 2FA method' };
    }
  },

  // Generate 2FA secret for Google Authenticator
  generate2FASecret: async () => {
    try {
      const response = await api.post('/user/generate-2fa-secret');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to generate 2FA secret' };
    }
  },

  // Verify TOTP code for Google Authenticator
  verifyTOTP: async (token) => {
    try {
      const response = await api.post('/user/verify-otp', { token });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify TOTP code' };
    }
  },

  // Disable 2FA
  disable2FA: async (password) => {
    try {
      const response = await api.post('/user/disable-2fa', { password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to disable 2FA' };
    }
  },

  // Dual Verification Methods (Email + Mobile)

  // Send dual registration OTPs (email + mobile)
  sendDualRegistrationOTPs: async (email, phoneNumber) => {
    try {
      const response = await api.post('/user/dual-verification/send-registration-otps', {
        email,
        phone_number: phoneNumber
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to send verification codes' };
    }
  },

  // Verify dual registration OTPs and create user
  verifyDualRegistrationOTPs: async (email, phoneNumber, emailOtp, mobileOtp, emailRequestId, mobileRequestId, userData) => {
    try {
      const response = await api.post('/user/dual-verification/verify-registration-otps', {
        email,
        phone_number: phoneNumber,
        emailOtp,
        mobileOtp,
        emailRequestId,
        mobileRequestId,
        userData
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify codes' };
    }
  },

  // Mobile OTP Methods

  // Send mobile registration OTP
  sendMobileRegistrationOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/user/otpless/send-mobile-registration-otp', {
        phone_number: phoneNumber
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to send mobile OTP' };
    }
  },

  // Verify mobile registration OTP
  verifyMobileRegistrationOTP: async (phoneNumber, otp, requestId) => {
    try {
      const response = await api.post('/user/otpless/verify-mobile-registration-otp', {
        phone_number: phoneNumber,
        otp,
        requestId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify mobile OTP' };
    }
  },

  // Enhanced signup with verification flags
  signupWithVerification: async (userData) => {
    try {
      const response = await api.post('/user/signup-with-verification', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Registration failed' };
    }
  },

  // Forgot Password Methods

  // Send mobile forgot password OTP
  sendMobileForgotPasswordOTP: async (phoneNumber) => {
    try {
      const response = await api.post('/user/forgot/password-mobile', {
        phone_number: phoneNumber
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to send mobile OTP' };
    }
  },

  // Reset password with mobile OTP
  resetPasswordWithMobileOTP: async (phoneNumber, otp, requestId, newPassword) => {
    try {
      const response = await api.post('/user/reset/password-with-mobile-otp', {
        phone_number: phoneNumber,
        otp,
        requestId,
        password: newPassword,
        confirm_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to reset password with mobile OTP' };
    }
  },

  // Verify mobile OTP (for forgot password flow)
  verifyMobileOTP: async (phoneNumber, otp, requestId) => {
    try {
      const response = await api.post('/user/otpless/verify-mobile-otp', {
        phone_number: phoneNumber,
        otp,
        requestId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify mobile OTP' };
    }
  },

  // Verify email OTP for forgot password (without resetting password)
  verifyForgotPasswordOTP: async (otp, requestId) => {
    try {
      const response = await api.post('/user/verify/forgot-password-otp', {
        otp,
        otp_request_id: requestId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify forgot password OTP' };
    }
  },

  // Verify mobile OTP for forgot password (without resetting password)
  verifyForgotPasswordMobileOTP: async (otp, requestId) => {
    try {
      const response = await api.post('/user/verify/forgot-password-mobile-otp', {
        otp,
        requestId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify forgot password mobile OTP' };
    }
  },

  // Reset password with already verified OTP (email)
  resetPasswordWithVerifiedOTP: async (email, requestId, newPassword) => {
    try {
      const response = await api.post('/user/reset/password-with-verified-otp', {
        email,
        otp_request_id: requestId,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to reset password' };
    }
  },

  // Reset password with already verified mobile OTP
  resetPasswordWithVerifiedMobileOTP: async (phoneNumber, requestId, newPassword) => {
    try {
      const response = await api.post('/user/reset/password-with-verified-mobile-otp', {
        phone_number: phoneNumber,
        requestId,
        password: newPassword,
        confirm_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to reset password' };
    }
  },
};

export default AuthService;
