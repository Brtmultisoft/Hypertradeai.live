import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  Stack,
  Fade,
  Zoom,
  Grow,
} from '@mui/material';
import {
  Refresh,
  ArrowUpward,
  ArrowDownward,
  PlayArrow,
  Stop,
  TrendingUp,
  BarChart,
  ShowChart,
  Timeline,
  Bolt,
  Speed,
  Autorenew,
  CurrencyExchange,
  Paid,
  AccountBalanceWallet,
  Insights,
  Analytics,
  Equalizer,
  SwapHoriz,
  ArrowDropDown,
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

const bubbleAnimation = keyframes`
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  80% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-100px);
    opacity: 0;
  }
`;

const jumpAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
`;

const pairChangeAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Trading pairs with Binance symbols and supported exchanges
const tradingPairs = [
  {
    symbol: 'BTCUSDT',
    name: 'BTC/USDT',
    fullName: 'Bitcoin',
    id: 'bitcoin',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx', 'gate', 'coinbase']
  },
  {
    symbol: 'ETHUSDT',
    name: 'ETH/USDT',
    fullName: 'Ethereum',
    id: 'ethereum',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx', 'gate', 'coinbase']
  },
  {
    symbol: 'BNBUSDT',
    name: 'BNB/USDT',
    fullName: 'Binance Coin',
    id: 'binancecoin',
    supportedExchanges: ['binance', 'kucoin', 'gate']
  },
  {
    symbol: 'SOLUSDT',
    name: 'SOL/USDT',
    fullName: 'Solana',
    id: 'solana',
    supportedExchanges: ['binance', 'kucoin', 'okx', 'crypto']
  },
  {
    symbol: 'XRPUSDT',
    name: 'XRP/USDT',
    fullName: 'Ripple',
    id: 'ripple',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx', 'gate']
  },
  {
    symbol: 'ADAUSDT',
    name: 'ADA/USDT',
    fullName: 'Cardano',
    id: 'cardano',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'gate']
  },
  {
    symbol: 'DOGEUSDT',
    name: 'DOGE/USDT',
    fullName: 'Dogecoin',
    id: 'dogecoin',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx']
  },
  {
    symbol: 'MATICUSDT',
    name: 'MATIC/USDT',
    fullName: 'Polygon',
    id: 'polygon',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx', 'gate']
  },
  {
    symbol: 'DOTUSDT',
    name: 'DOT/USDT',
    fullName: 'Polkadot',
    id: 'polkadot',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx', 'gate']
  },
  {
    symbol: 'AVAXUSDT',
    name: 'AVAX/USDT',
    fullName: 'Avalanche',
    id: 'avalanche',
    supportedExchanges: ['binance', 'kucoin', 'crypto', 'okx', 'gate']
  }
];

// Function to create profit bubbles with enhanced visuals (only positive profits)
const createProfitBubble = (amount, isPositive, exchangeName) => {
  // Create a bubble element - always use profit class
  const bubble = document.createElement('div');
  bubble.className = 'profit-bubble profit'; // Always profit, never loss

  // Format the amount with proper decimal places based on value
  const formattedAmount = parseFloat(amount).toFixed(
    parseFloat(amount) < 0.001 ? 6 : parseFloat(amount) < 0.01 ? 5 : 4
  );

  // Create amount element with enhanced styling
  const amountSpan = document.createElement('span');
  amountSpan.textContent = `+${formattedAmount} USDT`; // Always positive
  amountSpan.style.fontSize = '15px';
  bubble.appendChild(amountSpan);

  // Add exchange name if provided
  if (exchangeName) {
    const exchangeSpan = document.createElement('span');
    exchangeSpan.className = 'exchange-name';

    // Add small icon before exchange name for visual enhancement
    // Always use up arrow for positive profit
    exchangeSpan.textContent = `↗ ${exchangeName}`;

    bubble.appendChild(exchangeSpan);
  }

  // Set random position on the screen with more variation
  const randomX = Math.floor(Math.random() * 70) + 15; // 15% to 85% of screen width
  const randomOffset = Math.floor(Math.random() * 5); // Small random offset for natural look
  bubble.style.left = `${randomX}%`;
  bubble.style.bottom = `${5 + randomOffset}%`;

  // Add slight random rotation for more natural movement
  const randomRotation = Math.random() * 6 - 3; // -3 to +3 degrees
  bubble.style.transform = `rotate(${randomRotation}deg)`;

  // Add to the DOM
  const container = document.getElementById('profit-bubbles-container');
  if (container) {
    container.appendChild(bubble);

    // Remove the bubble after animation completes (increased to match the 8s animation)
    setTimeout(() => {
      if (container.contains(bubble)) {
        container.removeChild(bubble);
      }
    }, 8500); // Slightly longer than animation to ensure complete removal
  }
};

const LiveTradingOld = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  // Get user data from auth context
  const { user } = useAuth();
  const [tradingActive, setTradingActive] = useState(false); // Set to false by default until we check the user's status
  const [hasInvested, setHasInvested] = useState(false); // Track if user has made an investment
  const [sessionTime, setSessionTime] = useState(0);
  const [currentBasePrice, setCurrentBasePrice] = useState(45000);
  const [currentTradingPair, setCurrentTradingPair] = useState('BTCUSDT');
  const [selectedExchanges, setSelectedExchanges] = useState(['binance', 'kucoin', 'crypto', 'okx', 'gate']);

  // State for exchange objects with logos and names
  const [exchangeObjects, setExchangeObjects] = useState([
    {
      id: 'binance',
      name: 'Binance',
      logo:'https://public.bnbstatic.com/20190405/eb2349c3-b2f8-4a93-a286-8f86a62ea9d8.png',
      // logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=',
      active: true,
      profit: '+0.0037 USDT',
      highlight: false,
      fallbackLogo: 'https://public.bnbstatic.com/20190405/eb2349c3-b2f8-4a93-a286-8f86a62ea9d8.png'
    },
    {
      id: 'kucoin',
      name: 'KuCoin',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+',
      active: true,
      profit: '+0.0055 USDT',
      highlight: false,
      fallbackLogo: 'https://ui-avatars.com/api/?name=K&background=random&color=fff&size=100'
    },
    {
      id: 'crypto',
      name: 'Crypto.com',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=',
      active: true,
      profit: '+0.0042 USDT',
      highlight: false,
      fallbackLogo: 'https://ui-avatars.com/api/?name=C&background=random&color=fff&size=100'
    },
    {
      id: 'okx',
      name: 'OKX',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=',
      active: true,
      profit: '+0.0023 USDT',
      highlight: false,
      fallbackLogo: 'https://ui-avatars.com/api/?name=O&background=random&color=fff&size=100'
    },
    {
      id: 'gate',
      name: 'Gate.io',
      logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+',
      active: true,
      profit: '-0.0008 USDT',
      highlight: false,
      fallbackLogo: 'https://ui-avatars.com/api/?name=G&background=random&color=fff&size=100'
    }
  ]);

  // Reference to track active exchanges for synchronization between components
  const activeExchangesRef = useRef(selectedExchanges);
  const [showPairSelector, setShowPairSelector] = useState(false);
  const [showExchangeSelector, setShowExchangeSelector] = useState(false);
  const [flash, setFlash] = useState(false);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [dailyProfitRate, setDailyProfitRate] = useState(0.26); // 0.26% daily profit
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
    }
    // Fallback to user object if available
    else if (user?.total_investment) {
      totalAmount = user.total_investment;
    }

    if (totalAmount > 0) {
      setTotalInvestment(totalAmount);
      setHasInvested(true); // Set hasInvested to true if user has investment

      // Calculate daily profit (0.8% of total investment)
      const dailyProfitAmount = totalAmount * (dailyProfitRate / 100);
      setDailyProfit(dailyProfitAmount);
    } else {
      setHasInvested(false); // Set hasInvested to false if user has no investment
    }
  }, [profileData, user, dailyProfitRate]);

  // Calculate profit per second for use in multiple places
  const profitPerSecond = useMemo(() => {
    if (dailyProfit > 0) {
      // Calculate profit per second (daily profit / seconds in a day)
      return dailyProfit / (24 * 60 * 60);
    }
    return 0;
  }, [dailyProfit]);

  // Update accumulated profit based on session time with precise calculation
  // Only increasing, never decreasing
  useEffect(() => {
    if (!tradingActive || profitPerSecond <= 0) {
      setAccumulatedProfit(0);
      setTotalTrades(0);
      return;
    }

    // Create an interval to update the accumulated profit every second
    const profitInterval = setInterval(() => {
      // Get the exact current session time (in case it changed between renders)
      const currentSessionTime = sessionTime;

      // Calculate the precise accumulated profit
      const exactProfit = profitPerSecond * currentSessionTime;

      // Update the accumulated profit with the precise value
      // Always increase, never decrease
      setAccumulatedProfit(prevProfit => {
        // Only update if the new profit is higher than the previous
        return exactProfit > prevProfit ? exactProfit : prevProfit;
      });

      // Update total trades (1 trade every 5 seconds on average)
      setTotalTrades(Math.floor(currentSessionTime / 5));
    }, 1000); // Update every second

    return () => clearInterval(profitInterval);
  }, [tradingActive, profitPerSecond]);

  // Bubble generation removed to fix removeChild errors

  // We'll move this useEffect after the fetchAllCryptoImages function is defined

  // Function to fetch real price data from Binance API - optimized to use ticker/price endpoint
  const updateBasePriceFromAPI = useCallback(async () => {
    try {
      // Get the current pair
      const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
      if (!currentPair) return;

      // Use the lightweight ticker/price endpoint instead of 24hr
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${currentTradingPair}`);

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the price from Binance API response
      const newPrice = parseFloat(data.price);

      // Update the current base price with real data
      setCurrentBasePrice(newPrice);

      // Update millisecond prices for more dynamic display
      setMillisecondPrices(prev => {
        const newPrices = [...prev, newPrice];
        if (newPrices.length > 20) {
          return newPrices.slice(-20);
        }
        return newPrices;
      });

      // Set flash effect to indicate price update
      setFlash(true);

      // Reset flash after animation completes
      setTimeout(() => setFlash(false), 500);
    } catch (error) {
      console.error(`Error fetching ${currentTradingPair} price from Binance API:`, error);

      // Fallback to simpler mock data if API fails
      const fallbackPrice = currentBasePrice ?
        currentBasePrice * (1 + (Math.random() * 0.004 - 0.002)) : // ±0.2% change from last price
        100 + (Math.random() * 10 - 5); // Initial fallback if no price exists

      const newPrice = parseFloat(fallbackPrice.toFixed(2));
      setCurrentBasePrice(newPrice);

      // Update millisecond prices
      setMillisecondPrices(prev => {
        const newPrices = [...prev, newPrice];
        if (newPrices.length > 20) {
          return newPrices.slice(-20);
        }
        return newPrices;
      });
    }
  }, [currentTradingPair, currentBasePrice, tradingPairs]);

  // Change trading pair automatically with visual effects
  const changeTradingPair = useCallback(() => {
    // Always run regardless of tradingActive state to ensure pairs change automatically

    // Prioritize popular pairs (BTC, ETH, BNB, SOL, XRP)
    const popularPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT'];

    // Get current index
    let currentIndex = tradingPairs.findIndex(pair => pair.symbol === currentTradingPair);
    let nextIndex;

    // 80% chance to select from popular pairs, 20% chance for any other pair
    if (Math.random() < 0.8) {
      // Find the current popular pair index
      const currentPopularIndex = popularPairs.indexOf(currentTradingPair);

      // Get the next popular pair (cycle through them)
      const nextPopularIndex = (currentPopularIndex + 1) % popularPairs.length;
      const nextPopularPair = popularPairs[nextPopularIndex];

      // Find this pair in our trading pairs array
      nextIndex = tradingPairs.findIndex(pair => pair.symbol === nextPopularPair);

      // If not found, just pick a random popular pair
      if (nextIndex === -1) {
        const randomPopularPair = popularPairs[Math.floor(Math.random() * popularPairs.length)];
        nextIndex = tradingPairs.findIndex(pair => pair.symbol === randomPopularPair);
      }
    } else {
      // Pick a random pair that's not the current one
      do {
        nextIndex = Math.floor(Math.random() * tradingPairs.length);
      } while (nextIndex === currentIndex);
    }

    // If we still don't have a valid index, just pick a random one
    if (nextIndex === -1) {
      do {
        nextIndex = Math.floor(Math.random() * tradingPairs.length);
      } while (nextIndex === currentIndex);
    }

    // Use state-based animation for the card
    setFlash(true);

    // Update the trading pair
    setCurrentTradingPair(tradingPairs[nextIndex].symbol);

    // Also update the base price to simulate price changes when switching pairs
    const newBasePrice = currentBasePrice * (1 + (Math.random() * 0.04 - 0.02)); // ±2% change
    setCurrentBasePrice(parseFloat(newBasePrice.toFixed(2)));

    // Also update the selected exchanges when the pair changes
    updateSelectedExchangesForPair(tradingPairs[nextIndex]);

    // Create profit bubbles for the new pair based on daily profit rate
    if (tradingActive && dailyProfit > 0) {
      try {
        // For pair changes, we want to show a significant portion of the daily profit
        // Each pair change is a significant event in the trading day

        // Calculate how many pair changes might occur in a day (roughly 24-48)
        const pairChangesPerDay = 36; // Estimated number of pair changes per day

        // Calculate the profit per pair change based on daily profit
        const profitPerPairChange = dailyProfit / pairChangesPerDay;

        // Determine how many bubbles to create for this pair change
        // Always at least 1, at most 2 bubbles
        const numBubbles = 1; // 1-2 bubbles

        // First bubble appears after a longer delay to seem more natural
        const initialDelay = Math.floor(Math.random() * 800) + 1000; // 500-1300ms initial delay

        // for (let i = 0; i < numBubbles; i++) {
        //   setTimeout(() => {
        //     // Always positive profit (100% chance) - no losses as requested

        //     // Generate profit amounts based on daily profit rate
        //     let profitAmount;

        //     // Special case: first bubble is always larger to signify the pair change
        //     if (i === 0) {
        //       // First bubble represents a significant portion of the profit per pair change
        //       profitAmount = (profitPerPairChange * (Math.random() * 0.3 + 0.7)).toFixed(6); // 70-100% of profit per pair change
        //     } else {
        //       // Second bubble is smaller
        //       profitAmount = (profitPerPairChange * (Math.random() * 0.2 + 0.3)).toFixed(6); // 30-50% of profit per pair change
        //     }

        //     // Get a random exchange from the selected ones, but with preference for major exchanges
        //     let randomExchangeId;
        //     if (Math.random() < 0.8) { // Increased chance for major exchanges during pair changes
        //       // 80% chance to pick from major exchanges
        //       const majorExchanges = ['binance', 'okx', 'kucoin'].filter(ex => selectedExchanges.includes(ex));
        //       if (majorExchanges.length > 0) {
        //         randomExchangeId = majorExchanges[Math.floor(Math.random() * majorExchanges.length)];
        //       } else {
        //         randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
        //       }
        //     } else {
        //       // 20% chance to pick any exchange
        //       randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
        //     }

        //     const exchangeObj = exchangeObjects.find(ex => ex.id === randomExchangeId);
        //     const exchangeName = exchangeObj ? exchangeObj.name : randomExchangeId;

        //     // Create the bubble - first bubble has a high chance to be a big profit bubble
        //     if (i === 0 && Math.random() < 0.7) { // 70% chance for first bubble to be big profit
        //       // Create special big profit bubble for the first bubble
        //       const bubble = document.createElement('div');
        //       bubble.className = `profit-bubble profit big-profit`;

        //       // Format the amount with proper decimal places
        //       const formattedAmount = parseFloat(profitAmount).toFixed(4);

        //       // Create amount element with enhanced styling
        //       const amountSpan = document.createElement('span');
        //       amountSpan.textContent = `+${formattedAmount} USDT`; // Always positive
        //       amountSpan.style.fontSize = '18px';
        //       bubble.appendChild(amountSpan);

        //       // Add exchange name with special formatting
        //       const exchangeSpan = document.createElement('span');
        //       exchangeSpan.className = 'exchange-name';
        //       exchangeSpan.textContent = `⭐ ${exchangeName} ⭐`;
        //       exchangeSpan.style.fontSize = '12px';
        //       exchangeSpan.style.fontWeight = 'bold';
        //       bubble.appendChild(exchangeSpan);

        //       // Center the big profit bubble more
        //       const randomX = Math.floor(Math.random() * 40) + 30; // 30% to 70% of screen width
        //       bubble.style.left = `${randomX}%`;
        //       bubble.style.bottom = '8%';

        //       // Add to the DOM
        //       const container = document.getElementById('profit-bubbles-container');
        //       if (container) {
        //         container.appendChild(bubble);

        //         // Remove the bubble after animation completes
        //         setTimeout(() => {
        //           if (container.contains(bubble)) {
        //             container.removeChild(bubble);
        //           }
        //         }, 10500); // Slightly longer than animation to ensure complete removal
        //       }
        //     } else {
        //       // Regular profit bubble
        //       // createProfitBubble(profitAmount, true, exchangeName); // Always positive
        //     }

        //     // Always highlight this exchange for pair changes
        //     setExchangeObjects(prev => {
        //       return prev.map(exchange => {
        //         if (exchange.id === randomExchangeId) {
        //           return {
        //             ...exchange,
        //             highlight: true,
        //             profit: `+${profitAmount} USDT` // Always positive
        //           };
        //         }
        //         return exchange;
        //       });
        //     });
        //   }, initialDelay + i * Math.floor(Math.random() * 1200 + 2000)); // More natural staggered timing (1000-2200ms between bubbles)
        // }
      } catch (error) {
        console.log("Error creating pair change bubbles:", error);
      }
    }
  }, [currentTradingPair, currentBasePrice, tradingPairs, tradingActive, selectedExchanges, exchangeObjects, profitPerSecond, dailyProfit]);

  // Helper function to update selected exchanges based on the current pair
  const updateSelectedExchangesForPair = useCallback((pair) => {
    // Get supported exchanges for this pair
    const supportedExchanges = pair.supportedExchanges || ['binance', 'kucoin', 'crypto', 'okx', 'gate'];

    // Always include major exchanges if supported
    const majorExchanges = ['binance', 'okx', 'kucoin'].filter(ex =>
      supportedExchanges.includes(ex)
    );

    // Add 1-2 more random exchanges from the remaining supported ones
    const remainingExchanges = supportedExchanges.filter(ex => !majorExchanges.includes(ex));
    const numAdditional = Math.floor(Math.random() * 2) + 1; // 1-2 additional exchanges

    let selectedExchanges = [...majorExchanges];

    for (let i = 0; i < numAdditional && i < remainingExchanges.length; i++) {
      const randomIndex = Math.floor(Math.random() * remainingExchanges.length);
      const exchange = remainingExchanges[randomIndex];

      if (!selectedExchanges.includes(exchange)) {
        selectedExchanges.push(exchange);
        remainingExchanges.splice(randomIndex, 1);
      }
    }

    // Update the selected exchanges
    setSelectedExchanges(selectedExchanges);

    // Also update the exchangeObjects to highlight the selected ones
    setExchangeObjects(prev => {
      return prev.map(exchange => {
        // Check if this exchange is in the selected list
        const isSelected = selectedExchanges.includes(exchange.id);

        // Generate a new random profit value for selected exchanges
        let profit = exchange.profit;
        if (isSelected) {
          const isPositive = Math.random() > 0.3; // 70% chance of positive profit
          const profitAmount = (Math.random() * (isPositive ? 0.01 : 0.005) + 0.0001).toFixed(6);
          profit = `${isPositive ? '+' : '-'}${profitAmount} USDT`;
        }

        return {
          ...exchange,
          active: isSelected,
          highlight: isSelected && Math.random() > 0.5, // 50% chance to highlight selected exchanges
          profit: profit
        };
      });
    });
  }, []);



  // Generate order book data
  const generateOrderBook = useCallback(() => {
    // This function now just simulates order book data generation
    // We don't need to store it since we generate it on the fly in the OrderBook component
    // No-op function to avoid unnecessary console logs
  }, []);

  // Generate trade history data with exchange information
  const generateTradeHistory = useCallback(() => {
    if (!tradingActive) {
      // Clear trade history when trading is not active
      setTradeHistory([]);
      return;
    }

    // Generate a new trade based on current price
    const tradeType = Math.random() > 0.5 ? 'buy' : 'sell';
    const tradeAmount = (Math.random() * 0.5 + 0.01).toFixed(6);

    // Make price close to current price but with small variation
    const variation = Math.random() * 0.002 - 0.001; // ±0.1%
    const tradePrice = currentBasePrice * (1 + variation);

    // Get current pair info
    const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
    const symbol = currentPair ? currentPair.symbol.replace('USDT', '') : 'BTC';

    // Get a random active exchange for this trade using embedded SVG data URLs
    const exchangeOptions = [
      {
        name: 'Binance',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0037 USDT',
        id: 'binance',
        highlight: true,
        fallbackLogo: 'https://ui-avatars.com/api/?name=B&background=random&color=fff&size=100'
      },
      {
        name: 'KuCoin',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+',
        active: true,
        profit: '+0.0055 USDT',
        id: 'kucoin',
        highlight: true,
        fallbackLogo: 'https://ui-avatars.com/api/?name=K&background=random&color=fff&size=100'
      },
      {
        name: 'Crypto.com',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0042 USDT',
        id: 'crypto',
        highlight: true,
        fallbackLogo: 'https://ui-avatars.com/api/?name=C&background=random&color=fff&size=100'
      },
      {
        name: 'OKX',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0023 USDT',
        id: 'okx',
        highlight: true,
        fallbackLogo: 'https://ui-avatars.com/api/?name=O&background=random&color=fff&size=100'
      }
    ];

    const randomExchange = exchangeOptions[Math.floor(Math.random() * exchangeOptions.length)];

    // Generate profit/loss for this trade
    const isPositive = Math.random() > 0.3; // 70% chance of positive profit
    const profitAmount = (Math.random() * (isPositive ? 0.01 : 0.005) + 0.0001).toFixed(6);
    const profitText = `${isPositive ? '+' : '-'}${profitAmount}`;

    // Create the new trade with exchange info
    const newTrade = {
      id: Date.now(),
      type: tradeType,
      price: tradePrice,
      amount: tradeAmount,
      total: tradePrice * parseFloat(tradeAmount),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pair: currentTradingPair,
      symbol: symbol,
      exchange: {
        ...randomExchange,
        profit: profitText + ' USDT'
      }
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

    // Update accumulated profit based on the new trade
    setAccumulatedProfit(prev => {
      const profitValue = parseFloat(profitAmount) * (isPositive ? 1 : -1);
      return prev + profitValue;
    });

    // Update success rate randomly (but keep it high)
    if (Math.random() > 0.8) {
      const newSuccessRate = Math.floor(Math.random() * 10) + 80; // 80-90%
      setSuccessRate(newSuccessRate);
    }
  }, [tradingActive, currentBasePrice, currentTradingPair]);

  // Function to simulate millisecond price changes with reduced API calls
  const simulateMillisecondPriceChanges = useCallback(() => {
    if (!tradingActive || !currentTradingPair) return;

    // Use the current base price as reference instead of making API calls
    // This significantly reduces API load while still providing realistic price movements
    const basePrice = currentBasePrice;

    if (basePrice <= 0) return;

    // Generate a small random change (±0.01%)
    const randomChange = basePrice * (0.0001 * (Math.random() - 0.5));
    const newPrice = basePrice + randomChange;

    // Update millisecond prices
    setMillisecondPrices(prev => {
      const newPrices = [...prev, newPrice];
      if (newPrices.length > 100) {
        return newPrices.slice(-100);
      }
      return newPrices;
    });
  }, [tradingActive, currentTradingPair, currentBasePrice]);

  // Function to fetch all cryptocurrency images - using mock data
  const fetchAllCryptoImages = useCallback(async () => {
    // Mock cryptocurrency data with images
    const mockCryptoData = [
      {
        id: 'bitcoin',
        symbol: 'BTCUSDT',
        name: 'BTC/USDT',
        fullName: 'Bitcoin',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg',
        marketCap: 1000000000000,
        totalVolume: 30000000000,
        high24h: currentBasePrice * 1.05,
        low24h: currentBasePrice * 0.95,
        priceChange24h: 2.5,
        currentPrice: currentBasePrice
      },
      {
        id: 'ethereum',
        symbol: 'ETHUSDT',
        name: 'ETH/USDT',
        fullName: 'Ethereum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ethereum_logo_2014.svg/1257px-Ethereum_logo_2014.svg.png',
        marketCap: 500000000000,
        totalVolume: 15000000000,
        high24h: 3500,
        low24h: 3300,
        priceChange24h: 1.8,
        currentPrice: 3400
      },
      {
        id: 'binancecoin',
        symbol: 'BNBUSDT',
        name: 'BNB/USDT',
        fullName: 'Binance Coin',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Binance-coin-bnb-logo.png',
        marketCap: 80000000000,
        totalVolume: 2000000000,
        high24h: 650,
        low24h: 620,
        priceChange24h: -0.5,
        currentPrice: 635
      },
      {
        id: 'solana',
        symbol: 'SOLUSDT',
        name: 'SOL/USDT',
        fullName: 'Solana',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Solana_logo.png',
        marketCap: 40000000000,
        totalVolume: 1500000000,
        high24h: 150,
        low24h: 140,
        priceChange24h: 3.2,
        currentPrice: 145
      },
      {
        id: 'cardano',
        symbol: 'ADAUSDT',
        name: 'ADA/USDT',
        fullName: 'Cardano',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Cardano.svg',
        marketCap: 20000000000,
        totalVolume: 800000000,
        high24h: 0.65,
        low24h: 0.60,
        priceChange24h: 1.2,
        currentPrice: 0.63
      },
      {
        id: 'ripple',
        symbol: 'XRPUSDT',
        name: 'XRP/USDT',
        fullName: 'XRP',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Ripple_logo.svg',
        marketCap: 30000000000,
        totalVolume: 1200000000,
        high24h: 0.58,
        low24h: 0.55,
        priceChange24h: -0.8,
        currentPrice: 0.56
      },
      {
        id: 'polkadot',
        symbol: 'DOTUSDT',
        name: 'DOT/USDT',
        fullName: 'Polkadot',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Polkadot_Logo.png',
        marketCap: 15000000000,
        totalVolume: 600000000,
        high24h: 8.2,
        low24h: 7.8,
        priceChange24h: 2.1,
        currentPrice: 8.0
      },
      {
        id: 'dogecoin',
        symbol: 'DOGEUSDT',
        name: 'DOGE/USDT',
        fullName: 'Dogecoin',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/d0/Dogecoin_Logo.png',
        marketCap: 12000000000,
        totalVolume: 500000000,
        high24h: 0.085,
        low24h: 0.080,
        priceChange24h: 4.5,
        currentPrice: 0.083
      }
    ];

    // Don't store in window object to avoid DOM manipulation issues
    return mockCryptoData;
  }, [currentBasePrice]);

  // Function to fetch exchange logos with embedded SVG data URLs for guaranteed display
  const fetchExchangeLogos = useCallback(async () => {
    // Using embedded SVG data URLs to ensure reliable display

    // Mock exchange data with embedded SVG data URLs
    const mockExchangeData = [
      {
        name: 'Binance',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0037 USDT',
        id: 'binance',
        highlight: false,
        volume: '$12.4B',
        pairs: '740+'
      },
      {
        name: 'KuCoin',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+',
        active: true,
        profit: '+0.0055 USDT',
        id: 'kucoin',
        highlight: false,
        volume: '$5.8B',
        pairs: '580+'
      },
      {
        name: 'Coinbase',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwNTJGRiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI4QzkuMzY4IDQgNCAxMC4zNjggNCAxN3M1LjM2OCAxMiAxMiAxMiAxMi01LjM2OCAxMi0xMlMyMi42MzIgNCAxNiA0em0zLjU4MiAxNS45NTNjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzMtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzh6bS0xLjg4Mi04LjQ2N2MtLjUxNi0uNDctMS4xMy0uNzA0LTEuODQtLjcwNC0uNzEgMC0xLjMyNC4yMzQtMS44NC43MDQtLjUxNi40Ny0uNzc1IDEuMDQzLS43NzUgMS43MnMuMjU4IDEuMjUyLjc3NSAxLjcyYy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJ6TTEwLjk1MyAxOC42M2MtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzhjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzN6TTkuMjM0IDkuODg3Yy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJjLS41MTYtLjQ3LTEuMTMtLjcwNC0xLjg0LS43MDQtLjcxIDAtMS4zMjQuMjM0LTEuODQuNzA0LS41MTYuNDctLjc3NSAxLjA0My0uNzc1IDEuNzJzLjI1OCAxLjI1Mi43NzUgMS43MnoiLz48L3N2Zz4=',
        active: true,
        profit: '-0.0012 USDT',
        id: 'coinbase',
        highlight: false,
        volume: '$8.2B',
        pairs: '420+'
      },
      {
        name: 'Crypto.com',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0042 USDT',
        id: 'crypto',
        highlight: false,
        volume: '$3.7B',
        pairs: '250+'
      },
      {
        name: 'OKX',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0023 USDT',
        id: 'okx',
        highlight: false,
        volume: '$4.9B',
        pairs: '350+'
      },
      {
        name: 'Gate.io',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+',
        active: true,
        profit: '-0.0008 USDT',
        id: 'gate',
        highlight: false,
        volume: '$2.8B',
        pairs: '280+'
      },
      {
        name: 'Bybit',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI0ZGQjcwMCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS4zMzMtMTAuNjY3aDEwLjY2NnYtMTAuNjZoLTEwLjY2NnYxMC42NnptMi4xMzQtOC41MzNoNi40djYuNGgtNi40di02LjR6Ii8+PC9zdmc+',
        active: true,
        profit: '+0.0019 USDT',
        id: 'bybit',
        highlight: false,
        volume: '$3.2B',
        pairs: '300+'
      },
      {
        name: 'Kraken',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzVCNkRFRSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI4QzkuMzY4IDQgNCAxMC4zNjggNCAxN3M1LjM2OCAxMiAxMiAxMiAxMi01LjM2OCAxMi0xMlMyMi42MzIgNCAxNiA0em0wIDIwYTggOCAwIDEgMSAwLTE2IDggOCAwIDAgMSAwIDE2em0wLTJhNiA2IDAgMSAwIDAtMTIgNiA2IDAgMCAwIDAgMTJ6Ii8+PC9zdmc+',
        active: true,
        profit: '+0.0031 USDT',
        id: 'kraken',
        highlight: false,
        volume: '$3.5B',
        pairs: '330+'
      }
    ];

    // Add fallback mechanism for each exchange in case SVG doesn't load
    const enhancedExchangeData = mockExchangeData.map(exchange => ({
      ...exchange,
      fallbackLogo: `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`,
      // Add stats for display
      stats: {
        volume: exchange.volume || '$1.0B',
        pairs: exchange.pairs || '100+',
        price: `$${(Math.random() * 1000 + 45000).toFixed(2)}`
      }
    }));

    // Don't store in window object to avoid DOM manipulation issues
    return enhancedExchangeData;
  }, []);

  // Check if trading is already active for today when component loads
  useEffect(() => {
    if (profitStatusData?.data?.isActivatedToday) {
      setTradingActive(true);
    } else {
      setTradingActive(false);
    }
  }, [profitStatusData]);

  // Fetch cryptocurrency images and exchange logos on component mount
  useEffect(() => {
    // Fetch all cryptocurrency images when component loads
    fetchAllCryptoImages();

    // Fetch exchange logos - don't store in window object to avoid DOM manipulation issues
    fetchExchangeLogos();
  }, [fetchAllCryptoImages, fetchExchangeLogos]);

  // Initialize all trading intervals
  const initializeTrading = useCallback(() => {
    // Clear any existing intervals to prevent memory leaks
    Object.values(tradingIntervalsRef.current).forEach(interval => {
      if (interval) clearInterval(interval);
    });

    // Set new intervals - all set to 1 second as requested
    tradingIntervalsRef.current = {
      // Update price every 1 second
      price: setInterval(updateBasePriceFromAPI, 1000),

      // Change pair every 1 second
      pair: setInterval(changeTradingPair, 1000),

      // Only create these intervals if trading is active
      // Combine orderBook and tradeHistory into a single interval
      dataUpdates: tradingActive ? setInterval(() => {
        // Update order book and trade history in the same interval
        generateOrderBook();
        generateTradeHistory();
      }, 1000) : null,

      // Millisecond price changes every 1 second
      millisecondPrice: tradingActive ? setInterval(simulateMillisecondPriceChanges, 1000) : null
    };

    // Initial updates
    updateBasePriceFromAPI();

    // Only generate initial trade history and order book data if trading is active
    if (tradingActive) {
      generateOrderBook();
      generateTradeHistory();
    } else {
      // Clear trade history when trading is not active
      setTradeHistory([]);
    }
  }, [tradingActive, updateBasePriceFromAPI, changeTradingPair, generateOrderBook, generateTradeHistory, simulateMillisecondPriceChanges]);

  // Effect for trading activation - only run once on mount and when trading state changes
  useEffect(() => {
    // Initialize trading
    initializeTrading();

    // Initial pair change
    changeTradingPair();

    // Clean up all intervals when component unmounts
    return () => {
      Object.values(tradingIntervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [tradingActive, initializeTrading, changeTradingPair]);

  // Set up an interval to automatically change selected exchanges
  useEffect(() => {
    // This interval will automatically change the selected exchanges
    const exchangeInterval = setInterval(() => {
      // Get available exchanges for the current trading pair
      const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
      const availableExchanges = currentPair ? currentPair.supportedExchanges :
        ['binance', 'kucoin', 'crypto', 'okx', 'gate'];

      // Select 3-4 random exchanges (reduced from 3-5 to improve performance)
      const randomExchanges = [];
      const numExchanges = Math.floor(Math.random() * 2) + 3; // 3 to 4 exchanges

      while (randomExchanges.length < numExchanges) {
        const randomIndex = Math.floor(Math.random() * availableExchanges.length);
        const exchangeId = availableExchanges[randomIndex];

        if (!randomExchanges.includes(exchangeId)) {
          randomExchanges.push(exchangeId);
        }
      }

      // Update the selectedExchanges state
      setSelectedExchanges(randomExchanges);

      // Update the ref for synchronization
      activeExchangesRef.current = randomExchanges;
    }, 1000); // Changed to 1 second as requested

    return () => clearInterval(exchangeInterval);
  }, [currentTradingPair]);

  // Handle flash animation without setTimeout
  useEffect(() => {
    if (flash) {
      const timer = setTimeout(() => {
        setFlash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [flash]);

  // Periodically update exchange highlights to simulate exchange jumper effect
  // This is now aligned with the daily profit rate
  useEffect(() => {
    if (!tradingActive || profitPerSecond <= 0) return;

    // Calculate how many exchange highlights should appear per day based on daily profit
    // We want to distribute the highlights throughout the day

    // For a typical daily profit rate (0.8%), we want to show around 300-400 highlights per day
    // This is more frequent than bubbles but still realistic
    const highlightsPerDay = 360; // Target number of highlights per day

    // Calculate seconds per day
    const secondsPerDay = 24 * 60 * 60; // 86,400 seconds

    // Calculate how often highlights should appear (in seconds)
    const secondsBetweenHighlights = secondsPerDay / highlightsPerDay; // ~240 seconds (4 minutes)

    // Convert to milliseconds for the interval
    const avgHighlightInterval = secondsBetweenHighlights * 1000; // ~240,000 ms

    // Calculate the average profit per highlight based on daily profit
    // Each highlight should represent a portion of the daily profit
    const avgProfitPerHighlight = dailyProfit / highlightsPerDay;

    const interval = setInterval(() => {
      // Only update if trading is active
      if (!tradingActive) return;

      // Update exchange objects to randomly highlight different exchanges
      setExchangeObjects(prev => {
        const updatedExchanges = prev.map(exchange => {
          // Only update exchanges that are in the selected list
          if (selectedExchanges.includes(exchange.id)) {
            // Chance to highlight based on exchange importance
            // Major exchanges have higher chance to be highlighted
            const isMajorExchange = ['binance', 'okx', 'kucoin'].includes(exchange.id);
            const baseHighlightChance = isMajorExchange ? 0.15 : 0.08;
            const shouldHighlight = Math.random() < baseHighlightChance;

            // Generate a new profit value for highlighted exchanges
            let profit = exchange.profit;
            let profitAmount = "0.0001";

            if (shouldHighlight) {
              // Always positive profit (100% chance) - no losses as requested

              // Generate profit amounts based on daily profit rate
              // Positive profits - based on actual earning rate with some variation
              const variationFactor = Math.random() * 0.6 + 0.7; // 70-130% of average
              profitAmount = (avgProfitPerHighlight * variationFactor).toFixed(6);

              // Occasionally show larger profits (10% chance)
              if (Math.random() < 0.1) {
                profitAmount = (avgProfitPerHighlight * (Math.random() * 2 + 2)).toFixed(6);
              }

              profit = `+${profitAmount} USDT`; // Always positive

              // Create a profit bubble for this exchange, but only 30% of the time
              // This makes bubbles appear more randomly and naturally
              // Reduced to make bubbles less frequent
            //   if (Math.random() < 0.3) {
            //     try {
            //       createProfitBubble(profitAmount, true, exchange.name); // Always positive
            //     } catch (error) {
            //       // Silently handle any DOM errors
            //       console.log("Error creating profit bubble:", error);
            //     }
            //   }
            }

            return {
              ...exchange,
              highlight: shouldHighlight,
              profit: profit
            };
          }
          return exchange;
        });

        return updatedExchanges;
      });
    }, 1000); // Changed to 1 second as requested

    return () => clearInterval(interval);
  }, [tradingActive, selectedExchanges, profitPerSecond, dailyProfit]);

  // Create profit bubbles based on actual earning rate and session time
  useEffect(() => {
    if (!tradingActive || profitPerSecond <= 0) return;

    // Calculate how many bubbles should appear per day based on daily profit
    // We want to distribute the daily profit across bubbles throughout the day

    // For a typical daily profit rate (0.8%), we want to show around 100-150 bubbles per day
    // This makes each bubble represent a meaningful portion of the daily profit
    const bubblesPerDay = 120; // Target number of bubbles per day

    // Calculate seconds per day
    const secondsPerDay = 24 * 60 * 60; // 86,400 seconds

    // Calculate how often bubbles should appear (in seconds)
    const secondsBetweenBubbles = secondsPerDay / bubblesPerDay; // ~720 seconds (12 minutes)

    // Convert to milliseconds for the interval
    const avgBubbleInterval = secondsBetweenBubbles * 1000; // ~720,000 ms

    // Calculate the average profit per bubble based on daily profit
    // Each bubble should represent a portion of the daily profit
    const avgProfitPerBubble = dailyProfit / bubblesPerDay;

    // Create profit bubbles periodically with natural timing
    const bubbleInterval = setInterval(() => {
      // Only create bubbles if trading is active
      if (!tradingActive) return;

      try {
        // Check for occasional "big profit" event (5% chance)
        const isBigProfit = Math.random() < 0.05;

        // Always positive profit (100% chance) - no losses as requested

        // Generate profit amounts based on actual earning rate
        let profitAmount;

        if (isBigProfit) {
          // Big profit event - larger amount (3-5x normal profit)
          profitAmount = (avgProfitPerBubble * (Math.random() * 2 + 3)).toFixed(6);
        } else {
          // Regular positive profits - based on actual earning rate with some variation
          const variationFactor = Math.random() * 0.6 + 0.7; // 70-130% of average
          profitAmount = (avgProfitPerBubble * variationFactor).toFixed(6);
        }

        // Get a random exchange from the selected ones
        // For big profits, prefer major exchanges
        let randomExchangeId;

        if (isBigProfit) {
          // For big profits, strongly prefer major exchanges
          const majorExchanges = ['binance', 'okx'].filter(ex => selectedExchanges.includes(ex));
          if (majorExchanges.length > 0) {
            randomExchangeId = majorExchanges[Math.floor(Math.random() * majorExchanges.length)];
          } else {
            randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
          }
        } else {
          // Normal distribution for regular profits
          if (Math.random() < 0.6) {
            // 60% chance to pick from major exchanges
            const majorExchanges = ['binance', 'okx', 'kucoin'].filter(ex => selectedExchanges.includes(ex));
            if (majorExchanges.length > 0) {
              randomExchangeId = majorExchanges[Math.floor(Math.random() * majorExchanges.length)];
            } else {
              randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
            }
          } else {
            // 40% chance to pick any exchange
            randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
          }
        }

        const exchangeObj = exchangeObjects.find(ex => ex.id === randomExchangeId);
        const exchangeName = exchangeObj ? exchangeObj.name : randomExchangeId;

        // Create the bubble
        if (isBigProfit) {
          // Create special big profit bubble
          const bubble = document.createElement('div');
          bubble.className = `profit-bubble profit big-profit`;

          // Format the amount with proper decimal places
          const formattedAmount = parseFloat(profitAmount).toFixed(4);

          // Create amount element with enhanced styling
          const amountSpan = document.createElement('span');
          amountSpan.textContent = `+${formattedAmount} USDT`;
          amountSpan.style.fontSize = '18px';
          bubble.appendChild(amountSpan);

          // Add exchange name with special formatting
          const exchangeSpan = document.createElement('span');
          exchangeSpan.className = 'exchange-name';
          exchangeSpan.textContent = `⭐ ${exchangeName} ⭐`;
          exchangeSpan.style.fontSize = '12px';
          exchangeSpan.style.fontWeight = 'bold';
          bubble.appendChild(exchangeSpan);

          // Center the big profit bubble more
          const randomX = Math.floor(Math.random() * 40) + 30; // 30% to 70% of screen width
          bubble.style.left = `${randomX}%`;
          bubble.style.bottom = '8%';

          // Add to the DOM
          const container = document.getElementById('profit-bubbles-container');
          if (container) {
            container.appendChild(bubble);

            // Remove the bubble after animation completes
            setTimeout(() => {
              if (container.contains(bubble)) {
                container.removeChild(bubble);
              }
            }, 10500); // Slightly longer than animation to ensure complete removal
          }
        } else {
          // Regular profit bubble
          // createProfitBubble(profitAmount, true, exchangeName);
        }

        // Always highlight exchange for big profits, otherwise only 60% of the time
        if (isBigProfit || Math.random() < 0.6) {
          setExchangeObjects(prev => {
            return prev.map(exchange => {
              if (exchange.id === randomExchangeId) {
                return {
                  ...exchange,
                  highlight: true,
                  profit: `+${profitAmount} USDT` // Always positive
                };
              }
              return exchange;
            });
          });
        }
      } catch (error) {
        // Silently handle any DOM errors
        console.log("Error creating profit bubble:", error);
      }
    }, 1000); // Changed to 1 second as requested

    return () => clearInterval(bubbleInterval);
  }, [tradingActive, selectedExchanges, exchangeObjects, profitPerSecond, dailyProfit]);

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

    // Check if user has invested
    if (!hasInvested) {
      setSnackbarMessage('You need to make an investment before you can start trading.');
      setSnackbarSeverity('error');
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

      // Show success message
      setSnackbarMessage('Trading successfully activated! You will receive ROI and level ROI income for today.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Trading is now active, the intervals will handle generating trade history
      // No need to call generateTradeHistory() here as it will be called by the interval

      // Reset activating state
      setActivatingProfit(false);
    } catch (error) {
      // Check if the error is because trading is already activated today
      if (error.msg && error.msg.includes('already activated today')) {
        setSnackbarMessage('Daily profit already activated today. Trading session started.');
        setSnackbarSeverity('info');
        setTradingActive(true);

        // Trading is now active, the intervals will handle generating trade history
      } else {
        // Show error message but still allow trading to be activated
        setSnackbarMessage('Trading activated, but there was an issue activating daily profit.');
        setSnackbarSeverity('warning');
        setTradingActive(true);

        // Trading is now active, the intervals will handle generating trade history
      }

      setSnackbarOpen(true);
      setActivatingProfit(false);
    }
  };

  // Trading Pair Selector Component
  const TradingPairSelector = () => {
    return (
      <Dialog
        open={showPairSelector}
        onClose={() => setShowPairSelector(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.95)' : '#ffffff',
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03))'
              : 'linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.01))',
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.8)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          px: 3,
          py: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Select Trading Pair</Typography>
            <IconButton onClick={() => setShowPairSelector(false)} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {tradingPairs.map((pair) => (
              <Grid item xs={6} sm={4} key={pair.symbol}>
                <Card
                  elevation={0}
                  onClick={() => {
                    setCurrentTradingPair(pair.symbol);
                    setShowPairSelector(false);
                    setFlash(true);
                  }}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: `1px solid ${currentTradingPair === pair.symbol
                      ? theme.palette.primary.main
                      : mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    backgroundColor: currentTradingPair === pair.symbol
                      ? alpha(theme.palette.primary.main, mode === 'dark' ? 0.2 : 0.1)
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: currentTradingPair === pair.symbol
                        ? alpha(theme.palette.primary.main, mode === 'dark' ? 0.3 : 0.15)
                        : mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                      src={`https://cryptoicons.org/api/icon/${pair.id.toLowerCase()}/32`}
                      alt={pair.fullName}
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 1,
                        backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {pair.fullName.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {pair.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {pair.fullName}
                  </Typography>
                  <Box sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                    pt: 1,
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      Exchanges: {pair.supportedExchanges.length}
                    </Typography>
                    {currentTradingPair === pair.symbol && (
                      <Chip
                        label="Active"
                        size="small"
                        color="primary"
                        sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.625rem' } }}
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    );
  };

  // Exchange Selector Component
  const ExchangeSelector = () => {
    // Get all available exchanges from trading pairs
    const allExchanges = [
      { id: 'binance', name: 'Binance', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=' },
      { id: 'kucoin', name: 'KuCoin', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+' },
      { id: 'crypto', name: 'Crypto.com', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=' },
      { id: 'okx', name: 'OKX', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=' },
      { id: 'gate', name: 'Gate.io', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+' },
      { id: 'coinbase', name: 'Coinbase', logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwNTJGRiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI4QzkuMzY4IDQgNCAxMC4zNjggNCAxN3M1LjM2OCAxMiAxMiAxMiAxMi01LjM2OCAxMi0xMlMyMi42MzIgNCAxNiA0em0zLjU4MiAxNS45NTNjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzMtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzh6bS0xLjg4Mi04LjQ2N2MtLjUxNi0uNDctMS4xMy0uNzA0LTEuODQtLjcwNC0uNzEgMC0xLjMyNC4yMzQtMS44NC43MDQtLjUxNi40Ny0uNzc1IDEuMDQzLS43NzUgMS43MnMuMjU4IDEuMjUyLjc3NSAxLjcyYy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJ6TTEwLjk1MyAxOC42M2MtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzhjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzN6TTkuMjM0IDkuODg3Yy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJjLS41MTYtLjQ3LTEuMTMtLjcwNC0xLjg0LS43MDQtLjcxIDAtMS4zMjQuMjM0LTEuODQuNzA0LS41MTYuNDctLjc3NSAxLjA0My0uNzc1IDEuNzJzLjI1OCAxLjI1Mi43NzUgMS43MnoiLz48L3N2Zz4=' },
    ];

    // Get supported exchanges for current trading pair
    const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
    const supportedExchanges = currentPair ? currentPair.supportedExchanges : [];

    return (
      <Dialog
        open={showExchangeSelector}
        onClose={() => setShowExchangeSelector(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.95)' : '#ffffff',
            backgroundImage: mode === 'dark'
              ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03))'
              : 'linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.01))',
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.8)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          px: 3,
          py: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Select Exchanges</Typography>
            <IconButton onClick={() => setShowExchangeSelector(false)} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select exchanges for {currentPair?.name || 'trading pair'}. Only supported exchanges are shown.
          </Typography>

          <Grid container spacing={2}>
            {allExchanges
              .filter(exchange => supportedExchanges.includes(exchange.id))
              .map((exchange) => {
                const isSelected = selectedExchanges.includes(exchange.id);

                return (
                  <Grid item xs={6} sm={4} key={exchange.id}>
                    <Card
                      elevation={0}
                      onClick={() => {
                        if (isSelected && selectedExchanges.length > 1) {
                          // Remove exchange if already selected (but keep at least one)
                          setSelectedExchanges(prev => prev.filter(id => id !== exchange.id));
                        } else if (!isSelected) {
                          // Add exchange if not selected
                          setSelectedExchanges(prev => [...prev, exchange.id]);
                        }
                      }}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: `1px solid ${isSelected
                          ? theme.palette.primary.main
                          : mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        backgroundColor: isSelected
                          ? alpha(theme.palette.primary.main, mode === 'dark' ? 0.2 : 0.1)
                          : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isSelected
                            ? alpha(theme.palette.primary.main, mode === 'dark' ? 0.3 : 0.15)
                            : mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar
                          src={exchange.logo}
                          alt={exchange.name}
                          sx={{
                            width: 24,
                            height: 24,
                            mr: 1,
                            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          {exchange.name.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {exchange.name}
                        </Typography>
                      </Box>

                      <Box sx={{
                        mt: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}>
                        {isSelected && (
                          <Chip
                            label="Selected"
                            size="small"
                            color="primary"
                            sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.625rem' } }}
                          />
                        )}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
          <Button
            onClick={() => setShowExchangeSelector(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              // Reset to default exchanges if none selected
              if (selectedExchanges.length === 0) {
                setSelectedExchanges(supportedExchanges.slice(0, 3));
              }
              setShowExchangeSelector(false);
            }}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Enhanced PriceJumper Component with Exchange Jumper
  const PriceJumper = () => {
    const [price, setPrice] = useState(currentBasePrice);
    const [trend, setTrend] = useState('up');
    // We'll use the parent component's flash state instead of a local one
    const [volume24h, setVolume24h] = useState(Math.random() * 1000000 + 500000);
    const [high24h, setHigh24h] = useState(price * 1.05);
    const [low24h, setLow24h] = useState(price * 0.95);
    const [change24h, setChange24h] = useState((Math.random() * 10 - 5).toFixed(2));
    const lastPriceRef = useRef(price);

    // Get the current trading pair info for reference
    const pairInfo = tradingPairs.find(pair => pair.symbol === currentTradingPair);

    // Create exchange jumper effect - when a price changes, create profit bubbles
    useEffect(() => {
      if (!tradingActive) return;

      // Create a profit bubble for a random exchange when price changes
      const createRandomExchangeBubble = () => {
        // Get active exchanges
        const activeExchanges = exchangeObjects.filter(ex =>
          selectedExchanges.includes(ex.id) && ex.active
        );

        if (activeExchanges.length === 0) return;

        // Pick a random exchange
        const randomExchange = activeExchanges[Math.floor(Math.random() * activeExchanges.length)];

        // Generate a random profit value
        const isPositive = Math.random() > 0.3; // 70% chance of positive profit
        const profitAmount = (Math.random() * (isPositive ? 0.01 : 0.005) + 0.0001).toFixed(6);

        // Create a profit bubble
        try {
          // createProfitBubble(profitAmount, isPositive, randomExchange.name);
        } catch (error) {
          console.log("Error creating price change bubble:", error);
        }
      };

      // Create a bubble when price changes
      if (millisecondPrices.length > 1) {
        const lastPrice = millisecondPrices[millisecondPrices.length - 1];
        const prevPrice = millisecondPrices[millisecondPrices.length - 2];

        if (lastPrice !== prevPrice) {
          createRandomExchangeBubble();
        }
      }
    }, [millisecondPrices, tradingActive, selectedExchanges, exchangeObjects]);

    // Update price when currentBasePrice changes
    useEffect(() => {
      const oldPrice = lastPriceRef.current;
      const newPrice = currentBasePrice;

      setPrice(newPrice);
      setTrend(newPrice > oldPrice ? 'up' : 'down');
      // We don't need to set flash here as it's controlled by the parent component

      // Update high/low if needed
      if (newPrice > high24h) setHigh24h(newPrice);
      if (newPrice < low24h) setLow24h(newPrice);

      // Calculate change percentage
      const changePercent = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);
      setChange24h(changePercent);

      // Store the current price for next comparison
      lastPriceRef.current = newPrice;
    }, [currentBasePrice]);

    // Update price from millisecond changes for more dynamic display
    useEffect(() => {
      if (millisecondPrices.length > 0) {
        const latestPrice = millisecondPrices[millisecondPrices.length - 1];
        setPrice(latestPrice);
        setTrend(latestPrice > lastPriceRef.current ? 'up' : 'down');
      }
    }, [millisecondPrices]);

    // Fetch 24h market data from Binance API - optimized to reduce API calls
    useEffect(() => {
      // Create a shared state for 24hr data that can be used across components
      if (!window.binance24hrData) {
        window.binance24hrData = {};
      }

      const fetchMarketData = async () => {
        try {
          // Check if we already have recent data for this pair (less than 30 seconds old)
          const cachedData = window.binance24hrData[currentTradingPair];
          const now = Date.now();

          if (cachedData && (now - cachedData.timestamp < 30000)) {
            // Use cached data if it's recent
            setVolume24h(cachedData.volume);
            setHigh24h(cachedData.high);
            setLow24h(cachedData.low);
            setChange24h(cachedData.change);
            return;
          }

          // Fetch data from Binance API if no recent cache exists
          const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${currentTradingPair}`);

          if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
          }

          const data = await response.json();

          // Update state with real data from Binance
          const volume = parseFloat(data.quoteVolume);
          const high = parseFloat(data.highPrice);
          const low = parseFloat(data.lowPrice);
          const change = parseFloat(data.priceChangePercent).toFixed(2);

          setVolume24h(volume);
          setHigh24h(high);
          setLow24h(low);
          setChange24h(change);

          // Cache the data with timestamp
          window.binance24hrData[currentTradingPair] = {
            volume,
            high,
            low,
            change,
            timestamp: now
          };
        } catch (error) {
          console.error(`Error fetching market data for ${currentTradingPair}:`, error);

          // Fallback to calculated values if API fails
          const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);

          if (currentPair) {
            // Use any existing data we might have
            setVolume24h(currentPair.totalVolume || price * 1000);
            setHigh24h(currentPair.high24h || price * 1.05);
            setLow24h(currentPair.low24h || price * 0.95);
            setChange24h(currentPair.priceChange24h?.toFixed(2) || '0.00');
          } else {
            // Last resort fallback
            setVolume24h(price * 1000);
            setHigh24h(price * 1.05);
            setLow24h(price * 0.95);
            setChange24h('0.00');
          }
        }
      };

      // Initial fetch
      fetchMarketData();

      // Set up interval to fetch data every 30 seconds (reduced frequency)
      const interval = setInterval(fetchMarketData, 30000);

      // Clean up interval on component unmount
      return () => clearInterval(interval);
    }, [currentTradingPair, price, tradingPairs]);

    // Current pair info
    const currentPairInfo = tradingPairs.find(pair => pair.symbol === currentTradingPair) || {};

    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
          animation: flash ? `${flashAnimation} 0.5s ease` : 'none', // Using parent component's flash state
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
              onClick={() => setShowPairSelector(true)}
            >
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
                <img
                  src={`https://assets.coingecko.com/coins/images/${
                    currentPairInfo.id === 'bitcoin' ? '1' :
                    currentPairInfo.id === 'ethereum' ? '279' :
                    currentPairInfo.id === 'binancecoin' ? '825' :
                    currentPairInfo.id === 'solana' ? '4128' :
                    currentPairInfo.id === 'cardano' ? '975' :
                    currentPairInfo.id === 'ripple' ? '44' :
                    currentPairInfo.id === 'polkadot' ? '12171' :
                    currentPairInfo.id === 'dogecoin' ? '5' : '1'
                  }/large/${currentPairInfo.id || 'bitcoin'}.png`}
                  alt={currentPairInfo.fullName}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${currentPairInfo.name?.charAt(0) || 'C'}&background=random&color=fff&size=100`;
                  }}
                />
              </Box>
              <Box className="trading-pair-display" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {currentPairInfo.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentPairInfo.fullName}
                  </Typography>
                </Box>
                <ArrowDropDown sx={{ ml: 0.5, color: 'text.secondary' }} />
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

             {/* Trading Exchanges Section */}
          <Grid item xs={12} sx={{ width: '100%', px: { xs: 0, sm: 1 }, mt: 2 }}>
            <Card
              elevation={0}
              sx={{
                width: '600px',
                borderRadius: { xs: 0, sm: 3 },
                border: { xs: 'none', sm: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` },
                backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
                overflowX: 'none'
              }}
            >
              <CardContent sx={{ p: 2 }}>
                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    TRADING EXCHANGES
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowExchangeSelector(true)}
                    startIcon={<SwapHoriz />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                    }}
                  >
                    Select Exchanges
                  </Button>
                </Box> */}

                <Grid container spacing={2}>
                  {/* Use exchangeObjects state instead of local exchanges state */}
                  {exchangeObjects.filter(exchange => selectedExchanges.includes(exchange.id)).map((exchange) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={exchange.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${exchange.highlight ?
                            (exchange.profit?.startsWith('+') ? '#0ecb81' : '#f6465d') :
                            (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}`,
                          backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.7)' : '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: mode === 'dark'
                              ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                              : '0 8px 16px rgba(0, 0, 0, 0.1)',
                          },
                          ...(exchange.highlight && {
                            animation: `${pulseAnimation} 1s infinite`,
                            boxShadow: `0 0 15px ${exchange.profit?.startsWith('+') ? 'rgba(14, 203, 129, 0.3)' : 'rgba(246, 70, 93, 0.3)'}`
                          })
                        }}
                        onClick={() => {
                          // When clicked, create a profit bubble
                          if (exchange.profit) {
                            const isPositive = exchange.profit.startsWith('+');
                            const amount = exchange.profit.replace(/[+\-]/g, '').split(' ')[0];
                            try {
                              // createProfitBubble(amount, isPositive, exchange.name);
                            } catch (error) {
                              console.log("Error creating profit bubble on click:", error);
                            }
                          }
                        }}
                      >
                        {/* Exchange Logo */}
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={exchange.logo}
                            alt={exchange.name}
                            style={{
                              width: '70%',
                              height: '70%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.src = exchange.fallbackLogo ||
                                `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                            }}
                          />
                        </Box>

                        {/* Exchange Name */}
                        {/* <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          align="center"
                          sx={{ mb: 0.5 }}
                        >
                          {exchange.name}
                        </Typography> */}




                        {/* Active Indicator */}
                        {exchange.active && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'success.main',
                              animation: `${pulseAnimation} 2s infinite`
                            }}
                          />
                        )}
                      </Paper>
                    </Grid>
                  ))}
                  {/* Show message if no exchanges are selected */}
                  {exchangeObjects.filter(exchange => selectedExchanges.includes(exchange.id)).length === 0 && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                          No exchanges selected. Click "Select Exchanges" to choose exchanges.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

            {/* Price Stats */}
            {/* <Grid container spacing={2} sx={{ mt: 1 }}>
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
            </Grid> */}
          </Box>
        </CardContent>
      </Card>
    );
  };

        // Function to fetch real price data from Binance API - optimized to use ticker/price endpoint
        const [pairPrices, setPairPrices] = useState({});
        const fetchPairPrices = useCallback(async () => {
          try {
            // Use the more lightweight ticker/price endpoint instead of 24hr
            const response = await fetch('https://api.binance.com/api/v3/ticker/price');
    
            if (!response.ok) {
              throw new Error(`Binance API error: ${response.status}`);
            }
    
            const data = await response.json();
    
            // Create a map of pair symbol to price data
            const priceMap = {};
    
            // Process only our trading pairs
            tradingPairs.forEach(pair => {
              // Find the matching data from Binance
              const binanceData = data.find(item => item.symbol === pair.symbol);
    
              if (binanceData) {
                // If we already have this pair's data, just update the price
                if (pairPrices[pair.symbol]) {
                  priceMap[pair.symbol] = {
                    ...pairPrices[pair.symbol],
                    price: parseFloat(binanceData.price).toFixed(2)
                  };
                } else {
                  // For new pairs, set up the full data structure
                  priceMap[pair.symbol] = {
                    price: parseFloat(binanceData.price).toFixed(2),
                    change: "0.00", // We'll update this less frequently
                    imageUrl: `https://assets.coingecko.com/coins/images/${
                      pair.id === 'bitcoin' ? '1' :
                      pair.id === 'ethereum' ? '279' :
                      pair.id === 'binancecoin' ? '825' :
                      pair.id === 'solana' ? '4128' :
                      pair.id === 'cardano' ? '975' :
                      pair.id === 'ripple' ? '44' :
                      pair.id === 'polkadot' ? '12171' :
                      pair.id === 'dogecoin' ? '5' :
                      pair.id === 'polygon' ? '4713' :
                      pair.id === 'avalanche' ? '12559' : '1'
                    }/large/${pair.id || 'bitcoin'}.png`
                  };
                }
              }
            });
    
            // Update state with the price data
            setPairPrices(prev => ({...prev, ...priceMap}));
          } catch (error) {
            console.error('Error fetching prices from Binance:', error);
          }
        }, [pairPrices, tradingPairs]);
            // Fetch prices on component mount and every 5 seconds
    useEffect(() => {
      // Fetch immediately on mount
      fetchPairPrices();

      // Set up interval to fetch prices every 5 seconds
      const priceInterval = setInterval(fetchPairPrices, 5000);

      // Set up interval to fetch 24hr data every 30 seconds
      // const dataInterval = setInterval(fetch24HrData, 30000);

      // Clean up intervals on unmount
      return () => {
        clearInterval(priceInterval);
        // clearInterval(dataInterval);
      };
    }, [fetchPairPrices]);
  // Enhanced Trading Pairs Component
  const TradingPairs = () => {
    // State to store real price data from Binance
    



    // Function to fetch 24hr data less frequently
    // const fetch24HrData = useCallback(async () => {
    //   try {
    //     // Only fetch data for the current trading pair to reduce load
    //     const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${currentTradingPair}`);

    //     if (!response.ok) {
    //       throw new Error(`Binance API error: ${response.status}`);
    //     }

    //     const data = await response.json();

    //     // Update the current pair's 24hr data
    //     setPairPrices(prev => ({
    //       ...prev,
    //       [currentTradingPair]: {
    //         ...prev[currentTradingPair],
    //         change: parseFloat(data.priceChangePercent).toFixed(2)
    //       }
    //     }));
    //   } catch (error) {
    //     console.error('Error fetching 24hr data from Binance:', error);
    //   }
    // }, [currentTradingPair]);



    // Function to get real price data for a pair - optimized to avoid individual API calls
    const getPairData = (pair) => {
      // Check if we have real data from Binance
      if (pairPrices[pair.symbol]) {
        return pairPrices[pair.symbol];
      }

      // If we don't have data yet, trigger a fetch for all pairs
      // but don't wait for it - this avoids multiple individual API calls
      if (Object.keys(pairPrices).length === 0) {
        fetchPairPrices();
      }

      // Return a placeholder with the correct image while we wait for real data
      return {
        price: "Loading...",
        change: "0.00",
        imageUrl: `https://assets.coingecko.com/coins/images/${
          pair.id === 'bitcoin' ? '1' :
          pair.id === 'ethereum' ? '279' :
          pair.id === 'binancecoin' ? '825' :
          pair.id === 'solana' ? '4128' :
          pair.id === 'cardano' ? '975' :
          pair.id === 'ripple' ? '44' :
          pair.id === 'polkadot' ? '12171' :
          pair.id === 'dogecoin' ? '5' :
          pair.id === 'polygon' ? '4713' :
          pair.id === 'avalanche' ? '12559' : '1'
        }/large/${pair.id || 'bitcoin'}.png`
      };
    };

    // Remove debug log that was causing infinite console messages

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

          {/* Auto-changing trading pairs effect */}
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              {tradingPairs.map((pair) => {
                const pairData = getPairData(pair);
                const isPositive = parseFloat(pairData.change) >= 0;
                const isSelected = currentTradingPair === pair.symbol;

                return (
                  <Grid item xs={6} sm={4} md={2} key={pair.symbol}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)'
                          : mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                        border: `1px solid ${isSelected
                          ? 'rgba(240, 185, 11, 0.2)'
                          : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                        transition: 'all 0.3s ease',
                        animation: isSelected ? `${pulseAnimation} 2s infinite` : 'none',
                        boxShadow: isSelected ? '0 4px 12px rgba(240, 185, 11, 0.15)' : 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          backgroundColor: isSelected
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
                                // Use a reliable fallback from CoinGecko
                                e.target.src = `https://assets.coingecko.com/coins/images/1/large/bitcoin.png`;
                              }}
                            />
                          ) : (
                            pair.name.charAt(0)
                          )}
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" className="trading-pair-display">
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

  // Trade History Component with Exchange Indicators
  // This component is used in the main render
  const TradeHistory = () => {
    // Use state for exchanges to make them dynamic
    const [exchanges, setExchanges] = useState([
      // Initialize with embedded SVG data URLs to avoid network requests
      {
        name: 'Binance',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0037 USDT',
        id: 'binance',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=B&background=random&color=fff&size=100'
      },
      {
        name: 'KuCoin',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+',
        active: true,
        profit: '+0.0055 USDT',
        id: 'kucoin',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=K&background=random&color=fff&size=100'
      },
      {
        name: 'Crypto.com',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0042 USDT',
        id: 'crypto',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=C&background=random&color=fff&size=100'
      },
      {
        name: 'OKX',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0023 USDT',
        id: 'okx',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=O&background=random&color=fff&size=100'
      },
      {
        name: 'Gate.io',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+',
        active: true,
        profit: '-0.0008 USDT',
        id: 'gate',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=G&background=random&color=fff&size=100'
      }
    ]);

    // Function to get a random active exchange
    const getRandomExchange = useCallback(() => {
      const activeExchanges = exchanges.filter(ex => ex.active);
      if (activeExchanges.length === 0) return exchanges[0];
      return activeExchanges[Math.floor(Math.random() * activeExchanges.length)];
    }, [exchanges]);

    // Randomly change active exchanges to simulate jumping between exchanges
    useEffect(() => {
      if (!tradingActive) return;

      const interval = setInterval(() => {
        setExchanges(prev => {
          const newExchanges = [...prev];

          // Randomly activate/deactivate exchanges
          const randomIndex = Math.floor(Math.random() * newExchanges.length);

          // Make sure at least 3 exchanges are always active
          const activeCount = newExchanges.filter(ex => ex.active).length;

          if (activeCount > 3 || !newExchanges[randomIndex].active) {
            newExchanges[randomIndex].active = !newExchanges[randomIndex].active;
            newExchanges[randomIndex].highlight = true;

            // Remove highlight after 1 second
            setTimeout(() => {
              setExchanges(current => current.map((ex, i) =>
                i === randomIndex ? { ...ex, highlight: false } : ex
              ));
            }, 1000);
          }

          return newExchanges;
        });
      }, 4000);

      return () => clearInterval(interval);
    }, [tradingActive]);

    // Add exchange info to trade history items with memoization
    const enhancedTradeHistory = useMemo(() => {
      return tradeHistory.map(trade => {
        // If trade already has an exchange, check if it's still active
        if (trade.exchange) {
          const matchingExchange = exchanges.find(ex => ex.id === trade.exchange.id);
          if (matchingExchange && matchingExchange.active) {
            return {
              ...trade,
              exchange: {
                ...matchingExchange,
                highlight: matchingExchange.highlight || trade.id === tradeHistory[0]?.id
              }
            };
          }
        }

        // Otherwise assign a new random exchange
        return {
          ...trade,
          exchange: getRandomExchange()
        };
      });
    }, [tradeHistory, exchanges, getRandomExchange]);

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
              {/* Exchange Filter Chips */}
              <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                {exchanges.filter(ex => ex.active).slice(0, 3).map(exchange => (
                  <Tooltip key={exchange.id} title={exchange.name}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      }}
                    >
                      <img
                        src={exchange.logo}
                        alt={exchange.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          // Fallback for image loading errors using the embedded fallback logo
                          e.target.src = exchange.fallbackLogo ||
                            `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                        }}
                      />
                    </Box>
                  </Tooltip>
                ))}
              </Box>
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
            <Typography variant="body2" color="text.secondary" sx={{ width: '10%', textAlign: 'left' }}>
              Exchange
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '20%', textAlign: 'left' }}>
              Time
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '15%', textAlign: 'center' }}>
              Type
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '25%', textAlign: 'right' }}>
              Price
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '30%', textAlign: 'right' }}>
              Amount
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {!tradingActive ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Start trading to see trade history.
                </Typography>
              </Box>
            ) : enhancedTradeHistory.length > 0 ? (
              enhancedTradeHistory.map((trade) => (
                <Box
                  key={trade.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    py: 0.5,
                    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
                    animation: `${flashAnimation} 0.5s ease`,
                    animationPlayState: trade.id === enhancedTradeHistory[0]?.id ? 'running' : 'paused'
                  }}
                >
                  {/* Exchange Logo */}
                  <Box sx={{ width: '10%', display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={trade.exchange.name}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: trade.exchange.highlight ? `1px solid ${trade.type === 'buy' ? '#0ecb81' : '#f6465d'}` : 'none',
                          boxShadow: trade.exchange.highlight ? `0 0 5px ${trade.type === 'buy' ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)'}` : 'none',
                          animation: trade.exchange.highlight ? `${pulseAnimation} 1s ease` : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <img
                          src={trade.exchange.logo}
                          alt={trade.exchange.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            // Fallback for image loading errors using the embedded fallback logo
                            e.target.src = trade.exchange.fallbackLogo ||
                              `https://ui-avatars.com/api/?name=${trade.exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Box>

                  <Typography variant="body2" sx={{ width: '20%', textAlign: 'left' }}>
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
                  <Typography variant="body2" sx={{ width: '30%', textAlign: 'right' }}>
                    {trade.amount} {trade.pair.replace('USDT', '')}
                  </Typography>
                </Box>
              ))
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  No trades yet. Trading data will appear shortly.
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Enhanced Order Book Component with Exchange Indicators
  // This component is used in the main render
  const OrderBook = () => {
    // Use state for exchanges to make them dynamic - initialize with embedded SVG data
    const [exchanges, setExchanges] = useState([
      // Initialize with embedded SVG data URLs to avoid network requests
      {
        name: 'Binance',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0037 USDT',
        id: 'binance',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=B&background=random&color=fff&size=100'
      },
      {
        name: 'KuCoin',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+',
        active: true,
        profit: '+0.0055 USDT',
        id: 'kucoin',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=K&background=random&color=fff&size=100'
      },
      {
        name: 'Crypto.com',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0042 USDT',
        id: 'crypto',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=C&background=random&color=fff&size=100'
      },
      {
        name: 'OKX',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=',
        active: true,
        profit: '+0.0023 USDT',
        id: 'okx',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=O&background=random&color=fff&size=100'
      },
      {
        name: 'Gate.io',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+',
        active: true,
        profit: '-0.0008 USDT',
        id: 'gate',
        highlight: false,
        fallbackLogo: 'https://ui-avatars.com/api/?name=G&background=random&color=fff&size=100'
      }
    ]);

    // State for order exchange assignments
    const [sellOrderExchanges, setSellOrderExchanges] = useState([]);
    const [buyOrderExchanges, setBuyOrderExchanges] = useState([]);

    // Filter exchanges based on the selected exchanges from parent component
    useEffect(() => {
      // Update exchanges based on selectedExchanges from parent
      setExchanges(prev =>
        prev.map(exchange => ({
          ...exchange,
          active: selectedExchanges.includes(exchange.id)
        }))
      );
    }, [selectedExchanges]);

    // Helper function to get a random exchange from the selected ones
    const getRandomExchangeFromSelected = () => {
      if (selectedExchanges.length === 0 || exchanges.length === 0) return null;
      const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
      return exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
    };

    // We don't need to set up a separate interval to change exchanges
    // since the parent component is already handling this
    // Instead, we'll just listen for changes to selectedExchanges

    // This useEffect will run whenever selectedExchanges changes
    useEffect(() => {
      // Update the exchanges based on the selectedExchanges from the parent
      setExchanges(prev => {
        return prev.map(exchange => ({
          ...exchange,
          active: selectedExchanges.includes(exchange.id),
          highlight: selectedExchanges.includes(exchange.id) // Highlight all active exchanges
        }));
      });

      // Also update the order exchanges when selectedExchanges changes
      if (selectedExchanges.length > 0) {
        setSellOrderExchanges(Array.from({ length: 12 }, () => {
          const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
          const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
          return { ...exchange, highlight: true };
        }));

        setBuyOrderExchanges(Array.from({ length: 12 }, () => {
          const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
          const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
          return { ...exchange, highlight: true };
        }));
      }
    }, [selectedExchanges, exchanges]);

    // Set up a separate interval for updating order exchanges
    useEffect(() => {
      // Only set up the interval if we have selected exchanges and trading is active
      if (selectedExchanges.length === 0 || exchanges.length === 0 || !tradingActive) {
        return;
      }

      // Initialize order exchanges if they're empty
      if (sellOrderExchanges.length === 0) {
        setSellOrderExchanges(Array.from({ length: 10 }, () => {
          const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
          const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
          return { ...exchange, highlight: true };
        }));
      }

      if (buyOrderExchanges.length === 0) {
        setBuyOrderExchanges(Array.from({ length: 10 }, () => {
          const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
          const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
          return { ...exchange, highlight: true };
        }));
      }

      // This interval will update the order exchanges less frequently to improve performance
      const orderExchangeInterval = setInterval(() => {
        // Update only 1-2 sell orders at a time for better performance
        setSellOrderExchanges(prev => {
          const newExchanges = [...prev];
          // Update 1-2 random positions (reduced from 2-4)
          const numToUpdate = Math.floor(Math.random() * 2) + 1;
          const positions = [];

          while (positions.length < numToUpdate) {
            const pos = Math.floor(Math.random() * 10); // Reduced from 12 to 10
            if (!positions.includes(pos)) {
              positions.push(pos);
              // Get a random exchange from the selected ones
              const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
              const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
              newExchanges[pos] = { ...exchange, highlight: true };
            }
          }

          return newExchanges;
        });

        // Update only 1-2 buy orders at a time for better performance
        setBuyOrderExchanges(prev => {
          const newExchanges = [...prev];
          // Update 1-2 random positions (reduced from 2-4)
          const numToUpdate = Math.floor(Math.random() * 2) + 1;
          const positions = [];

          while (positions.length < numToUpdate) {
            const pos = Math.floor(Math.random() * 10); // Reduced from 12 to 10
            if (!positions.includes(pos)) {
              positions.push(pos);
              // Get a random exchange from the selected ones
              const randomExchangeId = selectedExchanges[Math.floor(Math.random() * selectedExchanges.length)];
              const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
              newExchanges[pos] = { ...exchange, highlight: true };
            }
          }

          return newExchanges;
        });
      }, 2000); // Reduced frequency to every 2 seconds for better performance

      return () => clearInterval(orderExchangeInterval);
    }, [selectedExchanges, exchanges, tradingActive]);

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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 1 }}>
                Order Book
              </Typography>

              <Chip
                label={currentTradingPair}
                size="small"
                color="primary"
                onClick={() => setShowPairSelector(true)}
                sx={{
                  height: 24,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.9,
                  }
                }}
              />
            </Box>

            {/* Exchange Filter Chips */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowExchangeSelector(true)}
                startIcon={<SwapHoriz />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  height: 28,
                  mr: 1,
                }}
              >
                Exchanges
              </Button>

              <Box sx={{ display: 'flex', gap: 0.5, mr: 1 }}>
                {exchanges.filter(ex => selectedExchanges.includes(ex.id)).slice(0, 3).map(exchange => (
                  <Tooltip key={exchange.id} title={exchange.name}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        animation: exchange.highlight ? `${pulseAnimation} 1s infinite` : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <img
                        src={exchange.logo}
                        alt={exchange.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  </Tooltip>
                ))}

                {selectedExchanges.length > 3 && (
                  <Tooltip title={`+${selectedExchanges.length - 3} more exchanges`}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        animation: `${pulseAnimation} 1.5s infinite`,
                      }}
                    >
                      +{selectedExchanges.length - 3}
                    </Box>
                  </Tooltip>
                )}
              </Box>

              <IconButton
                size="small"
                color="primary"
                sx={{
                  animation: `${rotateAnimation} 5s linear infinite`,
                  '&:hover': {
                    animation: `${rotateAnimation} 1s linear infinite`,
                  }
                }}
                onClick={() => {
                  // Get available exchanges for the current trading pair
                  const currentPair = tradingPairs.find(pair => pair.symbol === currentTradingPair);
                  const availableExchanges = currentPair ? currentPair.supportedExchanges :
                    ['binance', 'kucoin', 'crypto', 'okx', 'gate'];

                  // Select 3-4 random exchanges (reduced for performance)
                  const randomExchanges = [];
                  const numExchanges = Math.floor(Math.random() * 2) + 3; // 3 to 4 exchanges

                  while (randomExchanges.length < numExchanges) {
                    const randomIndex = Math.floor(Math.random() * availableExchanges.length);
                    const exchangeId = availableExchanges[randomIndex];

                    if (!randomExchanges.includes(exchangeId)) {
                      randomExchanges.push(exchangeId);
                    }
                  }

                  // Update selectedExchanges state
                  setSelectedExchanges(randomExchanges);

                  // Immediately update the order exchanges for instant feedback
                  if (randomExchanges.length > 0 && exchanges.length > 0) {
                    // Update all sell orders
                    setSellOrderExchanges(Array.from({ length: 10 }, () => {
                      const randomExchangeId = randomExchanges[Math.floor(Math.random() * randomExchanges.length)];
                      const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
                      return { ...exchange, highlight: true };
                    }));

                    // Update all buy orders
                    setBuyOrderExchanges(Array.from({ length: 10 }, () => {
                      const randomExchangeId = randomExchanges[Math.floor(Math.random() * randomExchanges.length)];
                      const exchange = exchanges.find(ex => ex.id === randomExchangeId) || exchanges[0];
                      return { ...exchange, highlight: true };
                    }));
                  }
                }}
              >
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
            <Typography variant="body2" color="text.secondary" sx={{ width: '15%', textAlign: 'left' }}>
              Exchange
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '25%', textAlign: 'left' }}>
              Price (USDT)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '30%', textAlign: 'right' }}>
              Amount (BTC)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ width: '30%', textAlign: 'right' }}>
              Total
            </Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {!tradingActive ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Start trading to see order book data.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Sell Orders */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                  {Array.from({ length: 10 }).map((_, index) => {
                    // Use real price data with small variations for sell orders (slightly higher than current price)
                    const priceVariation = (10 - index) * (currentBasePrice * 0.001); // 0.1% steps
                    const price = currentBasePrice + priceVariation;
                    const amount = Math.random() * 2 + 0.1;
                    const total = price * amount;
                    const depth = 10 - index; // Depth indicator for visualization
                    const exchange = sellOrderExchanges[index] || getRandomExchangeFromSelected();
                    const isHighlighted = exchange.highlight;

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
                      transition: 'all 0.3s ease',
                      animation: isHighlighted ? `${jumpAnimation} 0.5s ease` : 'none',
                      backgroundColor: isHighlighted ? (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
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
                    {/* Exchange Logo and Name */}
                    <Box sx={{ width: '15%', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                      <Tooltip title={exchange.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: isHighlighted ? `1px solid ${mode === 'dark' ? '#f6465d' : '#f6465d'}` : 'none',
                              boxShadow: isHighlighted ? '0 0 5px rgba(246, 70, 93, 0.5)' : 'none',
                              animation: isHighlighted ? `${pulseAnimation} 1s ease` : 'none',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={exchange.logo}
                              alt={exchange.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                // Fallback for image loading errors using the embedded fallback logo
                                e.target.src = exchange.fallbackLogo ||
                                  `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              ml: 0.5,
                              fontSize: '0.65rem',
                              color: isHighlighted ? 'error.main' : 'text.secondary',
                              fontWeight: isHighlighted ? 'bold' : 'normal',
                              display: { xs: 'none', sm: 'block' },
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '60px'
                            }}
                          >
                            {exchange.name}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>

                    <Typography
                      variant="body2"
                      color="error.main"
                      sx={{
                        width: '25%',
                        textAlign: 'left',
                        zIndex: 1,
                        fontWeight: isHighlighted ? 'bold' : 'normal'
                      }}
                    >
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        width: '30%',
                        textAlign: 'right',
                        zIndex: 1,
                        fontWeight: isHighlighted ? 'bold' : 'normal'
                      }}
                    >
                      {amount.toFixed(4)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        width: '30%',
                        textAlign: 'right',
                        zIndex: 1,
                        fontWeight: isHighlighted ? 'bold' : 'normal'
                      }}
                    >
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

              {/* Multi-exchange indicator */}
              <Box sx={{
                display: 'flex',
                ml: 2,
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                borderRadius: 10,
                padding: '2px 8px',
                alignItems: 'center'
              }}>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  Multi-Exchange
                </Typography>
                <Box sx={{ display: 'flex' }}>
                  {exchanges.filter(ex => ex.active).slice(0, 3).map((exchange, i) => (
                    <Box
                      key={exchange.id}
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `1px solid ${mode === 'dark' ? '#1a1b20' : '#fff'}`,
                        ml: i > 0 ? -0.5 : 0,
                        zIndex: 3 - i
                      }}
                    >
                      <img
                        src={exchange.logo}
                        alt={exchange.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          // Fallback for image loading errors using the embedded fallback logo
                          e.target.src = exchange.fallbackLogo ||
                            `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Buy Orders */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {Array.from({ length: 10 }).map((_, index) => {
                // Use real price data with small variations for buy orders (slightly lower than current price)
                const priceVariation = (index + 1) * (currentBasePrice * 0.001); // 0.1% steps
                const price = currentBasePrice - priceVariation;
                const amount = Math.random() * 2 + 0.1;
                const total = price * amount;
                const depth = index + 1; // Depth indicator for visualization
                const exchange = buyOrderExchanges[index] || getRandomExchangeFromSelected();
                const isHighlighted = exchange.highlight;

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
                      transition: 'all 0.3s ease',
                      animation: isHighlighted ? `${jumpAnimation} 0.5s ease` : 'none',
                      backgroundColor: isHighlighted ? (mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent',
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
                    {/* Exchange Logo and Name */}
                    <Box sx={{ width: '15%', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                      <Tooltip title={exchange.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              border: isHighlighted ? `1px solid ${mode === 'dark' ? '#0ecb81' : '#0ecb81'}` : 'none',
                              boxShadow: isHighlighted ? '0 0 5px rgba(14, 203, 129, 0.5)' : 'none',
                              animation: isHighlighted ? `${pulseAnimation} 1s ease` : 'none',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={exchange.logo}
                              alt={exchange.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                // Fallback for image loading errors using the embedded fallback logo
                                e.target.src = exchange.fallbackLogo ||
                                  `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              ml: 0.5,
                              fontSize: '0.65rem',
                              color: isHighlighted ? 'success.main' : 'text.secondary',
                              fontWeight: isHighlighted ? 'bold' : 'normal',
                              display: { xs: 'none', sm: 'block' },
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '60px'
                            }}
                          >
                            {exchange.name}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>

                    <Typography
                      variant="body2"
                      color="success.main"
                      sx={{
                        width: '30%',
                        textAlign: 'left',
                        zIndex: 1,
                        fontWeight: isHighlighted ? 'bold' : 'normal'
                      }}
                    >
                      {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        width: '30%',
                        textAlign: 'right',
                        zIndex: 1,
                        fontWeight: isHighlighted ? 'bold' : 'normal'
                      }}
                    >
                      {amount.toFixed(4)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        width: '30%',
                        textAlign: 'right',
                        zIndex: 1,
                        fontWeight: isHighlighted ? 'bold' : 'normal'
                      }}
                    >
                      {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Trend Visualization Component
  // This component is used in the main render
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
        {!tradingActive ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              Start trading to see price chart data.
            </Typography>
          </Box>
        ) : (
          <>
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
          </>
        )}
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

            <Tooltip title={
              !hasInvested
                ? "You need to make an investment before you can start trading"
                : tradingActive
                  ? "Trading is already active for today"
                  : "Start trading to activate daily ROI and level ROI income"
            }>
              <span> {/* Wrapper needed for disabled buttons with tooltips */}
                <Button
                  variant="contained"
                  size="medium"
                  onClick={startTrading}
                  startIcon={activatingProfit ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                  disabled={activatingProfit || tradingActive || !hasInvested}
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
                  {activatingProfit ? 'Activating...' : (tradingActive ? 'Trading Active' : (!hasInvested ? 'Investment Required' : 'Start Trading'))}
                </Button>
              </span>
            </Tooltip>
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
                        +{formatCurrency(accumulatedProfit, 5)}
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tradingActive ? (
                      <>
                        {/* Multi-exchange indicator */}
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: mode === 'dark' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(14, 203, 129, 0.05)',
                          borderRadius: 10,
                          padding: '2px 8px',
                          mr: 1
                        }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              mr: 0.5,
                              animation: `${pulseAnimation} 2s infinite`
                            }}
                          />
                          <Typography variant="caption" color="success.main" sx={{ mr: 1 }}>
                            Multi-Exchange
                          </Typography>
                          <Box sx={{ display: 'flex' }}>
                            {/* Exchange logos - same as in PriceJumper */}
                            {['binance', 'kucoin', 'crypto'].map((exchange, i) => (
                              <Box
                                key={exchange}
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  border: `1px solid ${mode === 'dark' ? '#1a1b20' : '#fff'}`,
                                  ml: i > 0 ? -0.5 : 0,
                                  zIndex: 3 - i
                                }}
                              >
                                <img
                                  src={exchange === 'binance'
                                    ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4='
                                    : exchange === 'kucoin'
                                    ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+'
                                    : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4='
                                  }
                                  alt={exchange}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${exchange.charAt(0)}&background=random&color=fff&size=100`;
                                  }}
                                />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                        <Typography
                          variant="body2"
                          color="success.main"
                          sx={{
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          Trading Active (Until Midnight UTC)
                        </Typography>
                      </>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Trading Inactive
                      </Typography>
                    )}
                  </Box>
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
                        {tradingActive ? (
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: mode === 'dark' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(14, 203, 129, 0.05)',
                            borderRadius: 10,
                            padding: '2px 8px',
                            ml: 1
                          }}>
                            <Box
                              sx={{
                                width: { xs: 6, sm: 8 },
                                height: { xs: 6, sm: 8 },
                                borderRadius: '50%',
                                bgcolor: 'success.main',
                                mr: 0.5,
                                animation: `${pulseAnimation} 2s infinite`
                              }}
                            />
                            <Typography variant="caption" color="success.main" sx={{ mr: 1 }}>
                              Multi-Exchange
                            </Typography>
                            <Box sx={{ display: 'flex' }}>
                              {/* Exchange logos - same as in PriceJumper */}
                              {['binance', 'kucoin', 'crypto'].map((exchange, i) => (
                                <Box
                                  key={exchange}
                                  sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: `1px solid ${mode === 'dark' ? '#1a1b20' : '#fff'}`,
                                    ml: i > 0 ? -0.5 : 0,
                                    zIndex: 3 - i
                                  }}
                                >
                                  <img
                                    src={exchange === 'binance'
                                      ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4='
                                      : exchange === 'kucoin'
                                      ? 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+'
                                      : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4='
                                    }
                                    alt={exchange}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                      e.target.src = `https://ui-avatars.com/api/?name=${exchange.charAt(0)}&background=random&color=fff&size=100`;
                                    }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ) : (
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
                                bgcolor: 'text.disabled',
                                mr: 0.5
                              }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Trading Inactive
                            </Typography>
                          </Box>
                        )}
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
                            width: '10%',
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
                            width: '20%',
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          Price (USDT)
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            width: '15%',
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          Exchange
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
                                  width: '10%',
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
                                  width: '20%',
                                  zIndex: 1,
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {price.toLocaleString()}
                              </Typography>

                              {/* Exchange Column */}
                              <Box sx={{
                                width: '15%',
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 1
                              }}>
                                {selectedExchanges && selectedExchanges.length > 0 ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {/* Get the exchange object for this index */}
                                    {(() => {
                                      const exchangeId = selectedExchanges[index % selectedExchanges.length];
                                      const exchangeObj = exchangeObjects.find(ex => ex.id === exchangeId) || {
                                        id: exchangeId,
                                        name: exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1),
                                        logo: `https://ui-avatars.com/api/?name=${exchangeId.charAt(0)}&background=random&color=fff&size=100`,
                                        active: true,
                                        highlight: false
                                      };

                                      return (
                                        <>
                                          <Box
                                            sx={{
                                              width: 16,
                                              height: 16,
                                              borderRadius: '50%',
                                              overflow: 'hidden',
                                              flexShrink: 0,
                                              border: exchangeObj.highlight ?
                                                `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` : 'none',
                                              boxShadow: exchangeObj.highlight ?
                                                '0 0 5px rgba(255, 255, 255, 0.3)' : 'none',
                                              animation: exchangeObj.highlight ?
                                                `${pulseAnimation} 1s ease` : 'none'
                                            }}
                                          >
                                            <img
                                              src={exchangeObj.logo}
                                              alt={exchangeObj.name}
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                              onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${exchangeObj.name.charAt(0)}&background=random&color=fff&size=100`;
                                              }}
                                            />
                                          </Box>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              ml: 0.5,
                                              fontSize: '0.65rem',
                                              color: exchangeObj.highlight ? 'primary.main' : 'text.secondary',
                                              display: { xs: 'none', sm: 'block' },
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              maxWidth: '60px',
                                              fontWeight: exchangeObj.highlight ? 'bold' : 'normal'
                                            }}
                                          >
                                            {exchangeObj.name}
                                          </Typography>
                                        </>
                                      );
                                    })()}
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </Box>

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
                                  width: '10%',
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
                                  width: '20%',
                                  zIndex: 1,
                                  fontWeight: 'medium',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                              >
                                {price.toLocaleString()}
                              </Typography>

                              {/* Exchange Column */}
                              <Box sx={{
                                width: '15%',
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 1
                              }}>
                                {selectedExchanges && selectedExchanges.length > 0 ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {/* Get the exchange object for this index */}
                                    {(() => {
                                      const exchangeId = selectedExchanges[(index + 5) % selectedExchanges.length];
                                      const exchangeObj = exchangeObjects.find(ex => ex.id === exchangeId) || {
                                        id: exchangeId,
                                        name: exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1),
                                        logo: `https://ui-avatars.com/api/?name=${exchangeId.charAt(0)}&background=random&color=fff&size=100`,
                                        active: true,
                                        highlight: false
                                      };

                                      return (
                                        <>
                                          <Box
                                            sx={{
                                              width: 16,
                                              height: 16,
                                              borderRadius: '50%',
                                              overflow: 'hidden',
                                              flexShrink: 0,
                                              border: exchangeObj.highlight ?
                                                `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` : 'none',
                                              boxShadow: exchangeObj.highlight ?
                                                '0 0 5px rgba(255, 255, 255, 0.3)' : 'none',
                                              animation: exchangeObj.highlight ?
                                                `${pulseAnimation} 1s ease` : 'none'
                                            }}
                                          >
                                            <img
                                              src={exchangeObj.logo}
                                              alt={exchangeObj.name}
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                              onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${exchangeObj.name.charAt(0)}&background=random&color=fff&size=100`;
                                              }}
                                            />
                                          </Box>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              ml: 0.5,
                                              fontSize: '0.65rem',
                                              color: exchangeObj.highlight ? 'success.main' : 'text.secondary',
                                              display: { xs: 'none', sm: 'block' },
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              maxWidth: '60px',
                                              fontWeight: exchangeObj.highlight ? 'bold' : 'normal'
                                            }}
                                          >
                                            {exchangeObj.name}
                                          </Typography>
                                        </>
                                      );
                                    })()}
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </Box>

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
      {/* Profit Bubbles Container */}
      <div id="profit-bubbles-container"></div>
    </Box>
  );
};

export default LiveTradingOld;