import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './QrScanner.css';
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Divider,
  Radio,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  LockOpen as LockOpenIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { QrReader } from 'react-qr-reader';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import useData from '../../hooks/useData';
import useApi from '../../hooks/useApi';
import WalletService from '../../services/wallet.service';

const Withdraw = () => {
  const theme = useMuiTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();

  // Form state
  const [activeTab, setActiveTab] = useState(0);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [refreshing, setRefreshing] = useState(false);

  // QR Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [hasPermission, setHasPermission] = useState(null);

  // Withdrawal and staking release state
  const [unlockStakingOpen, setUnlockStakingOpen] = useState(false);
  const [isFullWithdrawal, setIsFullWithdrawal] = useState(false);
  const [stakingReleaseOption, setStakingReleaseOption] = useState('none'); // 'none', 'wallet', 'trade_wallet', 'partial', 'full'
  const [submittingReleaseToWallet, setSubmittingReleaseToWallet] = useState(false);

  const { dashboardData, fetchDashboardData } = useData();

  // Use real wallet data from dashboardData
  const walletBalance = dashboardData?.wallet_balance || 0;

  // Currency options with USDT as the main option
  const balances = [
    {
      currency: 'USDT',
      balance: walletBalance,
      usdValue: walletBalance, // 1 USDT = 1 USD
      icon: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
      placeholder: 'https://via.placeholder.com/40x40/26A17B/FFFFFF?text=USDT',
      fallbackColor: '#26A17B',
      fallbackText: 'USDT'
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
  } = useApi((data) => WalletService.requestWithdrawal(data));

  // API hook for submitting withdrawal (includes staking release)
  const {
    loading: submittingUnlockStaking
  } = useApi(() => WalletService.unlockStaking());

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle successful withdrawal submission
  useEffect(() => {
    if (withdrawalResponse) {
      console.log('Withdrawal response:', withdrawalResponse);

      // Show different message based on the staking release option
      if (withdrawalResponse.data?.stakingReleaseOption === 'partial') {
        setSnackbarMessage('Withdrawal request submitted with 50% staking release! It will be processed after admin approval.');
      } else if (withdrawalResponse.data?.stakingReleaseOption === 'full') {
        setSnackbarMessage('Withdrawal request submitted with full staking release! It will be processed after admin approval.');
      } else {
        setSnackbarMessage('Withdrawal request submitted successfully! It will be processed after admin approval.');
      }

      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Reset form
      setAmount('');
      setAddress('');
      setAgreedToTerms(false);
      setStakingReleaseOption('none');

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

    // Check if this is a full withdrawal (within a small margin of error for floating point)
    const numValue = parseFloat(value);
    const maxPossibleAmount = balances[activeTab].balance - networkFee;
    const isFullAmount = !isNaN(numValue) &&
                         Math.abs(numValue - maxPossibleAmount) < 0.01;

    setIsFullWithdrawal(isFullAmount);
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

    // If this is a full withdrawal, show the unlock staking dialog
    if (isFullWithdrawal && dashboardData?.total_investment > 0) {
      // Initialize the dialog with default option - don't override if already set
      if (stakingReleaseOption === 'none') {
        setStakingReleaseOption('none');
      }
      setUnlockStakingOpen(true);
      return;
    }

    // Otherwise, proceed with normal withdrawal
    proceedWithWithdrawal();
  };

  // Handle unlock staking dialog close
  const handleUnlockStakingClose = (confirmed = false) => {
    setUnlockStakingOpen(false);

    if (confirmed) {
      // Determine the staking release amount based on the selected option
      let releaseAmount = 0;
      let releasePercentage = 0;

      if (stakingReleaseOption === 'partial') {
        releaseAmount = (dashboardData?.total_investment || 0) * 0.5;
        releasePercentage = 50;
      } else if (stakingReleaseOption === 'full' || stakingReleaseOption === 'wallet' || stakingReleaseOption === 'trade_wallet') {
        releaseAmount = dashboardData?.total_investment || 0;
        releasePercentage = 100;
      }

      if (stakingReleaseOption === 'wallet') {
        // For full wallet release, we call the dedicated API
        releaseStakingToWallet(false, false);
      } else if (stakingReleaseOption === 'trade_wallet') {
        // For full trade wallet release, we call the dedicated API
        releaseStakingToWallet(false, true);
      } else if (stakingReleaseOption === 'partial' && (!address || address.trim() === '')) {
        // For partial release to wallet (without withdrawal), we use a special API call
        releaseStakingToWallet(true, false);
      } else {
        // Proceed with withdrawal, passing the staking release information
        proceedWithWithdrawal(stakingReleaseOption, releaseAmount, releasePercentage);
      }
    } else {
      // Reset the staking release option when dialog is closed without confirmation
      setStakingReleaseOption('none');
    }
  };

  // Function to release staking to wallet
  const releaseStakingToWallet = (isPartial = false, toTradeWallet = false) => {
    setSubmittingReleaseToWallet(true);

    // Call the API to release staking to wallet
    let apiCall;

    if (isPartial) {
      // For partial release, we use the withdrawal API with special parameters
      apiCall = WalletService.requestWithdrawal({
        amount: 0.01, // Minimal amount to pass validation
        address: "", // Empty address
        currency: balances[activeTab].currency,
        stakingReleaseOption: 'partial',
        stakingReleaseAmount: dashboardData?.total_investment * 0.5 || 0,
        stakingReleasePercentage: 50
      });
    } else if (toTradeWallet) {
      // For full release to trade wallet, we use the dedicated API
      apiCall = WalletService.releaseStakingToTradeWallet();
    } else {
      // For full release to main wallet, we use the dedicated API
      apiCall = WalletService.releaseStakingToWallet();
    }

    apiCall.then(response => {
        console.log('Staking released:', response);

        // Show success message
        let successMsg;
        if (isPartial) {
          successMsg = `50% of your staking (${(dashboardData?.total_investment * 0.5).toFixed(2)} USDT) has been successfully released and added to your wallet balance without any conversion!`;
        } else if (toTradeWallet) {
          successMsg = `Your staking (${(dashboardData?.total_investment).toFixed(2)} USDT) has been successfully released and added to your trade wallet balance without any conversion!`;
        } else {
          successMsg = `Your staking (${(dashboardData?.total_investment).toFixed(2)} USDT) has been successfully released and added to your wallet balance without any conversion!`;
        }

        setSnackbarMessage(successMsg);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Reset form
        setAmount('');
        setAddress('');
        setAgreedToTerms(false);
        setStakingReleaseOption('none');

        // Refresh dashboard data to show updated balance
        setTimeout(() => {
          fetchDashboardData()
            .then(() => {
              console.log('Dashboard data refreshed successfully');
              setSubmittingReleaseToWallet(false);
            })
            .catch(error => {
              console.error('Error refreshing dashboard data:', error);
              setSubmittingReleaseToWallet(false);
            });
        }, 1000);
      })
      .catch(error => {
        console.error('Error releasing staking:', error);

        // Show error message
        setSnackbarMessage(error.msg || 'Failed to release staking. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setSubmittingReleaseToWallet(false);
      });
  };

  // Proceed with withdrawal after all checks
  const proceedWithWithdrawal = (releaseOption = 'none', releaseAmount = 0, releasePercentage = 0) => {
    // If we're only releasing staking to wallet or trade wallet, we don't need to submit a withdrawal
    if (releaseOption === 'wallet' || releaseOption === 'trade_wallet') {
      console.log('Releasing staking to wallet:', {
        stakingReleaseAmount: releaseAmount,
        stakingReleasePercentage: releasePercentage,
        toTradeWallet: releaseOption === 'trade_wallet'
      });

      // Call the API to release staking to wallet or trade wallet
      releaseStakingToWallet(false, releaseOption === 'trade_wallet');
      return;
    }

    // For partial or full withdrawal with staking release, or regular withdrawal
    console.log('Submitting withdrawal request:', {
      amount: parseFloat(amount) || 0,
      address: address,
      currency: balances[activeTab].currency,
      stakingReleaseOption: releaseOption,
      stakingReleaseAmount: releaseAmount,
      stakingReleasePercentage: releasePercentage
    });

    // Validate amount and address for actual withdrawals
    if ((releaseOption === 'partial' || releaseOption === 'full') && (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      // If we're only releasing staking (partial or full), we can set a minimal amount
      // This is a workaround for the backend validation
      const minimalAmount = 0.01;

      // Submit withdrawal request with staking release information
      submitWithdrawal({
        amount: minimalAmount,
        address: address,
        currency: balances[activeTab].currency,
        stakingReleaseOption: releaseOption,
        stakingReleaseAmount: releaseAmount,
        stakingReleasePercentage: releasePercentage
      });
    } else {
      // Normal withdrawal with or without staking release
      submitWithdrawal({
        amount: parseFloat(amount) || 0,
        address: address,
        currency: balances[activeTab].currency,
        stakingReleaseOption: releaseOption,
        stakingReleaseAmount: releaseAmount,
        stakingReleasePercentage: releasePercentage
      });
    }
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

  // Handle QR scanner open
  const handleOpenScanner = () => {
    setScannerOpen(true);

    // Reset error state
    setScannerError('');

    // We'll set permission in the QrReader component directly
    // This approach works better with the react-qr-reader library
    setHasPermission(true);
  };

  // Handle QR scanner close
  const handleCloseScanner = () => {
    setScannerOpen(false);
  };

  // Handle QR scan result
  const handleScanResult = (result) => {
    if (result) {
      console.log("QR Code detected:", result);

      // Extract address from QR code
      let scannedAddress = result?.text || '';

      // Log the scanned data for debugging
      console.log("Raw scanned data:", scannedAddress);

      // Clean up the address if needed (remove protocol, etc.)
      if (scannedAddress.includes(':')) {
        scannedAddress = scannedAddress.split(':').pop();
      }

      // Remove any whitespace
      scannedAddress = scannedAddress.trim();

      console.log("Processed address:", scannedAddress);

      // Only proceed if we have a valid-looking address
      if (scannedAddress && scannedAddress.length > 10) {
        // Set the address and validate it
        setAddress(scannedAddress);
        validateAddress(scannedAddress);

        // Close the scanner
        handleCloseScanner();

        // Show success message
        setSnackbarMessage('Address scanned successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        console.warn("Invalid QR code content detected");
        setScannerError('Invalid QR code. Please try scanning a valid cryptocurrency address.');
      }
    }
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
          boxShadow: mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
        }}
      >
        <IconButton onClick={handleBack} edge="start" sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">Withdraw</Typography>
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
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minWidth: 'auto',
            transition: 'all 0.2s ease',
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
            borderRadius: 3,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            position: 'relative',
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 35, 41, 0.95) 0%, rgba(26, 29, 35, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 250, 0.95) 100%)',
            boxShadow: mode === 'dark'
              ? '0 8px 16px rgba(0, 0, 0, 0.3)'
              : '0 8px 16px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
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
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 3,
                zIndex: 1,
                backdropFilter: 'blur(4px)',
              }}
            >
              <CircularProgress size={30} color="primary" />
            </Box>
          )}
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="img"
                  src={balances[activeTab].icon}
                  alt={balances[activeTab].currency}
                  sx={{
                    width: 48,
                    height: 48,
                    mr: 2,
                    borderRadius: '50%',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    border: `2px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)'}`,
                    p: 0.5,
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                  }}
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/48x48/${balances[activeTab].fallbackColor.replace('#', '')}/FFFFFF?text=${balances[activeTab].fallbackText}`;
                  }}
                />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                    Available Balance
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ my: 0.5 }}>
                    {balances[activeTab].balance} {balances[activeTab].currency}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ≈ ${balances[activeTab].usdValue.toFixed(2)} USD
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Refresh Balance">
                <IconButton
                  onClick={handleRefreshBalance}
                  disabled={refreshing}
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    '&:hover': {
                      backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    }
                  }}
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
            p: 3,
            borderRadius: 3,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            mb: 3,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 35, 41, 0.95) 0%, rgba(26, 29, 35, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 250, 0.95) 100%)',
            boxShadow: mode === 'dark'
              ? '0 8px 16px rgba(0, 0, 0, 0.3)'
              : '0 8px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
            Withdraw {balances[activeTab].currency}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Network: <span style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>BSC.BEP20</span> (Binance Smart Chain)
          </Typography>
          {dashboardData?.total_investment > 0 && (
            <Box sx={{ mb: 3, mt: 1 }}>
              <Alert
                severity="info"
                icon={<LockOpenIcon />}
                sx={{
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' },
                  '& .MuiAlert-icon': {
                    color: theme.palette.success.main,
                    opacity: 0.9,
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="medium">
                    You have <strong>${dashboardData.total_investment.toFixed(2)}</strong> in staked investment. Release it to add this amount to your wallet balance.
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<LockOpenIcon />}
                      onClick={() => {
                        // Set the option and open the dialog
                        setStakingReleaseOption('wallet');
                        setUnlockStakingOpen(true);

                        // Reset the amount and address fields since they're not needed for wallet release
                        setAmount('');
                        setAddress('');
                      }}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Release to Wallet
                    </Button>

                    {/* <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<LockOpenIcon />}
                      onClick={() => {
                        // Set the option and open the dialog
                        setStakingReleaseOption('trade_wallet');
                        setUnlockStakingOpen(true);

                        // Reset the amount and address fields since they're not needed for wallet release
                        setAmount('');
                        setAddress('');
                      }}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Release to Trade Wallet
                    </Button> */}
                  </Box>
                </Box>
              </Alert>
            </Box>
          )}

          {/* Address Field - Now on top */}
          <FormControl fullWidth error={!!errors.address} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1 }}>
              Recipient Address
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`Enter ${balances[activeTab].currency} address (BSC.BEP20)`}
              value={address}
              onChange={handleAddressChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                  },
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Scan QR Code">
                        <IconButton edge="end" onClick={handleOpenScanner} sx={{ color: theme.palette.primary.main }}>
                          <QrCodeIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }
              }}
            />
            {errors.address && (
              <FormHelperText sx={{ color: theme.palette.error.main, fontWeight: 'medium', ml: 0, mt: 1 }}>
                {errors.address}
              </FormHelperText>
            )}
          </FormControl>

          {/* Amount Field */}
          <FormControl fullWidth error={!!errors.amount} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1 }}>
              Amount
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`Enter ${balances[activeTab].currency} amount`}
              value={amount}
              onChange={handleAmountChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                  },
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleMaxAmount}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 1.5,
                          px: 2,
                          py: 0.5,
                          mr: 1,
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {dashboardData?.total_investment > 0 ? (
                          <>
                            <span>MAX</span>
                            <LockOpenIcon fontSize="small" sx={{ fontSize: 16, opacity: 0.8 }} />
                          </>
                        ) : (
                          'MAX'
                        )}
                      </Button>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {balances[activeTab].currency}
                      </Typography>
                    </InputAdornment>
                  ),
                }
              }}
            />
            {amount && !errors.amount && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                ≈ ${getAmountUsdValue()} USD
              </Typography>
            )}
            {errors.amount && (
              <FormHelperText sx={{ color: theme.palette.error.main, fontWeight: 'medium', ml: 0, mt: 1 }}>
                {errors.amount}
              </FormHelperText>
            )}
          </FormControl>

          {/* Network Fee */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1 }}>
              Network Fee (BSC.BEP20)
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight="medium">
                {networkFee} {balances[activeTab].currency}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ≈ ${networkFeeUsd} USD
              </Typography>
            </Box>
          </Box>

          {/* Terms and Conditions */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  color="primary"
                  sx={{
                    color: theme.palette.primary.main,
                  }}
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
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(51, 117, 187, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(51, 117, 187, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {submittingWithdrawal ? 'Processing...' : `Withdraw ${balances[activeTab].currency}`}
          </Button>
        </Paper>

        {/* QR Code Scanner Dialog */}
        <Dialog
          open={scannerOpen}
          onClose={handleCloseScanner}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                backgroundColor: '#000', // Always black background for better scanning
                backgroundImage: 'none',
                overflow: 'hidden',
              }
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
            p: 2,
            backgroundColor: '#000',
            color: '#fff',
          }}>
            <Typography variant="h6" fontWeight="bold">Scan QR Code</Typography>
            <IconButton onClick={handleCloseScanner} size="small" sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0, backgroundColor: '#000' }}>
            {hasPermission === false ? (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#000', color: '#fff' }}>
                <Typography color="error" sx={{ mb: 2 }}>
                  {scannerError || 'Camera permission denied'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleOpenScanner}
                  startIcon={<CameraIcon />}
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                >
                  Try Again
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  position: 'relative',
                  height: 400, // Increased height for better visibility
                  overflow: 'hidden',
                  backgroundColor: '#000',
                }}
              >
                <QrReader
                  constraints={{
                    facingMode: 'environment',
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    aspectRatio: 1.777777778,
                    frameRate: { max: 30 }
                  }}
                  onResult={handleScanResult}
                  scanDelay={100} // Faster scanning rate
                  videoId="qr-video"
                  className="qr-reader-element"
                  containerStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                  videoStyle={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: 'none', // Don't mirror the camera feed
                  }}
                  // Increase sensitivity for better detection
                  resolution={800}
                  torch={false}
                  ViewFinder={() => (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 220,
                        height: 220,
                        border: '3px solid #3375BB',
                        borderRadius: 2,
                        boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.7)',
                        zIndex: 10,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.7)', border: '3px solid #3375BB' },
                          '50%': { boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.8)', border: '3px solid #4285f4' },
                          '100%': { boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.7)', border: '3px solid #3375BB' },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 30,
                          height: 30,
                          borderTop: '3px solid #3375BB',
                          borderLeft: '3px solid #3375BB',
                          borderTopLeftRadius: 8,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 30,
                          height: 30,
                          borderBottom: '3px solid #3375BB',
                          borderRight: '3px solid #3375BB',
                          borderBottomRightRadius: 8,
                        }
                      }}
                    />
                  )}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Position the QR code within the frame to scan
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Make sure the QR code is well-lit and clearly visible
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{
            p: 2,
            borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
            justifyContent: 'space-between',
            backgroundColor: '#000',
          }}>
            <Button
              onClick={handleOpenScanner}
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{
                borderRadius: 2,
                px: 2,
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }
              }}
            >
              Rescan
            </Button>

            <Button
              onClick={handleCloseScanner}
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 'bold',
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Warning */}
        <Alert
          severity="warning"
          icon={<InfoIcon />}
          sx={{
            borderRadius: 3,
            mb: 3,
            p: 2,
            boxShadow: mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            backgroundColor: mode === 'dark' ? 'rgba(237, 108, 2, 0.1)' : 'rgba(237, 108, 2, 0.05)',
            border: `1px solid ${mode === 'dark' ? 'rgba(237, 108, 2, 0.2)' : 'rgba(237, 108, 2, 0.1)'}`,
            '& .MuiAlert-message': {
              width: '100%',
            },
            '& .MuiAlert-icon': {
              color: '#ED6C02',
              opacity: 0.9,
            }
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            Make sure the recipient address is correct and supports {balances[activeTab].currency} on the <strong>BSC.BEP20</strong> network. Sending to an incorrect address or network may result in permanent loss of funds.
          </Typography>
        </Alert>

        {/* Recent Withdrawals */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 35, 41, 0.95) 0%, rgba(26, 29, 35, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 250, 0.95) 100%)',
            boxShadow: mode === 'dark'
              ? '0 8px 16px rgba(0, 0, 0, 0.3)'
              : '0 8px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              Recent Withdrawals
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => navigate('/transaction-history')}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 'medium',
                px: 2,
              }}
            >
              View All
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              backgroundColor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              border: `1px dashed ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              No recent withdrawals found
            </Typography>
          </Box>
        </Paper>

        {/* Complete Withdrawal & Unlock Staking Dialog */}
        <Dialog
          open={unlockStakingOpen}
          onClose={() => handleUnlockStakingClose(false)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                p: 1,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              }
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 1
          }}>
            <LockOpenIcon color="warning" />
            <Typography variant="h6" fontWeight="bold">Staking Options</Typography>
          </DialogTitle>

          <DialogContent>
            <Alert
              severity="info"
              icon={<LockOpenIcon />}
              sx={{
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                You can release your staked investment to your wallet or proceed with a withdrawal.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Current staked investment: <strong>${dashboardData?.total_investment?.toFixed(2) || '0.00'} USDT</strong>
              </Typography>
            </Alert>

            <Box sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.warning.main}`,
              bgcolor: mode === 'dark' ? 'rgba(237, 108, 2, 0.1)' : 'rgba(237, 108, 2, 0.05)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LockOpenIcon color="warning" sx={{ mr: 1.5, fontSize: 28 }} />
                <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                  Staking Release Options
                </Typography>
              </Box>

              {/* Staking Release Options */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1.5 }}>
                  What would you like to do with your staked investment?
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Option 1: Release to Wallet - HIGHLIGHTED */}
                  <Box
                    onClick={() => {
                      setStakingReleaseOption('wallet');
                    }}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `2px solid ${theme.palette.success.main}`,
                      bgcolor: stakingReleaseOption === 'wallet' ?
                        (mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)') :
                        (mode === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.03)'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                      },
                      boxShadow: stakingReleaseOption === 'wallet' ? '0 4px 12px rgba(76, 175, 80, 0.2)' : 'none'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Radio
                          checked={stakingReleaseOption === 'wallet'}
                          onChange={() => {
                            setStakingReleaseOption('wallet');
                          }}
                          color="success"
                          sx={{ mr: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                            Release Staking to Wallet
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Move your staked funds to your available wallet balance
                          </Typography>

                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              bgcolor: 'success.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}>1</Box>
                            <Typography variant="body2">
                              Exact amount will be immediately available in your wallet (no conversion, no withdrawal needed)
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              bgcolor: 'success.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}>2</Box>
                            <Typography variant="body2">
                              You can use these funds for other purposes or reinvest later
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        ${(dashboardData?.total_investment || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Option 2: Release to Trade Wallet */}
                  {/* <Box
                    onClick={() => {
                      setStakingReleaseOption('trade_wallet');
                    }}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      bgcolor: stakingReleaseOption === 'trade_wallet' ?
                        (mode === 'dark' ? 'rgba(51, 117, 187, 0.15)' : 'rgba(51, 117, 187, 0.08)') :
                        (mode === 'dark' ? 'rgba(51, 117, 187, 0.05)' : 'rgba(51, 117, 187, 0.03)'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : 'rgba(51, 117, 187, 0.1)',
                      },
                      boxShadow: stakingReleaseOption === 'trade_wallet' ? '0 4px 12px rgba(51, 117, 187, 0.2)' : 'none',
                      mt: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Radio
                          checked={stakingReleaseOption === 'trade_wallet'}
                          onChange={() => {
                            setStakingReleaseOption('trade_wallet');
                          }}
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                            Release Staking to Trade Wallet
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Move your staked funds to your trade wallet balance
                          </Typography>

                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}>1</Box>
                            <Typography variant="body2">
                              Exact amount will be immediately available in your trade wallet (no conversion, no withdrawal needed)
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}>2</Box>
                            <Typography variant="body2">
                              You can use these funds for trading or reinvesting
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        ${(dashboardData?.total_investment || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box> */}

                </Box>
              </Box>

              {/* Warning for staking release */}
              {stakingReleaseOption !== 'none' && (
                <Alert
                  severity={
                    stakingReleaseOption === 'full' ? "warning" :
                    stakingReleaseOption === 'wallet' ? "success" : "info"
                  }
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    '& .MuiAlert-message': { width: '100%' }
                  }}
                >
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                    {stakingReleaseOption === 'full' ?
                      "Withdrawing your entire staked investment will:" :
                      stakingReleaseOption === 'wallet' ?
                      "Releasing your staked investment to wallet will:" :
                      "Withdrawing part of your staked investment will:"}
                  </Typography>

                  <Box component="ul" sx={{ pl: 2, mb: 0, mt: 0 }}>
                    {stakingReleaseOption === 'full' ? (
                      <>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Stop all future ROI and level ROI income
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Reset your investment status
                        </Typography>
                        <Typography component="li" variant="body2">
                          Require a new investment to restart earning
                        </Typography>
                      </>
                    ) : stakingReleaseOption === 'wallet' ? (
                      <>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Move your staked funds to your available wallet balance
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Stop all future ROI and level ROI income
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Allow you to use these funds for other purposes
                        </Typography>
                        <Typography component="li" variant="body2">
                          Let you reinvest later if you choose to
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Reduce your daily ROI by 50%
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                          Keep your investment status active
                        </Typography>
                        <Typography component="li" variant="body2">
                          Allow you to continue earning on the remaining investment
                        </Typography>
                      </>
                    )}
                  </Box>
                </Alert>
              )}
            </Box>

            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              {stakingReleaseOption === 'none'
                ? 'Your withdrawal will only include your available balance. Your staked investment will remain active.'
                : stakingReleaseOption === 'wallet'
                  ? 'Your staked investment will be moved to your available wallet balance. No withdrawal will be processed.'
                  : stakingReleaseOption === 'partial'
                    ? 'Your withdrawal will include your available balance plus 50% of your staked investment.'
                    : 'Your withdrawal will include your available balance plus your entire staked investment.'}
            </Typography>

            {stakingReleaseOption !== 'none' && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)' }}>
                <Typography variant="body2" fontWeight="bold" color="text.primary">
                  Summary:
                </Typography>

                {stakingReleaseOption === 'wallet' ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">Current wallet balance:</Typography>
                      <Typography variant="body2" fontWeight="medium">${(dashboardData?.wallet || 0).toFixed(2)} USDT</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Staking to be released:</Typography>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        +${(dashboardData?.total_investment || 0).toFixed(2)} USDT (exact amount, no conversion)
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">New wallet balance:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${((dashboardData?.wallet || 0) + (dashboardData?.total_investment || 0)).toFixed(2)} USDT
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
                      <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span style={{ fontWeight: 'bold' }}>Note:</span> The exact staking amount is released to your wallet without any conversion or fees. Your wallet balance will be increased by this amount.
                      </Typography>
                    </Box>
                  </>
                ) : stakingReleaseOption === 'trade_wallet' ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">Current trade wallet balance:</Typography>
                      <Typography variant="body2" fontWeight="medium">${(dashboardData?.wallet_topup || 0).toFixed(2)} USDT</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Staking to be released:</Typography>
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        +${(dashboardData?.total_investment || 0).toFixed(2)} USDT (exact amount, no conversion)
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">New trade wallet balance:</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        ${((dashboardData?.wallet_topup || 0) + (dashboardData?.total_investment || 0)).toFixed(2)} USDT
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(51, 117, 187, 0.08)', borderRadius: 1 }}>
                      <Typography variant="caption" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span style={{ fontWeight: 'bold' }}>Note:</span> The exact staking amount is released to your trade wallet without any conversion or fees. Your trade wallet balance will be increased by this amount.
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">Available balance:</Typography>
                      <Typography variant="body2" fontWeight="medium">${parseFloat(amount).toFixed(2)} USDT</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {stakingReleaseOption === 'partial' ? 'Staking release (50%):' : 'Staking release (100%):'}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${stakingReleaseOption === 'partial'
                          ? ((dashboardData?.total_investment || 0) * 0.5).toFixed(2)
                          : (dashboardData?.total_investment || 0).toFixed(2)} USDT (exact amount)
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">Total withdrawal:</Typography>
                      <Typography variant="body2" fontWeight="bold" color={stakingReleaseOption === 'full' ? 'error.main' : 'warning.main'}>
                        ${(parseFloat(amount) + (stakingReleaseOption === 'partial'
                          ? (dashboardData?.total_investment || 0) * 0.5
                          : (dashboardData?.total_investment || 0))).toFixed(2)} USDT
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button
              onClick={() => handleUnlockStakingClose(false)}
              variant="outlined"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1
              }}
            >
              Cancel
            </Button>
            {stakingReleaseOption === 'wallet' ? (
              <Button
                onClick={() => handleUnlockStakingClose(true)}
                variant="contained"
                color="success"
                disabled={submittingWithdrawal || submittingUnlockStaking || submittingReleaseToWallet}
                startIcon={<LockOpenIcon />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)'
                }}
              >
                {submittingWithdrawal || submittingUnlockStaking || submittingReleaseToWallet
                  ? 'Processing...'
                  : 'Release Staking to Wallet'
                }
              </Button>
            ) : stakingReleaseOption === 'trade_wallet' ? (
              <Button
                onClick={() => handleUnlockStakingClose(true)}
                variant="contained"
                color="primary"
                disabled={submittingWithdrawal || submittingUnlockStaking || submittingReleaseToWallet}
                startIcon={<LockOpenIcon />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: '0 4px 10px rgba(51, 117, 187, 0.3)'
                }}
              >
                {submittingWithdrawal || submittingUnlockStaking || submittingReleaseToWallet
                  ? 'Processing...'
                  : 'Release Staking to Trade Wallet'
                }
              </Button>
            ) : (
              <Button
                onClick={() => handleUnlockStakingClose(true)}
                variant="contained"
                color={
                  stakingReleaseOption === 'none'
                    ? "primary"
                    : stakingReleaseOption === 'partial'
                      ? "warning"
                      : "error"
                }
                disabled={submittingWithdrawal || submittingUnlockStaking || submittingReleaseToWallet}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 'bold'
                }}
              >
                {submittingWithdrawal || submittingUnlockStaking || submittingReleaseToWallet
                  ? 'Processing...'
                  : stakingReleaseOption === 'none'
                    ? 'Keep Staking Active'
                    : stakingReleaseOption === 'partial'
                      ? (address && address.trim() !== '' ? 'Withdraw & Release 50% Staking' : 'Release 50% Staking to Wallet')
                      : 'Withdraw & Release All Staking'
                }
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            '& .MuiSnackbarContent-root': {
              borderRadius: 2,
            }
          }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              fontWeight: 'medium',
            }}
            icon={snackbarSeverity === 'success' ? <CheckCircleIcon /> : undefined}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Withdraw;
