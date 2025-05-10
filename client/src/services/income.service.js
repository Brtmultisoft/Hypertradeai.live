import api from './api';

const IncomeService = {
  // Get all incomes
  getAllIncomes: async (params = {}) => {
    try {
      const response = await api.get('/get-all-incomes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get incomes' };
    }
  },

  // Get daily ROI incomes
  getDailyROIIncomes: async (params = {}) => {
    try {
      const response = await api.get('/get-daily-roi-incomes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get daily ROI incomes' };
    }
  },

  // Get direct incomes
  getDirectIncomes: async (params = {}) => {
    try {
      const response = await api.get('/get-direct-incomes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get direct incomes' };
    }
  },

  // Get level ROI incomes
  getLevelROIIncomes: async (params = {}) => {
    try {
      const response = await api.get('/get-level-roi-incomes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get level ROI incomes' };
    }
  },

  // Get income by ID
  getIncome: async (id) => {
    try {
      const response = await api.get(`/get-income/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get income' };
    }
  },

  // Get income sum
  getIncomeSum: async (params = {}) => {
    try {
      const response = await api.get('/get-income-sum', { params });
      console.log("asdf;liasdfjfj",response.data)
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get income sum' };
    }
  },

  // Get income history (generic method for all income types)
  getIncomeHistory: async (params = {}) => {
    try {
      const response = await api.get('/get-all-incomes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get income history' };
    }
  },
};

export default IncomeService;
