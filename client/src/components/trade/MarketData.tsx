import React from 'react';
import { Paper, Box, Typography, alpha, useMediaQuery, useTheme } from '@mui/material';

import { Trade } from '../../types/types';

interface MarketDataProps {
  tradingActive: boolean;
  trades: Trade[];
}

const MarketData: React.FC<MarketDataProps> = ({ tradingActive, trades }) => {
  // Get theme and responsive breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Paper
      sx={{
        height: { xs: 'auto', sm: 450, md: 500 }, // Responsive height
        overflow: 'hidden',
        position: 'relative',
        background: '#12151c',
        borderRadius: { xs: 0.5, sm: 1 },
        border: '1px solid rgba(255, 255, 255, 0.05)',
        minHeight: { xs: 350, sm: 400, md: 500 }, // Ensure minimum height on all devices
      }}
    >
      {!tradingActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            backdropFilter: 'blur(3px)'
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Trading Inactive
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          overflowY: 'auto',
          height: '100%',
          maxHeight: { xs: 'calc(100vh - 300px)', sm: '450px', md: '500px' }, // Responsive max height
          '&::-webkit-scrollbar': {
            width: { xs: '4px', sm: '6px', md: '8px' },
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 0, 0, 0.2)',
            borderRadius: { xs: '2px', sm: '4px' },
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 0, 0, 0.4)',
          }
        }}
      >
        {/* Table Header - Responsive Column Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '0.6fr 1fr 1fr',
              sm: '0.6fr 0.8fr 1fr 1fr 0.8fr',
              md: '0.6fr 0.8fr 1fr 1fr 0.8fr 0.8fr'
            },
            gap: { xs: '8px', sm: '12px', md: '15px' },
            padding: { xs: '8px 12px', sm: '10px 16px' },
            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            background: '#0d1017',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            fontWeight: 500,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontSize: { xs: 10, sm: 11 },
            letterSpacing: { xs: 0.3, sm: 0.5 }
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: { xs: 10, sm: 11, md: 12 }
            }}
          >
            Type
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: { xs: 10, sm: 11, md: 12 },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Exchange
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: { xs: 10, sm: 11, md: 12 }
            }}
          >
            Price
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: { xs: 10, sm: 11, md: 12 }
            }}
          >
            Amount
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: { xs: 10, sm: 11, md: 12 },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Time
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              fontSize: { xs: 10, sm: 11, md: 12 },
              display: { xs: 'none', md: 'block' }
            }}
          >
            Total
          </Typography>
        </Box>

        {tradingActive ? (
          trades.map((trade, index) => {
            const date = new Date(trade.T);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

            // Simplified time format for mobile
            const timeString = isMobile
              ? `${hours}:${minutes}:${seconds}`
              : `${hours}:${minutes}:${seconds}.${milliseconds}`;

            return (
              <Box
                key={`trade-${index}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '0.6fr 1fr 1fr',
                    sm: '0.6fr 0.8fr 1fr 1fr 0.8fr',
                    md: '0.6fr 0.8fr 1fr 1fr 0.8fr 0.8fr'
                  },
                  gap: { xs: '8px', sm: '12px', md: '15px' },
                  padding: { xs: '8px 12px', sm: '10px 16px' },
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s',
                  fontSize: { xs: 11, sm: 12, md: 13 },
                  lineHeight: 1.5,
                  position: 'relative',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.03)'
                  },
                  height: { xs: '32px', sm: 'auto' }, // Fixed height on mobile for better touch
                  alignItems: 'center'
                }}
              >
                {/* Trade Type (BUY/SELL) */}
                <Typography
                  variant="body2"
                  sx={{
                    color: trade.m ? alpha('#0ecb81', 0.9) : alpha('#f6465d', 0.9),
                    fontWeight: { xs: 600, sm: 500 },
                    fontSize: { xs: 10, sm: 12, md: 13 },
                    whiteSpace: 'nowrap'
                  }}
                >
                  {trade.m ? 'BUY' : 'SELL'}
                </Typography>

                {/* Exchange - Hidden on mobile */}
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: 10, sm: 12, md: 13 },
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: { sm: '80px', md: '100px' }
                    }}
                  >
                    {trade.e?.name || 'Exchange'}
                  </Typography>
                </Box>

                {/* Price */}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: { xs: 600, sm: 500 },
                    color: trade.m ? alpha('#0ecb81', 0.9) : alpha('#f6465d', 0.9),
                    fontSize: { xs: 10, sm: 12, md: 13 }
                  }}
                >
                  {trade.p}
                </Typography>

                {/* Amount */}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: { xs: 10, sm: 12, md: 13 },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {trade.q}
                </Typography>

                {/* Time - Hidden on mobile */}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Monaco', monospace",
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: { xs: '2px 4px', sm: '4px 8px' },
                    borderRadius: { xs: '2px', sm: '4px' },
                    display: { xs: 'none', sm: 'block' },
                    fontSize: { xs: 9, sm: 11, md: 12 },
                    whiteSpace: 'nowrap'
                  }}
                >
                  {timeString}
                </Typography>

                {/* Total - Only visible on md and larger screens */}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    color: 'rgba(255, 255, 255, 0.8)',
                    display: { xs: 'none', md: 'block' },
                    fontSize: { md: 12, lg: 13 },
                    whiteSpace: 'nowrap'
                  }}
                >
                  ${(parseFloat(trade.p) * parseFloat(trade.q)).toFixed(2)}
                </Typography>
              </Box>
            );
          })
        ) : (
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              textAlign: 'center',
              height: { xs: '200px', sm: '300px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Market data will appear here when trading is active
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MarketData;