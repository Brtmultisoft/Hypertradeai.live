import axios from 'axios';

// Set base URL from environment variable or default to localhost
axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create a request cache to improve performance
const requestCache = new Map();

// Create axios instance with default config
const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Add request interceptor to include auth token and check token existence
api.interceptors.request.use(
    (config) => {
        // Generate cache key for GET requests
        const cacheKey = config.method === 'get' ? `${config.url}${JSON.stringify(config.params || {})}` : null;

        // Check if we can use cached response (only for GET requests)
        if (config.method === 'get' && config.cache !== false && cacheKey) {
            const cachedResponse = requestCache.get(cacheKey);
            if (cachedResponse) {
                const { data, timestamp } = cachedResponse;
                const cacheAge = Date.now() - timestamp;

                // Use cache if it's less than 30 seconds old (configurable)
                const maxAge = config.cacheMaxAge || 30000; // 30 seconds default
                if (cacheAge < maxAge) {
                    // Create a new CancelToken for this request
                    const source = axios.CancelToken.source();
                    config.cancelToken = source.token;

                    // Cancel the request with cached response
                    setTimeout(() => {
                        source.cancel(JSON.stringify({
                            type: 'CACHED_RESPONSE',
                            data
                        }));
                    }, 0);
                }
            }
        }

        // Create a new CancelToken for this request if not already set
        if (!config.cancelToken) {
            const source = axios.CancelToken.source();
            config.cancelToken = source.token;

            // Store the cancel token source for potential cancellation
            if (config._id) {
                window._axiosSources = window._axiosSources || {};
                window._axiosSources[config._id] = source;
            }
        }

        // Check if token exists
        const token = localStorage.getItem('token');

        // If no token and not a login/register/public route, reject the request
        const publicRoutes = ['/user/login', '/user/signup', '/user/forgot/password', '/user/reset/password', '/user/checkReferID', '/user/login/request'];
        const isPublicRoute = publicRoutes.some(route => config.url.includes(route));

        // Check if we're in the middle of an admin login process
        const adminLoginInProgress = sessionStorage.getItem('admin_login_in_progress') === 'true';

        if (!token && !isPublicRoute && !adminLoginInProgress) {
            console.log('No token found for protected route:', config.url);
            // Cancel the request
            return Promise.reject(new Error('No authentication token'));
        }

        // Add token to headers if it exists
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        try {
            // Cache successful GET responses
            const config = response.config;
            if (config.method === 'get' && config.cache !== false) {
                const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
                requestCache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
            }

            // Check for force_relogin_time in user data responses
            if (response.data &&
                response.data.result &&
                response.data.result.force_relogin_time) {

                // Get the stored token creation time and admin login timestamp
                const tokenTime = localStorage.getItem('token_time');
                const adminLoginTimestamp = sessionStorage.getItem('admin_login_timestamp');
                const adminLoginProtected = sessionStorage.getItem('admin_login_protected') === 'true';
                const loginAttemptId = sessionStorage.getItem('login_attempt_id');

                const currentTokenTime = parseInt(tokenTime || '0');
                const serverForceTime = parseInt(response.data.result.force_relogin_time || '0');

                // Check if this is an admin forced logout
                const isAdminForcedLogout =
                    response.data.result.force_relogin_type === 'admin_forced_logout' ||
                    response.data.result.force_relogin_type === 'admin_login';

                // If this is an admin-initiated login and it's protected, skip the force logout check
                if (adminLoginProtected && adminLoginTimestamp) {
                    return response;
                }

                // If this session has a login attempt ID, check if it matches the one in localStorage
                const storedLoginAttemptId = window.localStorage.getItem('admin_login_attempt_id');
                if (loginAttemptId && storedLoginAttemptId && loginAttemptId === storedLoginAttemptId) {
                    return response;
                }

                // If the force_relogin_time is newer than our token, we need to logout
                if (serverForceTime > currentTokenTime) {
                    // If this is an admin-initiated logout, show a specific message
                    if (isAdminForcedLogout) {
                        // Clear all session data
                        localStorage.clear();
                        sessionStorage.clear();

                        // Set forced logout flag with reason
                        sessionStorage.setItem('forced_logout', 'admin_action');

                        // Redirect to login page with forced parameter
                        window.location.href = '/login?forced=1';

                        // Return a rejected promise to prevent further processing
                        return Promise.reject(new Error('Session invalidated by admin action'));
                    } else {
                        // Regular session expiration
                        // Clear all session data
                        localStorage.clear();
                        sessionStorage.clear();

                        // Set expired flag
                        sessionStorage.setItem('session_expired', 'true');

                        // Redirect to login page with expired parameter
                        window.location.href = '/login?expired=1';

                        // Return a rejected promise to prevent further processing
                        return Promise.reject(new Error('Session expired'));
                    }
                }
            }
        } catch (error) {
            console.error('Error checking session validity:', error);
            // Continue processing the response even if there's an error in the session check
        }

        return response;
    },
    (error) => {
        // Check if this is a cancelled request with a cached response
        if (axios.isCancel(error)) {
            try {
                const cancelData = JSON.parse(error.message);
                if (cancelData && cancelData.type === 'CACHED_RESPONSE') {
                    return Promise.resolve({ data: cancelData.data, cached: true });
                }
            } catch (e) {
                // Not a cached response, just a regular cancellation
                return Promise.reject(error);
            }
        }

        // Handle 401 Unauthorized errors (token expired or invalid)
        if (error.response && error.response.status === 401) {
            // Check if this is an admin-initiated login
            const isAdminLogin = sessionStorage.getItem('admin_login') === 'true';

            // Check if we're in the middle of an admin login process
            const adminLoginInProgress = sessionStorage.getItem('admin_login_in_progress') === 'true';

            // If we're in the middle of an admin login process, don't redirect
            if (adminLoginInProgress) {
                return Promise.reject(error);
            }

            // Clear all session data
            localStorage.clear();
            sessionStorage.clear();

            // Set clean logout flag
            sessionStorage.setItem('clean_logout', 'true');

            // Only redirect if we're not already on the login page
            if (!window.location.pathname.includes('/login')) {
                if (isAdminLogin) {
                    // If this was an admin login, try to close the window
                    try {
                        window.close();
                    } catch (closeError) {
                        console.warn('Failed to close window:', closeError);
                    }

                    // Fallback if window.close() doesn't work
                    setTimeout(() => {
                        window.location.href = '/login?expired=1';
                    }, 100);
                } else {
                    window.location.href = '/login?expired=1';
                }
            } else {
                // If we're already on the login page, just clear the URL parameters
                try {
                    window.history.replaceState({}, document.title, '/login');
                } catch (historyError) {
                    console.warn('Failed to update history:', historyError);
                }
            }
        }

        // Handle network errors with a more user-friendly approach
        if (error.message === 'Network Error') {
            // Dispatch a custom event that can be listened to by components
            window.dispatchEvent(new CustomEvent('api:networkError', {
                detail: { message: 'Network connection issue. Please check your internet connection.' }
            }));
        }

        // Handle timeout errors
        if (error.code === 'ECONNABORTED') {
            window.dispatchEvent(new CustomEvent('api:timeoutError', {
                detail: { message: 'Request timed out. Please try again.' }
            }));
        }

        return Promise.reject(error);
    }
);

// Utility functions for API management
const apiUtils = {
    /**
     * Clear the request cache
     * @param {string} [urlPattern] - Optional URL pattern to clear specific cache entries
     */
    clearCache: (urlPattern) => {
        if (urlPattern) {
            // Clear only cache entries matching the pattern
            for (const key of requestCache.keys()) {
                if (key.includes(urlPattern)) {
                    requestCache.delete(key);
                }
            }
        } else {
            // Clear the entire cache
            requestCache.clear();
        }
    },

    /**
     * Cancel all pending requests
     * @param {string} [requestId] - Optional request ID to cancel specific request
     */
    cancelRequests: (requestId) => {
        if (requestId && window._axiosSources && window._axiosSources[requestId]) {
            // Cancel specific request
            window._axiosSources[requestId].cancel('Request cancelled by user');
            delete window._axiosSources[requestId];
        } else if (window._axiosSources) {
            // Cancel all pending requests
            Object.values(window._axiosSources).forEach(source => {
                source.cancel('Request cancelled by user');
            });
            window._axiosSources = {};
        }
    },

    /**
     * Create a request ID for tracking and cancellation
     * @returns {string} Unique request ID
     */
    createRequestId: () => {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get the current size of the request cache
     * @returns {number} Number of cached requests
     */
    getCacheSize: () => {
        return requestCache.size;
    }
};

// Add utility functions to the api object
api.utils = apiUtils;

export default api;