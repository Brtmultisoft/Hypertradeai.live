import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';

const Header = ({ onToggleSidebar }) => {
  const theme = useTheme();
  const navigate = useNavigate();
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
    navigate('/login');
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        {/* Menu Toggle Button */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Typography
          component={Link}
          to="/dashboard"
          variant="h6"
          color="inherit"
          noWrap
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: theme.palette.primary.main,
            fontWeight: 'bold',
          }}
        >
          HyperTrade Admin
        </Typography>

        {/* Notifications */}
        <IconButton color="inherit" onClick={handleNotificationsMenuOpen}>
          <Badge badgeContent={4} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Profile */}
        <Tooltip title="Account settings">
          <IconButton
            edge="end"
            color="inherit"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
              }}
            >
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <AccountCircle sx={{ mr: 2 }} /> Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
            <SettingsIcon sx={{ mr: 2 }} /> Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 2 }} /> Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchorEl}
          id="notifications-menu"
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsMenuClose}
          onClick={handleNotificationsMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              width: 320,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <MenuItem>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2">New Withdrawal Request</Typography>
              <Typography variant="body2" color="text.secondary">
                User John Doe requested a withdrawal of $500
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2">New User Registration</Typography>
              <Typography variant="body2" color="text.secondary">
                Jane Smith just registered on the platform
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2">New Investment</Typography>
              <Typography variant="body2" color="text.secondary">
                User Mike Johnson made a new investment of $1000
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2">System Alert</Typography>
              <Typography variant="body2" color="text.secondary">
                Daily ROI distribution completed successfully
              </Typography>
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
