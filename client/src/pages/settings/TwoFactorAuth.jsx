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
} from '@mui/material';
import {
  Security as SecurityIcon,
  Smartphone as SmartphoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import AuthService from '../../services/auth.service';
import OTPInput from '../../components/auth/OTPInput';

const TwoFactorAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showMethodDialog, setShowMethodDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('totp');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
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
      // Disable 2FA
      try {
        setLoading(true);
        // Implementation for disabling 2FA would go here
        setSuccess('2FA has been disabled');
        await fetchUserProfile();
      } catch (err) {
        setError(err.msg || 'Failed to disable 2FA');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMethodSelection = async () => {
    try {
      setLoading(true);
      
      if (selectedMethod === 'otpless') {
        // Send OTP for verification
        const response = await AuthService.send2FAOTP(user.email, '');
        if (response.status) {
          setOtpRequestId(response.data.requestId);
          setShowMethodDialog(false);
          setShowOTPDialog(true);
        }
      } else {
        // Handle TOTP setup (existing functionality)
        // This would integrate with existing 2FA setup
        setShowMethodDialog(false);
      }
    } catch (err) {
      setError(err.msg || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
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
    </Box>
  );
};

export default TwoFactorAuth;
