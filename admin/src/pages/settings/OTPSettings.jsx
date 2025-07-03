import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Divider,
  Grid,
  Paper,
  Stack,
  Button,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Security as SecurityIcon, Email as EmailIcon, Sms as SmsIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_URL } from '../../config';
import useAuth from '../../hooks/useAuth';


// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[4],
  borderRadius: theme.spacing(2),
}));

const SettingItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(16px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.success.main,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: '#33cf4d',
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.grey[100],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: 0.7,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 22,
    height: 22,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.grey[300],
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

export default function OTPSettings() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState({
    email_otp_enabled: true,
    mobile_otp_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch current OTP settings
  useEffect(() => {
    fetchOTPSettings();
  }, []);

  const fetchOTPSettings = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const response = await axios.get(`${API_URL}/admin/get-otp-settings`, { headers });
      if (response.status === 200 && response.data?.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch OTP settings:', error);
      alert('Failed to load OTP settings');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleSettingChange = (settingName) => (event) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: event.target.checked
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const response = await axios.put(`${API_URL}/admin/update-otp-settings`, settings, { headers });

      if (response.status === 200) {
        alert('OTP settings updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update OTP settings:', error);
      alert(error.response?.data?.msg || 'Failed to update OTP settings');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoad && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading OTP settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <StyledCard>
        <CardHeader
          avatar={<SecurityIcon color="primary" />}
          title="OTP Settings"
          subheader="Control when OTP verification is required for users"
          sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              When OTP is disabled, users will not receive verification codes during registration, login, or password reset.
              This affects both new registrations and existing user authentication.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SettingItem>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <EmailIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Email OTP
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable or disable OTP verification via email for registration, login, and password reset
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <IOSSwitch
                        checked={settings.email_otp_enabled}
                        onChange={handleSettingChange('email_otp_enabled')}
                        disabled={saving}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Stack>
              </SettingItem>
            </Grid>

            <Grid item xs={12} md={6}>
              <SettingItem>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SmsIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Mobile OTP
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable or disable OTP verification via SMS for registration, login, and password reset
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <IOSSwitch
                        checked={settings.mobile_otp_enabled}
                        onChange={handleSettingChange('mobile_otp_enabled')}
                        disabled={saving}
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Stack>
              </SettingItem>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || saving}
              size="large"
              sx={{ minWidth: 120 }}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>

         
        </CardContent>
      </StyledCard>
    </Box>
  );
}
