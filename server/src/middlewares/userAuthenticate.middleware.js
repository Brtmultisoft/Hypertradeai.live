'use strict';
const passport = require('passport');
const jwt = require('jsonwebtoken');
const responseHelper = require('../utils/customResponse');
const logger = require('../services/logger');
const log = new logger('MiddlewareController').getChildLogger();
const { userDbHandler } = require('../services/db');
const config = require('../config/config');

/*********************************************
 * SERVICE FOR HANDLING TOKEN AUTHENTICATION
 *********************************************/
module.exports = (req, res, next) => {
    let responseData = {};

    // Check if token is present in the Authorization header or the request body
    const token = req.headers.authorization?.split(' ')[1] || req.body.token;

    if (token) {
        try {
            // Verify the JWT token instead of just decoding it
            const decodedToken = jwt.verify(token, config.jwtTokenInfo.secretKey, {
                issuer: config.jwtTokenInfo.issuer,
                audience: config.jwtTokenInfo.audience
            });

            // Validate the token format and content
            if (!decodedToken) {
                responseData.msg = 'Invalid token format';
                return responseHelper.unAuthorize(res, responseData);
            }

            // Set the user in the request object
            req.user = decodedToken;
            req.headers.authorization = `Bearer ${token}`;

            // Continue to the next middleware
            next();
        } catch (error) {
            log.error('Failed to verify JWT token with error::', error);

            // Handle different types of JWT errors
            if (error.name === 'TokenExpiredError') {
                responseData.msg = 'Token has expired';
            } else if (error.name === 'JsonWebTokenError') {
                responseData.msg = 'Invalid token';
            } else {
                responseData.msg = 'Failed to verify token';
            }

            return responseHelper.unAuthorize(res, responseData);
        }
    } else {
        responseData.msg = 'Token not provided';
        return responseHelper.unAuthorize(res, responseData);
    }
};