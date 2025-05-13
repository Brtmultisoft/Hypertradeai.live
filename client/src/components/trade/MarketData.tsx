import React from 'react';
import { Paper, Box, Typography, alpha } from '@mui/material';

import { Trade } from '../../types/types';

interface MarketDataProps {
  tradingActive: boolean;
  trades: Trade[];
}

const MarketData: React.FC<MarketDataProps> = ({ tradingActive, trades }) => {
  return (
    <Paper
      sx={{
        height: 500,
        overflow: 'hidden',
        position: 'relative',
        background: '#12151c',
        borderRadius: 1,
        border: '1px solid rgba(255, 255, 255, 0.05)',
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
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Trading Inactive
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          overflowY: 'auto',
          height: '100%',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 0, 0, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 0, 0, 0.4)',
          }
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '0.6fr 1fr 1fr', sm: '0.6fr 0.8fr 1fr 1fr 0.8fr', md: '0.6fr 0.8fr 1fr 1fr 0.8fr 0.8fr' },
            gap: '15px',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
            background: '#0d1017',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            fontWeight: 500,
            color: 'text.secondary',
            textTransform: 'uppercase',
            fontSize: 11,
            letterSpacing: 0.5
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12 }}>Type</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12, display: { xs: 'none', sm: 'block' } }}>Exchange</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12 }}>Price</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12 }}>Amount</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12, display: { xs: 'none', sm: 'block' } }}>Time</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: 12, display: { xs: 'none', md: 'block' } }}>Total</Typography>
        </Box>

        {tradingActive ? (
          trades.map((trade, index) => {
            const date = new Date(trade.T);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
            const timeString = `${hours}:${minutes}:${seconds}.${milliseconds}`;

            return (
              <Box
                key={`trade-${index}`}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '0.6fr 1fr 1fr', sm: '0.6fr 0.8fr 1fr 1fr 0.8fr', md: '0.6fr 0.8fr 1fr 1fr 0.8fr 0.8fr' },
                  gap: '15px',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s',
                  fontSize: 13,
                  lineHeight: 1.5,
                  position: 'relative',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.03)'
                  }
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: trade.m ? alpha('#0ecb81', 0.9) : alpha('#f6465d', 0.9),
                    fontWeight: 500
                  }}
                >
                  {trade.m ? 'BUY' : 'SELL'}
                </Typography>

                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {/* {trade.e && trade.e.logo && (
                    <Box
                      component="img"
                      src={trade.e.logo}
                      alt={trade.e.name}
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        objectFit: 'contain'
                      }}
                    />
                  )} */}
                  <Typography variant="body2">{trade.e?.name || 'Exchange'}</Typography>
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 500,
                    color: trade.m ? alpha('#0ecb81', 0.9) : alpha('#f6465d', 0.9)
                  }}
                >
                  {trade.p}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace"
                  }}
                >
                  {trade.q}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Monaco', monospace",
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {timeString}
                </Typography>

                {/* Total column - only visible on md and larger screens */}
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    color: 'rgba(255, 255, 255, 0.8)',
                    display: { xs: 'none', md: 'block' }
                  }}
                >
                  ${(parseFloat(trade.p) * parseFloat(trade.q)).toFixed(2)}
                </Typography>
              </Box>
            );
          })
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Market data will appear here when trading is active
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MarketData;