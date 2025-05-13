import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Paper, Box, Typography, Button, Snackbar, Alert, CircularProgress } from '@mui/material';

import { formatTiming } from '../../utils/formatters';
import UserService from '../../services/user.service';

interface TradingActivationProps {
  tradingActive: boolean;
  onActivate: () => void;
  sessionTime: number;
  totalProfit?: number; // Make optional since we're not using it
  activeTrades?: number; // Make optional since we're not using it
}

const TradingActivation: React.FC<TradingActivationProps> = ({
  tradingActive,
  onActivate,
  sessionTime,
  // We're not using these props but keeping them in the interface for backward compatibility
  // totalProfit,
  // activeTrades
}) => {
  // Local state with optimized initial values
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activatingProfit, setActivatingProfit] = useState(false);
  const [alreadyActivated, setAlreadyActivated] = useState(tradingActive); // Initialize based on prop

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
      // Check if error message indicates already activated
      if (error.message && error.message.includes('already activated')) {
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

  return (
    <Paper
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '16px',
        border: 'none',
        padding: { xs: '15px', md: '20px' },
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 0 },
        width: '100%', // Make the component take full width
        maxWidth: '100%', // Ensure it doesn't exceed container width
        boxSizing: 'border-box' // Include padding in width calculation
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: tradingActive ? 'secondary.main' : 'text.secondary',
              position: 'relative',
              boxShadow: tradingActive ? '0 0 10px rgba(14, 203, 129, 0.8)' : 'none',
              '&::before': tradingActive ? {
                content: '""',
                position: 'absolute',
                top: -6,
                left: -6,
                right: -6,
                bottom: -6,
                borderRadius: '50%',
                background: 'rgba(14, 203, 129, 0.2)',
                animation: 'pulse 1.5s infinite'
              } : {},
              '&::after': tradingActive ? {
                content: '""',
                position: 'absolute',
                top: -12,
                left: -12,
                right: -12,
                bottom: -12,
                borderRadius: '50%',
                background: 'rgba(14, 203, 129, 0.1)',
                animation: 'pulse 2s infinite 0.5s'
              } : {}
            }}
          />
          <Typography variant="body1" sx={{ color: tradingActive ? 'secondary.main' : 'text.secondary', fontWeight: 500 }}>
            {tradingActive ? 'Trading Active' : 'Trading Inactive'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        </Box>

        <Box sx={{ display: 'flex', gap: 1, width: '100%', mt: 1 }}>
          <Box sx={{ flex: 1 }}>
            {/* <Paper
              sx={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '12px 15px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                width: '100%'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Total Profit
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: totalProfit >= 0 ? 'secondary.main' : 'error.main'
                }}
              >
                {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)} USDT
              </Typography>
            </Paper> */}
          </Box>
          <Box sx={{ flex: 1 }}>
            {/* <Paper
              sx={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '12px 15px',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                width: '100%'
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Active Trades
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                {activeTrades}
              </Typography>
            </Paper> */}
          </Box>
        </Box>
      </Box>

      <Button
        variant="contained"
        disabled={tradingActive || activatingProfit || !hasInvestment || isLoading || alreadyActivated}
        onClick={startTrading}
        sx={{
          position: 'relative',
          width: { xs: '100%', md: '220px' },
          height: '60px',
          background: (tradingActive || alreadyActivated)
            ? 'linear-gradient(45deg, #0ecb81, #0bb974)'
            : 'linear-gradient(45deg, #f6465d, #ff0033)',
          borderRadius: '30px',
          color: '#fff',
          fontWeight: 600,
          fontSize: '16px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
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
            animation: 'buttonPulse 2s infinite'
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