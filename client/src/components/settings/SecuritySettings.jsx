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
  Snackbar,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Email as EmailIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import AuthService from '../../services/auth.service';
import useAuth from '../../hooks/useAuth';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import OTPInput from '../auth/OTPInput';

const SecuritySettings = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const { userData, fetchUserData } = useData();
  const { user } = useAuth();

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Initialize 2FA status from user data
  useEffect(() => {
    if (userData) {
      console.log('SecuritySettings: userData updated', { two_fa_enabled: userData.two_fa_enabled });
      setIs2FAEnabled(userData.two_fa_enabled || false);
    }
  }, [userData]);

  // Handle 2FA enable
  const enable2FA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.toggle2FAMethod('otpless');

      if (response.status) {
        setSuccess('Two-factor authentication enabled successfully! You will now receive OTP codes via email during login.');
        setShowSuccessAlert(true);
        fetchUserData();
      } else {
        throw new Error(response.msg || 'Failed to enable 2FA');
      }
    } catch (err) {
      throw err; // Re-throw to be caught by toggle handler
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA disable
  const disable2FA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.toggle2FAMethod('totp');

      if (response.status) {
        setSuccess('Two-factor authentication disabled successfully');
        setShowSuccessAlert(true);
        fetchUserData();
      } else {
        throw new Error(response.msg || 'Failed to disable 2FA');
      }
    } catch (err) {
      throw err; // Re-throw to be caught by toggle handler
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA toggle
  const handle2FAToggle = async (event) => {
    const newValue = event.target.checked;
    const currentValue = is2FAEnabled;

    setError(null);
    setSuccess(null);

    // Optimistically update the UI
    setIs2FAEnabled(newValue);

    try {
      if (newValue) {
        // Enable 2FA
        await enable2FA();
      } else {
        // Disable 2FA
        await disable2FA();
      }
    } catch (err) {
      // Revert the toggle if API call fails
      setIs2FAEnabled(currentValue);
      setError(err.msg || err.message || 'Failed to update 2FA setting');
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
          Two-factor authentication adds an extra layer of security to your account. When enabled, you'll receive a verification code via email during login.
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
              {is2FAEnabled ? (
                <>
                  <CheckIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                  Enabled
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
                ? 'Your account is protected with email-based two-factor authentication'
                : 'Enable two-factor authentication for enhanced security'}
            </Typography>
          </Box>

          <Switch
            checked={Boolean(is2FAEnabled)}
            onChange={handle2FAToggle}
            color="primary"
            disabled={loading}
            inputProps={{ 'aria-label': '2FA toggle' }}
          />
        </Box>

        {/* Info Box */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            🔐 <strong>How it works:</strong> When 2FA is enabled, you'll receive a 6-digit verification code via email each time you log in. This adds an extra layer of security to protect your account.
          </Typography>
        </Box>
      </Paper>

    </Box>
  );
};

export default SecuritySettings;
