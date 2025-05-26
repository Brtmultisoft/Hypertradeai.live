'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Announcement Schema Model
 */
const announcementSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['News', 'Update', 'Promotion', 'Alert', 'Other'],
        default: 'News'
    },
    image: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: mongoose.Schema.Types.Mixed, // Can be either Number or String
        default: 'Low' // Now using 'Low', 'Medium', 'High' instead of numbers
    },
    type: {
        type: String,
        enum: ['General', 'Important', 'Maintenance', 'Feature', 'Promotion'],
        default: 'General'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false // Make it optional to prevent errors
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    extra: {
        type: Object,
        default: {}
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Add indexes for frequently queried fields
announcementSchema.index({ isActive: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ type: 1 });
announcementSchema.index({ category: 1 });
announcementSchema.index({ created_at: -1 });
announcementSchema.index({ createdBy: 1 });

// Add compound indexes for common query combinations
announcementSchema.index({ isActive: 1, priority: 1 });
announcementSchema.index({ isActive: 1, created_at: -1 });
announcementSchema.index({ type: 1, isActive: 1 });
announcementSchema.index({ category: 1, isActive: 1 });

// Add text index for search functionality
announcementSchema.index({ title: 'text', description: 'text' });

// Create the model
const announcementModel = mongoose.model('Announcements', announcementSchema);

module.exports = announcementModel;
