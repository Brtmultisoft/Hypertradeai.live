import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';
import { TradeFilterType } from './types';

interface TableFiltersProps {
  selectedType: TradeFilterType;
  onFilterChange: (type: TradeFilterType) => void;
}

const TableFilters: React.FC<TableFiltersProps> = React.memo(({ selectedType, onFilterChange }) => {
  return (
    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <ButtonGroup variant="outlined" size="small" aria-label="filter trades">
        <Button
          onClick={() => onFilterChange('all')}
          sx={{
            color: selectedType === 'all' ? 'white' : 'gray',
            borderColor: 'rgba(55, 65, 81, 0.5)',
            backgroundColor: selectedType === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderColor: 'rgba(59, 130, 246, 0.5)',
            },
          }}
        >
          All
        </Button>
        <Button
          onClick={() => onFilterChange('buy')}
          sx={{
            color: selectedType === 'buy' ? '#4ade80' : 'gray',
            borderColor: 'rgba(55, 65, 81, 0.5)',
            backgroundColor: selectedType === 'buy' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(34, 197, 94, 0.05)',
              borderColor: 'rgba(34, 197, 94, 0.3)',
            },
          }}
        >
          Buy
        </Button>
        <Button
          onClick={() => onFilterChange('sell')}
          sx={{
            color: selectedType === 'sell' ? '#f87171' : 'gray',
            borderColor: 'rgba(55, 65, 81, 0.5)',
            backgroundColor: selectedType === 'sell' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            },
          }}
        >
          Sell
        </Button>
      </ButtonGroup>
    </Box>
  );
});

TableFilters.displayName = 'TableFilters';

export default TableFilters;
