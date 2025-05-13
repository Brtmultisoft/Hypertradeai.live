import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Stack, Button, alpha } from '@mui/material';
import { TradingPair } from '../../types/types';
import { generateOrderBook } from '../../utils/dataSimulation';

interface OrderBookProps {
  tradingActive: boolean;
  currentPair: TradingPair;
  currentPrice?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ tradingActive, currentPair, currentPrice = 45000 }) => {
  const [precision, setPrecision] = useState<string>('0.1');
  const [asks, setAsks] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    let orderBookInterval: number;

    if (tradingActive) {
      // Initial data
      const { asks: initialAsks, bids: initialBids } = generateOrderBook(currentPrice);
      setAsks(initialAsks);
      setBids(initialBids);

      // Regular updates
      orderBookInterval = window.setInterval(() => {
        const { asks: newAsks, bids: newBids } = generateOrderBook(currentPrice);
        setAsks(newAsks);
        setBids(newBids);
      }, 5000);
    }

    return () => {
      if (orderBookInterval) clearInterval(orderBookInterval);
    };
  }, [tradingActive, currentPrice]);

  return (
    <Paper
      sx={{
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#12151c',
        borderRadius: 1,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
      }}
    >
      {!tradingActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            backdropFilter: 'blur(3px)'
          }}
        >
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Trading Inactive
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          padding: '12px 15px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
          Order Book
        </Typography>
        <Stack direction="row" spacing={1}>
          {['0.1', '0.01', '0.001'].map((value) => (
            <Button
              key={value}
              variant="text"
              size="small"
              sx={{
                minWidth: 'auto',
                py: 0.5,
                px: 1,
                fontSize: 12,
                background: precision === value ? alpha('#f0b90b', 0.1) : 'rgba(255, 255, 255, 0.03)',
                color: precision === value ? 'primary.main' : 'text.primary',
                '&:hover': {
                  background: precision === value ? alpha('#f0b90b', 0.2) : 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onClick={() => setPrecision(value)}
            >
              {value}
            </Button>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
            }
          }}
        >
          {asks.map((ask, index) => (
            <Box
              key={`ask-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                padding: '5px 16px',
                fontSize: 13,
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.03)'
                },
                color: 'error.main'
              }}
            >
              <Box component="span" sx={{ position: 'relative', zIndex: 2 }}>{parseFloat(ask.price).toFixed(2)}</Box>
              <Box component="span" sx={{ position: 'relative', zIndex: 2 }}>{ask.amount}</Box>
              <Box component="span" sx={{ position: 'relative', zIndex: 2 }}>{ask.total}</Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: `${ask.depth}%`,
                  background: alpha('#f6465d', 0.1),
                  zIndex: 1
                }}
              />
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            padding: '7px 16px',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'text.secondary'
          }}
        >
          <Typography variant="caption" sx={{ fontSize: 13 }}>Spread</Typography>
          <Typography variant="caption" sx={{ fontSize: 13 }}>$12.45 (0.03%)</Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
            }
          }}
        >
          {bids.map((bid, index) => (
            <Box
              key={`bid-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr',
                padding: '5px 16px',
                fontSize: 13,
                position: 'relative',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.03)'
                },
                color: 'secondary.main'
              }}
            >
              <Box component="span" sx={{ position: 'relative', zIndex: 2 }}>{parseFloat(bid.price).toFixed(2)}</Box>
              <Box component="span" sx={{ position: 'relative', zIndex: 2 }}>{bid.amount}</Box>
              <Box component="span" sx={{ position: 'relative', zIndex: 2 }}>{bid.total}</Box>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: `${bid.depth}%`,
                  background: alpha('#0ecb81', 0.1),
                  zIndex: 1
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default OrderBook;