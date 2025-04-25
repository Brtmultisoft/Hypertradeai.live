import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SelfTransferForm from '../../components/wallet/SelfTransferForm';
import UserTransferForm from '../../components/wallet/UserTransferForm';
import useApi from '../../hooks/useApi';
import { useData } from '../../context/DataContext';
import UserService from '../../services/user.service';
import WalletService from '../../services/wallet.service';
import { formatCurrency } from '../../utils/formatters';

const TransferFund = () => {
  const theme = useTheme();
  const { refreshAllData, triggerUpdate } = useData();
  const [activeTab, setActiveTab] = useState(0);
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [topupBalance, setTopupBalance] = useState(0);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState(null);

  // Fetch user wallet data
  const {
    data: userData,
    loading: loadingUserData,
    error: userDataError,
    execute: fetchUserData,
  } = useApi(() => UserService.getUserProfile(), {
    onSuccess: (data) => {
      console.log('User profile loaded:', data);
    },
    onError: (error) => {
      console.error('Failed to load user profile:', error);
    }
  });

  // Handle self transfer
  const {
    loading: selfTransferLoading,
    error: selfTransferError,
    execute: executeSelfTransfer,
  } = useApi(
    (data) => WalletService.addFundTransfer({
      ...data,
      type: 1, // Self transfer type
    }),
    {
      onSuccess: () => {
        setTransferSuccess(true);
        fetchUserData(); // Refresh wallet balances
        refreshAllData(); // Refresh all data
        triggerUpdate('transferCompleted'); // Trigger transfer completed event
        setTimeout(() => setTransferSuccess(false), 5000);
      },
      onError: (error) => {
        setTransferError(error.msg || 'Transfer failed. Please try again.');
        setTimeout(() => setTransferError(null), 5000);
      },
    }
  );

  // Handle user-to-user transfer
  const {
    loading: userTransferLoading,
    error: userTransferError,
    execute: executeUserTransfer,
  } = useApi(
    (data) => WalletService.addFundTransfer({
      ...data,
      type: 0, // User-to-user transfer type
    }),
    {
      onSuccess: () => {
        setTransferSuccess(true);
        fetchUserData(); // Refresh wallet balances
        refreshAllData(); // Refresh all data
        triggerUpdate('transferCompleted'); // Trigger transfer completed event
        setTimeout(() => setTransferSuccess(false), 5000);
      },
      onError: (error) => {
        setTransferError(error.msg || 'Transfer failed. Please try again.');
        setTimeout(() => setTransferError(null), 5000);
      },
    }
  );

  // Search users for transfer
  const searchUsers = async (query) => {
    if (query.length < 3) return;

    setLoadingUsers(true);
    try {
      const response = await UserService.searchUsers({ search: query });
      if (response.result && response.result.docs) {
        setUserOptions(
          response.result.docs.map((user) => ({
            id: user.username,
            username: user.username,
            email: user.email,
            name: user.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setTransferSuccess(false);
    setTransferError(null);
  };

  // Handle self transfer submission
  const handleSelfTransfer = async (formData) => {
    const { amount, remark } = formData;

    await executeSelfTransfer({
      user_id: userData?.result?.username, // Self transfer
      amount: parseFloat(amount),
      from_wallet: 'main', // Always from main wallet
      to_wallet: 'topup', // Always to topup wallet
      remark: remark || 'Self transfer',
    });
  };

  // Handle user transfer submission
  const handleUserTransfer = async (formData) => {
    const { recipient, amount, remark } = formData;

    await executeUserTransfer({
      user_id: recipient, // Recipient username
      amount: parseFloat(amount),
      from_wallet: 'topup', // Always from topup wallet
      to_wallet: 'topup', // Always to topup wallet
      remark: remark || 'Fund transfer',
      type: 0, // User-to-user transfer type
    });
  };

  // Set wallet balances when user data is loaded
  useEffect(() => {
    if (userData?.result) {
      setWalletBalance(userData.result.wallet || 0);
      setTopupBalance(userData.result.wallet_topup || 0);
    }
  }, [userData]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Transfer Funds" />

      {/* Wallet Balance Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Main Wallet Balance
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {loadingUserData ? <CircularProgress size={24} /> : formatCurrency(walletBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Topup Wallet Balance
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {loadingUserData ? <CircularProgress size={24} /> : formatCurrency(topupBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success/Error Messages */}
      {transferSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Transfer completed successfully!
        </Alert>
      )}
      {transferError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {transferError}
        </Alert>
      )}

      {/* Transfer Tabs */}
      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab
              icon={<SwapHorizIcon />}
              label="Self Transfer"
              iconPosition="start"
            />
            <Tab
              icon={<PersonIcon />}
              label="P2P"
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Panels */}
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <SelfTransferForm
                walletBalance={walletBalance}
                topupBalance={topupBalance}
                onTransfer={handleSelfTransfer}
                loading={selfTransferLoading}
              />
            )}
            {activeTab === 1 && (
              <UserTransferForm
                balance={topupBalance}
                onTransfer={handleUserTransfer}
                loading={userTransferLoading}
                userOptions={userOptions}
                loadingUsers={loadingUsers}
                onSearchUser={searchUsers}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransferFund;
