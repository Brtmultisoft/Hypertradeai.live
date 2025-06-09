import axios from 'axios';

// Create a cancel token source for request cancellation
const CancelToken = axios.CancelToken;
window._axiosSource = CancelToken.source();

// Set base URL from environment variable or default to localhost
axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
const api = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    cancelToken: window._axiosSource.token
});

// Add request interceptor to include auth token and check token existence
api.interceptors.request.use(
    (config) => {
        // Check if token exists
        const token = localStorage.getItem('token');

        // If no token and not a login/register/public route, reject the request
        const publicRoutes = [
            '/user/login',
            '/user/signup',
            '/user/signup-with-verification',
            '/user/forgot/password',
            '/user/forgot/password-mobile',
            '/user/reset/password',
            '/user/reset/password-with-otp',
            '/user/reset/password-with-mobile-otp',
            '/user/verify-2fa-otp',
            '/user/checkReferID',
            '/user/get-default-sponsor',
            '/user/login/request',
            '/user/otpless/send-registration-otp',
            '/user/otpless/verify-registration-otp',
            '/user/otpless/send-login-otp',
            '/user/otpless/verify-login-otp',
            '/user/otpless/send-2fa-otp',
            '/user/otpless/verify-2fa-otp',
            '/user/otpless/send-mobile-registration-otp',
            '/user/otpless/verify-mobile-registration-otp',
            '/user/dual-verification/send-registration-otps',
            '/user/dual-verification/verify-registration-otps',
            '/user/otp/test-send',
            '/user/otp/test-verify'
        ];
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
            // Only check for force_relogin_time if we're not in the login process
            const isLoginProcess = response.config.url.includes('/login') ||
                response.config.url.includes('/signup') ||
                response.config.url.includes('/login/request');

            // Skip session checks during login process
            if (isLoginProcess) {
                console.log('Login process detected, skipping session checks');
                return response;
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

                console.log('Checking session validity:', {
                    currentTokenTime,
                    serverForceTime,
                    isAdminForcedLogout,
                    forceType: response.data.result.force_relogin_type,
                    adminLoginTimestamp,
                    adminLoginProtected,
                    loginAttemptId
                });

                // If this is an admin-initiated login and it's protected, skip the force logout check
                if (adminLoginProtected && adminLoginTimestamp) {
                    console.log('This is a protected admin login session, skipping force logout check');
                    return response;
                }

                // If this session has a login attempt ID, check if it matches the one in localStorage
                const storedLoginAttemptId = window.localStorage.getItem('admin_login_attempt_id');
                if (loginAttemptId && storedLoginAttemptId && loginAttemptId === storedLoginAttemptId) {
                    console.log('This session matches the current login attempt ID, skipping force logout check');
                    return response;
                }

                // If the force_relogin_time is newer than our token, we need to logout
                if (serverForceTime > currentTokenTime) {
                    console.log('Force relogin time is newer than token time, logging out');

                    // If this is an admin-initiated logout, show a specific message
                    if (isAdminForcedLogout) {
                        console.log('Admin forced logout detected');

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
                        console.log('Session expired');

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
        // Don't process cancelled requests
        if (axios.isCancel(error)) {
            console.log('Request cancelled:', error.message);
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized errors (token expired or invalid)
        if (error.response && error.response.status === 401) {
            console.log('401 Unauthorized error - clearing token');

            // Check if this is an admin-initiated login
            const isAdminLogin = sessionStorage.getItem('admin_login') === 'true';

            // Check if we're in the middle of an admin login process
            const adminLoginInProgress = sessionStorage.getItem('admin_login_in_progress') === 'true';

            // If we're in the middle of an admin login process, don't redirect
            if (adminLoginInProgress) {
                console.log('Admin login in progress, not redirecting');
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
                    console.log('Admin-initiated login session expired');
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
                    console.log('Regular session expired, redirecting to login');
                    window.location.href = '/login?expired=1';
                }
            } else {
                console.log('Already on login page, not redirecting');
                // If we're already on the login page, just clear the URL parameters
                try {
                    window.history.replaceState({}, document.title, '/login');
                } catch (historyError) {
                    console.warn('Failed to update history:', historyError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;