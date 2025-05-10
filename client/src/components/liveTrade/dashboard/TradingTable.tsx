import React, { useState, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { UserData, TradeData, TradeFilterType } from './types';
import useAnimationState from './useAnimationState';
import TableFilters from './TableFilters';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import VirtualizedTable from './VirtualizedTable';

interface TradingTableProps {
  userData: UserData | null;
  tradeData: TradeData[];
  loadingTrades: boolean;
}

// Define animations for the container
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const TradingTable: React.FC<TradingTableProps> = ({
  userData,
  tradeData,
  loadingTrades,
}) => {
  const [selectedType, setSelectedType] = useState<TradeFilterType>('all');

  const isEnabled = useMemo(() => (
    userData !== null &&
    userData.total_investment > 0 &&
    userData.dailyProfitActivated
  ), [userData]);

  const filteredTrades = useMemo(() => (
    tradeData.filter((trade) =>
      selectedType === 'all' ? true : trade.type === selectedType
    )
  ), [tradeData, selectedType]);

  const { newRowIds, updatedRowIds } = useAnimationState(tradeData, !!isEnabled);

  const handleFilterChange = useCallback((type: TradeFilterType) => {
    setSelectedType(type);
  }, []);

  if (!isEnabled) {
    return <EmptyState userData={userData} />;
  }

  if (loadingTrades) {
    return <LoadingState showSkeleton={true} />;
  }

  return (
    <Box
      sx={{
        width: '100%',
        animation: `${fadeIn} 1s ease-out`,
      }}
    >
      {/* Filter Buttons */}
      <TableFilters
        selectedType={selectedType}
        onFilterChange={handleFilterChange}
      />

      {/* Trade Stats */}
      {/* <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 4,
          animation: `${fadeIn} 0.8s ease-out`,
        }}
      >
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
          <Paper
            sx={{
              p: 2.5,
              backgroundColor: 'rgba(31, 41, 55, 0.7)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
                animation: `${shimmer} 3s infinite linear`,
                backgroundSize: '200% 100%',
              }
            }}
          >
            <Typography color="gray" variant="body2" mb={0.5} fontWeight={500}>
              Total Trades
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="white" sx={{ display: 'flex', alignItems: 'center' }}>
              {tradeData.length}
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  ml: 1.5,
                  animation: `${pulse} 2s infinite ease-in-out`
                }}
              />
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
          <Paper
            sx={{
              p: 2.5,
              backgroundColor: 'rgba(5, 46, 22, 0.7)',
              border: '1px solid rgba(22, 101, 52, 0.5)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                backgroundColor: 'rgba(5, 46, 22, 0.8)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
                animation: `${shimmer} 3s infinite linear`,
                backgroundSize: '200% 100%',
              }
            }}
          >
            <Typography color="gray" variant="body2" mb={0.5} fontWeight={500}>
              Buy Orders
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#4ade80" sx={{ display: 'flex', alignItems: 'center' }}>
              {tradeData.filter((t) => t.type === 'buy').length}
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  ml: 1.5,
                  animation: `${pulse} 2s infinite ease-in-out`
                }}
              />
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
          <Paper
            sx={{
              p: 2.5,
              backgroundColor: 'rgba(69, 10, 10, 0.7)',
              border: '1px solid rgba(153, 27, 27, 0.5)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                backgroundColor: 'rgba(69, 10, 10, 0.8)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
                animation: `${shimmer} 3s infinite linear`,
                backgroundSize: '200% 100%',
              }
            }}
          >
            <Typography color="gray" variant="body2" mb={0.5} fontWeight={500}>
              Sell Orders
            </Typography>
            <Typography variant="h5" fontWeight="bold" color="#f87171" sx={{ display: 'flex', alignItems: 'center' }}>
              {tradeData.filter((t) => t.type === 'sell').length}
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  ml: 1.5,
                  animation: `${pulse} 2s infinite ease-in-out`
                }}
              />
            </Typography>
          </Paper>
        </Box>
      </Box> */}

      {/* Use virtualized table for better performance */}
      {filteredTrades.length > 0 ? (
        <VirtualizedTable
          trades={filteredTrades}
          newRowIds={newRowIds}
          updatedRowIds={updatedRowIds}
          maxHeight={600}
        />
      ) : (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(31, 41, 55, 0.7)',
            borderRadius: 2,
            border: '1px solid rgba(55, 65, 81, 0.5)',
          }}
        >
          <Box
            sx={{
              fontSize: '1.5rem',
              color: '#6b7280',
              mb: 2,
            }}
          >
            No {selectedType === 'all' ? '' : selectedType} trades found
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TradingTable;
