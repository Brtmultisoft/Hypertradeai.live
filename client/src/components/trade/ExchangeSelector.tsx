import React from 'react';
import { Paper, Box, Typography, Card, CardContent, Avatar, Chip, CircularProgress } from '@mui/material';
import CustomGrid from '../common/CustomGrid';
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
    },

    {
      name: 'Gate.io',
      id: 'gate1',
      logo: 'https://cryptologos.cc/logos/gate-token-gt-logo.png',
      volume: '$2.8B',
      pairs: '320+',
      status: 'ready'
    },

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
        background: '#12151c',
        borderRadius: '16px',
        padding: '15px',
        mb: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
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
          gap: 1,
          mb: 1.5
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 1
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
        <CustomGrid container spacing={1} sx={{ width: '100%', maxWidth: '100%', margin: 0 }}>
          {exchanges.map((exchange) => (
            <CustomGrid item xs={6} sm={4} md={2} key={exchange.id || `${exchange.name}-${Math.random()}`}>
              <Card
                sx={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  border: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? '1px solid rgba(240, 185, 11, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative',
                  cursor: tradingActive ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? '0 0 20px rgba(240, 185, 11, 0.2)'
                    : '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transform: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                          (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                    ? 'translateY(-5px)'
                    : 'none',
                  '&:hover': tradingActive ? {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
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
                {/* {exchange.badge && (
                  <Chip
                    label={exchange.badge.text}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: exchange.badge.color,
                      color: exchange.badge.textColor || '#000',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      height: 'auto',
                      zIndex: 10,
                      animation: 'badgePulse 2s infinite'
                    }}
                  />
                )} */}

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

                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1,
                    '&:last-child': { pb: 1 }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Avatar
                      src={exchange.logo}
                      alt={exchange.name}
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 1,
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '2px'
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: (exchange.id && currentExchange.id && exchange.id === currentExchange.id) ||
                            (!exchange.id && !currentExchange.id && exchange.name === currentExchange.name)
                          ? 'primary.main'
                          : 'text.primary'
                      }}
                    >
                      {exchange.name}
                    </Typography>
                  </Box>

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
                </CardContent>
              </Card>
            </CustomGrid>
          ))}
        </CustomGrid>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mt: 1.5,
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '10px 15px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* <Box
          sx={{
            width: 8,
            height: 8,
            bgcolor: 'secondary.main',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite'
          }}
        /> */}
        {/* <Typography variant="body2">
          Currently trading on <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {currentExchange.name}
          </Typography>
        </Typography> */}
      </Box>
    </Paper>
  );
};

export default ExchangeSelector;