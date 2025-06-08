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
  Card,
  useTheme,
  Snackbar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Email as EmailIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Smartphone as SmartphoneIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import AuthService from '../../services/auth.service';
import useAuth from '../../hooks/useAuth';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import OTPInput from '../auth/OTPInput';
import GoogleAuthenticatorSetup from '../auth/GoogleAuthenticatorSetup';

const SecuritySettings = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const { userData, fetchUserData } = useData();
  const { user } = useAuth();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState('otpless');
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [showGoogleAuthSetup, setShowGoogleAuthSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Initialize 2FA status from user data
  useEffect(() => {
    if (userData) {
      console.log('SecuritySettings: userData updated', {
        two_fa_enabled: userData.two_fa_enabled,
        two_fa_method: userData.two_fa_method
      });
      setIs2FAEnabled(userData.two_fa_enabled || false);
      setTwoFAMethod(userData.two_fa_method || 'otpless');
    }
  }, [userData]);

  // Handle 2FA toggle
  const handle2FAToggle = async (event) => {
    const newValue = event.target.checked;

    if (newValue) {
      // Show method selection dialog when enabling 2FA
      setShowMethodDialog(true);
    } else {
      // Show disable confirmation dialog when disabling 2FA
      setShowDisableDialog(true);
    }
  };

  // Handle method selection
  const handleMethodSelection = async (method) => {
    try {
      setLoading(true);
      setError(null);

      if (method === 'otpless') {
        // Enable email OTP method directly
        const response = await AuthService.toggle2FAMethod('otpless');
        if (response.status) {
          setSuccess('Email OTP 2FA enabled successfully!');
          setShowSuccessAlert(true);
          setShowMethodDialog(false);
          await fetchUserData();
        } else {
          throw new Error(response.msg || 'Failed to enable email OTP');
        }
      } else if (method === 'totp') {
        // Show Google Authenticator setup
        setShowMethodDialog(false);
        setShowGoogleAuthSetup(true);
      }
    } catch (err) {
      setError(err.msg || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Authenticator setup completion
  const handleGoogleAuthComplete = async (data) => {
    setSuccess('Google Authenticator 2FA enabled successfully!');
    setShowSuccessAlert(true);
    setShowGoogleAuthSetup(false);
    await fetchUserData();
  };

  // Handle Google Authenticator setup cancellation
  const handleGoogleAuthCancel = () => {
    setShowGoogleAuthSetup(false);
  };

  // Handle 2FA disable
  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.disable2FA(disablePassword);

      if (response.status) {
        setSuccess('2FA has been disabled successfully');
        setShowSuccessAlert(true);
        setShowDisableDialog(false);
        setDisablePassword('');
        await fetchUserData();
      } else {
        throw new Error(response.msg || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError(err.msg || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Handle method change for already enabled 2FA
  const handleMethodChange = async (newMethod) => {
    if (newMethod === twoFAMethod) return; // No change needed

    try {
      setLoading(true);
      setError(null);

      if (newMethod === 'otpless') {
        // Switch to email OTP
        const response = await AuthService.toggle2FAMethod('otpless');
        if (response.status) {
          setSuccess('Switched to Email OTP successfully!');
          setShowSuccessAlert(true);
          await fetchUserData();
        }
      } else {
        // Switch to Google Authenticator - show setup
        setShowGoogleAuthSetup(true);
      }
    } catch (err) {
      setError(err.msg || 'Failed to change 2FA method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Snackbar
        open={showSuccessAlert}
        autoHideDuration={6000}
        onClose={() => setShowSuccessAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccessAlert(false)} severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
          Two-factor authentication adds an extra layer of security to your account. Choose between Google Authenticator app or email-based verification.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              {is2FAEnabled ? (
                <>
                  <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                  Enabled
                  {twoFAMethod === 'totp' ? (
                    <SmartphoneIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                  ) : (
                    <EmailIcon sx={{ ml: 1, fontSize: 16, color: 'text.secondary' }} />
                  )}
                </>
              ) : (
                <>
                  <CloseIcon color="error" sx={{ mr: 1, fontSize: 20 }} />
                  Disabled
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {is2FAEnabled
                ? `Protected with ${twoFAMethod === 'totp' ? 'Google Authenticator' : 'Email OTP'}`
                : 'Enable two-factor authentication for enhanced security'}
            </Typography>
          </Box>

          <Switch
            checked={Boolean(is2FAEnabled)}
            onChange={handle2FAToggle}
            color="primary"
            disabled={loading}
          />
        </Box>

        {/* Method Selection for Enabled 2FA */}
        {is2FAEnabled && (
          <Box sx={{ mt: 3, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Authentication Method
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant={twoFAMethod === 'totp' ? 'contained' : 'outlined'}
                startIcon={<SmartphoneIcon />}
                onClick={() => handleMethodChange('totp')}
                disabled={loading}
                sx={{ flex: 1, minWidth: 200 }}
              >
                Google Authenticator
              </Button>

              <Button
                variant={twoFAMethod === 'otpless' ? 'contained' : 'outlined'}
                startIcon={<EmailIcon />}
                onClick={() => handleMethodChange('otpless')}
                disabled={loading}
                sx={{ flex: 1, minWidth: 200 }}
              >
                Email OTP
              </Button>
            </Box>
          </Box>
        )}

        {/* Info Box */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.white">
            🔐 <strong>How it works:</strong>
            {is2FAEnabled ? (
              twoFAMethod === 'totp'
                ? ' You\'ll enter a 6-digit code from your Google Authenticator app each time you log in.'
                : ' You\'ll receive a 6-digit verification code via email each time you log in.'
            ) : (
              ' When 2FA is enabled, you\'ll need to verify your identity with a second factor during login.'
            )}
          </Typography>
        </Box>
      </Paper>

      {/* Method Selection Dialog */}
      <Dialog open={showMethodDialog} onClose={() => setShowMethodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Choose 2FA Method</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select your preferred two-factor authentication method:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card
              variant="outlined"
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => handleMethodSelection('totp')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SmartphoneIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Google Authenticator (Recommended)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use an authenticator app for offline, secure verification codes
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card
              variant="outlined"
              sx={{
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => handleMethodSelection('otpless')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmailIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Email OTP
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive verification codes via email
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMethodDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Google Authenticator Setup Dialog */}
      <Dialog
        open={showGoogleAuthSetup}
        onClose={() => setShowGoogleAuthSetup(false)}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogContent sx={{ p: 0 }}>
          <GoogleAuthenticatorSetup
            onComplete={handleGoogleAuthComplete}
            onCancel={handleGoogleAuthCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onClose={() => setShowDisableDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            To disable 2FA, please enter your account password for security verification.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Password"
            type={showDisablePassword ? 'text' : 'password'}
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    edge="end"
                  >
                    {showDisablePassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowDisableDialog(false);
            setDisablePassword('');
            setError(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleDisable2FA}
            variant="contained"
            color="error"
            disabled={loading || !disablePassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default SecuritySettings;
