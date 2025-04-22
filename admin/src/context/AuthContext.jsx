import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  axios.defaults.baseURL = API_URL;

  // Add token to axios headers if it exists
  useEffect(() => {
    if (token) {
      // Make sure we're using the exact format expected by the server
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Get token
  const getToken = () => token;

  // Load admin data if token exists
  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get('/admin/get-profile');

      if (res.data && res.data.status) {
        // The API returns data in 'result' field instead of 'data'
        setUser(res.data.result);
        setError(null);
      } else {
        console.error('Unexpected profile response structure:', res.data);
        setError('Failed to load admin data');
        logout();
      }
    } catch (err) {
      console.error('Error loading admin:', err);
      setError('Failed to load admin data');
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load user on mount and when token changes
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Admin login function
  const adminLogin = async (credentials) => {
    try {
      setLoading(true);
      const res = await axios.post('/admin/login', {
        email: credentials.email,
        password: credentials.password
      });

      if (res.data && res.data.status) {
        // Extract token and user data from response
        // The API returns data in 'result' field instead of 'data'
        const { authToken, name, email } = res.data.result;

        // Save token to localStorage
        localStorage.setItem('admin_token', authToken);

        // Update state
        setToken(authToken);
        setUser({ name, email });
        setError(null);

        // Set authorization header for future requests
        // Make sure we're using the exact format expected by the server
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        return {
          success: true,
          message: res.data.message || 'Login successful!',
        };
      } else {
        // If response doesn't have the expected structure
        console.error('Unexpected login response structure:', res.data);
        setError('Unexpected response from server');
        return { success: false, error: 'Unexpected response from server' };
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('admin_token');

    // Update state
    setToken(null);
    setUser(null);

    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];
  };

  // Provide the context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    adminLogin,
    logout,
    loadUser,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
