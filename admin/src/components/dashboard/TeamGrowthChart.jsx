import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TeamGrowthChart = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('daily');

  const handleTimeRangeChange = (event, newTimeRange) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  // Prepare chart data based on selected time range
  const chartData = {
    labels: timeRange === 'daily'
      ? data.daily.map(item => item.date)
      : data.monthly.map(item => item.month),
    datasets: [
      {
        label: 'Direct Referrals',
        data: timeRange === 'daily'
          ? data.daily.map(item => item.direct)
          : data.monthly.map(item => item.direct),
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
        barThickness: timeRange === 'daily' ? 12 : 20,
      },
      {
        label: 'Total Team Size',
        data: timeRange === 'daily'
          ? data.daily.map(item => item.total)
          : data.monthly.map(item => item.total),
        backgroundColor: theme.palette.secondary.main,
        borderRadius: 4,
        barThickness: timeRange === 'daily' ? 12 : 20,
      },
    ],
  };

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
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: `${theme.palette.divider}40`,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
            size: 11,
          },
          stepSize: 5,
        },
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
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Team Growth
          </Typography>
          <ToggleButtonGroup
            size="small"
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            aria-label="time range"
          >
            <ToggleButton value="daily" aria-label="daily">
              Daily
            </ToggleButton>
            <ToggleButton value="monthly" aria-label="monthly">
              Monthly
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 300 }}>
          <Bar data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TeamGrowthChart;
