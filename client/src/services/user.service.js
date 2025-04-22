import api from './api';

const UserService = {
  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get user profile' };
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/user/update_profile', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (data) => {
    try {
      const response = await api.put('/user/change_password', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to change password' };
    }
  },

  // Search users by username or email
  searchUsers: async (params = {}) => {
    try {
      const response = await api.get('/search-users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to search users' };
    }
  },

  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await api.get('/user/dashboard-data');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get dashboard data' };
    }
  },

  // Generate 2FA secret
  generate2FASecret: async () => {
    try {
      const response = await api.post('/user/generate-2fa-secret');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to generate 2FA secret' };
    }
  },

  // Verify OTP
  verifyOTP: async (data) => {
    try {
      const response = await api.post('/user/verify-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to verify OTP' };
    }
  },

  // Disable 2FA
  disable2FA: async (data) => {
    try {
      const response = await api.post('/user/disable-2fa', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to disable 2FA' };
    }
  },
};

export default UserService;
