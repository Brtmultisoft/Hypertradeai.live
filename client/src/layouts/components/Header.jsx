import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Badge,
  Box,
  Avatar,
  Tooltip,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  QrCode as QrCodeIcon,
  ArrowDropDown as ArrowDropDownIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import useAuth from '../../hooks/useAuth';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

const Header = ({ onToggleSidebar }) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar sx={{ minHeight: isMobile ? 64 : 'auto', px: isMobile ? 2 : 3 }}>
        {/* Menu Toggle Button - Only show on desktop */}
        {!isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={onToggleSidebar}
            sx={{
              mr: 2,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo and Wallet Selector for Mobile */}
        {isMobile ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Left side - Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="HyperTrade"
                sx={{ height: 32, mr: 1 }}
              />
              <Typography
                component={Link}
                to="/dashboard"
                variant="h6"
                color="inherit"
                noWrap
                sx={{
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                }}
              >
                HyperTrade
              </Typography>
            </Box>

            {/* Right side - Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Wallet Selector */}
              {/* <Button
                variant="text"
                color="inherit"
                sx={{
                  borderRadius: 4,
                  textTransform: 'none',
                  mr: 1,
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: 'rgba(51, 117, 187, 0.08)',
                  border: '1px solid rgba(51, 117, 187, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 117, 187, 0.12)',
                  },
                  transition: 'all 0.2s ease',
                }}
                endIcon={<ArrowDropDownIcon />}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WalletIcon sx={{ fontSize: 12, color: 'white' }} />
                </Box>
                Main Wallet
              </Button> */}

              {/* Refresh */}
              <IconButton color="inherit" size="small" sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <IconButton color="inherit" size="small" onClick={handleNotificationsMenuOpen}>
                <Badge badgeContent={4} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Box>
          </Box>
        ) : (
          /* Desktop Header */
          <>
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexGrow: 1,
              }}
            >
              <Typography
                component={Link}
                to="/dashboard"
                variant="h6"
                color="inherit"
                noWrap
                sx={{
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                }}
              >
                HyperTrade MLM
              </Typography>
            </Box>

            {/* Desktop Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Wallet Selector */}
              <Button
                variant="text"
                color="inherit"
                sx={{
                  borderRadius: 4,
                  textTransform: 'none',
                  mr: 2,
                  px: 2,
                  py: 0.75,
                  backgroundColor: 'rgba(51, 117, 187, 0.08)',
                  border: '1px solid rgba(51, 117, 187, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 117, 187, 0.12)',
                  },
                  transition: 'all 0.2s ease',
                }}
                endIcon={<ArrowDropDownIcon />}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    mr: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WalletIcon sx={{ fontSize: 16, color: 'white' }} />
                </Box>
                Main Wallet
              </Button>

              {/* Notifications */}
              <IconButton color="inherit" onClick={handleNotificationsMenuOpen} sx={{ mr: 1 }}>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Profile */}
              <Box sx={{ ml: 1 }}>
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleProfileMenuOpen}
                    size="small"
                    edge="end"
                    aria-label="account of current user"
                    aria-haspopup="true"
                    color="inherit"
                  >
                    {user?.avatar ? (
                      <Avatar
                        src={user.avatar}
                        alt={user.name || 'User'}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <AccountCircle />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </>
        )}

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }
          }}
        >
          <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
            Profile
          </MenuItem>
          <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchorEl}
          id="notifications-menu"
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              maxWidth: 320,
            }
          }}
        >
          <MenuItem onClick={handleNotificationsMenuClose}>
            New deposit received
          </MenuItem>
          <MenuItem onClick={handleNotificationsMenuClose}>
            Daily ROI credited
          </MenuItem>
          <MenuItem onClick={handleNotificationsMenuClose}>
            New team member joined
          </MenuItem>
          <MenuItem onClick={handleNotificationsMenuClose}>
            Withdrawal processed
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
