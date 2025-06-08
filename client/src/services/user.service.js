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

  // Activate daily profit
  activateDailyProfit: async () => {
    try {
      const response = await api.post('/user/activate-daily-profit');
      return response.data;
    } catch (error) {
      // Check if the error is due to a blocked account
      if (error.response?.status === 403 && error.response?.data?.msg?.includes('blocked')) {
        const blockReason = error.response?.data?.block_reason || 'No reason provided';
        throw {
          msg: `Your account has been blocked. You cannot activate daily profit.`,
          block_reason: blockReason,
          isBlocked: true
        };
      }
      throw error.response?.data || { msg: 'Failed to activate daily profit' };
    }
  },

  // Get trade activation history with optional query parameters
  getTradeActivationHistory: async (queryParams = '') => {
    try {
      const url = `/trade/activation-history${queryParams ? `?${queryParams}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get trade activation history' };
    }
  },

  // Get daily trading status
  getDailyTradingStatus: async () => {
    try {
      const response = await api.get('/trade/daily-trading-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get daily trading status' };
    }
  },

  // Activate daily trading (new endpoint)
  activateDailyTrading: async () => {
    try {
      const response = await api.post('/trade/activate-daily-trading');
      return response.data;
    } catch (error) {
      // Check if the error is due to a blocked account
      if (error.response?.status === 403 && error.response?.data?.msg?.includes('blocked')) {
        const blockReason = error.response?.data?.block_reason || 'No reason provided';
        throw {
          msg: `Your account has been blocked. You cannot activate daily trading.`,
          block_reason: blockReason,
          isBlocked: true
        };
      }
      throw error.response?.data || { msg: 'Failed to activate daily trading' };
    }
  },

  // Check if daily profit is already activated for today
  checkDailyProfitStatus: async () => {
    try {
      const response = await api.get('/user/check-daily-profit-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to check daily profit status' };
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

export default UserService;
