import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Box, Typography, useMediaQuery, useTheme, Divider } from '@mui/material';
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
  // Get theme and responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [lastPrice, setLastPrice] = useState<number>(initialPrice);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
  const [trades, setTrades] = useState<any[]>([]);

  // Update lastPrice when initialPrice changes
  useEffect(() => {
    setLastPrice(initialPrice);
  }, [initialPrice]);

  // Generate random percentage for display
  const randomPercentage = useCallback(() => {
    return (Math.random() * 3).toFixed(2);
  }, []);

  const [percentChange] = useState<string>(randomPercentage());

  // Simulate trades when active
  useEffect(() => {
    let tradeInterval: number;

    if (tradingActive) {
      // Initial batch of trades - adjust count based on screen size
      const initialTradeCount = isMobile ? 10 : isTablet ? 15 : 20;

      Promise.all(Array(initialTradeCount).fill(0).map(() => generateRandomTrade(lastPrice)))
        .then(initialTrades => {
          setTrades(initialTrades);
        });

      // Regular updates - adjust interval based on screen capabilities
      const updateInterval = isMobile ? 300 : 150; // Slower updates on mobile for better performance

      tradeInterval = window.setInterval(async () => {
        try {
          const newTrade = await generateRandomTrade(lastPrice);

          // Update price direction based on previous price
          const newPrice = parseFloat(newTrade.p);
          setPriceDirection(newPrice > lastPrice ? 'up' : 'down');

          // Add trade to list - keep fewer items in the list on mobile
          const keepCount = isMobile ? 50 : 99;
          setTrades(prev => [newTrade, ...prev.slice(0, keepCount)]);
        } catch (error) {
          console.error('Error generating trade:', error);
        }
      }, updateInterval);
    }

    return () => {
      if (tradeInterval) clearInterval(tradeInterval);
    };
  }, [tradingActive, lastPrice, isMobile, isTablet]);

  return (
    <Paper
      sx={{
        padding: { xs: 1, sm: 2, md: 3 },
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 1, sm: 2 },
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        mx: 'auto',
        overflow: 'hidden', // Prevent content overflow on small screens
        boxShadow: {
          xs: '0 2px 10px rgba(0, 0, 0, 0.15)',
          sm: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }
      }}
    >
      {/* Header Section - Fully Responsive */}
      <Box
        sx={{
          background: '#12151c',
          padding: { xs: '12px', sm: '16px', md: '20px' },
          borderRadius: { xs: 0.5, sm: 1 },
          mb: { xs: 1.5, sm: 2, md: 3 },
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 0 },
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}
      >
        {/* Left Side - Title and Trading Pair */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              m: 0,
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
            }}
          >
            Live Trades
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: { xs: '4px 10px', sm: '6px 12px' },
              borderRadius: 1,
              mt: { xs: 0.5, sm: 0 },
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {currentPair?.name}
            </Typography>
          </Box>
        </Box>

        {/* Mobile Divider */}
        {isMobile && (
          <Divider
            sx={{
              width: '100%',
              my: 1,
              borderColor: 'rgba(255, 255, 255, 0.05)'
            }}
          />
        )}

        {/* Right Side - Price and Direction */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'center', sm: 'flex-end' }
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: { xs: 16, sm: 18, md: 20 },
              fontWeight: 600,
              padding: { xs: '6px 12px', sm: '8px 15px' },
              borderRadius: 1,
              background: 'rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minWidth: { xs: '100px', sm: 'auto' }
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
              fontSize: { xs: 11, sm: 12 },
              padding: { xs: '2px 6px', sm: '3px 8px' },
              borderRadius: '3px',
              bgcolor: priceDirection === 'up'
                ? 'rgba(14, 203, 129, 0.1)'
                : 'rgba(246, 70, 93, 0.1)',
              color: priceDirection === 'up'
                ? 'secondary.main'
                : 'error.main',
              whiteSpace: 'nowrap'
            }}
          >
            {priceDirection === 'up' ? '+' : '-'}{percentChange}%
          </Box>
        </Box>
      </Box>

      {/* Main Content Grid - Responsive Layout */}
      <CustomGrid
        container
        spacing={{ xs: 1, sm: 2, md: 3 }}
        sx={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: { xs: '0', sm: '0 4px', md: '0 8px' },
          flexDirection: { xs: 'column-reverse', md: 'row' }, // Reverse order on mobile
          justifyContent: 'center'
        }}
      >
        {/* OrderBook - will appear second on mobile */}
        <CustomGrid
          item
          xs={12}
          md={4}
          lg={5}
          sx={{
            mb: { xs: 1.5, sm: 2, md: 0 },
            height: { xs: 'auto', md: '500px' } // Fixed height on desktop, auto on mobile
          }}
        >
          <OrderBook
            tradingActive={tradingActive}
            currentPair={currentPair}
            currentPrice={lastPrice}
          />
        </CustomGrid>

        {/* MarketData - will appear first on mobile */}
        <CustomGrid
          item
          xs={12}
          md={8}
          lg={7}
          sx={{
            mb: { xs: 1.5, sm: 2, md: 0 },
            height: { xs: 'auto', md: '500px' } // Fixed height on desktop, auto on mobile
          }}
        >
          <MarketData
            tradingActive={tradingActive}
            trades={trades}
          />
        </CustomGrid>
      </CustomGrid>
    </Paper>
  );
};

export default TradingLayout;