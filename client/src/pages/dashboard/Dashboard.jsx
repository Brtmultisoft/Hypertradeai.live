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
} from '@mui/icons-material';
import StatCard from '../../components/dashboard/StatCard';
import EarningsChart from '../../components/dashboard/EarningsChart';
import TeamGrowthChart from '../../components/dashboard/TeamGrowthChart';
import useAuth from '../../hooks/useAuth';
import useData from '../../hooks/useData';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    dashboardData,
    loadingDashboard,
    dashboardError,
    fetchDashboardData,
    lastUpdate
  } = useData();

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const date = new Date(lastUpdate);
    return date.toLocaleTimeString();
  };

  // Sample chart data (replace with actual data from API)
  const earningsChartData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      total: Math.random() * 100 + 50,
      roi: Math.random() * 50 + 25,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      total: Math.random() * 1000 + 500,
      roi: Math.random() * 500 + 250,
    })),
  };

  const teamGrowthData = {
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      direct: Math.floor(Math.random() * 3),
      total: 10 + Math.floor(Math.random() * 5) + i,
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short' }),
      direct: Math.floor(Math.random() * 10) + i,
      total: 10 + Math.floor(Math.random() * 20) + i * 3,
    })),
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name || 'User'}! Here's an overview of your account.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {formatLastUpdate()}
          </Typography>
        </div>
        <Tooltip title="Refresh Dashboard Data">
          <IconButton onClick={handleRefresh} color="primary">
            {loadingDashboard ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {dashboardError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {dashboardError}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        {/* Main Wallet Balance */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "42%", sm : "40%",xs : "100%" } }}>
          <StatCard
            title="Main Wallet Balance"
            value={dashboardData?.wallet_balance || 0}
            icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/deposit')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Topup Wallet Balance */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%",xs : "100%" } }}>
          <StatCard
            title="Topup Wallet Balance"
            value={dashboardData?.topup_wallet_balance || 0}
            icon={<WalletIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/transfer-fund')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Total Earnings */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%",xs : "100%" } }}>
          <StatCard
            title="Total Earnings"
            value={dashboardData?.total_earnings || 0}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/daily-roi-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Active Investments */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%",xs : "100%" } }}>
          <StatCard
            title="Active Investments"
            value={dashboardData?.active_investments || 0}
            icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/investment-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Team Members */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%" , xs : "100%"} }}>
          <StatCard
            title="Team Members"
            value={dashboardData?.team_size || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            prefix=""
            onClick={() => navigate('/team')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Direct Referrals */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%" , xs : "100%"} }}>
          <StatCard
            title="Direct Referrals"
            value={dashboardData?.direct_referrals || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            prefix=""
            onClick={() => navigate('/direct-team')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Daily ROI */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%" , xs : "100%"} }}>
          <StatCard
            title="Daily ROI"
            value={dashboardData?.daily_profit || 0}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/daily-roi-history')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>

        {/* Level ROI Income */}
        <Grid item xs={12} sm={6} lg={3} sx={{ width: { lg: '25%',md : "40%", sm : "43%" , xs : "100%"} }}>
          <StatCard
            title="Level ROI Income"
            value={dashboardData?.level_roi_income || 0}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            prefix="$"
            onClick={() => navigate('/level-roi-income')}
            sx={{ height: '100%', boxShadow: 2, borderRadius: 2 }}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4, width: '100%' }}>
        <Grid item sx={{ width: { lg: '48%',md : "50%", sm : "50%",xs : "100%" } }}>
          <EarningsChart data={earningsChartData} />
        </Grid>
        <Grid item sx={{ width: { lg: '49%',md : "50%", sm : "50%",xs : "100%" } }}>
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
              <ShoppingCartIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                Buy Package
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Invest in our trading packages and start earning daily ROI.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/buy-package')}
              >
                Buy Now
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
              <PaymentsIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                Deposit Funds
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add funds to your wallet to invest in packages.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/deposit')}
              >
                Deposit
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
              <PeopleIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                Invite Friends
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Grow your team and earn referral commissions.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  // Copy referral link to clipboard
                  const referralLink = `${window.location.origin}/register?ref=${user?.username || ''}`;
                  navigator.clipboard.writeText(referralLink);
                  alert('Referral link copied to clipboard!');
                }}
              >
                Copy Link
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
              <AccountBalanceIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant="h6" component="h3" gutterBottom>
                Withdraw
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Withdraw your earnings to your wallet or bank account.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/withdraw')}
              >
                Withdraw
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Income Breakdown */}
      <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
        Income Breakdown
      </Typography>
      <Grid container spacing={3} sx={{ width: '100%' }}>
        <Grid item xs={12} sm={6} lg={4} sx={{ width: { lg: '33.33%', md: '50%', sm: '50%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Daily ROI
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(dashboardData?.daily_profit || 0)}
              </Typography>
              <Button
                variant="text"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => navigate('/daily-roi-history')}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4} sx={{ width: { lg: '33.33%', md: '50%', sm: '50%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Referral Bonus
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(dashboardData?.referral_bonus || 0)}
              </Typography>
              <Button
                variant="text"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => navigate('/direct-income-history')}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4} sx={{ width: { lg: '33.33%', md: '50%', sm: '50%', xs: '100%' } }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Level ROI Income
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(dashboardData?.level_roi_income || dashboardData?.team_commission || 0)}
              </Typography>
              <Button
                variant="text"
                color="primary"
                sx={{ mt: 2 }}
                onClick={() => navigate('/level-roi-income')}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
