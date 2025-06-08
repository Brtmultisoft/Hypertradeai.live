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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';

import OTPInput from '../../components/auth/OTPInput';
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
  const navigate = useNavigate();
  const location = useLocation(); // Needed for logging
  const { login: authLogin, complete2FALogin, loading, error, isAuthenticated } = useAuth();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [processingHash, setProcessingHash] = useState(false);
  const [hashError, setHashError] = useState(null);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const hasRedirected = useRef(false);

  // Login states
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFARequestId, setTwoFARequestId] = useState('');
  const [userId, setUserId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // Add global error handler to catch any unhandled errors
  useEffect(() => {
    const handleError = (event) => {
      console.error('🚨 Global error caught:', event.error);
      console.error('🚨 Error details:', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      // Prevent default browser error handling that might cause page reload
      event.preventDefault();
    };

    const handleUnhandledRejection = (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      // Prevent default browser handling
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Handle normal login with email and password
  const handleLogin = async (email, password) => {
    console.log('🚀 handleLogin called with:', { email, password: '***' });
    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('📞 Calling authLogin...');
      const response = await authLogin({ email, password });
      console.log('📡 Login response received:', response);

      if (response.success) {
        // Check if 2FA is required by checking the response data
        if (response.userData && response.userData.requires_2fa_verification && response.userData.otp_request_id) {
          // 2FA is enabled and OTP was sent
          console.log('2FA required, setting up 2FA dialog:', {
            otp_request_id: response.userData.otp_request_id,
            user_id: response.userData.user_id
          });

          setTwoFARequestId(response.userData.otp_request_id);
          setUserId(response.userData.user_id);
          setShow2FADialog(true);
          setSuccessMessage('2FA OTP sent to your email. Please verify to complete login.');
          setShowSuccessAlert(true);

          console.log('2FA dialog should be open now, show2FADialog:', true);
        } else {
          // Normal login without 2FA - AuthContext already handled token storage
          console.log('Normal login without 2FA, redirecting to dashboard');
          setSuccessMessage('Login successful! Redirecting to dashboard...');
          setShowSuccessAlert(true);

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      } else {
        console.log('Login failed:', response.error);
        setOtpError(response.error || 'Login failed');
      }
    } catch (err) {
      console.error('❌ Error in handleLogin:', err);
      console.error('❌ Error stack:', err.stack);
      setOtpError(err.message || 'Login failed');
    } finally {
      console.log('🏁 handleLogin finished, setting loading to false');
      setOtpLoading(false);
    }
  };

  const handle2FAVerification = async (otp) => {
    try {
      setOtpLoading(true);
      setOtpError(null);

      const response = await complete2FALogin(otp, twoFARequestId, userId);

      if (response.success) {
        // 2FA verification successful - AuthContext handled token storage
        setSuccessMessage('2FA verification successful! Redirecting to dashboard...');
        setShowSuccessAlert(true);
        setShow2FADialog(false);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setOtpError(response.error || 'Invalid 2FA OTP');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setOtpError(err.message || 'Failed to verify 2FA');
    } finally {
      setOtpLoading(false);
    }
  };

  // ✅ Admin Login via URL Hash
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hash = params.get('hash');
    const clearParam = params.get('clear');
    const forcedParam = params.get('forced');
    const expiredParam = params.get('expired');
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

  // ✅ Normal Authenticated Redirect - Only redirect if not waiting for 2FA
  useEffect(() => {
    console.log('🔄 Redirect useEffect triggered:', {
      isAuthenticated,
      hasRedirected: hasRedirected.current,
      loading,
      processingHash,
      show2FADialog,
      twoFARequestId
    });

    // Don't redirect if:
    // 1. User is not authenticated
    // 2. Already redirected
    // 3. Still loading
    // 4. Processing admin hash
    // 5. 2FA dialog is open
    // 6. Waiting for 2FA verification
    if (isAuthenticated && !hasRedirected.current && !loading && !processingHash && !show2FADialog && !twoFARequestId) {
      console.log('User is authenticated and no 2FA required, redirecting to dashboard');
      hasRedirected.current = true;
      navigate('/dashboard');
    } else {
      console.log('Not redirecting because:', {
        notAuthenticated: !isAuthenticated,
        alreadyRedirected: hasRedirected.current,
        stillLoading: loading,
        processingHash,
        show2FADialog,
        waitingFor2FA: !!twoFARequestId
      });
    }
  }, [isAuthenticated, navigate, loading, processingHash, show2FADialog, twoFARequestId]);

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
      minLength: 6,
      minLengthMessage: 'Password must be at least 6 characters',
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
      console.log('📝 Form submitted with values:', { email: formValues.email, password: '***' });
      try {
        // Use normal login with email and password
        await handleLogin(formValues.email, formValues.password);
        console.log('✅ handleLogin completed successfully');
      } catch (error) {
        console.error('❌ Error in form submission:', error);
        throw error; // Re-throw to let useForm handle it
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
      {otpError && <Alert severity="error" sx={{ mb: 3 }}>{otpError}</Alert>}

      {processingHash && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Processing login request...
          </Typography>
        </Box>
      )}

      {/* Login Info */}
    

      <Box
        component="form"
        onSubmit={(e) => {
          console.log('📋 Form onSubmit triggered');
          console.log('📋 Event details:', {
            type: e.type,
            defaultPrevented: e.defaultPrevented,
            target: e.target.tagName
          });
          handleSubmit(e);
        }}
        noValidate
      >
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
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password && Boolean(errors.password)}
          helperText={touched.password && errors.password}
          fullWidth
          margin="normal"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ textAlign: 'right', mt: 1, mb: 3 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary">
            Forgot Password?
          </Link>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || isSubmitting || otpLoading}
          sx={{ mb: 2 }}
          onClick={(e) => {
            console.log('🖱️ Login button clicked');
            console.log('🖱️ Button event details:', {
              type: e.type,
              defaultPrevented: e.defaultPrevented,
              target: e.target.tagName
            });
          }}
        >
          {loading || isSubmitting || otpLoading ? (
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

      {/* Blocked User Dialog */}
      <Dialog
        open={showBlockedDialog}
        onClose={() => setShowBlockedDialog(false)}
        aria-labelledby="blocked-dialog-title"
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderTop: '4px solid',
              borderColor: 'error.main',
              borderRadius: '8px',
            }
          }
        }}
      >
        <DialogTitle id="blocked-dialog-title">
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                bgcolor: 'error.main',
                color: 'white',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <LockIcon />
            </Box>
            <Box>
              <Typography variant="h6">Account Blocked</Typography>
              <Typography variant="caption" color="text.secondary">
                Your account has been restricted
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
            <Typography variant="body2">
              Your account has been blocked by an administrator. You cannot log in or use the platform at this time.
            </Typography>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Reason for blocking:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {blockReason || 'No reason provided'}
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2">
              If you believe this is an error, please contact support for assistance.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setShowBlockedDialog(false)}
            variant="contained"
            color="primary"
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Verification Dialog */}
      <Dialog
        open={show2FADialog}
        onClose={() => setShow2FADialog(false)}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        disableBackdropClick
      >
        <DialogTitle>Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <OTPInput
            title="Enter 2FA Code"
            subtitle="Enter the 6-digit code sent to your email"
            length={6}
            onVerify={handle2FAVerification}
            loading={otpLoading}
            error={otpError}
            autoFocus={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShow2FADialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

 
    </Box>
  );
};

export default Login;
