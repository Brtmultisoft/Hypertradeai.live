import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Skeleton, useTheme } from '@mui/material';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { NumericFormat } from 'react-number-format';
import { useTradingContext } from '../../context/TradingContext';
import { useTradingData } from '../../hooks/useTradingData';

const PriceCard: React.FC = () => {
  // Get instrument selection from trading context
  const { selectedInstrument, instruments, marketData } = useTradingContext();

  // Get BTC price and loading state from trading data hook
  const { btcPrice, loading } = useTradingData();
  const theme = useTheme();
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);

  // Flash animation effect when price changes
  useEffect(() => {
    if (btcPrice && previousPrice) {
      setIsIncreasing(btcPrice > previousPrice);
      const timer = setTimeout(() => {
        setIsIncreasing(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setPreviousPrice(btcPrice || null);
  }, [btcPrice]);

  if (loading && !btcPrice) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="80%" height={60} />
          <Skeleton variant="text" width="40%" height={40} />
        </CardContent>
      </Card>
    );
  }

  // Find the selected instrument name
  const selectedInstrumentName = instruments.find(i => i.id === selectedInstrument)?.name || 'Bitcoin';

  // Determine color based on price change
  const isPositive = marketData ? marketData.change24h >= 0 : (isIncreasing !== false);
  const changeColor = isPositive ? theme.palette.success.main : theme.palette.error.main;

  // Get the change percentage
  const changePercentage = marketData ?
    marketData.change24h.toFixed(2) :
    (isPositive ? '+0.25' : '-0.15');

  // For flash animation
  const getBackgroundColor = () => {
    if (isIncreasing === null) return 'transparent';
    return isIncreasing
      ? 'rgba(14, 203, 129, 0.1)' // Binance Green
      : 'rgba(246, 70, 93, 0.1)'; // Binance Red
  };

  return (
    <Card sx={{
      height: '100%',
      transition: 'background-color 0.5s ease',
      backgroundColor: getBackgroundColor()
    }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {selectedInstrumentName} Price
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 700,
              mr: 1
            }}
          >
            <NumericFormat
              value={btcPrice || 0}
              displayType={'text'}
              thousandSeparator={true}
              prefix={'$'}
              decimalScale={2}
              fixedDecimalScale
            />
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: changeColor,
              bgcolor: `${changeColor}15`,
              px: 1,
              py: 0.5,
              borderRadius: 1
            }}
          >
            {isPositive ?
              <TrendingUp size={16} style={{ marginRight: '4px' }} /> :
              <TrendingDown size={16} style={{ marginRight: '4px' }} />
            }
            <Typography
              variant="body2"
              component="span"
              sx={{ fontWeight: 600 }}
            >
              {isPositive && !changePercentage.startsWith('+') ? '+' : ''}{changePercentage}%
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          Last updated: {marketData ? new Date(marketData.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PriceCard;