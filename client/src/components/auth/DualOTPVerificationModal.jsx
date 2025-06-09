import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  IconButton,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import OTPInput from './OTPInput';

const DualOTPVerificationModal = ({
  open,
  onClose,
  onVerify,
  onResend,
  email,
  phoneNumber,
  emailRequestId,
  mobileRequestId,
  loading = false,
  error = null,
}) => {
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');
  const [mobileOtpError, setMobileOtpError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Reset states when modal opens
  useEffect(() => {
    if (open) {
      setEmailOtp('');
      setMobileOtp('');
      setEmailOtpError('');
      setMobileOtpError('');
      setEmailVerified(false);
      setMobileVerified(false);
      setCountdown(60); // Start 60 second countdown for resend
    }
  }, [open]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Validate OTP format
  const validateOTP = (otp) => {
    return otp && otp.length === 4 && /^\d{4}$/.test(otp);
  };

  // Handle email OTP change
  const handleEmailOtpChange = (value) => {
    setEmailOtp(value);
    if (emailOtpError) setEmailOtpError('');
    
    // Auto-validate when 4 digits are entered
    if (value.length === 4) {
      if (!validateOTP(value)) {
        setEmailOtpError('Please enter a valid 4-digit code');
      }
    }
  };

  // Handle mobile OTP change
  const handleMobileOtpChange = (value) => {
    setMobileOtp(value);
    if (mobileOtpError) setMobileOtpError('');
    
    // Auto-validate when 4 digits are entered
    if (value.length === 4) {
      if (!validateOTP(value)) {
        setMobileOtpError('Please enter a valid 4-digit code');
      }
    }
  };

  // Handle verification
  const handleVerify = () => {
    let hasError = false;

    // Validate email OTP
    if (!validateOTP(emailOtp)) {
      setEmailOtpError('Please enter a valid 4-digit email code');
      hasError = true;
    }

    // Validate mobile OTP
    if (!validateOTP(mobileOtp)) {
      setMobileOtpError('Please enter a valid 4-digit mobile code');
      hasError = true;
    }

    if (!hasError) {
      onVerify({
        emailOtp,
        mobileOtp,
        emailRequestId,
        mobileRequestId,
      });
    }
  };

  // Handle resend
  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResend();
      setCountdown(60); // Reset countdown
    } catch (err) {
      console.error('Resend failed:', err);
    } finally {
      setResendLoading(false);
    }
  };

  // Check if both OTPs are valid
  const canVerify = validateOTP(emailOtp) && validateOTP(mobileOtp) && !loading;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          Verify Email & Mobile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Enter the verification codes sent to your email and mobile number
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Email Verification Section */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmailIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Email Verification
            </Typography>
            {emailVerified && (
              <Zoom in={emailVerified}>
                <CheckCircleIcon color="success" sx={{ ml: 'auto' }} />
              </Zoom>
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Code sent to: <strong>{email}</strong>
          </Typography>

          <TextField
            label="Email OTP"
            value={emailOtp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              if (value.length <= 4) {
                handleEmailOtpChange(value);
              }
            }}
            error={Boolean(emailOtpError)}
            helperText={emailOtpError}
            fullWidth
            inputProps={{
              maxLength: 4,
              pattern: '[0-9]*',
              inputMode: 'numeric',
            }}
            placeholder="Enter 4-digit code"
            sx={{ mb: 1 }}
          />
        </Paper>

        {/* Mobile Verification Section */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PhoneIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              Mobile Verification
            </Typography>
            {mobileVerified && (
              <Zoom in={mobileVerified}>
                <CheckCircleIcon color="success" sx={{ ml: 'auto' }} />
              </Zoom>
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Code sent to: <strong>{phoneNumber}</strong>
          </Typography>

          <TextField
            label="Mobile OTP"
            value={mobileOtp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              if (value.length <= 4) {
                handleMobileOtpChange(value);
              }
            }}
            error={Boolean(mobileOtpError)}
            helperText={mobileOtpError}
            fullWidth
            inputProps={{
              maxLength: 4,
              pattern: '[0-9]*',
              inputMode: 'numeric',
            }}
            placeholder="Enter 4-digit code"
            sx={{ mb: 1 }}
          />
        </Paper>

        {/* Resend Section */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Didn't receive the codes?
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResend}
            disabled={countdown > 0 || resendLoading}
            startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Codes'}
          </Button>
        </Box>

        {/* Status Chips */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Chip
            icon={<EmailIcon />}
            label={emailVerified ? 'Email Verified' : 'Email Pending'}
            color={emailVerified ? 'success' : 'default'}
            variant={emailVerified ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<PhoneIcon />}
            label={mobileVerified ? 'Mobile Verified' : 'Mobile Pending'}
            color={mobileVerified ? 'success' : 'default'}
            variant={mobileVerified ? 'filled' : 'outlined'}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={!canVerify}
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
              Verifying...
            </>
          ) : (
            'Verify & Register'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DualOTPVerificationModal;
