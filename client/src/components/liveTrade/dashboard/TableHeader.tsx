import React from 'react';
import { Table, TableHead, TableRow, TableCell } from '@mui/material';

const TableHeader: React.FC = React.memo(() => {
  // Common cell styles
  const cellBaseStyle = {
    color: '#d1d5db',
    borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
    fontWeight: 600,
    fontSize: '0.875rem',
    py: 2,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
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
            width="20%"
            sx={{
              ...cellBaseStyle,
              width: '20%',
            }}
          >
            Exchange
          </TableCell>
          <TableCell
            width="10%"
            sx={{
              ...cellBaseStyle,
              textAlign: 'center',
              width: '10%',
            }}
          >
            Type
          </TableCell>
          <TableCell
            width="20%"
            sx={{
              ...cellBaseStyle,
              textAlign: 'center',
              width: '20%',
            }}
          >
            Order ID
          </TableCell>
          <TableCell
            width="15%"
            align="right"
            sx={{
              ...cellBaseStyle,
              width: '15%',
            }}
          >
            Price
          </TableCell>
          <TableCell
            width="15%"
            align="right"
            sx={{
              ...cellBaseStyle,
              width: '15%',
            }}
          >
            Amount
          </TableCell>
          <TableCell
            width="20%"
            align="right"
            sx={{
              ...cellBaseStyle,
              width: '20%',
            }}
          >
            Total
          </TableCell>
        </TableRow>
      </TableHead>
    </Table>
  );
});

TableHeader.displayName = 'TableHeader';

export default TableHeader;
