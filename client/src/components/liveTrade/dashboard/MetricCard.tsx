import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'amber' | 'red';
}

const colorStyles = {
  blue: {
    background: 'rgba(240, 185, 11, 0.1)', // Binance Gold with transparency
    border: '1px solid rgba(240, 185, 11, 0.3)', // Binance Gold border
    text: '#F0B90B', // Binance Gold text
  },
  green: {
    background: 'rgba(14, 203, 129, 0.1)', // Binance Green with transparency
    border: '1px solid rgba(14, 203, 129, 0.3)', // Binance Green border
    text: '#0ECB81', // Binance Green text
  },
  amber: {
    background: 'rgba(240, 185, 11, 0.1)', // Binance Gold with transparency
    border: '1px solid rgba(240, 185, 11, 0.3)', // Binance Gold border
    text: '#F0B90B', // Binance Gold text
  },
  red: {
    background: 'rgba(246, 70, 93, 0.1)', // Binance Red with transparency
    border: '1px solid rgba(246, 70, 93, 0.3)', // Binance Red border
    text: '#F6465D', // Binance Red text
  }
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setIsAnimating(false);
      }, 800); // Slower animation duration
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);
  
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colorStyles[color].background,
        border: colorStyles[color].border,
        color: colorStyles[color].text,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Box sx={{ height: 40, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isAnimating ? (
          <>
            <Typography
              sx={{
                position: 'absolute',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                opacity: 0,
                transform: 'translateY(4px)',
                transition: 'all 0.8s ease-out',
              }}
            >
              {prevValue}
            </Typography>
            <Typography
              sx={{
                position: 'absolute',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                animation: 'fadeDown 0.8s',
              }}
            >
              {value}
            </Typography>
          </>
        ) : (
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{value}</Typography>
        )}
      </Box>

      {/* Animated bottom bar */}
      <Divider
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: 2,
          opacity: 0.7,
          animation: 'pulse 1s infinite',
          backgroundColor: colorStyles[color].text,
        }}
      />
    </Box>
  );
};

export default MetricCard;
