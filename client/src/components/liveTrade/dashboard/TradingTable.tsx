import React, { useState, useMemo, useCallback } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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

  // Calculate appropriate max height based on screen size
  const getMaxHeight = useMemo(() => {
    if (isMobile) return 450; // Smaller height on mobile
    if (isTablet) return 500;
    return 600; // Default height for desktop
  }, [isMobile, isTablet]);

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
        px: { xs: 0.5, sm: 1, md: 2 }, // Add responsive padding
        overflow: 'hidden', // Prevent horizontal overflow
      }}
    >
      {/* Filter Buttons */}
      <TableFilters
        selectedType={selectedType}
        onFilterChange={handleFilterChange}
      />

      {/* Use virtualized table for better performance */}
      {filteredTrades.length > 0 ? (
        <VirtualizedTable
          trades={filteredTrades}
          newRowIds={newRowIds}
          updatedRowIds={updatedRowIds}
          maxHeight={getMaxHeight}
        />
      ) : (
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
            textAlign: 'center',
            backgroundColor: 'rgba(31, 41, 55, 0.7)',
            borderRadius: 2,
            border: '1px solid rgba(55, 65, 81, 0.5)',
          }}
        >
          <Box
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' }, // Responsive font size
              color: '#6b7280',
              mb: { xs: 1, sm: 1.5, md: 2 }, // Responsive margin
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
