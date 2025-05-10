import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Box, Typography, Chip } from '@mui/material';

interface ActiveExchangeCardProps {
  userData: any;
  tradeData: any[];
}

const ActiveExchangeCard: React.FC<ActiveExchangeCardProps> = ({ userData, tradeData }) => {
  const isActive = userData && 
                  userData.total_investment > 0 && 
                  userData.dailyProfitActivated && 
                  tradeData.length > 0;
  
  const activeExchange = isActive ? tradeData[0].exchange : 'Not Active';
  
  const exchanges = ['Binance', 'Coinbase', 'Kraken', 'Bitfinex', 'xtpub'];

  return (
    <Box
      sx={{
        position: 'relative',
        background: 'linear-gradient(to bottom right, #2d2d2d, #1f1f1f)',
        borderRadius: 2,
        padding: 3,
        boxShadow: 3,
        overflow: 'hidden',
      }}
    >
      {/* Background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg")',
          backgroundSize: 'cover',
          opacity: 0.05,
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', marginBottom: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            marginRight: 2,
          }}
        >
          <TrendingUp style={{ width: 24, height: 24, color: '#60A5FA' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Active Exchange: <span style={{ color: '#60A5FA' }}>{activeExchange}</span>
          </Typography>
          <Typography variant="caption" sx={{ color: 'gray' }}>
            {isActive ? `Last updated: ${new Date().toLocaleTimeString()}` : 'Activate daily profit to see live data'}
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body2" sx={{ color: 'gray', marginBottom: 2, position: 'relative', zIndex: 10 }}>
        Our arbitrage trading system automatically selects the best exchange for maximum profit based on market conditions.
        The system continuously monitors price differences across multiple exchanges to execute profitable trades.
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, position: 'relative', zIndex: 10 }}>
        {exchanges.map(exchange => (
          <Chip
            key={exchange}
            label={exchange}
            sx={{
              paddingX: 2,
              paddingY: 0.5,
              fontSize: '0.75rem',
              fontWeight: 'medium',
              borderRadius: '16px',
              color: isActive && tradeData[0].exchange === exchange ? '#34D399' : '#9CA3AF',
              border: isActive && tradeData[0].exchange === exchange ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: isActive && tradeData[0].exchange === exchange ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
            }}
            avatar={
              isActive && tradeData[0].exchange === exchange && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#34D399',
                    marginRight: 1,
                    animation: 'pulse 1s infinite',
                  }}
                />
              )
            }
          />
        ))}
      </Box>
    </Box>
  );
};

export default ActiveExchangeCard;
