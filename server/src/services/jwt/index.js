'use strict';
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
/*******************************************
 * SERVICE FOR HANDLING JWT TOKEN GENERATION
 *******************************************/
class JwtService {
	/**
	 * Method to Generate sign new Jwt token using Json web token for user login
	 */
	createJwtAuthenticationToken(tokenData, exp = 0) {
		return jwt.sign(
			tokenData,
			config.jwtTokenInfo.secretKey,
			{
				algorithm: config.jwtTokenInfo.algorithm,
				expiresIn: (exp) ? exp : config.jwtTokenInfo.expiresIn,
				issuer: config.jwtTokenInfo.issuer,
				audience: config.jwtTokenInfo.audience
			});
	}
	/**
	 * Method to Generate sign new Jwt token using Json web token for Email Verification
	 */
	createJwtVerificationToken(tokenData,verficationType) {
		switch(verficationType) {
		case 'email':
			return jwt.sign(
				tokenData,
				config.emailTokenInfo.secretKey,
				{
					algorithm: config.emailTokenInfo.algorithm,
					expiresIn: config.emailTokenInfo.expiresIn,
					issuer: config.emailTokenInfo.issuer,
					audience: config.emailTokenInfo.audience
				});
		case 'password':
			return jwt.sign(
				tokenData,
				config.passwordResetTokenInfo.secretKey,
				{
					algorithm: config.passwordResetTokenInfo.algorithm,
					expiresIn: config.passwordResetTokenInfo.expiresIn,
					issuer: config.passwordResetTokenInfo.issuer,
					audience: config.passwordResetTokenInfo.audience
				});
		case 'mobile':
			return jwt.sign(
				tokenData,
				config.mobileTokenInfo.secretKey,
				{
					algorithm: config.passwordResetTokenInfo.algorithm,
					expiresIn: config.passwordResetTokenInfo.expiresIn,
					issuer: config.passwordResetTokenInfo.issuer,
					audience: config.passwordResetTokenInfo.audience
				});
		default:
			return 'Invalid jwt verification type';
		}
	}
	/**
	 * Method to Generate sign new Jwt token using Json web token for admin login
	 */
	createJwtAdminAuthenticationToken(tokenData) {
		return jwt.sign(
			tokenData,
			config.adminJwtTokenInfo.secretKey,
			{
				algorithm: config.adminJwtTokenInfo.algorithm,
				expiresIn: config.adminJwtTokenInfo.expiresIn,
				issuer: config.adminJwtTokenInfo.issuer,
				audience: config.adminJwtTokenInfo.audience
			});
	}
}
module.exports = JwtService;