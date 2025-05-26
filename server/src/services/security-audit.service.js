'use strict';

const logger = require('./logger');
const log = new logger('SecurityAuditService').getChildLogger();

/**
 * Security Audit Service
 * 
 * This service is responsible for tracking security-related events
 * such as login attempts, password changes, and other security-critical actions.
 */
class SecurityAuditService {
  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Data related to the event
   * @param {string} userId - User ID (if applicable)
   * @param {string} ipAddress - IP address of the request
   * @param {boolean} success - Whether the event was successful
   */
  logSecurityEvent(eventType, eventData, userId = null, ipAddress = null, success = true) {
    try {
      // In a production environment, this would write to a database
      // For now, we'll just log to the console
      const securityEvent = {
        eventType,
        eventData,
        userId,
        ipAddress,
        success,
        timestamp: new Date().toISOString()
      };
      
      // Log the event
      if (success) {
        log.info(`Security event: ${eventType}`, securityEvent);
      } else {
        log.warn(`Failed security event: ${eventType}`, securityEvent);
      }
      
      // In the future, this could be stored in a database
      // securityEventModel.create(securityEvent);
    } catch (error) {
      log.error('Error logging security event:', error);
    }
  }
  
  /**
   * Log a login attempt
   * @param {string} username - Username or email used for login
   * @param {string} userId - User ID (if found)
   * @param {string} ipAddress - IP address of the request
   * @param {boolean} success - Whether the login was successful
   * @param {string} reason - Reason for failure (if applicable)
   */
  logLoginAttempt(username, userId = null, ipAddress = null, success = true, reason = null) {
    const eventData = {
      username,
      reason
    };
    
    this.logSecurityEvent('LOGIN_ATTEMPT', eventData, userId, ipAddress, success);
  }
  
  /**
   * Log a password change
   * @param {string} userId - User ID
   * @param {string} ipAddress - IP address of the request
   * @param {boolean} success - Whether the password change was successful
   * @param {boolean} isReset - Whether this was a password reset
   */
  logPasswordChange(userId, ipAddress = null, success = true, isReset = false) {
    const eventData = {
      isReset
    };
    
    this.logSecurityEvent(
      isReset ? 'PASSWORD_RESET' : 'PASSWORD_CHANGE',
      eventData,
      userId,
      ipAddress,
      success
    );
  }
  
  /**
   * Log an account lockout
   * @param {string} userId - User ID
   * @param {string} username - Username or email
   * @param {string} ipAddress - IP address of the request
   * @param {string} reason - Reason for lockout
   */
  logAccountLockout(userId, username, ipAddress = null, reason = 'Too many failed login attempts') {
    const eventData = {
      username,
      reason
    };
    
    this.logSecurityEvent('ACCOUNT_LOCKOUT', eventData, userId, ipAddress, true);
  }
  
  /**
   * Log a suspicious activity
   * @param {string} activityType - Type of suspicious activity
   * @param {Object} details - Details of the suspicious activity
   * @param {string} userId - User ID (if applicable)
   * @param {string} ipAddress - IP address of the request
   */
  logSuspiciousActivity(activityType, details, userId = null, ipAddress = null) {
    const eventData = {
      activityType,
      details
    };
    
    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', eventData, userId, ipAddress, false);
  }
  
  /**
   * Log an admin action
   * @param {string} actionType - Type of admin action
   * @param {Object} details - Details of the admin action
   * @param {string} adminId - Admin ID
   * @param {string} targetUserId - Target user ID (if applicable)
   * @param {string} ipAddress - IP address of the request
   */
  logAdminAction(actionType, details, adminId, targetUserId = null, ipAddress = null) {
    const eventData = {
      actionType,
      details,
      targetUserId
    };
    
    this.logSecurityEvent('ADMIN_ACTION', eventData, adminId, ipAddress, true);
  }
  
  /**
   * Log a permission change
   * @param {string} userId - User ID
   * @param {string} changedBy - ID of user who made the change
   * @param {Object} oldPermissions - Old permissions
   * @param {Object} newPermissions - New permissions
   * @param {string} ipAddress - IP address of the request
   */
  logPermissionChange(userId, changedBy, oldPermissions, newPermissions, ipAddress = null) {
    const eventData = {
      changedBy,
      oldPermissions,
      newPermissions
    };
    
    this.logSecurityEvent('PERMISSION_CHANGE', eventData, userId, ipAddress, true);
  }
}

// Export a singleton instance
module.exports = new SecurityAuditService();
