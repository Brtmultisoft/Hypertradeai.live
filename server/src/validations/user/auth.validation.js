const Joi = require('@hapi/joi');
const { password, objectId, name } = require('../custom.validation');
/**
 * JOI Validation Schema for Auth Route
 */
module.exports = {
  login: Joi.object().keys({
    userAddress: Joi.string().trim().optional().allow("").min(6).max(50).label("User Name"),

    email: Joi.string().trim().optional().allow("").min(3).max(100).email().label('Email'),
    address: Joi.string().trim().optional().allow("").min(32).max(64).label("Address"),
    password: Joi.string().optional().allow("").min(8).max(20).custom(password).label('Password'),
  }),
  loginStep2: Joi.object().keys({
    two_fa_token: Joi.string().trim().required().min(5).max(6).label("OTP").error(new Error('To proceed, please enter the OTP code!')),
  }),
  checkReferID: Joi.object().keys({
    refer_id: Joi.string().trim().required().label("REFER_ID").error(new Error('Invalid Refer ID!')),
  }),
  checkAddress: Joi.object().keys({
    userAddress: Joi.string().trim().required().label("Wallet Address").error(new Error('Invalid Wallet Address!')),
  }),
  userLoginRequest: Joi.object().keys({
    hash: Joi.string().trim().required().label("HASH").error(new Error('Invalid Hash!')),
    admin_login_timestamp: Joi.string().trim().optional().label("Admin Login Timestamp"),
    login_attempt_id: Joi.string().trim().optional().label("Login Attempt ID"),
  }),
  signup: Joi.object().keys({
    referralId: Joi.string().trim().required().label("Referral ID"),
    position: Joi.string().trim().optional().allow("").min(1).max(1).custom(name).label("Position"),
    name: Joi.string().trim().optional().allow("").min(3).max(100).custom(name).label("Name"),
    username: Joi.string().trim().optional().allow("").min(6).max(100).label("User Name"),
    userAddress: Joi.string().trim().optional().allow("").min(6).max(100).label("User Name"),

    email: Joi.string().trim().optional().allow("").min(3).max(100).email().label('Email'),
    address: Joi.string().trim().optional().allow("").min(32).max(64).label("Address"),
    phone_number: Joi.string().optional().allow("").min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label("Phone Number"),
    password: Joi.string().optional().allow("").min(8).max(20).custom(password).label('Password'),
    confirm_password: Joi.string().optional().allow("").min(8).max(20).valid(Joi.ref('password')).error(new Error('Confirm password and password must be same')),
    country: Joi.string().trim().optional().allow("").max(100).label("Country"),
    email_verified: Joi.boolean().optional().label("Email Verified"),
    phone_verified: Joi.boolean().optional().label("Phone Verified"),
  }),
  forgotPassword: Joi.object().keys({
    email: Joi.string().email().required().label('Email'),
    //app_type: Joi.string().required().label('App type'),
  }),
  resetPassword: Joi.object().keys({
    token: Joi.string().trim().required().label('token'),
    // type: Joi.string().trim().required().label('type'),
    password: Joi.string().min(6).required().label('Password'),
    confirm_password: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .error(new Error('Confirm password and password must be same')),
  }),
  verifyEmail: Joi.object().keys({
    token: Joi.string().required().label('token'),
    type: Joi.string().valid('email').required().label('type'),
  }),
  resendEmailVerification: Joi.object().keys({
    email: Joi.string().email().required().label('Email'),
  }),
  applyKyc: Joi.object().keys({
    user_id: Joi.string().required().label('user_id'),
    username: Joi.string().required().label('username'),
    email: Joi.string().required().label('email'),
    phone_number: Joi.string().required().label('phone_number'),
    street: Joi.string().required().label('street'),
    country: Joi.string().required().label('country'),
    city: Joi.string().required().label('city'),
    state: Joi.string().required().label('state'),
    zip_code: Joi.string().required().label('zip_code'),
  })
};