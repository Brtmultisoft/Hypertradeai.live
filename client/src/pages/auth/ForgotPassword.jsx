import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Link,
  Alert,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { isValidEmail } from '../../utils/validators';
import OTPInput from '../../components/auth/OTPInput';

const ForgotPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { forgotPassword, resetPasswordWithOTP, loading, error } = useAuth();

  // State management
  const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
  const [email, setEmail] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Email form validation rules
  const validationRules = {
    email: {
      required: true,
      requiredMessage: 'Email is required',
      validate: (value) => (!isValidEmail(value) ? 'Please enter a valid email address' : null),
    },
  };

  // Initialize email form
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useForm(
    {
      email: '',
    },
    validationRules,
    async (formValues) => {
      console.log('🔐 Forgot password form submitted with email:', formValues.email);
      try {
        const result = await forgotPassword(formValues.email);
        console.log('📡 Forgot password result:', result);

        if (result.success) {
          console.log('✅ OTP sent successfully, showing dialog');
          setEmail(formValues.email);
          setOtpRequestId(result.data.otp_request_id);
          setShowOTPDialog(true);
          setSuccessMessage('OTP sent to your email. Please check your inbox.');
          setShowSuccessAlert(true);
          resetForm();
        } else {
          console.error('❌ Forgot password failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error in forgot password form submission:', error);
        throw error;
      }
    }
  );

  // Handle OTP verification
  const handleOTPVerification = async (otp) => {
    console.log('🔢 OTP verification started with OTP:', otp);
    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('✅ OTP verified successfully, showing password dialog');
      // Store the OTP for later use in password reset
      setPasswordData(prev => ({ ...prev, otp }));
      setShowOTPDialog(false);
      setShowPasswordDialog(true);
      setSuccessMessage('OTP verified! Please enter your new password.');
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('❌ OTP verification failed:', err);
      setOtpError(err.msg || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setOtpRequestId(result.data.otp_request_id);
        setSuccessMessage('New OTP sent to your email.');
        setShowSuccessAlert(true);
      }
    } catch (err) {
      setOtpError(err.msg || 'Failed to resend OTP');
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user types
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.password) {
      errors.password = 'Password is required';
    } else if (passwordData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.password !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();

    console.log('🔐 Password reset form submitted');
    console.log('📋 Form data:', {
      email,
      otp: passwordData.otp,
      otpRequestId,
      password: '***'
    });

    if (!validatePasswordForm()) {
      console.log('❌ Password form validation failed');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('📞 Calling resetPasswordWithOTP...');
      const result = await resetPasswordWithOTP(
        email,
        passwordData.otp,
        otpRequestId,
        passwordData.password
      );

      console.log('📡 Password reset result:', result);

      if (result.success) {
        console.log('✅ Password reset successful, redirecting to login');
        setShowPasswordDialog(false);
        setSuccessMessage('Password reset successful! You can now login with your new password.');
        setShowSuccessAlert(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        console.error('❌ Password reset failed:', result.error);
        setOtpError(result.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('❌ Error in password reset:', err);
      setOtpError(err.msg || 'Failed to reset password');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        Forgot Password
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter your email address and we'll send you an OTP to reset your password
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

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}



      {/* Forgot Password Form */}
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

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading || isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Sending OTP...
            </>
          ) : (
            'Send OTP'
          )}
        </Button>

        {/* Back to Login Link */}
        <Button
          component={RouterLink}
          to="/login"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Login
        </Button>
      </Box>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onClose={() => setShowOTPDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Email OTP</DialogTitle>
        <DialogContent>
          <OTPInput
            title="Enter Verification Code"
            subtitle={`Enter the 6-digit code sent to ${email}`}
            length={6}
            onVerify={handleOTPVerification}
            onResend={handleResendOTP}
            loading={otpLoading}
            error={otpError}
            autoFocus={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOTPDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your new password for {email}
          </Typography>

          {otpError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {otpError}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordReset} noValidate>
            <TextField
              label="New Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={passwordData.password}
              onChange={handlePasswordChange}
              error={Boolean(passwordErrors.password)}
              helperText={passwordErrors.password}
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
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              error={Boolean(passwordErrors.confirmPassword)}
              helperText={passwordErrors.confirmPassword}
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordReset}
            variant="contained"
            disabled={otpLoading}
          >
            {otpLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForgotPassword;
