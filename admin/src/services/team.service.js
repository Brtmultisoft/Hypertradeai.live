import axios from 'axios';
import { API_URL } from '../config';

/**
 * Service for team-related API calls
 */
const TeamService = {
  /**
   * Get all users
   * @param {Object} params - Query parameters
   * @returns {Promise} - API response
   */
  getAllUsers: async (params = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/get-all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get users' };
    }
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise} - API response
   */
  getUserById: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/get-user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get user' };
    }
  },

  /**
   * Get complete team structure (downline)
   * @returns {Promise} - API response
   */
  getTeamStructure: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/get-user-downline`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get team structure' };
    }
  },

  /**
   * Search users
   * @param {string} query - Search query
   * @returns {Promise} - API response
   */
  searchUsers: async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/search-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { query },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to search users' };
    }
  },

  /**
   * Update user
   * @param {Object} userData - User data to update
   * @returns {Promise} - API response
   */
  updateUser: async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/admin/update-user`, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to update user' };
    }
  },
};

export default TeamService;
