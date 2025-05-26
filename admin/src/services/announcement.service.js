import axios from 'axios';
import { getToken } from './auth.service';
import { API_URL } from '../config';

const AnnouncementService = {
  // Get all announcements with pagination and filters
  getAllAnnouncements: async (params = {}) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-all-announcements`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all announcements:', error);
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching announcement by ID:', error);
      return {
        status: false,
        message: 'Failed to get announcement',
        error: error.response?.data?.message || 'Unknown error'
      };
    }
  },

  // Create a new announcement
  createAnnouncement: async (data) => {
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/admin/create-announcement`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      return {
        status: false,
        message: 'Failed to create announcement',
        error: error.response?.data?.message || 'Unknown error'
      };
    }
  },

  // Update an announcement
  updateAnnouncement: async (id, data) => {
    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/admin/update-announcement/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating announcement:', error);
      return {
        status: false,
        message: 'Failed to update announcement',
        error: error.response?.data?.message || 'Unknown error'
      };
    }
  },

  // Delete an announcement
  deleteAnnouncement: async (id) => {
    try {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/admin/delete-announcement/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return {
        status: false,
        message: 'Failed to delete announcement',
        error: error.response?.data?.message || 'Unknown error'
      };
    }
  }
};

export default AnnouncementService;
