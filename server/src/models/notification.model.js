'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Creating Notification Schema Model
 */
const notificationSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error', 'announcement', 'system', 'trade', 'payment', 'referral'],
        default: 'info'
    },
    category: {
        type: String,
        enum: ['general', 'trading', 'payment', 'security', 'referral', 'system', 'announcement'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    actionUrl: {
        type: String,
        default: ''
    },
    actionText: {
        type: String,
        default: ''
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for better performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, category: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
notificationSchema.statics.createNotification = async function(notificationData) {
    try {
        const notification = new this(notificationData);
        return await notification.save();
    } catch (error) {
        throw error;
    }
};

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
    try {
        return await this.findOneAndUpdate(
            { _id: notificationId, userId: userId },
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { new: true }
        );
    } catch (error) {
        throw error;
    }
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    try {
        return await this.updateMany(
            { userId: userId, isRead: false },
            { 
                isRead: true, 
                readAt: new Date() 
            }
        );
    } catch (error) {
        throw error;
    }
};

notificationSchema.statics.getUnreadCount = async function(userId) {
    try {
        return await this.countDocuments({
            userId: userId,
            isRead: false,
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        });
    } catch (error) {
        throw error;
    }
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    try {
        const {
            page = 1,
            limit = 20,
            type = null,
            category = null,
            isRead = null,
            sortBy = 'createdAt',
            sortOrder = -1
        } = options;

        const query = {
            userId: userId,
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        };

        if (type) query.type = type;
        if (category) query.category = category;
        if (isRead !== null) query.isRead = isRead;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder };

        const notifications = await this.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await this.countDocuments(query);

        return {
            notifications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        throw error;
    }
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
