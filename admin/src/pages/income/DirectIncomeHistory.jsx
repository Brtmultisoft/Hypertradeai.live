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
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
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

const DirectIncomeHistory = () => {
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

  // Process API response
  const processResponse = (response) => {
    console.log('Income API Response:', response.data);

    if (response.data.status) {
      // Check if we have data in different formats and handle accordingly
      if (response.data.result && response.data.result.list) {
        console.log('Using list format:', response.data.result.list);
        // Filter for referral_bonus type if needed
        const filteredList = response.data.result.list.filter(income =>
          income.type === "referral_bonus" || income.income_type === "referral_bonus"
        );
        setIncomes(filteredList || []);
        setTotalIncomes(filteredList.length || 0);
      } else if (response.data.result && response.data.result.docs) {
        console.log('Using docs format:', response.data.result.docs);
        // Filter for referral_bonus type if needed
        const filteredDocs = response.data.result.docs.filter(income =>
          income.type === "referral_bonus" || income.income_type === "referral_bonus"
        );
        setIncomes(filteredDocs || []);
        setTotalIncomes(filteredDocs.length || 0);
      } else if (response.data.result && Array.isArray(response.data.result)) {
        // Filter the array for direct income
        const filteredIncomes = response.data.result.filter(income =>
          income.type === "referral_bonus" || income.income_type === "referral_bonus"
        );
        console.log('Using array format (filtered):', filteredIncomes);
        setIncomes(filteredIncomes);
        setTotalIncomes(filteredIncomes.length || 0);
      } else {
        setError(response.data?.message || 'Failed to fetch direct income history');
      }
    } else {
      setError(response.data?.message || 'Failed to fetch direct income history');
    }
  };

  // Fetch direct income data
  const fetchDirectIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();

      // Try the regular endpoint first
      try {
        const response = await axios.get(`${API_URL}/admin/get-all-incomes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1,
            limit: rowsPerPage,
            search: searchTerm,
            sort_field: sortField,
            sort_direction: sortDirection,
            type: "referral_bonus", // Filter by referral_bonus type
            start_date: startDate,
            end_date: endDate,
          },
        });

        processResponse(response);
      } catch (err) {
        console.error('Error with regular endpoint:', err);

        // If the regular endpoint fails, try the direct endpoint
        console.log('Trying direct endpoint...');
        const directResponse = await axios.get(`${API_URL}/admin/get-incomes-direct`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        processResponse(directResponse);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching direct income history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchDirectIncomes();
  }, [page, rowsPerPage, sortField, sortDirection]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchDirectIncomes();
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

  // Apply date filters
  const applyDateFilters = () => {
    setPage(0);
    fetchDirectIncomes();
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
        title="Direct Income History"
        subtitle="View all direct referral income distributions"
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
              placeholder="Search by user..."
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
                setPage(0);
                setSortField('created_at');
                setSortDirection('desc');
                fetchDirectIncomes();
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

      {/* Direct Income Table */}
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
                     User ID {renderSortIcon('from_user_id')}
                  </Box>
                </TableCell>
                {/* <TableCell sx={{ fontWeight: 'bold' }}>
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
                </TableCell> */}
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
                      Loading direct income history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : incomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Box>No direct income found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                incomes.map((income) => (
                  <TableRow key={income._id} hover>
                    <TableCell>
                      {income.user_details ? (
                        `${income.user_details.name} (${income.user_details.email})`
                      ) : income.user && income.user_email ? (
                        `${income.user} (${income.user_email})`
                      ) : (
                        income.user_id
                      )}
                    </TableCell>
                    <TableCell>
                      {income.from_user_details ? (
                        `${income.from_user_details.name} (${income.from_user_details.email})`
                      ) : income.user_from && income.user_from_email ? (
                        `${income.user_from} (${income.user_from_email})`
                      ) : (
                        income.user_id
                      )}
                    </TableCell>
                    {/* <TableCell>{income.investment_id || 'N/A'}</TableCell> */}
                    <TableCell>{formatCurrency(income.amount || 0)}</TableCell>
                    <TableCell>{formatDate(income.created_at)}</TableCell>
                    {/* <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewIncome(income._id)}
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

export default DirectIncomeHistory;
