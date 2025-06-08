'use strict';

/**
 * Secure Authentication Controller
 * Fixed version of auth.controller.js with NoSQL injection prevention
 */

const logger = require('../services/logger');
const log = new logger('SecureAuthController').getChildLogger();
const { userDbHandler } = require('../services/db');
const responseHelper = require('../utils/customResponse');
const jwtService = require('../services/jwt');
const {
    sanitizeInput,
    validateAuthInput,
    checkAuthRateLimit,
    securePasswordCompare,
    secureLogin
} = require('./nosql-injection-fix');

/**
 * Secure login implementation
 */
const secureLoginController = async (req, res) => {
    let responseData = {};
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
        log.info('Received secure login request from IP:', clientIp);
        
        // Rate limiting check
        try {
            checkAuthRateLimit(clientIp);
        } catch (error) {
            responseData.msg = error.message;
            return responseHelper.error(res, responseData);
        }
        
        // Extract and sanitize inputs
        const reqObj = sanitizeInput(req.body);
        const { userAddress, password } = reqObj;
        
        // Validate inputs
        const validationErrors = validateAuthInput(userAddress, password);
        if (validationErrors.length > 0) {
            responseData.msg = validationErrors[0];
            return responseHelper.error(res, responseData);
        }
        
        // Secure user lookup
        let users;
        try {
            users = await secureLogin(reqObj, userDbHandler);
        } catch (error) {
            log.warn('Login attempt with invalid input:', {
                ip: clientIp,
                userAddress: userAddress?.substring(0, 10) + '...',
                error: error.message
            });
            responseData.msg = "Invalid Credentials!";
            return responseHelper.error(res, responseData);
        }
        
        // Check if user exists
        if (!users || users.length === 0) {
            log.warn('Login attempt for non-existent user:', {
                ip: clientIp,
                userAddress: userAddress?.substring(0, 10) + '...'
            });
            responseData.msg = "Invalid Credentials!";
            return responseHelper.error(res, responseData);
        }
        
        const user = users[0];
        
        // Check if user is blocked
        if (user.is_blocked) {
            log.warn('Login attempt for blocked user:', {
                ip: clientIp,
                userId: user._id,
                blockReason: user.block_reason
            });
            responseData.msg = "Your account has been blocked. Please contact support.";
            responseData.block_reason = user.block_reason || 'No reason provided';
            return responseHelper.error(res, responseData);
        }
        
        // Check if user is active
        if (!user.status) {
            log.warn('Login attempt for inactive user:', {
                ip: clientIp,
                userId: user._id
            });
            responseData.msg = "Your account is disabled. Please contact admin.";
            return responseHelper.error(res, responseData);
        }
        
        // Secure password comparison
        let isPasswordValid;
        try {
            isPasswordValid = await securePasswordCompare(password, user.password);
        } catch (error) {
            log.error('Password comparison error:', error);
            responseData.msg = "Authentication failed. Please try again.";
            return responseHelper.error(res, responseData);
        }
        
        if (!isPasswordValid) {
            log.warn('Login attempt with incorrect password:', {
                ip: clientIp,
                userId: user._id,
                userAddress: userAddress?.substring(0, 10) + '...'
            });
            responseData.msg = "Invalid Credentials!";
            return responseHelper.error(res, responseData);
        }
        
        // Check email verification
        if (!user.email_verified) {
            log.info('Login attempt for unverified email:', {
                ip: clientIp,
                userId: user._id
            });
            responseData.msg = "Email not verified yet!";
            return responseHelper.error(res, responseData);
        }
        
        // Check 2FA requirement
        if (user.two_fa_enabled) {
            log.info('2FA required for user:', {
                ip: clientIp,
                userId: user._id
            });
            
            // Generate temporary token for 2FA step
            const tempTokenData = {
                sub: user._id,
                email: user.email,
                step: '2fa_required',
                exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
            };
            
            const tempToken = jwtService.createJWTToken(tempTokenData);
            
            responseData.msg = "2FA verification required";
            responseData.data = {
                requires_2fa: true,
                temp_token: tempToken,
                user_id: user._id
            };
            return responseHelper.success(res, responseData);
        }
        
        // Generate JWT token for successful login
        const tokenData = {
            sub: user._id,
            username: user.username,
            email: user.email,
            address: user.address,
            name: user.name,
            time: new Date().getTime()
        };
        
        const token = jwtService.createJWTToken(tokenData);
        
        // Update last login
        await userDbHandler.updateById(user._id, {
            last_login: new Date(),
            last_login_ip: clientIp
        });
        
        // Log successful login
        log.info('Successful login:', {
            ip: clientIp,
            userId: user._id,
            username: user.username
        });
        
        // Prepare response data
        responseData.msg = "Login successful";
        responseData.data = {
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                wallet: user.wallet,
                wallet_topup: user.wallet_topup,
                two_fa_enabled: user.two_fa_enabled,
                email_verified: user.email_verified,
                phone_verified: user.phone_verified
            }
        };
        
        return responseHelper.success(res, responseData);
        
    } catch (error) {
        log.error('Secure login error:', {
            ip: clientIp,
            error: error.message,
            stack: error.stack
        });
        
        responseData.msg = "Authentication failed. Please try again.";
        return responseHelper.error(res, responseData);
    }
};

/**
 * Secure 2FA login step
 */
const secure2FALogin = async (req, res) => {
    let responseData = {};
    const clientIp = req.ip || req.connection.remoteAddress;
    
    try {
        log.info('Received 2FA login request from IP:', clientIp);
        
        // Extract and sanitize inputs
        const reqObj = sanitizeInput(req.body);
        const { temp_token, two_fa_token } = reqObj;
        
        // Validate inputs
        if (!temp_token || typeof temp_token !== 'string') {
            responseData.msg = "Invalid temporary token";
            return responseHelper.error(res, responseData);
        }
        
        if (!two_fa_token || typeof two_fa_token !== 'string') {
            responseData.msg = "2FA token is required";
            return responseHelper.error(res, responseData);
        }
        
        // Verify temporary token
        let tempTokenData;
        try {
            tempTokenData = jwtService.verifyJWTToken(temp_token);
            if (tempTokenData.step !== '2fa_required') {
                throw new Error('Invalid token step');
            }
        } catch (error) {
            log.warn('Invalid temporary token:', {
                ip: clientIp,
                error: error.message
            });
            responseData.msg = "Invalid or expired temporary token";
            return responseHelper.error(res, responseData);
        }
        
        // Get user
        const user = await userDbHandler.getById(tempTokenData.sub);
        if (!user) {
            responseData.msg = "User not found";
            return responseHelper.error(res, responseData);
        }
        
        // Verify 2FA token
        const { authenticator } = require("otplib");
        const cleanToken = two_fa_token.replace(/\s/g, '');
        
        if (!authenticator.check(cleanToken, user.two_fa_secret)) {
            log.warn('Invalid 2FA token:', {
                ip: clientIp,
                userId: user._id
            });
            responseData.msg = "Invalid 2FA token";
            return responseHelper.error(res, responseData);
        }
        
        // Generate final JWT token
        const tokenData = {
            sub: user._id,
            username: user.username,
            email: user.email,
            address: user.address,
            name: user.name,
            time: new Date().getTime()
        };
        
        const token = jwtService.createJWTToken(tokenData);
        
        // Update last login
        await userDbHandler.updateById(user._id, {
            last_login: new Date(),
            last_login_ip: clientIp
        });
        
        // Log successful 2FA login
        log.info('Successful 2FA login:', {
            ip: clientIp,
            userId: user._id,
            username: user.username
        });
        
        responseData.msg = "Login successful";
        responseData.data = {
            token: token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                wallet: user.wallet,
                wallet_topup: user.wallet_topup,
                two_fa_enabled: user.two_fa_enabled,
                email_verified: user.email_verified,
                phone_verified: user.phone_verified
            }
        };
        
        return responseHelper.success(res, responseData);
        
    } catch (error) {
        log.error('Secure 2FA login error:', {
            ip: clientIp,
            error: error.message,
            stack: error.stack
        });
        
        responseData.msg = "2FA authentication failed. Please try again.";
        return responseHelper.error(res, responseData);
    }
};

/**
 * Secure user search with NoSQL injection prevention
 */
const secureUserSearch = async (req, res) => {
    let responseData = {};
    
    try {
        // Extract and sanitize search query
        const { search } = sanitizeInput(req.query);
        
        // Validate search input
        if (!search || typeof search !== 'string') {
            responseData.msg = 'Search query is required and must be a string';
            return responseHelper.error(res, responseData);
        }
        
        if (search.length < 2 || search.length > 50) {
            responseData.msg = 'Search query must be between 2 and 50 characters';
            return responseHelper.error(res, responseData);
        }
        
        // Escape special regex characters
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Build secure query
        const query = {
            $or: [
                { username: { $regex: `^${escapedSearch}`, $options: 'i' } },
                { name: { $regex: `^${escapedSearch}`, $options: 'i' } },
                { email: { $regex: `^${escapedSearch}`, $options: 'i' } }
            ]
        };
        
        // Execute secure query with limited fields
        const users = await userDbHandler.getByQuery(
            query,
            { _id: 1, username: 1, name: 1, email: 1 }
        );
        
        responseData.msg = `Found ${users.length} users matching '${search}'`;
        responseData.data = { docs: users };
        return responseHelper.success(res, responseData);
        
    } catch (error) {
        log.error('Secure user search error:', error);
        responseData.msg = 'Search failed. Please try again.';
        return responseHelper.error(res, responseData);
    }
};

module.exports = {
    secureLoginController,
    secure2FALogin,
    secureUserSearch
};
