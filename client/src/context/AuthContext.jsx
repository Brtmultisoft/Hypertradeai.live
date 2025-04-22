import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/';

  // Add token to axios headers if it exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data if token exists
  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get('/user/profile');
      console.log('Profile response:', res.data);

      // Check if the response has the expected structure
      if (res.data && res.data.status && res.data.result) {
        setUser(res.data.result);
        setError(null);
      } else {
        console.error('Unexpected profile response structure:', res.data);
        setError('Failed to load user data');
        logout();
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load user on mount and when token changes
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const res = await axios.post('/user/login', {
        userAddress: credentials.email, // Backend accepts email as userAddress
        password: credentials.password
      });

      console.log('Login response:', res.data);

      // Check if the response has the expected structure
      if (res.data && res.data.status && res.data.result && res.data.result.token) {
        // Extract token and user data from response
        const { token: newToken } = res.data.result;
        const userData = res.data.result;

        // Save token to localStorage
        localStorage.setItem('token', newToken);

        // Update state
        setToken(newToken);
        setUser(userData);
        setError(null);

        // Set authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return {
          success: true,
          message: res.data.message || 'Login successful!',
          userData: userData
        };
      } else {
        // If response doesn't have the expected structure
        console.error('Unexpected login response structure:', res.data);
        setError('Unexpected response from server');
        return { success: false, error: 'Unexpected response from server' };
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      // Use the correct endpoint from the backend
      const res = await axios.post('/user/signup', {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        phone_number: userData.phone,
        password: userData.password,
        confirm_password: userData.password,
        referralId: userData.referrer || import.meta.env.VITE_DEFAULT_REFERRER || 'admin'
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');

    // Update state
    setToken(null);
    setUser(null);

    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post('/user/forgot/password', { email });
      return { success: true, message: res.data.msg || res.data.message || 'Password reset email sent' };
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to process forgot password request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      const res = await axios.post('/user/reset/password', {
        token,
        password,
        confirm_password: password
      });
      return { success: true, message: res.data.msg || res.data.message || 'Password reset successful' };
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Check if username is unique
  // const checkUsernameUnique = async (username) => {
  //   try {
  //     const res = await axios.post('/user/checkUsername', { username });
  //     return { isUnique: true };
  //   } catch (err) {
  //     console.error('Username check error:', err);
  //     const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Username is already taken';
  //     return { isUnique: false, error: errorMessage };
  //   }
  // };

  // Check if email is unique
  // const checkEmailUnique = async (email) => {
  //   try {
  //     const res = await axios.post('/user/checkEmail', { email });
  //     return { isUnique: true };
  //   } catch (err) {
  //     console.error('Email check error:', err);
  //     const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Email is already registered';
  //     return { isUnique: false, error: errorMessage };
  //   }
  // };

  // Check if referral ID is valid
  const checkReferralId = async (referralId) => {
    try {
      const res = await axios.post('/user/checkReferID', { refer_id: referralId });
      return { isValid: true, data: res.data.data };
    } catch (err) {
      console.error('Referral ID check error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Invalid referral ID';
      return { isValid: false, error: errorMessage };
    }
  };

  // Provide the context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    loadUser,
    checkReferralId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
