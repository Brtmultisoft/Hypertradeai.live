import React from 'react';
import { Box } from '@mui/material';
import MetricCard from './MetricCard';

interface MetricsPanelProps {
  btcPrice: number;
  totalInvestment: number;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  btcPrice,
  totalInvestment
}) => {
  const dailyProfit = totalInvestment * 0.025;

  return (
    <Box mb={6}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', lg: '1 1 30%' } }}>
          <MetricCard
            title="BTC PRICE"
            value={`$${btcPrice.toFixed(2)}`}
            color="blue"
          />
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', lg: '1 1 30%' } }}>
          <MetricCard
            title="INVESTMENT AMOUNT"
            value={`$${totalInvestment.toFixed(2)}`}
            color="amber"
          />
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', lg: '1 1 30%' } }}>
          <MetricCard
            title="DAILY PROFIT"
            value={`$${dailyProfit.toFixed(2)}`}
            color="green"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MetricsPanel;
