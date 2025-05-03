import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ArrowDropDown as ArrowDropDownIcon,
  AccountBalanceWallet as WalletIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

import useAuth from '../../hooks/useAuth';
import { useData } from '../../context/DataContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

const Header = ({ onToggleSidebar }) => {
  const theme = useMuiTheme();
  const { mode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const { userData } = useData();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5,
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
                    lineHeight: 1.2,
                    letterSpacing: '0.5px',
                    textShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.3)' : 'none',
                  }}
                >
                  HypeTrade AI
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.15)' : 'rgba(51, 117, 187, 0.08)',
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.3,
                    border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.3)' : 'rgba(51, 117, 187, 0.15)'}`,
                    boxShadow: mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    minWidth: 80,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 'medium',
                      fontSize: '0.7rem',
                      letterSpacing: '0.3px',
                    }}
                  >
                    ID: <Box
                      component="span"
                      sx={{
                        fontWeight: 'bold',
                        color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
                      }}
                    >
                      {userData?.sponsorID || 'Loading...'}
                    </Box>
                  </Typography>
                </Box>
              </Box>
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
                  {/* Theme Toggle removed from mobile view */}

              {/* Referral Button (replaced notification icon) */}
              <Tooltip title="Copy Referral Link">
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => {
                    const referralCode = userData?.sponsorID;
                    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

                    if (!referralCode) {
                      // Show error message
                      return;
                    }

                    navigator.clipboard.writeText(referralLink)
                      .then(() => {
                        // Show success message using snackbar
                        const event = new CustomEvent('showNotification', {
                          detail: {
                            message: 'Referral link copied to clipboard!',
                            severity: 'success'
                          }
                        });
                        document.dispatchEvent(event);
                      })
                      .catch((error) => {
                        console.error('Failed to copy: ', error);
                        const event = new CustomEvent('showNotification', {
                          detail: {
                            message: 'Failed to copy referral link',
                            severity: 'error'
                          }
                        });
                        document.dispatchEvent(event);
                      });
                  }}
                >
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5,
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
                    lineHeight: 1.2,
                    letterSpacing: '0.5px',
                    textShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.3)' : 'none',
                  }}
                >
                  HypeTrade AI
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.15)' : 'rgba(51, 117, 187, 0.08)',
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.3,
                    border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.3)' : 'rgba(51, 117, 187, 0.15)'}`,
                    boxShadow: mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    minWidth: 80,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 'medium',
                      fontSize: '0.7rem',
                      letterSpacing: '0.3px',
                    }}
                  >
                    ID: <Box
                      component="span"
                      sx={{
                        fontWeight: 'bold',
                        color: mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
                      }}
                    >
                      {userData?.sponsorID || 'Loading...'}
                    </Box>
                  </Typography>
                </Box>
              </Box>
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

              {/* Referral Button (replaced notification icon) */}
              <Tooltip title="Copy Referral Link">
                <IconButton
                  color="inherit"
                  sx={{ mr: 1 }}
                  onClick={() => {
                    const referralCode = userData?.sponsorID;
                    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

                    if (!referralCode) {
                      // Show error message
                      return;
                    }

                    navigator.clipboard.writeText(referralLink)
                      .then(() => {
                        // Show success message using snackbar
                        const event = new CustomEvent('showNotification', {
                          detail: {
                            message: 'Referral link copied to clipboard!',
                            severity: 'success'
                          }
                        });
                        document.dispatchEvent(event);
                      })
                      .catch((error) => {
                        console.error('Failed to copy: ', error);
                        const event = new CustomEvent('showNotification', {
                          detail: {
                            message: 'Failed to copy referral link',
                            severity: 'error'
                          }
                        });
                        document.dispatchEvent(event);
                      });
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>

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
          slotProps={{
            paper: {
              sx: {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              }
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

        {/* Notifications Menu removed */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
