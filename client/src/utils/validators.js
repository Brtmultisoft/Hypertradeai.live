/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - The password to validate
 * @returns {object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  // Simplified password validation for better user experience
  // At least one uppercase, one lowercase, and one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must include at least one uppercase letter' };
  }

  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must include at least one lowercase letter' };
  }

  if (!hasNumbers) {
    return { isValid: false, message: 'Password must include at least one number' };
  }

  return { isValid: true, message: 'Password is strong' };
};

/**
 * Validate phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;

  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');

  // Check if it's a valid international format
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Validate username format
 * @param {string} username - The username to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate wallet address format (basic check)
 * @param {string} address - The wallet address to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidWalletAddress = (address) => {
  // Basic check for Ethereum-like addresses
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
};

/**
 * Validate amount is a positive number
 * @param {number|string} amount - The amount to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidAmount = (amount) => {
  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

/**
 * Validate investment amount is within allowed range
 * @param {number|string} amount - The amount to validate
 * @param {number} minAmount - Minimum allowed amount
 * @param {number} maxAmount - Maximum allowed amount
 * @returns {object} Validation result with isValid and message
 */
export const validateInvestmentAmount = (amount, minAmount = 50, maxAmount = 10000) => {
  const numAmount = Number(amount);

  if (isNaN(numAmount)) {
    return { isValid: false, message: 'Please enter a valid number' };
  }

  if (numAmount < minAmount) {
    return { isValid: false, message: `Minimum investment amount is ${minAmount}` };
  }

  if (numAmount > maxAmount) {
    return { isValid: false, message: `Maximum investment amount is ${maxAmount}` };
  }

  return { isValid: true, message: 'Amount is valid' };
};

/**
 * Validate form fields
 * @param {object} values - Form values
 * @param {object} validations - Validation rules
 * @returns {object} Validation errors
 */
export const validateForm = (values, validations) => {
  const errors = {};

  Object.keys(validations).forEach((field) => {
    const value = values[field];
    const validation = validations[field];

    // Required field validation
    if (validation.required && (!value || value.trim() === '')) {
      errors[field] = validation.requiredMessage || 'This field is required';
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value && !validation.required) {
      return;
    }

    // Pattern validation
    if (validation.pattern && !validation.pattern.test(value)) {
      errors[field] = validation.patternMessage || 'Invalid format';
    }

    // Min length validation
    if (validation.minLength && value.length < validation.minLength) {
      errors[field] = validation.minLengthMessage || `Must be at least ${validation.minLength} characters`;
    }

    // Max length validation
    if (validation.maxLength && value.length > validation.maxLength) {
      errors[field] = validation.maxLengthMessage || `Must be at most ${validation.maxLength} characters`;
    }

    // Min value validation
    if (validation.min && Number(value) < validation.min) {
      errors[field] = validation.minMessage || `Must be at least ${validation.min}`;
    }

    // Max value validation
    if (validation.max && Number(value) > validation.max) {
      errors[field] = validation.maxMessage || `Must be at most ${validation.max}`;
    }

    // Custom validation
    if (validation.validate) {
      const customError = validation.validate(value, values);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return errors;
};
