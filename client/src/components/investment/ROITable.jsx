import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import Table from '../common/Table';
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';

const ROITable = ({
  data,
  loading,
  title = 'ROI History',
  type = 'daily', // daily, direct, level
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Define columns based on type
  const getColumns = () => {
    const baseColumns = [
      {
        id: 'date',
        label: 'Date',
        minWidth: 120,
        format: (value) => formatDate(value),
      },
      {
        id: 'amount',
        label: 'Amount',
        minWidth: 120,
        align: 'right',
        format: (value) => formatCurrency(value),
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        align: 'center',
        format: (value) => (
          <Chip
            label={value}
            size="small"
            color={
              value === 'Completed'
                ? 'success'
                : value === 'Pending'
                ? 'warning'
                : value === 'Failed'
                ? 'error'
                : 'default'
            }
            sx={{ fontWeight: 'medium' }}
          />
        ),
      },
    ];

    // Add type-specific columns
    if (type === 'daily') {
      return [
        ...baseColumns.slice(0, 1),
        {
          id: 'investment',
          label: 'Investment',
          minWidth: 120,
          align: 'right',
          format: (value) => formatCurrency(value),
        },
        {
          id: 'percentage',
          label: 'ROI %',
          minWidth: 100,
          align: 'right',
          format: (value) => formatPercentage(value / 100),
        },
        ...baseColumns.slice(1),
      ];
    } else if (type === 'direct') {
      return [
        ...baseColumns.slice(0, 1),
        {
          id: 'from',
          label: 'From User',
          minWidth: 150,
          format: (value, row) => (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">{value}</Typography>
              {row.level && (
                <Chip
                  label={`Level ${row.level}`}
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: `${theme.palette.primary.main}20`,
                    color: theme.palette.primary.main,
                    fontWeight: 'medium',
                  }}
                />
              )}
            </Box>
          ),
        },
        {
          id: 'investment',
          label: 'Their Investment',
          minWidth: 150,
          align: 'right',
          format: (value) => formatCurrency(value),
        },
        ...baseColumns.slice(1),
      ];
    } else if (type === 'level') {
      return [
        ...baseColumns.slice(0, 1),
        {
          id: 'from',
          label: 'From User',
          minWidth: 150,
        },
        {
          id: 'level',
          label: 'Level',
          minWidth: 100,
          align: 'center',
          format: (value) => (
            <Chip
              label={`Level ${value}`}
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}20`,
                color: theme.palette.primary.main,
                fontWeight: 'medium',
              }}
            />
          ),
        },
        ...baseColumns.slice(1),
      ];
    }

    return baseColumns;
  };

  // Filter data based on search and filters
  const filteredData = data.filter((item) => {
    // Search filter
    const searchMatch =
      !searchTerm ||
      Object.values(item).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });

    // Date range filter
    const dateMatch = (() => {
      if (dateRange === 'all') return true;
      
      const itemDate = new Date(item.date);
      const today = new Date();
      
      switch (dateRange) {
        case 'today':
          return (
            itemDate.getDate() === today.getDate() &&
            itemDate.getMonth() === today.getMonth() &&
            itemDate.getFullYear() === today.getFullYear()
          );
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          return itemDate >= weekAgo;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          return itemDate >= monthAgo;
        case 'year':
          const yearAgo = new Date();
          yearAgo.setFullYear(today.getFullYear() - 1);
          return itemDate >= yearAgo;
        default:
          return true;
      }
    })();

    // Status filter
    const statusMatch =
      statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();

    return searchMatch && dateMatch && statusMatch;
  });

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 0, height: '100%', '&:last-child': { pb: 0 } }}>
        {/* Header with filters */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
            {title}
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="date-range-label">Date Range</InputLabel>
                <Select
                  labelId="date-range-label"
                  value={dateRange}
                  label="Date Range"
                  onChange={(e) => setDateRange(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Table */}
        <Box sx={{ height: 'calc(100% - 140px)' }}>
          <Table
            columns={getColumns()}
            data={filteredData}
            loading={loading}
            pagination={true}
            search={false} // We're handling search separately
            emptyMessage={`No ${type} ROI records found`}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ROITable;
