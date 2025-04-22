import api from './api';

const DashboardService = {
  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await api.get('/user/dashboard-data');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get dashboard data' };
    }
  },
};

export default DashboardService;
