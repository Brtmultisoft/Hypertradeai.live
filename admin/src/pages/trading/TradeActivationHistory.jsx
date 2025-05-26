import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
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
  IconButton,
  Tooltip,
  Stack,
  Alert,
  AlertTitle,
  Collapse,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Computer as ComputerIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, parseISO, subDays } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../config';
import useAuth from '../../hooks/useAuth';

const TradeActivationHistory = () => {
  const theme = useTheme();
  const { token } = useAuth();

  // State for activation history data
  const [activations, setActivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // State for filters
  const [filters, setFilters] = useState({
    startDate: subDays(new Date(), 10).toISOString(),
    endDate: null,
    userId: '',
    email: '',
    status: '',
    profitStatus: ''
  });

  // Local state for date filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 10));
  const [endDate, setEndDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [profitStatus, setProfitStatus] = useState('');

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format time for display in 12-hour format
  const formatTime = (timeString) => {
    try {
      // If timeString is in HH:MM:SS format
      const [hours, minutes, seconds] = timeString.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        return timeString;
      }

      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM

      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // Get status chip color
  const getStatusColor = (status) => {
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
  const getStatusIcon = (status) => {
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

  // Helper function to get profit status icon
  const getProfitStatusIcon = (profitStatus) => {
    switch (profitStatus) {
      case 'processed':
        return <AttachMoneyIcon fontSize="small" color="success" />;
      case 'pending':
        return <HourglassEmptyIcon fontSize="small" color="warning" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'skipped':
        return <MoneyOffIcon fontSize="small" color="default" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  // Helper function to get profit status color
  const getProfitStatusColor = (profitStatus) => {
    switch (profitStatus) {
      case 'processed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'skipped':
        return 'default';
      default:
        return 'info';
    }
  };

  // Fetch activation history
  const fetchActivationHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.email) queryParams.append('email', filters.email);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.profitStatus) queryParams.append('profitStatus', filters.profitStatus);

      const response = await axios.get(`${API_URL}/admin/trade-activations?${queryParams.toString()}`, {
        headers: {
          token: token
        }
      });

      if (response.data.status) {
        const { activations, pagination: paginationData } = response.data.data;
        setActivations(activations || []);
        setPagination(paginationData || pagination);
      } else {
        throw new Error(response.data.msg || 'Failed to fetch activation history');
      }
    } catch (err) {
      console.error('Error fetching activation history:', err);
      setError(err.message || 'Failed to fetch activation history');
    } finally {
      setLoading(false);
    }
  };

  // Sync trade activations
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const syncTradeActivations = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      const response = await axios.post(`${API_URL}/admin/trade-activations/sync`, {}, {
        headers: {
          token: token
        }
      });

      if (response.data.status) {
        setSyncResult({
          success: true,
          message: 'Trade activations synced successfully',
          data: response.data.data
        });
        // Refresh the activation history
        fetchActivationHistory();
      } else {
        throw new Error(response.data.msg || 'Failed to sync trade activations');
      }
    } catch (err) {
      console.error('Error syncing trade activations:', err);
      setSyncResult({
        success: false,
        message: err.message || 'Failed to sync trade activations'
      });
    } finally {
      setSyncing(false);
    }
  };

  // Update metadata for all trade activations
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [updateMetadataResult, setUpdateMetadataResult] = useState(null);

  const updateTradeActivationMetadata = async () => {
    try {
      setUpdatingMetadata(true);
      setUpdateMetadataResult(null);

      const response = await axios.post(`${API_URL}/admin/trade-activations/update-metadata`, {}, {
        headers: {
          token: token
        }
      });

      if (response.data.status) {
        setUpdateMetadataResult({
          success: true,
          message: 'Trade activation metadata updated successfully',
          data: response.data.data
        });
        // Refresh the activation history
        fetchActivationHistory();
      } else {
        throw new Error(response.data.msg || 'Failed to update trade activation metadata');
      }
    } catch (err) {
      console.error('Error updating trade activation metadata:', err);
      setUpdateMetadataResult({
        success: false,
        message: err.message || 'Failed to update trade activation metadata'
      });
    } finally {
      setUpdatingMetadata(false);
    }
  };



  // Apply filters
  const applyFilters = () => {
    setFilters({
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      userId,
      email,
      status,
      profitStatus
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate(subDays(new Date(), 10));
    setEndDate(null);
    setUserId('');
    setEmail('');
    setStatus('');
    setProfitStatus('');
    setFilters({
      startDate: subDays(new Date(), 10).toISOString(),
      endDate: null,
      userId: '',
      email: '',
      status: '',
      profitStatus: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 })); // API uses 1-based pagination
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    const newLimit = parseInt(event.target.value, 10);
    setPagination(prev => ({
      ...prev,
      page: 1,
      limit: newLimit
    }));
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Load data on mount and when filters or pagination change
  useEffect(() => {
    fetchActivationHistory();
  }, [pagination.page, pagination.limit, filters]);

  return (
    <Box>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 2,
            background: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Trade Activation History
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                component={Link}
                to="/update-profit-status"
              >
                Update Profit Status
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={syncTradeActivations}
                disabled={syncing}
                startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              >
                {syncing ? 'Syncing...' : 'Sync Activations'}
              </Button>
              <Tooltip title="Refresh Data">
                <IconButton onClick={fetchActivationHistory} disabled={loading} color="primary">
                  {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Daily Cron Job Information */}
          {/* <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px dashed', borderColor: 'divider', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
              Daily Profit Distribution Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The system automatically distributes daily profits to activated users at <strong>1:00 AM UTC</strong> every day.
              A backup job runs at <strong>1:30 AM UTC</strong> if the main job fails.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip
                icon={<AttachMoneyIcon />}
                label="Processed: Profit distributed"
                color="success"
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<HourglassEmptyIcon />}
                label="Pending: Waiting for distribution"
                color="warning"
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<ErrorIcon />}
                label="Failed: Error during distribution"
                color="error"
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<MoneyOffIcon />}
                label="Skipped: No eligible investments"
                color="default"
                variant="outlined"
                size="small"
              />
            </Box>
          </Box> */}


          {/* Filter Bar */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={toggleFilters}
                  fullWidth
                  startIcon={<FilterListIcon />}
                  sx={{ height: 40 }}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={resetFilters}
                  size="small"
                >
                  Reset Filters
                </Button>
              </Grid>
            </Grid>

            {/* Advanced Filters */}
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
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        setStartDate(date);
                      }}
                      size="small"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        setEndDate(date);
                      }}
                      size="small"
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Username or ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="Enter username or ID"
                      InputProps={{
                        startAdornment: (
                          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', opacity: 0.7 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="Enter user email"
                      InputProps={{
                        startAdornment: (
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary', opacity: 0.7 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="status-select-label">Status</InputLabel>
                      <Select
                        labelId="status-select-label"
                        value={status}
                        label="Status"
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="expired">Expired</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="profit-status-select-label">Profit Status</InputLabel>
                      <Select
                        labelId="profit-status-select-label"
                        value={profitStatus}
                        label="Profit Status"
                        onChange={(e) => setProfitStatus(e.target.value)}
                      >
                        <MenuItem value="">All Profit Statuses</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="processed">Processed</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="skipped">Skipped</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={applyFilters}
                      fullWidth
                      sx={{ height: 40 }}
                    >
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Collapse>
          </Box>

          {/* Active Filters Display */}
          {(filters.startDate || filters.endDate || filters.userId || filters.email || filters.status || filters.profitStatus) && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filters.startDate && (
                  <Chip
                    label={`From: ${formatDate(filters.startDate)}`}
                    size="small"
                    color="primary"
                    onDelete={() => {
                      setStartDate(null);
                      setFilters(prev => ({ ...prev, startDate: null }));
                    }}
                  />
                )}
                {filters.endDate && (
                  <Chip
                    label={`To: ${formatDate(filters.endDate)}`}
                    size="small"
                    color="primary"
                    onDelete={() => {
                      setEndDate(null);
                      setFilters(prev => ({ ...prev, endDate: null }));
                    }}
                  />
                )}
                {filters.userId && (
                  <Chip
                    label={`Username/ID: ${filters.userId}`}
                    size="small"
                    color="primary"
                    icon={<PersonIcon fontSize="small" />}
                    onDelete={() => {
                      setUserId('');
                      setFilters(prev => ({ ...prev, userId: '' }));
                    }}
                  />
                )}
                {filters.email && (
                  <Chip
                    label={`Email: ${filters.email}`}
                    size="small"
                    color="primary"
                    icon={<EmailIcon fontSize="small" />}
                    onDelete={() => {
                      setEmail('');
                      setFilters(prev => ({ ...prev, email: '' }));
                    }}
                  />
                )}
                {filters.status && (
                  <Chip
                    label={`Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}`}
                    size="small"
                    color="primary"
                    onDelete={() => {
                      setStatus('');
                      setFilters(prev => ({ ...prev, status: '' }));
                    }}
                  />
                )}
                {filters.profitStatus && (
                  <Chip
                    label={`Profit Status: ${filters.profitStatus.charAt(0).toUpperCase() + filters.profitStatus.slice(1)}`}
                    size="small"
                    color="secondary"
                    onDelete={() => {
                      setProfitStatus('');
                      setFilters(prev => ({ ...prev, profitStatus: '' }));
                    }}
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
                  <TableCell width="25%">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">User Information</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Profit Status</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Expiry Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
                    <TableCell colSpan={7} align="center">
                      <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : activations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1">No activation history found.</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try changing your filters to see more results.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  activations.map((activation) => (
                    <TableRow
                      key={activation._id}
                      sx={{
                        '&:hover': {
                          bgcolor: `${theme.palette.action.hover}`,
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                            <Typography variant="body2" fontWeight="medium">
                              {activation.metadata?.name || activation.metadata?.username || 'Unknown User'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <EmailIcon fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary, fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">
                              {activation.metadata?.user_email || 'No email'}
                            </Typography>
                          </Box>
                          {activation.user_id && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                ID: {typeof activation.user_id === 'object' ? activation.user_id.toString() : activation.user_id}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(activation.activation_date)}
                      </TableCell>
                      <TableCell>{formatTime(activation.activation_time)}</TableCell>
                      <TableCell>
                        {(() => {
                          const statusIcon = getStatusIcon(activation.status);
                          return (
                            <Chip
                              label={activation.status.charAt(0).toUpperCase() + activation.status.slice(1)}
                              color={getStatusColor(activation.status)}
                              size="small"
                              {...(statusIcon ? { icon: statusIcon } : {})}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const profitStatus = activation.profit_status || 'pending';
                          const profitStatusIcon = getProfitStatusIcon(profitStatus);
                          return (
                            <Tooltip title={activation.profit_status_message || ''}>
                              <Chip
                                label={profitStatus.charAt(0).toUpperCase() + profitStatus.slice(1)}
                                color={getProfitStatusColor(profitStatus)}
                                size="small"
                                {...(profitStatusIcon ? { icon: profitStatusIcon } : {})}
                              />
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={activation.device_info?.userAgent || 'Unknown'}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {activation.device_info?.platform || 'Unknown Device'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {formatDate(activation.expiry_date)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {activations.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
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
      </Box>
  );
};

export default TradeActivationHistory;
