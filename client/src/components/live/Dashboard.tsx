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
                  Your daily profit is active. You can now trade and earn 2.5% on your investment today.
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
{/* Coming Soon Features Card */}
<Card sx={{
  borderRadius: 3,
  backgroundColor: 'rgba(51, 117, 187, 0.05)',
  border: '1px solid rgba(51, 117, 187, 0.1)',
  overflow: 'hidden',
  position: 'relative',
  mb: 3,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  }
}}>
  {/* Background gradient effect */}
  <Box sx={{
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    background: 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.1), transparent 70%)',
    zIndex: 0,
  }} />

  <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{
        width: 48,
        height: 48,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        backgroundColor: 'rgba(51, 117, 187, 0.1)',
        marginRight: 2,
        animation: 'pulse 2s infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' }
        }
      }}>
        <Box component="span" sx={{
          fontSize: '1.5rem',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          🚀
        </Box>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Exciting new features are on the way!
        </Typography>
      </Box>
    </Box>

    {/* <Box sx={{ pl: 7 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        We're working on advanced trading features to enhance your experience:
      </Typography>

      <Box component="ul" sx={{ pl: 2, mb: 2 }}>
        <Box component="li" sx={{ mb: 1 }}>
          <Typography variant="body2">
            <strong>Advanced Analytics</strong> - Detailed market insights and performance metrics
          </Typography>
        </Box>
        <Box component="li" sx={{ mb: 1 }}>
          <Typography variant="body2">
            <strong>Portfolio Management</strong> - Track and optimize your investments
          </Typography>
        </Box>
        <Box component="li">
          <Typography variant="body2">
            <strong>AI-Powered Trading</strong> - Smart algorithms to maximize your profits
          </Typography>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary">
        Stay tuned for updates! These features will be available in the next release.
      </Typography>
    </Box> */}
  </CardContent>
</Card>

      </Box>
    </Container>
  );
};

export default Dashboard;