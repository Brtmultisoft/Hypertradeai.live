import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import CustomGrid from '../common/CustomGrid';
import OrderBook from './OrderBook';
import MarketData from './MarketData';
import { TradingPair } from '../../types/types';
import { generateRandomTrade } from '../../utils/dataSimulation';


interface TradingLayoutProps {
  currentPair: TradingPair;
  tradingActive: boolean;
  currentPrice: number;
}

const TradingLayout: React.FC<TradingLayoutProps> = ({
  currentPair,
  tradingActive,
  currentPrice: initialPrice
}) => {
  const [lastPrice, setLastPrice] = useState<number>(initialPrice);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
  const [trades, setTrades] = useState<any[]>([]);

  // Update lastPrice when initialPrice changes
  useEffect(() => {
    setLastPrice(initialPrice);
  }, [initialPrice]);

  // Simulate trades when active
  useEffect(() => {
    let tradeInterval: number;

    if (tradingActive) {
      // Initial batch of trades
      Promise.all(Array(20).fill(0).map(() => generateRandomTrade(lastPrice)))
        .then(initialTrades => {
          setTrades(initialTrades);
        });

      // Regular updates
      tradeInterval = window.setInterval(async () => {
        try {
          const newTrade = await generateRandomTrade(lastPrice);

          // Update price direction based on previous price
          const newPrice = parseFloat(newTrade.p);
          setPriceDirection(newPrice > lastPrice ? 'up' : 'down');

          // Add trade to list
          setTrades(prev => [newTrade, ...prev.slice(0, 99)]);
        } catch (error) {
          console.error('Error generating trade:', error);
        }
      }, 150);
    }

    return () => {
      if (tradeInterval) clearInterval(tradeInterval);
    };
  }, [tradingActive, lastPrice]);

  return (
    <Paper
      sx={{
        padding: { xs: 2, sm: 3 },
        borderRadius: 2,
        mb: 2,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        mx: 'auto'
      }}
    >
      <Box
        sx={{
          background: '#12151c',
          padding: { xs: '16px', sm: '20px' },
          borderRadius: 1,
          mb: 3,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 0 }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, m: 0 }}>
            Live Trades
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(255, 255, 255, 0.03)', padding: '6px 12px', borderRadius: 1 }}>
            {/* <Box
              component="img"
              src={`https://cryptologos.cc/logos/${currentPair?.name?.split('/')[0].toLowerCase()}-${currentPair?.name?.split('/')[0].toLowerCase()}-logo.png`}
              alt={currentPair?.name?.split('/')[0]}
              sx={{ width: 20, height: 20 }}
            /> */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {currentPair?.name}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 18,
              fontWeight: 600,
              padding: '8px 15px',
              borderRadius: 1,
              background: 'rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
            }}
            className="price-updated"
          >
            ${lastPrice?.toFixed(2)}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: 12,
              padding: '3px 8px',
              borderRadius: '3px',
              bgcolor: priceDirection === 'up'
                ? 'rgba(14, 203, 129, 0.1)'
                : 'rgba(246, 70, 93, 0.1)',
              color: priceDirection === 'up'
                ? 'secondary.main'
                : 'error.main',
            }}
          >
            {priceDirection === 'up' ? '+' : '-'}2.5%
          </Box>
        </Box>
      </Box>

      <CustomGrid
        container
        spacing={3}
        sx={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: { xs: '0', sm: '0 8px' },
          flexDirection: { xs: 'column-reverse', md: 'row' }, // Reverse order on mobile
          justifyContent: 'center'
        }}
      >
        {/* OrderBook - will appear second on mobile */}
        <CustomGrid item xs={12} md={4} sx={{ mb: { xs: 3, md: 0 } }}>
          <OrderBook tradingActive={tradingActive} currentPair={currentPair} currentPrice={lastPrice} />
        </CustomGrid>
        {/* MarketData - will appear first on mobile */}
        <CustomGrid item xs={12} md={8} sx={{ mb: { xs: 3, md: 0 } }}>
          <MarketData tradingActive={tradingActive} trades={trades} />
        </CustomGrid>
      </CustomGrid>
    </Paper>
  );
};

export default TradingLayout;