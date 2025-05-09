'use strict';
const mongoose = require('mongoose');
const config = require('./src/config/config');

// Connect to MongoDB
const dbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/hypertradeai';
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'hypertradeai'
}).then(() => {
  console.log('Connected to MongoDB');

  // Define the Announcement schema
  const announcementSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    image: String,
    backgroundColor: String,
    isActive: Boolean,
    priority: Number,
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
    created_at: Date,
    updated_at: Date
  });

  // Create the model
  const Announcement = mongoose.model('Announcements', announcementSchema);

  // Find all announcements
  Announcement.find({})
    .then(announcements => {
      console.log('Total announcements found:', announcements.length);

      if (announcements.length === 0) {
        console.log('No announcements found. Creating sample announcements...');

        // Sample announcements data
        const sampleAnnouncements = [
          {
            title: 'Welcome to HyperTradeAI Platform',
            description: 'We are excited to announce the launch of our new trading platform. Get ready for an amazing trading experience with advanced AI-powered tools and features designed to maximize your profits!',
            category: 'News',
            image: 'https://via.placeholder.com/300x200/3375BB/FFFFFF?text=Welcome',
            backgroundColor: 'rgba(51, 117, 187, 0.1)',
            isActive: true,
            priority: 10,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            title: 'New Trading Features Released',
            description: 'We have just released a set of new trading features including advanced charting tools, improved market analysis, and faster execution speeds. Check them out now to enhance your trading strategy!',
            category: 'Update',
            image: 'https://via.placeholder.com/300x200/28A745/FFFFFF?text=Features',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            isActive: true,
            priority: 8,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            title: 'Special Promotion: Reduced Trading Fees',
            description: 'For a limited time, we are offering reduced trading fees for all users. Trade more and pay less! This promotion is valid until the end of the month. Don\'t miss this opportunity to maximize your profits.',
            category: 'Promotion',
            image: 'https://via.placeholder.com/300x200/FFC107/FFFFFF?text=Promotion',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            isActive: true,
            priority: 9,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            title: 'Important Security Update',
            description: 'We have implemented additional security measures to protect your account. Please update your password and enable two-factor authentication for enhanced security. Your assets\' safety is our top priority.',
            category: 'Alert',
            image: 'https://via.placeholder.com/300x200/DC3545/FFFFFF?text=Security',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            isActive: true,
            priority: 10,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            title: 'Scheduled Maintenance Notice',
            description: 'We will be performing scheduled maintenance on our servers on Sunday, May 12th from 2:00 AM to 4:00 AM UTC. During this time, the platform may experience brief periods of downtime. We apologize for any inconvenience.',
            category: 'News',
            image: 'https://via.placeholder.com/300x200/6C757D/FFFFFF?text=Maintenance',
            backgroundColor: 'rgba(108, 117, 125, 0.1)',
            isActive: true,
            priority: 7,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            title: 'New Trading Pairs Added',
            description: 'We have added several new trading pairs to our platform, including BTC/USDT, ETH/USDT, and BNB/USDT. Start trading these pairs now to diversify your portfolio and take advantage of new market opportunities.',
            category: 'Update',
            image: 'https://via.placeholder.com/300x200/17A2B8/FFFFFF?text=Trading',
            backgroundColor: 'rgba(23, 162, 184, 0.1)',
            isActive: true,
            priority: 6,
            created_at: new Date(),
            updated_at: new Date()
          }
        ];

        // Insert announcements
        return Announcement.insertMany(sampleAnnouncements)
          .then(createdAnnouncements => {
            console.log(`Successfully created ${createdAnnouncements.length} announcements`);

            // Display each created announcement
            createdAnnouncements.forEach((announcement, index) => {
              console.log(`\nAnnouncement #${index + 1}:`);
              console.log('Title:', announcement.title);
              console.log('Category:', announcement.category);
              console.log('Active:', announcement.isActive);
              console.log('Priority:', announcement.priority);
            });

            return createdAnnouncements;
          });
      } else {
        // Display each announcement
        announcements.forEach((announcement, index) => {
          console.log(`\nAnnouncement #${index + 1}:`);
          console.log('Title:', announcement.title);
          console.log('Description:', announcement.description.substring(0, 100) + '...');
          console.log('Category:', announcement.category);
          console.log('Active:', announcement.isActive);
          console.log('Priority:', announcement.priority);
          console.log('Created At:', announcement.created_at);
        });

        return announcements;
      }
    })
    .then(() => {
      // Close the connection
      mongoose.connection.close();
      console.log('\nConnection closed');
    })
    .catch(err => {
      console.error('Error finding announcements:', err);
      mongoose.connection.close();
    });
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});
