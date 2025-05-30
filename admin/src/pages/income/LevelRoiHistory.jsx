import { useState, useEffect, useCallback } from 'react';
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
  Button,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';

const LevelRoiHistory = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalIncomes, setTotalIncomes] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  // Additional state for enhanced filtering
  const [fetchingComplete, setFetchingComplete] = useState(false);
  const [completeDataStats, setCompleteDataStats] = useState({
    totalAmount: 0,
    totalRecords: 0,
    lastUpdated: null
  });
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('last3days'); // 'all', 'last3days', 'last7days', 'last30days', 'custom'

  // Initialize last 3 days filter
  useEffect(() => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    setStartDate(threeDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  // Process API response with improved pagination handling
  const processResponse = (response) => {
    console.log('Level ROI API Response:', response.data);

    if (response.data.status) {
      const result = response.data.result || response.data.data;

      // Handle paginated response format
      if (result && result.list) {
        console.log('Using paginated list format:', result);
        const filteredList = result.list.filter(income =>
          income.type === "level_roi_income" || income.income_type === "level_roi_income"
        );
        setIncomes(filteredList || []);
        // Use the total from pagination info
        setTotalIncomes(result.total || result.totalCount || filteredList.length);
      } else if (result && result.docs) {
        console.log('Using paginated docs format:', result);
        const filteredDocs = result.docs.filter(income =>
          income.type === "level_roi_income" || income.income_type === "level_roi_income"
        );
        setIncomes(filteredDocs || []);
        setTotalIncomes(result.total || result.totalCount || filteredDocs.length);
      } else if (result && Array.isArray(result)) {
        // Handle direct array response (fallback)
        const filteredIncomes = result.filter(income =>
          income.type === "level_roi_income" || income.income_type === "level_roi_income"
        );
        console.log('Using array format (filtered):', filteredIncomes);
        setIncomes(filteredIncomes);
        setTotalIncomes(filteredIncomes.length);
      } else {
        setError(response.data?.message || 'Failed to fetch level ROI history');
      }
    } else {
      setError(response.data?.message || 'Failed to fetch level ROI history');
    }
  };

  // Process direct endpoint response (fallback)
  const processDirectResponse = (response) => {
    console.log('Direct Level ROI API Response:', response.data);

    if (response.data.status) {
      const result = response.data.result || response.data.data;

      if (result && result.list) {
        // Filter for level_roi_income type and apply pagination manually
        let allFiltered = result.list.filter(income =>
          income.type === "level_roi_income" || income.income_type === "level_roi_income"
        );

        // Apply level filter if specified
        if (filterLevel) {
          allFiltered = allFiltered.filter(income => income.level == filterLevel);
        }

        // Apply manual pagination
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = allFiltered.slice(startIndex, endIndex);

        setIncomes(paginatedData);
        setTotalIncomes(allFiltered.length);
      } else if (Array.isArray(result)) {
        // Filter and paginate array response
        let allFiltered = result.filter(income =>
          income.type === "level_roi_income" || income.income_type === "level_roi_income"
        );

        // Apply level filter if specified
        if (filterLevel) {
          allFiltered = allFiltered.filter(income => income.level == filterLevel);
        }

        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = allFiltered.slice(startIndex, endIndex);

        setIncomes(paginatedData);
        setTotalIncomes(allFiltered.length);
      } else {
        setError('No level ROI income data found');
      }
    } else {
      setError(response.data?.message || 'Failed to fetch level ROI history');
    }
  };

  // Fetch level ROI income data with improved pagination
  const fetchLevelRoiIncomes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();

      // Debug: Log token and request details
      console.log('🔍 Debug Info:');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      console.log('API URL:', API_URL);
      console.log('Full request URL:', `${API_URL}/admin/get-all-incomes`);

      // Check localStorage directly
      const storedToken = localStorage.getItem('admin_token');
      console.log('Token from localStorage:', !!storedToken);
      console.log('Tokens match:', token === storedToken);

      console.log('Request params:', {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || userFilter,
        user_search: userFilter,
        sort_field: sortField,
        sort_direction: sortDirection,
        type: "level_roi_income",
        exact_type_match: true,
        level: filterLevel,
        start_date: startDate,
        end_date: endDate,
        include_user_data: true,
        include_investment_data: true,
      });

      // Check if token exists
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      // First, test authentication with a simple endpoint
      try {
        console.log('🧪 Testing authentication with profile endpoint...');
        const testResponse = await axios.get(`${API_URL}/admin/get-profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('✅ Authentication test successful:', testResponse.status);
      } catch (authTestErr) {
        console.error('❌ Authentication test failed:', authTestErr.response?.status, authTestErr.response?.data);
        if (authTestErr.response?.status === 403 || authTestErr.response?.status === 401) {
          setError('Authentication failed. Please login again.');
          return;
        }
      }

      // Try the regular endpoint first with proper pagination
      try {
        const response = await axios.get(`${API_URL}/admin/get-all-incomes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1,
            limit: rowsPerPage,
            search: searchTerm || userFilter, // Search by user info
            user_search: userFilter, // Additional user search parameter
            sort_field: sortField,
            sort_direction: sortDirection,
            type: "level_roi_income",
            exact_type_match: true, // Ensure exact type matching
            level: filterLevel,
            start_date: startDate,
            end_date: endDate,
            include_user_data: true, // Include user details
            include_investment_data: true, // Include investment details
          },
        });

        processResponse(response);
      } catch (err) {
        console.error('Error with regular endpoint:', err);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);

        // Handle specific error cases
        if (err.response?.status === 403) {
          console.log('🔄 403 error, trying simplified request...');

          // Try with minimal parameters to see if it's a parameter issue
          try {
            const simpleResponse = await axios.get(`${API_URL}/admin/get-all-incomes`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                page: 1,
                limit: 10,
                type: "level_roi_income"
              },
            });

            console.log('✅ Simplified request successful');
            processResponse(simpleResponse);
            return;
          } catch (simpleErr) {
            console.error('❌ Simplified request also failed:', simpleErr.response?.status);
          }

          setError('Access denied. Please check your authentication or contact administrator.');
          return;
        } else if (err.response?.status === 401) {
          setError('Authentication expired. Please login again.');
          return;
        }

        // If the regular endpoint fails, try the direct endpoint with filtering
        console.log('Trying direct endpoint...');
        try {
          const directResponse = await axios.get(`${API_URL}/admin/get-incomes-direct`, {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });

          processDirectResponse(directResponse);
        } catch (directErr) {
          console.error('Direct endpoint also failed:', directErr);
          throw directErr; // Re-throw to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Error fetching level ROI history:', err);

      // Handle specific error cases
      if (err.response?.status === 403) {
        setError('Access denied. Your session may have expired or you may not have permission to access this data.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, page, rowsPerPage, searchTerm, userFilter, sortField, sortDirection, filterLevel, startDate, endDate]);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchLevelRoiIncomes();
  }, [fetchLevelRoiIncomes]);

  // Trigger search when userFilter changes (with debounce effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userFilter !== '') {
        setPage(0);
        fetchLevelRoiIncomes();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [userFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchLevelRoiIncomes();
  };

  // Handle search input change (kept for compatibility)
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle user filter change
  const handleUserFilterChange = (event) => {
    setUserFilter(event.target.value);
  };

  // Handle date filter change
  const handleDateFilterChange = (filterType) => {
    setDateFilter(filterType);
    const today = new Date();
    let startDate, endDate;

    switch (filterType) {
      case 'last3days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 3);
        endDate = today;
        break;
      case 'last7days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = today;
        break;
      case 'last30days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = today;
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      default:
        return; // For 'custom', don't change dates
    }

    if (startDate && endDate) {
      setStartDate(startDate.toISOString().split('T')[0]);
      setEndDate(endDate.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }

    setPage(0); // Reset to first page
  };

  // Handle page change
  const handleChangePage = (_, newPage) => {
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

  // Handle level filter change
  const handleLevelFilterChange = (event) => {
    setFilterLevel(event.target.value);
    setPage(0);
  };

  // Apply date filters
  const applyDateFilters = () => {
    setPage(0);
    fetchLevelRoiIncomes();
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

  // Get level chip color
  const getLevelChipColor = (level) => {
    const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'default'];
    const levelNum = parseInt(level, 10);
    return colors[(levelNum - 1) % colors.length];
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Level ROI Income History"
        subtitle="View all level ROI income distributions"
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
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by user ID, email, name..."
              value={userFilter}
              onChange={handleUserFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant={dateFilter === 'last3days' ? 'contained' : 'outlined'}
                onClick={() => handleDateFilterChange('last3days')}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                3D
              </Button>
              <Button
                size="small"
                variant={dateFilter === 'last7days' ? 'contained' : 'outlined'}
                onClick={() => handleDateFilterChange('last7days')}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                7D
              </Button>
              <Button
                size="small"
                variant={dateFilter === 'last30days' ? 'contained' : 'outlined'}
                onClick={() => handleDateFilterChange('last30days')}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                30D
              </Button>
              <Button
                size="small"
                variant={dateFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => handleDateFilterChange('all')}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                All
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="level-filter-label">Level</InputLabel>
              <Select
                labelId="level-filter-label"
                id="level-filter"
                value={filterLevel}
                onChange={handleLevelFilterChange}
                label="Level"
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="1">Level 1</MenuItem>
                <MenuItem value="2">Level 2</MenuItem>
                <MenuItem value="3">Level 3</MenuItem>
                <MenuItem value="4">Level 4</MenuItem>
                <MenuItem value="5">Level 5</MenuItem>
                <MenuItem value="6">Level 6</MenuItem>
                <MenuItem value="7">Level 7</MenuItem>
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={() => {
                setPage(0);
                fetchLevelRoiIncomes();
              }}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setUserFilter('');
                setStartDate('');
                setEndDate('');
                setFilterLevel('');
                setDateFilter('last3days');
                setPage(0);
                setSortField('created_at');
                setSortDirection('desc');
                // Reset to last 3 days
                const today = new Date();
                const threeDaysAgo = new Date(today);
                threeDaysAgo.setDate(today.getDate() - 3);
                setStartDate(threeDaysAgo.toISOString().split('T')[0]);
                setEndDate(today.toISOString().split('T')[0]);
                fetchLevelRoiIncomes();
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

      {/* Summary Section */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {totalIncomes.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Records
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {formatCurrency(
                  incomes.reduce((sum, income) => sum + (income.amount || 0), 0)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Page Total
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {dateFilter === 'last3days' ? 'Last 3 Days' :
                 dateFilter === 'last7days' ? 'Last 7 Days' :
                 dateFilter === 'last30days' ? 'Last 30 Days' :
                 dateFilter === 'all' ? 'All Time' : 'Custom Range'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Date Filter
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {incomes.length > 0 ?
                  `${((page * rowsPerPage) + 1)}-${Math.min((page + 1) * rowsPerPage, totalIncomes)}` :
                  '0'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing Range
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Level ROI Income Table */}
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
          <Table sx={{ minWidth: 1000 }}>
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
                    onClick={() => handleSort('from_user_id')}
                  >
                    From User {renderSortIcon('from_user_id')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('level')}
                  >
                    Level {renderSortIcon('level')}
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
                    ROI Amount {renderSortIcon('amount')}
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
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading level ROI history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Box>No level ROI income found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                incomes.map((income, index) => (
                  <TableRow key={income._id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Box>
                        {income.user_details ? (
                          <>
                            <Typography variant="body2" fontWeight="medium">
                              {income.user_details.name || income.user_details.username || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {income.user_details.email || 'No email'}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              ID: {income.user_id}
                            </Typography>
                          </>
                        ) : income.user && income.user_email ? (
                          <>
                            <Typography variant="body2" fontWeight="medium">
                              {income.user}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {income.user_email}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              ID: {income.user_id}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            User ID: {income.user_id}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {income.extra?.fromUser ? (
                          <>
                            <Typography variant="body2" fontWeight="medium">
                              {income.extra.fromUser}
                            </Typography>
                            {income.extra?.fromUserEmail && (
                              <Typography variant="caption" color="text.secondary">
                                {income.extra.fromUserEmail}
                              </Typography>
                            )}
                          </>
                        ) : income.from_user_details ? (
                          <>
                            <Typography variant="body2" fontWeight="medium">
                              {income.from_user_details.name || income.from_user_details.username || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {income.from_user_details.email || 'No email'}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {income.from_user_id || 'N/A'}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`Level ${income.level}`}
                        size="small"
                        color={getLevelChipColor(income.level)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(income.amount || 0)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(income.created_at)}
                      </Typography>
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
          count={totalIncomes}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default LevelRoiHistory;
