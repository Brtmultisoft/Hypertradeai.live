import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import './animations.css';

interface FloatingProfit {
  id: number;
  isProfit: boolean;
  amount: number;
  left: string;
  bottom: string;
}

const FloatingProfits: React.FC = () => {
  const [profits, setProfits] = useState<FloatingProfit[]>([]);

  useEffect(() => {
    // Generate a new profit every 2-3 seconds for a slower, more readable effect
    const profitInterval = window.setInterval(() => {
      // Create a new floating profit
      const isProfit = Math.random() > 0.003;
      const amount = isProfit ?
        (Math.random() * 0.005).toFixed(4) :
        (-Math.random() * 0.003).toFixed(4);

      // Position the profit at the bottom of the screen with random horizontal position
      const newProfit: FloatingProfit = {
        id: Date.now(),
        isProfit,
        amount: parseFloat(amount),
        left: `${Math.random() * 80 + 10}%`,
        bottom: '0px'
      };

      setProfits(prev => [...prev, newProfit]);

      // Remove after animation completes (6 seconds)
      setTimeout(() => {
        setProfits(prev => prev.filter(p => p.id !== newProfit.id));
      }, 6000);
    }, 2000 + Math.random() * 1000); // Random interval between 2-3 seconds

    return () => clearInterval(profitInterval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden'
      }}
    >
      {profits.map((profit) => (
        <Typography
          key={profit.id}
          sx={{
            position: 'absolute',
            fontFamily: "'Roboto Mono', monospace",
            fontSize: '16px',
            fontWeight: 600,
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 15px',
            borderRadius: '30px',
            animation: 'floatUp 6s forwards cubic-bezier(0.25, 0.1, 0.25, 1)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transform: 'scale(0.8)',
            color: profit.isProfit ? '#0ecb81' : '#f6465d',
            boxShadow: profit.isProfit
              ? '0 0 15px rgba(14, 203, 129, 0.6)'
              : '0 0 15px rgba(246, 70, 93, 0.6)',
            textShadow: profit.isProfit
              ? '0 0 10px rgba(14, 203, 129, 0.8)'
              : '0 0 10px rgba(246, 70, 93, 0.8)',
            left: profit.left,
            bottom: profit.bottom,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '30px',
              zIndex: -1,
              opacity: 0.3,
              animation: 'pulseBorder 2s infinite',
              border: profit.isProfit
                ? '1px solid rgba(14, 203, 129, 0.8)'
                : '1px solid rgba(246, 70, 93, 0.8)'
            }
          }}
          className="floating-profit"
        >
          {profit.isProfit ? '↑' : '↓'} {profit.amount > 0 ? '+' : ''}{profit.amount} USDT
        </Typography>
      ))}
    </Box>
  );
};

export default FloatingProfits;