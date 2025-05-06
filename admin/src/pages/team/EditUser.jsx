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
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
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
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
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
      // updateData.wallet = userData.wallet ;
      // updateData.wallet_topup = userData.wallet_topup ;
      
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
              
              {/* Wallet Information
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Wallet Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
               */}
              {/* Main Wallet */}
              {/* <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Main Wallet Balance"
                  name="wallet"
                  type="number"
                  value={userData.wallet}
                  onChange={handleNumberChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid> */}
              
              {/* Topup Wallet */}
              {/* <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Topup Wallet Balance"
                  name="wallet_topup"
                  type="number"
                  value={userData.wallet_topup}
                  onChange={handleNumberChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid> */}
              
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
    </Box>
  );
};

export default EditUser;
