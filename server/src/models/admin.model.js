"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const config = require("../config/config");
const { toJSON, paginate } = require('./plugins');

/**
 * Creating User Schema Model
 */
const adminSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    last_login: {
      type: String,
      default: "",
    },
    is_super_admin: {
      type: Boolean,
      default: false
    },
    force_relogin_time: {
      type: String,
      default: null,
    },
    force_relogin_type: {
      type: String,
      enum: ['session_expired', 'account_deactive'],
      default: 'session_expired',
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// add plugin that converts mongoose to json
adminSchema.plugin(toJSON);
adminSchema.plugin(paginate);

/**
 * Method to Encrypt Admin password before Saving to Database
 * Using enhanced password service with pepper and stronger hashing
 */
adminSchema.pre("save", async function (next) {
  try {
    const admin = this;

    // Only hash the password if it has been modified (or is new)
    if (!admin.isModified("password")) {
      return next();
    }

    // Import password service
    const passwordService = require('../services/password.service');

    // Hash the password with enhanced security
    admin.password = await passwordService.hashPassword(admin.password);

    next();
  } catch (error) {
    next(error);
  }
});

// Add indexes for frequently queried fields
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ status: 1 });
adminSchema.index({ is_super_admin: 1 });
adminSchema.index({ created_at: -1 });

// Add compound indexes for common query combinations
adminSchema.index({ status: 1, created_at: -1 });
adminSchema.index({ is_super_admin: 1, status: 1 });

// Add text index for search functionality
adminSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model("Admins", adminSchema);
