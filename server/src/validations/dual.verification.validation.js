const Joi = require('@hapi/joi');
const { password, name } = require('./custom.validation');

/**
 * JOI Validation Schema for Dual Verification (Email + Mobile) Routes
 */
module.exports = {
    sendRegistrationOTPs: Joi.object().keys({
        email: Joi.string().trim().required().email().label('Email'),
        phone_number: Joi.string().trim().required().min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label('Phone Number'),
    }),

    verifyRegistrationOTPs: Joi.object().keys({
        email: Joi.string().trim().required().email().label('Email'),
        phone_number: Joi.string().trim().required().min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label('Phone Number'),
        emailOtp: Joi.string().trim().required().min(4).max(6).label('Email OTP'),
        mobileOtp: Joi.string().trim().required().min(4).max(6).label('Mobile OTP'),
        emailRequestId: Joi.string().trim().required().label('Email Request ID'),
        mobileRequestId: Joi.string().trim().required().label('Mobile Request ID'),
        userData: Joi.object().keys({
            name: Joi.string().trim().required().min(2).max(100).custom(name).label('Name'),
            username: Joi.string().trim().optional().allow('').min(3).max(50).label('Username'),
            password: Joi.string().required().min(8).max(20).custom(password).label('Password'),
            confirm_password: Joi.string().required().min(8).max(20).valid(Joi.ref('password')).error(new Error('Confirm password and password must be same')),
            country: Joi.string().trim().optional().allow('').max(100).label('Country'),
            referralId: Joi.string().trim().optional().allow('').label('Referral ID'),
            referrer: Joi.string().trim().optional().allow('').label('Referrer'),
        }).required().label('User Data')
    }),

    // Validation for sending mobile OTP only
    sendMobileOTP: Joi.object().keys({
        phone_number: Joi.string().trim().required().min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label('Phone Number'),
    }),

    // Validation for verifying mobile OTP only
    verifyMobileOTP: Joi.object().keys({
        phone_number: Joi.string().trim().required().min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label('Phone Number'),
        otp: Joi.string().trim().required().min(4).max(6).label('Mobile OTP'),
        requestId: Joi.string().trim().required().label('Request ID'),
    }),

    // Validation for sending email OTP only
    sendEmailOTP: Joi.object().keys({
        email: Joi.string().trim().required().email().label('Email'),
    }),

    // Validation for verifying email OTP only
    verifyEmailOTP: Joi.object().keys({
        email: Joi.string().trim().required().email().label('Email'),
        otp: Joi.string().trim().required().min(4).max(6).label('Email OTP'),
        requestId: Joi.string().trim().required().label('Request ID'),
    }),

    // Validation for mobile forgot password
    sendMobileForgotPasswordOTP: Joi.object().keys({
        phone_number: Joi.string().trim().required().min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label('Phone Number'),
    }),

    // Validation for mobile password reset
    resetPasswordWithMobileOTP: Joi.object().keys({
        phone_number: Joi.string().trim().required().min(10).max(16).pattern(/^[\+]?[1-9]\d{1,14}$/).label('Phone Number'),
        otp: Joi.string().trim().required().min(4).max(6).label('Mobile OTP'),
        requestId: Joi.string().trim().required().label('Request ID'),
        password: Joi.string().required().min(8).max(20).custom(password).label('Password'),
        confirm_password: Joi.string().required().min(8).max(20).valid(Joi.ref('password')).error(new Error('Confirm password and password must be same')),
    }),
};
