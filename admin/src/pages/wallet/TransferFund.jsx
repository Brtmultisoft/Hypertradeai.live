import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  Divider,
  Card,
  CardContent,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import { API_URL } from '../../config';

const TransferFund = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    amount: '',
    walletType: 'wallet', // 'wallet' or 'wallet_topup'
    description: '',
  });
  const [userFound, setUserFound] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
    autoHideDuration: 6000,
  });

  // Test notification on component mount
  useEffect(() => {
    // Show a welcome notification when the component mounts
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Welcome to Fund Transfer. Search for a user to begin.',
        severity: 'info',
        autoHideDuration: 5000,
      });
      console.log('Initial notification set');
    }, 500);
  }, []);

  // Handle snackbar close
  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Show snackbar helper function
  const showSnackbar = (message, severity = 'info', autoHideDuration = 6000) => {
    console.log('Showing snackbar:', { message, severity, autoHideDuration });
    // First close any existing snackbar to ensure the new one triggers a state change
    setSnackbar(prev => ({ ...prev, open: false }));

    // Use setTimeout to ensure the state update happens in the next tick
    setTimeout(() => {
      setSnackbar({
        open: true,
        message,
        severity,
        autoHideDuration,
      });
    }, 100);
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear user found state when email changes
    if (name === 'email') {
      setUserFound(null);
    }
  };

  // Handle wallet type change
  const handleWalletTypeChange = (e) => {
    setFormData({
      ...formData,
      walletType: e.target.value,
    });
  };

  // Fallback search function that uses the search-users endpoint
  const handleFallbackSearch = async (email) => {
    try {
      console.log('Using fallback search for email:', email);
      const token = getToken();
      const searchResponse = await axios.get(`${API_URL}/admin/search-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query: email
        }
      });

      console.log('Fallback search response:', searchResponse.data);

      if (searchResponse.data && searchResponse.data.status && searchResponse.data.data && searchResponse.data.data.length > 0) {
        // Find exact match by email
        const exactMatch = searchResponse.data.data.find(user =>
          user.email.toLowerCase() === email.toLowerCase()
        );

        if (exactMatch) {
          console.log('Found exact match in fallback search:', exactMatch);
          showSnackbar('User found, retrieving details...', 'info');

          // Get full user details
          const userResponse = await axios.get(`${API_URL}/admin/get-user/${exactMatch._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log('User details response:', userResponse.data);
          if (userResponse.data && userResponse.data.status) {
            // First try the data field (new format)
            if (userResponse.data.data && typeof userResponse.data.data === 'object' && Object.keys(userResponse.data.data).length > 0) {
              console.log('Found user in data field:', userResponse.data.data);
              setUserFound(userResponse.data.data);
              showSnackbar(`User found: ${userResponse.data.data.name || userResponse.data.data.email}`, 'success');
            }
            // Then try the result field (old format)
            else if (userResponse.data.result && typeof userResponse.data.result === 'object' && Object.keys(userResponse.data.result).length > 0) {
              console.log('Found user in result field:', userResponse.data.result);
              setUserFound(userResponse.data.result);
              showSnackbar(`User found: ${userResponse.data.result.name || userResponse.data.result.email}`, 'success');
            }
            // If neither has valid data, show error
            else {
              const errorMessage = 'User found but data is missing in response';
              setError(errorMessage);
              showSnackbar(errorMessage, 'error');
              console.error('No valid user data found in response:', userResponse.data);
            }
          } else {
            const errorMessage = 'User found but could not retrieve full details';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
          }
        } else {
          const errorMessage = `No exact match found for email: ${email}`;
          setError(errorMessage);
          showSnackbar(errorMessage, 'error');
        }
      } else {
        const errorMessage = 'User not found with this email';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error');
      }
    } catch (searchErr) {
      const errorMessage = searchErr.response?.data?.message || 'Failed to find user';
      setError(errorMessage);
      showSnackbar(`Search error: ${errorMessage}`, 'error');
      console.error('Error in fallback search:', searchErr);
    }
  };

  // Search user by email
  const searchUser = async () => {
    if (!formData.email) {
      setError('Please enter an email address');
      showSnackbar('Please enter an email address', 'error');
      return;
    }

    setSearchingUser(true);
    setUserFound(null);
    setError(null);
    setSuccess(null);

    // Show searching notification
    showSnackbar(`Searching for user: ${formData.email}...`, 'info');

    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-user-by-email/${formData.email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Search response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Response keys:', Object.keys(response.data));

      if (response.data && response.data.status) {
        // First try the data field (new format)
        if (response.data.data && typeof response.data.data === 'object' && Object.keys(response.data.data).length > 0) {
          console.log('Found user in data field:', response.data.data);
          setUserFound(response.data.data);
          showSnackbar(`User found: ${response.data.data.name || response.data.data.email}`, 'success');
        }
        // Then try the result field (old format)
        else if (response.data.result && typeof response.data.result === 'object' && Object.keys(response.data.result).length > 0) {
          console.log('Found user in result field:', response.data.result);
          setUserFound(response.data.result);
          showSnackbar(`User found: ${response.data.result.name || response.data.result.email}`, 'success');
        }
        // If neither has valid data, try fallback search
        else {
          console.error('No valid user data found in response');
          console.error('Response data:', response.data);
          showSnackbar('User search returned invalid data, trying alternative search method...', 'warning');
          handleFallbackSearch(formData.email);
          return;
        }
      } else {
        const errorMessage = response.data?.message || 'User not found';
        setError(errorMessage);
        showSnackbar(`Search failed: ${errorMessage}`, 'error');
      }
    } catch (err) {
      console.error('Error searching user:', err);
      showSnackbar('Error searching for user, trying alternative search method...', 'warning');
      // Use the fallback search function
      handleFallbackSearch(formData.email);
    } finally {
      setSearchingUser(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.email) {
      setError('Please enter an email address');
      showSnackbar('Please enter an email address', 'error');
      return;
    }

    if (!userFound) {
      setError('Please search for a valid user first');
      showSnackbar('Please search for a valid user first', 'error');
      return;
    }

    // Validate that userFound has the required fields
    if (!userFound._id) {
      setError('User data is incomplete. Missing user ID.');
      showSnackbar('User data is incomplete. Missing user ID.', 'error');
      console.error('Incomplete user data:', userFound);
      return;
    }

    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getToken();

      // Prepare request data
      const requestData = {
        user_id: userFound._id,
        amount: parseFloat(formData.amount),
        type: formData.walletType === 'wallet' ? 0 : 1, // 0 for main wallet, 1 for topup wallet
        remark: formData.description || 'Admin transfer',
      };

      console.log('Sending fund transfer request:', requestData);

      // Show pending transfer notification
      showSnackbar(`Processing transfer of ${formatCurrency(parseFloat(formData.amount))} to ${userFound.name || userFound.email}...`, 'info');

      const response = await axios.post(`${API_URL}/admin/add-fund-transfer`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Fund transfer response:', response.data);

      if (response.data && response.data.status) {
        const successMessage = response.data.msg || response.data.message || 'Funds transferred successfully';
        setSuccess(successMessage);

        // Show success notification with more details
        showSnackbar(
          `Successfully transferred ${formatCurrency(parseFloat(formData.amount))} to ${userFound.name || userFound.email}'s ${formData.walletType === 'wallet' ? 'Main Wallet' : 'Topup Wallet'}`,
          'success',
          8000
        );

        // Reset form
        setFormData({
          email: '',
          amount: '',
          walletType: 'wallet',
          description: '',
        });
        setUserFound(null);
      } else {
        const errorMessage = response.data?.msg || response.data?.message || 'Failed to transfer funds';
        setError(errorMessage);
        showSnackbar(errorMessage, 'error', 10000);
      }
    } catch (err) {
      console.error('Error transferring funds:', err);
      const errorMessage = err.response?.data?.msg || err.response?.data?.message || 'An error occurred while transferring funds';
      setError(errorMessage);

      // Show detailed error notification
      showSnackbar(
        `Transfer failed: ${errorMessage}. Please try again or contact support.`,
        'error',
        10000
      );
    } finally {
      setLoading(false);
    }
  };

  // No custom alert component needed anymore

  return (
    <Box sx={{ width: '100%' }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          zIndex: 9999,
          '& .MuiSnackbarContent-root': {
            minWidth: '300px',
          }
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{
            width: '100%',
            borderRadius: 2,
            boxShadow: 3,
            '& .MuiAlert-icon': {
              fontSize: '1.25rem'
            },
            fontWeight: 'medium',
            fontSize: '0.95rem'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <PageHeader
        title="Transfer Funds"
        subtitle="Transfer funds to any user's wallet"
      />

      {/* Test button for notifications - remove in production */}
      {/* <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="info"
          onClick={() => showSnackbar('This is an info message', 'info')}
        >
          Test Info
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="success"
          onClick={() => showSnackbar('This is a success message', 'success')}
        >
          Test Success
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="warning"
          onClick={() => showSnackbar('This is a warning message', 'warning')}
        >
          Test Warning
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={() => showSnackbar('This is an error message', 'error')}
        >
          Test Error
        </Button>
      </Box> */}

      <Grid container spacing={3}>
        {/* Transfer Form */}
        <Grid item xs={12} md={8}>
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

            <Box component="form" onSubmit={handleSubmit}>
              {/* User Search */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                1. Find User
              </Typography>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="User Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{ mr: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={searchUser}
                  disabled={searchingUser || !formData.email}
                  sx={{ height: 56 }}
                >
                  {searchingUser ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              </Box>

              {/* User Details */}
              {userFound && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    User Details:
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Name
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {userFound.name || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {userFound.email || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Username
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {userFound.username || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Referred By
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {userFound.referred_by || 'Admin'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Wallet Balance
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="primary.main">
                            {formatCurrency(userFound.wallet || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Topup Wallet Balance
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="primary.main">
                            {formatCurrency(userFound.wallet_topup || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Transfer Details */}
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                2. Transfer Details
              </Typography>

              {/* Amount */}
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Wallet Type */}
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Select Wallet Type</FormLabel>
                <RadioGroup
                  row
                  name="walletType"
                  value={formData.walletType}
                  onChange={handleWalletTypeChange}
                >
                  <FormControlLabel
                    value="wallet"
                    control={<Radio />}
                    label="Main Wallet"
                  />
                  <FormControlLabel
                    value="wallet_topup"
                    control={<Radio />}
                    label="Topup Wallet"
                  />
                </RadioGroup>
              </FormControl>

              {/* Description */}
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SendIcon />}
                disabled={loading || !userFound || !formData.amount}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Transfer Funds'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Information Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Transfer Information
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Main Wallet vs Topup Wallet
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Main Wallet:</strong> Used for investments and receiving ROI income.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Topup Wallet:</strong> Used for transfers between users and can be used for investments.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Transfer Rules
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>Admin can transfer to either wallet type</li>
                <li>No fees are charged for admin transfers</li>
                <li>All transfers are recorded in the transaction history</li>
                <li>Users will receive a notification of the transfer</li>
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body2">
                If you have any questions about transfers, please contact the system administrator.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransferFund;
