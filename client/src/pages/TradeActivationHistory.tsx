import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Collapse,
  Fade,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Computer as ComputerIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import useTradeActivation from '../hooks/useTradeActivation';
import { format, parseISO, subDays } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TradeActivationHistory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    activationHistory,
    todayActivation,
    isActivated,
    loading,
    activating,
    error,
    pagination,
    filters,
    formatDate,
    formatTime,
    isToday,
    fetchActivationHistory,
    activateDailyTrading,
    updateFilters,
    updatePagination,
    resetFilters,
    clearCache
  } = useTradeActivation();

  // Local state for date filters only
  const [startDate, setStartDate] = useState<Date | null>(
    filters.startDate ? parseISO(filters.startDate) : subDays(new Date(), 10)
  );
  const [endDate, setEndDate] = useState<Date | null>(
    filters.endDate ? parseISO(filters.endDate) : null
  );
  const [showFilters, setShowFilters] = useState(false);

  // Update local state when filters change
  useEffect(() => {
    setStartDate(filters.startDate ? parseISO(filters.startDate) : subDays(new Date(), 10));
    setEndDate(filters.endDate ? parseISO(filters.endDate) : null);
  }, [filters]);

  // Handle date changes
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date) {
      updateFilters({ startDate: date.toISOString() });
    } else {
      updateFilters({ startDate: null });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (date) {
      updateFilters({ endDate: date.toISOString() });
    } else {
      updateFilters({ endDate: null });
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    resetFilters();
    setStartDate(subDays(new Date(), 10));
    setEndDate(null);
  };

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    updatePagination(newPage + 1); // API uses 1-based pagination
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    updatePagination(1, newLimit);
  };

  // Handle refresh
  const handleRefresh = () => {
    clearCache(); // Clear cache to ensure fresh data
    fetchActivationHistory();
  };

  // Handle activate
  const handleActivate = async () => {
    await activateDailyTrading();
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Apply date filters
  const applyDateFilters = () => {
    updateFilters({
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null
    });
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'expired':
        return <AccessTimeIcon fontSize="small" color="warning" />;
      case 'cancelled':
        return <CancelIcon fontSize="small" color="error" />;
      default:
        return undefined;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            background: theme.palette.background.paper,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Trade Activation History
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} disabled={loading} size="small">
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              {!isActivated && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleActivate}
                  disabled={loading || activating}
                  startIcon={activating ? <CircularProgress size={20} /> : null}
                >
                  {activating ? 'Activating...' : 'Activate Trading'}
                </Button>
              )}
            </Box>
          </Box>

          {/* Today's Activation Card */}
          {todayActivation && (
            <Fade in={!!todayActivation} timeout={500}>
              <Card
                elevation={2}
                sx={{
                  mb: 4,
                  border: `1px solid ${theme.palette.primary.main}`,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}10 100%)`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: `0 0 15px ${theme.palette.primary.main}40`,
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    Today's Activation
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 3 },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    flexWrap: 'wrap'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap>
                        {formatDate(todayActivation.activation_date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap>
                        {formatTime(todayActivation.activation_time)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(todayActivation.status)}
                      <Typography variant="body2" sx={{ ml: 1 }} noWrap>
                        {todayActivation.status.charAt(0).toUpperCase() + todayActivation.status.slice(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ComputerIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" noWrap>
                        {todayActivation.device_info?.platform || 'Unknown Device'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Date Filter Bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={toggleFilters}
                  fullWidth
                  startIcon={<FilterListIcon />}
                  sx={{ height: 40 }}
                >
                  {showFilters ? 'Hide Date Filter' : 'Show Date Filter'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: { xs: '100%', md: '30%' } }}>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={handleResetFilters}
                  size="small"
                >
                  Reset to Last 10 Days
                </Button>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: { xs: '100%', md: '30%' } }}>
                <Tooltip title="Refresh Data">
                  <IconButton onClick={handleRefresh} disabled={loading} color="primary">
                    {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Date Filter */}
            <Collapse in={showFilters}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mt: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={applyDateFilters}
                      fullWidth
                      sx={{ height: 40 }}
                    >
                      Apply Date Filter
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Collapse>
          </Box>

          {/* Active Filters Display */}
          {(filters.startDate || filters.endDate) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Date Range:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filters.startDate && (
                  <Chip
                    label={`From: ${format(parseISO(filters.startDate), 'MMM dd, yyyy')}`}
                    size="small"
                    color="primary"
                    onDelete={() => updateFilters({ startDate: null })}
                  />
                )}
                {filters.endDate && (
                  <Chip
                    label={`To: ${format(parseISO(filters.endDate), 'MMM dd, yyyy')}`}
                    size="small"
                    color="primary"
                    onDelete={() => updateFilters({ endDate: null })}
                  />
                )}
                {!filters.startDate && !filters.endDate && (
                  <Chip
                    label="Last 10 days"
                    size="small"
                    color="default"
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* Activation History Table */}
          <TableContainer component={Paper} elevation={0} sx={{ mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  {!isMobile && <TableCell>Device</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 4} align="center">
                      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={32} />
                        <Typography variant="body2" color="text.secondary">
                          Loading activation history...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 4} align="center">
                      <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : activationHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 4} align="center">
                      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1">No activation history found.</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try changing your search filters or activate trading to create history.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  activationHistory.map((activation) => (
                    <TableRow
                      key={activation._id}
                      sx={{
                        bgcolor: isToday(activation.activation_date)
                          ? `${theme.palette.primary.main}10`
                          : 'transparent',
                        '&:hover': {
                          bgcolor: `${theme.palette.action.hover}`,
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {formatDate(activation.activation_date)}
                          {isToday(activation.activation_date) && (
                            <Chip
                              label="Today"
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{formatTime(activation.activation_time)}</TableCell>
                      <TableCell>
                        {(() => {
                          const statusIcon = getStatusIcon(activation.status);
                          return (
                            <Chip
                              label={activation.status.charAt(0).toUpperCase() + activation.status.slice(1)}
                              color={getStatusColor(activation.status) as any}
                              size="small"
                              {...(statusIcon ? { icon: statusIcon } : {})}
                            />
                          );
                        })()}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {activation.device_info?.platform || 'Unknown Device'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {activationHistory.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={pagination.total}
                rowsPerPage={pagination.limit}
                page={pagination.page - 1} // Convert 1-based to 0-based for MUI
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                }
              />
            )}
          </TableContainer>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};


export default TradeActivationHistory;
