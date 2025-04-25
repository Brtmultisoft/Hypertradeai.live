import React, { useState } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import useData from '../../hooks/useData';

const Withdraw = () => {
  const theme = useMuiTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
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

  // Fetch dashboard data on component mount
  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setAmount('');
    setAddress('');
    setErrors({});
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
    } else if (value.length < 42) {
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

    if (!amount || !address || errors.amount || errors.address) {
      return;
    }

    // Here you would implement the actual withdrawal logic
    alert(`Withdrawal of ${amount} ${balances[activeTab].currency} to ${address} initiated!`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getAmountUsdValue = () => {
    if (!amount || isNaN(amount)) return 0;
    const usdPerUnit = balances[activeTab].usdValue / balances[activeTab].balance;
    return (parseFloat(amount) * usdPerUnit).toFixed(2);
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
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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

          {/* Withdraw Button */}
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SendIcon />}
            onClick={handleWithdraw}
            disabled={!amount || !address || !!errors.amount || !!errors.address}
            sx={{
              py: 1.5,
              borderRadius: 2,
            }}
          >
            Withdraw {balances[activeTab].currency}
          </Button>
        </Paper>

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
