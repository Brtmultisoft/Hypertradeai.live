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
 */
adminSchema.pre("save", function (next) {
  let admin = this;
  let salt = config.bcrypt.saltValue;
  // only hash the password if it has been modified (or is new)
  if (!admin.isModified("password")) {
    return next();
  }
  // generate a salt
  bcrypt.genSalt(salt, function (err, salt) {
    if (err) return next(err);
    // hash the password with new salt
    bcrypt.hash(admin.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the plain password with the hashed one
      admin.password = hash;
      next();
    });
  });
});

module.exports = mongoose.model("Admins", adminSchema);
