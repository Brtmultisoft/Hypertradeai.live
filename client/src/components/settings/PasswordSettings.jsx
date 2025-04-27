import { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import UserService from '../../services/user.service';
import useApi from '../../hooks/useApi';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { validatePassword } from '../../utils/validators';

const PasswordSettings = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();

  const [formData, setFormData] = useState({
    old_password: '',
    password: '',
    confirmPassword: '',
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // API hook for changing password
  const {
    loading,
    error: apiError,
    execute: changePassword,
  } = useApi(async () => {
    const response = await UserService.changePassword({
      old_password: formData.old_password,
      password: formData.password,
    });

    // Show success message
    setSuccess('Password changed successfully');

    // Reset form
    setFormData({
      old_password: '',
      password: '',
      confirmPassword: '',
    });

    return response;
  }, false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation errors when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Validate old password
    if (!formData.old_password) {
      errors.old_password = 'Current password is required';
    }

    // Validate new password
    if (!formData.password) {
      errors.password = 'New password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await changePassword();
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      old_password: '',
      password: '',
      confirmPassword: '',
    });

    setValidationErrors({});
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
          <LockIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Change Password</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Your password must be at least 8 characters long and include a mix of letters, numbers, and special characters.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Current Password"
              name="old_password"
              type={showOldPassword ? 'text' : 'password'}
              value={formData.old_password}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.old_password}
              helperText={validationErrors.old_password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      edge="end"
                    >
                      {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="New Password"
              name="password"
              type={showNewPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              variant="outlined"
              error={!!validationErrors.confirmPassword}
              helperText={validationErrors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </Box>
    </Box>
  );
};

export default PasswordSettings;
