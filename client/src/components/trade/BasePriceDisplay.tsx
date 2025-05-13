import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface BasePriceDisplayProps {
  basePrice: number | null;
  loading: boolean;
}

const BasePriceDisplay: React.FC<BasePriceDisplayProps> = ({ basePrice, loading }) => {
  return (
    <Paper
      sx={{
        background: '#12151c',
        borderRadius: '16px',
        padding: '10px 15px',
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          BTC/USDT Base Price:
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 600,
            color: 'primary.main',
          }}
        >
          {loading ? 'Loading...' : basePrice ? `$${basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default BasePriceDisplay;
