import React from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { useTradingData } from '../../hooks/useTradingData';
import MetricsPanel from './dashboard/MetricsPanel';
import ActiveExchangeCard from './dashboard/ActiveExchangeCard';
import ActivationPanel from './dashboard/ActivationPanel';
import TradingTable from './dashboard/TradingTable';

const TradingDashboard: React.FC = () => {
  const {
    userData,
    loading,
    activatingProfit,
    tradeData,
    loadingTrades,
    btcPrice,
    handleActivateDailyProfit,
  } = useTradingData();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" color="white" mb={4}>
        Live Trading
      </Typography>

      {loading ? (
        <Paper
          elevation={3}
          sx={{
            p: 6,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1f2937',
            borderRadius: 3,
          }}
        >
          <CircularProgress size={48} sx={{ color: '#3b82f6' }} />
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ActiveExchangeCard userData={userData} tradeData={tradeData} />

          <Paper
            elevation={3}
            sx={{
              p: 4,
              backgroundColor: '#1f2937',
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                mb: 4,
              }}
            >
              <Box>
                <Typography variant="h6" color="white" fontWeight="bold" gutterBottom>
                  Live Trading Data
                </Typography>
                <Typography variant="body2" color="gray">
                  Activate daily profit for YOUR account by clicking the button below
                </Typography>
              </Box>

              <ActivationPanel
                userData={userData}
                activatingProfit={activatingProfit}
                onActivate={handleActivateDailyProfit}
              />
            </Box>

            <MetricsPanel
              btcPrice={btcPrice}
              totalInvestment={userData?.total_investment || 0}
            />

            <TradingTable
              userData={userData}
              tradeData={tradeData}
              loadingTrades={loadingTrades}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default TradingDashboard;
