import { useState, useEffect } from 'react';
import { Snackbar, Alert, useTheme } from '@mui/material';
import { WifiOff as WifiOffIcon } from '@mui/icons-material';

/**
 * Component to monitor network status and display notifications
 * for network errors and API issues
 */
const NetworkStatusMonitor = () => {
  const theme = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);
  const [apiError, setApiError] = useState(null);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Clear network error when back online
      setNetworkError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError('You are currently offline. Please check your internet connection.');
    };
    
    // Listen for API errors
    const handleApiNetworkError = (event) => {
      setApiError(event.detail.message || 'Network error occurred');
    };
    
    const handleApiTimeoutError = (event) => {
      setApiError(event.detail.message || 'Request timed out');
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('api:networkError', handleApiNetworkError);
    window.addEventListener('api:timeoutError', handleApiTimeoutError);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('api:networkError', handleApiNetworkError);
      window.removeEventListener('api:timeoutError', handleApiTimeoutError);
    };
  }, []);
  
  // Handle closing network error alert
  const handleNetworkErrorClose = () => {
    setNetworkError(null);
  };
  
  // Handle closing API error alert
  const handleApiErrorClose = () => {
    setApiError(null);
  };
  
  return (
    <>
      {/* Offline Status Alert */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          '& .MuiPaper-root': { 
            backgroundColor: theme.palette.error.dark,
            color: theme.palette.error.contrastText,
          }
        }}
      >
        <Alert
          severity="error"
          variant="filled"
          icon={<WifiOffIcon />}
          sx={{ width: '100%' }}
        >
          You are currently offline. Some features may not work properly.
        </Alert>
      </Snackbar>
      
      {/* Network Error Alert */}
      <Snackbar
        open={!!networkError}
        autoHideDuration={6000}
        onClose={handleNetworkErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={handleNetworkErrorClose}
        >
          {networkError}
        </Alert>
      </Snackbar>
      
      {/* API Error Alert */}
      <Snackbar
        open={!!apiError}
        autoHideDuration={6000}
        onClose={handleApiErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={handleApiErrorClose}
        >
          {apiError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkStatusMonitor;
