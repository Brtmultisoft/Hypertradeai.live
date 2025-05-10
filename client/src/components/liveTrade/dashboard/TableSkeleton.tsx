import React from 'react';
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { keyframes } from '@mui/system';

// Shimmer animation for the skeleton
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

interface TableSkeletonProps {
  rowCount?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = React.memo(({ rowCount = 5 }) => {
  return (
    <Box
      sx={{
        width: '100%',
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      {/* Filter Buttons Skeleton */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 3,
          gap: 1,
        }}
      >
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={100}
            height={36}
            sx={{
              borderRadius: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                animation: `${shimmer} 2s infinite linear`,
                backgroundSize: '200% 100%',
              },
            }}
          />
        ))}
      </Box>

      {/* Table Skeleton */}
      <Paper
        sx={{
          backgroundColor: 'rgba(31, 41, 55, 0.7)',
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Table
          sx={{
            width: '100%',
            minWidth: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: '0 4px',
          }}
        >
          <TableHead>
            <TableRow>
              {[
                { name: 'Exchange', width: '20%', align: 'left' },
                { name: 'Type', width: '10%', align: 'center' },
                { name: 'Order ID', width: '20%', align: 'center' },
                { name: 'Price', width: '15%', align: 'right' },
                { name: 'Amount', width: '15%', align: 'right' },
                { name: 'Total', width: '20%', align: 'right' }
              ].map((header) => (
                <TableCell
                  key={header.name}
                  width={header.width}
                  align={header.align as any}
                  sx={{
                    color: '#d1d5db',
                    borderBottom: '1px solid rgba(55, 65, 81, 0.5)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 2,
                    backgroundColor: 'rgba(31, 41, 55, 0.5)',
                    width: header.width,
                  }}
                >
                  {header.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(new Array(rowCount)).map((_, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: 'rgba(31, 41, 55, 0.3)',
                  transition: 'all 0.3s ease',
                  animation: `fadeIn ${0.3 + index * 0.05}s ease-out`,
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                  '& td:first-of-type': {
                    borderTopLeftRadius: 8,
                    borderBottomLeftRadius: 8,
                  },
                  '& td:last-of-type': {
                    borderTopRightRadius: 8,
                    borderBottomRightRadius: 8,
                  },
                }}
              >
                {/* Exchange */}
                <TableCell width="20%" sx={{ border: 0, py: 2, width: '20%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Skeleton
                      variant="circular"
                      width={10}
                      height={10}
                      sx={{
                        mr: 1.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    />
                    <Box>
                      <Skeleton
                        variant="text"
                        width={80}
                        height={20}
                        sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        width={60}
                        height={14}
                        sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      />
                    </Box>
                  </Box>
                </TableCell>

                {/* Type */}
                <TableCell width="10%" align="center" sx={{ border: 0, py: 2, width: '10%' }}>
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={24}
                    sx={{
                      borderRadius: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      mx: 'auto',
                    }}
                  />
                </TableCell>

                {/* Order ID */}
                <TableCell width="20%" align="center" sx={{ border: 0, py: 2, width: '20%' }}>
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={20}
                    sx={{
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      mx: 'auto',
                    }}
                  />
                </TableCell>

                {/* Price */}
                <TableCell width="15%" align="right" sx={{ border: 0, py: 2, width: '15%' }}>
                  <Skeleton
                    variant="text"
                    width={80}
                    height={24}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', ml: 'auto' }}
                  />
                </TableCell>

                {/* Amount */}
                <TableCell width="15%" align="right" sx={{ border: 0, py: 2, width: '15%' }}>
                  <Skeleton
                    variant="text"
                    width={70}
                    height={24}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', ml: 'auto' }}
                  />
                </TableCell>

                {/* Total */}
                <TableCell width="20%" align="right" sx={{ border: 0, py: 2, width: '20%' }}>
                  <Skeleton
                    variant="text"
                    width={90}
                    height={24}
                    sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', ml: 'auto' }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
});

TableSkeleton.displayName = 'TableSkeleton';

export default TableSkeleton;
