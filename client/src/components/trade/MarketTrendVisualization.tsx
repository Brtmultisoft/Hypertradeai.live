import React from 'react';
import { Paper, Box, Typography, Stack, Chip } from '@mui/material';
import { ArrowUp } from 'lucide-react';
import { TradingPair } from '../../types/types';

interface MarketTrendVisualizationProps {
  tradingActive: boolean;
  totalProfit: number;
  currentPair: TradingPair;
}

const MarketTrendVisualization: React.FC<MarketTrendVisualizationProps> = ({
  tradingActive,
  totalProfit,
  currentPair
}) => {
  return (
    <Paper
      sx={{
        height: '47px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        border: 'none',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        background: 'linear-gradient(rgba(255, 0, 0, 0.05), rgba(255, 0, 0, 0.1)), radial-gradient(circle at 30% 30%, rgba(255, 0, 0, 0.2), transparent 70%), radial-gradient(circle at 70% 70%, rgba(255, 0, 0, 0.2), transparent 70%)',
        opacity: tradingActive ? 0.8 : 0.3,
        transition: 'opacity 0.3s ease',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 100,
          }}
        >
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Trading Inactive
          </Typography>
        </Box>
      )}

      <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 2, zIndex: 5 }}>
        <Chip
          icon={<Box component="span" sx={{ width: 16, height: 16, bgcolor: '#f0b90b', borderRadius: '50%', mr: 1 }} />}
          label={currentPair.name}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        />

        <Chip
          label="+12.45%"
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#0ecb81',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        />

        <Chip
          label="LIVE"
          sx={{
            backgroundColor: 'rgba(246, 70, 93, 0.7)',
            color: '#fff',
            fontWeight: 500,
            fontSize: '0.875rem',
            animation: tradingActive ? 'pulse 1.5s infinite' : 'none',
          }}
        />
      </Box>

      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 5 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 700,
            color: '#0ecb81',
            textShadow: '0 0 10px rgba(14, 203, 129, 0.5)',
            animation: tradingActive ? 'pulse 2s infinite' : 'none',
          }}
        >
          {totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)} USDT
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          width: 40,
          height: 40,
          opacity: 0.8,
          zIndex: 4,
          animation: 'arrowPulse 2s infinite',
        }}
      >
        <ArrowUp size={40} color="white" opacity={0.8} />
      </Box>
    </Paper>
  );
};

export default MarketTrendVisualization;