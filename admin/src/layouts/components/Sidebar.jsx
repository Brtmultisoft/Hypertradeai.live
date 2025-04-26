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
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  ExpandLess,
  ExpandMore,
  MonetizationOn as MonetizationOnIcon,
  Savings as SavingsIcon,
  CreditCard as CreditCardIcon,
  SupervisorAccount as SupervisorAccountIcon,
} from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';

const drawerWidth = 280;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for menu collapse
  const [teamOpen, setTeamOpen] = useState(false);
  const [investmentOpen, setInvestmentOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const handleTeamClick = () => {
    setTeamOpen(!teamOpen);
  };

  const handleInvestmentClick = () => {
    setInvestmentOpen(!investmentOpen);
  };

  const handleIncomeClick = () => {
    setIncomeOpen(!incomeOpen);
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
    <Box sx={{ width: drawerWidth, overflow: 'auto' }}>
      {/* Logo and Brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src="./logo.png"
          alt="HypeTrade AI"
          sx={{ height: 40, mr: 1 }}
        />
        <Typography
          variant="h6"
          component={Link}
          to="/dashboard"
          sx={{
            textDecoration: 'none',
            color: theme.palette.primary.main,
            fontWeight: 'bold',
          }}
        >
          Admin Panel
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List component="nav" sx={{ p: 1 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/dashboard"
            selected={isActive('/dashboard')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}20`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}30`,
                },
              },
            }}
          >
            <ListItemIcon>
              <DashboardIcon
                color={isActive('/dashboard') ? 'primary' : 'inherit'}
              />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Team Management */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleTeamClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}20`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}30`,
                },
              },
            }}
          >
            <ListItemIcon>
              <SupervisorAccountIcon color={teamOpen ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Team Management" />
            {teamOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={teamOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              to="/all-team"
              selected={isActive('/all-team')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <PeopleIcon
                  color={isActive('/all-team') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="All Team" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Investment Management */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleInvestmentClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}20`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}30`,
                },
              },
            }}
          >
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
              to="/investments"
              selected={isActive('/investments')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <ShoppingCartIcon
                  color={isActive('/investments') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="All Investments" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Income Management */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleIncomeClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}20`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}30`,
                },
              },
            }}
          >
            <ListItemIcon>
              <MonetizationOnIcon color={incomeOpen ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Income" />
            {incomeOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={incomeOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              to="/daily-roi-history"
              selected={isActive('/daily-roi-history')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <AttachMoneyIcon
                  color={isActive('/daily-roi-history') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="MPR History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/level-roi-history"
              selected={isActive('/level-roi-history')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <AttachMoneyIcon
                  color={isActive('/level-roi-history') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="Level ROI History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/direct-income-history"
              selected={isActive('/direct-income-history')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <AttachMoneyIcon
                  color={isActive('/direct-income-history') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="Direct Income History" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Wallet Management */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleWalletClick}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: `${theme.palette.primary.main}20`,
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}30`,
                },
              },
            }}
          >
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
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <SwapHorizIcon
                  color={isActive('/transfer-fund') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="Transfer Fund" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/transfer-history"
              selected={isActive('/transfer-history')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <HistoryIcon
                  color={isActive('/transfer-history') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="Transfer History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/deposit-history"
              selected={isActive('/deposit-history')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <CreditCardIcon
                  color={isActive('/deposit-history') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="Deposit History" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/withdrawal-history"
              selected={isActive('/withdrawal-history')}
              onClick={handleItemClick}
              sx={{
                pl: 4,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}20`,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              <ListItemIcon>
                <SavingsIcon
                  color={isActive('/withdrawal-history') ? 'primary' : 'inherit'}
                />
              </ListItemIcon>
              <ListItemText primary="Withdrawal History" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
            visibility: open ? 'visible' : 'hidden',
            transition: theme.transitions.create(['transform', 'visibility'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;
