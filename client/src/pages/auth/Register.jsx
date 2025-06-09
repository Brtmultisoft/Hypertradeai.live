import { useState, useEffect } from 'react';
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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Fade,
  Grow,
  Zoom,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import AuthService from '../../services/auth.service';
import OTPInput from '../../components/auth/OTPInput';
import DualOTPVerificationModal from '../../components/auth/DualOTPVerificationModal';
import { isValidEmail, isValidPhone, validatePassword } from '../../utils/validators';

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { loading, error, checkReferralId } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [referralError, setReferralError] = useState('');
  const [referralInfo, setReferralInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // OTP registration states
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);

  // Dual verification states
  const [showDualOTPDialog, setShowDualOTPDialog] = useState(false);
  const [dualOtpLoading, setDualOtpLoading] = useState(false);
  const [dualOtpError, setDualOtpError] = useState(null);
  const [emailRequestId, setEmailRequestId] = useState('');
  const [mobileRequestId, setMobileRequestId] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');

  // Get referral code from URL if present and default referrer from env
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateReferralId(ref);
    } else {
      // Set default referrer from env
      const defaultRef = import.meta.env.VITE_DEFAULT_REFERRER || 'admin';
      setReferralCode(defaultRef);
      validateReferralId(defaultRef);
    }
  }, []);

  // Validate referral ID
  const validateReferralId = async (id) => {
    try {
      const result = await checkReferralId(id);
      if (result.isValid) {
        setReferralInfo(result.data);
        setReferralError('');
      } else {
        setReferralError(result.error);
        setReferralInfo(null);
      }
    } catch (err) {
      console.error('Error validating referral ID:', err);
      setReferralError('Error validating referral ID');
      setReferralInfo(null);
    }
  };

  // Form validation rules
  const validationRules = {
    name: {
      required: true,
      requiredMessage: 'Full name is required',
      minLength: 3,
      minLengthMessage: 'Name must be at least 3 characters',
    },
    username: {
      required: true,
      requiredMessage: 'Username is required',
      minLength: 3,
      minLengthMessage: 'Username must be at least 3 characters',
      pattern: /^[a-zA-Z0-9_]+$/,
      patternMessage: 'Username can only contain letters, numbers, and underscores',
    },
    email: {
      required: true,
      requiredMessage: 'Email is required',
      validate: (value) => (!isValidEmail(value) ? 'Please enter a valid email address' : null),
    },
    phone: {
      required: true,
      requiredMessage: 'Phone number is required',
      validate: (value) => (!isValidPhone(value) ? 'Please enter a valid phone number' : null),
    },
    password: {
      required: true,
      requiredMessage: 'Password is required',
      validate: (value) => {
        const result = validatePassword(value);
        return !result.isValid ? result.message : null;
      },
    },
    confirmPassword: {
      required: true,
      requiredMessage: 'Please confirm your password',
    },
  };



  // Dual verification functions
  const handleDualVerificationRegistration = async (userData, email, phone) => {
    try {
      setDualOtpLoading(true);
      setDualOtpError(null);

      console.log('Sending dual verification OTPs for:', {
        email: email,
        phone: phone
      });

      const response = await AuthService.sendDualRegistrationOTPs(email, phone);

      console.log('Dual verification OTPs response:', response);

      if (response.status) {
        setEmailRequestId(response.data.emailRequestId);
        setMobileRequestId(response.data.mobileRequestId);
        setVerificationEmail(email);
        setVerificationPhone(phone);
        setPendingUserData(userData);
        setShowDualOTPDialog(true);
        setSuccessMessage('Verification codes sent to your email and mobile!');
        setShowSuccessAlert(true);
      } else {
        console.error('Failed to send dual OTPs:', response);
        setDualOtpError(response.msg || 'Failed to send verification codes');
      }
    } catch (err) {
      console.error('Error sending dual verification OTPs:', err);
      setDualOtpError(err.msg || err.message || 'Failed to send verification codes');
    } finally {
      setDualOtpLoading(false);
    }
  };

  // OTP registration functions (fallback for email-only)
  const handleOTPRegistration = async (userData) => {
    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('Sending registration OTP for:', userData.email);

      const response = await AuthService.sendRegistrationOTP(userData.email);

      console.log('Registration OTP response:', response);

      if (response.status) {
        setOtpRequestId(response.data.requestId);
        setOtpEmail(userData.email);
        setPendingUserData(userData);
        setShowOTPDialog(true);
        setSuccessMessage('OTP sent to your email successfully!');
        setShowSuccessAlert(true);
      } else {
        console.error('Failed to send OTP:', response);
        setOtpError(response.msg || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending registration OTP:', err);
      setOtpError(err.msg || err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle dual verification
  const handleDualVerification = async (verificationData) => {
    try {
      setDualOtpLoading(true);
      setDualOtpError(null);

      console.log('Verifying dual registration OTPs:', {
        email: verificationEmail,
        phone: verificationPhone,
        emailOtp: verificationData.emailOtp,
        mobileOtp: verificationData.mobileOtp,
        emailRequestId: verificationData.emailRequestId,
        mobileRequestId: verificationData.mobileRequestId,
        hasUserData: !!pendingUserData
      });

      const response = await AuthService.verifyDualRegistrationOTPs(
        verificationEmail,
        verificationPhone,
        verificationData.emailOtp,
        verificationData.mobileOtp,
        verificationData.emailRequestId,
        verificationData.mobileRequestId,
        pendingUserData
      );

      console.log('Dual verification response:', response);

      if (response.status) {
        // Store registration data for success dialog
        setRegistrationData({
          name: pendingUserData.name,
          username: pendingUserData.username || response.data.username,
          email: verificationEmail, // Use verification email instead of pendingUserData
          password: pendingUserData.password,
          sponsorID: response.data.sponsorID,
        });

        // Show success dialog
        setOpenSuccessDialog(true);
        setShowDualOTPDialog(false);
        resetForm();
      } else {
        console.error('Dual verification failed:', response);
        setDualOtpError(response.msg || 'Invalid verification codes');
      }
    } catch (err) {
      console.error('Error verifying dual registration OTPs:', err);
      setDualOtpError(err.msg || err.message || 'Failed to verify codes');
    } finally {
      setDualOtpLoading(false);
    }
  };

  // Handle resend dual OTPs
  const handleResendDualOTPs = async () => {
    if (pendingUserData && verificationEmail && verificationPhone) {
      await handleDualVerificationRegistration(pendingUserData, verificationEmail, verificationPhone);
    }
  };

  const handleOTPVerification = async (otp) => {
    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('Verifying registration OTP:', {
        email: otpEmail,
        otp: otp,
        requestId: otpRequestId,
        hasUserData: !!pendingUserData
      });

      const response = await AuthService.verifyRegistrationOTP(
        otpEmail,
        otp,
        otpRequestId,
        pendingUserData
      );

      console.log('Registration OTP verification response:', response);

      if (response.status) {
        // Store registration data for success dialog
        setRegistrationData({
          name: pendingUserData.name,
          username: pendingUserData.username || response.data.username,
          email: otpEmail, // Use OTP email instead of pendingUserData
          password: pendingUserData.password,
          sponsorID: response.data.sponsorID, // Use sponsorID from response
        });

        // Show success dialog
        setOpenSuccessDialog(true);
        setShowOTPDialog(false);
        resetForm();
      } else {
        console.error('OTP verification failed:', response);
        setOtpError(response.msg || 'Invalid OTP');
      }
    } catch (err) {
      console.error('Error verifying registration OTP:', err);
      setOtpError(err.msg || err.message || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (pendingUserData) {
      await handleOTPRegistration(pendingUserData);
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle success dialog close
  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    navigate('/login');
  };

  // Custom handleChange function to validate confirmPassword when password changes
  const customHandleChange = (e) => {
    const { name } = e.target;

    // Call the original handleChange function
    handleChange(e);

    // If password field is changed and confirmPassword has a value, validate confirmPassword
    if (name === 'password' && values.confirmPassword) {
      // Mark confirmPassword as touched to show validation error
      setFieldTouched('confirmPassword', true);
    }
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
    resetForm,
    setFieldTouched,
  } = useForm(
    {
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validationRules,
    async (formValues) => {
      try {
        // Check referral ID validity first
        if (referralError) {
          setShowSuccessAlert(true);
          setSuccessMessage('Invalid referral ID. Please use a valid referral ID.');
          return;
        }

        // If referral code is empty, validate it with default value
        if (!referralCode) {
          const defaultRef = import.meta.env.VITE_DEFAULT_REFERRER || 'admin';
          await validateReferralId(defaultRef);
          setReferralCode(defaultRef);

          // Check again after validation
          if (referralError) {
            setShowSuccessAlert(true);
            setSuccessMessage('Invalid referral ID. Please use a valid referral ID.');
            return;
          }
        }

        // Proceed with OTP registration
        const { confirmPassword, phone, email, ...userData } = formValues;
        const finalUserData = {
          ...userData,
          confirm_password: confirmPassword, // Backend expects confirm_password
          referralId: referralCode || undefined, // Backend expects referralId, undefined if empty
          // Note: email and phone_number are passed separately, not in userData
        };

        console.log('Final user data being sent:', finalUserData);

        // Use dual verification (email + mobile) for registration
        await handleDualVerificationRegistration(finalUserData, email, phone);
      } catch (err) {
        console.error('Registration error:', err);
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  );

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle success alert close
  const handleSuccessAlertClose = () => {
    setShowSuccessAlert(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Success Dialog */}
      <Dialog
        open={openSuccessDialog}
        onClose={handleCloseSuccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Zoom in={openSuccessDialog} timeout={500}>
            <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 1 }} />
          </Zoom>
          <Typography variant="h5" component="div" fontWeight="bold">
            Registration Successful!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
            Your account has been created successfully. Please save your login details:
          </Typography>

          <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">Username:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{registrationData?.username}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyToClipboard(registrationData?.username)}
                  sx={{ ml: 1 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="bold">Password:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{registrationData?.password}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyToClipboard(registrationData?.password)}
                  sx={{ ml: 1 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight="bold">Your Sponsor ID:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{registrationData?.sponsorID}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyToClipboard(registrationData?.sponsorID)}
                  sx={{ ml: 1 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Please save these details in a secure place. You will need them to log in to your account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleCloseSuccessDialog}
            sx={{ minWidth: 120 }}
          >
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>

      <Grow in={true} timeout={800}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom align="center">
            Create Account
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

          {otpError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {otpError}
            </Alert>
          )}

          {dualOtpError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {dualOtpError}
            </Alert>
          )}

          {/* OTP Registration Info */}


          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Personal Information */}
          <TextField
            label="Full Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && Boolean(errors.name)}
            helperText={touched.name && errors.name}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Username"
            name="username"
            value={values.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.username && Boolean(errors.username)}
            helperText={touched.username && errors.username}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
          />

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
            label="Phone Number"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.phone && Boolean(errors.phone)}
            helperText={touched.phone && errors.phone}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Security Information */}
          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            onChange={customHandleChange}
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

          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword && Boolean(errors.confirmPassword)}
            helperText={touched.confirmPassword && errors.confirmPassword}
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
                    aria-label="toggle confirm password visibility"
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Referral ID"
            value={referralCode}
            onChange={(e) => {
              setReferralCode(e.target.value);
              // Clear any previous error when user types
              if (referralError) setReferralError('');
            }}
            onBlur={() => {
              // Validate referral ID when field loses focus
              if (referralCode) validateReferralId(referralCode);
            }}
            error={Boolean(referralError)}
            helperText={referralError || 'Enter a valid referral ID'}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Navigation Buttons */}
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            mb: 2
          }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              startIcon={<ArrowBackIcon />}
              fullWidth={isMobile}
              sx={{ mb: isMobile ? 2 : 0 }}
            >
              Back to Login
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || isSubmitting || otpLoading || dualOtpLoading}
              fullWidth={isMobile}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            >
              {loading || isSubmitting || otpLoading || dualOtpLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Sending Verification Codes...
                </>
              ) : (
                'Send Verification Codes'
              )}
            </Button>
          </Box>

          {/* Login Link */}
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" color="primary">
              Sign In
            </Link>
          </Typography>
          </Box>
        </Box>
      </Grow>

      {/* Dual OTP Verification Dialog */}
      <DualOTPVerificationModal
        open={showDualOTPDialog}
        onClose={() => setShowDualOTPDialog(false)}
        onVerify={handleDualVerification}
        onResend={handleResendDualOTPs}
        email={verificationEmail}
        phoneNumber={verificationPhone}
        emailRequestId={emailRequestId}
        mobileRequestId={mobileRequestId}
        loading={dualOtpLoading}
        error={dualOtpError}
      />

      {/* OTP Verification Dialog (Fallback for email-only) */}
      <Dialog open={showOTPDialog} onClose={() => setShowOTPDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Email OTP</DialogTitle>
        <DialogContent>
          <OTPInput
            title="Enter Registration Code"
            subtitle={`Enter the 4-digit code sent to ${otpEmail}`}
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
    </Box>
  );
};

export default Register;
