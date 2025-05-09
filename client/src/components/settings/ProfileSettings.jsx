import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useData } from '../../context/DataContext';
import UserService from '../../services/user.service';
import useApi from '../../hooks/useApi';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

const ProfileSettings = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const { userData, fetchUserData } = useData();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // API hook for updating profile
  const {
    loading,
    error: apiError,
    execute: updateProfile,
  } = useApi(async () => {
    const formDataToSend = new FormData();

    // Append text fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Append avatar if selected
    if (avatar) {
      formDataToSend.append('avatar', avatar);
    }

    const response = await UserService.updateProfile(formDataToSend);

    // Show success message
    setSuccess('Profile updated successfully');

    // Refresh user data
    fetchUserData();

    return response;
  }, false);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });

      // Set avatar preview if user has an avatar
      if (userData.avatar) {
        setAvatarPreview(userData.avatar);
      }
    }
  }, [userData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await updateProfile();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  // Reset form
  const handleReset = () => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });

      // Reset avatar preview
      if (userData.avatar) {
        setAvatarPreview(userData.avatar);
      } else {
        setAvatarPreview(null);
      }

      setAvatar(null);
    }

    setError(null);
    setSuccess(null);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: 1200,
        mx: 'auto',
        borderRadius: 2,
        backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
        boxShadow: 1,
      }}
    >
      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 4,
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          {success}
        </Alert>
      )}

      {(error || apiError) && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          {error || apiError}
        </Alert>
      )}

      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{
          mb: 4,
          fontWeight: 'bold',
          textAlign: 'center',
          color: theme.palette.primary.main
        }}
      >
        Profile Settings
      </Typography>

      <Grid container spacing={4}>
        {/* Avatar Section */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, md: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              width: '100%',
              height: '100%',
              boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: mode === 'dark' ? '0 6px 25px rgba(0,0,0,0.4)' : '0 6px 25px rgba(0,0,0,0.15)',
                transform: 'translateY(-5px)'
              }
            }}
          >
            <Avatar
              src={avatarPreview}
              alt={formData.name}
              sx={{
                width: 150,
                height: 150,
                mb: 3,
                border: `3px solid ${theme.palette.primary.main}`,
                boxShadow: `0 0 15px ${theme.palette.primary.main}30`,
                fontSize: '3rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 20px ${theme.palette.primary.main}50`,
                }
              }}
            >
              {formData.name?.charAt(0) || 'U'}
            </Avatar>

            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'medium',
                mb: 2,
                color: theme.palette.text.primary
              }}
            >
              Profile Picture
            </Typography>

            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              sx={{
                mt: 2,
                py: 1,
                px: 2,
                borderRadius: 2,
                fontWeight: 'medium',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              Change Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
              />
            </Button>

            {avatarPreview && avatarPreview !== userData?.avatar && (
              <Button
                size="small"
                color="error"
                onClick={() => {
                  setAvatar(null);
                  setAvatarPreview(userData?.avatar || null);
                }}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  fontWeight: 'medium'
                }}
              >
                Cancel
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Form Fields */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
              height: '100%'
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                mb: 3,
                fontWeight: 'medium',
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                pb: 1
              }}
            >
              Personal Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  disabled
                  helperText="Email cannot be changed"
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={3}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mt: 4,
          mb: 2
        }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            startIcon={<CancelIcon />}
            sx={{
              mr: 2,
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 'medium',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}
            disabled={loading}
          >
            Reset
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 'medium',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileSettings;
