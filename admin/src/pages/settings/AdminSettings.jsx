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
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Avatar,
  IconButton,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Security as SecurityIcon, 
  Email as EmailIcon, 
  Sms as SmsIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  Save as SaveIcon
} from '@mui/icons-material';
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

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const { getToken } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone_number: '',
    avatar: null
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // OTP Settings state
  const [otpSettings, setOtpSettings] = useState({
    email_otp_enabled: true,
    mobile_otp_enabled: true,
  });

  // General Settings state
  const [generalSettings, setGeneralSettings] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    withdrawal_enabled: true,
    deposit_enabled: true,
  });

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch profile data
      const profileResponse = await axios.get(`${API_URL}/admin/get-profile`, { headers });
      if (profileResponse.status === 200) {
        setProfileData(profileResponse.data.data || {});
      }

      // Fetch OTP settings
      const otpResponse = await axios.get(`${API_URL}/admin/get-otp-settings`, { headers });
      if (otpResponse.status === 200) {
        setOtpSettings(otpResponse.data.data || {});
      }

      // You can add more settings fetch calls here

    } catch (error) {
      console.error('Failed to fetch settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleOtpSettingChange = (settingName) => (event) => {
    setOtpSettings(prev => ({
      ...prev,
      [settingName]: event.target.checked
    }));
  };

  const handleGeneralSettingChange = (settingName) => (event) => {
    setGeneralSettings(prev => ({
      ...prev,
      [settingName]: event.target.checked
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Only send the fields that should be updated
      const updateData = {
        name: profileData.name,
        email: profileData.email,
        phone_number: profileData.phone_number
      };

      const response = await axios.put(`${API_URL}/admin/update-profile`, updateData, { headers });
      if (response.status === 200) {
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const response = await axios.put(`${API_URL}/admin/change-password`, {
        old_password: passwordData.currentPassword,
        password: passwordData.newPassword
      }, { headers });
      if (response.status === 200) {
        alert('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      alert(error.response?.data?.msg || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOtpSettings = async () => {
    try {
      setSaving(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const response = await axios.put(`${API_URL}/admin/update-otp-settings`, otpSettings, { headers });
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <StyledCard>
        <CardHeader
          avatar={<SettingsIcon color="primary" />}
          title="Admin Settings"
          subheader="Manage your profile, security, and system settings"
          sx={{ pb: 1 }}
        />
        <Divider />
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab icon={<PersonIcon />} label="Profile" />
            <Tab icon={<LockIcon />} label="Password" />
            <Tab icon={<SecurityIcon />} label="OTP Settings" />
            {/* <Tab icon={<SettingsIcon />} label="General" /> */}
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  src={profileData.avatar}
                >
                  {profileData.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <IconButton color="primary" component="label">
                  <PhotoCamera />
                  <input type="file" hidden accept="image/*" />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Click to upload new avatar
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.name || ''}
                  onChange={handleProfileChange('name')}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.email || ''}
                  onChange={handleProfileChange('email')}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileData.phone_number || ''}
                  onChange={handleProfileChange('phone_number')}
                />
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Password Tab */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3} sx={{ maxWidth: 500 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Choose a strong password with at least 8 characters including uppercase, lowercase, numbers, and special characters.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={handlePasswordChange('currentPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={handlePasswordChange('newPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange('confirmPassword')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              onClick={handleSavePassword}
              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              startIcon={saving ? <CircularProgress size={20} /> : <LockIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </Stack>
        </TabPanel>

        {/* OTP Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          
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
                        checked={otpSettings.email_otp_enabled}
                        onChange={handleOtpSettingChange('email_otp_enabled')}
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
                        checked={otpSettings.mobile_otp_enabled}
                        onChange={handleOtpSettingChange('mobile_otp_enabled')}
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
              onClick={handleSaveOtpSettings}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SecurityIcon />}
            >
              {saving ? 'Saving...' : 'Save OTP Settings'}
            </Button>
          </Box>

        </TabPanel>

        {/* General Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Caution:</strong> These settings affect the entire system. Changes will impact all users immediately.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SettingItem>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SettingsIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Maintenance Mode
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enable maintenance mode to prevent user access during system updates
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <IOSSwitch
                        checked={generalSettings.maintenance_mode}
                        onChange={handleGeneralSettingChange('maintenance_mode')}
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
                  <PersonIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      User Registration
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Allow new users to register accounts on the platform
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <IOSSwitch
                        checked={generalSettings.registration_enabled}
                        onChange={handleGeneralSettingChange('registration_enabled')}
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
              onClick={() => alert('General settings save functionality to be implemented')}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SettingsIcon />}
            >
              {saving ? 'Saving...' : 'Save General Settings'}
            </Button>
          </Box>
        </TabPanel>
      </StyledCard>
    </Box>
  );
}
