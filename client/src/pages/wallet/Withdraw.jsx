import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Tabs,
  Tab,
  InputAdornment,
  Alert,
  FormControl,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Checkbox,
  FormControlLabel,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import useData from '../../hooks/useData';
import useApi from '../../hooks/useApi';
import WalletService from '../../services/wallet.service';

const Withdraw = () => {
  const theme = useMuiTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [refreshing, setRefreshing] = useState(false);
  const { dashboardData, fetchDashboardData } = useData();

  // Use real wallet data from dashboardData
  const walletBalance = dashboardData?.wallet_balance || 0;

  // Currency options with USDT as the main option
  const balances = [
    {
      currency: 'USDT',
      balance: walletBalance,
      usdValue: walletBalance, // 1 USDT = 1 USD
      icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
      placeholder: 'https://via.placeholder.com/40x40/26A17B/FFFFFF?text=USDT'
    }
  ];

  const networkFee = 1; // USDT
  const networkFeeUsd = 1; // USD

  // API hook for submitting withdrawal request
  const {
    loading: submittingWithdrawal,
    error: withdrawalError,
    data: withdrawalResponse,
    execute: submitWithdrawal
  } = useApi(() => WalletService.requestWithdrawal({
    amount: parseFloat(amount),
    address: address,
    currency: balances[activeTab].currency
  }));

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle successful withdrawal submission
  useEffect(() => {
    if (withdrawalResponse) {
      console.log('Withdrawal response:', withdrawalResponse);
      setSnackbarMessage('Withdrawal request submitted successfully! It will be processed after admin approval.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Reset form
      setAmount('');
      setAddress('');
      setAgreedToTerms(false);

      // Set refreshing state to true
      setRefreshing(true);

      // Refresh dashboard data to show updated balance
      // Add a small delay to ensure the server has processed the withdrawal
      setTimeout(() => {
        fetchDashboardData()
          .then(() => {
            console.log('Dashboard data refreshed successfully');
            setRefreshing(false);
          })
          .catch(error => {
            console.error('Error refreshing dashboard data:', error);
            setRefreshing(false);
          });
      }, 1000);
    }
  }, [withdrawalResponse, fetchDashboardData]);

  // Handle withdrawal error
  useEffect(() => {
    if (withdrawalError) {
      setSnackbarMessage(withdrawalError.msg || 'Failed to submit withdrawal request. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [withdrawalError]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setAmount('');
    setAddress('');
    setErrors({});
    setAgreedToTerms(false);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    validateAddress(value);
  };

  const validateAmount = (value) => {
    const newErrors = { ...errors };

    if (!value) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(value) || parseFloat(value) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parseFloat(value) < 50) {
      newErrors.amount = 'Minimum withdrawal amount is 50 USDT';
    } else if (parseFloat(value) > balances[activeTab].balance) {
      newErrors.amount = 'Insufficient balance';
    } else {
      delete newErrors.amount;
    }

    setErrors(newErrors);
  };

  const validateAddress = (value) => {
    const newErrors = { ...errors };

    if (!value) {
      newErrors.address = 'Address is required';
    } else if (value.length < 30) {
      newErrors.address = 'Please enter a valid address';
    } else {
      delete newErrors.address;
    }

    setErrors(newErrors);
  };

  const handleMaxAmount = () => {
    const maxAmount = (balances[activeTab].balance - networkFee).toFixed(6);
    setAmount(maxAmount > 0 ? maxAmount : '0');
    validateAmount(maxAmount);
  };

  const handleWithdraw = () => {
    validateAmount(amount);
    validateAddress(address);

    if (!amount || !address || errors.amount || errors.address || !agreedToTerms) {
      return;
    }

    // Check if amount is greater than available balance
    if (parseFloat(amount) > parseFloat(balances[activeTab].balance)) {
      setSnackbarMessage('Insufficient balance for this withdrawal');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    console.log('Submitting withdrawal request:', {
      amount: parseFloat(amount),
      address: address,
      currency: balances[activeTab].currency
    });

    // Submit withdrawal request
    submitWithdrawal();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getAmountUsdValue = () => {
    if (!amount || isNaN(amount)) return 0;
    const usdPerUnit = balances[activeTab].usdValue / balances[activeTab].balance;
    return (parseFloat(amount) * usdPerUnit).toFixed(2);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle manual refresh of dashboard data
  const handleRefreshBalance = () => {
    setRefreshing(true);
    fetchDashboardData()
      .then(() => {
        console.log('Dashboard data refreshed successfully');
        setSnackbarMessage('Balance updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setRefreshing(false);
      })
      .catch(error => {
        console.error('Error refreshing dashboard data:', error);
        setSnackbarMessage('Failed to update balance. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setRefreshing(false);
      });
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          position: 'sticky',
          top: 0,
          backgroundColor: theme.palette.background.paper,
          zIndex: 10,
        }}
      >
        <IconButton onClick={handleBack} edge="start" sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Withdraw</Typography>
      </Box>

      {/* Currency Selection Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          px: 2,
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            minWidth: 'auto',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
          },
        }}
      >
        {balances.map((item) => (
          <Tab key={item.currency} label={item.currency} />
        ))}
      </Tabs>

      {/* Main Content */}
      <Box sx={{ px: 2 }}>
        {/* Balance Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            position: 'relative',
          }}
        >
          {refreshing && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: 2,
                zIndex: 1,
              }}
            >
              <CircularProgress size={30} />
            </Box>
          )}
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="img"
                  src={balances[activeTab].icon}
                  alt={balances[activeTab].currency}
                  sx={{
                    width: 40,
                    height: 40,
                    mr: 2,
                    borderRadius: '50%',
                  }}
                  onError={(e) => {
                    e.target.src = balances[activeTab].placeholder;
                  }}
                />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Available Balance
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {balances[activeTab].balance} {balances[activeTab].currency}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ≈ ${balances[activeTab].usdValue.toFixed(2)} USD
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Refresh Balance">
                <IconButton
                  onClick={handleRefreshBalance}
                  disabled={refreshing}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Withdraw {balances[activeTab].currency}
          </Typography>

          {/* Amount Field */}
          <FormControl fullWidth error={!!errors.amount} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Amount
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`Enter ${balances[activeTab].currency} amount`}
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="text"
                      color="primary"
                      size="small"
                      onClick={handleMaxAmount}
                      sx={{ textTransform: 'none' }}
                    >
                      MAX
                    </Button>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {balances[activeTab].currency}
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
            {amount && !errors.amount && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                ≈ ${getAmountUsdValue()} USD
              </Typography>
            )}
            {errors.amount && (
              <FormHelperText>{errors.amount}</FormHelperText>
            )}
          </FormControl>

          {/* Address Field */}
          <FormControl fullWidth error={!!errors.address} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Recipient Address
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`Enter ${balances[activeTab].currency} address`}
              value={address}
              onChange={handleAddressChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <QrCodeIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {errors.address && (
              <FormHelperText>{errors.address}</FormHelperText>
            )}
          </FormControl>

          {/* Network Fee */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Network Fee
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                {networkFee} {balances[activeTab].currency}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ≈ ${networkFeeUsd} USD
              </Typography>
            </Box>
          </Box>

          {/* Terms and Conditions */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I understand that this withdrawal request will be processed after admin approval and may take 24-48 hours to complete.
                </Typography>
              }
            />
          </Box>

          {/* Withdraw Button */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            startIcon={submittingWithdrawal ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            onClick={handleWithdraw}
            disabled={!amount || !address || !!errors.amount || !!errors.address || !agreedToTerms || submittingWithdrawal}
            sx={{
              py: 1.5,
              borderRadius: 2,
            }}
          >
            {submittingWithdrawal ? 'Processing...' : `Withdraw ${balances[activeTab].currency}`}
          </Button>
        </Paper>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
            icon={snackbarSeverity === 'success' ? <CheckCircleIcon /> : undefined}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Warning */}
        <Alert
          severity="warning"
          icon={<InfoIcon />}
          sx={{
            borderRadius: 2,
            mb: 3,
            '& .MuiAlert-message': {
              width: '100%',
            }
          }}
        >
          <Typography variant="body2">
            Make sure the recipient address is correct and supports {balances[activeTab].currency} on the {balances[activeTab].currency} network. Sending to an incorrect address may result in permanent loss of funds.
          </Typography>
        </Alert>

        {/* Recent Withdrawals */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Recent Withdrawals
            </Typography>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => navigate('/transaction-history')}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No recent withdrawals found
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Withdraw;
