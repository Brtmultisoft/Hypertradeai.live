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
  const { forgotPassword, loading, error } = useAuth();

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
  const [localError, setLocalError] = useState(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Password form state
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Reset all states when starting over
  const resetAllStates = () => {
    setEmail('');
    setPhoneNumber('');
    setOtpRequestId('');
    setShowOTPDialog(false);
    setShowPasswordDialog(false);
    setShowSuccessAlert(false);
    setSuccessMessage('');
    setOtpError(null);
    setLocalError(null);
    setIsOtpVerified(false);
    setPasswordData({ password: '', confirmPassword: '', otp: '' });
    setPasswordErrors({});
  };

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
        console.log('📡 Result success:', result.success);
        console.log('📡 Result status:', result.status);
        console.log('📡 Result data:', result.data);

        if (result.success || result.status) {
          console.log('✅ OTP sent successfully, showing dialog');
          // Handle both AuthContext response format and direct API response format
          const responseData = result.data || result;
          console.log('📡 Response data:', responseData);

          const requestId = responseData.otp_request_id || responseData.requestId;
          console.log('📡 Request ID:', requestId);

          setOtpRequestId(requestId);
          setShowOTPDialog(true);
          setSuccessMessage(`OTP sent to your ${contactMethod}. Please check your ${contactMethod === 'email' ? 'inbox' : 'messages'}.`);
          setShowSuccessAlert(true);
          resetForm();

          console.log('✅ Modal should be showing now. showOTPDialog:', true);
          console.log('✅ State after setting showOTPDialog:', {
            showOTPDialog: true,
            otpRequestId: requestId,
            contactMethod,
            email,
            phoneNumber
          });
        } else {
          console.error('❌ Forgot password failed:', result.msg || result.message || result.error);
          setLocalError(result.msg || result.message || result.error || 'Failed to send OTP');
        }
      } catch (error) {
        console.error('❌ Error in forgot password form submission:', error);
        throw error;
      }
    }
  );

  // Handle OTP verification - Simplified approach
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

      console.log('🔍 Verifying OTP with backend before proceeding...');

      // Verify OTP with backend first
      let verificationResult;
      if (contactMethod === 'email') {
        verificationResult = await AuthService.verifyForgotPasswordOTP(otp, otpRequestId);
      } else {
        verificationResult = await AuthService.verifyForgotPasswordMobileOTP(otp, otpRequestId);
      }

      console.log('📡 OTP verification result:', verificationResult);

      // Check if verification was successful
      // Backend returns: { status: true, message: "OTP verified successfully", data: { verified: true } }
      if (verificationResult.status === true && verificationResult.data?.verified) {
        console.log('✅ OTP verified successfully, proceeding to password reset');

        // Store the verified OTP for password reset and mark as verified
        setPasswordData(prev => ({ ...prev, otp }));
        setIsOtpVerified(true);
        setShowOTPDialog(false);
        setShowPasswordDialog(true);
        setSuccessMessage(verificationResult.message || 'OTP verified successfully! Please enter your new password.');
        setShowSuccessAlert(true);
      } else {
        console.error('❌ OTP verification failed:', verificationResult.message || verificationResult.error);
        setOtpError(verificationResult.message || verificationResult.error || 'Invalid or expired OTP');
      }
    } catch (err) {
      console.error('❌ Error in OTP verification:', err);
      // Handle different error response formats
      const errorMessage = err.message || err.msg || err.error || 'Failed to verify OTP. Please try again.';
      setOtpError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOTP = async () => {
    try {
      setOtpLoading(true);
      setOtpError(null);

      let result;

      if (contactMethod === 'email') {
        result = await forgotPassword(email);
      } else {
        result = await AuthService.sendMobileForgotPasswordOTP(phoneNumber);
      }

      console.log('📡 Resend OTP result:', result);

      if (result.status === true || result.success === true) {
        const responseData = result.data || result;
        const requestId = responseData.otp_request_id || responseData.requestId;
        setOtpRequestId(requestId);
        setSuccessMessage(`New OTP sent to your ${contactMethod}.`);
        setShowSuccessAlert(true);
      } else {
        setOtpError(result.message || result.msg || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('❌ Error in resend OTP:', err);
      setOtpError(err.message || err.msg || err.error || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
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
      email: contactMethod === 'email' ? email : undefined,
      phoneNumber: contactMethod === 'mobile' ? phoneNumber : undefined,
      otpRequestId,
      password: '***'
    });

    if (!validatePasswordForm()) {
      console.log('❌ Password form validation failed');
      return;
    }

    // Safety check: Ensure OTP is verified before proceeding
    if (!isOtpVerified) {
      console.error('❌ OTP not verified, cannot reset password');
      setOtpError('Please verify your OTP first');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('📞 Calling resetPasswordWithVerifiedOTP (OTP already verified)...');
      let result;

      if (contactMethod === 'email') {
        // Use verified OTP endpoint for email
        result = await AuthService.resetPasswordWithVerifiedOTP(
          email,
          otpRequestId,
          passwordData.password
        );
      } else {
        // Use verified OTP endpoint for mobile
        result = await AuthService.resetPasswordWithVerifiedMobileOTP(
          phoneNumber,
          otpRequestId,
          passwordData.password
        );
      }

      console.log('📡 Password reset result:', result);

      // Check for success using the correct response format
      // Backend returns: { status: true, message: "Password reset successfully", data: { success: true } }
      if (result.status === true) {
        console.log('✅ Password reset successful, redirecting to login');
        setShowPasswordDialog(false);
        setSuccessMessage(result.message || 'Password reset successful! You can now login with your new password.');
        setShowSuccessAlert(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        console.error('❌ Password reset failed:', result.message || result.error);
        setOtpError(result.message || result.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('❌ Error in password reset:', err);
      // Handle different error response formats
      const errorMessage = err.message || err.msg || err.error || 'Failed to reset password';
      setOtpError(errorMessage);
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
      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || localError}
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
              resetAllStates();
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
      {console.log('🔍 Rendering OTP Dialog. showOTPDialog:', showOTPDialog)}
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
