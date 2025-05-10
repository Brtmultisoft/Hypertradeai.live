import React from 'react';
import { Card, CardContent, Typography, Skeleton, Divider, Box } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingContext } from '../../context/TradingContext';

// Create a custom Grid component to fix the TypeScript errors
const Grid = (props: any) => {
  const { container, item, xs, sm, md, lg, xl, spacing, children, ...rest } = props;
  return (
    <div
      style={{
        display: container ? 'flex' : 'block',
        flexWrap: container ? 'wrap' : undefined,
        flex: item ? (xs === 12 ? '0 0 100%' : `0 0 ${(xs / 12) * 100}%`) : undefined,
        padding: spacing ? `${spacing * 4}px` : undefined,
        boxSizing: 'border-box',
        ...rest.style
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

const StatsCard: React.FC = () => {
  const { btcPrice, loading, marketData, selectedInstrument, instruments } = useTradingContext();

  // Find the selected instrument name
  const selectedInstrumentName = instruments.find(i => i.id === selectedInstrument)?.name || 'Bitcoin';

  // Use market data if available, otherwise use mock data
  const statsData = marketData ? {
    high24h: marketData.high24h,
    low24h: marketData.low24h,
    hourlyChange: marketData.hourlyChange,
    weeklyChange: marketData.weeklyChange,
    monthlyChange: marketData.monthlyChange,
    yearlyChange: marketData.yearlyChange,
    volume24h: marketData.volume24h
  } : {
    high24h: btcPrice ? btcPrice * 1.02 : 86000,
    low24h: btcPrice ? btcPrice * 0.98 : 83000,
    hourlyChange: 0.25,
    weeklyChange: 2.5,
    monthlyChange: -1.2,
    yearlyChange: 45.8,
    volume24h: 28500000000
  };

  if (loading && !btcPrice) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="rectangular" width="100%" height={100} />
        </CardContent>
      </Card>
    );
  }

  const renderChangeIndicator = (value: number) => {
    const Icon = value >= 0 ? TrendingUp : TrendingDown;
    const color = value >= 0 ? 'primary.main' : 'secondary.main';
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color }}>
        <Icon size={16} style={{ marginRight: '4px' }} />
        <Typography variant="body2" component="span" sx={{ fontWeight: 600, color }}>
          {value.toFixed(2)}%
        </Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {selectedInstrumentName} Stats
        </Typography>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              24h High
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              <NumericFormat
                value={statsData.high24h}
                displayType={'text'}
                thousandSeparator={true}
                prefix={'$'}
                decimalScale={2}
                fixedDecimalScale
              />
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              24h Low
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              <NumericFormat
                value={statsData.low24h}
                displayType={'text'}
                thousandSeparator={true}
                prefix={'$'}
                decimalScale={2}
                fixedDecimalScale
              />
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              1h Change
            </Typography>
            {renderChangeIndicator(statsData.hourlyChange)}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              7d Change
            </Typography>
            {renderChangeIndicator(statsData.weeklyChange)}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              30d Change
            </Typography>
            {renderChangeIndicator(statsData.monthlyChange)}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              1y Change
            </Typography>
            {renderChangeIndicator(statsData.yearlyChange)}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              24h Volume
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              <NumericFormat
                value={statsData.volume24h}
                displayType={'text'}
                thousandSeparator={true}
                prefix={'$'}
                decimalScale={0}
              />
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StatsCard;