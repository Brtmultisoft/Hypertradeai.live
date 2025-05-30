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

const DailyRoiHistory = () => {
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

  // Fetch daily ROI income data with improved pagination
  const fetchDailyRoiIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();

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
            type: "daily_profit",
            exact_type_match: true, // Ensure exact type matching
            start_date: startDate,
            end_date: endDate,
            include_user_data: true, // Include user details
            include_investment_data: true, // Include investment details
          },
        });

        processResponse(response);
      } catch (err) {
        console.error('Error with regular endpoint:', err);

        // If the regular endpoint fails, try the direct endpoint with filtering
        console.log('Trying direct endpoint...');
        const directResponse = await axios.get(`${API_URL}/admin/get-incomes-direct`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        processDirectResponse(directResponse);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching daily ROI history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process API response with improved pagination handling
  const processResponse = (response) => {
    console.log('Income API Response:', response.data);

    if (response.data.status) {
      const result = response.data.result || response.data.data;

      // Handle paginated response format
      if (result && result.list) {
        console.log('Using paginated list format:', result);
        const filteredList = result.list.filter(income =>
          income.type === "daily_profit" || income.income_type === "daily_profit"
        );
        setIncomes(filteredList || []);
        // Use the total from pagination info, not filtered length
        setTotalIncomes(result.total || result.totalPages * result.limit || 0);
      } else if (result && result.docs) {
        console.log('Using paginated docs format:', result);
        const filteredDocs = result.docs.filter(income =>
          income.type === "daily_profit" || income.income_type === "daily_profit"
        );
        setIncomes(filteredDocs || []);
        setTotalIncomes(result.total || result.totalPages * result.limit || 0);
      } else if (result && Array.isArray(result)) {
        // Handle direct array response (fallback)
        const filteredIncomes = result.filter(income =>
          income.type === "daily_profit" || income.income_type === "daily_profit"
        );
        console.log('Using array format (filtered):', filteredIncomes);
        setIncomes(filteredIncomes);
        setTotalIncomes(filteredIncomes.length);
      } else {
        setError(response.data?.message || 'Failed to fetch daily ROI history');
      }
    } else {
      setError(response.data?.message || 'Failed to fetch daily ROI history');
    }
  };

  // Process direct endpoint response (fallback)
  const processDirectResponse = (response) => {
    console.log('Direct Income API Response:', response.data);

    if (response.data.status) {
      const result = response.data.result || response.data.data;

      if (result && result.list) {
        // Filter for daily_profit type and apply pagination manually
        const allFiltered = result.list.filter(income =>
          income.type === "daily_profit" || income.income_type === "daily_profit"
        );

        // Apply manual pagination
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = allFiltered.slice(startIndex, endIndex);

        setIncomes(paginatedData);
        setTotalIncomes(allFiltered.length);
      } else if (Array.isArray(result)) {
        // Filter and paginate array response
        const allFiltered = result.filter(income =>
          income.type === "daily_profit" || income.income_type === "daily_profit"
        );

        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = allFiltered.slice(startIndex, endIndex);

        setIncomes(paginatedData);
        setTotalIncomes(allFiltered.length);
      } else {
        setError('No daily ROI income data found');
      }
    } else {
      setError(response.data?.message || 'Failed to fetch daily ROI history');
    }
  };

  // Fetch complete daily ROI data across all pages
  const fetchCompleteData = useCallback(async () => {
    setFetchingComplete(true);
    try {
      const token = getToken();
      let allIncomes = [];
      let totalAmount = 0;
      let currentPage = 1;
      let hasMoreData = true;
      const limit = 100; // Fetch in larger chunks for efficiency

      console.log('Starting complete data fetch...');

      while (hasMoreData) {
        try {
          const response = await axios.get(`${API_URL}/admin/get-all-incomes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              page: currentPage,
              limit: limit,
              search: searchTerm,
              sort_field: sortField,
              sort_direction: sortDirection,
              type: "daily_profit",
              exact_type_match: true,
              start_date: startDate,
              end_date: endDate,
            },
          });

          if (response.data.status) {
            const result = response.data.result || response.data.data;

            if (result && result.list) {
              const filteredList = result.list.filter(income =>
                income.type === "daily_profit" || income.income_type === "daily_profit"
              );

              allIncomes = [...allIncomes, ...filteredList];

              // Calculate total amount
              filteredList.forEach(income => {
                if (income.amount && typeof income.amount === 'number') {
                  totalAmount += income.amount;
                }
              });

              // Check if we have more pages
              hasMoreData = result.list.length === limit && currentPage < (result.totalPages || 1);
              currentPage++;

              console.log(`Fetched page ${currentPage - 1}, got ${filteredList.length} records, total so far: ${allIncomes.length}`);
            } else {
              hasMoreData = false;
            }
          } else {
            hasMoreData = false;
          }
        } catch (err) {
          console.error(`Error fetching page ${currentPage}:`, err);
          hasMoreData = false;
        }
      }

      // Update complete data stats
      setCompleteDataStats({
        totalAmount,
        totalRecords: allIncomes.length,
        lastUpdated: new Date()
      });

      console.log(`Complete data fetch finished. Total records: ${allIncomes.length}, Total amount: ${totalAmount}`);

    } catch (err) {
      console.error('Error fetching complete data:', err);
      setError('Failed to fetch complete data');
    } finally {
      setFetchingComplete(false);
    }
  }, [getToken, searchTerm, sortField, sortDirection, startDate, endDate]);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchDailyRoiIncomes();
  }, [page, rowsPerPage, sortField, sortDirection]);

  // Trigger search when userFilter changes (with debounce effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userFilter !== '') {
        setPage(0);
        fetchDailyRoiIncomes();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [userFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchDailyRoiIncomes();
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

  // Apply date filters
  const applyDateFilters = () => {
    setPage(0);
    fetchDailyRoiIncomes();
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

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Daily ROI Income History"
        subtitle="View all daily ROI income distributions"
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<DateRangeIcon />}
              onClick={applyDateFilters}
            >
              Apply Dates
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
                fetchDailyRoiIncomes();
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
                fetchDailyRoiIncomes();
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

      {/* Daily ROI Income Table */}
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
                    onClick={() => handleSort('investment_id')}
                  >
                    Investment ID {renderSortIcon('investment_id')}
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
                  Investment Amount
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
                      Loading daily ROI history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Box>No daily ROI income found</Box>
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
                      <Chip
                        label={income.investment_id || 'N/A'}
                        size="small"
                        variant="outlined"
                        color={income.investment_id ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        {formatCurrency(income.amount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {
                          formatCurrency(income.extra.investmentAmount) 

                        }
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

export default DailyRoiHistory;
