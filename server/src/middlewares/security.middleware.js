const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const logger = require('../services/logger');
const log = new logger('SecurityMiddleware').getChildLogger();
const crypto = require('crypto');
const config = require('../config/config');

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: 'Too many requests from this IP, please try again after 60 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests against the rate limit
    keyGenerator: (req) => {
        // Use IP address as the default key
        return req.ip;
    }
});

// More strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login attempts per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
});

// Security headers
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.binance.com", "https://api.coinbrain.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            formAction: ["'self'"],
            baseUri: ["'self'"],
            scriptSrcAttr: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
});

// Sanitize request data to prevent NoSQL injection
const sanitizeRequest = mongoSanitize({
    replaceWith: '_',
    onSanitize: (req, key) => {
        log.warn(`Potential NoSQL injection attack detected: ${key} was sanitized`, {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            headers: req.headers
        });
    }
});

// Prevent parameter pollution
const preventParameterPollution = hpp({
    whitelist: [
        // Add parameters that are allowed to be repeated
        'sort', 'fields', 'filter', 'page', 'limit'
    ]
});

// Generate CSRF token
const generateCsrfToken = (req, res, next) => {
    // Generate CSRF token for all routes to ensure it's available
    // but don't enforce validation yet (see verifyCsrfToken)

    // Skip token generation for static assets to improve performance
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return next();
    }

    // Generate a token if one doesn't exist yet
    if (!req.cookies || !req.cookies['XSRF-TOKEN']) {
        const csrfToken = crypto.randomBytes(16).toString('hex');
        res.cookie('XSRF-TOKEN', csrfToken, {
            httpOnly: false, // Client-side JS needs to read this
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        req.csrfToken = csrfToken;

        // For API responses, include the token in a custom header
        // This helps client-side code to get the token without cookies
        res.setHeader('X-CSRF-TOKEN', csrfToken);
    }

    next();
};

// Verify CSRF token
const verifyCsrfToken = (req, res, next) => {
    // Skip CSRF validation for now until client-side is updated
    // This is a temporary measure to ensure compatibility

    // Skip for:
    // 1. GET, HEAD, OPTIONS requests
    // 2. All API routes
    // 3. Admin and user authentication routes
    // 4. Any route with ?csrf=skip in the query (for testing)
    if (
        ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
        req.path.startsWith('/api/') ||
        req.path.includes('/admin/') ||
        req.path.includes('/user/') ||
        req.query.csrf === 'skip' ||
        process.env.NODE_ENV !== 'production'
    ) {
        return next();
    }

    // If CSRF validation is enabled for this route
    const csrfToken = req.headers['x-xsrf-token'] || req.body._csrf;
    const cookieToken = req.cookies && req.cookies['XSRF-TOKEN'];

    if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
        // Log the warning but don't block the request for now
        log.warn('CSRF token validation would have failed (currently in compatibility mode)', {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl
        });

        // Continue anyway for now - this will be enforced in the future
        return next();

        /* Uncomment this when client-side is updated to handle CSRF tokens
        return res.status(403).json({
            status: false,
            message: 'CSRF token validation failed'
        });
        */
    }
    next();
};

// Log security events
const securityLogger = (req, res, next) => {
    // Log potentially suspicious requests
    const suspiciousPatterns = [
        /\.\.\//i, // Directory traversal
        /select.*from/i, // SQL injection
        /<script>/i, // XSS
        /\$where/i, // NoSQL injection
        /\$ne/i, // NoSQL injection
        /\$gt/i, // NoSQL injection
        /\$lt/i, // NoSQL injection
    ];

    const reqBody = JSON.stringify(req.body);
    const reqQuery = JSON.stringify(req.query);
    const reqParams = JSON.stringify(req.params);

    for (const pattern of suspiciousPatterns) {
        if (
            pattern.test(req.path) ||
            pattern.test(reqBody) ||
            pattern.test(reqQuery) ||
            pattern.test(reqParams)
        ) {
            log.warn('Potential security threat detected', {
                pattern: pattern.toString(),
                ip: req.ip,
                method: req.method,
                url: req.originalUrl,
                body: reqBody.substring(0, 200), // Limit log size
                query: reqQuery,
                params: reqParams,
                headers: req.headers
            });
            break;
        }
    }
    next();
};

module.exports = {
    apiLimiter,
    authLimiter,
    securityHeaders,
    sanitizeRequest,
    preventParameterPollution,
    xss,
    generateCsrfToken,
    verifyCsrfToken,
    securityLogger
};