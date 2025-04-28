import { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  LinearProgress,
  Box,
  useTheme
} from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';

// Warning threshold in milliseconds (2 minutes before expiry)
const WARNING_THRESHOLD = 2 * 60 * 1000;

// Check interval in milliseconds (every 30 seconds)
const CHECK_INTERVAL = 30 * 1000;

/**
 * Component to display a warning when the session is about to expire
 */
const SessionTimeoutWarning = () => {
  const theme = useTheme();
  const { sessionTimeRemaining, resetSessionTimeout, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  
  // Format time remaining in minutes and seconds
  const formatTimeRemaining = useCallback((ms) => {
    if (!ms) return '0:00';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Handle continue session
  const handleContinue = useCallback(() => {
    resetSessionTimeout();
    setOpen(false);
  }, [resetSessionTimeout]);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);
  
  // Check session timeout and show warning if needed
  useEffect(() => {
    // Only show warning if user is authenticated and session time remaining is available
    if (sessionTimeRemaining !== null) {
      // If session is about to expire, show warning
      if (sessionTimeRemaining > 0 && sessionTimeRemaining <= WARNING_THRESHOLD) {
        setOpen(true);
        setTimeLeft(sessionTimeRemaining);
        setProgress((sessionTimeRemaining / WARNING_THRESHOLD) * 100);
      } else {
        setOpen(false);
      }
    }
  }, [sessionTimeRemaining]);
  
  // Update time left and progress every second when dialog is open
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = prev - 1000;
        
        // Update progress
        setProgress((newTimeLeft / WARNING_THRESHOLD) * 100);
        
        // If time is up, close dialog and logout
        if (newTimeLeft <= 0) {
          clearInterval(interval);
          logout();
          return 0;
        }
        
        return newTimeLeft;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [open, logout]);
  
  return (
    <Dialog
      open={open}
      onClose={handleContinue}
      aria-labelledby="session-timeout-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="session-timeout-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon color="warning" />
        Session Timeout Warning
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session is about to expire due to inactivity.
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          You will be automatically logged out in:
        </Typography>
        
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="h4" color="warning.main" fontWeight="bold">
            {formatTimeRemaining(timeLeft)}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: theme.palette.grey[300],
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress < 30 ? theme.palette.error.main : theme.palette.warning.main,
            }
          }} 
        />
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          Click "Continue Session" to stay logged in, or "Logout" to end your session now.
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleLogout} color="error">
          Logout
        </Button>
        <Button onClick={handleContinue} variant="contained" color="primary" autoFocus>
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutWarning;
