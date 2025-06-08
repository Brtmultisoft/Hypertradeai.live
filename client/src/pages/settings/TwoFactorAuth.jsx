import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  Divider,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Smartphone as SmartphoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import AuthService from '../../services/auth.service';
import OTPInput from '../../components/auth/OTPInput';
import GoogleAuthenticatorSetup from '../../components/auth/GoogleAuthenticatorSetup';

const TwoFactorAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('totp');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [showGoogleAuthSetup, setShowGoogleAuthSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [otpRequestId, setOtpRequestId] = useState('');
  const [tempToken, setTempToken] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await AuthService.getProfile();
      if (response.status) {
        setUser(response.data);
      }
    } catch (err) {
      setError(err.msg || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAToggle = async () => {
    if (!user.two_fa_enabled) {
      // Show method selection dialog
      setShowMethodDialog(true);
    } else {
      // Show disable confirmation dialog
      setShowDisableDialog(true);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.disable2FA(disablePassword);

      if (response.status) {
        setSuccess('2FA has been disabled successfully');
        setShowDisableDialog(false);
        setDisablePassword('');
        await fetchUserProfile();
      } else {
        throw new Error(response.msg || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError(err.msg || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelection = async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedMethod === 'otpless') {
        // Enable OTPless method directly
        const response = await AuthService.toggle2FAMethod('otpless');
        if (response.status) {
          setSuccess('Email OTP 2FA enabled successfully!');
          setShowMethodDialog(false);
          await fetchUserProfile();
        } else {
          throw new Error(response.msg || 'Failed to enable email OTP');
        }
      } else if (selectedMethod === 'totp') {
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

  const handleGoogleAuthComplete = async (data) => {
    setSuccess('Google Authenticator 2FA enabled successfully!');
    setShowGoogleAuthSetup(false);
    await fetchUserProfile();
  };

  const handleGoogleAuthCancel = () => {
    setShowGoogleAuthSetup(false);
  };

  const handleOTPVerification = async (otp) => {
    try {
      setLoading(true);
      
      // First verify the OTP
      const verifyResponse = await AuthService.verify2FAOTP(otp, otpRequestId, tempToken);
      
      if (verifyResponse.status) {
        // Then toggle the 2FA method
        const toggleResponse = await AuthService.toggle2FAMethod(selectedMethod);
        
        if (toggleResponse.status) {
          setSuccess(`2FA method updated to ${selectedMethod.toUpperCase()} successfully`);
          setShowOTPDialog(false);
          await fetchUserProfile();
        }
      }
    } catch (err) {
      setError(err.msg || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await AuthService.send2FAOTP(user.email, tempToken);
      if (response.status) {
        setOtpRequestId(response.data.requestId);
        setSuccess('OTP sent successfully');
      }
    } catch (err) {
      setError(err.msg || 'Failed to resend OTP');
    }
  };

  const handleMethodChange = async (newMethod) => {
    if (user.two_fa_enabled && newMethod !== user.two_fa_method) {
      try {
        setLoading(true);
        const response = await AuthService.toggle2FAMethod(newMethod);
        
        if (response.status) {
          setSuccess(`2FA method changed to ${newMethod.toUpperCase()}`);
          await fetchUserProfile();
        }
      } catch (err) {
        setError(err.msg || 'Failed to change 2FA method');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon />
        Two-Factor Authentication
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Two-Factor Authentication
            </Typography>
            <Chip
              icon={user?.two_fa_enabled ? <CheckCircleIcon /> : null}
              label={user?.two_fa_enabled ? 'Enabled' : 'Disabled'}
              color={user?.two_fa_enabled ? 'success' : 'default'}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={user?.two_fa_enabled || false}
                onChange={handle2FAToggle}
                disabled={loading}
              />
            }
            label="Enable Two-Factor Authentication"
          />

          {user?.two_fa_enabled && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Authentication Method
              </Typography>
              
              <RadioGroup
                value={user?.two_fa_method || 'totp'}
                onChange={(e) => handleMethodChange(e.target.value)}
              >
                <FormControlLabel
                  value="totp"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmartphoneIcon />
                      <Box>
                        <Typography variant="body2">Authenticator App (TOTP)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Use Google Authenticator or similar apps
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="otpless"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon />
                      <Box>
                        <Typography variant="body2">Email OTP (OTPless)</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Receive OTP codes via email
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </RadioGroup>
            </>
          )}
        </CardContent>
      </Card>

      {/* Method Selection Dialog */}
      <Dialog open={showMethodDialog} onClose={() => setShowMethodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Choose 2FA Method</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select your preferred two-factor authentication method:
          </Typography>
          
          <RadioGroup
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
          >
            <FormControlLabel
              value="totp"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartphoneIcon />
                  <Box>
                    <Typography variant="body2">Authenticator App (TOTP)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use Google Authenticator or similar apps
                    </Typography>
                  </Box>
                </Box>
              }
            />
            <FormControlLabel
              value="otpless"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon />
                  <Box>
                    <Typography variant="body2">Email OTP (OTPless)</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive OTP codes via email
                    </Typography>
                  </Box>
                </Box>
              }
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMethodDialog(false)}>Cancel</Button>
          <Button onClick={handleMethodSelection} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onClose={() => setShowOTPDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Email OTP</DialogTitle>
        <DialogContent>
          <OTPInput
            title="Enter Verification Code"
            subtitle={`Enter the 6-digit code sent to ${user?.email}`}
            length={6}
            onVerify={handleOTPVerification}
            onResend={handleResendOTP}
            loading={loading}
            error={error}
            success={success}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOTPDialog(false)}>Cancel</Button>
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
                    {showDisablePassword ? <VisibilityOff /> : <Visibility />}
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

export default TwoFactorAuth;
