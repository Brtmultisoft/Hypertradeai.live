import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import UserService from '../../services/user.service';
import ApiService from '../../services/api.service';
import PageHeader from '../../components/PageHeader';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';

const AllTeam = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortField, setSortField] = useState('wallet');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterReferrer, setFilterReferrer] = useState('');
  const [referrers, setReferrers] = useState([]);

  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch users data with optimized API calls
  const fetchUsers = useCallback(async (skipLoading = false) => {
    if (!skipLoading) setLoading(true);
    setError(null);

    try {
      const token = getToken();

      // Use parallel requests to fetch users and any other data we might need
      const response = await UserService.getAllUsers({
        page: page + 1, // API uses 1-based indexing
        limit: rowsPerPage,
        search: debouncedSearchTerm,
        sortField,
        sortDirection,
        referrerEmail: filterReferrer,
        token,
      });

      console.log('API Response:', response);

      if (response.result || response.data) {
        // Handle different response structures
        const result = response?.result || response?.data;
        const users = result?.docs || result?.list || [];
        const total = result?.totalDocs || result?.total || 0;

        setUsers(users);
        setTotalUsers(total);

        // Extract unique referrers for filter dropdown
        if (users.length > 0) {
          const uniqueReferrers = [...new Set(users
            .filter(user => user.referrer_email)
            .map(user => user.referrer_email))];
          setReferrers(uniqueReferrers);
        }

        // Prefetch next page for smoother pagination
        UserService.prefetchNextPage({
          currentPage: page,
          limit: rowsPerPage,
          search: debouncedSearchTerm,
          sortField,
          sortDirection,
          referrerEmail: filterReferrer,
          token,
        });
      } else {
        setError(response?.message || 'Failed to fetch users');
      }
    } catch (err) {
      // Enhanced error logging with more details
      console.error('Error fetching users:', {
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });

      // Set a more descriptive error message based on the error type
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server error: ${err.response.status} ${err.response.statusText} - ${err.response.data?.message || 'Unknown error'}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('Network error: No response received from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${err.message || 'An unknown error occurred while fetching users'}`);
      }
    } finally {
      if (!skipLoading) setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, sortField, sortDirection, filterReferrer, getToken]);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    // Cancel any pending requests when dependencies change
    return () => {
      ApiService.cancelPendingRequest(`users_${page + 1}_${rowsPerPage}_${sortField}_${sortDirection}_${debouncedSearchTerm}_${filterReferrer}`);
    };
  }, [page, rowsPerPage, sortField, sortDirection, debouncedSearchTerm, filterReferrer]);

  // Effect to trigger fetch when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Clean up all pending requests on unmount
  useEffect(() => {
    return () => {
      ApiService.cancelAllRequests();
    };
  }, []);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.name && user.name.toLowerCase().includes(lowerTerm)) ||
      (user.email && user.email.toLowerCase().includes(lowerTerm)) ||
      (user.sponsorID && user.sponsorID.toString().toLowerCase().includes(lowerTerm)) ||
      (user.referrer_email && user.referrer_email.toLowerCase().includes(lowerTerm)) ||
      (user.refer_id && user.refer_id.toLowerCase().includes(lowerTerm))
    );
  }, [users, searchTerm])
  // Handle search - now uses debounced search term
  const handleSearch = useCallback(() => {
    console.log('Searching with term:', searchTerm);
    setPage(0);
    // The actual API call will be triggered by the useEffect that depends on debouncedSearchTerm
  }, [searchTerm]);

  // Handle search input change
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
    // No need to call fetchUsers here, the debounce hook will handle it
  }, []);

  // Handle search on Enter key press - immediately search without waiting for debounce
  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      // Cancel any pending debounced search
      ApiService.cancelPendingRequest(`users_${page + 1}_${rowsPerPage}_${sortField}_${sortDirection}_${searchTerm}_${filterReferrer}`);
      handleSearch();
    }
  }, [handleSearch, page, rowsPerPage, sortField, sortDirection, searchTerm, filterReferrer]);

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

  // Handle referrer filter change
  const handleReferrerFilterChange = (event) => {
    setFilterReferrer(event.target.value);
    setPage(0);
  };

  // Handle login as user with a single click - optimized version
  const handleLoginAsUser = async (userId) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages

      // Get the admin token
      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        return;
      }

      console.log(`Creating login request for user ID: ${userId}`);

      // Close any existing login windows
      try {
        const existingLoginWindow = window.localStorage.getItem('admin_user_login_window');
        if (existingLoginWindow) {
          try {
            const windowRef = window.open('', existingLoginWindow);
            if (windowRef && !windowRef.closed) {
              windowRef.close();
            }
          } catch (closeError) {
            console.warn('Error closing existing window:', closeError);
          }
        }
        window.localStorage.removeItem('admin_user_login_window');
      } catch (sessionError) {
        console.warn('Error checking for existing sessions:', sessionError);
      }

      // Generate a unique ID for this login attempt
      const loginAttemptId = `login_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      window.localStorage.setItem('admin_login_attempt_id', loginAttemptId);

      // Use our optimized UserService to make the API request
      const response = await UserService.createLoginRequest({ userId, token });

      console.log('Login request response:', response);

      if (response && response.status && response.result && response.result.url) {
        // Make sure the URL has the clear=1 parameter to force session clearing
        let loginUrl = response.result.url;
        if (!loginUrl.includes('clear=1')) {
          loginUrl = loginUrl.includes('?')
            ? `${loginUrl}&clear=1`
            : `${loginUrl}?clear=1`;
        }
        console.log(`Opening login URL: ${loginUrl}`);

        // Generate a unique window name
        const windowName = `user_login_${Date.now()}`;
        window.localStorage.setItem('admin_user_login_window', windowName);

        // Try a direct approach first - open the URL directly with clear=1 parameter
        // This should handle the session clearing and login in one step
        const newWindow = window.open(loginUrl, '_blank', 'noopener,noreferrer');

        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          setError('Failed to open login window. Please allow popups for this site.');
          setLoading(false);
        } else {
          // Set up a listener to detect when the window is closed
          const checkWindowClosed = setInterval(() => {
            if (newWindow.closed) {
              clearInterval(checkWindowClosed);
              window.localStorage.removeItem('admin_user_login_window');
              console.log('User login window was closed');
            }
          }, 1000);

          // Show success message
          const username = response.result.username || 'selected user';
          setSuccessMessage(`Successfully opened login session for ${username}. A new tab should have opened with the user already logged in.`);

          // Set loading to false after a short delay
          setTimeout(() => {
            setLoading(false);
          }, 500);
        }
      } else {
        console.error('Failed to create login request or URL not found:', response);
        setError(response?.msg || 'Failed to create login request');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error creating login request:', err);
      setError(err.response?.data?.msg || 'An error occurred while creating login request');
      setLoading(false);
    }
  };

  // Render sort icon
  const renderSortIcon = (field) => {
    // If this is not the active sort field and it's not the wallet field, return null
    if (sortField !== field && field !== 'wallet') return null;

    // For wallet field, always show the sort icon (default to descending)
    if (field === 'wallet') {
      return sortField === field && sortDirection === 'asc' ? (
        <ArrowUpwardIcon fontSize="small" />
      ) : (
        <ArrowDownwardIcon fontSize="small" />
      );
    }

    // For other fields, show the appropriate icon based on sort direction
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon fontSize="small" />
    ) : (
      <ArrowDownwardIcon fontSize="small" />
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="All Team Members"
        subtitle="Manage all users and their referral relationships"
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name, email, username, sponsor ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="referrer-filter-label">Filter by Referrer</InputLabel>
              <Select
                labelId="referrer-filter-label"
                id="referrer-filter"
                value={filterReferrer}
                onChange={handleReferrerFilterChange}
                label="Filter by Referrer"
              >
                <MenuItem value="">All Referrers</MenuItem>
                {referrers.map((referrer) => (
                  <MenuItem key={referrer} value={referrer}>
                    {referrer}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                // Cancel any pending requests
                ApiService.cancelAllRequests();

                // Clear the API cache to ensure fresh data
                ApiService.clearCache();

                // Reset all filters
                setSearchTerm('');
                setFilterReferrer('');
                setPage(0);
                setSortField('wallet');
                setSortDirection('desc');

                // Fetch fresh data
                fetchUsers();
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

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Users Table */}
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
                    onClick={() => handleSort('sponsorID')}
                  >
                    Sponsor ID {renderSortIcon('sponsorID')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('name')}
                  >
                    Name {renderSortIcon('name')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('email')}
                  >
                    Email {renderSortIcon('email')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('phone_number')}
                  >
                    Phone No.
                    {renderSortIcon('phone_no')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('referred_by')}
                  >
                    Referred By {renderSortIcon('referred_by')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: theme.palette.primary.main, // Highlight this column by default
                    }}
                    onClick={() => handleSort('wallet')}
                  >
                    Wallet (Max First) {renderSortIcon('wallet')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('wallet_topup')}
                  >
                    Topup Wallet {renderSortIcon('wallet_topup')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('total_investment')}
                  >
                    Total Investment {renderSortIcon('total_investment')}
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
                    Joined On {renderSortIcon('created_at')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading users...
                      {error && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          sx={{ mt: 2 }}
                          onClick={async () => {
                            try {
                              setError('Checking API connection...');
                              // Try a direct API call to diagnose the issue
                              const token = getToken();
                              const response = await fetch(`${API_URL}/admin/get-all-users?page=1&limit=1`, {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                }
                              });

                              if (response.ok) {
                                const data = await response.json();
                                setError(`API is working. Response: ${JSON.stringify(data).substring(0, 100)}...`);
                              } else {
                                const text = await response.text();
                                setError(`API error: ${response.status} ${response.statusText} - ${text}`);
                              }
                            } catch (err) {
                              setError(`Connection test failed: ${err.message}`);
                            }
                          }}
                        >
                          Check API Connection
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Box>No users found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user,index) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{index+1}</TableCell>
                    <TableCell>{user.sponsorID || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        sx={{ textTransform: 'none', fontWeight: 'normal', p: 0, minWidth: 'auto' }}
                        onClick={() => handleLoginAsUser(user._id)}
                      >
                        {user.name}
                      </Button>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        sx={{ textTransform: 'none', fontWeight: 'normal', p: 0, minWidth: 'auto' }}
                        onClick={() => handleLoginAsUser(user._id)}
                      >
                        {user.phone_number
                        }
                      </Button>
                    </TableCell>
                    <TableCell>
                      {user.refer_id ? (
                        user.referrer_email ? (
                          <Chip
                            label={`${user.referrer_name || 'User'} `}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label={user.refer_id}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )
                      ) : (
                        <Chip
                          label="Admin"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(user.wallet || 0)}</TableCell>
                    <TableCell>{formatCurrency(user.wallet_topup || 0)}</TableCell>
                    <TableCell>{formatCurrency(user.total_investment || 0)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        // onClick={() => handleViewUser(user._id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => navigate(`/edit-user/${user._id}`)}
                        >
                          <EditIcon fontSize="small" />
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
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default AllTeam;