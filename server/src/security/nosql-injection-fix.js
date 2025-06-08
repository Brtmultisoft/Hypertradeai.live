'use strict';

/**
 * NoSQL Injection Prevention Utilities
 * Fixes for the identified vulnerabilities in authentication and search
 */

const logger = require('../services/logger');
const log = new logger('NoSQLInjectionFix').getChildLogger();

/**
 * Sanitize input to prevent NoSQL injection
 */
function sanitizeInput(input) {
    if (typeof input === 'string') {
        return input;
    }
    
    if (typeof input === 'object' && input !== null) {
        // Remove MongoDB operators
        const dangerousKeys = ['$where', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$regex', '$exists', '$or', '$and', '$not'];
        
        for (const key of dangerousKeys) {
            if (input.hasOwnProperty(key)) {
                log.warn('NoSQL injection attempt detected:', { input, key });
                throw new Error('Invalid input detected');
            }
        }
        
        // Recursively sanitize nested objects
        const sanitized = {};
        for (const [key, value] of Object.entries(input)) {
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeInput(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    
    return input;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
}

/**
 * Validate username format
 */
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    return typeof username === 'string' && 
           username.length >= 3 && 
           username.length <= 50 && 
           usernameRegex.test(username);
}

/**
 * Fixed login function with proper input validation
 */
async function secureLogin(reqObj, userDbHandler) {
    try {
        // Sanitize inputs
        const userAddress = sanitizeInput(reqObj?.userAddress);
        const password = sanitizeInput(reqObj?.password);
        
        // Validate input types
        if (typeof userAddress !== 'string' || typeof password !== 'string') {
            throw new Error('Invalid input format');
        }
        
        // Validate input lengths
        if (userAddress.length < 3 || userAddress.length > 100) {
            throw new Error('Invalid userAddress length');
        }
        
        if (password.length < 6 || password.length > 100) {
            throw new Error('Invalid password length');
        }
        
        // Build secure query with exact string matching
        let query;
        
        if (isValidEmail(userAddress)) {
            // If it's an email, search by email only
            query = { email: userAddress.toLowerCase() };
        } else if (isValidUsername(userAddress)) {
            // If it's a username, search by username only
            query = { username: userAddress };
        } else {
            throw new Error('Invalid userAddress format');
        }
        
        // Execute secure query
        const users = await userDbHandler.getByQuery(query);
        
        return users;
        
    } catch (error) {
        log.error('Secure login error:', error);
        throw error;
    }
}

/**
 * Fixed search function with proper input validation
 */
async function secureUserSearch(searchQuery, userDbHandler) {
    try {
        // Sanitize input
        const search = sanitizeInput(searchQuery);
        
        // Validate input
        if (typeof search !== 'string') {
            throw new Error('Search query must be a string');
        }
        
        if (search.length < 2 || search.length > 50) {
            throw new Error('Search query must be between 2 and 50 characters');
        }
        
        // Escape special regex characters
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Build secure query with escaped regex
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
        
        return users;
        
    } catch (error) {
        log.error('Secure search error:', error);
        throw error;
    }
}

/**
 * Middleware to prevent NoSQL injection
 */
function noSQLInjectionMiddleware(req, res, next) {
    try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeInput(req.body);
        }
        
        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeInput(req.query);
        }
        
        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeInput(req.params);
        }
        
        next();
        
    } catch (error) {
        log.warn('NoSQL injection attempt blocked:', {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            query: req.query,
            error: error.message
        });
        
        return res.status(400).json({
            status: false,
            message: 'Invalid input detected'
        });
    }
}

/**
 * Enhanced input validation for authentication
 */
function validateAuthInput(userAddress, password) {
    const errors = [];
    
    // Validate userAddress
    if (!userAddress || typeof userAddress !== 'string') {
        errors.push('userAddress is required and must be a string');
    } else if (userAddress.length < 3 || userAddress.length > 100) {
        errors.push('userAddress must be between 3 and 100 characters');
    } else if (!isValidEmail(userAddress) && !isValidUsername(userAddress)) {
        errors.push('userAddress must be a valid email or username');
    }
    
    // Validate password
    if (!password || typeof password !== 'string') {
        errors.push('password is required and must be a string');
    } else if (password.length < 6 || password.length > 100) {
        errors.push('password must be between 6 and 100 characters');
    }
    
    return errors;
}

/**
 * Rate limiting for authentication attempts
 */
const authAttempts = new Map();

function checkAuthRateLimit(ip) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    
    if (!authAttempts.has(ip)) {
        authAttempts.set(ip, []);
    }
    
    const attempts = authAttempts.get(ip);
    
    // Remove old attempts
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    authAttempts.set(ip, recentAttempts);
    
    if (recentAttempts.length >= maxAttempts) {
        throw new Error('Too many authentication attempts. Please try again later.');
    }
    
    // Add current attempt
    recentAttempts.push(now);
    authAttempts.set(ip, recentAttempts);
}

/**
 * Secure password comparison with timing attack protection
 */
async function securePasswordCompare(inputPassword, hashedPassword) {
    const bcrypt = require('bcryptjs');
    
    try {
        // Always perform comparison to prevent timing attacks
        const isValid = await bcrypt.compare(inputPassword, hashedPassword);
        
        // Add random delay to prevent timing attacks
        const delay = Math.random() * 100 + 50; // 50-150ms
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return isValid;
        
    } catch (error) {
        log.error('Password comparison error:', error);
        
        // Still add delay even on error
        const delay = Math.random() * 100 + 50;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return false;
    }
}

module.exports = {
    sanitizeInput,
    isValidEmail,
    isValidUsername,
    secureLogin,
    secureUserSearch,
    noSQLInjectionMiddleware,
    validateAuthInput,
    checkAuthRateLimit,
    securePasswordCompare
};
