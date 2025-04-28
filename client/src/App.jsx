import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { DataProvider } from './context/DataContext';
import ThemeProvider from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Loader from './components/common/Loader';
import NetworkStatusMonitor from './components/common/NetworkStatusMonitor';
import SessionTimeoutWarning from './components/common/SessionTimeoutWarning';

// Layouts - these are critical so we don't lazy load them
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages - these are critical for initial load
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Lazy load all other pages to improve initial load time
// Dashboard Pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Team Pages
const TeamStructure = lazy(() => import('./pages/team/TeamStructure'));
const DirectTeam = lazy(() => import('./pages/team/DirectTeam'));

// Income Pages
const LevelROIIncome = lazy(() => import('./pages/income/LevelRoiIncome'));
const DailyROIHistory = lazy(() => import('./pages/income/DailyRoiHistory'));
const DirectIncomeHistory = lazy(() => import('./pages/income/DirectIncomeHistory'));

// Investment Pages
const BuyPackage = lazy(() => import('./pages/investment/BuyPackage'));
const InvestmentHistory = lazy(() => import('./pages/investment/InvestmentHistory'));

// Wallet Pages
const TransferFund = lazy(() => import('./pages/wallet/TransferFund'));
const TransferHistory = lazy(() => import('./pages/wallet/TransferHistory'));
const Deposit = lazy(() => import('./pages/wallet/Deposit'));
const Withdraw = lazy(() => import('./pages/wallet/Withdraw'));
const TransactionHistory = lazy(() => import('./pages/wallet/TransactionHistory'));

// Other Pages
const LiveTrading = lazy(() => import('./pages/live_trading/LiveTrading'));

function App() {
  const { isAuthenticated } = useAuth(); // loading is commented out since it's not being used

  // Show loading indicator while checking authentication status
  // if (loading) {
  //   return <Loader fullPage text="Loading application..." />;
  // }

  // Loading fallback component for lazy-loaded routes
  const LoadingFallback = <Loader fullPage text="Loading page..." />;

  return (
    <ThemeProvider>
      <ErrorBoundary fullPage>
        <DataProvider>
          <Router>
            <NetworkStatusMonitor />
            {isAuthenticated && <SessionTimeoutWarning />}
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/forgot-password" element={
                  !isAuthenticated ? (
                    <Suspense fallback={LoadingFallback}>
                      <ForgotPassword />
                    </Suspense>
                  ) : <Navigate to="/dashboard" />
                } />
              </Route>

              {/* Protected Routes */}
              <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
                {/* Dashboard */}
                <Route path="/dashboard" element={
                  <Suspense fallback={LoadingFallback}>
                    <Dashboard />
                  </Suspense>
                } />

                {/* Team Routes */}
                <Route path="/team" element={
                  <Suspense fallback={LoadingFallback}>
                    <TeamStructure />
                  </Suspense>
                } />
                <Route path="/direct-team" element={
                  <Suspense fallback={LoadingFallback}>
                    <DirectTeam />
                  </Suspense>
                } />

                {/* Investment Routes */}
                <Route path="/buy-package" element={
                  <Suspense fallback={LoadingFallback}>
                    <BuyPackage />
                  </Suspense>
                } />
                <Route path="/investment-history" element={
                  <Suspense fallback={LoadingFallback}>
                    <InvestmentHistory />
                  </Suspense>
                } />
                <Route path="/daily-roi-history" element={
                  <Suspense fallback={LoadingFallback}>
                    <DailyROIHistory />
                  </Suspense>
                } />
                <Route path="/direct-income-history" element={
                  <Suspense fallback={LoadingFallback}>
                    <DirectIncomeHistory />
                  </Suspense>
                } />
                <Route path="/level-roi-income" element={
                  <Suspense fallback={LoadingFallback}>
                    <LevelROIIncome />
                  </Suspense>
                } />

                {/* Wallet Routes */}
                <Route path="/transfer-fund" element={
                  <Suspense fallback={LoadingFallback}>
                    <TransferFund />
                  </Suspense>
                } />
                <Route path="/transfer-history" element={
                  <Suspense fallback={LoadingFallback}>
                    <TransferHistory />
                  </Suspense>
                } />
                <Route path="/deposit" element={
                  <Suspense fallback={LoadingFallback}>
                    <Deposit />
                  </Suspense>
                } />
                <Route path="/withdraw" element={
                  <Suspense fallback={LoadingFallback}>
                    <Withdraw />
                  </Suspense>
                } />
                <Route path="/transaction-history" element={
                  <Suspense fallback={LoadingFallback}>
                    <TransactionHistory />
                  </Suspense>
                } />

                {/* Live Trading Route */}
                <Route path="/live-trading" element={
                  <Suspense fallback={LoadingFallback}>
                    <LiveTrading />
                  </Suspense>
                } />
              </Route>

              {/* Default Route */}
              <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            </Routes>
          </Router>
        </DataProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
