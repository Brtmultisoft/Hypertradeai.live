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
import { isValidEmail, isValidPhone, validatePassword } from '../../utils/validators';

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { register, loading, error, checkReferralId } = useAuth();
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

        // Proceed with registration
        const { confirmPassword, ...userData } = formValues;
        const result = await register({
          ...userData,
          referrer: referralCode,
        });

        if (result.success) {
          // Store registration data for success dialog
          setRegistrationData({
            name: formValues.name,
            username: formValues.username,
            email: formValues.email,
            password: formValues.password,
            referrer: referralCode,
          });

          // Show success dialog
          setOpenSuccessDialog(true);
          resetForm();
        } else {
          // Show error message from server
          setError(result.error || 'Registration failed. Please try again.');
        }
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
              <Typography variant="body2" fontWeight="bold">Sponsor ID:</Typography>
              <Typography variant="body2">{registrationData?.referrer}</Typography>
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
              disabled={loading || isSubmitting}
              fullWidth={isMobile}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            >
              {loading || isSubmitting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
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
    </Box>
  );
};

export default Register;
