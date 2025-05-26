'use strict';
const { announcementModel } = require('../models');
const logger = require('../services/logger');
const log = new logger('AnnouncementSeeder').getChildLogger();

/**
 * Seed default announcements
 */
const seedDefaultAnnouncements = async () => {
  try {
    // Check if announcements already exist
    const count = await announcementModel.countDocuments();

    if (count > 0) {
      log.info('Announcements already exist, skipping seeder');
      return;
    }

    // Sample announcements data
    const announcements = [
      {
        title: 'Welcome to HyperTradeAI Platform',
        description: 'We are excited to announce the launch of our new trading platform. Get ready for an amazing trading experience with advanced AI-powered tools and features designed to maximize your profits!',
        category: 'News',
        image: 'https://placehold.co/300x200/3375BB/FFFFFF?text=Welcome',
        isActive: true,
        priority: 'High',
        type: 'Important',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'New Trading Features Released',
        description: 'We have just released a set of new trading features including advanced charting tools, improved market analysis, and faster execution speeds. Check them out now to enhance your trading strategy!',
        category: 'Update',
        image: 'https://placehold.co/300x200/28A745/FFFFFF?text=Features',
        isActive: true,
        priority: 'Medium',
        type: 'Feature',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Special Promotion: Reduced Trading Fees',
        description: 'For a limited time, we are offering reduced trading fees for all users. Trade more and pay less! This promotion is valid until the end of the month. Don\'t miss this opportunity to maximize your profits.',
        category: 'Promotion',
        image: 'https://placehold.co/300x200/FFC107/FFFFFF?text=Promotion',
        isActive: true,
        priority: 'High',
        type: 'Promotion',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Important Security Update',
        description: 'We have implemented additional security measures to protect your account. Please update your password and enable two-factor authentication for enhanced security. Your assets\' safety is our top priority.',
        category: 'Alert',
        image: 'https://placehold.co/300x200/DC3545/FFFFFF?text=Security',
        isActive: true,
        priority: 'High',
        type: 'Important',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'Scheduled Maintenance Notice',
        description: 'We will be performing scheduled maintenance on our servers on Sunday, May 12th from 2:00 AM to 4:00 AM UTC. During this time, the platform may experience brief periods of downtime. We apologize for any inconvenience.',
        category: 'News',
        image: 'https://placehold.co/300x200/6C757D/FFFFFF?text=Maintenance',
        isActive: true,
        priority: 'Medium',
        type: 'Maintenance',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        title: 'New Trading Pairs Added',
        description: 'We have added several new trading pairs to our platform, including BTC/USDT, ETH/USDT, and BNB/USDT. Start trading these pairs now to diversify your portfolio and take advantage of new market opportunities.',
        category: 'Update',
        image: 'https://placehold.co/300x200/17A2B8/FFFFFF?text=Trading',
        isActive: true,
        priority: 'Low',
        type: 'General',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Insert announcements
    await announcementModel.insertMany(announcements);

    log.info(`Successfully seeded ${announcements.length} default announcements`);
    return true;
  } catch (error) {
    log.error('Error seeding default announcements:', error);
    return false;
  }
};

module.exports = seedDefaultAnnouncements;
