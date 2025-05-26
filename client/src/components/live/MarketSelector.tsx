import React from 'react';
import {
  Box,
  Card,
  Chip,
  Typography,
  useTheme,
  Skeleton,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material';
import { useTradingContext } from '../../context/TradingContext';


const MarketSelector: React.FC = () => {
  const { loading, selectedInstrument, setSelectedInstrument, autoRotate, setAutoRotate } = useTradingContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Define default instruments
  const instruments = [
    { id: 'BTC-USD', name: 'Bitcoin' },
    { id: 'ETH-USD', name: 'Ethereum' },
    { id: 'SOL-USD', name: 'Solana' },
    { id: 'XRP-USD', name: 'Ripple' },
    { id: 'ADA-USD', name: 'Cardano' },
    { id: 'DOGE-USD', name: 'Dogecoin' },
    { id: 'DOT-USD', name: 'Polkadot' },
    { id: 'LINK-USD', name: 'Chainlink' }
  ];

  if (loading) {
    return (
      <Card sx={{ p: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={56} />
      </Card>
    );
  }

  // Find the selected instrument name
  const selectedInstrumentName = instruments.find(i => i.id === selectedInstrument)?.name || 'Bitcoin';

  return (
    <Card sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Select Market
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Auto-rotate (2-3s)
              </Typography>
            }
          />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="primary.main"
              sx={{
                animation: autoRotate ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                  '100%': { opacity: 1 }
                }
              }}
            >
              Trading: {selectedInstrumentName}
              {autoRotate && ' (Auto)'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          gap: 1,
          pb: isMobile ? 1 : 0,
          overflowX: isMobile ? 'auto' : 'visible',
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.background.default,
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.primary.main,
            borderRadius: '3px',
          },
        }}
      >
        {instruments.map((instrument) => (
          <Chip
            key={instrument.id}
            label={instrument.id}
            clickable
            color={selectedInstrument === instrument.id ? 'primary' : 'default'}
            variant={selectedInstrument === instrument.id ? 'filled' : 'outlined'}
            onClick={() => {
              if (selectedInstrument !== instrument.id) {
                console.log(`Selecting instrument: ${instrument.name} (${instrument.id})`);

                // Disable auto-rotation when manually selecting an instrument
                if (autoRotate) {
                  setAutoRotate(false);
                }

                setSelectedInstrument(instrument.id);
              }
            }}
            sx={{
              fontWeight: selectedInstrument === instrument.id ? 600 : 400,
              transition: 'all 0.2s ease-in-out',
              minWidth: 'fit-content',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 1
              }
            }}
          />
        ))}
      </Box>
    </Card>
  );
};

export default MarketSelector