import api from './api';

const AuthService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Registration failed' };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to process forgot password request' };
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
};

export default AuthService;
