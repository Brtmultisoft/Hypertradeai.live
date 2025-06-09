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
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Phone as PhoneIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { isValidEmail, isValidPhone } from '../../utils/validators';
import OTPInput from '../../components/auth/OTPInput';
import AuthService from '../../services/auth.service';

const ForgotPassword = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { forgotPassword, resetPasswordWithOTP, loading, error } = useAuth();

  // State management
  const [step, setStep] = useState('contact'); // 'contact', 'otp', 'password'
  const [contactMethod, setContactMethod] = useState('email'); // 'email' or 'mobile'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

  // Contact form validation rules
  const getValidationRules = () => {
    if (contactMethod === 'email') {
      return {
        email: {
          required: true,
          requiredMessage: 'Email is required',
          validate: (value) => (!isValidEmail(value) ? 'Please enter a valid email address' : null),
        },
      };
    } else {
      return {
        phoneNumber: {
          required: true,
          requiredMessage: 'Phone number is required',
          validate: (value) => (!isValidPhone(value) ? 'Please enter a valid phone number' : null),
        },
      };
    }
  };

  // Initialize contact form
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
    { email: '', phoneNumber: '' },
    getValidationRules(),
    async (formValues) => {
      console.log('🔐 Forgot password form submitted:', { contactMethod, formValues });
      try {
        let result;

        if (contactMethod === 'email') {
          result = await forgotPassword(formValues.email);
          setEmail(formValues.email);
        } else {
          // Send mobile OTP for forgot password
          result = await AuthService.sendMobileForgotPasswordOTP(formValues.phoneNumber);
          setPhoneNumber(formValues.phoneNumber);
        }

        console.log('📡 Forgot password result:', result);

        if (result.status) {
          console.log('✅ OTP sent successfully, showing dialog');
          setOtpRequestId(result.data.otp_request_id || result.data.requestId);
          setShowOTPDialog(true);
          setSuccessMessage(`OTP sent to your ${contactMethod}. Please check your ${contactMethod === 'email' ? 'inbox' : 'messages'}.`);
          setShowSuccessAlert(true);
          resetForm();
        } else {
          console.error('❌ Forgot password failed:', result.msg || result.message);
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

      // Basic validation
      if (!otp || otp.length !== 4) {
        setOtpError('Please enter a valid 4-digit OTP');
        return;
      }

      console.log('✅ OTP format valid, proceeding to password reset');
      // Store the OTP for later use in password reset
      // The actual OTP verification will happen during password reset
      setPasswordData(prev => ({ ...prev, otp }));
      setShowOTPDialog(false);
      setShowPasswordDialog(true);
      setSuccessMessage('Please enter your new password.');
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('❌ Error in OTP verification:', err);
      setOtpError(err.msg || err.message || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    try {
      let result;

      if (contactMethod === 'email') {
        result = await forgotPassword(email);
      } else {
        result = await AuthService.sendMobileForgotPasswordOTP(phoneNumber);
      }

      if (result.status) {
        setOtpRequestId(result.data.otp_request_id || result.data.requestId);
        setSuccessMessage(`New OTP sent to your ${contactMethod}.`);
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
      let result;

      if (contactMethod === 'email') {
        result = await resetPasswordWithOTP(
          email,
          passwordData.otp,
          otpRequestId,
          passwordData.password
        );
      } else {
        result = await AuthService.resetPasswordWithMobileOTP(
          phoneNumber,
          passwordData.otp,
          otpRequestId,
          passwordData.password
        );
      }

      console.log('📡 Password reset result:', result);

      if (result.status) {
        console.log('✅ Password reset successful, redirecting to login');
        setShowPasswordDialog(false);
        setSuccessMessage('Password reset successful! You can now login with your new password.');
        setShowSuccessAlert(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        console.error('❌ Password reset failed:', result.msg || result.message);
        setOtpError(result.msg || result.message || 'Failed to reset password');
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose how you'd like to receive your password reset code
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



      {/* Contact Method Selection */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Choose Verification Method
        </Typography>

        <ToggleButtonGroup
          value={contactMethod}
          exclusive
          onChange={(_, newMethod) => {
            if (newMethod !== null) {
              setContactMethod(newMethod);
              resetForm();
            }
          }}
          aria-label="contact method"
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="email" aria-label="email">
            <EmailIcon sx={{ mr: 1 }} />
            Email
          </ToggleButton>
          <ToggleButton value="mobile" aria-label="mobile">
            <PhoneIcon sx={{ mr: 1 }} />
            Mobile
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
          <Chip
            icon={<EmailIcon />}
            label="Email OTP"
            color={contactMethod === 'email' ? 'primary' : 'default'}
            variant={contactMethod === 'email' ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<PhoneIcon />}
            label="SMS OTP"
            color={contactMethod === 'mobile' ? 'primary' : 'default'}
            variant={contactMethod === 'mobile' ? 'filled' : 'outlined'}
          />
        </Box>
      </Paper>

      {/* Forgot Password Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Dynamic Contact Field */}
        {contactMethod === 'email' ? (
          <TextField
            label="Email Address"
            name="email"
            type="email"
            value={values.email || ''}
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
        ) : (
          <TextField
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            value={values.phoneNumber || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.phoneNumber && Boolean(errors.phoneNumber)}
            helperText={touched.phoneNumber && errors.phoneNumber}
            fullWidth
            margin="normal"
            placeholder="+1234567890"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={loading || isSubmitting}
          startIcon={<SendIcon />}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading || isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Sending...
            </>
          ) : (
            `Send OTP to ${contactMethod === 'email' ? 'Email' : 'Mobile'}`
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
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {contactMethod === 'email' ? <EmailIcon /> : <PhoneIcon />}
            Verify {contactMethod === 'email' ? 'Email' : 'Mobile'} OTP
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We've sent a verification code to your {contactMethod === 'email' ? 'email address' : 'mobile number'}:
          </Typography>
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 3 }}>
            {contactMethod === 'email' ? email : phoneNumber}
          </Typography>

          <OTPInput
            title="Enter Verification Code"
            subtitle={`Enter the 4-digit code sent to your ${contactMethod}`}
            length={4}
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
            Enter your new password for {contactMethod === 'email' ? email : phoneNumber}
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
