import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Smartphone as SmartphoneIcon,
  Security as SecurityIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import AuthService from '../../services/auth.service';
import OTPInput from './OTPInput';

const GoogleAuthenticatorSetup = ({ onComplete, onCancel }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const steps = [
    {
      label: 'Install Authenticator App',
      description: 'Download and install Google Authenticator or similar app',
    },
    {
      label: 'Scan QR Code',
      description: 'Scan the QR code with your authenticator app',
    },
    {
      label: 'Verify Setup',
      description: 'Enter the 6-digit code from your app to complete setup',
    },
  ];

  // Generate 2FA secret and QR code
  const generateSecret = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.generate2FASecret();
      
      if (response.status) {
        setQrData(response.data);
        setActiveStep(1); // Move to QR code step
        setSuccess('QR code generated successfully!');
      } else {
        throw new Error(response.msg || 'Failed to generate QR code');
      }
    } catch (err) {
      setError(err.msg || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  // Verify TOTP code
  const verifyCode = async (code) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AuthService.verifyTOTP(code);
      
      if (response.status) {
        setSuccess('Google Authenticator setup completed successfully!');
        setActiveStep(2);
        
        // Call onComplete callback after a short delay
        setTimeout(() => {
          onComplete && onComplete(response.data);
        }, 2000);
      } else {
        throw new Error(response.msg || 'Invalid verification code');
      }
    } catch (err) {
      setError(err.msg || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    });
  };

  // Start setup process
  useEffect(() => {
    generateSecret();
  }, []);

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              First, you'll need to install an authenticator app on your mobile device:
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Card variant="outlined" sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                <SmartphoneIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Google Authenticator
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recommended
                </Typography>
              </Card>
              
              <Card variant="outlined" sx={{ flex: 1, textAlign: 'center', p: 2 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Authy
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Alternative
                </Typography>
              </Card>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Download from your device's app store (Google Play Store or Apple App Store)
            </Alert>

            <Button
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={loading}
              fullWidth
            >
              I've Installed the App
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            {qrData ? (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Scan this QR code with your authenticator app:
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    {qrData.qrImageDataUrl ? (
                      <img
                        src={qrData.qrImageDataUrl}
                        alt="QR Code for Google Authenticator"
                        style={{ width: 200, height: 200 }}
                      />
                    ) : qrData.otpauth_url ? (
                      <QRCodeSVG
                        value={qrData.otpauth_url}
                        size={200}
                        level="M"
                        includeMargin={true}
                      />
                    ) : (
                      <Typography color="error">Failed to generate QR code</Typography>
                    )}
                  </Card>
                </Box>

                <Divider sx={{ my: 2 }}>
                  <Chip label="OR" size="small" />
                </Divider>

                <Button
                  variant="outlined"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Enter Code Manually
                </Button>

                {showManualEntry && (
                  <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Manual Entry Details:
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Account Name:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {qrData.account_name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(qrData.account_name)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Secret Key:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {qrData.manual_entry_key}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(qrData.manual_entry_key)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        App Name:
                      </Typography>
                      <Typography variant="body2">
                        {qrData.app_name}
                      </Typography>
                    </Box>
                  </Card>
                )}

                <Button
                  variant="contained"
                  onClick={() => setActiveStep(2)}
                  fullWidth
                >
                  I've Added the Account
                </Button>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Generating QR code...
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter the 6-digit verification code from your authenticator app:
            </Typography>

            <OTPInput
              title="Enter Verification Code"
              subtitle="Open your authenticator app and enter the 6-digit code"
              length={6}
              onVerify={verifyCode}
              loading={loading}
              error={error}
              autoFocus={true}
            />

            {success && activeStep === 2 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon />
                  {success}
                </Box>
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeIcon />
        Google Authenticator Setup
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && activeStep !== 2 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Typography variant="subtitle2">{step.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {step.description}
              </Typography>
              {renderStepContent(index)}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {onCancel && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default GoogleAuthenticatorSetup;
