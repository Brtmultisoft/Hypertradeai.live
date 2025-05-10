import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  useTheme
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useTradingContext } from '../../context/TradingContext';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

const PriceChart: React.FC = () => {
  const { btcPrice, loading, selectedInstrument, instruments } = useTradingContext();

  // Find the selected instrument name
  const selectedInstrumentName = instruments.find(i => i.id === selectedInstrument)?.name || 'Bitcoin';
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [chartData, setChartData] = useState<any>(null);
  const theme = useTheme();

  // Generate mock chart data
  useEffect(() => {
    if (btcPrice) {
      generateChartData();
    }
  }, [btcPrice, timeRange]);

  const generateChartData = () => {
    if (!btcPrice) return;

    const price = btcPrice;
    const volatility = price * 0.02; // 2% volatility for mock data
    const dataPointCount = getDataPointCount();
    const labels = generateTimeLabels(dataPointCount);

    // Generate mock price data with some randomness based on current price
    const data = generatePriceData(price, volatility, dataPointCount);

    // Default to positive trend
    const isPositive = true;

    const gradientColorStart = isPositive
      ? 'rgba(0, 230, 118, 0.8)'
      : 'rgba(255, 82, 82, 0.8)';

    const gradientColorEnd = isPositive
      ? 'rgba(0, 230, 118, 0)'
      : 'rgba(255, 82, 82, 0)';

    const borderColor = isPositive
      ? 'rgba(0, 230, 118, 1)'
      : 'rgba(255, 82, 82, 1)';

    setChartData({
      labels,
      datasets: [
        {
          label: `${selectedInstrumentName} Price`,
          data,
          borderColor,
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;

            if (!chartArea) {
              return null;
            }

            const gradient = ctx.createLinearGradient(
              0, chartArea.bottom, 0, chartArea.top
            );
            gradient.addColorStop(0, gradientColorEnd);
            gradient.addColorStop(1, gradientColorStart);

            return gradient;
          },
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    });
  };

  const getDataPointCount = () => {
    switch(timeRange) {
      case '1D': return 24;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 12;
      default: return 24;
    }
  };

  const generateTimeLabels = (count: number): string[] => {
    const now = new Date();
    const labels: string[] = [];

    switch(timeRange) {
      case '1D':
        for (let i = count - 1; i >= 0; i--) {
          const hour = new Date(now);
          hour.setHours(hour.getHours() - i);
          labels.push(hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        break;
      case '1W':
        for (let i = count - 1; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(day.getDate() - i);
          labels.push(day.toLocaleDateString([], { weekday: 'short' }));
        }
        break;
      case '1M':
        for (let i = count - 1; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(day.getDate() - i);
          labels.push(day.toLocaleDateString([], { month: 'short', day: 'numeric' }));
        }
        break;
      case '3M':
        for (let i = count - 1; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(day.getDate() - i);
          if (i % 7 === 0) {
            labels.push(day.toLocaleDateString([], { month: 'short', day: 'numeric' }));
          } else {
            labels.push('');
          }
        }
        break;
      case '1Y':
        for (let i = count - 1; i >= 0; i--) {
          const month = new Date(now);
          month.setMonth(month.getMonth() - i);
          labels.push(month.toLocaleDateString([], { month: 'short' }));
        }
        break;
    }

    return labels;
  };

  const generatePriceData = (basePrice: number, volatility: number, count: number): number[] => {
    const data: number[] = [];
    let currentPrice = basePrice * (1 - Math.random() * 0.05);

    for (let i = 0; i < count; i++) {
      // Add some randomness
      const change = (Math.random() - 0.5) * volatility;
      currentPrice = currentPrice + change;

      // Ensure price doesn't go negative
      if (currentPrice < 0) currentPrice = volatility;

      data.push(currentPrice);
    }

    // Ensure the chart ends at the current price
    data[data.length - 1] = basePrice;

    return data;
  };

  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeRange: TimeRange,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          color: theme.palette.text.secondary,
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 0,
      }
    },
  };

  if (loading && !btcPrice) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton variant="text" width="30%" height={30} />
            <Skeleton variant="rectangular" width="40%" height={32} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{selectedInstrumentName} Price Chart</Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
            aria-label="time range"
          >
            <ToggleButton value="1D" aria-label="1 day">
              1D
            </ToggleButton>
            <ToggleButton value="1W" aria-label="1 week">
              1W
            </ToggleButton>
            <ToggleButton value="1M" aria-label="1 month">
              1M
            </ToggleButton>
            <ToggleButton value="3M" aria-label="3 months">
              3M
            </ToggleButton>
            <ToggleButton value="1Y" aria-label="1 year">
              1Y
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ height: 300 }}>
          {chartData && <Line data={chartData} options={chartOptions} />}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PriceChart;