import axios from 'axios';
import { API_URL } from '../config';

// Create a cache for API responses
const apiCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Create a map to store cancellation tokens
const pendingRequests = new Map();

/**
 * API Service with caching, request cancellation, and parallel requests
 */
const ApiService = {
  /**
   * Get auth headers
   * @param {string} token - Auth token
   * @returns {Object} Headers object
   */
  getHeaders(token) {
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  },

  /**
   * Generate cache key from request params
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}:${JSON.stringify(params)}`;
  },

  /**
   * Check if response is cached and valid
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached response or null
   */
  getFromCache(cacheKey) {
    if (apiCache.has(cacheKey)) {
      const { data, timestamp } = apiCache.get(cacheKey);
      const now = Date.now();

      // Check if cache is still valid
      if (now - timestamp < CACHE_EXPIRY) {
        console.log('Using cached data for:', cacheKey);
        return data;
      }

      // Remove expired cache
      apiCache.delete(cacheKey);
    }
    return null;
  },

  /**
   * Save response to cache
   * @param {string} cacheKey - Cache key
   * @param {Object} data - Response data
   */
  saveToCache(cacheKey, data) {
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  },

  /**
   * Cancel any pending request with the same ID
   * @param {string} requestId - Request identifier
   */
  cancelPendingRequest(requestId) {
    if (pendingRequests.has(requestId)) {
      const controller = pendingRequests.get(requestId);
      controller.abort();
      pendingRequests.delete(requestId);
      console.log('Cancelled pending request:', requestId);
    }
  },

  /**
   * Make an API request with caching, cancellation, and retry capability
   * @param {Object} options - Request options
   * @returns {Promise} API response
   */
  async request({
    method = 'GET',
    endpoint,
    params = {},
    data = null,
    token = null,
    useCache = true,
    requestId = endpoint,
    retries = 2, // Number of retry attempts for transient errors
    retryDelay = 1000, // Delay between retries in milliseconds
  }) {
    // Cancel any pending request with the same ID
    this.cancelPendingRequest(requestId);

    // Create a new AbortController
    const controller = new AbortController();
    pendingRequests.set(requestId, controller);

    // Generate cache key
    const cacheKey = this.getCacheKey(endpoint, params);

    // Check cache for GET requests
    if (method === 'GET' && useCache) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
    }

    // Implement retry logic with exponential backoff
    let lastError = null;
    let attemptCount = 0;

    while (attemptCount <= retries) {
      try {
        // If this is a retry, log it
        if (attemptCount > 0) {
          console.log(`Retry attempt ${attemptCount}/${retries} for ${endpoint} after ${retryDelay * attemptCount}ms`);
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, retryDelay * attemptCount));
        }

        console.log(`Making API request to: ${endpoint}`, {
          method,
          params,
          attempt: attemptCount + 1,
          maxAttempts: retries + 1
        });

        const response = await axios({
          method,
          url: `${API_URL}${endpoint}`,
          params,
          data,
          headers: this.getHeaders(token),
          signal: controller.signal,
          // Add timeout to prevent hanging requests
          timeout: 30000, // 30 seconds
        });

        console.log(`API response from ${endpoint}:`, response.status);

        // Cache successful GET responses
        if (method === 'GET' && useCache && response.data) {
          this.saveToCache(cacheKey, response.data);
        }

        // Remove from pending requests
        pendingRequests.delete(requestId);

        return response.data;
      } catch (error) {
        // Don't retry cancelled requests
        if (axios.isCancel(error)) {
          console.log('Request cancelled:', requestId);
          pendingRequests.delete(requestId);
          return null;
        }

        // Save the error for potential retries or final throw
        lastError = error;

        // Log detailed error information
        console.error(`API error for ${endpoint} (attempt ${attemptCount + 1}/${retries + 1}):`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params,
          }
        });

        // Determine if we should retry based on the error type
        const shouldRetry = (
          // Network errors are often transient
          !error.response ||
          // Server errors (5xx) might be temporary
          (error.response && error.response.status >= 500 && error.response.status < 600) ||
          // Timeout errors
          error.code === 'ECONNABORTED'
        );

        // If we shouldn't retry or we've used all retries, throw the error
        if (!shouldRetry || attemptCount >= retries) {
          // Remove from pending requests
          pendingRequests.delete(requestId);

          // Add detailed message to the error
          if (error.response) {
            error.detailedMessage = `Server error (${error.response.status}): ${error.response.data?.message || error.message}`;
          } else if (error.request) {
            error.detailedMessage = `Network error: No response received. Check your connection or the server may be down.`;
          } else {
            error.detailedMessage = `Request error: ${error.message}`;
          }

          // Add retry information
          error.retryAttempts = attemptCount;
          error.retryExhausted = attemptCount >= retries;

          throw error;
        }

        // Increment attempt count for next retry
        attemptCount++;
      }
    }

    // This should never be reached due to the throw in the catch block,
    // but just in case, throw the last error
    throw lastError;
  },

  /**
   * Execute multiple API requests in parallel
   * @param {Array} requests - Array of request configurations
   * @returns {Promise} Array of responses
   */
  async parallel(requests) {
    const promises = requests.map(req => this.request(req));
    return Promise.all(promises);
  },

  /**
   * Clear the entire API cache
   */
  clearCache() {
    apiCache.clear();
    console.log('API cache cleared');
  },

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    pendingRequests.forEach((controller, requestId) => {
      controller.abort();
      console.log('Cancelled request:', requestId);
    });
    pendingRequests.clear();
  },
};

export default ApiService;
