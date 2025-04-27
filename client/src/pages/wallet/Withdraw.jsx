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
  useMediaQuery,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      // Extract address from QR code
      let scannedAddress = result?.text || '';

      // Clean up the address if needed (remove protocol, etc.)
      if (scannedAddress.includes(':')) {
        scannedAddress = scannedAddress.split(':').pop();
      }

      // Set the address and validate it
      setAddress(scannedAddress);
      validateAddress(scannedAddress);

      // Close the scanner
      handleCloseScanner();

      // Show success message
      setSnackbarMessage('Address scanned successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
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
                    e.target.src = balances[activeTab].placeholder;
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
          <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 3 }}>
            Withdraw {balances[activeTab].currency}
          </Typography>

          {/* Address Field - Now on top */}
          <FormControl fullWidth error={!!errors.address} sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ mb: 1 }}>
              Recipient Address
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={`Enter ${balances[activeTab].currency} address`}
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
                        }}
                      >
                        MAX
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
              Network Fee
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
                backgroundColor: mode === 'dark' ? '#1E2329' : '#FFFFFF',
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
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            p: 2,
          }}>
            <Typography variant="h6" fontWeight="bold">Scan QR Code</Typography>
            <IconButton onClick={handleCloseScanner} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0 }}>
            {hasPermission === false ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error" sx={{ mb: 2 }}>
                  {scannerError || 'Camera permission denied'}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleOpenScanner}
                  startIcon={<CameraIcon />}
                >
                  Try Again
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  position: 'relative',
                  height: 350,
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
                  scanDelay={300}
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
                    transform: isMobile ? 'scaleX(-1)' : 'none', // Mirror for front camera on mobile
                  }}
                  ViewFinder={() => (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 200,
                        height: 200,
                        border: '2px solid #3375BB',
                        borderRadius: 2,
                        boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.5)',
                        zIndex: 10,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 20,
                          height: 20,
                          borderTop: '2px solid #3375BB',
                          borderLeft: '2px solid #3375BB',
                          borderTopLeftRadius: 8,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 20,
                          height: 20,
                          borderBottom: '2px solid #3375BB',
                          borderRight: '2px solid #3375BB',
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
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: '#FFFFFF',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2">
                    Position the QR code within the frame
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{
            p: 2,
            borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            justifyContent: 'center',
          }}>
            <Button
              onClick={handleCloseScanner}
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: 2,
                px: 3,
              }}
            >
              Cancel
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
            Make sure the recipient address is correct and supports {balances[activeTab].currency} on the {balances[activeTab].currency} network. Sending to an incorrect address may result in permanent loss of funds.
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
