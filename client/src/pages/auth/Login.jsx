import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  useTheme,
  Snackbar,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';

const Login = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, loading, error, isAuthenticated } = useAuth();

  // State for success notification
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Track if this component has redirected
  const hasRedirected = useRef(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    // Only redirect if:
    // 1. User is authenticated
    // 2. We haven't already redirected
    // 3. We're not in the middle of loading
    if (isAuthenticated && !hasRedirected.current && !loading) {
      console.log('User is authenticated, redirecting to dashboard');
      hasRedirected.current = true;
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, loading]);

  // Form validation rules
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

  // Initialize form
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
      console.log('Form submitted with values:', formValues);

      const result = await login(formValues);
      if (result.success) {
        // Show success notification
        setSuccessMessage(result.message || 'Login successful!');
        setShowSuccessAlert(true);

        // Redirect will be handled by the useEffect that watches isAuthenticated
        console.log('Login successful, authentication state will trigger redirect');

        // Reset the redirect flag to allow the useEffect to redirect
        hasRedirected.current = false;
      }
    }
  );

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle success alert close
  const handleSuccessAlertClose = () => {
    setShowSuccessAlert(false);
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        Welcome Back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sign in to your account to continue
      </Typography>

      {/* Success Message */}
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={handleSuccessAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSuccessAlertClose}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Login Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
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

        {/* Password Field */}
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
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Forgot Password Link */}
        <Box sx={{ textAlign: 'right', mt: 1, mb: 3 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            color="primary"
          >
            Forgot password?
          </Link>
        </Box>

        {/* Submit Button */}
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

        {/* Register Link */}
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
