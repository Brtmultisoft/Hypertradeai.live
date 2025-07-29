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
  Settings as SettingsIcon,
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
          p: 2.5,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src="./logo.png"
          alt="HypeTrade AI"
          sx={{ height: 40, display: 'block', mx: 'auto' }}
        />
      </Box>

      {/* User Info */}
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(to bottom, rgba(51, 117, 187, 0.05), transparent)`,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 2,
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: theme.palette.secondary.main,
              border: `2px solid ${theme.palette.background.paper}`,
            }
          }}
        >
          {user?.avatar ? (
            <Box
              component="img"
              src={user.avatar}
              alt={user.name || 'User'}
              sx={{ width: 72, height: 72, borderRadius: '50%' }}
            />
          ) : (
            <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
          )}
        </Box>
        <Box sx={{ fontWeight: 'bold', color: theme.palette.text.primary, fontSize: '1.1rem', mb: 0.5 }}>
          {user?.name || 'User'}
        </Box>
        <Box
          sx={{
            fontSize: '0.8rem',
            color: theme.palette.text.secondary,
            backgroundColor: 'rgba(51, 117, 187, 0.08)',
            borderRadius: 4,
            py: 0.5,
            px: 1.5,
            display: 'inline-block',
          }}
        >
          {user?.email || 'user@example.com'}
        </Box>
      </Box>

      <Divider />

      {/* Navigation Links */}
      <List sx={{ px: 1, py: 1 }}>
        {/* Dashboard */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/dashboard"
            selected={isActive('/dashboard')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(51, 117, 187, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: isActive('/dashboard') ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                  color: isActive('/dashboard') ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <DashboardIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive('/dashboard') ? 'bold' : 'medium',
                  color: isActive('/dashboard') ? theme.palette.primary.main : theme.palette.text.primary,
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Live Trading */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/live-trading"
            selected={isActive('/live-trading')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(51, 117, 187, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: isActive('/live-trading') ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                  color: isActive('/live-trading') ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <SwapHorizIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Live Trading"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive('/live-trading') ? 'bold' : 'medium',
                  color: isActive('/live-trading') ? theme.palette.primary.main : theme.palette.text.primary,
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Trade Activation History */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/trade-activation-history"
            selected={isActive('/trade-activation-history')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(51, 117, 187, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: isActive('/trade-activation-history') ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                  color: isActive('/trade-activation-history') ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <HistoryIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Trade Activation History"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive('/trade-activation-history') ? 'bold' : 'medium',
                  color: isActive('/trade-activation-history') ? theme.palette.primary.main : theme.palette.text.primary,
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Settings */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to="/settings"
            selected={isActive('/settings')}
            onClick={handleItemClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: 'rgba(51, 117, 187, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(51, 117, 187, 0.12)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: isActive('/settings') ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                  color: isActive('/settings') ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <SettingsIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive('/settings') ? 'bold' : 'medium',
                  color: isActive('/settings') ? theme.palette.primary.main : theme.palette.text.primary,
                }
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Team */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={handleTeamClick}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              backgroundColor: teamOpen ? 'rgba(51, 117, 187, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  backgroundColor: teamOpen ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                  color: teamOpen ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <PeopleIcon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary="Team"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: teamOpen ? 'bold' : 'medium',
                  color: teamOpen ? theme.palette.primary.main : theme.palette.text.primary,
                }
              }}
            />
            {teamOpen ?
              <ExpandLess sx={{ color: theme.palette.primary.main }} /> :
              <ExpandMore />
            }
          </ListItemButton>
        </ListItem>
        <Collapse in={teamOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2, pr: 1 }}>
            <ListItemButton
              component={Link}
              to="/team"
              selected={isActive('/team')}
              onClick={handleItemClick}
              sx={{
                pl: 2,
                borderRadius: 2,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(51, 117, 187, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 117, 187, 0.12)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    backgroundColor: isActive('/team') ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                    color: isActive('/team') ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 16 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Team Structure"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.9rem',
                    fontWeight: isActive('/team') ? 'bold' : 'medium',
                    color: isActive('/team') ? theme.palette.primary.main : theme.palette.text.primary,
                  }
                }}
              />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/direct-team"
              selected={isActive('/direct-team')}
              onClick={handleItemClick}
              sx={{
                pl: 2,
                borderRadius: 2,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(51, 117, 187, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(51, 117, 187, 0.12)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    backgroundColor: isActive('/direct-team') ? 'rgba(51, 117, 187, 0.12)' : 'transparent',
                    color: isActive('/direct-team') ? theme.palette.primary.main : theme.palette.text.secondary,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 16 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary="Direct Team"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: '0.9rem',
                    fontWeight: isActive('/direct-team') ? 'bold' : 'medium',
                    color: isActive('/direct-team') ? theme.palette.primary.main : theme.palette.text.primary,
                  }
                }}
              />
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
              <ListItemText primary="Trade History" />
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
              <ListItemText primary="MPR History" />
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
              <ListItemText primary="Team Trade Income" />
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
              to="/withdrawal-history"
              selected={isActive('/withdrawal-history')}
              onClick={handleItemClick}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <HistoryIcon color={isActive('/withdrawal-history') ? 'primary' : 'inherit'} fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Withdrawal History" />
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
