import React from 'react';
import { Table, TableHead, TableRow, TableCell, Tooltip } from '@mui/material';

interface TableHeaderProps {
  isMobile?: boolean;
  isTablet?: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = React.memo(({ isMobile = false, isTablet = false }) => {
  // Common cell styles
  const cellBaseStyle = {
    color: '#d1d5db',
    borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
    fontWeight: 600,
    fontSize: isMobile ? '0.75rem' : '0.875rem',
    py: isMobile ? 1.5 : 2,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  // Adjust column widths for different screen sizes
  const getColumnWidth = (defaultWidth: string, mobileWidth: string, tabletWidth: string) => {
    if (isMobile) return mobileWidth;
    if (isTablet) return tabletWidth;
    return defaultWidth;
  };

  return (
    <Table
      sx={{
        minWidth: '100%',
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'separate',
        borderSpacing: '0 4px',
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell
            width={getColumnWidth('20%', '30%', '25%')}
            sx={{
              ...cellBaseStyle,
              width: getColumnWidth('20%', '30%', '25%'),
            }}
          >
            <Tooltip title="Exchange" placement="top" arrow>
              <span>Exchange</span>
            </Tooltip>
          </TableCell>
          <TableCell
            width={getColumnWidth('10%', '20%', '15%')}
            sx={{
              ...cellBaseStyle,
              textAlign: 'center',
              width: getColumnWidth('10%', '20%', '15%'),
              display: { xs: 'table-cell', sm: 'table-cell' },
            }}
          >
            <Tooltip title="Type" placement="top" arrow>
              <span>Type</span>
            </Tooltip>
          </TableCell>
          <TableCell
            width={getColumnWidth('20%', '0%', '15%')}
            sx={{
              ...cellBaseStyle,
              textAlign: 'center',
              width: getColumnWidth('20%', '0%', '15%'),
              display: { xs: 'none', md: 'table-cell' }, // Hide on mobile
            }}
          >
            <Tooltip title="Order ID" placement="top" arrow>
              <span>Order ID</span>
            </Tooltip>
          </TableCell>
          <TableCell
            width={getColumnWidth('15%', '25%', '15%')}
            align="right"
            sx={{
              ...cellBaseStyle,
              width: getColumnWidth('15%', '25%', '15%'),
            }}
          >
            <Tooltip title="Price" placement="top" arrow>
              <span>Price</span>
            </Tooltip>
          </TableCell>
          <TableCell
            width={getColumnWidth('15%', '0%', '15%')}
            align="right"
            sx={{
              ...cellBaseStyle,
              width: getColumnWidth('15%', '0%', '15%'),
              display: { xs: 'none', sm: 'table-cell' }, // Hide on mobile
            }}
          >
            <Tooltip title="Amount" placement="top" arrow>
              <span>Amount</span>
            </Tooltip>
          </TableCell>
          <TableCell
            width={getColumnWidth('20%', '25%', '20%')}
            align="right"
            sx={{
              ...cellBaseStyle,
              width: getColumnWidth('20%', '25%', '20%'),
            }}
          >
            <Tooltip title="Total" placement="top" arrow>
              <span>Total</span>
            </Tooltip>
          </TableCell>
        </TableRow>
      </TableHead>
    </Table>
  );
});

TableHeader.displayName = 'TableHeader';

export default TableHeader;
