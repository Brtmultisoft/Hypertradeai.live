import React from 'react';
import { Paper, Box, Button } from '@mui/material';
import { TradingPair } from '../../types/types';
import { tradingPairs } from '../../data/tradingPairs';

interface PairSelectorProps {
  currentPair: TradingPair;
  setCurrentPair: (pair: TradingPair) => void;
  tradingActive: boolean;
}

const PairSelector: React.FC<PairSelectorProps> = ({
  currentPair,
  setCurrentPair,
  tradingActive
}) => {
  return (
    <Paper
      sx={{
        display: 'flex',
        gap: 0,
        background: '#12151c',
        borderRadius: 1,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        flexWrap: { xs: 'wrap', md: 'nowrap' }
      }}
    >
      {tradingPairs.map((pair) => (
        <Button
          key={pair.symbol}
          sx={{
            padding: '10px 15px',
            border: 'none',
            background: 'transparent',
            color: pair.symbol === currentPair.symbol ? 'primary.main' : 'text.secondary',
            fontWeight: 500,
            fontSize: 13,
            transition: 'all 0.2s ease',
            position: 'relative',
            flex: { xs: '1 1 auto', sm: 1 },
            minWidth: { xs: '80px', sm: 'auto' },
            '&:hover': {
              color: 'text.primary',
              background: 'rgba(255, 255, 255, 0.02)'
            },
            ...(pair.symbol === currentPair.symbol ? {
              color: 'primary.main',
              background: 'rgba(240, 185, 11, 0.1)',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'primary.main'
              }
            } : {}),
            opacity: tradingActive ? 1 : 0.5,
            pointerEvents: tradingActive ? 'auto' : 'none'
          }}
          onClick={() => tradingActive && setCurrentPair(pair)}
          disableRipple
        >
          {pair.name}
        </Button>
      ))}
    </Paper>
  );
};

export default PairSelector;