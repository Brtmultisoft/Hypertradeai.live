import React from 'react';
import { Paper, Box, Typography, Card, Avatar, Chip, CircularProgress } from '@mui/material';
import { Exchange } from '../../types/types';

interface ExchangeSelectorProps {
  currentExchange: Exchange;
  setCurrentExchange: (exchange: Exchange) => void;
  tradingActive: boolean;
}

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  currentExchange,
  setCurrentExchange,
  tradingActive
}) => {
  // Get exchanges from the Binance API hook (now passed from parent)
  // The exchanges and auto-rotation are now handled by the useBinancePrice hook

  // Using hardcoded exchanges for display in the UI
  const exchanges: Exchange[] = [
    {
      name: 'Binance',
      id: 'binance1',
      logo: 'https://cryptologos.cc/logos/binance-bnb-logo.png',
      volume: '$12.4B',
      pairs: '740+',
      status: 'active',
      badge: {
        text: 'Popular',
        color: 'rgba(240, 185, 11, 0.2)',
        textColor: '#f0b90b'
      }
    },

    {
      name: 'KuCoin',
      id: 'kucoin1',
      logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png',
      volume: '$5.8B',
      pairs: '580+',
      status: 'ready'
    },

    {
      name: 'Coinbase',
      id: 'coinbase1',
      logo: 'https://cryptologos.cc/logos/coinbase-coin-coin-logo.png',
      volume: '$8.2B',
      pairs: '420+',
      status: 'ready'
    },

    {
      name: 'Crypto.com',
      id: 'crypto1',
      logo: 'https://cryptologos.cc/logos/crypto-com-coin-cro-logo.png',
      volume: '$3.2B',
      pairs: '350+',
      status: 'ready'
    },

    {
      name: 'OKX',
      id: 'okx1',
      logo: 'https://cryptologos.cc/logos/okb-okb-logo.png',
      volume: '$4.5B',
      pairs: '400+',
      status: 'ready'
    }
  ];

  // No loading or error state since we're using hardcoded data
  const loading = false;
  const error = null;

  // Handle manual exchange selection
  const handleExchangeSelect = (exchange: Exchange) => {
    if (tradingActive) {
      setCurrentExchange(exchange);
    }
  };
  return (
    <Paper
      sx={{
        background: 'linear-gradient(180deg, rgba(24, 27, 36, 0.9) 0%, rgba(18, 21, 28, 0.95) 100%)',
        borderRadius: '12px',
        padding: { xs: '12px 8px', sm: '15px 10px', md: '18px 12px' },
        mb: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid rgba(255, 255, 255, 0.05)'
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: 2,
          mb: 1.5,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontSize: '0.9rem'
          }}
        >
          Trading Exchanges
        </Typography>
        {/* <Chip
          label="Auto-switching (5s)"
          size="small"
          sx={{
            background: 'rgba(14, 203, 129, 0.2)',
            color: 'secondary.main',
            fontWeight: 500,
            letterSpacing: '0.5px',
            height: '20px',
            '& .MuiChip-label': {
              px: 1,
              py: 0.5,
              fontSize: '10px'
            },
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: '6px',
              height: '6px',
              bgcolor: 'secondary.main',
              borderRadius: '50%',
              mr: 0.5,
              animation: 'pulse 1.5s infinite',
              verticalAlign: 'middle'
            }
          }}
        /> */}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
          <CircularProgress color="primary" size={40} />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', width: '100%', py: 4 }}>
          <Typography color="error" variant="body2">
            Error loading exchange data. Using static data instead.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflowX: 'auto',
            padding: '15px 10px',
            margin: '5px auto 10px',
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::after': {
              content: '""',
              minWidth: '10px'
            },
            '&::before': {
              content: '""',
              minWidth: '10px'
            }
          }}
        >
          {exchanges.map((exchange) => (
            <Box
              key={exchange.id || `${exchange.name}-${Math.random()}`}
              sx={{
                flex: '1 0 auto',
                minWidth: { xs: '140px', sm: '160px', md: '180px' },
                maxWidth: { xs: '160px', sm: '180px', md: '200px' },
                padding: '0 4px',
                transition: 'all 0.3s ease'
              }}
            >
              <Card
                sx={{
                  background: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? 'linear-gradient(135deg, rgba(20, 30, 48, 0.95), rgba(36, 59, 85, 0.95))'
                    : 'linear-gradient(135deg, rgba(18, 21, 28, 0.8), rgba(24, 27, 36, 0.8))',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  border: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? '1px solid rgba(240, 185, 11, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  cursor: tradingActive ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%',
                  height: '56px',
                  boxShadow: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? '0 4px 20px rgba(240, 185, 11, 0.25)'
                    : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transform: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? 'translateY(-2px)'
                    : 'none',
                  '&:hover': tradingActive ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  } : {},
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.05), transparent)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 1
                  },
                  '&:hover::before': tradingActive ? {
                    opacity: 1
                  } : {},
                  '&::after': ((exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)) ? {
                    content: '""',
                    position: 'absolute',
                    top: 'auto',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    background: 'primary.main'
                  } : {}
                }}
                onClick={() => handleExchangeSelect(exchange)}
              >
                {exchange.badge && (
                  <Chip
                    label={exchange.badge.text}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: exchange.badge.color,
                      color: exchange.badge.textColor || '#000',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      height: 'auto',
                      zIndex: 10,
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      animation: 'badgePulse 2s infinite',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase'
                    }}
                  />
                )}

                {/* Show "Selected" badge for current exchange */}
                {tradingActive && ((exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                  (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)) && !exchange.badge && (
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(14, 203, 129, 0.15)',
                      color: 'secondary.main',
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      height: 'auto',
                      zIndex: 10,
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      letterSpacing: '0.3px',
                      textTransform: 'uppercase'
                    }}
                  />
                )}

                {/* Show a pulsing indicator for the current exchange when trading is active */}
                {tradingActive && ((exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'secondary.main',
                      zIndex: 10,
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                )}

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    p: '0 12px',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <Avatar
                    // src={exchange.logo}
                    alt={exchange.name}
                    sx={{
                      width: 28,
                      height: 28,
                      mr: 1.5,
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '3px',
                      border: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                        ? '1px solid rgba(240, 185, 11, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                        ? '0 0 10px rgba(240, 185, 11, 0.2)'
                        : 'none'
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '14px',
                      letterSpacing: '0.2px',
                      color: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                        ? 'primary.main'
                        : 'text.primary',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {exchange.name}
                  </Typography>

                  {/* Always show BTCUSDT as base price */}
                  {/* <Typography
                    variant="caption"
                    sx={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: '10px',
                      color: 'text.secondary',
                      mt: 0.5
                    }}
                  >
                    BTC: {exchange.price || 'N/A'}
                  </Typography> */}
                </Box>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: 2,
          mt: 2,
          background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 100%)',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.03)'
        }}
      >
        {tradingActive && (
          <>
            <Box
              sx={{
                width: 8,
                height: 8,
                bgcolor: 'secondary.main',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite',
                boxShadow: '0 0 10px rgba(14, 203, 129, 0.5)'
              }}
            />
            <Typography variant="body2" sx={{ fontSize: '0.85rem', letterSpacing: '0.2px' }}>
              Currently trading on <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {currentExchange.name}
              </Typography>
            </Typography>
          </>
        )}
        {!tradingActive && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', letterSpacing: '0.2px' }}>
            Activate trading to select an exchange
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ExchangeSelector;