import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const OTPInput = ({
  title = 'Enter OTP',
  subtitle = 'Please enter the OTP sent to your email',
  length = 4,
  onVerify,
  onResend,
  loading = false,
  error = null,
  success = null,
  autoFocus = true,
  disabled = false,
  resendCooldown = 60, // seconds
}) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Resend timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(timer => timer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // Focus previous input if current is empty
        inputRefs.current[index - 1].focus();
      } else {
        // Clear current input
        setOtp([...otp.map((d, idx) => (idx === index ? '' : d))]);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const pasteArray = pasteData.slice(0, length).split('');
    
    if (pasteArray.every(char => !isNaN(char))) {
      const newOtp = [...otp];
      pasteArray.forEach((char, index) => {
        if (index < length) {
          newOtp[index] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    if (otpValue.length === length && onVerify) {
      onVerify(otpValue);
    }
  };

  const handleResend = () => {
    if (onResend && resendTimer === 0) {
      setResendTimer(resendCooldown);
      setOtp(new Array(length).fill(''));
      onResend();
      // Focus first input after resend
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const isComplete = otp.every(digit => digit !== '');
  const otpValue = otp.join('');

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <SecurityIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
        {otp.map((data, index) => (
          <TextField
            key={index}
            inputRef={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            value={data}
            onChange={e => handleChange(e.target, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled || loading}
            sx={{
              width: 56,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: data ? 'primary.main' : 'grey.300',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              },
            }}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={handleVerify}
          disabled={!isComplete || loading || disabled}
          sx={{ py: 1.5 }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Verifying...
            </>
          ) : (
            'Verify OTP'
          )}
        </Button>

        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={handleResend}
          disabled={resendTimer > 0 || loading || disabled}
          startIcon={<RefreshIcon />}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
        Didn't receive the code? Check your spam folder or try resending.
      </Typography>
    </Paper>
  );
};

export default OTPInput;
