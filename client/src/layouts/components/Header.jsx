import { useState, useEffect } from 'react';
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
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Popper,
  ClickAwayListener,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ArrowDropDown as ArrowDropDownIcon,
  AccountBalanceWallet as WalletIcon,
  Share as ShareIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Announcement as AnnouncementIcon,
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
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();

      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(notificationAnchorEl ? null : event.currentTarget);
    if (!notificationAnchorEl) {
      fetchNotifications();
    }
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'warning': return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'error': return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      case 'announcement': return <AnnouncementIcon sx={{ color: theme.palette.primary.main }} />;
      default: return <InfoIcon sx={{ color: theme.palette.text.secondary }} />;
    }
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
        {/* Menu Toggle Button - Show on all screen sizes */}
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
              backgroundColor: theme.palette.action.hover,
            },
            transition: 'all 0.2s ease',
          }}
        >
          <MenuIcon />
        </IconButton>

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
                  to="/settings"
                  variant="h6"
                  color="inherit"
                  noWrap
                  sx={{
                    textDecoration: 'none',
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    lineHeight: 1.2,
                    letterSpacing: '0.5px',
                    textShadow: mode === 'dark' ? `0 0 8px ${theme.palette.primary.main}30` : 'none',
                  }}
                >
                  HypeTrade AI
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: mode === 'dark' ? theme.palette.action.selected : theme.palette.action.hover,
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.3,
                    border: `1px solid ${theme.palette.primary.main}30`,
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
                        color: theme.palette.primary.main,
                      }}
                    >
                      {user?.sponsorID || 'Loading...'}
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

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={handleNotificationClick}
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    {unreadCount > 0 ? <NotificationsIcon fontSize="small" /> : <NotificationsNoneIcon fontSize="small" />}
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Referral Button */}
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
                    textShadow: mode === 'dark' ? `0 0 8px ${theme.palette.primary.main}30` : 'none',
                  }}
                >
                  HypeTrade AI
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: mode === 'dark' ? theme.palette.action.selected : theme.palette.action.hover,
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.3,
                    border: `1px solid ${theme.palette.primary.main}30`,
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
                        color: theme.palette.primary.main,
                      }}
                    >
                      {user?.sponsorID || 'Loading...'}
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
                  backgroundColor: theme.palette.action.hover,
                  border: `1px solid ${theme.palette.primary.main}30`,
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected,
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
                  <WalletIcon sx={{ fontSize: 16, color: theme.palette.primary.contrastText }} />
                </Box>
                Main Wallet
              </Button>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  color="inherit"
                  onClick={handleNotificationClick}
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Referral Button */}
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
          <MenuItem component={Link} to="/settings" onClick={handleMenuClose}>
            Profile
          </MenuItem>

          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>

        {/* Notifications Dropdown */}
        <Popper
          open={Boolean(notificationAnchorEl)}
          anchorEl={notificationAnchorEl}
          placement="bottom-end"
          sx={{ zIndex: 1300 }}
        >
          <ClickAwayListener onClickAway={handleNotificationClose}>
            <Paper
              sx={{
                width: 350,
                maxHeight: 400,
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </Box>

              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {loadingNotifications ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading notifications...
                    </Typography>
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No notifications yet
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {notifications.map((notification, index) => (
                      <Box key={notification._id}>
                        <ListItem
                          sx={{
                            py: 1.5,
                            px: 2,
                            backgroundColor: notification.isRead ? 'transparent' : theme.palette.action.hover,
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: theme.palette.action.selected,
                            },
                          }}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification._id);
                            }
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {getNotificationIcon(notification.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: notification.isRead ? 'normal' : 'bold',
                                  color: notification.isRead ? 'text.secondary' : 'text.primary',
                                }}
                              >
                                {notification.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: 'text.secondary',
                                    mb: 0.5,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < notifications.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </Box>

              {notifications.length > 0 && (
                <Box
                  sx={{
                    p: 1,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    textAlign: 'center',
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => {
                      // Navigate to notifications page
                      window.location.href = '/notifications';
                    }}
                  >
                    View All Notifications
                  </Button>
                </Box>
              )}
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
