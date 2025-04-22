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
  getDownline: async () => {
    try {
      const response = await api.get('/get-user-downline');
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
};

export default TeamService;
