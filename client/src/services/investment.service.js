import api from './api';

const InvestmentService = {
  // Get all investment plans
  getInvestmentPlans: async () => {
    try {
      const response = await api.get('/get-all-investment-plans');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get investment plans' };
    }
  },

  // Get user investments
  getUserInvestments: async (params = {}) => {
    try {
      console.log('Fetching user investments with params:', params);
      const response = await api.get('/get-user-investments', { params });
      console.log('User investments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching user investments:', error);
      console.error('Error response:', error.response?.data);
      // Return a default response instead of throwing an error
      return {
        status: false,
        msg: error.response?.data?.msg || 'Failed to get user investments',
        data: { docs: [], totalDocs: 0 }
      };
    }
  },

  // Get all investments
  getAllInvestments: async (params = {}) => {
    try {
      const response = await api.get('/get-all-investments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get investments' };
    }
  },

  // Get investment by ID
  getInvestment: async (id) => {
    try {
      const response = await api.get(`/get-investment/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get investment' };
    }
  },

  // Get investment sum
  getInvestmentSum: async (params = {}) => {
    try {
      
      const response = await api.get('/get-investment-sum', { params });
     
      return response.data;
    } catch (error) {
      return {
        status: false,
        msg: error.response?.data?.msg || 'Failed to get investment sum',
        data: [{ amount: 0, count: 0 }]
      };
    }
  },

  // Add investment
  addInvestment: async (data) => {
    try {
      const response = await api.post('/add-investment', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to add investment' };
    }
  },

  // Add trading package
  addTradingPackage: async (data) => {
    try {
      const response = await api.post('/add-trading-package', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to add trading package' };
    }
  },
};

export default InvestmentService;
