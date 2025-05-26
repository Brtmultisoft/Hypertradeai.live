import api from './api';

const TeamService = {
  // Get direct team members
  getDirectTeam: async (params = {}) => {
    try {
      const response = await api.get('/get-user-direct', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get direct team' };
    }
  },

  // Get full downline team structure
  getDownline: async (userId = null) => {
    try {
      // If userId is provided, use the endpoint with userId parameter
      const url = userId ? `/get-user-downline/${userId}` : '/get-user-downline';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get downline team' };
    }
  },

  // Get downline team count
  getDownlineLength: async () => {
    try {
      const response = await api.get('/get-user-downline-length');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get downline team count' };
    }
  },

  // Get downline for a specific user ID (admin only)
  getDownlineByUserId: async (userId) => {
    if (!userId) {
      throw { msg: 'User ID is required' };
    }

    try {
      const response = await api.get(`/get-user-downline/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get downline for specified user' };
    }
  },
};

export default TeamService;
