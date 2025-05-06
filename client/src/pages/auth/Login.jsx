import { useState, useEffect, useRef, useMemo } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  Alert,
  CircularProgress,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import axios from 'axios';

// ✅ Custom hook moved OUTSIDE component to comply with React rules
const useQueryParams = () => {
  const { search } = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(search);
    return {
      hash: params.get('hash'),
      clear: params.get('clear'),
      forced: params.get('forced'),
      expired: params.get('expired'),
      attemptId: params.get('attempt'),
    };
  }, [search]);
};

export const clearFrontendSession = () => {
  console.log('Clearing all frontend session data');

  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Clear axios default headers
  delete axios.defaults.headers.common['Authorization'];
  axios.defaults.headers.common = {};

  // Clear cookies
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; Max-Age=0; path=/;`;
  });

  console.log('Frontend session data cleared');
};

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation(); // Needed for logging
  const { login, loading, error, isAuthenticated, logout, logoutByAdmin } = useAuth();

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processingHash, setProcessingHash] = useState(false);
  const [hashError, setHashError] = useState(null);
  const hasRedirected = useRef(false);

  const queryParams = useQueryParams();

  // ✅ Admin Login via URL Hash
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = params.get('hash');
    const clearParam = params.get('clear');
    const forcedParam = params.get('forced');
    const expiredParam = params.get('expired');
    const timestamp = params.get('t');
    const attemptId = params.get('attempt');

    // Function to clear all browser storage and session data
    const clearAllSessionData = () => {
      console.log('Clearing all session data');

      // 1. Clear all localStorage items
      localStorage.clear();

      // 2. Clear all sessionStorage items
      sessionStorage.clear();

      // 3. Set a flag to prevent redirect loops
      sessionStorage.setItem('admin_login_in_progress', 'true');

      // 4. Clear all axios headers
      delete axios.defaults.headers.common['Authorization'];
      axios.defaults.headers.common = {};

      // 5. Clear any cookies related to authentication
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      console.log('All session data cleared');
    };

    // Handle forced logout scenario
    if (forcedParam === '1') {
      console.log('Forced logout detected, clearing session data');
      clearAllSessionData();

      // Remove the forced parameter from the URL to prevent confusion
      window.history.replaceState({}, document.title, '/login');

      // Show a message to the user
      setHashError('Your session was ended because an administrator logged in as another user.');

      // Return early to prevent further processing
      return;
    }

    // Handle expired session
    if (expiredParam === '1') {
      console.log('Expired session detected, clearing session data');
      clearAllSessionData();

      // Remove the expired parameter from the URL to prevent confusion
      window.history.replaceState({}, document.title, '/login');

      // Show a message to the user
      setHashError('Your session has expired. Please log in again.');

      // Return early to prevent further processing
      return;
    }

    // Check if we need to clear existing sessions
    if (hash && clearParam === '1') {
      // Force logout any existing user by clearing all session data
      clearAllSessionData();
    }

    if (hash) {
      console.log(`Hash parameter detected (${hash}), processing admin login request`);
      setProcessingHash(true);

      // Process the admin login request
      const processAdminLoginRequest = async () => {
        try {
          // Make sure all session data is cleared
          clearAllSessionData();

          // Set a flag to indicate this is an admin-initiated login
          sessionStorage.setItem('admin_login_in_progress', 'true');

          // Store the current timestamp to identify this session
          const loginTimestamp = Date.now().toString();
          sessionStorage.setItem('admin_login_timestamp', loginTimestamp);

          // Get the login attempt ID from the URL if available
          const loginAttemptId = attemptId || '';
          console.log('Login attempt ID from URL:', loginAttemptId);

          // Make the login request with the hash and login attempt ID
          console.log('Sending login request with hash:', hash);
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}/user/login/request`,
            {
              hash,
              admin_login_timestamp: loginTimestamp,
              login_attempt_id: loginAttemptId
            }
          );

          console.log('Login response:', response.data);

          if (response.data && response.data.status) {
            // Store token in localStorage with timestamp
            localStorage.setItem('token', response.data.result.token);
            localStorage.setItem('token_time', loginTimestamp);

            // Store user data
            try {
              localStorage.setItem('user_data', JSON.stringify(response.data.result));
            } catch (storageError) {
              console.warn('Failed to store user data:', storageError);
            }

            // Store admin login flags
            sessionStorage.setItem('admin_login', 'true');
            sessionStorage.setItem('admin_login_time', loginTimestamp);
            sessionStorage.setItem('admin_login_username', response.data.result.username);
            sessionStorage.setItem('admin_login_protected', 'true');

            // Store the login attempt ID if available
            if (response.data.result.login_attempt_id) {
              sessionStorage.setItem('login_attempt_id', response.data.result.login_attempt_id);
              console.log('Stored login attempt ID:', response.data.result.login_attempt_id);
            }

            // Show success message
            setSuccessMessage(`Login successful as ${response.data.result.username}`);
            setShowSuccessAlert(true);

            console.log('Login successful, redirecting to dashboard...');

            // Redirect to dashboard with a complete page reload
            setTimeout(() => {
              // Remove the hash from the URL to prevent reuse
              try {
                window.history.replaceState({}, document.title, '/login');
              } catch (historyError) {
                console.warn('Failed to update history:', historyError);
              }

              // Force a complete page reload to ensure clean state
              window.location.href = '/dashboard';
            }, 1500);
          } else {
            console.error('Login request failed:', response.data);
            setHashError(response.data?.msg || 'Failed to process login request');
          }
        } catch (err) {
          console.error('Error processing admin login request:', err);
          setHashError(err.response?.data?.msg || 'Failed to process login request');
        } finally {
          setProcessingHash(false);
          // Don't remove the admin_login_in_progress flag here
          // It will be removed after successful redirect
        }
      };

      processAdminLoginRequest();
    }
  }, [location, navigate]);

  // ✅ Normal Authenticated Redirect
  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current && !loading && !processingHash) {
      console.log('User is authenticated, redirecting to dashboard');
      hasRedirected.current = true;
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, loading, processingHash]);

  // ✅ Login Form Setup
  const validationRules = {
    email: {
      required: true,
      requiredMessage: 'Email is required',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address',
    },
    password: {
      required: true,
      requiredMessage: 'Password is required',
      minLength: 8,
      minLengthMessage: 'Password must be at least 8 characters',
    },
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      email: '',
      password: '',
    },
    validationRules,
    async (formValues) => {
      const result = await login(formValues);
      if (result.success) {
        setSuccessMessage(result.message || 'Login successful!');
        setShowSuccessAlert(true);
        hasRedirected.current = false; // Let redirect happen again if needed
      }
    }
  );

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        Welcome Back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sign in to your account to continue
      </Typography>

      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={() => setShowSuccessAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccessAlert(false)} severity="success" variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {hashError && <Alert severity="error" sx={{ mb: 3 }}>{hashError}</Alert>}

      {processingHash && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Processing login request...
          </Typography>
        </Box>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password && Boolean(errors.password)}
          helperText={touched.password && errors.password}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ textAlign: 'right', mt: 1, mb: 3 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary">
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || isSubmitting}
          sx={{ mb: 2 }}
        >
          {loading || isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        <Typography variant="body2" align="center">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register" color="primary">
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
