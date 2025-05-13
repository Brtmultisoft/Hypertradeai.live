/**
 * Format currency values
 * @param {number} value - The value to format
 * @param {number|string} precision - Number of decimal places or currency code
 * @param {string} currency - The currency code (default: USD)
 * @param {string} locale - The locale (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, precision = 2, currency = 'USD', locale = 'en-US') => {
  // Handle case where precision is actually the currency code (backward compatibility)
  if (typeof precision === 'string' && precision.length === 3) {
    locale = currency;
    currency = precision;
    precision = 2;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
};

/**
 * Format date values
 * @param {string|Date} date - The date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} locale - The locale (default: en-US)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}, locale = 'en-US') => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
};

/**
 * Format date with time
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale (default: en-US)
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en-US') => {
  return formatDate(
    date,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    locale
  );
};

/**
 * Format number with commas
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} locale - The locale (default: en-US)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 2, locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage values
 * @param {number} value - The value to format (e.g., 0.25 for 25%)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {string} locale - The locale (default: en-US)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2, locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length (default: 50)
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Format wallet address for display
 * @param {string} address - The wallet address
 * @param {number} startChars - Number of starting characters to show (default: 6)
 * @param {number} endChars - Number of ending characters to show (default: 4)
 * @returns {string} Formatted wallet address
 */
export const formatWalletAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;

  return `${address.substring(0, startChars)}...${address.substring(
    address.length - endChars
  )}`;
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const formatTiming = (seconds) => {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${secs}`;
};