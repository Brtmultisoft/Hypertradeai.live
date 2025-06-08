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
};

export default AuthService;
