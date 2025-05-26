import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Block as BlockIcon,
  LockOpen as UnblockIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import { API_URL } from '../../config';
import PageHeader from '../../components/PageHeader';

const EditUser = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Form state
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    username: '',
    phone_number: '',
    password: '',
    status: true,
    wallet: 0,
    wallet_topup: 0,
    is_blocked: false,
    block_reason: '',
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Block/Unblock dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingUser, setBlockingUser] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/admin/get-user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status) {
          const user = response.data.data || response.data.result;
          if (!user) {
            setError('User data not found');
            setLoading(false);
            return;
          }

          setUserData({
            id: user._id,
            name: user.name || '',
            email: user.email || '',
            username: user.username || '',
            phone_number: user.phone_number || '',
            password: '',
            status: user.status !== undefined ? user.status : true,
            wallet: user.wallet || 0,
            wallet_topup: user.wallet_topup || 0,
            is_blocked: user.is_blocked || false,
            block_reason: user.block_reason || '',
          });
        } else {
          setError(response.data.msg || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.response?.data?.msg || 'An error occurred while fetching user data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    } else {
      setError('User ID is missing');
      setLoading(false);
    }
  }, [id, getToken]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle switch toggle for status
  const handleStatusChange = (e) => {
    setUserData((prev) => ({
      ...prev,
      status: e.target.checked,
    }));
  };

  // Handle number input changes (wallet balances)
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setUserData((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!userData.name || !userData.email || !userData.username) {
      setError('Name, Email, and Username are required fields');
      setSaving(false);
      return;
    }

    try {
      const token = getToken();

      // Prepare data for submission
      const updateData = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        username: userData.username,
        phone_number: userData.phone_number,
        status: userData.status,
      };

      // Only include password if it's provided
      if (userData.password) {
        updateData.password = userData.password;
      }

      // Include wallet balances
      updateData.wallet = userData.wallet.toString();
      updateData.wallet_topup = userData.wallet_topup.toString();

      console.log('Sending update data:', updateData);

      const response = await axios.put(`${API_URL}/admin/update-user`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status) {
        setSuccess(response.data.msg || 'User updated successfully');
        // Clear password field after successful update
        setUserData((prev) => ({
          ...prev,
          password: '',
        }));

        // Refresh user data after update
        const refreshResponse = await axios.get(`${API_URL}/admin/get-user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (refreshResponse.data.status) {
          const user = refreshResponse.data.data || refreshResponse.data.result;
          setUserData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            username: user.username || '',
            phone_number: user.phone_number || '',
            status: user.status !== undefined ? user.status : true,
            wallet: user.wallet || 0,
            wallet_topup: user.wallet_topup || 0,
          }));
        }
      } else {
        setError(response.data.msg || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.msg || 'An error occurred while updating user');
    } finally {
      setSaving(false);
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Go back to users list
  const handleGoBack = () => {
    navigate('/all-team');
  };

  // Open block dialog
  const openBlockDialog = () => {
    setBlockReason(userData.block_reason || '');
    setBlockDialogOpen(true);
  };

  // Close block dialog
  const closeBlockDialog = () => {
    setBlockDialogOpen(false);
    setBlockReason('');
  };

  // Open unblock dialog
  const openUnblockDialog = () => {
    setUnblockDialogOpen(true);
  };

  // Close unblock dialog
  const closeUnblockDialog = () => {
    setUnblockDialogOpen(false);
  };

  // Handle block user
  const handleBlockUser = async () => {
    try {
      setBlockingUser(true);
      setError(null);
      setSuccess(null);

      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        closeBlockDialog();
        return;
      }

      // Call the API to block the user
      const response = await axios.post(
        `${API_URL}/admin/block-user`,
        {
          id: userData.id,
          block_reason: blockReason || 'Blocked by administrator',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status) {
        setSuccess(response.data.msg || 'User has been blocked successfully');
        // Update the user data
        setUserData(prev => ({
          ...prev,
          is_blocked: true,
          block_reason: blockReason || 'Blocked by administrator',
        }));
        closeBlockDialog();
      } else {
        setError(response.data?.msg || 'Failed to block user');
        closeBlockDialog();
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      setError(err.response?.data?.msg || 'An error occurred while blocking user');
      closeBlockDialog();
    } finally {
      setBlockingUser(false);
    }
  };

  // Handle unblock user
  const handleUnblockUser = async () => {
    try {
      setBlockingUser(true);
      setError(null);
      setSuccess(null);

      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        closeUnblockDialog();
        return;
      }

      // Call the API to unblock the user
      const response = await axios.post(
        `${API_URL}/admin/unblock-user`,
        {
          id: userData.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.status) {
        setSuccess(response.data.msg || 'User has been unblocked successfully');
        // Update the user data
        setUserData(prev => ({
          ...prev,
          is_blocked: false,
          block_reason: '',
        }));
        closeUnblockDialog();
      } else {
        setError(response.data?.msg || 'Failed to unblock user');
        closeUnblockDialog();
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError(err.response?.data?.msg || 'An error occurred while unblocking user');
      closeUnblockDialog();
    } finally {
      setBlockingUser(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Edit User"
        subtitle="Update user information"
        backButton={true}
        onBackClick={handleGoBack}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  error={userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)}
                  helperText={userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email) ? "Please enter a valid email address" : ""}
                />
              </Grid>

              {/* Username */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  variant="outlined"
                  required
                  error={userData.username && userData.username.length < 6}
                  helperText={userData.username && userData.username.length < 6 ? "Username must be at least 6 characters" : ""}
                />
              </Grid>

              {/* Phone Number */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  value={userData.phone_number}
                  onChange={handleChange}
                  variant="outlined"
                  error={userData.phone_number && (userData.phone_number.length < 10 || userData.phone_number.length > 12)}
                  helperText={userData.phone_number && (userData.phone_number.length < 10 || userData.phone_number.length > 12) ? "Phone number must be between 10-12 digits" : ""}
                />
              </Grid>

              {/* Password */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password (leave blank to keep unchanged)"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={userData.password}
                  onChange={handleChange}
                  variant="outlined"
                  error={userData.password && (userData.password.length < 8 || !/\d/.test(userData.password) || !/[a-zA-Z]/.test(userData.password))}
                  helperText={
                    userData.password && userData.password.length > 0 ? (
                      userData.password.length < 8 ?
                        "Password must be at least 8 characters" :
                        (!(/\d/.test(userData.password) && /[a-zA-Z]/.test(userData.password)) ?
                          "Password must contain at least 1 letter and 1 number" :
                          "")
                    ) : ""
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userData.status}
                      onChange={handleStatusChange}
                      color="primary"
                    />
                  }
                  label={userData.status ? "Active" : "Inactive"}
                />
              </Grid>

              {/* Block Status */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Account Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Account is currently:
                    <Typography
                      component="span"
                      color={userData.is_blocked ? "error" : "success"}
                      fontWeight="bold"
                      sx={{ ml: 1 }}
                    >
                      {userData.is_blocked ? "BLOCKED" : "ACTIVE"}
                    </Typography>
                  </Typography>

                  {userData.is_blocked ? (
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={openUnblockDialog}
                      startIcon={<UnblockIcon />}
                      size="small"
                      sx={{ ml: 2 }}
                    >
                      Unblock User
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={openBlockDialog}
                      startIcon={<BlockIcon />}
                      size="small"
                      sx={{ ml: 2 }}
                    >
                      Block User
                    </Button>
                  )}
                </Box>

                {userData.is_blocked && userData.block_reason && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Block reason: {userData.block_reason}
                  </Typography>
                )}
              </Grid>

              {/* Wallet Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Wallet Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Main Wallet */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Main Wallet Balance"
                  name="wallet"
                  type="number"
                  disabled
                  value={userData.wallet}
                  onChange={handleNumberChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Topup Wallet */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Topup Wallet Balance"
                  name="wallet_topup"
                  type="number"
                  disabled
                  value={userData.wallet_topup}
                  onChange={handleNumberChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleGoBack}
                  startIcon={<ArrowBackIcon />}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Block User Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={closeBlockDialog}
        aria-labelledby="block-dialog-title"
        aria-describedby="block-dialog-description"
      >
        <DialogTitle id="block-dialog-title">Block User</DialogTitle>
        <DialogContent>
          <DialogContentText id="block-dialog-description">
            Are you sure you want to block this user? This will prevent them from logging in and using the platform.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="block-reason"
            label="Block Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBlockDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleBlockUser}
            color="error"
            variant="contained"
            disabled={blockingUser}
            startIcon={blockingUser ? <CircularProgress size={20} /> : <BlockIcon />}
          >
            {blockingUser ? 'Blocking...' : 'Block User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unblock User Dialog */}
      <Dialog
        open={unblockDialogOpen}
        onClose={closeUnblockDialog}
        aria-labelledby="unblock-dialog-title"
        aria-describedby="unblock-dialog-description"
      >
        <DialogTitle id="unblock-dialog-title">Unblock User</DialogTitle>
        <DialogContent>
          <DialogContentText id="unblock-dialog-description">
            Are you sure you want to unblock this user? This will allow them to log in and use the platform again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUnblockDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleUnblockUser}
            color="success"
            variant="contained"
            disabled={blockingUser}
            startIcon={blockingUser ? <CircularProgress size={20} /> : <UnblockIcon />}
          >
            {blockingUser ? 'Unblocking...' : 'Unblock User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditUser;
