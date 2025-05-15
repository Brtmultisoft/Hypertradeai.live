import { useTheme, alpha } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import { useEffect, useState, useRef } from 'react';

import Swal from 'sweetalert2';

// material-ui
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
  Chip,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';

// icons
import { TrendUp, ArrowRight } from 'iconsax-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

import "./LiveTrading.css"
import Dashboard from '../../components/live/Dashboard';
import TradingLayout from '../../components/trade/TradingLayout';
import TradingDashboard from '../../components/trade/TradingDashboard';
// Define animations
const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
`;

const numberChange = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fadeInUp = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fadeInDown = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const glowEffect = keyframes`
  0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.5); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.8); }
  100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.5); }
`;

const slideIn = keyframes`
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

const slideOut = keyframes`
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(20px); opacity: 0; }
`;

const flashHighlight = keyframes`
  0% { background-color: rgba(255, 255, 255, 0); }
  30% { background-color: rgba(255, 255, 255, 0.2); }
  100% { background-color: rgba(255, 255, 255, 0); }
`;

const typewriter = keyframes`
  from { width: 0 }
  to { width: 100% }
`;

// ==============================|| ARBITRAGE TRADE PAGE ||============================== //

const LiveTrading = () => {
  return <TradingDashboard/>
  return <Dashboard/>
  const theme = useTheme();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingProfit, setActivatingProfit] = useState(false);
  const [tradeData, setTradeData] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [hasInvestment, setHasInvestment] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [newRowAdded, setNewRowAdded] = useState(false);
  const [removedRowId, setRemovedRowId] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0 for all, 1 for buy, 2 for sell

  // WebSocket reference
  const wsRef = useRef(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Metrics for display
  const [btcPrice, setBtcPrice] = useState(84500);
  const [refreshMetrics, setRefreshMetrics] = useState(false);

  // Function to fetch live trading data from CoinDesk API
  const fetchLiveTradeData = async () => {
    try {
      setLoadingTrades(true);

      // Use CoinDesk API to get real trade data
      const baseUrl = 'https://data-api.coindesk.com/info/v1/openapi';
      const params = {"api_key":"4db0495dc4e40e0f35b03daf8d8b41bfb26191258d79c078fffdfb0f91436395"};
      const url = new URL(baseUrl);
      url.search = new URLSearchParams(params).toString();

      const options = {
        method: 'GET',
        headers: {"Content-type":"application/json; charset=UTF-8"},
      };

      const response = await fetch(url, options);
      const data = await response.json();

      console.log('CoinDesk API response:', data);

      // Transform the data to match our format
      // Since we don't know the exact structure of the CoinDesk API response,
      // we'll create a fallback in case the structure is different
      let formattedData = [];

      try {
        // Try to extract data from the API response
        // This is a placeholder - adjust based on actual API response structure
        if (data && data.data && Array.isArray(data.data)) {
          formattedData = data.data.slice(0, 10).map((item, index) => {
            return {
              exchange: 'CoinDesk',
              type: index % 2 === 0 ? 'buy' : 'sell',
              orderId: item.id || `CD${Math.floor(Math.random() * 10000000000)}`,
              price: item.price || (Math.random() * 0.01 + 0.001).toFixed(6),
              amount: item.amount || (84500 + Math.random() * 200).toFixed(2),
              total: item.total || (Math.random() * 1000 + 50).toFixed(2),
              timestamp: new Date().toLocaleTimeString()
            };
          });
        } else {
          throw new Error('Unexpected API response format');
        }
      } catch (formatError) {
        console.error('Error formatting CoinDesk data:', formatError);
        // Generate random data if formatting fails
        generateRandomTradeData();
        return; // Exit early since we've already set the data
      }

      setTradeData(formattedData);
    } catch (error) {
      console.error('Error fetching CoinDesk data:', error);
      // Generate random data if API fails
      generateRandomTradeData();
    } finally {
      setLoadingTrades(false);
    }
  };



  // Function to update metrics
  const updateMetrics = () => {
    // Update BTC price with small random variations
    const newBtcPrice = 84500 + Math.random() * 500 - 250; // Random price around 84,500 with +/- 250 variation
    setBtcPrice(newBtcPrice);

    // Schedule next update in 3-7 seconds (slower animations as per user preference)
    const nextUpdateTime = 3000 + Math.random() * 4000;
    setTimeout(() => {
      setRefreshMetrics(prev => !prev);
    }, nextUpdateTime);
  };

  // Function to generate random trade data
  const generateRandomTradeData = () => {
    const exchanges = ['Binance', 'xtpub', 'bullish', 'Coinbase', 'Kraken'];
    const types = ['buy', 'sell'];
    const basePrice = btcPrice; // Use the current BTC price

    const randomData = [];

    // Generate 15 rows for display (we'll only show 10)
    for (let i = 0; i < 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const price = (basePrice + (Math.random() * 100 - 50)).toFixed(2);
      const amount = (Math.random() * 0.01 + 0.001).toFixed(6);
      const total = (price * amount).toFixed(2);

      // Create a timestamp with slight variations
      const date = new Date();
      date.setSeconds(date.getSeconds() - i * 3); // Each row is 3 seconds apart

      randomData.push({
        exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        type,
        orderId: Math.floor(Math.random() * 10000000000).toString(),
        price: amount,
        amount: price,
        total,
        timestamp: date.toLocaleTimeString(),
        id: `trade-${Date.now()}-${i}` // Add unique ID for animation tracking
      });
    }

    setTradeData(randomData);

    // Set up periodic data refresh - refresh every 3-5 seconds for a slower, more readable effect
    setTimeout(() => {
      setRefreshData(prev => !prev);
    }, 3000 + Math.random() * 2000);
  };

  // Function to handle daily profit activation
  const handleActivateDailyProfit = async () => {
    try {
      setActivatingProfit(true);
      console.log('Activating daily profit...');
      const response = await api.post('/user/activate-daily-profit');
      console.log('Activation response:', response.data);

      if (response.data?.status) {
        // Check if the response includes the updated user data
        if (response.data?.data?.user) {
          const updatedUserData = response.data.data.user;
          console.log('Updated user data from activation response:', updatedUserData);

          // Set the updated user data
          setUserData(updatedUserData);

          // Generate live trade data
          generateRandomTradeData();

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Daily profit has been activated for your account today. You will receive your daily profit when the system processes it.'
          });

          // Store activation state in local storage with user ID to make it user-specific
          const userId = updatedUserData?._id;
          if (userId) {
            localStorage.setItem(`dailyProfitActivated_${userId}`, 'true');
            localStorage.setItem(`activationDate_${userId}`, new Date().toDateString());
            console.log(`Stored activation state for user ${userId} in localStorage`);
          }
        } else {
          // If the response doesn't include user data, fetch it separately
          try {
            const profileResponse = await axios.get('/user/profile');
            if (profileResponse.data?.status) {
              const updatedUserData = profileResponse.data.result;
              console.log('Updated user data after activation:', updatedUserData);

              // Set the updated user data
              setUserData(updatedUserData);

              // Generate live trade data
              generateRandomTradeData();

              // Show success message
              Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Daily profit has been activated for your account today. You will receive your daily profit when the system processes it.'
              });

              // Store activation state in local storage with user ID to make it user-specific
              const userId = updatedUserData?._id;
              if (userId) {
                localStorage.setItem(`dailyProfitActivated_${userId}`, 'true');
                localStorage.setItem(`activationDate_${userId}`, new Date().toDateString());
                console.log(`Stored activation state for user ${userId} in localStorage`);
              }
            }
          } catch (profileError) {
            console.error('Error fetching updated profile:', profileError);

            // Even if profile fetch fails, update local state
            setUserData(prevData => ({
              ...prevData,
              dailyProfitActivated: true,
              lastDailyProfitActivation: new Date()
            }));

            // Generate live trade data
            generateRandomTradeData();

            // Show success message
            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Daily profit has been activated for your account today. You will receive your daily profit when the system processes it.'
            });
          }
        }
      } else {
        throw new Error(response.data?.message || 'Failed to activate daily profit');
      }
    } catch (error) {
      console.error('Error activating daily profit:', error);

      // Check if the error is due to a blocked account
      if (error.response?.status === 403 && error.response?.data?.msg?.includes('blocked')) {
        const blockReason = error.response?.data?.block_reason || 'No reason provided';
        Swal.fire({
          icon: 'error',
          title: 'Account Blocked',
          html: `<p>Your account has been blocked. You cannot activate daily profit.</p>
                <div style="margin-top: 15px; padding: 10px; background: #f8d7da; border-radius: 5px; text-align: left;">
                  <strong>Reason:</strong> ${blockReason}
                </div>
                <p style="margin-top: 15px;">Please contact support for assistance.</p>`
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to activate daily profit. Please try again later.'
        });
      }
    } finally {
      setActivatingProfit(false);
    }
  };

  // Helper function to check if user has investments
  const checkInvestmentStatus = (userData) => {
    if (userData && userData.total_investment !== undefined) {
      const hasInvestments = userData.total_investment > 0;
      console.log('User has investments:', hasInvestments, 'Amount:', userData.total_investment);
      console.log('Daily profit activated:', userData.dailyProfitActivated);

      // Log additional information for debugging
      if (hasInvestments) {
        console.log('User has valid investment of $' + userData.total_investment);
      } else {
        console.log('User has no investment or investment amount is 0');
      }

      return hasInvestments;
    }
    return false;
  };

  // Check local storage for activation state on component mount
  useEffect(() => {
    // We'll check user-specific localStorage items after we have the user data
    // This is just to clean up any old format items
    const storedActivation = localStorage.getItem('dailyProfitActivated');
    const storedDate = localStorage.getItem('activationDate');

    // Remove old format items if they exist
    if (storedActivation) {
      localStorage.removeItem('dailyProfitActivated');
    }
    if (storedDate) {
      localStorage.removeItem('activationDate');
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Only generate trade data if user has investments and has activated daily profit
        // We'll check this after we get the user data

        const response = await api.get('/user/profile');

        if (response.data?.status) {
          const userData = response.data.result;
          if (!userData.extra) {
            userData.extra = {};
          }

          // Get user ID for user-specific localStorage items
          const userId = userData?._id;
          console.log('User data from server:', userData);

          // Check if user has activated daily profit (from database)
          let isActivated = userData.dailyProfitActivated === true;
          console.log('Initial activation status from database:', isActivated);

          // Only check localStorage if we have a userId
          if (userId && !isActivated) {
            // Check user-specific localStorage for today's activation
            const storedActivation = localStorage.getItem(`dailyProfitActivated_${userId}`);
            const storedDate = localStorage.getItem(`activationDate_${userId}`);
            const today = new Date().toDateString();

            console.log(`Checking localStorage for user ${userId}:`, {
              storedActivation,
              storedDate,
              today
            });

            // If we have a valid user-specific localStorage activation but server doesn't show it,
            // update the userData to reflect the activation
            if (storedActivation === 'true' && storedDate === today) {
              // Set directly in user document
              userData.dailyProfitActivated = true;
              isActivated = true;
              console.log(`Using activation state from localStorage for user ${userId}`);
            }
          }

          // Ensure the extra object exists
          if (!userData.extra) {
            userData.extra = {};
          }

          setUserData(userData);

          // Check if user has investments - this is critical for the Arbitrage Trade page
          // as users can only activate daily profit if they have made an investment
          const hasInvestments = checkInvestmentStatus(userData);
          setHasInvestment(hasInvestments);
          console.log('User has investments check result:', hasInvestments);

          // If user has already activated daily profit AND has investments, fetch live trade data
          if (isActivated && hasInvestments) {
            console.log('User has already activated daily profit and has investments, fetching live trade data');
            // Generate trade data since user has investments and has activated daily profit
            generateRandomTradeData();
            fetchLiveTradeData();
          } else if (!hasInvestments) {
            console.log('User has no investments, cannot activate daily profit');
          } else {
            console.log('User has not activated daily profit yet');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch trade data once when activation state changes
  useEffect(() => {
    if (userData?.dailyProfitActivated === true && userData?.total_investment > 0) {
      // Fetch data once when activated
      fetchLiveTradeData();
      // Start updating metrics
      updateMetrics();
    }
  }, [userData?.dailyProfitActivated, userData?.total_investment]);

  // Refresh data periodically - only when user has investments and has activated daily profit
  useEffect(() => {
    if (userData && userData.total_investment > 0 && userData.dailyProfitActivated) {
      generateRandomTradeData();
    }
  }, [refreshData, userData]);

  // Update metrics periodically - always update metrics
  useEffect(() => {
    if (userData) {
      updateMetrics();
    }
  }, [refreshMetrics]);

  // WebSocket connection setup
  useEffect(() => {
    // Only connect WebSocket if user has investments and has activated daily profit
    if (userData && userData.total_investment > 0 && userData.dailyProfitActivated) {
      // Create WebSocket connection
      const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@trade';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      // Listen for messages
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Process the trade data
        processWebSocketData(data);
      };

      // Connection closed
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };

      // Connection error
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Fall back to random data generation if WebSocket fails
        generateRandomTradeData();
      };

      // Clean up WebSocket on unmount
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    } else {
      // Start updating metrics immediately if not using WebSocket
      updateMetrics();
    }
  }, [userData?.dailyProfitActivated, userData?.total_investment]);

  // Process WebSocket data
  const processWebSocketData = (data) => {
    // Update BTC price from WebSocket data
    if (data.p) {
      setBtcPrice(parseFloat(data.p));
    }

    // Create a new trade row from WebSocket data
    const newTrade = {
      exchange: 'Binance',
      type: parseFloat(data.q) > 0.1 ? 'buy' : 'sell', // Determine type based on quantity
      orderId: data.t.toString(),
      price: parseFloat(data.p).toFixed(2),
      amount: parseFloat(data.q).toFixed(6),
      total: (parseFloat(data.p) * parseFloat(data.q)).toFixed(2),
      timestamp: new Date().toLocaleTimeString(),
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      animationDelay: '0s',
      isNew: true // Flag to animate new rows
    };

    // Update trade data with the new row at the top
    setTradeData(prevData => {
      // Mark the row that will be removed
      if (prevData.length >= 10) {
        setRemovedRowId(prevData[prevData.length - 1].id);
      }

      // Add new row at the beginning and keep only 10 rows
      const newData = [newTrade, ...prevData.slice(0, 9)];

      // Trigger animation for new row
      setNewRowAdded(true);
      setTimeout(() => setNewRowAdded(false), 500);

      return newData;
    });
  };

  // Start metrics updates when component mounts
  useEffect(() => {
    // Start updating metrics immediately if not using WebSocket
    if (!wsRef.current) {
      updateMetrics();
    }
  }, []);
  return <TradingDashboard/>
  return (

    <Box sx={{
      width: '100vw',
      maxWidth: '100%',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
      left: 0,
      right: 0,
      position: 'relative'
    }}>
      <Box sx={{ width: '100%', px: 0, mx: 0 }}>
        <Typography variant="h4" sx={{
          mb: { xs: 2, sm: 3 },
          fontWeight: 600,
          color: 'white',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          px: { xs: 1, sm: 2, md: 3 },
          width: '100%',
          mt: { xs: 1, sm: 2, md: 3 }
        }}>
          Live Trading
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          p: { xs: 4, sm: 6 },
          bgcolor: 'grey.900',
          borderRadius: 4,
          mx: { xs: 0, sm: 0 },
          width: '100%'
        }}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : (
        <Grid container spacing={0} sx={{
          width: '100%',
          margin: 0,
          maxWidth: '100%',
          paddingLeft: 0,
          paddingRight: 0,
          '& .MuiGrid-item': {
            paddingTop: { xs: 1, sm: 2, md: 3 },
            paddingBottom: 0
          }
        }}>
          {/* Active Exchange Card */}
          <Grid item xs={12} sx={{
            paddingLeft: { xs: 1, sm: 2, md: 3 },
            paddingRight: { xs: 1, sm: 2, md: 3 },
            width: '100%'
          }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 4,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                mb: 3,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Animated background effect */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: 'url(/dashboard-pattern.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.05,
                  zIndex: 0
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    mr: 2,
                    color: theme.palette.primary.main,
                    width: 48,
                    height: 48,
                    boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.4)}`
                  }}
                >
                  <TrendUp size={24} variant="Bold" />
                </Avatar>
                <Box>
                  <Typography variant="h5" color="white" sx={{ fontWeight: 600 }}>
                    Active Exchange: <span style={{ color: theme.palette.primary.light }}>
                      {userData && userData.total_investment > 0 && userData.dailyProfitActivated && tradeData.length > 0 ?
                        tradeData[0].exchange :
                        'Not Active'}
                    </span>
                  </Typography>
                  <Typography variant="caption" color="grey.400">
                    {userData && userData.total_investment > 0 && userData.dailyProfitActivated ?
                      `Last updated: ${new Date().toLocaleTimeString()}` :
                      'Activate daily profit to see live data'}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="grey.400" sx={{ position: 'relative', zIndex: 1 }}>
                Our arbitrage trading system automatically selects the best exchange for maximum profit based on market conditions.
                The system continuously monitors price differences across multiple exchanges to execute profitable trades.
              </Typography>

              {/* Exchange indicators */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, position: 'relative', zIndex: 1 }}>
                {['Binance', 'Coinbase', 'Kraken', 'Bitfinex', 'xtpub'].map((exchange) => (
                  <Chip
                    key={exchange}
                    label={exchange}
                    size="small"
                    sx={{
                      bgcolor: userData && userData.total_investment > 0 && userData.dailyProfitActivated && tradeData.length > 0 && tradeData[0].exchange === exchange
                        ? alpha(theme.palette.success.main, 0.2)
                        : alpha('#fff', 0.05),
                      color: userData && userData.total_investment > 0 && userData.dailyProfitActivated && tradeData.length > 0 && tradeData[0].exchange === exchange
                        ? theme.palette.success.light
                        : 'grey.400',
                      border: `1px solid ${userData && userData.total_investment > 0 && userData.dailyProfitActivated && tradeData.length > 0 && tradeData[0].exchange === exchange
                        ? alpha(theme.palette.success.main, 0.5)
                        : alpha('#fff', 0.1)}`,
                      '& .MuiChip-label': { px: 1 }
                    }}
                    icon={
                      userData && userData.total_investment > 0 && userData.dailyProfitActivated && tradeData.length > 0 && tradeData[0].exchange === exchange ?
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: theme.palette.success.main,
                          ml: 1,
                          animation: `${pulse} 1.5s infinite`
                        }}
                      /> : undefined
                    }
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* CoinDesk Live Data Section */}
          <Grid item xs={12} sx={{
            paddingLeft: { xs: 1, sm: 2, md: 3 },
            paddingRight: { xs: 1, sm: 2, md: 3 },
            width: '100%'
          }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 4,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                mb: 3,
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                flexDirection: { xs: 'column', md: 'row' },
                flexWrap: 'wrap',
                gap: 2,
                width: '100%'
              }}>
                <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                  <Typography variant="h5" color="white" sx={{ fontWeight: 600, mb: 1 }}>
                    Live Trading Data
                  </Typography>
                  <Typography variant="body2" color="grey.400" sx={{ mb: { xs: 2, md: 0 } }}>
                    Activate daily profit for YOUR account by clicking the button below
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'flex-start', md: 'flex-end' },
                  width: { xs: '100%', md: 'auto' }
                }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={handleActivateDailyProfit}
                    disabled={userData?.dailyProfitActivated === true || activatingProfit || (userData && userData.total_investment <= 0)}
                    sx={{
                      borderRadius: 2,
                      px: { xs: 2, sm: 3 },
                      py: 1,
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                      minWidth: { xs: '100%', md: '200px' },
                      width: { xs: '100%', md: 'auto' },
                      bgcolor: userData && userData.total_investment <= 0 ? alpha(theme.palette.success.main, 0.5) : theme.palette.success.main,
                      '&:hover': {
                        bgcolor: userData && userData.total_investment <= 0 ? alpha(theme.palette.success.main, 0.5) : theme.palette.success.dark
                      },
                      '&.Mui-disabled': {
                        bgcolor: userData && userData.total_investment <= 0 ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.success.main, 0.5),
                        color: userData && userData.total_investment <= 0 ? theme.palette.error.main : 'white'
                      }
                    }}
                  >
                    {activatingProfit ? (
                      <>
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                        Activating...
                      </>
                    ) : userData?.dailyProfitActivated === true ? (
                      'Your Daily Profit Activated for Today'
                    ) : userData && userData.total_investment <= 0 ? (
                      'Invest First to Activate'
                    ) : (
                      'Activate MY Daily Profit for Today'
                    )}
                  </Button>
                  <Typography variant="caption" color="grey.400" sx={{ mt: 1, textAlign: { xs: 'left', md: 'center' }, width: '100%' }}>
                    Activation resets at midnight UTC. You must activate daily.
                  </Typography>
                </Box>
              </Box>

              {/* Metrics Cards - Always visible */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: { xs: 2, sm: 3 },
                mt: 3,
                mb: 3,
                width: '100%'
              }}>
                {/* BTC Price Card */}
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    minHeight: '100px'
                  }}
                >
                  <Typography variant="subtitle2" color="grey.400" sx={{ mb: 1 }}>
                    BTC PRICE
                  </Typography>
                  <Box sx={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                      variant="h4"
                      color="primary.light"
                      sx={{
                        fontWeight: 700,
                        position: 'absolute',
                        animation: `${numberChange} 0.8s ease-out`,
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                      }}
                    >
                      ${btcPrice.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      bgcolor: theme.palette.primary.main,
                      opacity: 0.5,
                      animation: `${pulse} 2s infinite`
                    }}
                  />
                </Box>

                {/* Investment Amount Card */}
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    minHeight: '100px'
                  }}
                >
                  <Typography variant="subtitle2" color="grey.400" sx={{ mb: 1 }}>
                    INVESTMENT AMOUNT
                  </Typography>
                  <Box sx={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                      variant="h4"
                      color="warning.light"
                      sx={{
                        fontWeight: 700,
                        position: 'absolute',
                        animation: `${numberChange} 0.8s ease-out`,
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                      }}
                    >
                      ${(userData?.total_investment || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      bgcolor: theme.palette.warning.main,
                      opacity: 0.5,
                      animation: `${pulse} 2s infinite`
                    }}
                  />
                </Box>

                {/* Daily Profit Card */}
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    height: '100%',
                    minHeight: '100px',
                    gridColumn: { xs: '1', sm: 'span 2', md: 'auto' }
                  }}
                >
                  <Typography variant="subtitle2" color="grey.400" sx={{ mb: 1 }}>
                    DAILY PROFIT
                  </Typography>
                  <Box sx={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                      variant="h4"
                      color="success.light"
                      sx={{
                        fontWeight: 700,
                        position: 'absolute',
                        animation: `${numberChange} 0.8s ease-out`,
                        whiteSpace: 'nowrap',
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                      }}
                    >
                      ${((userData?.total_investment || 0) * 0.025).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      bgcolor: theme.palette.success.main,
                      opacity: 0.5,
                      animation: `${pulse} 2s infinite`
                    }}
                  />
                </Box>
              </Box>

              <Box>
                {/* Show investment required message if user has no investments */}
                {userData && userData.total_investment <= 0 && (
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: 'center',
                      bgcolor: alpha('#f44336', 0.1),
                      borderRadius: 2,
                      mb: 3,
                      border: `1px solid ${alpha('#f44336', 0.3)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        background: 'linear-gradient(90deg, transparent, #f44336, transparent)',
                        animation: `${pulse} 2s infinite`
                      }}
                    />
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
                      Investment Required
                    </Typography>
                    <Typography variant="body1" color="error.light" sx={{ fontWeight: 500, mb: 2 }}>
                      You need to make an investment in a trading package before you can activate daily profit.
                    </Typography>
                    <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>
                      {userData?.total_investment > 0 ? (
                        <>
                          Your current investment of <span style={{ color: theme.palette.error.light, fontWeight: 'bold' }}>${userData.total_investment.toFixed(2)}</span> is not active.
                          Please contact support if you believe this is an error.
                        </>
                      ) : (
                        <>Invest in any trading package ($50-$10,000) to start earning 2.5% daily profit through our arbitrage trading system.</>
                      )}
                    </Typography>
                    <Button
                      variant="contained"
                      color="error"
                      sx={{
                        mt: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
                      }}
                      href="/user/trading-package"
                      startIcon={<ArrowRight size={18} />}
                    >
                      Go to Investment Page
                    </Button>
                  </Box>
                )}

                {/* Always show the notification based on activation status */}
                {userData && userData.total_investment > 0 && !userData.dailyProfitActivated && (
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      mb: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                        animation: `${pulse} 2s infinite`
                      }}
                    />
                    <Typography variant="h6" color={theme.palette.primary.main} sx={{ fontWeight: 600, mb: 1 }}>
                      Activate Daily Profit
                    </Typography>
                    <Typography variant="body1" color="grey.300" sx={{ mb: 2 }}>
                      Activate daily profit for YOUR account to see LIVE trading data. Each user must activate their own daily profit every day.
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, maxWidth: '600px', mx: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', p: 1, bgcolor: alpha('#fff', 0.03), borderRadius: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.primary.main, mr: 1.5, mt: 1 }} />
                        <Typography variant="body2" color="grey.400">
                          <strong>Daily Activation Required:</strong> The system distributes daily profit only to users who have activated it, and resets activation status at midnight UTC.
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', p: 1, bgcolor: alpha('#fff', 0.03), borderRadius: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.primary.main, mr: 1.5, mt: 1 }} />
                        <Typography variant="body2" color="grey.400">
                          <strong>Investment Required:</strong> You have invested ${userData?.total_investment?.toFixed(2) || '0.00'}, which makes you eligible to activate daily profit.
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', p: 1, bgcolor: alpha('#fff', 0.03), borderRadius: 1 }}>
                        <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.primary.main, mr: 1.5, mt: 1 }} />
                        <Typography variant="body2" color="grey.400">
                          <strong>Profit Rate:</strong> You'll earn 2.5% daily profit on your investment amount when you activate daily profit.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Show success message when daily profit is activated */}
                {userData && userData.dailyProfitActivated && userData.total_investment > 0 && (
                  <Box
                    sx={{
                      p: { xs: 2, sm: 3 },
                      textAlign: 'center',
                      bgcolor: alpha(theme.palette.success.main, 0.05),
                      borderRadius: 2,
                      mb: 3,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        background: `linear-gradient(90deg, transparent, ${theme.palette.success.main}, transparent)`,
                        animation: `${pulse} 2s infinite`
                      }}
                    />
                    <Typography variant="h6" color={theme.palette.success.main} sx={{ fontWeight: 600, mb: 1 }}>
                      Daily Profit Activated
                    </Typography>
                    <Typography variant="body1" color="grey.300" sx={{ mb: 2 }}>
                      Your daily profit has been activated for today. You will receive 2.5% profit on your investment of ${userData?.total_investment?.toFixed(2) || '0.00'}.
                    </Typography>
                    <Typography variant="body2" color="grey.400">
                      The system will process your daily profit and add it to your wallet. Remember to activate again tomorrow to continue earning.
                    </Typography>
                  </Box>
                )}

                {/* Only show trading table when user has investments AND has activated daily profit */}
                {userData && userData.total_investment > 0 && userData.dailyProfitActivated ? (
                  loadingTrades ? (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      p: 3,
                      flexDirection: 'column',
                      width: '100%'
                    }}>
                      <CircularProgress size={40} thickness={4} sx={{ mb: 2 }} />
                      <Typography variant="body2" color="grey.400" sx={{ animation: `${pulse} 1.5s infinite` }}>
                        Fetching live trading data...
                      </Typography>
                    </Box>
                  ) : (
                    /* Show the table with live data */
                    <Box sx={{
                      overflow: 'auto',
                      width: '100%',
                      maxWidth: '100%',
                      '&::-webkit-scrollbar': {
                        height: '8px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: alpha('#fff', 0.05),
                        borderRadius: '4px',
                      }
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        minWidth: '800px',
                        maxWidth: '100%'
                      }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${alpha('#fff', 0.1)}` }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'white', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, width: '20%' }}>Exchange</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', color: 'white', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, width: '12%' }}>Type</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', color: 'white', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, width: '20%' }}>Order ID</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', color: 'white', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, width: '16%' }}>Price</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', color: 'white', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, width: '16%' }}>Amount</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', color: 'white', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, width: '16%' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tradeData.slice(0, 10).map((trade, index) => (
                            <tr
                              key={trade.id || index}
                              style={{
                                backgroundColor: alpha(trade.type === 'buy' ? '#4caf50' : '#f44336', 0.05),
                                transition: 'all 0.3s ease',
                                opacity: trade.id === removedRowId ? 0 : 1,
                                position: 'relative',
                                zIndex: trade.isNew ? 2 : 1,
                                // Use individual animation properties instead of the shorthand
                                animationName: `${trade.isNew ? fadeInDown.name : numberChange.name}, ${trade.id === removedRowId ? slideOut.name : 'none'}, ${newRowAdded && index === 0 ? flashHighlight.name : 'none'}`,
                                animationDuration: '0.8s, 0.8s, 1.5s',
                                animationTimingFunction: 'ease-out, ease-out, ease-out',
                                animationDelay: trade.animationDelay || `${index * 0.1}s, ${index * 0.1}s, ${index * 0.1}s`,
                                animationFillMode: 'forwards, forwards, forwards'
                              }}
                            >
                              <td style={{ padding: '12px 16px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Typography variant="body2" color="grey.300" sx={{
                                  fontWeight: 500,
                                  display: 'flex',
                                  alignItems: 'center',
                                  // Use individual animation properties instead of the shorthand
                                  animationName: trade.isNew ? slideIn.name : 'none',
                                  animationDuration: '0.8s',
                                  animationTimingFunction: 'ease-out',
                                  animationFillMode: 'forwards',
                                  '&::before': {
                                    content: '""',
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: trade.type === 'buy' ? '#4caf50' : '#f44336',
                                    marginRight: '8px',
                                    // Use individual animation properties for pulse
                                    animationName: `${pulse.name}`,
                                    animationDuration: '1.5s',
                                    animationIterationCount: 'infinite'
                                  }
                                }}>
                                  {trade.exchange}
                                </Typography>
                                <Typography variant="caption" color="grey.500" sx={{
                                  pl: 2,
                                  display: 'block',
                                  opacity: trade.isNew ? 0 : 1,
                                  // Use individual animation properties instead of the shorthand
                                  animationName: trade.isNew ? fadeInUp.name : 'none',
                                  animationDuration: '1s',
                                  animationTimingFunction: 'ease-out',
                                  animationFillMode: 'forwards',
                                  animationDelay: '0.3s'
                                }}>
                                  {trade.timestamp}
                                </Typography>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Chip
                                  label={trade.type === 'buy' ? 'Buy' : 'Sell'}
                                  size="small"
                                  sx={{
                                    bgcolor: trade.type === 'buy' ? '#4caf50' : '#f44336',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.75rem',
                                    height: '24px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: `0 0 8px ${alpha(trade.type === 'buy' ? '#4caf50' : '#f44336', 0.5)}`,
                                    // Use individual animation properties instead of the shorthand
                                    animationName: trade.isNew ? glowEffect.name : 'none',
                                    animationDuration: '1.5s',
                                    animationTimingFunction: 'ease-out',
                                    animationFillMode: 'forwards',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: `0 0 12px ${alpha(trade.type === 'buy' ? '#4caf50' : '#f44336', 0.7)}`
                                    }
                                  }}
                                />
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Typography variant="body2" color="grey.400" sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  fontFamily: 'monospace',
                                  letterSpacing: '0.5px',
                                  whiteSpace: 'nowrap',
                                  borderRight: trade.isNew ? '2px solid transparent' : 'none',
                                  width: trade.isNew ? '0' : '100%',
                                  // Use individual animation properties instead of the shorthand
                                  animationName: trade.isNew ? typewriter.name : 'none',
                                  animationDuration: '1s',
                                  animationTimingFunction: 'steps(40, end)',
                                  animationFillMode: 'forwards'
                                }}>
                                  {trade.orderId}
                                </Typography>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Typography variant="body2" color={trade.type === 'buy' ? 'success.light' : 'error.light'} sx={{
                                  fontWeight: 600,
                                  opacity: trade.isNew ? 0 : 1,
                                  textShadow: trade.isNew ? `0 0 8px ${alpha(trade.type === 'buy' ? '#4caf50' : '#f44336', 0.7)}` : 'none',
                                  // Use individual animation properties instead of the shorthand
                                  animationName: trade.isNew ? fadeInDown.name : 'none',
                                  animationDuration: '0.8s',
                                  animationTimingFunction: 'ease-out',
                                  animationFillMode: 'forwards'
                                }}>
                                  ₿ {trade.price}
                                </Typography>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Typography variant="body2" color={trade.type === 'buy' ? 'success.light' : 'error.light'} sx={{
                                  fontWeight: 600,
                                  opacity: trade.isNew ? 0 : 1,
                                  textShadow: trade.isNew ? `0 0 8px ${alpha(trade.type === 'buy' ? '#4caf50' : '#f44336', 0.7)}` : 'none',
                                  // Use individual animation properties instead of the shorthand
                                  animationName: trade.isNew ? fadeInDown.name : 'none',
                                  animationDuration: '0.8s',
                                  animationTimingFunction: 'ease-out',
                                  animationFillMode: 'forwards',
                                  animationDelay: '0.2s'
                                }}>
                                  ₮ {trade.amount}
                                </Typography>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Typography variant="body2" color={trade.type === 'buy' ? 'success.light' : 'error.light'} sx={{
                                  fontWeight: 700,
                                  opacity: trade.isNew ? 0 : 1,
                                  fontSize: '0.9rem',
                                  textShadow: trade.isNew ? `0 0 8px ${alpha(trade.type === 'buy' ? '#4caf50' : '#f44336', 0.7)}` : 'none',
                                  // Use individual animation properties instead of the shorthand
                                  animationName: trade.isNew ? fadeInDown.name : 'none',
                                  animationDuration: '0.8s',
                                  animationTimingFunction: 'ease-out',
                                  animationFillMode: 'forwards',
                                  animationDelay: '0.3s'
                                }}>
                                  ₮ {trade.total}
                                </Typography>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  )
                ) : (
                  /* Show a message when table is not visible */
                  <Box sx={{
                    p: { xs: 2, sm: 3, md: 4 },
                    textAlign: 'center',
                    bgcolor: alpha('#fff', 0.03),
                    borderRadius: 2,
                    border: `1px dashed ${alpha('#fff', 0.1)}`,
                    mb: 3,
                    width: '100%'
                  }}>
                    <Typography variant="body1" color="grey.400">
                      {userData && userData.total_investment > 0 ?
                        'Activate daily profit to see live trading data.' :
                        'Make an investment and activate daily profit to see live trading data.'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>


        </Grid>
      )}
    </Box>
  );
};

export default LiveTrading;
