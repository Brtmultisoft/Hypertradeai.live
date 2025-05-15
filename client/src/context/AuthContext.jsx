import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState(null);


  // Use a ref to track if we've already tried to load the user
  const hasTriedToLoadUser = useRef(false);

  // Set up axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL

  // Add token to axios headers if it exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data if token exists
// Modify loadUser to accept an optional token parameter
const loadUser = useCallback(async (overrideToken = null) => {
  const effectiveToken = overrideToken || token || localStorage.getItem('token');

  if (!effectiveToken) {
    console.log('No valid token found, aborting profile load');
    setLoading(false);
    return;
  }

  try {
    console.log('Loading user profile with token:', effectiveToken);
    setLoading(true);

    // Use the provided token for Authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${effectiveToken}`;

    const res = await axios.get('/user/profile');
    console.log('Profile response:', res.data);

    if (res.data && res.data.status && res.data.result) {
      setUser(res.data.result);
      setError(null);
      console.log("user data loaded:", res.data.result);
    } else {
      console.error('Unexpected profile response structure:', res.data);
      setError('Failed to load user data');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  } catch (err) {
    console.error('Error loading user:', err);
    setError('Failed to load user data');
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  } finally {
    setLoading(false);
  }
}, [token]);
const login = async (credentials) => {
  try {
    setLoading(true);

    // Clear any existing tokens or session data before login
    localStorage.removeItem('token');
    localStorage.removeItem('token_time');
    localStorage.removeItem('user_data');
    delete axios.defaults.headers.common['Authorization'];

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

      // Get current timestamp for token creation time
      const currentTime = Date.now().toString();

      // Make sure force_relogin_time is null to prevent immediate session expiration
      if (userData.force_relogin_time) {
        userData.force_relogin_time = null;
        userData.force_relogin_type = null;
      }

      // Save token and token time to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('token_time', currentTime);

      // Store user data in localStorage for persistence
      try {
        localStorage.setItem('user_data', JSON.stringify(userData));
      } catch (storageError) {
        console.warn('Failed to store user data in localStorage:', storageError);
      }

      // Update state with user data immediately
      setToken(newToken);
      setUser(userData);

      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      console.log('Login successful, token stored and headers set');

      // Load user profile data to ensure we have the most up-to-date information
      // try {
      //   await loadUser(newToken);
      // } catch (loadError) {
      //   console.warn('Initial profile load failed, using login response data:', loadError);
      //   // We already set the user from the login response, so this is just a warning
      // }

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

    // Check if the error is due to a blocked account
    if (err.response?.status === 403 && err.response?.data?.msg?.includes('blocked')) {
      const blockReason = err.response?.data?.block_reason || 'No reason provided';
      const errorMessage = `Your account has been blocked. Reason: ${blockReason}`;
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
        isBlocked: true,
        blockReason: blockReason
      };
    }

    const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Login failed';
    setError(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setLoading(false);
  }
};

  // Load user only once on mount if token exists
  useEffect(() => {
    // Check if token exists in localStorage
    const storedToken = localStorage.getItem('token');

    // If there's no token in localStorage, make sure our state reflects that
    if (!storedToken && token) {
      console.log('Token in state but not in localStorage, clearing state');
      setToken(null);
      setUser(null);
      setLoading(false);
      hasTriedToLoadUser.current = true;
      return;
    }

    // Only try to load user data if:
    // 1. We haven't tried before
    // 2. We have a token
    // 3. We're not already loading
    if (!hasTriedToLoadUser.current && token && !loading) {
      console.log('Initial load of user data with token:', token);
      hasTriedToLoadUser.current = true; // Mark that we've tried
      loadUser();
    } else if (!token) {
      // If no token, just mark loading as false and don't try to load user
      console.log('No token found, skipping user data load');
      setLoading(false);
      hasTriedToLoadUser.current = true;
    }

    // This effect should only run once on mount
  }, [login]); // Empty dependency array = only run on mount

  // Login function


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

  // Logout function - completely clears all auth state
  const logout = () => {
    console.log('Logout function called - clearing all auth state');

    // Check if this was an admin-initiated login
    const wasAdminLogin = sessionStorage.getItem('admin_login') === 'true';
    console.log('Was admin login:', wasAdminLogin);

    // 1. Clear all localStorage items related to authentication
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 2. Clear all sessionStorage items
    sessionStorage.clear();

    // 3. Set a flag to prevent redirect loops
    sessionStorage.setItem('clean_logout', 'true');

    // 4. Reset all state variables
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);

    // 5. Reset all refs
    hasTriedToLoadUser.current = true;

    // 6. Clear all axios headers
    delete axios.defaults.headers.common['Authorization'];
    axios.defaults.headers.common = {};

    // 7. Clear any pending requests
    // This helps prevent 401 errors from in-flight requests
    if (window._axiosSource) {
      window._axiosSource.cancel('Logout initiated');
    }

    console.log('User logged out successfully - all state cleared');

    // 8. Force a complete page reload to clear any lingering state
    // This is the most reliable way to clear everything
    if (wasAdminLogin) {
      // If this was an admin login, close the tab or redirect to admin login
      console.log('Closing admin login tab or redirecting to admin login');
      window.close(); // Try to close the tab
      // If window.close() doesn't work (most browsers block it), redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } else {
      // Normal logout, redirect to login page
      window.location.href = '/login';
    }
  };
  const logoutByAdmin = () => {
    console.log('Logout function called - clearing all auth state');

    // Check if this was an admin-initiated login
    const wasAdminLogin = sessionStorage.getItem('admin_login') === 'true';
    console.log('Was admin login:', wasAdminLogin);

    // 1. Clear all localStorage items related to authentication
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 2. Clear all sessionStorage items
    sessionStorage.clear();

    // 3. Set a flag to prevent redirect loops
    sessionStorage.setItem('clean_logout', 'true');

    // 4. Reset all state variables
    setToken(null);
    setUser(null);
    setError(null);
    setLoading(false);

    // 5. Reset all refs
    hasTriedToLoadUser.current = true;

    // 6. Clear all axios headers
    delete axios.defaults.headers.common['Authorization'];
    axios.defaults.headers.common = {};

    // 7. Clear any pending requests
    // This helps prevent 401 errors from in-flight requests
    if (window._axiosSource) {
      window._axiosSource.cancel('Logout initiated');
    }

    console.log('User logged out successfully - all state cleared');

    // 8. Force a complete page reload to clear any lingering state
    // This is the most reliable way to clear everything
    // if (wasAdminLogin) {
    //   // If this was an admin login, close the tab or redirect to admin login
    //   console.log('Closing admin login tab or redirecting to admin login');
    //   window.close(); // Try to close the tab
    //   // If window.close() doesn't work (most browsers block it), redirect to login
    //   setTimeout(() => {
    //     window.location.href = '/login';
    //   }, 100);
    // } else {
    //   // Normal logout, redirect to login page
    //   window.location.href = '/login';
    // }
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
    logoutByAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;