import React from 'react';
import { Container, Box, Card, CardContent, Typography, Divider } from '@mui/material';
import MarketSelector from './MarketSelector';
import PriceCard from './PriceCard';
import StatsCard from './StatsCard';
import PriceChart from './PriceChart';
import OrderBook from './OrderBook';
import ActivationPanel from './ActivationPanel';
import TradingPanel from './TradingPanel';
import { useTradingContext } from '../../context/TradingContext';
import { useTradingData } from '../../hooks/useTradingData';

const Dashboard: React.FC = () => {
  // Use the trading context for instrument selection and auto-rotation
  const { selectedInstrument, setSelectedInstrument, instruments, autoRotate, setAutoRotate } = useTradingContext();

  // Use the trading data hook for activation and user data
  const {
    userData,
    activatingProfit,
    handleActivateDailyProfit,
    btcPrice,
    tradeData,
    loading: dataLoading
  } = useTradingData();

  // Define keyframes for the pulse animation
  const pulseKeyframes = {
    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)'
      },
      '70%': {
        boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)'
      },
      '100%': {
        boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)'
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          {/* <MarketSelector /> */}
        </Box>

        {/* Activation Status - Show when activated */}
        {userData?.dailyProfitActivated && (
          <Card sx={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.5)',
            borderWidth: 1,
            borderStyle: 'solid'
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#22c55e', fontWeight: 'bold' }}>
                  Daily Profit Activated
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Your daily profit is active. You can now trade and earn 0.266% on your investment today.
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  Activated: {userData?.lastDailyProfitActivation
                    ? new Date(userData.lastDailyProfitActivation).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </Typography>
              </Box>
              <Box sx={{
                backgroundColor: '#22c55e',
                color: 'white',
                borderRadius: '50%',
                width: 12,
                height: 12,
                boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.2)',
                animation: 'pulse 2s infinite',
                ...pulseKeyframes
              }} />
            </CardContent>
          </Card>
        )}
<Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Exciting new features are on the way!
        </Typography>
      </Box>
       
      </Box>
    </Container>
  );
};

export default Dashboard;