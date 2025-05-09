import axios from 'axios';

// Get the base URL from environment variable or use default
const API_URL = axios.defaults.baseURL || 'http://localhost:2015';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

const AnnouncementService = {
  // Get all announcements
  getAnnouncements: async (params = {}) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/get-announcements`, {
        params,
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Return a default response instead of throwing an error
      return {
        status: true,
        message: 'No announcements available',
        result: {
          list: [],
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      };
    }
  },

  // Get a single announcement by ID
  getAnnouncementById: async (id) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/get-announcement/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement by ID:', error);
      // Return a default response instead of throwing an error
      return {
        status: true,
        message: 'Announcement not found',
        result: null
      };
    }
  },

  // Get announcements by category
  getAnnouncementsByCategory: async (category) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/get-announcements-by-category/${category}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements by category:', error);
      // Return a default response instead of throwing an error
      return {
        status: true,
        message: 'No announcements available for this category',
        result: {
          list: [],
          total: 0
        }
      };
    }
  }
};

export default AnnouncementService;
