import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, useTheme } from '@mui/material';

const ExchangeSelector = ({ exchanges, onExchangeSelect, currentExchange }) => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  
  // State for exchange data
  const [exchangeData, setExchangeData] = useState([]);
  
  // Initialize exchange data
  useEffect(() => {
    if (exchanges && exchanges.length > 0) {
      setExchangeData(exchanges);
    }
  }, [exchanges]);
  
  // Handle exchange selection
  const handleExchangeSelect = (exchange) => {
    if (onExchangeSelect) {
      onExchangeSelect(exchange);
    }
  };
  
  return (
    <Box className="exchange-selector" sx={{
      border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.9)' : '#ffffff',
      mb: 2
    }}>
      <Box className="exchange-title" sx={{
        p: 2,
        borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6" fontWeight="bold">
          Trading Exchanges
        </Typography>
        <Box className="auto-switch-indicator" sx={{
          backgroundColor: mode === 'dark' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(14, 203, 129, 0.05)',
          color: 'success.main',
          px: 1.5,
          py: 0.5,
          borderRadius: 10,
          fontSize: '0.75rem',
          fontWeight: 'medium'
        }}>
          Auto-switching
        </Box>
      </Box>
      
      <Box className="exchange-cards" sx={{
        p: 2,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2
      }}>
        {exchangeData.map((exchange) => (
          <Paper
            key={exchange.id}
            className={`exchange-card ${exchange.active ? 'active' : ''}`}
            elevation={0}
            sx={{
              width: { xs: '100%', sm: '47%', md: '31%', lg: '23%' },
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${exchange.active 
                ? 'rgba(240, 185, 11, 0.3)' 
                : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              backgroundColor: exchange.active
                ? mode === 'dark' ? 'rgba(240, 185, 11, 0.1)' : 'rgba(240, 185, 11, 0.05)'
                : mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backgroundColor: exchange.active
                  ? mode === 'dark' ? 'rgba(240, 185, 11, 0.15)' : 'rgba(240, 185, 11, 0.1)'
                  : mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }
            }}
            onClick={() => handleExchangeSelect(exchange)}
            data-exchange={exchange.id}
          >
            <Box className="exchange-card-header" sx={{
              p: 2,
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  mr: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <img
                  src={exchange.logo}
                  className="exchange-logo"
                  alt={exchange.name}
                  style={{
                    width: '70%',
                    height: '70%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    // Fallback for image loading errors using the embedded fallback logo
                    console.warn(`Failed to load image for ${exchange.name}, using fallback`);
                    e.target.src = exchange.fallbackLogo || 
                      `https://ui-avatars.com/api/?name=${exchange.name.charAt(0)}&background=random&color=fff&size=100`;
                  }}
                />
              </Box>
              <Typography variant="subtitle1" fontWeight="bold" className="exchange-name">
                {exchange.name}
              </Typography>
              
              {/* Badge - Popular, New, US, etc. */}
              {exchange.badge && (
                <Box className="exchange-badge" sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  backgroundColor: exchange.badgeColor || 'primary.main',
                  color: 'white'
                }}>
                  {exchange.badge}
                </Box>
              )}
            </Box>
            
            <Box className="exchange-card-body" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" className="stat-label">
                    Volume
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" className="stat-value">
                    {exchange.stats?.volume || '$0.00B'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" className="stat-label">
                    Pairs
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" className="stat-value">
                    {exchange.stats?.pairs || '0+'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  BTC: <span className="price-value">{exchange.stats?.price || '$0.00'}</span>
                </Typography>
              </Box>
            </Box>
            
            <Box className="exchange-card-footer" sx={{
              p: 1.5,
              borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
              backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
            }}>
              <Box className="exchange-status" sx={{
                display: 'inline-block',
                px: 1.5,
                py: 0.25,
                borderRadius: 10,
                fontSize: '0.75rem',
                fontWeight: 'medium',
                backgroundColor: exchange.active 
                  ? mode === 'dark' ? 'rgba(14, 203, 129, 0.1)' : 'rgba(14, 203, 129, 0.05)'
                  : 'transparent',
                color: exchange.active ? 'success.main' : 'text.secondary'
              }}>
                {exchange.active ? 'Connected' : 'Ready'}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
      
      <Box className="current-exchange-indicator" sx={{
        p: 2,
        borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Box className="indicator-dot" sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: 'success.main',
          mr: 1,
          animation: 'pulse 2s infinite'
        }}></Box>
        <Typography variant="body2">
          Currently trading on <strong id="current-exchange-name">
            {currentExchange?.name || exchangeData.find(ex => ex.active)?.name || 'Binance'}
          </strong>
        </Typography>
      </Box>
      
      {/* CSS for pulse animation */}
      <style jsx="true">{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(14, 203, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 5px rgba(14, 203, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(14, 203, 129, 0);
          }
        }
      `}</style>
    </Box>
  );
};

export default ExchangeSelector;
