import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ButtonGroup,
  Button,
  useTheme,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { formatNumber } from '../../utils/formatters';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TeamGrowthChart = ({ data, title = 'Team Growth' }) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('month');
  const [chartData, setChartData] = useState(null);

  // Process data based on time range
  useEffect(() => {
    if (!data) return;

    let filteredData;
    let labels;

    switch (timeRange) {
      case 'week':
        filteredData = data.daily?.slice(-7) || [];
        labels = filteredData.map((item) => item.date);
        break;
      case 'month':
        filteredData = data.daily?.slice(-30) || [];
        labels = filteredData.map((item) => item.date);
        break;
      case 'year':
        filteredData = data.monthly?.slice(-12) || [];
        labels = filteredData.map((item) => item.month);
        break;
      default:
        filteredData = data.daily?.slice(-30) || [];
        labels = filteredData.map((item) => item.date);
    }

    const datasets = [
      {
        label: 'Direct Referrals',
        data: filteredData.map((item) => item.direct),
        borderColor: theme.palette.primary.main,
        backgroundColor: chartType === 'line' 
          ? `${theme.palette.primary.main}20`
          : theme.palette.primary.main,
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === 'line',
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Team Size',
        data: filteredData.map((item) => item.total),
        borderColor: theme.palette.secondary.main,
        backgroundColor: chartType === 'line' 
          ? `${theme.palette.secondary.main}20`
          : theme.palette.secondary.main,
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === 'line',
        pointBackgroundColor: theme.palette.secondary.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ];

    setChartData({
      labels,
      datasets,
    });
  }, [data, timeRange, chartType, theme]);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme.palette.text.primary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatNumber(context.parsed.y, 0);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          stepSize: 1,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 3, height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            mb: 3,
          }}
        >
          <Typography variant="h6" component="h2" fontWeight="bold">
            {title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Time Range Selector */}
            <ButtonGroup size="small" aria-label="time range">
              <Button
                variant={timeRange === 'week' ? 'contained' : 'outlined'}
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button
                variant={timeRange === 'month' ? 'contained' : 'outlined'}
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button
                variant={timeRange === 'year' ? 'contained' : 'outlined'}
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
            </ButtonGroup>

            {/* Chart Type Selector */}
            <ButtonGroup size="small" aria-label="chart type">
              <Button
                variant={chartType === 'line' ? 'contained' : 'outlined'}
                onClick={() => setChartType('line')}
              >
                Line
              </Button>
              <Button
                variant={chartType === 'bar' ? 'contained' : 'outlined'}
                onClick={() => setChartType('bar')}
              >
                Bar
              </Button>
            </ButtonGroup>
          </Box>
        </Box>

        <Box sx={{ height: 300, position: 'relative' }}>
          {chartData ? (
            chartType === 'line' ? (
              <Line data={chartData} options={options} />
            ) : (
              <Bar data={chartData} options={options} />
            )
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No data available
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TeamGrowthChart;
