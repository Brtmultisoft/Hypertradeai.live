import React, { useCallback } from 'react';
import { Box, Paper } from '@mui/material';
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
        />
      </div>
    );
  }, [trades, newRowIds, updatedRowIds]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        height: Math.min(maxHeight, trades.length * 60 + 56), // 56px for header, 60px per row
        overflow: 'hidden',
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
        borderRadius: 2,
      }}
    >
      {/* Table Header */}
      <TableHeader />

      {/* Virtualized Table Body */}
      <Box
        sx={{
          height: 'calc(100% - 56px)',
          width: '100%',
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
              itemSize={60} // Height of each row
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
