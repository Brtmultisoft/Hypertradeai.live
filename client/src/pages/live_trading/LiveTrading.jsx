import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  alpha,
  Grid,
  IconButton,
  Card,
  CardContent,
  Chip,
  Avatar,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Container,
  Badge,
  LinearProgress,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Refresh,
  ArrowUpward,
  ArrowDownward,
  PlayArrow,
  Stop,
} from '@mui/icons-material';
import './LiveTrading.css';
import axios from 'axios';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { keyframes } from '@mui/material/styles';
// Import API hooks and services
import useApi from '../../hooks/useApi';
import UserService from '../../services/user.service';
import useAuth from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

// Animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const flashAnimation = keyframes`
  0% { background-color: rgba(255, 255, 255, 0.1); }
  50% { background-color: rgba(255, 255, 255, 0.2); }
  100% { background-color: rgba(255, 255, 255, 0.1); }
`;

// Trading pairs with CoinGecko IDs
const tradingPairs = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT', fullName: 'Bitcoin', id: 'bitcoin' },
  { symbol: 'BNBUSDT', name: 'BNB/USDT', fullName: 'Binance Coin', id: 'binancecoin' },
  { symbol: 'ETHUSDT', name: 'ETH/USDT', fullName: 'Ethereum', id: 'ethereum' },
  { symbol: 'SOLUSDT', name: 'SOL/USDT', fullName: 'Solana', id: 'solana' },
  { symbol: 'ADAUSDT', name: 'ADA/USDT', fullName: 'Cardano', id: 'cardano' },
  { symbol: 'DOGEUSDT', name: 'DOGE/USDT', fullName: 'Dogecoin', id: 'dogecoin' }
];

const LiveTrading = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  // Get user data from auth context
  const { user } = useAuth();
  const [tradingActive, setTradingActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentBasePrice, setCurrentBasePrice] = useState(45000);
  const [currentTradingPair, setCurrentTradingPair] = useState('BTCUSDT');
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [dailyProfitRate, setDailyProfitRate] = useState(0.8); // 0.8% daily profit
  const [dailyProfit, setDailyProfit] = useState(0);
  const [accumulatedProfit, setAccumulatedProfit] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [successRate, setSuccessRate] = useState(85); // Default success rate
  const [millisecondPrices, setMillisecondPrices] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const tradingIntervalsRef = useRef({});

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error', 'warning', 'info'
  const [activatingProfit, setActivatingProfit] = useState(false);

  // Fetch user profile data to get total investment
  const {
    data: profileData,
    loading: profileLoading,
    error: profileError,
    execute: fetchProfileData
  } = useApi(() => UserService.getUserProfile(), true);

  // API hook for activating daily profit
  const {
    data: activateProfitData,
    loading: activatingProfitLoading,
    error: activateProfitError,
    execute: activateDailyProfit
  } = useApi(() => UserService.activateDailyProfit(), false);

  // API hook for checking daily profit status
  const {
    data: profitStatusData,
    loading: profitStatusLoading,
    error: profitStatusError,
    execute: checkDailyProfitStatus
  } = useApi(() => UserService.checkDailyProfitStatus(), true);

  // Update total investment and calculate profit when profile data is received
  useEffect(() => {
    let totalAmount = 0;

    // Get total investment from user profile
    if (profileData?.result && profileData.result.total_investment) {
      totalAmount = profileData.result.total_investment;
      console.log('Total investment from profile:', totalAmount);
    }
    // Fallback to user object if available
    else if (user?.total_investment) {
      totalAmount = user.total_investment;
      console.log('Total investment from user context:', totalAmount);
    }

    if (totalAmount > 0) {
      setTotalInvestment(totalAmount);

      // Calculate daily profit (0.8% of total investment)
      const dailyProfitAmount = totalAmount * (dailyProfitRate / 100);
      setDailyProfit(dailyProfitAmount);

      console.log('Investment data updated:', {
        totalInvestment: totalAmount,
        dailyProfit: dailyProfitAmount
      });
    }
  }, [profileData, user, dailyProfitRate]);

  // Update accumulated profit based on session time
  useEffect(() => {
    if (tradingActive && dailyProfit > 0) {
      // Calculate profit per second (daily profit / seconds in a day)
      const profitPerSecond = dailyProfit / (24 * 60 * 60);

      // Update accumulated profit every second based on session time
      setAccumulatedProfit(profitPerSecond * sessionTime);

      // Update total trades (1 trade every 5 seconds on average)
      setTotalTrades(Math.floor(sessionTime / 5));
    } else {
      setAccumulatedProfit(0);
      setTotalTrades(0);
    }
  }, [tradingActive, sessionTime, dailyProfit]);

  // We'll move this useEffect after the fetchAllCryptoImages function is defined

  // Function to fetch real-time price and image from CoinGecko API
  const updateBasePriceFromAPI = useCallback(async () => {
    try {
      // Get the current pair's CoinGecko ID
      const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
      if (!currentPair) return;

      // Fetch data from CoinGecko API
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${currentPair.id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
      );

      if (response.data && response.data.length > 0) {
        const coinData = response.data[0];
        const newPrice = parseFloat(coinData.current_price);

        // Store coin image URL in the trading pairs data
        const updatedPairs = tradingPairs.map(pair => {
          if (pair.id === currentPair.id) {
            return {
              ...pair,
              imageUrl: coinData.image, // Store the image URL from CoinGecko
              marketCap: coinData.market_cap,
              totalVolume: coinData.total_volume,
              high24h: coinData.high_24h,
              low24h: coinData.low_24h,
              priceChange24h: coinData.price_change_percentage_24h
            };
          }
          return pair;
        });

        // Update trading pairs with image URLs
        window.tradingPairsData = updatedPairs;

        console.log(`Fetched ${currentPair.fullName} data from CoinGecko:`, {
          price: newPrice,
          image: coinData.image
        });

        setCurrentBasePrice(newPrice);

        // Update millisecond prices for more dynamic display
        setMillisecondPrices(prev => {
          const newPrices = [...prev, newPrice];
          if (newPrices.length > 20) {
            return newPrices.slice(-20);
          }
          return newPrices;
        });
      }
    } catch (error) {
      console.error(`Error fetching ${currentTradingPair} price:`, error);

      // Fallback to mock data if API fails
      const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
      let fallbackPrice;

      switch(currentPair?.id) {
        case 'bitcoin':
          fallbackPrice = 45000 + (Math.random() * 2000 - 1000);
          break;
        case 'ethereum':
          fallbackPrice = 2500 + (Math.random() * 100 - 50);
          break;
        case 'binancecoin':
          fallbackPrice = 350 + (Math.random() * 20 - 10);
          break;
        case 'solana':
          fallbackPrice = 120 + (Math.random() * 10 - 5);
          break;
        case 'cardano':
          fallbackPrice = 0.5 + (Math.random() * 0.05 - 0.025);
          break;
        case 'dogecoin':
          fallbackPrice = 0.1 + (Math.random() * 0.01 - 0.005);
          break;
        default:
          fallbackPrice = 100 + (Math.random() * 10 - 5);
      }

      console.log(`Using fallback price for ${currentTradingPair}:`, fallbackPrice);

      const newPrice = parseFloat(fallbackPrice.toFixed(2));
      setCurrentBasePrice(newPrice);

      // Update millisecond prices for more dynamic display
      setMillisecondPrices(prev => {
        const newPrices = [...prev, newPrice];
        if (newPrices.length > 20) {
          return newPrices.slice(-20);
        }
        return newPrices;
      });
    }
  }, [currentTradingPair]);

  // Change trading pair randomly
  const changeTradingPair = useCallback(() => {
    if (!tradingActive) return;

    // Get a random index different from the current one
    let currentIndex = tradingPairs.findIndex(pair => pair.symbol === currentTradingPair);
    let nextIndex;

    do {
      nextIndex = Math.floor(Math.random() * tradingPairs.length);
    } while (nextIndex === currentIndex);

    console.log(`Switching trading pair from ${currentTradingPair} to ${tradingPairs[nextIndex].symbol}`);
    setCurrentTradingPair(tradingPairs[nextIndex].symbol);
  }, [tradingActive, currentTradingPair]);



  // Generate order book data
  const generateOrderBook = useCallback(() => {
    // This function now just simulates order book data generation
    // We don't need to store it since we generate it on the fly in the OrderBook component
    console.log('Simulating order book data generation for', currentTradingPair);
  }, [currentTradingPair]);

  // Generate trade history data
  const generateTradeHistory = useCallback(() => {
    if (!tradingActive) return;

    // Generate a new trade based on current price
    const tradeType = Math.random() > 0.5 ? 'buy' : 'sell';
    const tradeAmount = (Math.random() * 0.5 + 0.01).toFixed(6);

    // Make price close to current price but with small variation
    const variation = Math.random() * 0.002 - 0.001; // ±0.1%
    const tradePrice = currentBasePrice * (1 + variation);

    // Get current pair info
    const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
    const symbol = currentPair ? currentPair.symbol.replace('USDT', '') : 'BTC';

    const newTrade = {
      id: Date.now(),
      type: tradeType,
      price: tradePrice,
      amount: tradeAmount,
      total: tradePrice * parseFloat(tradeAmount),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pair: currentTradingPair,
      symbol: symbol
    };

    // Add to trade history
    setTradeHistory(prev => {
      const newHistory = [newTrade, ...prev];
      if (newHistory.length > 50) {
        return newHistory.slice(0, 50);
      }
      return newHistory;
    });

    // Update total trades count
    setTotalTrades(prev => prev + 1);

    // Update success rate randomly (but keep it high)
    if (Math.random() > 0.8) {
      const newSuccessRate = Math.floor(Math.random() * 10) + 80; // 80-90%
      setSuccessRate(newSuccessRate);
    }
  }, [tradingActive, currentBasePrice, currentTradingPair]);

  // Function to simulate millisecond price changes
  const simulateMillisecondPriceChanges = useCallback(() => {
    if (!tradingActive || millisecondPrices.length === 0) return;

    // Get the latest price
    const latestPrice = millisecondPrices[millisecondPrices.length - 1];

    // Generate a small random change (±0.01%)
    const randomChange = latestPrice * (0.0001 * (Math.random() - 0.5));
    const newPrice = latestPrice + randomChange;

    // Update millisecond prices
    setMillisecondPrices(prev => {
      const newPrices = [...prev, newPrice];
      if (newPrices.length > 100) {
        return newPrices.slice(-100);
      }
      return newPrices;
    });
  }, [tradingActive, millisecondPrices]);

  // Function to fetch all cryptocurrency images
  const fetchAllCryptoImages = useCallback(async () => {
    try {
      // Create a comma-separated list of all coin IDs
      const coinIds = tradingPairs.map(pair => pair.id).join(',');

      // Fetch data for all coins at once
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
      );

      if (response.data && response.data.length > 0) {
        // Create a map of coin data with images
        const updatedPairs = response.data.map(coinData => ({
          id: coinData.id,
          symbol: tradingPairs.find(p => p.id === coinData.id)?.symbol || coinData.symbol.toUpperCase() + 'USDT',
          name: tradingPairs.find(p => p.id === coinData.id)?.name || coinData.symbol.toUpperCase() + '/USDT',
          fullName: tradingPairs.find(p => p.id === coinData.id)?.fullName || coinData.name,
          imageUrl: coinData.image,
          marketCap: coinData.market_cap,
          totalVolume: coinData.total_volume,
          high24h: coinData.high_24h,
          low24h: coinData.low_24h,
          priceChange24h: coinData.price_change_percentage_24h,
          currentPrice: coinData.current_price
        }));

        // Store the data globally
        window.tradingPairsData = updatedPairs;

        console.log('Fetched all cryptocurrency data:', updatedPairs);
      }
    } catch (error) {
      console.error('Error fetching cryptocurrency data:', error);
    }
  }, [tradingPairs]);

  // Check if trading is already active for today when component loads
  useEffect(() => {
    if (profitStatusData?.data?.isActivatedToday) {
      console.log('Trading is already active for today');
      setTradingActive(true);
    } else {
      console.log('Trading is not active for today');
      setTradingActive(false);
    }
  }, [profitStatusData]);

  // Fetch cryptocurrency images on component mount
  useEffect(() => {
    // Fetch all cryptocurrency images when component loads
    fetchAllCryptoImages();
  }, [fetchAllCryptoImages]);

  // Initialize all trading intervals
  const initializeTrading = useCallback(() => {
    if (!tradingActive) return;

    // Fetch all cryptocurrency images first
    fetchAllCryptoImages();

    // Clear any existing intervals
    Object.values(tradingIntervalsRef.current).forEach(clearInterval);

    // Set new intervals
    tradingIntervalsRef.current = {
      price: setInterval(updateBasePriceFromAPI, 10000),
      pair: setInterval(changeTradingPair, 60000), // Change pair every minute
      orderBook: setInterval(generateOrderBook, 2000),
      tradeHistory: setInterval(generateTradeHistory, 3000), // Generate new trade every 3 seconds
      millisecondPrice: setInterval(simulateMillisecondPriceChanges, 100) // Update every 100ms
    };

    // Initial updates
    updateBasePriceFromAPI();
    generateOrderBook();
    generateTradeHistory(); // Generate initial trade history
  }, [tradingActive, updateBasePriceFromAPI, changeTradingPair, generateOrderBook, generateTradeHistory, simulateMillisecondPriceChanges]);

  // Effect for trading activation
  useEffect(() => {
    if (tradingActive) {
      initializeTrading();
    } else {
      Object.values(tradingIntervalsRef.current).forEach(clearInterval);
    }

    return () => {
      Object.values(tradingIntervalsRef.current).forEach(clearInterval);
    };
  }, [tradingActive, initializeTrading]);

  // Session timer effect
  useEffect(() => {
    let timer;

    // Always have a timer running to update the countdown to midnight
    timer = setInterval(() => {
      if (tradingActive) {
        // When trading is active, we're just updating the UI to show countdown to midnight
        // The actual session time still increments for tracking purposes
        setSessionTime(prev => prev + 1);
      } else {
        setSessionTime(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tradingActive]);

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Effect to handle daily profit activation response
  useEffect(() => {
    if (activateProfitData) {
      setSnackbarMessage('Daily profit activated successfully! You will receive ROI and level ROI income for today.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setActivatingProfit(false);
    }
  }, [activateProfitData]);

  // Effect to handle daily profit activation error
  useEffect(() => {
    if (activateProfitError) {
      setSnackbarMessage(activateProfitError.msg || 'Failed to activate daily profit. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setActivatingProfit(false);
    }
  }, [activateProfitError]);

  const startTrading = async () => {
    // If already active, do nothing
    if (tradingActive) {
      setSnackbarMessage('Trading is already active for today.');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    // If not active, activate trading and daily profit
    try {
      setActivatingProfit(true);

      // Call the API to activate daily profit
      await activateDailyProfit();

      // Set trading active regardless of API response
      // This allows users to use the trading interface even if they've already activated profit for the day
      setTradingActive(true);
    } catch (error) {
      console.error('Error activating daily profit:', error);

      // Check if the error is because trading is already activated today
      if (error.msg && error.msg.includes('already activated today')) {
        setSnackbarMessage('Daily profit already activated today. Trading session started.');
        setSnackbarSeverity('info');
        setTradingActive(true);
      } else {
        // Show error message but still allow trading to be activated
        setSnackbarMessage('Trading activated, but there was an issue activating daily profit.');
        setSnackbarSeverity('warning');
        setTradingActive(true);
      }

      setSnackbarOpen(true);
      setActivatingProfit(false);
    }
  };

  // Enhanced PriceJumper Component
  const PriceJumper = () => {
    const [price, setPrice] = useState(currentBasePrice);
    const [trend, setTrend] = useState('up');
    const [flash, setFlash] = useState(false);
    const [volume24h, setVolume24h] = useState(Math.random() * 1000000 + 500000);
    const [high24h, setHigh24h] = useState(price * 1.05);
    const [low24h, setLow24h] = useState(price * 0.95);
    const [change24h, setChange24h] = useState((Math.random() * 10 - 5).toFixed(2));
    const lastPriceRef = useRef(price);

    // Update price when currentBasePrice changes
    useEffect(() => {
      const oldPrice = lastPriceRef.current;
      const newPrice = currentBasePrice;

      setPrice(newPrice);
      setTrend(newPrice > oldPrice ? 'up' : 'down');
      setFlash(true);

      // Update high/low if needed
      if (newPrice > high24h) setHigh24h(newPrice);
      if (newPrice < low24h) setLow24h(newPrice);

      // Calculate change percentage
      const changePercent = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);
      setChange24h(changePercent);

      // Store the current price for next comparison
      lastPriceRef.current = newPrice;

      setTimeout(() => setFlash(false), 500);
    }, [currentBasePrice]);

    // Update price from millisecond changes for more dynamic display
    useEffect(() => {
      if (millisecondPrices.length > 0) {
        const latestPrice = millisecondPrices[millisecondPrices.length - 1];
        setPrice(latestPrice);
        setTrend(latestPrice > lastPriceRef.current ? 'up' : 'down');
      }
    }, [millisecondPrices]);

    // Fetch 24h market data from CoinGecko API
    useEffect(() => {
      const fetchMarketData = async () => {
        try {
          // Get the current pair's CoinGecko ID
          const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
          if (!currentPair) return;

          // Fetch data from CoinGecko API
          const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${currentPair.id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
          );

          if (response.data && response.data.length > 0) {
            const coinData = response.data[0];

            // Update market data
            setVolume24h(coinData.total_volume || 0);
            setHigh24h(coinData.high_24h || price * 1.05);
            setLow24h(coinData.low_24h || price * 0.95);
            setChange24h(coinData.price_change_percentage_24h?.toFixed(2) || '0.00');

            console.log(`Fetched ${currentPair.fullName} market data from CoinGecko:`, {
              volume: coinData.total_volume,
              high: coinData.high_24h,
              low: coinData.low_24h,
              change: coinData.price_change_percentage_24h
            });
          }
        } catch (error) {
          console.error(`Error fetching market data for ${currentTradingPair}:`, error);

          // Fallback to calculated values if API fails
          setVolume24h(price * 1000);
          setHigh24h(price * 1.05);
          setLow24h(price * 0.95);
          setChange24h('0.00');
        }
      };

      if (tradingActive) {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
      }
    }, [currentTradingPair, tradingActive, price]);

    // Current pair info
    const currentPairInfo = tradingPairs.find(pair => pair.symbol === currentTradingPair) || {};

    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
          animation: flash ? `${flashAnimation} 0.5s ease` : 'none',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header with pair info */}
          <Box sx={{
            p: 2,
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  mr: 1.5,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                {window.tradingPairsData?.find(p => p.id === currentPairInfo.id)?.imageUrl ? (
                  <img
                    src={window.tradingPairsData?.find(p => p.id === currentPairInfo.id)?.imageUrl ||
                         `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`}
                    alt={currentPairInfo.fullName}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerText = currentPairInfo.name?.charAt(0) || 'C';
                    }}
                  />
                ) : (
                  currentPairInfo.name?.charAt(0) || 'C'
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {currentPairInfo.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentPairInfo.fullName}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                label={`${change24h}%`}
                size="small"
                sx={{
                  backgroundColor: parseFloat(change24h) >= 0 ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)',
                  color: parseFloat(change24h) >= 0 ? 'success.main' : 'error.main',
                  fontWeight: 'bold',
                  mr: 1
                }}
                icon={parseFloat(change24h) >= 0 ?
                  <ArrowUpward fontSize="small" sx={{ color: 'success.main' }} /> :
                  <ArrowDownward fontSize="small" sx={{ color: 'error.main' }} />
                }
              />
              <IconButton size="small" onClick={() => updateBasePriceFromAPI()}>
                <Refresh fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Price Display */}
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Typography
                  variant="h3"
                  component="div"
                  fontWeight="bold"
                  color={trend === 'up' ? 'success.main' : 'error.main'}
                  sx={{ transition: 'color 0.3s ease' }}
                >
                  ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>

                {tradingActive && millisecondPrices.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      color: trend === 'up' ? 'success.main' : 'error.main',
                      opacity: 0.8,
                      animation: `${pulseAnimation} 1s infinite`
                    }}
                  >
                    {millisecondPrices[millisecondPrices.length - 1].toFixed(8)}
                  </Box>
                )}
              </Box>
              <Typography
                variant="subtitle1"
                component="span"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                USDT
              </Typography>
            </Box>

            {/* Price Stats */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">24h Volume</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${volume24h.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">24h High</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${high24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">24h Low</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${low24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Market Cap</Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${(price * (Math.random() * 1000000 + 10000000)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Trading Pairs Component
  const TradingPairs = () => {
    // Function to get real price data for a pair
    const getPairData = (pair) => {
      // Try to find the pair in the global trading pairs data
      const pairData = window.tradingPairsData?.find(p => p.id === pair.id);

      if (pairData) {
        return {
          price: pairData.currentPrice ? pairData.currentPrice.toFixed(2) : (Math.random() * 1000 + 100).toFixed(2),
          change: pairData.priceChange24h ? pairData.priceChange24h.toFixed(2) : (Math.random() * 10 - 5).toFixed(2),
          imageUrl: pairData.imageUrl
        };
      }

      // Fallback to random data
      return {
        price: (Math.random() * 1000 + 100).toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        imageUrl: null
      };
    };

    // Debug log to check if we have trading pairs data
    console.log('Trading Pairs Data:', window.tradingPairsData);

    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: { xs: 0, sm: 3 },
          border: { xs: 'none', sm: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` },
          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{
            p: { xs: 1.5, sm: 2 },
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Popular Pairs
            </Typography>
            <Button
              variant="text"
              size="small"
              endIcon={<ArrowUpward fontSize="small" />}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          </Box>

          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {tradingPairs.map((pair) => {
                const pairData = getPairData(pair);
                const isPositive = parseFloat(pairData.change) >= 0;

                return (
                  <Grid item xs={6} sm={4} md={2} key={pair.symbol}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        cursor: 'pointer',
                        backgroundColor: currentTradingPair === pair.symbol
                          ? mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)'
                          : mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                        border: `1px solid ${currentTradingPair === pair.symbol
                          ? 'rgba(240, 185, 11, 0.2)'
                          : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backgroundColor: currentTradingPair === pair.symbol
                            ? mode === 'dark' ? 'rgba(240, 185, 11, 0.15)' : 'rgba(240, 185, 11, 0.1)'
                            : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        }
                      }}
                      onClick={() => setCurrentTradingPair(pair.symbol)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            mr: 1,
                            borderRadius: '50%',
                            bgcolor: currentTradingPair === pair.symbol ? 'primary.main' : 'grey.500',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {pairData.imageUrl ? (
                            <img
                              src={pairData.imageUrl}
                              alt={pair.fullName}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerText = pair.name.charAt(0);
                              }}
                            />
                          ) : (
                            pair.name.charAt(0)
                          )}
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {pair.name}
                        </Typography>
                      </Box>

                      <Typography variant="body2" fontWeight="medium">
                        ${pairData.price}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {isPositive ? (
                          <ArrowUpward sx={{ color: 'success.main', fontSize: 14, mr: 0.5 }} />
                        ) : (
                          <ArrowDownward sx={{ color: 'error.main', fontSize: 14, mr: 0.5 }} />
                        )}
                        <Typography
                          variant="caption"
                          color={isPositive ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {pairData.change}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Trade History Component
  const TradeHistory = () => {
    return (
      <Card
        elevation={0}
        sx={{
          height: '500px',
          borderRadius: 3,
          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{
            p: 2,
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Trade History
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                {tradeHistory.length} trades
              </Typography>
              <IconButton size="small">
                <Refresh fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: '25%', textAlign: 'left' }}>
              Time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '15%', textAlign: 'center' }}>
              Type
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '25%', textAlign: 'right' }}>
              Price
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '35%', textAlign: 'right' }}>
              Amount
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {tradeHistory.length > 0 ? (
              tradeHistory.map((trade) => (
                <Box
                  key={trade.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    py: 0.5,
                    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                  }}
                >
                  <Typography variant="body2" sx={{ width: '25%', textAlign: 'left' }}>
                    {trade.time}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      width: '15%',
                      textAlign: 'center',
                      color: trade.type === 'buy' ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {trade.type.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" sx={{ width: '25%', textAlign: 'right' }}>
                    ${parseFloat(trade.price).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ width: '35%', textAlign: 'right' }}>
                    {trade.amount} {trade.pair.replace('USDT', '')}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  No trades yet. Start trading to see history.
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Order Book Component
  const OrderBook = () => {
    return (
      <Card
        elevation={0}
        sx={{
          height: '500px',
          borderRadius: 3,
          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{
            p: 2,
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="h6" fontWeight="bold">
              Order Book
            </Typography>
            <IconButton size="small">
              <Refresh fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ width: '33%', textAlign: 'left' }}>
              Price (USDT)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '33%', textAlign: 'right' }}>
              Amount (BTC)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '33%', textAlign: 'right' }}>
              Total
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Sell Orders */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {Array.from({ length: 10 }).map((_, index) => {
                const price = currentBasePrice + (10 - index) * 50;
                const amount = Math.random() * 2 + 0.1;
                const total = price * amount;
                const depth = 10 - index; // Depth indicator for visualization

                return (
                  <Box
                    key={`sell-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      position: 'relative',
                      mb: 0.5,
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: `${depth * 10}%`,
                        backgroundColor: alpha('#f6465d', 0.1),
                        zIndex: 0,
                        borderRadius: 1,
                      }
                    }}
                  >
                    <Typography variant="body2" color="error.main" sx={{ width: '33%', textAlign: 'left', zIndex: 1 }}>
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="body2" sx={{ width: '33%', textAlign: 'right', zIndex: 1 }}>
                      {amount.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ width: '33%', textAlign: 'right', zIndex: 1 }}>
                      {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            {/* Current Price */}
            <Box sx={{
              p: 1.5,
              backgroundColor: mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)',
              borderTop: `1px solid ${mode === 'dark' ? 'rgba(240, 185, 11, 0.2)' : 'rgba(240, 185, 11, 0.1)'}`,
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(240, 185, 11, 0.2)' : 'rgba(240, 185, 11, 0.1)'}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary">
                ${currentBasePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Buy Orders */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {Array.from({ length: 10 }).map((_, index) => {
                const price = currentBasePrice - (index + 1) * 50;
                const amount = Math.random() * 2 + 0.1;
                const total = price * amount;
                const depth = index + 1; // Depth indicator for visualization

                return (
                  <Box
                    key={`buy-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      position: 'relative',
                      mb: 0.5,
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: `${depth * 10}%`,
                        backgroundColor: alpha('#0ecb81', 0.1),
                        zIndex: 0,
                        borderRadius: 1,
                      }
                    }}
                  >
                    <Typography variant="body2" color="success.main" sx={{ width: '33%', textAlign: 'left', zIndex: 1 }}>
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="body2" sx={{ width: '33%', textAlign: 'right', zIndex: 1 }}>
                      {amount.toFixed(4)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ width: '33%', textAlign: 'right', zIndex: 1 }}>
                      {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Trend Visualization Component
  const TrendVisualization = () => {
    const svgRef = useRef(null);
    const [chartData, setChartData] = useState([]);
    const [timeLabels, setTimeLabels] = useState([]);
    const [highestPrice, setHighestPrice] = useState(currentBasePrice * 1.05);
    const [lowestPrice, setLowestPrice] = useState(currentBasePrice * 0.95);

    // Generate initial chart data
    useEffect(() => {
      const now = new Date();
      const initialTimeLabels = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(now.getTime() - (19 - i) * 60000);
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      });

      const initialPrices = Array.from({ length: 20 }, () => {
        const randomFactor = 0.98 + Math.random() * 0.04; // Random between 0.98 and 1.02
        return currentBasePrice * randomFactor;
      });

      setTimeLabels(initialTimeLabels);
      setChartData(initialPrices);

      // Find highest and lowest prices
      const highest = Math.max(...initialPrices);
      const lowest = Math.min(...initialPrices);
      setHighestPrice(highest);
      setLowestPrice(lowest);
    }, [currentBasePrice]);

    // Update chart data periodically
    useEffect(() => {
      if (!tradingActive) return;

      const updateChart = () => {
        const now = new Date();
        const newTimeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Generate a new price point with some randomness but following a trend
        const lastPrice = chartData[chartData.length - 1] || currentBasePrice;
        const randomChange = (Math.random() - 0.5) * (lastPrice * 0.01); // Random change up to ±0.5%
        const newPrice = lastPrice + randomChange;

        // Update chart data and time labels
        setChartData(prev => {
          const newData = [...prev, newPrice];
          if (newData.length > 20) {
            return newData.slice(-20);
          }
          return newData;
        });

        setTimeLabels(prev => {
          const newLabels = [...prev, newTimeLabel];
          if (newLabels.length > 20) {
            return newLabels.slice(-20);
          }
          return newLabels;
        });

        // Update highest and lowest prices if needed
        if (newPrice > highestPrice) setHighestPrice(newPrice);
        if (newPrice < lowestPrice) setLowestPrice(newPrice);
      };

      const interval = setInterval(updateChart, 5000);
      return () => clearInterval(interval);
    }, [tradingActive, chartData, highestPrice, lowestPrice, currentBasePrice]);

    // Draw the chart
    const drawChart = () => {
      if (chartData.length < 2) return null;

      const svgWidth = 1000;
      const svgHeight = 300;
      const padding = 30;

      // Calculate scales
      const xScale = (svgWidth - padding * 2) / (chartData.length - 1);
      const yRange = highestPrice - lowestPrice;
      const yScale = (svgHeight - padding * 2) / (yRange || 1);

      // Generate path
      let pathD = '';
      let areaPathD = '';

      chartData.forEach((price, i) => {
        const x = padding + i * xScale;
        const y = svgHeight - padding - ((price - lowestPrice) * yScale);

        if (i === 0) {
          pathD += `M ${x},${y}`;
          areaPathD += `M ${x},${svgHeight - padding} L ${x},${y}`;
        } else {
          pathD += ` L ${x},${y}`;
          areaPathD += ` L ${x},${y}`;
        }

        if (i === chartData.length - 1) {
          areaPathD += ` L ${x},${svgHeight - padding} Z`;
        }
      });

      // Determine if trend is up or down
      const isUp = chartData[chartData.length - 1] >= chartData[0];
      const strokeColor = isUp ? '#0ecb81' : '#f6465d';
      const fillColor = isUp ? 'rgba(14, 203, 129, 0.1)' : 'rgba(246, 70, 93, 0.1)';

      return (
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{
            backgroundColor: 'transparent',
            borderRadius: 8
          }}
        >
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding + i * (svgHeight - padding * 2) / 4;
            const price = highestPrice - (i * yRange / 4);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding}
                  y1={y}
                  x2={svgWidth - padding}
                  y2={y}
                  stroke={mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                  strokeWidth="1"
                />
                <text
                  x={padding - 5}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                >
                  {price.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          })}

          {/* X-axis time labels */}
          {timeLabels.filter((_, i) => i % 4 === 0).map((label, i) => {
            const x = padding + i * 4 * xScale;
            return (
              <text
                key={`time-${i}`}
                x={x}
                y={svgHeight - padding + 15}
                textAnchor="middle"
                fontSize="10"
                fill={mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
              >
                {label}
              </text>
            );
          })}

          {/* Area under the line */}
          <path
            d={areaPathD}
            fill={fillColor}
            opacity="0.5"
          />

          {/* Line chart */}
          <path
            d={pathD}
            stroke={strokeColor}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {chartData.map((price, i) => {
            const x = padding + i * xScale;
            const y = svgHeight - padding - ((price - lowestPrice) * yScale);
            return (
              <circle
                key={`point-${i}`}
                cx={x}
                cy={y}
                r={i === chartData.length - 1 ? 4 : 0}
                fill={strokeColor}
                stroke={mode === 'dark' ? '#1a1a1a' : '#ffffff'}
                strokeWidth="1"
              />
            );
          })}

          {/* Latest price indicator */}
          {chartData.length > 0 && (
            <g>
              <line
                x1={padding + (chartData.length - 1) * xScale}
                y1={svgHeight - padding - ((chartData[chartData.length - 1] - lowestPrice) * yScale)}
                x2={svgWidth - padding}
                y2={svgHeight - padding - ((chartData[chartData.length - 1] - lowestPrice) * yScale)}
                stroke={strokeColor}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <rect
                x={svgWidth - padding + 5}
                y={svgHeight - padding - ((chartData[chartData.length - 1] - lowestPrice) * yScale) - 10}
                width="50"
                height="20"
                rx="4"
                fill={strokeColor}
              />
              <text
                x={svgWidth - padding + 30}
                y={svgHeight - padding - ((chartData[chartData.length - 1] - lowestPrice) * yScale) + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
              >
                {chartData[chartData.length - 1].toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </text>
            </g>
          )}
        </svg>
      );
    };

    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Chart Controls */}
        <Box sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          gap: 1
        }}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            }}
          >
            {['1H', '4H', '1D', '1W', '1M'].map((timeframe) => (
              <Button
                key={timeframe}
                size="small"
                sx={{
                  minWidth: 'auto',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 0,
                  color: timeframe === '1D' ? 'primary.main' : 'text.secondary',
                  backgroundColor: timeframe === '1D'
                    ? mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)'
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: timeframe === '1D'
                      ? mode === 'dark' ? 'rgba(240, 185, 11, 0.15)' : 'rgba(240, 185, 11, 0.1)'
                      : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }
                }}
              >
                {timeframe}
              </Button>
            ))}
          </Paper>
        </Box>

        {/* Chart */}
        <Box sx={{ flex: 1 }}>
          {drawChart()}
        </Box>
      </Box>
    );
  };

  // Format session time as HH:MM:SS
  const formatSessionTime = () => {
    // If trading is active, show time until midnight UTC
    if (tradingActive) {
      const now = new Date();
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0); // Next midnight UTC

      // Calculate time difference in seconds
      const diffSeconds = Math.floor((midnight - now) / 1000);

      if (diffSeconds <= 0) {
        return "00:00:00"; // Midnight has passed
      }

      const hours = Math.floor(diffSeconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((diffSeconds % 3600) / 60).toString().padStart(2, '0');
      const seconds = (diffSeconds % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } else {
      // Show session time as before
      const hours = Math.floor(sessionTime / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((sessionTime % 3600) / 60).toString().padStart(2, '0');
      const seconds = (sessionTime % 60).toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
  };

  return (
    <Box sx={{
      width: '100vw',
      maxWidth: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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
      {/* Trust Wallet Style Header */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          width: '100%',
          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          color: theme.palette.text.primary
        }}
      >
        <Toolbar sx={{
          justifyContent: 'space-between',
          width: '100%',
          px: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Live Trading
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {tradingActive && (
              <Box sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                mr: 2,
                backgroundColor: mode === 'dark' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(14, 203, 129, 0.05)',
                borderRadius: 2,
                px: 1.5,
                py: 0.5
              }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#0ecb81',
                    boxShadow: '0 0 10px rgba(14, 203, 129, 0.8)',
                    mr: 1,
                    animation: `${pulseAnimation} 1.5s infinite`
                  }}
                />
                <Tooltip title={tradingActive ? "Time until trading resets (Midnight UTC)" : "Session time"}>
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    {formatSessionTime()}
                  </Typography>
                </Tooltip>
              </Box>
            )}

            <Button
              variant="contained"
              size="medium"
              onClick={startTrading}
              startIcon={activatingProfit ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              disabled={activatingProfit || tradingActive}
              sx={{
                borderRadius: 4,
                px: { xs: 1, sm: 2 },
                py: 1,
                background: tradingActive
                  ? 'linear-gradient(45deg, #0ecb81, #0bb974)'
                  : 'linear-gradient(45deg, #f6465d, #ff0033)',
                boxShadow: tradingActive
                  ? '0 0 20px rgba(14, 203, 129, 0.3)'
                  : '0 0 20px rgba(246, 70, 93, 0.3)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 0 30px ${alpha(tradingActive ? '#0ecb81' : '#f6465d', 0.4)}`,
                },
                '&.Mui-disabled': {
                  background: tradingActive
                    ? 'linear-gradient(45deg, #0ecb81, #0bb974)'
                    : 'linear-gradient(45deg, #f6465d, #ff0033)',
                  opacity: 0.7,
                }
              }}
            >
              {activatingProfit ? 'Activating...' : (tradingActive ? 'Trading Active' : 'Start Trading')}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{
        width: '100vw',
        maxWidth: '100%',
        px: 0,
        mt: { xs: 1, sm: 2, md: 3 },
        mb: { xs: 4, sm: 6, md: 8 },
        overflowX: 'hidden'
      }}>
        <Grid container spacing={{ xs: 0, sm: 1, md: 2 }} sx={{ width: '100%', mx: 0 }}>
             {/* Trading Stats */}
             <Grid item xs={12} sx={{ width: '100%', px: { xs: 0, sm: 1 } }}>
            <Card
              elevation={0}
              sx={{
                width: '100%',
                borderRadius: { xs: 0, sm: 3 },
                border: { xs: 'none', sm: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` },
                backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
              }}
            >
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 2
                }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: { xs: 1, sm: 0 } }}>Trading Statistics</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Welcome, {user?.name || 'Trader'}
                  </Typography>
                </Box>
                <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Investment</Typography>
                      {profileLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">Loading...</Typography>
                        </Box>
                      ) : (
                        <Typography variant={{ xs: 'h6', md: 'h5' }} fontWeight="bold">
                          {formatCurrency(totalInvestment)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                      <Typography variant={{ xs: 'h6', md: 'h5' }} fontWeight="bold" color="success.main">
                        {successRate}%
                      </Typography>
                      {tradingActive && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={successRate}
                            color="success"
                            sx={{
                              height: { xs: 4, sm: 6 },
                              borderRadius: { xs: 2, sm: 3 },
                              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Daily Profit ({dailyProfitRate}%)</Typography>
                      <Typography variant={{ xs: 'h6', md: 'h5' }} fontWeight="bold" color="success.main">
                        +{formatCurrency(dailyProfit)}
                      </Typography>
                      {tradingActive && (
                        <Typography variant="caption" color="text.secondary">
                          {totalTrades} trades executed
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {tradingActive ? 'Current Session Profit' : 'Total Profit'}
                      </Typography>
                      <Typography variant={{ xs: 'h6', md: 'h5' }} fontWeight="bold" color="success.main">
                        +{formatCurrency(accumulatedProfit)}
                      </Typography>
                      {tradingActive && (
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mt: 0.5,
                          animation: `${pulseAnimation} 2s infinite`
                        }}>
                          <Box
                            sx={{
                              width: { xs: 4, sm: 6 },
                              height: { xs: 4, sm: 6 },
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              mr: 0.5
                            }}
                          />
                          <Typography variant="caption" color="success.main">
                            Live updating
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sx={{ width: '100%', px: { xs: 0, sm: 1 } }}>
            <PriceJumper />
          </Grid>

          <Grid item xs={12} sx={{ width: '100%', px: { xs: 0, sm: 1 } }}>
            <TradingPairs />
          </Grid>

          {/* Main Trading Interface */}
          <Grid item xs={12} sx={{ width: '100%', px: { xs: 0, sm: 1 } }}>
            <Card
              elevation={0}
              sx={{
                width: '100%',
                borderRadius: { xs: 0, sm: 3 },
                border: { xs: 'none', sm: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` },
                backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Trading Header */}
                <Box sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'space-between', sm: 'flex-start' }
                  }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mr: 2 }}>
                      Live Trading
                    </Typography>
                    <Chip
                      label={currentTradingPair}
                      size="small"
                      sx={{
                        backgroundColor: mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)',
                        color: 'primary.main',
                        fontWeight: 'bold',
                        mr: 1
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color={tradingActive ? "success.main" : "text.secondary"}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      animation: tradingActive ? `${pulseAnimation} 2s infinite` : 'none'
                    }}
                  >
                    {tradingActive && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          mr: 0.5
                        }}
                      />
                    )}
                    {tradingActive ? 'Trading Active (Until Midnight UTC)' : 'Trading Inactive'}
                  </Typography>
                </Box>

                {/* Trading Interface */}
                <Grid container>
                  {/* Full Width Order Book */}
                  <Grid item xs={12} sx={{
                    height: { xs: 'auto', sm: '600px' },
                    backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5',
                    width: '100vw',
                    maxWidth: '100%',
                    m: 0,
                    p: 0
                  }}>
                    <Box sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                      backgroundColor: mode === 'dark' ? '#1a1a1a' : '#ffffff',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>Order Book</Typography>
                        {/* Current pair icon */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            mr: 0.5,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {window.tradingPairsData?.find(p => p.id === tradingPairs.find(pair => pair.symbol === currentTradingPair)?.id)?.imageUrl ? (
                            <img
                              src={window.tradingPairsData?.find(p => p.id === tradingPairs.find(pair => pair.symbol === currentTradingPair)?.id)?.imageUrl ||
                                   `https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png`}
                              alt={currentTradingPair}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerText = currentTradingPair.charAt(0);
                              }}
                            />
                          ) : (
                            currentTradingPair.charAt(0)
                          )}
                        </Box>
                      </Box>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'space-between', sm: 'flex-start' }
                      }}>
                        <Chip
                          label={currentTradingPair}
                          size="small"
                          sx={{
                            backgroundColor: mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)',
                            color: 'primary.main',
                            fontWeight: 'bold',
                            mr: 1
                          }}
                        />
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          ml: 1
                        }}>
                          <Box
                            sx={{
                              width: { xs: 6, sm: 8 },
                              height: { xs: 6, sm: 8 },
                              borderRadius: '50%',
                              bgcolor: tradingActive ? 'success.main' : 'text.disabled',
                              mr: 0.5
                            }}
                          />
                          <Typography variant="body2" color={tradingActive ? "success.main" : "text.secondary"}>
                            {tradingActive ? 'Trading Active (Until Midnight UTC)' : 'Trading Inactive'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{
                      height: { xs: 'auto', sm: 'calc(100% - 56px)' },
                      maxHeight: { xs: '70vh', sm: 'none' },
                      overflow: 'auto',
                      width: '100%'
                    }}>
                      {/* Order Book Header */}
                      <Box sx={{
                        display: 'flex',
                        p: { xs: 0.75, sm: 1 },
                        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        backgroundColor: mode === 'dark' ? '#1a1a1a' : '#f9f9f9',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                      }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            width: '15%',
                            pl: { xs: 0.5, sm: 1 },
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          Type
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            width: '30%',
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          Price (USDT)
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            width: '25%',
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          Amount (BTC)
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            width: '30%',
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          Total (USDT)
                        </Typography>
                      </Box>

                      {/* Sell Orders */}
                      <Box sx={{
                        backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                        width: '100%'
                      }}>
                        {Array.from({ length: 12 }).map((_, index) => {
                          // Generate realistic looking prices that decrease slightly
                          const basePrice = 94486;
                          const priceDiff = index * 50;
                          const price = basePrice - priceDiff;

                          // Generate realistic amounts with 4 decimal places
                          const amount = (Math.random() * 2 + 0.1).toFixed(4);

                          // Calculate total
                          const total = (price * parseFloat(amount)).toFixed(2);

                          return (
                            <Box
                              key={`sell-${index}`}
                              sx={{
                                display: 'flex',
                                position: 'relative',
                                py: { xs: 0.5, sm: 0.75 },
                                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                                '&:hover': {
                                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${(12 - index) * 8}%`,
                                  backgroundColor: 'rgba(246, 70, 93, 0.1)',
                                  zIndex: 0
                                }
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="error.main"
                                sx={{
                                  width: '15%',
                                  pl: { xs: 0.5, sm: 1 },
                                  zIndex: 1,
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                SELL
                              </Typography>
                              <Typography
                                variant="body2"
                                color="error.main"
                                sx={{
                                  width: '30%',
                                  zIndex: 1,
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {price.toLocaleString()}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  width: '25%',
                                  zIndex: 1,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {amount}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  width: '30%',
                                  zIndex: 1,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {parseFloat(total).toLocaleString()}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>

                      {/* Current Price */}
                      <Box sx={{
                        p: { xs: 0.75, sm: 1 },
                        backgroundColor: mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)',
                        borderTop: `1px solid ${mode === 'dark' ? 'rgba(240, 185, 11, 0.2)' : 'rgba(240, 185, 11, 0.1)'}`,
                        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(240, 185, 11, 0.2)' : 'rgba(240, 185, 11, 0.1)'}`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'sticky',
                        zIndex: 5
                      }}>
                        <Typography
                          variant={{ xs: 'subtitle2', sm: 'subtitle1' }}
                          fontWeight="bold"
                          color="primary.main"
                        >
                          ${currentBasePrice.toLocaleString()}
                        </Typography>
                      </Box>

                      {/* Buy Orders */}
                      <Box sx={{
                        backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                        width: '100%'
                      }}>
                        {Array.from({ length: 12 }).map((_, index) => {
                          // Generate realistic looking prices that decrease slightly
                          const basePrice = 94386;
                          const priceDiff = index * 50;
                          const price = basePrice - priceDiff;

                          // Generate realistic amounts with 4 decimal places
                          const amount = (Math.random() * 2 + 0.1).toFixed(4);

                          // Calculate total
                          const total = (price * parseFloat(amount)).toFixed(2);

                          return (
                            <Box
                              key={`buy-${index}`}
                              sx={{
                                display: 'flex',
                                position: 'relative',
                                py: { xs: 0.5, sm: 0.75 },
                                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                                '&:hover': {
                                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${(index + 1) * 8}%`,
                                  backgroundColor: 'rgba(14, 203, 129, 0.1)',
                                  zIndex: 0
                                }
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="success.main"
                                sx={{
                                  width: '15%',
                                  pl: { xs: 0.5, sm: 1 },
                                  zIndex: 1,
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                BUY
                              </Typography>
                              <Typography
                                variant="body2"
                                color="success.main"
                                sx={{
                                  width: '30%',
                                  zIndex: 1,
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {price.toLocaleString()}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  width: '25%',
                                  zIndex: 1,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {amount}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  width: '30%',
                                  zIndex: 1,
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {parseFloat(total).toLocaleString()}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>


        </Grid>
      </Box>
    </Box>
  );
};

export default LiveTrading;
