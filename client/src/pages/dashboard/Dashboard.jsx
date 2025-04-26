import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  InputBase,
  Skeleton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as WalletIcon,
  Explore as BrowserIcon,
  Add as AddIcon,
  Send as SendIcon,
  SwapHoriz as SwapIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ContentCopy as ContentCopyIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CreditCard as CreditCardIcon,
  Redeem as RedeemIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import EarningsChart from '../../components/dashboard/EarningsChart';
import TeamGrowthChart from '../../components/dashboard/TeamGrowthChart';
import useAuth from '../../hooks/useAuth';
import useData from '../../hooks/useData';
import { formatCurrency } from '../../utils/formatters';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import CryptoService, { CRYPTO_ASSETS } from '../../services/crypto.service';

const Dashboard = () => {
  const theme = useMuiTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    dashboardData,
    loadingDashboard,
    dashboardError,
    fetchDashboardData,
    userData,
    loadingUser
  } = useData()
  // State for active tab
  const [activeTab, setActiveTab] = useState(0);

  // State for wallet selection
  const [selectedWallet, setSelectedWallet] = useState('main'); // 'main' or 'topup'
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [walletMenuAnchor, setWalletMenuAnchor] = useState(null);

  // State for crypto prices
  const [cryptoPrices, setCryptoPrices] = useState([]);
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [cryptoError, setCryptoError] = useState(null);

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Handle wallet menu toggle
  const handleWalletMenuToggle = (event) => {
    setWalletMenuAnchor(event.currentTarget);
    setWalletMenuOpen(!walletMenuOpen);
  };

  // Handle wallet selection
  const handleWalletSelect = (walletType) => {
    setSelectedWallet(walletType);
    setWalletMenuOpen(false);
    setWalletMenuAnchor(null);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
    // Clear the crypto cache before fetching new prices
    CryptoService.clearCache();
    fetchCryptoPrices();
  };

  // Fetch cryptocurrency prices
  const fetchCryptoPrices = async () => {
    setLoadingCrypto(true);
    setCryptoError(null);
    try {
      const data = await CryptoService.getPrices();
      setCryptoPrices(data);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Don't show error to user since we're using fallback data
      // setCryptoError('Failed to load cryptocurrency prices');
    } finally {
      setLoadingCrypto(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Fetch user data and crypto prices on component mount
  useEffect(() => {
    fetchDashboardData(); // This will also fetch the latest user data
    fetchCryptoPrices();
  }, []);

  // Sample chart data (replace with actual data from API)
  const earningsChartData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      total: Math.random() * 100 + 50,
      roi: Math.random() * 50 + 25,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      total: Math.random() * 1000 + 500,
      roi: Math.random() * 500 + 250,
    })),
  };

  const teamGrowthData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      direct: Math.floor(Math.random() * 3),
      total: 10 + Math.floor(Math.random() * 5) + i,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      direct: Math.floor(Math.random() * 10) + i,
      total: 10 + Math.floor(Math.random() * 20) + i * 3,
    })),
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {dashboardError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {dashboardError}
        </Alert>
      )}

      {/* Search Bar - Trust Wallet Style */}
      <Box
        sx={{
          mb: 2,
          px: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          borderRadius: { xs: 4, sm: 8 },
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          height: 48,
          width: '100%'
        }}
      >
        <SearchIcon sx={{ ml: { xs: 1, sm: 2 }, color: theme.palette.text.secondary }} />
        <InputBase
          placeholder="Search"
          sx={{
            ml: 1,
            flex: 1,
            color: theme.palette.text.primary,
            '& .MuiInputBase-input': {
              p: 1,
            }
          }}
        />
      </Box>

      {/* Wallet Selector - Trust Wallet Style */}
      <Box sx={{ mb: 2, px: { xs: 1, sm: 2 }, width: '100%' }}>
        <Box
          id="wallet-selector"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: { xs: 1, sm: 1.5 },
            borderRadius: 2,
            cursor: 'pointer',
            width: '100%',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }
          }}
          onClick={handleWalletMenuToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                mr: 1,
                flexShrink: 0,
              }}
            >
              <WalletIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight="medium" noWrap>
              {selectedWallet === 'main' ? 'Main wallet' : 'Spot wallet'}
            </Typography>
            <KeyboardArrowDownIcon sx={{ ml: 0.5, color: theme.palette.text.secondary, flexShrink: 0 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Tooltip title="Copy Address">
              <IconButton
                size="small"
                sx={{ mr: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening the wallet menu
                  const walletAddress = "0x" + Math.random().toString(16).slice(2, 10) + "..."; // Mock address
                  navigator.clipboard.writeText(walletAddress)
                    .then(() => {
                      showSnackbar('Wallet address copied to clipboard!', 'success');
                    })
                    .catch((error) => {
                      console.error('Failed to copy: ', error);
                      showSnackbar('Failed to copy wallet address', 'error');
                    });
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Balance">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening the wallet menu
                  handleRefresh();
                }}
                size="small"
              >
                {loadingDashboard ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Wallet Selection Menu */}
        <Menu
          anchorEl={walletMenuAnchor}
          open={walletMenuOpen}
          onClose={() => {
            setWalletMenuOpen(false);
            setWalletMenuAnchor(null);
          }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                width: 220,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }
          }}
        >
          <MenuItem
            onClick={() => handleWalletSelect('main')}
            selected={selectedWallet === 'main'}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <WalletIcon fontSize="small" color={selectedWallet === 'main' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  fontWeight={selectedWallet === 'main' ? 'bold' : 'medium'}
                  color={selectedWallet === 'main' ? 'primary' : 'inherit'}
                >
                  Main Wallet
                </Typography>
              }
              secondary={`Balance: ${formatCurrency(dashboardData?.wallet_balance || 0)}`}
            />
          </MenuItem>
          <MenuItem
            onClick={() => handleWalletSelect('topup')}
            selected={selectedWallet === 'topup'}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <WalletIcon fontSize="small" color={selectedWallet === 'topup' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  fontWeight={selectedWallet === 'topup' ? 'bold' : 'medium'}
                  color={selectedWallet === 'topup' ? 'primary' : 'inherit'}
                >
                  Spot Wallet
                </Typography>
              }
              secondary={`Balance: ${formatCurrency(dashboardData?.topup_wallet_balance || 0)}`}
            />
          </MenuItem>
        </Menu>
      </Box>

      {/* Wallet Balance Card - Trust Wallet Style */}
      <Card
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 3 },
          mb: 3,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.card,
          color: theme.palette.text.primary,
          position: 'relative',
          border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative' }}>
          <Typography
            variant="h4"
            component="div"
            fontWeight="bold"
            align="center"
            sx={{
              mb: 1,
            }}
          >
            {selectedWallet === 'main'
              ? formatCurrency(dashboardData?.wallet_balance || 0)
              : formatCurrency(dashboardData?.topup_wallet_balance || 0)
            }
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/withdraw')}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.actionButton,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}
              >
                <ArrowUpwardIcon />
              </Box>
              <Typography variant="body2">Send</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/deposit')}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.actionButton,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}
              >
                <ArrowDownwardIcon />
              </Box>
              <Typography variant="body2">Receive</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/buy-package')}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.actionButton,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}
              >
                <CreditCardIcon />
              </Box>
              <Typography variant="body2">Buy</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/daily-roi-history')}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.actionButton,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}
              >
                <RedeemIcon />
              </Box>
              <Typography variant="body2">Earn</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Add Funds Banner - Trust Wallet Style */}
      <Card
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 3 },
          mb: 3,
          overflow: 'hidden',
          backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.1)' : 'rgba(51, 117, 187, 0.05)',
          border: '1px solid rgba(51, 117, 187, 0.2)',
          position: 'relative',
        }}
      >
        <CardContent sx={{ p: 2, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
                alt="Exchange"
                sx={{
                  width: 40,
                  height: 40,
                  mr: 2,
                  borderRadius: 1,
                  backgroundColor: '#2775CA15',
                  padding: 0.5
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/40x40/3375BB/FFFFFF?text=HT';
                }}
              />
              <Box>
                <Typography variant="subtitle2">
                  Add funds from exchange
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                  onClick={() => navigate('/deposit')}
                >
                  Deposit now →
                </Button>
              </Box>
            </Box>
            <IconButton size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs - Trust Wallet Style */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            mb: 2,
          }}
        >
          <Tab label="Crypto" />
          <Tab label="NFTs" />
          <Tab label="Live Trading" />
        </Tabs>

        {/* Crypto Tab Content */}
        {activeTab === 0 && (
          <Box sx={{ p: 0 }}>
            {/* Crypto Assets */}
            <Box sx={{ px: 2 }}>
              {/* Error Message */}
              {cryptoError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {cryptoError}
                </Alert>
              )}

              {/* Loading State */}
              {loadingCrypto && cryptoPrices.length === 0 && (
                Array.from({ length: 5 }).map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 2,
                      borderBottom: index < 4 ? `1px solid ${theme.palette.divider}` : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                      <Box>
                        <Skeleton variant="text" width={80} height={24} />
                        <Skeleton variant="text" width={40} height={16} />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Skeleton variant="text" width={60} height={24} />
                      <Skeleton variant="text" width={80} height={16} />
                    </Box>
                  </Box>
                ))
              )}

              {/* Crypto List */}
              {!loadingCrypto && CRYPTO_ASSETS.map((asset, index) => {
                const cryptoData = cryptoPrices.find(crypto => crypto.id === asset.id) || {};
                const isLastItem = index === CRYPTO_ASSETS.length - 1;

                // Mock balances - in a real app, these would come from the user's wallet
                const walletBalance = selectedWallet === 'main'
                  ? parseFloat(dashboardData?.wallet_balance || 0)
                  : parseFloat(dashboardData?.topup_wallet_balance || 0);

                const mockBalances = {
                  'tether': walletBalance,
                  'bitcoin': 0.00,
                  'ethereum': 0.00,
                  'binancecoin': 0.00,
                  'matic-network': 0.00,
                  'usd-coin': 0.00,
                };

                const balance = mockBalances[asset.id] || 0;
                const usdValue = balance * (cryptoData.current_price || 0);

                return (
                  <Box
                    key={asset.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 2,
                      borderBottom: !isLastItem ? `1px solid ${theme.palette.divider}` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        component="img"
                        src={asset.image}
                        alt={asset.name}
                        sx={{
                          width: 40,
                          height: 40,
                          mr: 2,
                          borderRadius: '50%',
                        }}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/40x40/${asset.fallbackColor.replace('#', '')}/FFFFFF?text=${asset.fallbackText}`;
                        }}
                      />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {asset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.symbol.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight="bold">
                        {balance.toLocaleString(undefined, {
                          minimumFractionDigits: asset.id === 'tether' || asset.id === 'usd-coin' ? 2 :
                                                 balance < 1 ? 4 : 2,
                          maximumFractionDigits: asset.id === 'tether' || asset.id === 'usd-coin' ? 2 :
                                                 balance < 1 ? 4 : 2
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${usdValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}

              {/* Price Update Indicator */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  {loadingCrypto ? (
                    <>
                      <CircularProgress size={12} sx={{ mr: 1 }} />
                      Updating prices...
                    </>
                  ) : (
                    <>
                      Prices updated {new Date().toLocaleTimeString()}
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* NFTs Tab Content */}
        {activeTab === 1 && (
          <Box sx={{ p: 0 }}>
            {/* NFTs Content */}
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                No NFTs found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 300 }}>
                Your NFT collection will appear here
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                size="small"
              >
                Browse NFTs
              </Button>
            </Box>
          </Box>
        )}

        {/* Live Trading Tab Content */}
        {activeTab === 2 && (
          <Box sx={{ p: 0 }}>
            <Box sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
              background: mode === 'dark' ? 'rgba(51, 117, 187, 0.05)' : 'rgba(255, 255, 255, 1)',
              borderRadius: 2,
              border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : '#E6E8EA'}`,
              boxShadow: mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: mode === 'dark'
                  ? 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.1), transparent 70%)'
                  : 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.05), transparent 70%)',
                zIndex: 0,
              },
            }}>
              <Box sx={{
                width: '100%',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                <Typography variant="h6" color={mode === 'dark' ? theme.palette.primary.main : '#000'} sx={{ mb: 2, fontWeight: 600 }}>
                  Start Your Trading Journey
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                  Access our advanced trading platform with real-time market data, price jumpers, and automated trading features to earn daily profit
                </Typography>

                {/* Market Trend Visualization Preview */}
                <Box sx={{
                  height: 120,
                  width: '100%',
                  maxWidth: 500,
                  mx: 'auto',
                  mb: 3,
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: '#12151c',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 30% 30%, rgba(51, 117, 187, 0.2), transparent 70%)',
                    opacity: 0.8,
                    animation: 'pulse 8s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.5 },
                      '50%': { opacity: 0.8 },
                      '100%': { opacity: 0.5 },
                    },
                  }} />

                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    zIndex: 1,
                  }} />

                  <Box component="svg" viewBox="0 0 500 120" preserveAspectRatio="none" sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 2,
                  }}>
                    <Box component="path"
                      d="M0,60 L50,55 L100,65 L150,50 L200,60 L250,40 L300,45 L350,30 L400,20 L450,10 L500,5"
                      sx={{
                        fill: 'none',
                        stroke: '#0ecb81',
                        strokeWidth: 2,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeDasharray: 1000,
                        strokeDashoffset: 1000,
                        animation: 'drawLine 3s forwards',
                        '@keyframes drawLine': {
                          '0%': { strokeDashoffset: 1000 },
                          '100%': { strokeDashoffset: 0 },
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    display: 'flex',
                    gap: 1,
                    zIndex: 3,
                  }}>
                    <Box sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: 'rgba(0, 0, 0, 0.5)',
                      padding: '2px 6px',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#f0b90b',
                      }} />
                      BTC/USDT
                    </Box>
                    <Box sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#0ecb81',
                      background: 'rgba(0, 0, 0, 0.5)',
                      padding: '2px 6px',
                      borderRadius: 1,
                    }}>
                      +12.45%
                    </Box>
                  </Box>

                  <Box sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 3,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#0ecb81',
                    textShadow: '0 0 10px rgba(14, 203, 129, 0.5)',
                  }}>
                    +458.72 USDT
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/live-trading')}
                  sx={{
                    backgroundColor: '#3375BB',
                    backgroundImage: 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)',
                    px: 4,
                    py: 1.5,
                    borderRadius: 6,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 8px 16px rgba(51, 117, 187, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                      animation: 'shine 2s infinite',
                      '@keyframes shine': {
                        '0%': { left: '-100%' },
                        '100%': { left: '100%' },
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#2A5F9E',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 20px rgba(51, 117, 187, 0.4)',
                    },
                  }}
                >
                  Activate Daily Profit
                </Button>
              </Box>
            </Box>
          </Box>
        )}

      </Box>

      {/* Quick Actions - Trust Wallet Style */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 0, sm: 3 },
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Quick Actions
            </Typography>
            <Button
              variant="text"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              size="small"
              sx={{ textTransform: 'none', display: { xs: 'none', sm: 'flex' } }}
              onClick={() => navigate('/transaction-history')}
            >
              View All
            </Button>
          </Box>

          {/* Main Quick Actions - Always Visible */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/buy-package')}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                    mb: 1,
                  }}
                >
                  <ShoppingCartIcon />
                </Box>
                <Typography variant="caption" align="center">
                  Buy
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/deposit')}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                    mb: 1,
                  }}
                >
                  <AddIcon />
                </Box>
                <Typography variant="caption" align="center">
                  Deposit
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/withdraw')}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                    mb: 1,
                  }}
                >
                  <SendIcon />
                </Box>
                <Typography variant="caption" align="center">
                  Withdraw
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={3}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // Use userData from useData hook which is always up-to-date
                  // The API returns username as the referral code
                  const referralCode = userData?.sponsorID;
                  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

                  if (!referralCode) {
                    showSnackbar('Unable to get your referral code. Please refresh the page.', 'error');
                    return;
                  }

                  navigator.clipboard.writeText(referralLink)
                    .then(() => {
                      showSnackbar(`Referral link with code "${referralCode}" copied to clipboard!`, 'success');
                    })
                    .catch((error) => {
                      console.error('Failed to copy: ', error);
                      showSnackbar('Failed to copy referral link', 'error');
                    });
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${theme.palette.primary.main}15`,
                    color: theme.palette.primary.main,
                    mb: 1,
                  }}
                >
                  <PeopleIcon />
                </Box>
                <Typography variant="caption" align="center">
                  Invite
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Additional Quick Actions - Mobile Only */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              History & Reports
            </Typography>

            <Grid container spacing={2}>
              {/* Investment History */}
              <Grid item xs={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/investment-history')}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette.secondary.main}15`,
                      color: theme.palette.secondary.main,
                      mb: 1,
                    }}
                  >
                    <ShoppingCartIcon />
                  </Box>
                  <Typography variant="caption" align="center">
                    Investments
                  </Typography>
                </Box>
              </Grid>

              {/* ROI History */}
              <Grid item xs={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/daily-roi-history')}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette.secondary.main}15`,
                      color: theme.palette.secondary.main,
                      mb: 1,
                    }}
                  >
                    <TrendingUpIcon />
                  </Box>
                  <Typography variant="caption" align="center">
                    ROI History
                  </Typography>
                </Box>
              </Grid>

              {/* Transaction History */}
              <Grid item xs={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/transaction-history')}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette.secondary.main}15`,
                      color: theme.palette.secondary.main,
                      mb: 1,
                    }}
                  >
                    <SwapIcon />
                  </Box>
                  <Typography variant="caption" align="center">
                    Transactions
                  </Typography>
                </Box>
              </Grid>

              {/* Transfer History */}
              <Grid item xs={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate('/transfer-history')}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: `${theme.palette.secondary.main}15`,
                      color: theme.palette.secondary.main,
                      mb: 1,
                    }}
                  >
                    <SwapIcon />
                  </Box>
                  <Typography variant="caption" align="center">
                    Transfers
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Team & Earnings
              </Typography>

              <Grid container spacing={2}>
                {/* Team Structure */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/team')}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.info.main}15`,
                        color: theme.palette.info.main,
                        mb: 1,
                      }}
                    >
                      <PeopleIcon />
                    </Box>
                    <Typography variant="caption" align="center">
                      Team
                    </Typography>
                  </Box>
                </Grid>

                {/* Direct Team */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/direct-team')}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.info.main}15`,
                        color: theme.palette.info.main,
                        mb: 1,
                      }}
                    >
                      <PeopleIcon />
                    </Box>
                    <Typography variant="caption" align="center">
                      Direct Team
                    </Typography>
                  </Box>
                </Grid>

                {/* Level Income */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/level-roi-income')}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.info.main}15`,
                        color: theme.palette.info.main,
                        mb: 1,
                      }}
                    >
                      <TrendingUpIcon />
                    </Box>
                    <Typography variant="caption" align="center">
                      Level Income
                    </Typography>
                  </Box>
                </Grid>

                {/* Direct Income */}
                <Grid item xs={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/direct-income')}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: `${theme.palette.info.main}15`,
                        color: theme.palette.info.main,
                        mb: 1,
                      }}
                    >
                      <TrendingUpIcon />
                    </Box>
                    <Typography variant="caption" align="center">
                      Direct Income
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Paper>


      {/* News & Announcements - Trust Wallet Style */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 0, sm: 3 },
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              News & Announcements
            </Typography>
            <Button
              variant="text"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          </Box>

          {/* News Item 1 */}
          <Box
            sx={{
              display: 'flex',
              p: 1.5,
              mb: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(51, 117, 187, 0.05)',
              border: '1px solid rgba(51, 117, 187, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
              },
            }}
          >
            <Box
              component="img"
              src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png"
              alt="News"
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                mr: 2,
                objectFit: 'cover',
                backgroundColor: '#F7931A15',
                padding: 1,
              }}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/60x60/3375BB/FFFFFF?text=News";
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                New Investment Packages Available
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Check out our new investment packages with higher ROI rates and better rewards.
              </Typography>
            </Box>
          </Box>

          {/* News Item 2 */}
          <Box
            sx={{
              display: 'flex',
              p: 1.5,
              mb: 1.5,
              borderRadius: 2,
              backgroundColor: 'rgba(51, 117, 187, 0.05)',
              border: '1px solid rgba(51, 117, 187, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
              },
            }}
          >
            <Box
              component="img"
              src="https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"
              alt="News"
              sx={{
                width: 60,
                height: 60,
                borderRadius: 1,
                mr: 2,
                objectFit: 'cover',
                backgroundColor: '#F3BA2F15',
                padding: 1,
              }}
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/60x60/0ECB81/FFFFFF?text=News";
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Referral Program Update
              </Typography>
              <Typography variant="caption" color="text.secondary">
                We've improved our referral program with better commissions and more levels.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Charts - Only show on larger screens */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            mb: 3,
            overflow: 'hidden',
            p: 2,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Performance Analytics
          </Typography>
          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid item sx={{ width: { lg: '48%',md : "50%", sm : "50%",xs : "100%" } }}>
              <EarningsChart data={earningsChartData} />
            </Grid>
            <Grid item sx={{ width: { lg: '49%',md : "50%", sm : "50%",xs : "100%" } }}>
              <TeamGrowthChart data={teamGrowthData} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
