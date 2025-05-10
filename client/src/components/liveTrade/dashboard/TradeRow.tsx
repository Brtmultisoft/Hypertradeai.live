import React from 'react';
import { TableRow, TableCell, Box, Chip, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { TradeData } from './types';
import { keyframes } from '@mui/system';

// Define animations with slower, smoother transitions
const slideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  30% {
    opacity: 0.3;
    transform: translateY(-10px);
  }
  70% {
    opacity: 0.7;
    transform: translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const flashHighlight = keyframes`
  0% {
    background-color: rgba(59, 130, 246, 0.1);
  }
  25% {
    background-color: rgba(59, 130, 246, 0.3);
  }
  50% {
    background-color: rgba(59, 130, 246, 0.4);
  }
  75% {
    background-color: rgba(59, 130, 246, 0.2);
  }
  100% {
    background-color: rgba(59, 130, 246, 0);
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  30% {
    opacity: 0.3;
    transform: translateY(7px);
  }
  70% {
    opacity: 0.7;
    transform: translateY(3px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    opacity: 0.7;
    transform: scale(1);
  }
  25% {
    opacity: 0.8;
    transform: scale(1.02);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  75% {
    opacity: 0.9;
    transform: scale(1.02);
  }
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
`;

const numberChange = keyframes`
  0% {
    opacity: 0.3;
    transform: scale(0.95);
  }
  25% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  75% {
    opacity: 1;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

// Styled components
const StyledTableRow = styled(TableRow)({
  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  '& td:first-of-type': {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  '& td:last-of-type': {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
});

const StyledTypography = styled('div')({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
});

interface TradeRowProps {
  trade: TradeData;
  index: number;
  isNew: boolean;
  isUpdated: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

const TradeRow: React.FC<TradeRowProps> = React.memo(({
  trade,
  index,
  isNew,
  isUpdated,
  isMobile = false,
  isTablet = false
}) => {
  return (
    <StyledTableRow
      sx={{
        backgroundColor:
          trade.type === 'buy'
            ? 'rgba(34, 197, 94, 0.05)'
            : 'rgba(239, 68, 68, 0.05)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Slower transition
        '&:hover': {
          backgroundColor: trade.type === 'buy'
            ? 'rgba(34, 197, 94, 0.1)'
            : 'rgba(239, 68, 68, 0.1)',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        animation: isNew
          ? `${slideIn} ${0.6 + index * 0.1}s cubic-bezier(0.4, 0, 0.2, 1)` // Slower animation for new rows
          : isUpdated
            ? `${flashHighlight} 2.5s cubic-bezier(0.4, 0, 0.2, 1)` // Slower highlight flash
            : `${fadeIn} ${0.6 + index * 0.1}s ease-out`, // Slower fade in
        borderRadius: 2,
      }}
    >
      <TableCell
        width={isMobile ? '30%' : isTablet ? '25%' : '20%'}
        sx={{
          border: 0,
          py: isMobile ? 1.5 : 2,
          width: isMobile ? '30%' : isTablet ? '25%' : '20%',
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          sx={{
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Slower transition
            transform: isNew ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <Box
            sx={{
              width: isMobile ? 8 : 10,
              height: isMobile ? 8 : 10,
              borderRadius: '50%',
              backgroundColor: trade.type === 'buy' ? '#22c55e' : '#ef4444',
              mr: isMobile ? 1 : 1.5,
              animation: `${pulse} 3s infinite ease-in-out`, // Slower pulse animation
              boxShadow: trade.type === 'buy'
                ? '0 0 8px rgba(34, 197, 94, 0.5)'
                : '0 0 8px rgba(239, 68, 68, 0.5)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Slower transition
            }}
          />
          <Box>
            <Tooltip title={trade.exchange} placement="top" arrow>
              <StyledTypography
                sx={{
                  color: '#d1d5db',
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? '80px' : '120px',
                }}
              >
                {trade.exchange}
              </StyledTypography>
            </Tooltip>
            <Tooltip title={trade.timestamp} placement="bottom" arrow>
              <StyledTypography
                sx={{
                  color: 'gray',
                  opacity: 0.8,
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? '80px' : '120px',
                }}
              >
                {trade.timestamp}
              </StyledTypography>
            </Tooltip>
          </Box>
        </Box>
      </TableCell>
      <TableCell
        width={isMobile ? '20%' : isTablet ? '15%' : '10%'}
        align="center"
        sx={{
          border: 0,
          py: isMobile ? 1.5 : 2,
          width: isMobile ? '20%' : isTablet ? '15%' : '10%',
          display: { xs: 'table-cell', sm: 'table-cell' },
        }}
      >
        <Chip
          label={trade.type === 'buy' ? 'Buy' : 'Sell'}
          size="small"
          sx={{
            color: 'white',
            fontWeight: 600,
            fontSize: isMobile ? '0.65rem' : '0.75rem',
            height: isMobile ? '22px' : '24px',
            backgroundColor:
              trade.type === 'buy'
                ? 'rgba(34, 197, 94, 0.8)'
                : 'rgba(239, 68, 68, 0.8)',
            border:
              trade.type === 'buy'
                ? '1px solid rgba(34, 197, 94, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: trade.type === 'buy'
              ? '0 0 8px rgba(34, 197, 94, 0.3)'
              : '0 0 8px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Slower transition
            animation: isNew || isUpdated
              ? `${pulse} 2.5s cubic-bezier(0.4, 0, 0.2, 1)` // Slower pulse animation
              : 'none',
            '&:hover': {
              transform: 'scale(1.05)',
            }
          }}
        />
      </TableCell>
      <TableCell
        width={isMobile ? '0%' : isTablet ? '15%' : '20%'}
        align="center"
        sx={{
          border: 0,
          py: 2,
          width: isMobile ? '0%' : isTablet ? '15%' : '20%',
          display: { xs: 'none', md: 'table-cell' }, // Hide on mobile
        }}
      >
        <Tooltip title={trade.orderId} placement="top" arrow>
          <StyledTypography
            sx={{
              color: '#9ca3af',
              padding: '4px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1,
              letterSpacing: '0.5px',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Slower transition
              animation: isNew
                ? `${fadeIn} 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s` // Slower fade in with longer delay
                : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isTablet ? '100px' : '150px',
            }}
          >
            {trade.orderId}
          </StyledTypography>
        </Tooltip>
      </TableCell>
      <TableCell
        width={isMobile ? '25%' : isTablet ? '15%' : '15%'}
        align="right"
        sx={{
          color: trade.type === 'buy' ? '#4ade80' : '#f87171',
          fontWeight: 'bold',
          border: 0,
          py: isMobile ? 1.5 : 2,
          width: isMobile ? '25%' : isTablet ? '15%' : '15%',
        }}
      >
        <Tooltip title={`Price: ₿ ${trade.price}`} placement="top" arrow>
          <StyledTypography
            sx={{
              fontWeight: 700,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              textShadow: trade.type === 'buy'
                ? '0 0 10px rgba(34, 197, 94, 0.3)'
                : '0 0 10px rgba(239, 68, 68, 0.3)',
              animation: isUpdated
                ? `${numberChange} 1.5s cubic-bezier(0.4, 0, 0.2, 1)` // Slower number change animation
                : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ₿ {trade.price}
          </StyledTypography>
        </Tooltip>
      </TableCell>
      <TableCell
        width={isMobile ? '0%' : isTablet ? '15%' : '15%'}
        align="right"
        sx={{
          color: trade.type === 'buy' ? '#4ade80' : '#f87171',
          border: 0,
          py: 2,
          width: isMobile ? '0%' : isTablet ? '15%' : '15%',
          display: { xs: 'none', sm: 'table-cell' }, // Hide on mobile
        }}
      >
        <Tooltip title={`Amount: ₮ ${trade.amount}`} placement="top" arrow>
          <StyledTypography
            sx={{
              fontWeight: 500,
              opacity: 0.9,
              fontSize: isTablet ? '0.75rem' : '0.875rem',
              animation: isUpdated
                ? `${numberChange} 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s` // Slower animation with longer delay
                : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ₮ {trade.amount}
          </StyledTypography>
        </Tooltip>
      </TableCell>
      <TableCell
        width={isMobile ? '25%' : isTablet ? '20%' : '20%'}
        align="right"
        sx={{
          color: trade.type === 'buy' ? '#4ade80' : '#f87171',
          fontWeight: 'bold',
          border: 0,
          py: isMobile ? 1.5 : 2,
          width: isMobile ? '25%' : isTablet ? '20%' : '20%',
        }}
      >
        <Tooltip title={`Total: ₮ ${trade.total}`} placement="top" arrow>
          <StyledTypography
            sx={{
              fontWeight: 700,
              fontSize: isMobile ? '0.75rem' : '0.95rem',
              textShadow: trade.type === 'buy'
                ? '0 0 10px rgba(34, 197, 94, 0.3)'
                : '0 0 10px rgba(239, 68, 68, 0.3)',
              animation: isUpdated
                ? `${numberChange} 1.5s cubic-bezier(0.4, 0, 0.2, 1) 0.6s` // Slower animation with longer delay
                : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            ₮ {trade.total}
          </StyledTypography>
        </Tooltip>
      </TableCell>
    </StyledTableRow>
  );
});

TradeRow.displayName = 'TradeRow';

export default TradeRow;
