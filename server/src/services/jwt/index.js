'use strict';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../config/config');
const logger = require('../logger');
const log = new logger('JwtService').getChildLogger();

/*******************************************
 * SERVICE FOR HANDLING JWT TOKEN GENERATION
 *******************************************/
class JwtService {
	constructor() {
		// Generate a random JWT ID for each instance
		this.jwtInstanceId = crypto.randomBytes(8).toString('hex');
	}

	/**
	 * Generate a unique JWT ID to prevent token reuse
	 * @returns {string} Unique JWT ID
	 */
	generateJwtId() {
		return `${this.jwtInstanceId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
	}

	/**
	 * Add standard claims to token data
	 * @param {Object} tokenData - Base token data
	 * @returns {Object} Enhanced token data with standard claims
	 */
	addStandardClaims(tokenData) {
		return {
			...tokenData,
			iat: Math.floor(Date.now() / 1000), // Issued at time
			jti: this.generateJwtId(), // JWT ID for preventing token reuse
		};
	}

	/**
	 * Method to Generate sign new Jwt token using Json web token for user login
	 * @param {Object} tokenData - Token data to include in JWT
	 * @param {number} exp - Optional expiration time override
	 * @returns {string} Signed JWT token
	 */
	createJwtAuthenticationToken(tokenData, exp = 0) {
		try {
			const enhancedTokenData = this.addStandardClaims(tokenData);

			// Sign the token with enhanced security
			return jwt.sign(
				enhancedTokenData,
				config.jwtTokenInfo.secretKey,
				{
					algorithm: config.jwtTokenInfo.algorithm,
					expiresIn: (exp) ? exp : config.jwtTokenInfo.expiresIn,
					issuer: config.jwtTokenInfo.issuer,
					audience: config.jwtTokenInfo.audience,
					notBefore: 0, // Token valid immediately
				});
		} catch (error) {
			log.error('Error creating authentication token:', error);
			throw new Error('Failed to create authentication token');
		}
	}

	/**
	 * Method to Generate sign new Jwt token using Json web token for Email Verification
	 * @param {Object} tokenData - Token data to include in JWT
	 * @param {string} verificationType - Type of verification (email, password, mobile)
	 * @returns {string} Signed JWT token
	 */
	createJwtVerificationToken(tokenData, verificationType) {
		try {
			const enhancedTokenData = this.addStandardClaims(tokenData);

			switch(verificationType) {
			case 'email':
				return jwt.sign(
					enhancedTokenData,
					config.emailTokenInfo.secretKey,
					{
						algorithm: config.emailTokenInfo.algorithm,
						expiresIn: config.emailTokenInfo.expiresIn,
						issuer: config.emailTokenInfo.issuer,
						audience: config.emailTokenInfo.audience,
						notBefore: 0
					});
			case 'password':
				return jwt.sign(
					enhancedTokenData,
					config.passwordResetTokenInfo.secretKey,
					{
						algorithm: config.passwordResetTokenInfo.algorithm,
						expiresIn: config.passwordResetTokenInfo.expiresIn,
						issuer: config.passwordResetTokenInfo.issuer,
						audience: config.passwordResetTokenInfo.audience,
						notBefore: 0
					});
			case 'mobile':
				return jwt.sign(
					enhancedTokenData,
					config.mobileTokenInfo.secretKey,
					{
						algorithm: config.mobileTokenInfo.algorithm, // Fixed: was using passwordResetTokenInfo
						expiresIn: config.mobileTokenInfo.expiresIn, // Fixed: was using passwordResetTokenInfo
						issuer: config.mobileTokenInfo.issuer,
						audience: config.mobileTokenInfo.audience,
						notBefore: 0
					});
			default:
				log.error(`Invalid verification type: ${verificationType}`);
				throw new Error('Invalid jwt verification type');
			}
		} catch (error) {
			log.error(`Error creating ${verificationType} verification token:`, error);
			throw new Error(`Failed to create ${verificationType} verification token`);
		}
	}

	/**
	 * Method to Generate sign new Jwt token using Json web token for admin login
	 * @param {Object} tokenData - Token data to include in JWT
	 * @returns {string} Signed JWT token
	 */
	createJwtAdminAuthenticationToken(tokenData) {
		try {
			const enhancedTokenData = this.addStandardClaims(tokenData);

			return jwt.sign(
				enhancedTokenData,
				config.adminJwtTokenInfo.secretKey,
				{
					algorithm: config.adminJwtTokenInfo.algorithm,
					expiresIn: config.adminJwtTokenInfo.expiresIn,
					issuer: config.adminJwtTokenInfo.issuer,
					audience: config.adminJwtTokenInfo.audience,
					notBefore: 0
				});
		} catch (error) {
			log.error('Error creating admin authentication token:', error);
			throw new Error('Failed to create admin authentication token');
		}
	}

	/**
	 * Verify a JWT token
	 * @param {string} token - JWT token to verify
	 * @param {string} secretKey - Secret key to use for verification
	 * @param {Object} options - Verification options
	 * @returns {Object} Decoded token payload
	 */
	verifyToken(token, secretKey, options = {}) {
		try {
			return jwt.verify(token, secretKey, options);
		} catch (error) {
			log.error('Token verification failed:', error);
			throw error;
		}
	}

	/**
	 * Blacklist a token (to be implemented with Redis or similar)
	 * @param {string} token - JWT token to blacklist
	 * @param {number} expiry - Time until token expiry in seconds
	 */
	blacklistToken(token, expiry) {
		// This would typically store the token in Redis with the expiry time
		// For now, we'll just log it
		log.info(`Token blacklisted until ${new Date(Date.now() + expiry * 1000).toISOString()}`);
		// In a real implementation, you would add the token to a blacklist in Redis
		// redisClient.setex(`blacklist:${token}`, expiry, 'true');
	}
}

module.exports = JwtService;