import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  Tooltip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Payments as PaymentsIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as WalletIcon,
  MonetizationOn as MonetizationOnIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import StatCard from '../../components/dashboard/StatCard';
import EarningsChart from '../../components/dashboard/EarningsChart';
import TeamGrowthChart from '../../components/dashboard/TeamGrowthChart';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import axios from 'axios';
import { API_URL } from '../../config';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-all-users-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.status) {
        setDashboardData(response.data.result);
        setLastUpdate(new Date());
      } else {
        setError(response.data?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    return lastUpdate.toLocaleTimeString();
  };

  // Sample chart data (replace with actual data from API)
  const earningsChartData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      total: Math.random() * 1000 + 500,
      roi: Math.random() * 500 + 250,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      total: Math.random() * 10000 + 5000,
      roi: Math.random() * 5000 + 2500,
    })),
  };

  const teamGrowthData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      direct: Math.floor(Math.random() * 5) + i,
      total: 50 + Math.floor(Math.random() * 10) + i * 2,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      direct: Math.floor(Math.random() * 20) + i * 2,
      total: 100 + Math.floor(Math.random() * 50) + i * 10,
    })),
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome, {user?.name || 'Admin'}! Here's an overview of the platform.
          </Typography> */}
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatLastUpdate()}
          </Typography>
        </div>
        {/* <Tooltip title="Refresh Dashboard Data">
          <IconButton onClick={handleRefresh} color="primary">
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip> */}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        {/* Total Users */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Users"
            value={dashboardData?.userCount || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            prefix=""
            onClick={() => navigate('/all-team')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Wallet Balance */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Wallet Balance"
            value={dashboardData?.wallet || 0}
            icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/all-team')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Topup Wallet Balance */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Topup Wallet"
            value={dashboardData?.wallet_topup || 0}
            icon={<WalletIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/all-team')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Investments */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Investments"
            value={dashboardData?.totalInvestment || 0}
            icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/investments')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Daily ROI */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Daily ROI"
            value={dashboardData?.dailyIncome || 0}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/daily-roi-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Direct Income */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Direct Income"
            value={dashboardData?.directIncome || 0}
            icon={<MonetizationOnIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/direct-income-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Level ROI Income */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Level ROI Income"
            value={dashboardData?.levelIncome || 0}
            icon={<MonetizationOnIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/level-roi-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Deposits */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Deposits"
            value={dashboardData?.deposits || 0}
            icon={<PaymentsIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/deposit-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Withdrawals */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <StatCard
            title="Total Withdrawals"
            value={dashboardData?.withdrawals || 0}
            icon={<WalletIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/withdrawal-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        <Grid item sx={{ width: { lg: '48%', md: '50%', sm: '50%', xs: '100%' } }}>
          <EarningsChart data={earningsChartData} />
        </Grid>
        <Grid item sx={{ width: { lg: '49%', md: '50%', sm: '50%', xs: '100%' } }}>
          <TeamGrowthChart data={teamGrowthData} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <PeopleIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                View All Users
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage all users and their details
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/all-team')}
              >
                View Users
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <ShoppingCartIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                View Investments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage all investments on the platform
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/investments')}
              >
                View Investments
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <SwapHorizIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                Transfer Funds
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Transfer funds to any user's wallet
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/transfer-fund')}
              >
                Transfer Funds
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%', md: '40%', sm: '43%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <WalletIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                Manage Withdrawals
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Approve or reject withdrawal requests
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/withdrawal-history')}
              >
                Manage Withdrawals
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
