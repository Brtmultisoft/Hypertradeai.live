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
  Clear as ClearIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import AuthService from '../../services/auth.service';
import OTPInput from '../../components/auth/OTPInput';
import DualOTPVerificationModal from '../../components/auth/DualOTPVerificationModal';
import { isValidEmail, isValidPhone, validatePassword } from '../../utils/validators';
// import useTawkTo from '../../hooks/useTawkTo';

const Register = () => {
  // useTawkTo();
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

  // Referral checking states
  const [referralChecking, setReferralChecking] = useState(false);
  const referralDebounceRef = useRef();

  // Get referral code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      validateReferralId(ref);
    }
    // Server will handle default admin if referral code is empty
  }, []);

  // Validate referral ID
  const validateReferralId = async (id) => {
    try {
      const result = await checkReferralId(id);
      if (result.isValid) {
        setReferralInfo(result.data);
        setReferralError('');
      } else {
        // setReferralError(result.error);
        // setReferralInfo(null);
      }
      return result; // Ensure the result is returned for debounced effect
    } catch (err) {
      console.error('Error validating referral ID:', err);
      // setReferralError('Error validating referral ID');
      // setReferralInfo(null);
      // return { isValid: false, error: 'Error validating referral ID' }; // Return error object
    }
  };

  // State for OTP settings
  const [otpSettings, setOtpSettings] = useState({
    email_otp_enabled: true,
    mobile_otp_enabled: true,
    loading: true
  });

  // Check OTP settings on component mount
  useEffect(() => {
    const checkOTPSettings = async () => {
      try {
        const response = await AuthService.checkOTPSettings();
        console.log('OTP settings response:', response);
        if (response.status && response.data) {
          setOtpSettings({
            email_otp_enabled: response.data.email_otp_enabled,
            mobile_otp_enabled: response.data.mobile_otp_enabled,
            loading: false
          });
        } else {
          // Default to enabled if can't fetch settings
          setOtpSettings({
            email_otp_enabled: true,
            mobile_otp_enabled: true,
            loading: false
          });
        }
        console.log('OTP settings:', otpSettings);
      } catch (error) {
        console.log('Could not fetch OTP settings, defaulting to enabled');
        setOtpSettings({
          email_otp_enabled: true,
          mobile_otp_enabled: true,
          loading: false
        });
      }
    };

    checkOTPSettings();
  }, []);

  // Dynamic form validation rules based on OTP settings
  const getValidationRules = () => {
    const isOTPDisabled = !otpSettings.email_otp_enabled && !otpSettings.mobile_otp_enabled;

    return {
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
        required: true, // Password always required
        requiredMessage: 'Password is required',
        validate: (value) => {
          const result = validatePassword(value);
          return !result.isValid ? result.message : null;
        },
      },
    };
  };

  // Debounced real-time referral validation
  useEffect(() => {
    if (!referralCode) {
      setReferralError('');
      setReferralInfo(null);
      setReferralChecking(false);
      return;
    }
    setReferralChecking(true);
    if (referralDebounceRef.current) clearTimeout(referralDebounceRef.current);
    const codeToCheck = referralCode; // capture current value
    referralDebounceRef.current = setTimeout(async () => {
      try {
        const result = await validateReferralId(codeToCheck);
        // Only update if the value hasn't changed since the call started
        if (referralCode === codeToCheck) {
          if (result?.isValid) {
            setReferralInfo(result.data);
            setReferralError('');
          } else {
            setReferralError(result?.error || 'Invalid referral ID');
            setReferralInfo(null);
          }
        }
      } catch (err) {
        if (referralCode === codeToCheck) {
          setReferralError('Error validating referral ID');
          setReferralInfo(null);
        }
      } finally {
        if (referralCode === codeToCheck) setReferralChecking(false);
      }
    }, 500);
    return () => clearTimeout(referralDebounceRef.current);
  }, [referralCode]);

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
        // Check if OTP is disabled
        if (response.data && response.data.otp_disabled) {
          console.log('OTP is disabled, proceeding with direct registration');
          await handleDirectRegistration(userData, email, phone);
          return;
        }

        // Check if only email OTP (mobile disabled)
        if (response.data && response.data.email_only) {
          console.log('Only email OTP enabled, switching to email-only flow');
          await handleOTPRegistration(userData);
          return;
        }

        // Check if only mobile OTP (email disabled)
        if (response.data && response.data.mobile_only) {
          console.log('Only mobile OTP enabled, switching to mobile-only flow');
          await handleMobileOTPRegistration(userData, phone);
          return;
        }

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

      // Check if error indicates OTP is disabled
      if (err.data && err.data.otp_disabled) {
        console.log('OTP is disabled (from error), proceeding with direct registration');
        await handleDirectRegistration(userData, email, phone);
        return;
      }

      setDualOtpError(err.msg || err.message || 'Failed to send verification codes');
    } finally {
      setDualOtpLoading(false);
    }
  };

  // Direct registration when OTP is disabled
  const handleDirectRegistration = async (userData, email, phone) => {
    try {
      console.log('Performing direct registration without OTP verification');

      const response = await AuthService.registerWithoutOTP(email, phone, userData);

      console.log('Direct registration response:', response);

      if (response.status) {
        // Store registration data for success dialog
        setRegistrationData({
          name: userData.name,
          username: userData.username || response.data.username,
          email: email,
          password: userData.password, // User provided password
          sponsorID: response.data.sponsorID,
        });

        // Show success dialog
        setOpenSuccessDialog(true);
        setSuccessMessage('Registration successful! OTP verification was skipped as it is currently disabled.');
        setShowSuccessAlert(true);
        resetForm();
      } else {
        console.error('Direct registration failed:', response);
        setDualOtpError(response.msg || 'Registration failed');
      }
    } catch (err) {
      console.error('Error in direct registration:', err);
      setDualOtpError(err.msg || err.message || 'Registration failed');
    }
  };

  // OTP registration functions (fallback for email-only)
  const handleOTPRegistration = async (userData) => {
    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('Sending registration OTP for:', userData.email);
      console.log('Full userData:', userData);

      // Validate email exists
      if (!userData.email) {
        console.error('Email is missing from userData:', userData);
        setOtpError('Email is required for OTP registration');
        return;
      }

      // Add phone_number to userData for email-only registration
      const userDataWithPhone = {
        ...userData,
        phone_number: values.phone // Add phone from form values
      };

      console.log('UserData with phone:', userDataWithPhone);

      const response = await AuthService.sendRegistrationOTP(userData.email);

      console.log('Registration OTP response:', response);

      if (response.status) {
        // Check if OTP is disabled
        if (response.data && response.data.otp_disabled) {
          console.log('Email OTP is disabled, proceeding with direct registration');
          await handleDirectRegistration(userDataWithPhone, userData.email, values.phone);
          return;
        }

        setOtpRequestId(response.data.requestId);
        setOtpEmail(userData.email);
        setPendingUserData(userDataWithPhone); // Store userData with phone
        setShowOTPDialog(true);
        setSuccessMessage('OTP sent to your email successfully!');
        setShowSuccessAlert(true);
      } else {
        console.error('Failed to send OTP:', response);
        setOtpError(response.msg || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error sending registration OTP:', err);

      // Check if error indicates OTP is disabled
      if (err.data && err.data.otp_disabled) {
        console.log('Email OTP is disabled (from error), proceeding with direct registration');
        const userDataWithPhone = {
          ...userData,
          phone_number: values.phone
        };
        await handleDirectRegistration(userDataWithPhone, userData.email, values.phone);
        return;
      }

      setOtpError(err.msg || err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Mobile OTP registration function (for mobile-only)
  const handleMobileOTPRegistration = async (userData, phoneNumber) => {
    try {
      setOtpLoading(true);
      setOtpError(null);

      console.log('Sending mobile registration OTP for:', phoneNumber);

      const response = await AuthService.sendMobileRegistrationOTP(phoneNumber);

      console.log('Mobile registration OTP response:', response);

      if (response.status) {
        // Check if OTP is disabled
        if (response.data && response.data.otp_disabled) {
          console.log('Mobile OTP is disabled, proceeding with direct registration');
          await handleDirectRegistration(userData, userData.email, phoneNumber);
          return;
        }

        setOtpRequestId(response.data.requestId);
        setOtpEmail(phoneNumber); // Use phone as identifier
        setPendingUserData(userData);
        setShowOTPDialog(true);
        setSuccessMessage('OTP sent to your mobile successfully!');
        setShowSuccessAlert(true);
      } else {
        console.error('Failed to send mobile OTP:', response);
        setOtpError(response.msg || 'Failed to send mobile OTP');
      }
    } catch (err) {
      console.error('Error sending mobile registration OTP:', err);

      // Check if error indicates OTP is disabled
      if (err.data && err.data.otp_disabled) {
        console.log('Mobile OTP is disabled (from error), proceeding with direct registration');
        await handleDirectRegistration(userData, userData.email, phoneNumber);
        return;
      }

      setOtpError(err.msg || err.message || 'Failed to send mobile OTP');
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
        identifier: otpEmail, // Could be email or phone
        otp: otp,
        requestId: otpRequestId,
        hasUserData: !!pendingUserData
      });

      let response;

      // Check if otpEmail is actually a phone number (mobile OTP)
      if (otpEmail && otpEmail.startsWith('+')) {
        // Mobile OTP verification
        response = await AuthService.verifyMobileRegistrationOTP(
          otpEmail, // phone number
          otp,
          otpRequestId
        );

        // If mobile OTP verified, create user directly
        if (response.status) {
          const userCreationResponse = await AuthService.registerWithoutOTP(
            pendingUserData.email,
            otpEmail, // phone number
            pendingUserData
          );

          if (userCreationResponse.status) {
            response.data = userCreationResponse.data;
          } else {
            throw userCreationResponse;
          }
        }
      } else {
        // Email OTP verification
        response = await AuthService.verifyRegistrationOTP(
          otpEmail,
          otp,
          otpRequestId,
          pendingUserData
        );
      }

      console.log('Registration OTP verification response:', response);

      if (response.status) {
        // Store registration data for success dialog
        setRegistrationData({
          name: pendingUserData.name,
          username: pendingUserData.username || response.data.username,
          email: pendingUserData.email, // Use actual email from userData
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
    setSuccessMessage('Copied to clipboard!');
    setShowSuccessAlert(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle success dialog close
  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    // Navigate to login with prefilled data
    navigate('/login', {
      state: {
        prefillEmail: registrationData?.email,
        prefillPassword: registrationData?.password,
        fromRegistration: true
      }
    });
  };

  // Custom handleChange function to handle referral code and other form fields
  const customHandleChange = (e) => {
    const { name, value } = e.target;

    // If referralCode is being changed, update referralCode state and clear error
    if (name === 'referralCode') {
      setReferralCode(value);
      setReferralError('');
      setReferralInfo(null);
      return; // Don't call handleChange for referralCode as it's not part of form values
    }

    // Call the original handleChange function for other form fields
    handleChange(e);
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
    setFieldValue,
  } = useForm(
    {
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
    },
    getValidationRules(), // Use dynamic validation rules
    async (formValues) => {
      if (referralChecking) {
        setShowSuccessAlert(true);
        setSuccessMessage('Please wait for referral validation to complete.');
        return;
      }
      if (referralError) {
        setShowSuccessAlert(true);
        setSuccessMessage('Invalid referral ID. Please use a valid referral ID.');
        return;
      }
      try {
        // Check referral ID validity first
        if (referralError) {
          setShowSuccessAlert(true);
          setSuccessMessage(' referral ID. Please use a valid referral ID.');
          return;
        }

        // If referral code is provided, it must be valid
        if (referralCode && referralError) {
          setShowSuccessAlert(true);
          setSuccessMessage('Invalid referral ID. Please use a valid referral ID or leave it empty.');
          return;
        }

        // Check if both OTPs are disabled
        const isOTPDisabled = !otpSettings.email_otp_enabled && !otpSettings.mobile_otp_enabled;

        // Check if only email OTP is enabled (mobile disabled)
        const isEmailOnlyOTP = otpSettings.email_otp_enabled && !otpSettings.mobile_otp_enabled;

        // Check if only mobile OTP is enabled (email disabled)
        const isMobileOnlyOTP = !otpSettings.email_otp_enabled && otpSettings.mobile_otp_enabled;

        // Proceed with registration
        const { phone, email, ...userData } = formValues;

        const finalUserData = {
          ...userData,
          email: email, // Add email back to userData
          phone_number: phone, // Add phone_number for consistency
          password: userData.password, // User must provide password
          referralId: referralCode || '', // Backend will handle default admin if empty
        };

        console.log('Final user data being sent:', finalUserData);
        console.log('OTP disabled status:', isOTPDisabled);

        if (isOTPDisabled) {
          // Direct registration without OTP
          await handleDirectRegistration(finalUserData, email, phone);
        } else if (isEmailOnlyOTP) {
          // Use email-only OTP registration
          console.log('Calling handleOTPRegistration with:', finalUserData);
          await handleOTPRegistration(finalUserData);
        } else if (isMobileOnlyOTP) {
          // Use mobile-only OTP registration
          await handleMobileOTPRegistration(finalUserData, phone);
        } else {
          // Use dual verification (email + mobile) for registration
          await handleDualVerificationRegistration(finalUserData, email, phone);
        }
      } catch (err) {
        console.error('Registration error:', err);
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  );

  // Generate random password when OTP is disabled
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

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
              <Typography variant="body2" fontWeight="bold">Email:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">{registrationData?.email}</Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyToClipboard(registrationData?.email)}
                  sx={{ ml: 1 }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

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
            label="Referral ID (Optional)"
            name="referralCode"
            value={referralCode}
            onChange={customHandleChange}
            onBlur={() => validateReferralId(referralCode)}
            error={!!referralError}
            helperText={
              referralError
                ? referralError
                : referralInfo && (referralInfo.name || referralInfo.username || referralInfo.sponsorID)
                  ? `✓ Referrer: ${referralInfo.name || referralInfo.username || referralInfo.sponsorID}`
                  : referralChecking
                    ? 'Checking referral ID...'
                    : null
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
              endAdornment: referralChecking ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : referralCode ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear referral code"
                    onClick={() => {
                      setReferralCode('');
                      setReferralError('');
                      setReferralInfo(null);
                    }}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            fullWidth
            margin="normal"
            placeholder="Enter referral ID or leave empty"
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
              fullWidth
              size="large"
              sx={{ mt: 2, mb: 1 }}
              disabled={isSubmitting || referralChecking}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Register'}
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

      {/* OTP Verification Dialog (For email-only or mobile-only) */}
      <Dialog open={showOTPDialog} onClose={() => setShowOTPDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {otpEmail && otpEmail.startsWith('+') ? 'Verify Mobile OTP' : 'Verify Email OTP'}
        </DialogTitle>
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
