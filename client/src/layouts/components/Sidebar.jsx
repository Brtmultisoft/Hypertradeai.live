import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';

const drawerWidth = 280; // Increased from 240 to make sidebar wider

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for menu collapse
  const [teamOpen, setTeamOpen] = useState(false);
  const [investmentOpen, setInvestmentOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const handleTeamClick = () => {
    setTeamOpen(!teamOpen);
  };

  const handleInvestmentClick = () => {
    setInvestmentOpen(!investmentOpen);
  };

  const handleWalletClick = () => {
    setWalletOpen(!walletOpen);
  };

  const handleItemClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      {/* Logo and Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="HyperTrade MLM"
          sx={{ height: 40, display: 'block', mx: 'auto' }}
        />
      </Box>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 1,
          }}
        >
          {user?.avatar ? (
            <Box
              component="img"
              src={user.avatar}
              alt={user.name || 'User'}
              sx={{ width: 64, height: 64, borderRadius: '50%' }}
            />
          ) : (
            <PersonIcon sx={{ fontSize: 40, color: theme.palette.common.black }} />
          )}
        </Box>
        <Box sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          {user?.name || 'User'}
        </Box>
        <Box sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
          {user?.email || 'user@example.com'}
        </Box>
      </Box>

      <Divider />

      {/* Navigation Links */}
      <List>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/dashboard"
            selected={isActive('/dashboard')}
            onClick={handleItemClick}
          >
            <ListItemIcon>
              <DashboardIcon color={isActive('/dashboard') ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Team */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleTeamClick}>
            <ListItemIcon>
              <PeopleIcon color={teamOpen ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Team" />
            {teamOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={teamOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              to="/team"
              selected={isActive('/team')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PeopleIcon color={isActive('/team') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Team Structure" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/direct-team"
              selected={isActive('/direct-team')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PersonIcon color={isActive('/direct-team') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Direct Team" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Investment */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleInvestmentClick}>
            <ListItemIcon>
              <ShoppingCartIcon color={investmentOpen ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Investment" />
            {investmentOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={investmentOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              to="/buy-package"
              selected={isActive('/buy-package')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <ShoppingCartIcon color={isActive('/buy-package') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Buy Package" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/investment-history"
              selected={isActive('/investment-history')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HistoryIcon color={isActive('/investment-history') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Investment History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/daily-roi-history"
              selected={isActive('/daily-roi-history')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AttachMoneyIcon color={isActive('/daily-roi-history') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Daily ROI History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/direct-income-history"
              selected={isActive('/direct-income-history')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PaymentsIcon color={isActive('/direct-income-history') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Direct Income" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/level-roi-income"
              selected={isActive('/level-roi-income')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AttachMoneyIcon color={isActive('/level-roi-income') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Level ROI Income" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Wallet */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleWalletClick}>
            <ListItemIcon>
              <AccountBalanceIcon color={walletOpen ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Wallet" />
            {walletOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={walletOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              to="/transfer-fund"
              selected={isActive('/transfer-fund')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <SwapHorizIcon color={isActive('/transfer-fund') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Transfer Fund" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/transfer-history"
              selected={isActive('/transfer-history')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HistoryIcon color={isActive('/transfer-history') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Transfer History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/deposit"
              selected={isActive('/deposit')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AttachMoneyIcon color={isActive('/deposit') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Deposit" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/withdraw"
              selected={isActive('/withdraw')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PaymentsIcon color={isActive('/withdraw') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Withdraw" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/transaction-history"
              selected={isActive('/transaction-history')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HistoryIcon color={isActive('/transaction-history') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Transaction History" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      // sx={{ width: { md: open ? drawerWidth : 0 }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[3],
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        /* Desktop drawer */
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[3],
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
