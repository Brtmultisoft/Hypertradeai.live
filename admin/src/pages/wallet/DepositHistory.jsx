import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';

const DepositHistory = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch deposit history data
  const fetchDepositHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-all-deposits`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          sort_field: sortField,
          sort_direction: sortDirection,
          status: filterStatus,
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (response.data && response.data.status) {
        setDeposits(response.data.result.docs || []);
        setTotalDeposits(response.data.result.totalDocs || 0);
      } else {
        setError(response.data?.message || 'Failed to fetch deposit history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching deposit history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchDepositHistory();
  }, [page, rowsPerPage, sortField, sortDirection, filterStatus]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchDepositHistory();
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle search on Enter key press
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle date filter changes
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  // Apply date filters
  const applyDateFilters = () => {
    setPage(0);
    fetchDepositHistory();
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon fontSize="small" />
    ) : (
      <ArrowDownwardIcon fontSize="small" />
    );
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Deposit History"
        subtitle="View all deposit transactions on the platform"
      />

      {/* Filters and Search */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by user, transaction ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} edge="end">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={filterStatus}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              variant="outlined"
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              variant="outlined"
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<DateRangeIcon />}
              onClick={applyDateFilters}
            >
              Apply
            </Button>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setFilterStatus('');
                setPage(0);
                setSortField('created_at');
                setSortDirection('desc');
                fetchDepositHistory();
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Deposit History Table */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('transaction_id')}
                  >
                    Serial No. {renderSortIcon('transaction_id')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('transaction_id')}
                  >
                    Transaction ID {renderSortIcon('transaction_id')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('user_id')}
                  >
                    User {renderSortIcon('user_id')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('amount')}
                  >
                    Amount {renderSortIcon('amount')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('payment_method')}
                  >
                    Payment Method {renderSortIcon('payment_method')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('status')}
                  >
                    Status {renderSortIcon('status')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('created_at')}
                  >
                    Date {renderSortIcon('created_at')}
                  </Box>
                </TableCell>
                {/* <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading deposit history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : deposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Box>No deposits found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                deposits.map((deposit, index) => (
                  <TableRow key={deposit._id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{deposit.transaction_id || deposit._id}</TableCell>
                    <TableCell>
                      {deposit.user_details ? (
                        `${deposit.user_details.name} (${deposit.user_details.email})`
                      ) : (
                        deposit.user_id
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(deposit.amount || 0)}</TableCell>
                    <TableCell>{deposit.payment_method || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={deposit.status || 'pending'}
                        size="small"
                        color={getStatusChipColor(deposit.status || 'pending')}
                      />
                    </TableCell>
                    <TableCell>{formatDate(deposit.created_at)}</TableCell>
                    {/* <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          // onClick={() => handleViewDeposit(deposit._id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          component="div"
          count={totalDeposits}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default DepositHistory;
