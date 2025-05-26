import api from './api';

const WalletService = {
  // Get all deposits
  getAllDeposits: async (params = {}) => {
    try {
      const response = await api.get('/get-all-deposits', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get deposits' };
    }
  },

  // Get deposit by ID
  getDeposit: async (id) => {
    try {
      const response = await api.get(`/get-deposit/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get deposit' };
    }
  },

  // Get deposit sum
  getDepositSum: async (params = {}) => {
    try {
      const response = await api.get('/get-deposit-sum', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get deposit sum' };
    }
  },

  // Add deposit
  addDeposit: async (data) => {
    try {
      const response = await api.post('/add-deposit', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to add deposit' };
    }
  },

  // Get all withdrawals
  getAllWithdrawals: async (params = {}) => {
    try {
      const response = await api.get('/get-all-withdrawals', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get withdrawals' };
    }
  },

  // Get withdrawal by ID
  getWithdrawal: async (id) => {
    try {
      const response = await api.get(`/get-withdrawal/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get withdrawal' };
    }
  },

  // Get withdrawal sum
  getWithdrawalSum: async (params = {}) => {
    try {
      const response = await api.get('/get-withdrawal-sum', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get withdrawal sum' };
    }
  },

  // Add withdrawal
  addWithdrawal: async (data) => {
    try {
      const response = await api.post('/add-withdrawal', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to add withdrawal' };
    }
  },

  // Request withdrawal (admin approval required)
  requestWithdrawal: async (data) => {
    try {
      console.log('Requesting withdrawal with data:', data);
      const response = await api.post('/request-withdrawal', data);
      console.log('Withdrawal response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Withdrawal request error:', error);
      throw error.response?.data || { msg: 'Failed to request withdrawal' };
    }
  },

  // Get all fund transfers
  getAllFundTransfers: async (params = {}) => {
    try {
      const response = await api.get('/get-all-fund-transfers', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get fund transfers' };
    }
  },

  // Get fund transfer by ID
  getFundTransfer: async (id) => {
    try {
      const response = await api.get(`/get-fund-transfer/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get fund transfer' };
    }
  },

  // Get fund transfer sum
  getFundTransferSum: async (params = {}) => {
    try {
      const response = await api.get('/get-fund-transfer-sum', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to get fund transfer sum' };
    }
  },

  // Add fund transfer
  addFundTransfer: async (data) => {
    try {
      const response = await api.post('/add-fund-transfer', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to add fund transfer' };
    }
  },

  // Generate wallet
  generateWallet: async () => {
    try {
      const response = await api.post('/generate-wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to generate wallet' };
    }
  },

  // Save wallet
  saveWallet: async (data) => {
    try {
      const response = await api.post('/save-wallet', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to save wallet' };
    }
  },

  // Start wallet monitoring
  startMonitoring: async (data) => {
    try {
      const response = await api.post('/start-monitoring', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to start monitoring' };
    }
  },

  // Unlock staking (release investment amount)
  unlockStaking: async (data) => {
    try {
      const response = await api.post('/unlock-staking', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to unlock staking' };
    }
  },

  // Release staking to wallet (move investment to wallet balance)
  releaseStakingToWallet: async () => {
    try {
      const response = await api.post('/user/release-staking-to-wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to release staking to wallet' };
    }
  },

  // Release staking to trade wallet (move investment to trade wallet balance)
  releaseStakingToTradeWallet: async () => {
    try {
      const response = await api.post('/user/release-staking-to-trade-wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Failed to release staking to trade wallet' };
    }
  },
};

export default WalletService;
