'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const { announcementModel } = require('./src/models');

// Connect to MongoDB
const dbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/hypertradeai';
console.log('Connecting to MongoDB at:', dbUrl);

mongoose.connect(dbUrl, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  dbName: 'hypertradeai'
}).then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find all announcements
    const announcements = await announcementModel.find({});
    console.log(`Found ${announcements.length} existing announcements`);
    
    if (announcements.length === 0) {
      console.log('No announcements found to update');
      process.exit(0);
    }
    
    // Update each announcement
    let updatedCount = 0;
    for (const announcement of announcements) {
      // Convert numeric priority to string priority
      let priority = 'Low';
      if (typeof announcement.priority === 'number') {
        if (announcement.priority > 8) {
          priority = 'High';
        } else if (announcement.priority > 5) {
          priority = 'Medium';
        } else {
          priority = 'Low';
        }
      }
      
      // Determine type based on category
      let type = 'General';
      switch (announcement.category) {
        case 'Alert':
          type = 'Important';
          break;
        case 'Promotion':
          type = 'Promotion';
          break;
        case 'Update':
          type = 'Feature';
          break;
        default:
          type = 'General';
      }
      
      // Update the announcement
      const updateResult = await announcementModel.updateOne(
        { _id: announcement._id },
        { 
          $set: { 
            priority,
            type
          },
          $unset: { 
            backgroundColor: "" 
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        updatedCount++;
      }
    }
    
    console.log(`Successfully updated ${updatedCount} announcements`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating announcements:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});
