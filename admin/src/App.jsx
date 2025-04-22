import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
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

// Error Page
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading indicator while checking authentication status
  if (loading) {
    return <div>Loading...</div>;
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

            {/* Investment Routes */}
            <Route path="/investments" element={<Investments />} />

            {/* Income Routes */}
            <Route path="/daily-roi-history" element={<DailyRoiHistory />} />
            <Route path="/level-roi-history" element={<LevelRoiHistory />} />
            <Route path="/direct-income-history" element={<DirectIncomeHistory />} />

            {/* Wallet Routes */}
            <Route path="/transfer-fund" element={<TransferFund />} />
            <Route path="/transfer-history" element={<TransferHistory />} />
            <Route path="/deposit-history" element={<DepositHistory />} />
            <Route path="/withdrawal-history" element={<WithdrawalHistory />} />
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
