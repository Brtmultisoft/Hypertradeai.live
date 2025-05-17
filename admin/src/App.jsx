import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import theme from './theme';
import useAuth from './hooks/useAuth';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Team Pages
import AllTeam from './pages/team/AllTeam';
import EditUser from './pages/team/EditUser';
import TeamStructure from './pages/team/TeamStructure';

// Investment Pages
import Investments from './pages/investment/Investments';

// Income Pages
import DailyRoiHistory from './pages/income/DailyRoiHistory';
import LevelRoiHistory from './pages/income/LevelRoiHistory';
import DirectIncomeHistory from './pages/income/DirectIncomeHistory';

// Wallet Pages
import TransferFund from './pages/wallet/TransferFund';
import TransferHistory from './pages/wallet/TransferHistory';
import DepositHistory from './pages/wallet/DepositHistory';
import WithdrawalHistory from './pages/wallet/WithdrawalHistory';

// Announcements Pages
import AnnouncementsList from './pages/announcements/AnnouncementsList';
import AnnouncementsDisplay from './pages/announcements/AnnouncementsDisplay';
import TradeActivationHistory from './pages/trading/TradeActivationHistory';

// Error Page
import NotFound from './pages/NotFound';
import FundDeduct from './pages/wallet/FundDeduct';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading indicator while checking authentication status
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100%',
          bgcolor: '#0B0E11', // Dark background matching theme
        }}
      >
        <Box
          component="img"
          src="../logo.png"
          alt="HypeTrade AI"
          sx={{
            height: 80,
            mb: 3,
            animation: 'pulse 1.5s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 },
            },
          }}
        />
        <CircularProgress
          size={50}
          thickness={4}
          sx={{
            color: '#FCD535', // Primary yellow from theme
            mb: 2,
            animation: 'spin 1.5s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            }
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: '#FFFFFF',
            fontWeight: 'bold',
            mt: 1,
            animation: 'fadeInOut 1.5s infinite ease-in-out',
            '@keyframes fadeInOut': {
              '0%': { opacity: 0.7 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.7 },
            },
          }}
        >
          Loading Admin Panel
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          </Route>

          {/* Protected Routes */}
          <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Team Routes */}
            <Route path="/all-team" element={<AllTeam />} />
            <Route path="/team-structure" element={<TeamStructure />} />
            <Route path="/edit-user/:id" element={<EditUser />} />

            {/* Investment Routes */}
            <Route path="/investments" element={<Investments />} />

            {/* Income Routes */}
            <Route path="/daily-roi-history" element={<DailyRoiHistory />} />
            <Route path="/level-roi-history" element={<LevelRoiHistory />} />
            <Route path="/direct-income-history" element={<DirectIncomeHistory />} />

            {/* Wallet Routes */}
            <Route path="/transfer-fund" element={<TransferFund />} />
            <Route path="/deduct-fund" element={<FundDeduct />} />
            <Route path="/transfer-history" element={<TransferHistory />} />
            <Route path="/deposit-history" element={<DepositHistory />} />
            <Route path="/withdrawal-history" element={<WithdrawalHistory />} />

            {/* Announcements Routes */}
            <Route path="/announcements" element={<AnnouncementsList />} />
            <Route path="/announcements-display" element={<AnnouncementsDisplay />} />

            {/* Trading Routes */}
            <Route path="/trade-activation-history" element={<TradeActivationHistory />} />
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
