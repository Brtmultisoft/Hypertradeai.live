'use strict';
require('dotenv').config();
const axios = require('axios');

// Test announcement data
const testAnnouncement = {
  title: 'Test Announcement',
  description: 'This is a test announcement created via API',
  category: 'News',
  image: 'https://via.placeholder.com/300x200/3375BB/FFFFFF?text=Test',
  backgroundColor: 'rgba(51, 117, 187, 0.1)',
  isActive: true,
  priority: 5
};

// Function to create a test announcement
async function createTestAnnouncement() {
  try {
    console.log('Creating test announcement...');
    
    // First, get an admin token
    const loginResponse = await axios.post('http://localhost:2015/admin/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.status) {
      throw new Error('Failed to login: ' + loginResponse.data.message);
    }
    
    const token = loginResponse.data.result.authToken;
    console.log('Admin login successful, token obtained');
    
    // Now create the announcement
    const response = await axios.post(
      'http://localhost:2015/create-announcement',
      testAnnouncement,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.status) {
      console.log('Announcement created successfully!');
      console.log('Announcement ID:', response.data.result._id);
      console.log('Title:', response.data.result.title);
      console.log('Category:', response.data.result.category);
    } else {
      console.error('Failed to create announcement:', response.data.message);
    }
  } catch (error) {
    console.error('Error creating announcement:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Execute the function
createTestAnnouncement();
