import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  useTheme,
  Box,
} from '@mui/material';
import {
  Home as HomeIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as SwapIcon,
  Explore as BrowserIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const BottomNavigation = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path.includes('/wallet') || path.includes('/deposit') || path.includes('/withdraw') || path.includes('/transfer')) return 1;
    if (path.includes('/buy-package') || path.includes('/investment')) return 2;
    if (path === '/settings') return 3;
    return 0; // Default to dashboard
  };

  const [value, setValue] = useState(getActiveTab());

  const handleChange = (_, newValue) => {
    setValue(newValue);

    // Navigate based on tab index
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/transfer-fund'); // Default wallet page
        break;
      case 2:
        navigate('/buy-package');
        break;
      case 3:
        navigate('/settings');
        break;
      case 4:
        navigate('/profile');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      elevation={3}
    >
      <MuiBottomNavigation
        showLabels
        value={value}
        onChange={handleChange}
        sx={{
          backgroundColor: theme.palette.background.paper,
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.text.secondary,
            minWidth: 'auto',
            padding: '8px 0',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              transition: 'font-size 0.2s, opacity 0.2s',
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          icon={
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              '& svg': {
                fontSize: 24,
                mb: 0.5,
                transition: 'all 0.2s ease',
              }
            }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: value === 0 ? 'rgba(51, 117, 187, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <HomeIcon sx={{ color: value === 0 ? theme.palette.primary.main : theme.palette.text.secondary }} />
              </Box>
            </Box>
          }
        />
        <BottomNavigationAction
          label="Wallet"
          icon={
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              '& svg': {
                fontSize: 24,
                mb: 0.5,
                transition: 'all 0.2s ease',
              }
            }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: value === 1 ? 'rgba(51, 117, 187, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <SwapIcon sx={{ color: value === 1 ? theme.palette.primary.main : theme.palette.text.secondary }} />
              </Box>
            </Box>
          }
        />
        <BottomNavigationAction
          label="Trade"
          icon={
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              '& svg': {
                fontSize: 24,
                mb: 0.5,
                transition: 'all 0.2s ease',
              }
            }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: value === 2 ? 'rgba(51, 117, 187, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <BrowserIcon sx={{ color: value === 2 ? theme.palette.primary.main : theme.palette.text.secondary }} />
              </Box>
            </Box>
          }
        />
        <BottomNavigationAction
          label="Settings"
          icon={
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              '& svg': {
                fontSize: 24,
                mb: 0.5,
                transition: 'all 0.2s ease',
              }
            }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: value === 3 ? 'rgba(51, 117, 187, 0.1)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <SettingsIcon sx={{ color: value === 3 ? theme.palette.primary.main : theme.palette.text.secondary }} />
              </Box>
            </Box>
          }
        />
      </MuiBottomNavigation>
    </Paper>
  );
};

export default BottomNavigation;
