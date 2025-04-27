import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Switch,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  QrCode as QrCodeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import UserService from '../../services/user.service';
import useApi from '../../hooks/useApi';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';

const SecuritySettings = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const { userData, fetchUserData } = useData();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [secret, setSecret] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Initialize 2FA status from user data
  useEffect(() => {
    if (userData) {
      setIs2FAEnabled(userData.two_fa_enabled || false);
    }
  }, [userData]);

  // API hook for generating 2FA secret
  const {
    loading: generatingSecret,
    error: generateSecretError,
    execute: generate2FASecret,
  } = useApi(async () => {
    const response = await UserService.generate2FASecret();

    if (response.status && response.result) {
      setQRCodeData(response.result.qrImageDataUrl);
      setSecret(response.result.secret);
      setShowQRCode(true);
    }

    return response;
  }, false);

  // API hook for verifying OTP
  const {
    loading: verifyingOTP,
    error: verifyOTPError,
    execute: verifyOTP,
  } = useApi(async () => {
    const response = await UserService.verifyOTP({ token: otpCode });

    if (response.status) {
      setSuccess('Two-factor authentication enabled successfully');
      setShowQRCode(false);
      setOtpCode('');
      setIs2FAEnabled(true);
      fetchUserData();
    }

    return response;
  }, false);

  // API hook for disabling 2FA
  const {
    loading: disabling2FA,
    error: disable2FAError,
    execute: disable2FA,
  } = useApi(async () => {
    const response = await UserService.disable2FA({ token: otpCode });

    if (response.status) {
      setSuccess('Two-factor authentication disabled successfully');
      setOtpCode('');
      setIs2FAEnabled(false);
      fetchUserData();
    }

    return response;
  }, false);

  // Handle 2FA toggle
  const handle2FAToggle = async () => {
    setError(null);
    setSuccess(null);

    if (!is2FAEnabled) {
      // Enable 2FA
      try {
        await generate2FASecret();
      } catch (err) {
        setError(err.message || 'Failed to generate 2FA secret');
      }
    } else {
      // Show dialog to disable 2FA
      setShowQRCode(true);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    setError(null);
    setSuccess(null);

    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }

    try {
      if (!is2FAEnabled) {
        await verifyOTP();
      } else {
        await disable2FA();
      }
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
    }
  };

  // Close QR code dialog
  const handleCloseQRCode = () => {
    setShowQRCode(false);
    setOtpCode('');
    setError(null);
  };

  return (
    <Box>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {(error || generateSecretError || verifyOTPError || disable2FAError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || generateSecretError || verifyOTPError || disable2FAError}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Two-Factor Authentication (2FA)</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Two-factor authentication adds an extra layer of security to your account. When enabled, you'll need to enter a code from your authenticator app in addition to your password when logging in.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          <Box>
            <Typography variant="subtitle1">
              {is2FAEnabled ? 'Enabled' : 'Disabled'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {is2FAEnabled
                ? 'Your account is protected with two-factor authentication'
                : 'Enable two-factor authentication for enhanced security'}
            </Typography>
          </Box>

          <Switch
            checked={is2FAEnabled}
            onChange={handle2FAToggle}
            color="primary"
            disabled={generatingSecret || verifyingOTP || disabling2FA}
          />
        </Box>
      </Paper>

      {/* QR Code Dialog */}
      <Dialog
        open={showQRCode}
        onClose={handleCloseQRCode}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {is2FAEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
        </DialogTitle>

        <DialogContent>
          {!is2FAEnabled && qrCodeData && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <img src={qrCodeData} alt="QR Code" style={{ width: 200, height: 200 }} />
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                If you can't scan the QR code, you can manually enter this secret key in your authenticator app:
              </Typography>

              <TextField
                fullWidth
                value={secret}
                variant="outlined"
                InputProps={{
                  readOnly: true,
                }}
                sx={{ mb: 3 }}
              />
            </>
          )}

          {is2FAEnabled && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              To disable two-factor authentication, please enter the verification code from your authenticator app.
            </Typography>
          )}

          <TextField
            fullWidth
            label="Verification Code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            variant="outlined"
            placeholder="Enter 6-digit code"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCloseQRCode}
            startIcon={<CloseIcon />}
            disabled={verifyingOTP || disabling2FA}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={is2FAEnabled ? 'error' : 'primary'}
            onClick={handleVerifyOTP}
            startIcon={(verifyingOTP || disabling2FA) ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            disabled={verifyingOTP || disabling2FA}
          >
            {is2FAEnabled
              ? (disabling2FA ? 'Disabling...' : 'Disable 2FA')
              : (verifyingOTP ? 'Verifying...' : 'Verify & Enable')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettings;
