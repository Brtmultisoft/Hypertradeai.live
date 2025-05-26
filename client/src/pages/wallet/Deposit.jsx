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
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import useData from '../../hooks/useData';
import WalletService from '../../services/wallet.service';
import { QRCodeSVG } from 'qrcode.react';

const Deposit = () => {
  const theme = useMuiTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const { fetchDashboardData } = useData();

  // Wallet state
  const [wallet, setWallet] = useState({
    address: '',
    privateKey: '',
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isExistingWallet, setIsExistingWallet] = useState(false);
  const [monitoringResult, setMonitoringResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Network options with USDT as the main option
  const networks = [
    {
      name: 'USDT (BEP20)',
      value: 'bep20',
      icon: 'https://static-00.iconduck.com/assets.00/tether-cryptocurrency-icon-2048x2048-dp13oydi.png',
      placeholder: 'https://via.placeholder.com/40x40/26A17B/FFFFFF?text=USDT'
    },
  ];

  // Fetch dashboard data and check for existing wallet on component mount
  useEffect(() => {
    fetchDashboardData();

    // Automatically check for existing wallet or generate a new one
    const initializeWallet = async () => {
      try {
        setIsMonitoring(true); // Use monitoring state for loading indicator
        const response = await WalletService.generateWallet();

        if (response.status && response.wallet) {
          setWallet({
            address: response.wallet.address,
            privateKey: response.wallet.privateKey,
          });

          // If this is a new wallet, save it to the user's account
          if (!response.existing) {
            await saveWalletToAccount(response.wallet.address, response.wallet.privateKey);
          } else {
            setIsExistingWallet(true);
            setSuccessMessage('Using your existing wallet address');
            setShowSnackbar(true);
          }
        }
      } catch (err) {
        console.error('Error initializing wallet:', err);
        setError(err.message || 'Failed to initialize wallet');
        setShowSnackbar(true);
      } finally {
        setIsMonitoring(false);
      }
    };

    initializeWallet();
  }, [fetchDashboardData]);

  // This section has been removed as we now initialize the wallet automatically

  // Save wallet to user account
  const saveWalletToAccount = async (walletAddress, walletPrivateKey) => {
    try {
      const response = await WalletService.saveWallet({
        walletAddress,
        walletPrivateKey,
      });

      if (response.status) {
        setIsExistingWallet(true);
        setSuccessMessage('Wallet saved successfully');
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error('Error saving wallet:', err);
      setError(err.message || 'Failed to save wallet');
      setShowSnackbar(true);
    }
  };

  // Start monitoring the wallet for deposits
  const handleStartMonitoring = async () => {
    if (!wallet.address || !wallet.privateKey) {
      setError('No wallet available to monitor');
      setShowSnackbar(true);
      return;
    }

    try {
      setIsMonitoring(true);
      setError(null);

      const response = await WalletService.startMonitoring({
        walletAddress: wallet.address,
        walletPrivateKey: wallet.privateKey,
      });

      if (response.status) {
        setMonitoringResult(response.result);

        if (response.result && response.result.found) {
          // The server-side monitoring already creates a deposit record and updates the user's wallet
          // We don't need to create another deposit record, just show the success message
          setSuccessMessage(`Deposit of ${response.result.amount} ${response.result.currency} detected and added to your account!`);
          fetchDashboardData(); // Refresh dashboard data to show updated balance

          // If for some reason the server didn't create a deposit record (which shouldn't happen),
          // we could add a fallback here, but it's better to fix the server-side code if that's the case

          // Log the transaction details for debugging
          console.log('Deposit details:', {
            amount: response.result.amount,
            currency: response.result.currency,
            txid: response.result.txid || response.result.transactionHash || 'No transaction ID available',
          });
        } else {
          setSuccessMessage('Monitoring completed. No deposits detected.');
        }
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error('Error monitoring wallet:', err);
      setError(err.message || 'Failed to monitor wallet');
      setShowSnackbar(true);
    } finally {
      setIsMonitoring(false);
    }
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  const handleCopyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>

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
        <Typography variant="h6">Deposit</Typography>
      </Box>

      {/* Network Selection Tabs */}
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
        {networks.map((network) => (
          <Tab key={network.value} label={network.name} />
        ))}
      </Tabs>

      {/* Main Content */}
      <Box sx={{ px: 2 }}>
        {/* Wallet Actions */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Wallet Actions
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SyncIcon />}
                onClick={handleStartMonitoring}
                disabled={isMonitoring || !wallet.address}
                fullWidth
                size="large"
                sx={{ py: 1.5 }}
              >
                {isMonitoring ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Update Payment Status'
                )}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}

            {monitoringResult && monitoringResult.found && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Deposit of {monitoringResult.amount} {monitoringResult.currency} detected!
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, alignSelf: 'flex-start' }}>
              <Box
                component="img"
                src={networks[activeTab].icon}
                alt={networks[activeTab].name}
                sx={{
                  width: 24,
                  height: 24,
                  mr: 1,
                  borderRadius: '50%',
                }}
                onError={(e) => {
                  e.target.src = networks[activeTab].placeholder;
                }}
              />
              <Typography variant="subtitle2" color="text.secondary">
                {networks[activeTab].name} Deposit Address
              </Typography>
            </Box>

            {/* QR Code */}
            <Box
              sx={{
                width: 200,
                height: 200,
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                p: 2,
                borderRadius: 2,
                position: 'relative',
              }}
            >
              {wallet.address ? (
                <QRCodeSVG
                  value={wallet.address}
                  size={180}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="H"
                  margin={0}
                />
              ) : (
                <QrCodeIcon sx={{ fontSize: 150, color: '#000' }} />
              )}
              <Box
                component="img"
                src={networks[activeTab].icon}
                alt={networks[activeTab].name}
                sx={{
                  width: 40,
                  height: 40,
                  position: 'absolute',
                  borderRadius: '50%',
                  border: '2px solid white',
                  backgroundColor: 'white',
                }}
                onError={(e) => {
                  e.target.src = networks[activeTab].placeholder;
                }}
              />
            </Box>

            {/* Address */}
            <TextField
              fullWidth
              variant="outlined"
              value={wallet.address || 'Generate a wallet to get your deposit address'}
              inputProps={{
                readOnly: true,
              }}
              InputLabelProps={{ shrink: true }}
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                }
              }}
              InputProps={{
                endAdornment: wallet.address ? (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? "Copied!" : "Copy Address"}>
                      <IconButton onClick={handleCopyAddress} edge="end">
                        {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              }}
            />

            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{
                width: '100%',
                borderRadius: 2,
                '& .MuiAlert-message': {
                  width: '100%',
                }
              }}
            >
              <Typography variant="body2">
                Only send {networks[activeTab].name} tokens to this address. Sending any other tokens may result in permanent loss.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Instructions */}
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
            How to Deposit
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                1
              </Box>
              <Typography variant="body2">
                Copy the deposit address or scan the QR code with your wallet app.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                2
              </Box>
              <Typography variant="body2">
                Send only {networks[activeTab].name} tokens to this address from your external wallet or exchange.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                3
              </Box>
              <Typography variant="body2">
                After sending, the deposit will be credited to your account once it receives the required number of network confirmations.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Recent Deposits */}
        {/* <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Recent Deposits
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
              No recent deposits found
            </Typography>
          </Box>
        </Paper> */}
      </Box>
    </Box>
  );
};

export default Deposit;
