import React from 'react';
import { Box, Typography, useTheme, Avatar } from '@mui/material';
import {
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  Security as SecurityIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const PageHeader = ({ title, subtitle, action, icon }) => {
  const theme = useTheme();

  // Function to render the appropriate icon
  const renderIcon = () => {
    switch(icon) {
      case 'settings':
        return <SettingsIcon />;
      case 'dashboard':
        return <DashboardIcon />;
      case 'people':
        return <PeopleIcon />;
      case 'person':
        return <PersonIcon />;
      case 'shopping':
        return <ShoppingCartIcon />;
      case 'money':
        return <AttachMoneyIcon />;
      case 'payments':
        return <PaymentsIcon />;
      case 'wallet':
        return <AccountBalanceIcon />;
      case 'swap':
        return <SwapHorizIcon />;
      case 'security':
        return <SecurityIcon />;
      case 'history':
        return <HistoryIcon />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {icon && (
          <Avatar
            sx={{
              mr: 2,
              bgcolor: theme.palette.primary.main,
              width: 48,
              height: 48,
            }}
          >
            {renderIcon()}
          </Avatar>
        )}

        <Box>
          <Typography
            variant="h5"
            component="h1"
            fontWeight="bold"
            color="text.primary"
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
