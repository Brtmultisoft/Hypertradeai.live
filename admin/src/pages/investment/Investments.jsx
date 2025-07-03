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
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';
import useDebounce from '../../hooks/useDebounce';

const Investments = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Fetch investments data
  const fetchInvestments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearchTerm,
        sort_field: sortField,
        sort_direction: sortDirection,
        status: filterStatus,
      };
      if (minAmount) params.amount_from = minAmount;
      if (maxAmount) params.amount_to = maxAmount;
      if (dateFrom) params.created_at_from = dateFrom;
      if (dateTo) params.created_at_to = dateTo;

      // Always use the direct endpoint
      const response = await axios.get(`${API_URL}/admin/get-investments-direct`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      await processResponse(response);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching investments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process API response
  const processResponse = async (response) => {
      console.log('Investment API Response:', response.data);

      if (response.data.status) {
        // Check if we have data in different formats and handle accordingly
        if (response.data.result && response.data.result.list) {
          console.log('Using list format:', response.data.result.list);
          setInvestments(response.data.result.list || []);
          setTotalInvestments(response.data.result.total || 0);
        } else if (response.data.result && response.data.result.docs) {
          console.log('Using docs format:', response.data.result.docs);
          setInvestments(response.data.result.docs || []);
          setTotalInvestments(response.data.result.totalDocs || 0);
        } else if (response.data.result && Array.isArray(response.data.result)) {
          console.log('Using array format:', response.data.result);
          setInvestments(response.data.result);
          setTotalInvestments(response.data.result.length || 0);
        } else if (response.data.result && typeof response.data.result === 'object') {
          // Try to extract any array property from the result
          const possibleArrayProps = Object.keys(response.data.result).filter(key =>
            Array.isArray(response.data.result[key]));

          if (possibleArrayProps.length > 0) {
            const arrayProp = possibleArrayProps[0];
            console.log(`Found array in result.${arrayProp}:`, response.data.result[arrayProp]);
            setInvestments(response.data.result[arrayProp] || []);
            setTotalInvestments(response.data.result[arrayProp].length || 0);
          } else {
            console.log('Unknown format, using empty array');
            setInvestments([]);
            setTotalInvestments(0);
          }
        } else {
          console.log('Unknown format, using empty array');
          setInvestments([]);
          setTotalInvestments(0);
        }
      } else {
        setError(response.data?.message || 'Failed to fetch investments');
      }

  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchInvestments();
    // eslint-disable-next-line
  }, [page, rowsPerPage, sortField, sortDirection, filterStatus, debouncedSearchTerm]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    // fetchInvestments(); // No need to call directly, useEffect will handle
  };

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

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  // Handle min/max amount change
  const handleMinAmountChange = (e) => setMinAmount(e.target.value);
  const handleMaxAmountChange = (e) => setMaxAmount(e.target.value);
  // Handle date change
  const handleDateFromChange = (e) => setDateFrom(e.target.value);
  const handleDateToChange = (e) => setDateTo(e.target.value);

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
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="All Investments"
        subtitle="Manage all investments on the platform"
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Min Amount"
              type="number"
              value={minAmount}
              onChange={handleMinAmountChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Max Amount"
              type="number"
              value={maxAmount}
              onChange={handleMaxAmountChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={handleDateFromChange}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Date To"
              type="date"
              value={dateTo}
              onChange={handleDateToChange}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={filterStatus}
                onChange={handleStatusFilterChange}
                label="Filter by Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setMinAmount('');
                setMaxAmount('');
                setDateFrom('');
                setDateTo('');
                setPage(0);
                setSortField('created_at');
                setSortDirection('desc');
                fetchInvestments();
              }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Investments Table */}
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
                {/* <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('roi_percentage')}
                  >
                    ROI % {renderSortIcon('roi_percentage')}
                  </Box>
                </TableCell> */}
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('daily_roi')}
                  >
                    Daily ROI {renderSortIcon('daily_roi')}
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
                    Investment Date {renderSortIcon('created_at')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading investments...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : investments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Box>No investments found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                investments.map((investment, index) => (
                  <TableRow key={investment._id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      {investment.user_name && investment.email
                        ? `${investment.user_name} (${investment.email})`
                        : investment.user_name
                        ? investment.user_name
                        : investment.email
                        ? investment.email
                        : investment.username
                        ? investment.username
                        : investment.user_id}
                    </TableCell>
                    <TableCell>{formatCurrency(investment.amount || 0)}</TableCell>
                    {/* <TableCell>{investment.roi_percentage || investment.daily_profit || 8}%</TableCell> */}
                    <TableCell>{formatCurrency(investment.daily_roi || (investment.amount * (investment.daily_profit || 8) / 100) || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={investment.status || 'active'}
                        size="small"
                        color={getStatusChipColor(investment.status || 'active')}
                      />
                    </TableCell>
                    <TableCell>{formatDate(investment.created_at || investment.start_date)}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          // onClick={() => handleViewInvestment(investment._id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          component="div"
          count={totalInvestments}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Investments;
