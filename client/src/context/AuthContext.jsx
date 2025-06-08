import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Don't initialize from localStorage immediately
  const [loading, setLoading] = useState(true); // Start with loading true to check auth
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
  console.log('🔐 AuthContext login function called with:', { email: credentials.email, password: '***' });
  try {
    console.log('⏳ Setting loading to true...');
    setLoading(true);

    console.log('🧹 Clearing existing auth data...');
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
    if (res.data && res.data.status) {
      const responseData = res.data.result || res.data.data;
      console.log('Response data extracted:', responseData);

      // Check if 2FA is required (for both TOTP and email OTP)
      if (responseData.requires_2fa_verification) {
        // 2FA is required - don't store token yet, just return the 2FA data
        console.log('2FA required, returning 2FA data:', {
          requires_2fa_verification: responseData.requires_2fa_verification,
          two_fa_method: responseData.two_fa_method,
          otp_request_id: responseData.otp_request_id, // Only present for email OTP
          user_id: responseData.user_id
        });

        // Clear any existing token/user data from state and localStorage during 2FA flow
        console.log('🧹 Clearing all auth data for 2FA flow...');
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('token_time');
        localStorage.removeItem('user_data');

        // Clear authorization header
        delete axios.defaults.headers.common['Authorization'];

        console.log('✅ Auth data cleared, isAuthenticated should be false now');

        // IMPORTANT: Set loading to false for 2FA flow
        console.log('⏳ Setting loading to FALSE for 2FA flow');
        setLoading(false);

        return {
          success: true,
          message: res.data.msg || res.data.message || '2FA OTP sent to your email',
          userData: responseData
        };
      }

      // Normal login or 2FA verification complete - store token
      if (responseData.token) {
        const { token: newToken } = responseData;
        const userData = responseData;

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

        return {
          success: true,
          message: res.data.message || 'Login successful!',
          userData: userData
        };
      } else {
        // No token in response - this could be normal for 2FA flow
        console.log('No token in login response - checking if this is expected for 2FA flow');

        // If this is not a 2FA response, then it's an error
        if (!responseData.requires_2fa_verification) {
          console.error('No token and no 2FA required:', res.data);
          setError('Login failed - no token received');
          return { success: false, error: 'Login failed - no token received' };
        }

        // If we reach here, it means 2FA is required but somehow the 2FA check above didn't catch it
        console.error('2FA required but not properly handled:', res.data);
        setError('2FA verification required but not properly configured');
        return { success: false, error: '2FA verification required but not properly configured' };
      }
    } else {
      // If response doesn't have the expected structure
      console.error('Unexpected login response structure:', {
        hasData: !!res.data,
        hasStatus: !!res.data?.status,
        status: res.data?.status,
        fullResponse: res.data
      });
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
    console.log('🔍 AuthContext useEffect triggered - checking for stored token');

    // Check if token exists in localStorage
    const storedToken = localStorage.getItem('token');
    console.log('📦 Stored token in localStorage:', storedToken ? 'EXISTS' : 'NULL');
    console.log('🎯 Current token in state:', token ? 'EXISTS' : 'NULL');

    // If there's no token in localStorage, make sure our state reflects that
    if (!storedToken) {
      console.log('❌ No token in localStorage, clearing state');
      setToken(null);
      setUser(null);
      setLoading(false);
      hasTriedToLoadUser.current = true;
      return;
    }

    // If we have a stored token but not in state, set it
    if (storedToken && !token) {
      console.log('✅ Found token in localStorage, setting in state');
      setToken(storedToken);
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    // Check if user data is already in localStorage
    const storedUserData = localStorage.getItem('user_data');

    if (storedToken && storedUserData && !hasTriedToLoadUser.current) {
      // We have both token and user data in localStorage
      try {
        const userData = JSON.parse(storedUserData);
        console.log('Found user data in localStorage, setting in state');
        setUser(userData);
        setLoading(false);
        hasTriedToLoadUser.current = true;
        return;
      } catch (parseError) {
        console.warn('Failed to parse stored user data:', parseError);
        // Continue to load user from API
      }
    }

    // Only try to load user data from API if we haven't tried before and have a token but no user data
    if (!hasTriedToLoadUser.current && storedToken && !storedUserData) {
      console.log('Initial load of user data from API with token:', storedToken);
      hasTriedToLoadUser.current = true; // Mark that we've tried
      loadUser(storedToken);
    } else {
      // If no token or already have user data, just set loading to false
      console.log('Setting loading to false - token exists:', !!storedToken, 'user data exists:', !!storedUserData);
      setLoading(false);
      hasTriedToLoadUser.current = true;
    }

    // This effect should only run once on mount
  }, []); // Empty dependency array = only run on mount



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

  // Forgot password function with OTP
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const res = await axios.post('/user/forgot/password', { email });
      return {
        success: true,
        message: res.data.msg || res.data.message || 'OTP sent to your email',
        data: res.data.data // Contains otp_request_id and email
      };
    } catch (err) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to process forgot password request';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reset password with OTP function
  const resetPasswordWithOTP = async (email, otp, requestId, newPassword) => {
    try {
      console.log('🔐 Resetting password with OTP:', { email, otp: '***', requestId, newPassword: '***' });
      setLoading(true);

      const requestBody = {
        email,
        otp,
        otp_request_id: requestId,  // ✅ Fixed: Use correct parameter name
        new_password: newPassword   // ✅ Fixed: Use correct parameter name
      };

      console.log('📡 Sending password reset request with body:', {
        ...requestBody,
        otp: '***',
        new_password: '***'
      });

      const res = await axios.post('/user/reset/password-with-otp', requestBody);

      console.log('✅ Password reset successful:', res.data);
      return { success: true, message: res.data.msg || res.data.message || 'Password reset successful' };
    } catch (err) {
      console.error('❌ Reset password with OTP error:', err);
      console.error('❌ Error response:', err.response?.data);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to reset password';
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

  // Complete 2FA verification and login
  const complete2FALogin = async (otp, requestId, userId) => {
    try {
      setLoading(true);

      // Build request body - otp_request_id is only needed for email OTP, not TOTP
      const requestBody = {
        otp,
        user_id: userId
      };

      // Only include otp_request_id if it exists (for email OTP)
      if (requestId) {
        requestBody.otp_request_id = requestId;
      }

      console.log('🔐 Sending 2FA verification request:', {
        ...requestBody,
        otp: otp.substring(0, 2) + '****'
      });

      const res = await axios.post('/user/verify-2fa-otp', requestBody);

      if (res.data && res.data.status && res.data.data && res.data.data.token) {
        const userData = res.data.data;
        const { token: newToken } = userData;

        // Get current timestamp for token creation time
        const currentTime = Date.now().toString();

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

        console.log('2FA verification successful, login completed');

        return {
          success: true,
          message: res.data.msg || res.data.message || '2FA verification successful!',
          userData: userData
        };
      } else {
        console.error('Invalid 2FA verification response:', res.data);
        setError('2FA verification failed');
        return { success: false, error: '2FA verification failed' };
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'Failed to verify 2FA';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
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
    resetPasswordWithOTP,
    complete2FALogin,
    loadUser,
    checkReferralId,
    logoutByAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;