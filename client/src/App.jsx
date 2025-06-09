import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import useAuth from './hooks/useAuth';
import { DataProvider } from './context/DataContext';
import ThemeProvider from './context/ThemeContext';
import { TradingContextProvider } from './context/TradingContext';

// Import Binance theme styles
import './styles/BinanceTheme.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';

// Import team pages
import TeamStructure from './pages/team/TeamStructure';
import DirectTeam from './pages/team/DirectTeam';

// Import actual pages
import LevelROIIncome from './pages/income/LevelRoiIncome';
import DailyROIHistory from './pages/income/DailyRoiHistory';
import DirectIncomeHistory from './pages/income/DirectIncomeHistory';
import BuyPackage from './pages/investment/BuyPackage';
import InvestmentHistory from './pages/investment/InvestmentHistory';
import TransferFund from './pages/wallet/TransferFund';
import TransferHistory from './pages/wallet/TransferHistory';
import Deposit from './pages/wallet/Deposit';
import Withdraw from './pages/wallet/Withdraw';
import LiveTrading from './pages/live_trading/LiveTrading';
import TransactionHistory from './pages/wallet/TransactionHistory';
import Settings from './pages/settings/Settings';
import TradeActivationHistory from './pages/TradeActivationHistory';

// Common Components

import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  const { isAuthenticated, loading, token } = useAuth();

  // Debug logging
  console.log('App render - isAuthenticated:', isAuthenticated, 'loading:', loading, 'token:', !!token);

  // Show loading indicator while checking authentication status
  // Only show loading if we're actually loading and don't have a token yet
  // Don't show loading screen on auth pages to avoid interfering with OTP/2FA flows
  const isOnAuthPage = ['/login', '/forgot-password', '/register'].includes(window.location.pathname);

  if (loading && !token && !isOnAuthPage) {
    console.log('App showing loading spinner - loading:', loading, 'token:', !!token, 'isOnAuthPage:', isOnAuthPage);
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary fullPage>
        <DataProvider>
          <TradingContextProvider>
            <Router>
              <Routes>
              {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
              <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
            </Route>

            {/* Protected Routes */}
            <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Team Routes */}
              <Route path="/team" element={<TeamStructure />} />
              <Route path="/direct-team" element={<DirectTeam />} />

              {/* Investment Routes */}
              <Route path="/buy-package" element={<BuyPackage />} />
              <Route path="/investment-history" element={<InvestmentHistory />} />
              <Route path="/daily-roi-history" element={<DailyROIHistory />} />
              <Route path="/direct-income-history" element={<DirectIncomeHistory />} />
              <Route path="/level-roi-income" element={<LevelROIIncome />} />

              {/* Wallet Routes */}
              <Route path="/transfer-fund" element={<TransferFund />} />
              <Route path="/transfer-history" element={<TransferHistory />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />

              {/* Live Trading Routes */}
              <Route path="/live-trading" element={<LiveTrading />} />
              <Route path="/trade-activation-history" element={<TradeActivationHistory />} />

              {/* Settings Route */}
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Default Route */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            </Routes>
          </Router>
          </TradingContextProvider>
        </DataProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
