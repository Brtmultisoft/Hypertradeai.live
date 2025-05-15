import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
  Fade,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { keyframes } from '@mui/system';

import { formatTiming } from '../../utils/formatters';
import UserService from '../../services/user.service';

interface TradingActivationProps {
  tradingActive: boolean;
  onActivate: () => void;
  sessionTime: number;
  totalProfit?: number; // Make optional since we're not using it
  activeTrades?: number; // Make optional since we're not using it
}

// Define animations - slowed down for smoother transitions
const numberChangeAnimation = keyframes`
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  15% {
    transform: translateY(-10px);
    opacity: 0;
  }
  35% {
    transform: translateY(10px);
    opacity: 0;
  }
  50% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(14, 203, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(14, 203, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(14, 203, 129, 0);
  }
`;

const glowAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.1);
  }
  80% {
    opacity: 0.5;
    transform: scale(1.3);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
`;

const shimmerAnimation = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const TradingActivation: React.FC<TradingActivationProps> = ({
  tradingActive,
  onActivate,
  sessionTime,
  // We're not using these props but keeping them in the interface for backward compatibility
  // totalProfit,
  // activeTrades
}) => {
  // Theme and responsive setup
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Local state with optimized initial values
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activatingProfit, setActivatingProfit] = useState(false);
  const [alreadyActivated, setAlreadyActivated] = useState(tradingActive); // Initialize based on prop

  // State for income calculation - split into separate states for better performance
  const [totalInvested, setTotalInvested] = useState(0);
  const [dailyProfitRate] = useState(0.266); // 0.266% daily profit rate (constant)
  const [dailyProfitAmount, setDailyProfitAmount] = useState(0);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [lastActivationTime, setLastActivationTime] = useState<Date | null>(null);
  const [timeElapsed, setTimeElapsed] = useState('00:00:00');

  // Animation states
  const [profitUpdated, setProfitUpdated] = useState(false);
  const [showActivationSuccess, setShowActivationSuccess] = useState(false);

  // Local state for snackbar - memoized for better performance
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Derived state - memoized to prevent unnecessary recalculations
  const hasInvestment = useMemo(() =>
    userData && userData.total_investment > 0,
    [userData]
  );

  // Helper function to show snackbar messages
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarState({
      open: true,
      message,
      severity
    });
  }, []);

  // Helper function to close snackbar
  const closeSnackbar = useCallback(() => {
    setSnackbarState(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  // Check localStorage for activation status - optimized to run only once
  const checkLocalStorageActivation = useCallback((userId: string) => {
    const storedActivation = localStorage.getItem(`dailyProfitActivated_${userId}`);
    const storedDate = localStorage.getItem(`activationDate_${userId}`);
    const today = new Date().toDateString();

    return storedActivation === 'true' && storedDate === today;
  }, []);

  // Fetch user profile data on component mount - optimized with useCallback
  const fetchUserProfile = useCallback(async () => {
    // Don't fetch if already activated
    if (tradingActive) {
      setAlreadyActivated(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await UserService.getUserProfile();

      if (response && response.status) {
        const user = response.result;
        setUserData(user);

        // Calculate income trading values
        if (user.total_investment) {
          const totalInvested = user.total_investment;
          const dailyProfitRate = 0.266; // 0.266% daily profit rate
          const dailyProfitAmount = (totalInvested * dailyProfitRate) / 100;

          // Get last activation time if available
          const lastActivationTime = user.lastDailyProfitActivation ? new Date(user.lastDailyProfitActivation) : null;

          // Update individual state variables
          setTotalInvested(totalInvested);
          setDailyProfitAmount(dailyProfitAmount);
          setLastActivationTime(lastActivationTime);
          setCurrentProfit(0); // Will be updated by the timer
          setTimeElapsed('00:00:00'); // Will be updated by the timer
        }

        // Check if daily profit is already activated from server
        const isActivatedFromServer = user.dailyProfitActivated === true;

        // Check localStorage only if not activated on server
        let isActivatedFromLocalStorage = false;
        if (!isActivatedFromServer && user._id) {
          isActivatedFromLocalStorage = checkLocalStorageActivation(user._id);
        }

        // If activated from either source, update state
        if (isActivatedFromServer || isActivatedFromLocalStorage) {
          setAlreadyActivated(true);

          // If already activated but trading is not active, activate it
          if (!tradingActive) {
            onActivate();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showSnackbar('Failed to load user data. Please refresh the page.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tradingActive, onActivate, checkLocalStorageActivation, showSnackbar]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Handle trading activation - optimized with useCallback
  const startTrading = useCallback(async () => {
    // If already active, do nothing
    if (tradingActive || alreadyActivated) {
      showSnackbar('Trading is already active for today.', 'info');
      return;
    }

    // Check if user has invested
    if (!hasInvestment) {
      showSnackbar('You need to make an investment before you can start trading.', 'error');
      return;
    }

    try {
      setActivatingProfit(true);

      // Call the API to activate daily profit
      const response = await UserService.activateDailyProfit();

      if (response && response.status) {
        // Store activation state in localStorage
        if (userData && userData._id) {
          localStorage.setItem(`dailyProfitActivated_${userData._id}`, 'true');
          localStorage.setItem(`activationDate_${userData._id}`, new Date().toDateString());
        }

        // Set trading active
        onActivate();
        setAlreadyActivated(true);

        // Show success message
        showSnackbar('Trading successfully activated! You will receive ROI and level ROI income for today.', 'success');
      } else {
        throw new Error(response?.message || 'Failed to activate daily profit');
      }
    } catch (error: any) {
      // Check if user is blocked
      if (error.isBlocked) {
        showSnackbar(`Your account has been blocked. Reason: ${error.block_reason || 'No reason provided'}`, 'error');
      }
      // Check if error message indicates already activated
      else if (error.message && error.message.includes('already activated')) {
        showSnackbar('Daily profit already activated for today. Trading session started.', 'info');
        setAlreadyActivated(true);
        onActivate();
      } else {
        // Show error message
        showSnackbar(error.message || 'There was an issue activating daily profit. Please try again.', 'error');
      }
    } finally {
      setActivatingProfit(false);
    }
  }, [tradingActive, alreadyActivated, hasInvestment, userData, onActivate, showSnackbar]);



  const getUserProfile = async () => {
    try {
      const response = await UserService.getUserProfile();
      if (response && response.status) {
        const user = response.result;
        setUserData(user); // Update userData state

        // Calculate income trading values regardless of activation status
        // This will show the counter with total invested amount and 0.266% profit calculation
        const investedAmount = user.total_investment || 0;
        const profitRate = 0.266; // 0.266% daily profit rate
        const profitAmount = (investedAmount * profitRate) / 100;
        const activationTime = user.lastDailyProfitActivation ? new Date(user.lastDailyProfitActivation) : null;

        // Update individual state variables
        setTotalInvested(investedAmount);
        setDailyProfitAmount(profitAmount);
        setLastActivationTime(activationTime);

        // Store the calculated values in localStorage for persistence
        localStorage.setItem('totalInvested', investedAmount.toString());
        localStorage.setItem('dailyProfitAmount', profitAmount.toFixed(2));
        localStorage.setItem('dailyProfitRate', profitRate.toString());

        // If user has activated daily profit
        if(user.dailyProfitActivated) {
          // If trading is activated but the UI doesn't show it, update the UI
          if (!tradingActive) {
            onActivate();
            // Show activation success animation with longer duration
            setShowActivationSuccess(true);
            setTimeout(() => setShowActivationSuccess(false), 5000);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showSnackbar('Failed to load user data. Please refresh the page.', 'error');
    }
  };

  // Timer reference to clear on unmount
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to format time elapsed since activation
  const formatTimeElapsed = useCallback(() => {
    if (!lastActivationTime) {
      return 'Not activated';
    }

    const now = new Date();
    const activationTime = new Date(lastActivationTime);

    // Calculate time elapsed in milliseconds
    const elapsedMs = now.getTime() - activationTime.getTime();

    // Convert to hours, minutes, seconds
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [lastActivationTime]);

  // Function to calculate current profit based on time elapsed since activation
  const calculateCurrentProfit = useCallback(() => {
    if (!lastActivationTime || !dailyProfitAmount) {
      return 0;
    }

    const now = new Date();
    const activationTime = new Date(lastActivationTime);

    // Calculate time elapsed in milliseconds
    const elapsedMs = now.getTime() - activationTime.getTime();

    // Calculate what portion of the day has passed (24 hours = 86400000 milliseconds)
    const dayPortion = Math.min(elapsedMs / 86400000, 1); // Cap at 1 (full day)

    // Calculate current profit based on portion of day passed
    return dailyProfitAmount * dayPortion;
  }, [lastActivationTime, dailyProfitAmount]);

  // Update current profit every second
  useEffect(() => {
    // Only start timer if trading is active and we have a last activation time
    if ((tradingActive || alreadyActivated) && lastActivationTime) {
      // Initial calculation
      const initialProfit = calculateCurrentProfit();
      setCurrentProfit(initialProfit);

      // Trigger animation effect with slower animation
      setProfitUpdated(true);
      setTimeout(() => setProfitUpdated(false), 1200);

      // Set up timer to update every 2 seconds
      timerRef.current = setInterval(() => {
        const newProfit = calculateCurrentProfit();
        const formattedTime = formatTimeElapsed();

        // Update states
        setCurrentProfit(newProfit);
        setTimeElapsed(formattedTime);

        // Trigger animation effect every 20 seconds (slowed down from 10 seconds)
        if (Math.floor(Date.now() / 1000) % 20 === 0) {
          setProfitUpdated(true);
          // Slower animation fade-out
          setTimeout(() => setProfitUpdated(false), 1200);
        }
      }, 2000); // Changed from 1000ms to 2000ms for slower updates

      // Clean up timer on unmount
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [tradingActive, alreadyActivated, lastActivationTime, calculateCurrentProfit, formatTimeElapsed]);

  useEffect(() => {
    getUserProfile();
  }, []);

  return (
    <Paper
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        border: 'none',
        padding: { xs: '20px', md: '25px' },
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(15, 15, 25, 0.97) 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #0ecb81, #0bb974)',
          opacity: tradingActive ? 1 : 0.3,
          transition: 'opacity 0.5s ease'
        }
      }}
    >
      <Box sx={{ width: '100%' }}>
      {/* Success animation overlay */}
      {showActivationSuccess && (
        <Fade in={showActivationSuccess} timeout={800}>
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
              zIndex: 10,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              borderRadius: '20px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #0ecb81, #0bb974)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  animation: `${glowAnimation} 3.5s infinite`,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'rgba(14, 203, 129, 0.3)',
                    animation: `${pulseAnimation} 3s infinite`,
                  }
                }}
              >
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>✓</Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #0ecb81, #0bb974, #0ecb81)',
                  backgroundSize: '200% 100%',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: `${shimmerAnimation} 4s infinite linear`,
                }}
              >
                Trading Activated!
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Header Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: tradingActive ? 'secondary.main' : 'text.secondary',
              position: 'relative',
              boxShadow: tradingActive ? '0 0 15px rgba(14, 203, 129, 0.8)' : 'none',
              '&::before': tradingActive ? {
                content: '""',
                position: 'absolute',
                top: -8,
                left: -8,
                right: -8,
                bottom: -8,
                borderRadius: '50%',
                background: 'rgba(14, 203, 129, 0.2)',
                animation: `${pulseAnimation} 2.5s infinite`
              } : {},
              '&::after': tradingActive ? {
                content: '""',
                position: 'absolute',
                top: -16,
                left: -16,
                right: -16,
                bottom: -16,
                borderRadius: '50%',
                background: 'rgba(14, 203, 129, 0.1)',
                animation: `${pulseAnimation} 3s infinite 0.75s`
              } : {}
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: tradingActive ? 'secondary.main' : 'text.secondary',
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              letterSpacing: '0.5px'
            }}
          >
            {tradingActive ? 'Trading Active' : 'Trading Inactive'}
          </Typography>
        </Box>

        {/* Time Elapsed Badge - Only show when trading is active */}
        {tradingActive && lastActivationTime && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              background: 'rgba(14, 203, 129, 0.1)',
              borderRadius: '30px',
              padding: '6px 16px',
              border: '1px solid rgba(14, 203, 129, 0.2)',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'secondary.main',
                animation: `${pulseAnimation} 2.5s infinite`
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Roboto Mono', monospace",
                color: 'secondary.main',
                fontWeight: 500,
                animation: profitUpdated ? `${numberChangeAnimation} 1.2s ease-in-out` : 'none'
              }}
            >
              {timeElapsed}
            </Typography>
          </Box>
        )}
      </Box>

        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Session time:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '2px 6px',
              borderRadius: '3px'
            }}
          >
            {formatTiming(sessionTime)}
          </Typography>
        </Box> */}

        {/* Main Content - Dashboard Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 2,
          width: '100%',
          mt: 3
        }}>
          {/* Total Investment Card */}
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(30, 30, 40, 0.5)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              width: '100%',
              height: '100%',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    fontSize: '0.9rem'
                  }}
                >
                  TOTAL INVESTMENT
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>💰</Typography>
                </Box>
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.8rem' },
                  color: 'white',
                  mb: 1
                }}
              >
                {totalInvested.toFixed(2)} <span style={{ fontSize: '1rem', opacity: 0.7 }}>USDT</span>
              </Typography>

              <Box
                sx={{
                  mt: 'auto',
                  pt: 2,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'white',
                  }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Your base investment amount
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Daily Profit Card */}
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(30, 30, 40, 0.5)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(14, 203, 129, 0.1)',
              width: '100%',
              height: '100%',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)'
              },
              '&::before': tradingActive ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at top right, rgba(14, 203, 129, 0.1) 0%, transparent 70%)',
                zIndex: 0
              } : {}
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: 'rgba(14, 203, 129, 0.8)',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    fontSize: '0.9rem'
                  }}
                >
                  DAILY PROFIT ({dailyProfitRate}%)
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    background: 'rgba(14, 203, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>📈</Typography>
                </Box>
              </Box>

              {/* Profit Amount */}
              <Box sx={{ position: 'relative' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.8rem' },
                    color: 'secondary.main',
                    mb: 1,
                    animation: profitUpdated ? `${numberChangeAnimation} 1.2s ease-in-out` : 'none',
                  }}
                >
                  +{currentProfit.toFixed(6)} <span style={{ fontSize: '1rem', opacity: 0.7 }}>USDT</span>
                </Typography>

                {tradingActive && (
                  <Tooltip title="Live profit calculation based on time elapsed since activation">
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: -10,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        animation: `${pulseAnimation} 2.5s infinite`
                      }}
                    />
                  </Tooltip>
                )}
              </Box>

              {/* Progress Section */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "'Roboto Mono', monospace",
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.75rem'
                    }}
                  >
                    Daily Progress
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "'Roboto Mono', monospace",
                      color: 'secondary.main',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {Math.min(((currentProfit / dailyProfitAmount) * 100), 100).toFixed(1)}%
                  </Typography>
                </Box>

                {/* Progress bar showing percentage of daily profit earned */}
                <LinearProgress
                  variant="determinate"
                  value={Math.min((currentProfit / dailyProfitAmount) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(14, 203, 129, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'secondary.main',
                      borderRadius: 4
                    }
                  }}
                />
              </Box>

              {/* Footer Info */}
              <Box
                sx={{
                  mt: 'auto',
                  pt: 2,
                  borderTop: '1px solid rgba(14, 203, 129, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'secondary.main',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Max: {dailyProfitAmount.toFixed(2)} USDT
                  </Typography>
                </Box>

                {lastActivationTime && (
                  <Tooltip title="Time elapsed since activation">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'secondary.main',
                          animation: `${pulseAnimation} 2.5s infinite`
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: "'Roboto Mono', monospace",
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {timeElapsed}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Activation Button */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 4,
          width: '100%'
        }}>
          <Button
        variant="contained"
        disabled={tradingActive || activatingProfit || !hasInvestment || isLoading || alreadyActivated}
        onClick={startTrading}
        sx={{
          position: 'relative',
          width: { xs: '100%', sm: '80%', md: '300px' },
          height: { xs: '50px', md: '60px' },
          background: (tradingActive || alreadyActivated)
            ? 'linear-gradient(45deg, #0ecb81, #0bb974)'
            : 'linear-gradient(45deg, #f6465d, #ff0033)',
          borderRadius: '30px',
          color: '#fff',
          fontWeight: 600,
          fontSize: { xs: '14px', md: '16px' },
          textTransform: 'uppercase',
          letterSpacing: '1px',
          transition: 'all 0.3s ease',
          boxShadow: (tradingActive || alreadyActivated)
            ? '0 0 20px rgba(14, 203, 129, 0.5)'
            : '0 8px 25px rgba(246, 70, 93, 0.5), 0 0 15px rgba(246, 70, 93, 0.3) inset',
          '&:hover': {
            background: (tradingActive || alreadyActivated)
              ? 'linear-gradient(45deg, #0ecb81, #0bb974)'
              : 'linear-gradient(45deg, #f6465d, #ff0033)',
            transform: 'translateY(-2px)',
            boxShadow: (tradingActive || alreadyActivated)
              ? '0 0 30px rgba(14, 203, 129, 0.7)'
              : '0 0 30px rgba(246, 70, 93, 0.7)',
          },
          cursor: (tradingActive || !hasInvestment || activatingProfit || isLoading || alreadyActivated) ? 'not-allowed' : 'pointer',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -5,
            left: -5,
            right: -5,
            bottom: -5,
            borderRadius: '30px',
            background: (tradingActive || alreadyActivated)
              ? 'rgba(14, 203, 129, 0.5)'
              : 'rgba(246, 70, 93, 0.5)',
            opacity: 0,
            zIndex: -1,
            animation: `${pulseAnimation} 3s infinite`
          }}
        />
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
            LOADING...
          </Box>
        ) : activatingProfit ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
            ACTIVATING...
          </Box>
        ) : (tradingActive || alreadyActivated) ? (
          'TRADING ACTIVE'
        ) : (
          'ACTIVATE TRADING'
        )}
      </Button>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbarState.severity}
          sx={{ width: '100%' }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TradingActivation;