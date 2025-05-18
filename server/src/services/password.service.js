'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('./logger');
const log = new logger('PasswordService').getChildLogger();

/**
 * Service for handling password operations with enhanced security
 */
class PasswordService {
  /**
   * Apply pepper to password before hashing
   * @param {string} password - Plain text password
   * @returns {string} - Peppered password
   */
  applyPepper(password) {
    // Apply a pepper to the password before hashing
    // This adds an additional layer of security even if the database is compromised
    return crypto
      .createHmac('sha256', config.bcrypt.pepper)
      .update(password)
      .digest('hex');
  }

  /**
   * Hash a password with bcrypt and pepper
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Hashed password
   */
  async hashPassword(password) {
    try {
      // Apply pepper to password
      const pepperedPassword = this.applyPepper(password);

      // Generate salt
      const salt = await bcrypt.genSalt(config.bcrypt.saltValue);

      // Hash password with salt
      const hashedPassword = await bcrypt.hash(pepperedPassword, salt);

      return hashedPassword;
    } catch (error) {
      log.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param {string} plainPassword - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} - True if passwords match
   */
  async comparePassword(plainPassword, hashedPassword) {
    try {
      // First try with the new peppered password method
      const pepperedPassword = this.applyPepper(plainPassword);
      let isMatch = await bcrypt.compare(pepperedPassword, hashedPassword);

      // If that doesn't match, try with the old method (without pepper)
      // This ensures backward compatibility with existing passwords
      if (!isMatch) {
        isMatch = await bcrypt.compare(plainPassword, hashedPassword);

        if (isMatch) {
          log.info('Password matched using legacy method (without pepper)');
          // In a production system, you might want to upgrade the hash here
          // by rehashing with the new method
        }
      }

      return isMatch;
    } catch (error) {
      log.error('Error comparing passwords:', error);
      throw new Error('Failed to compare passwords');
    }
  }

  /**
   * Generate a secure random password
   * @param {number} length - Length of password (default: 12)
   * @returns {string} - Random password
   */
  generateRandomPassword(length = 12) {
    try {
      // Define character sets
      const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
      const numberChars = '0123456789';
      const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';

      // Combine all character sets
      const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

      // Generate random bytes
      const randomBytes = crypto.randomBytes(length * 2);

      // Generate password
      let password = '';

      // Ensure at least one character from each set
      password += uppercaseChars.charAt(Math.floor(crypto.randomInt(0, uppercaseChars.length)));
      password += lowercaseChars.charAt(Math.floor(crypto.randomInt(0, lowercaseChars.length)));
      password += numberChars.charAt(Math.floor(crypto.randomInt(0, numberChars.length)));
      password += specialChars.charAt(Math.floor(crypto.randomInt(0, specialChars.length)));

      // Fill the rest of the password with random characters
      for (let i = 4; i < length; i++) {
        const randomIndex = randomBytes[i] % allChars.length;
        password += allChars.charAt(randomIndex);
      }

      // Shuffle the password
      password = password.split('').sort(() => 0.5 - Math.random()).join('');

      return password;
    } catch (error) {
      log.error('Error generating random password:', error);
      throw new Error('Failed to generate random password');
    }
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} - Password strength assessment
   */
  checkPasswordStrength(password) {
    // Initialize score and feedback
    let score = 0;
    const feedback = [];

    // Check length
    if (password.length < 8) {
      feedback.push('Password is too short (minimum 8 characters)');
    } else {
      score += Math.min(2, Math.floor(password.length / 8));
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should include uppercase letters');
    }

    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should include lowercase letters');
    }

    // Check for numbers
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should include numbers');
    }

    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password should include special characters');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Password contains repeated characters');
    }

    // Check for sequential characters
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789/i.test(password)) {
      score -= 1;
      feedback.push('Password contains sequential characters');
    }

    // Determine strength level
    let strength = 'weak';
    if (score >= 4) {
      strength = 'strong';
    } else if (score >= 3) {
      strength = 'medium';
    }

    return {
      score,
      strength,
      feedback
    };
  }
}

// Export a singleton instance
module.exports = new PasswordService();
