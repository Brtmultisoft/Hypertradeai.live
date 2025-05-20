/**
 * Script to trigger the daily profit cron job via API
 * 
 * This script will:
 * 1. Call the API endpoint to trigger the daily profit cron job
 * 2. Pass the API key for authentication
 */

const axios = require('axios');
require('dotenv').config();

async function triggerDailyProfitApi() {
  try {
    console.log('Triggering daily profit cron job via API...');
    
    // Get the API key from environment variables or use a default
    const apiKey = process.env.APP_API_KEY || 'XK7PZ8';
    
    // Get the API URL from environment variables or use a default
    const apiUrl = process.env.BASE_URL || 'http://localhost:3000/api/v1';
    
    // Call the API endpoint
    const response = await axios.post(`${apiUrl}/cron/processDailyProfit`, {
      key: apiKey
    });
    
    console.log('API response:', response.data);
    
    if (response.data.status) {
      console.log('Daily profit cron job triggered successfully');
      console.log(`Processed ${response.data.data.processedInvestments} investments with total profit of $${response.data.data.totalProfit}`);
      console.log(`Cron execution ID: ${response.data.data.cronExecutionId}`);
    } else {
      console.error('Failed to trigger daily profit cron job:', response.data.message);
    }
  } catch (error) {
    console.error('Error triggering daily profit cron job:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

// Run the function
triggerDailyProfitApi();
