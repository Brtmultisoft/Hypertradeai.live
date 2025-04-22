import axios from 'axios';

// Create a cancel token source for request cancellation
const CancelToken = axios.CancelToken;
window._axiosSource = CancelToken.source();

// Set base URL from environment variable or default to localhost
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
    const publicRoutes = ['/user/login', '/user/signup', '/user/forgot/password', '/user/reset/password', '/user/checkReferID'];
    const isPublicRoute = publicRoutes.some(route => config.url.includes(route));

    if (!token && !isPublicRoute) {
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
  (response) => response,
  (error) => {
    // Don't process cancelled requests
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized error - clearing token');

      // Clear token
      localStorage.removeItem('token');

      // Set clean logout flag
      sessionStorage.setItem('clean_logout', 'true');

      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
