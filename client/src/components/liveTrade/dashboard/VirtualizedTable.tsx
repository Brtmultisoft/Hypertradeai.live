import React, { useCallback, useState, useEffect } from 'react';
import { Box, Paper, useMediaQuery, useTheme } from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { TradeData } from './types';
import TradeRow from './TradeRow';
import TableHeader from './TableHeader';

interface VirtualizedTableProps {
  trades: TradeData[];
  newRowIds: string[];
  updatedRowIds: string[];
  maxHeight?: number;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = React.memo(({
  trades,
  newRowIds,
  updatedRowIds,
  maxHeight = 400
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Adjust row height based on screen size
  const [rowHeight, setRowHeight] = useState(60);
  const [headerHeight, setHeaderHeight] = useState(56);

  // Update row height based on screen size
  useEffect(() => {
    if (isMobile) {
      setRowHeight(80); // Taller rows on mobile for better readability
      setHeaderHeight(60);
    } else if (isTablet) {
      setRowHeight(70);
      setHeaderHeight(58);
    } else {
      setRowHeight(60);
      setHeaderHeight(56);
    }
  }, [isMobile, isTablet]);

  const renderRow = useCallback(({ index, style }) => {
    const trade = trades[index];

    // Modify the style to ensure full width
    const fullWidthStyle = {
      ...style,
      width: '100%',
      display: 'table',
      tableLayout: 'fixed',
    };

    return (
      <div style={fullWidthStyle}>
        <TradeRow
          trade={trade}
          index={index}
          isNew={newRowIds.includes(trade.id)}
          isUpdated={updatedRowIds.includes(trade.id)}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </div>
    );
  }, [trades, newRowIds, updatedRowIds, isMobile, isTablet]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        height: Math.min(maxHeight, trades.length * rowHeight + headerHeight),
        overflow: 'hidden',
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
        borderRadius: 2,
        maxWidth: '100vw', // Ensure it doesn't overflow the viewport width
      }}
    >
      {/* Table Header */}
      <TableHeader isMobile={isMobile} isTablet={isTablet} />

      {/* Virtualized Table Body */}
      <Box
        sx={{
          height: `calc(100% - ${headerHeight}px)`,
          width: '100%',
          overflowX: 'auto', // Allow horizontal scrolling if needed
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
          }
        }}
      >
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={trades.length}
              itemSize={rowHeight}
              overscanCount={5}
            >
              {renderRow}
            </List>
          )}
        </AutoSizer>
      </Box>
    </Paper>
  );
});

VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;
