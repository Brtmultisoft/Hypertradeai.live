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
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {(error || apiError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || apiError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Avatar Section */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Avatar
              src={avatarPreview}
              alt={formData.name}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              {formData.name?.charAt(0) || 'U'}
            </Avatar>

            <Typography variant="subtitle1" gutterBottom>
              Profile Picture
            </Typography>

            <Button
              component="label"
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              sx={{ mt: 1 }}
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
                sx={{ mt: 1 }}
              >
                Cancel
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Form Fields */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
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
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            startIcon={<CancelIcon />}
            sx={{ mr: 2 }}
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
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileSettings;
