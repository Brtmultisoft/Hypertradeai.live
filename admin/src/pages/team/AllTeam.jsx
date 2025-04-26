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
  Edit as EditIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';

const AllTeam = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterReferrer, setFilterReferrer] = useState('');
  const [referrers, setReferrers] = useState([]);

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-all-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          sort_field: sortField,
          sort_direction: sortDirection,
          referrer: filterReferrer,
        },
      });
      console.log(response.data)
      if (response.data.result && response.data.result.list) {
        setUsers(response.data.result.list || []);
        setTotalUsers(response.data.result.total || 0);

        // Extract unique referrers for filter dropdown
        if (response.data.result.list) {
          const uniqueReferrers = [...new Set(response.data.result.docs
            .filter(user => user.referred_by)
            .map(user => user.referred_by))];
          setReferrers(uniqueReferrers);
        }
      } else {
        setError(response.data?.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, sortField, sortDirection, filterReferrer]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
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

  // Handle referrer filter change
  const handleReferrerFilterChange = (event) => {
    setFilterReferrer(event.target.value);
    setPage(0);
  };

  // Handle login as user
  const handleLoginAsUser = async (userId) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // Get the admin token
      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        return;
      }

      console.log(`Creating login request for user ID: ${userId}`);

      // First, check if there's an existing user session and close it
      try {
        // Find any existing user login windows
        const existingLoginWindow = window.localStorage.getItem('admin_user_login_window');
        if (existingLoginWindow) {
          console.log('Found existing user login window, attempting to close it');
          try {
            // Try to close the existing window if it's still open
            const windowRef = window.open('', existingLoginWindow);
            if (windowRef && !windowRef.closed) {
              windowRef.close();
            }
          } catch (closeError) {
            console.warn('Error closing existing window:', closeError);
            // Continue even if we can't close the window
          }
        }

        // Clear any stored window references
        window.localStorage.removeItem('admin_user_login_window');
      } catch (sessionError) {
        console.warn('Error checking for existing sessions:', sessionError);
        // Continue even if there's an error checking for existing sessions
      }

      // Generate a unique ID for this login attempt
      const loginAttemptId = `login_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Store the login attempt ID
      window.localStorage.setItem('admin_login_attempt_id', loginAttemptId);

      // Make the API request to create a login request
      let response;
      try {
        // First try with the clear_existing parameter and login attempt ID
        response = await axios.post(
          `${API_URL}/admin/user-login-request`,
          {
            user_id: userId,
            clear_existing: true, // Tell the server to clear any existing sessions
            login_attempt_id: loginAttemptId // Include the login attempt ID
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (apiError) {
        console.warn('Error with clear_existing parameter, trying without it:', apiError);

        // If that fails, try without the clear_existing parameter
        // This handles backward compatibility with older server versions
        response = await axios.post(
          `${API_URL}/admin/user-login-request`,
          {
            user_id: userId,
            login_attempt_id: loginAttemptId // Still include the login attempt ID
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      console.log('Login request response:', response.data);

      if (response.data && response.data.status) {
        // Check if the URL is in the response
        if (response.data.result && response.data.result.url) {
          const loginUrl = response.data.result.url;
          console.log(`Opening login URL: ${loginUrl}`);

          // Generate a unique window name to ensure a new tab is always opened
          const windowName = `user_login_${Date.now()}`;

          // Store the window name for future reference
          window.localStorage.setItem('admin_user_login_window', windowName);

          // Open the login URL in a new tab with specific options
          const newWindow = window.open(loginUrl, windowName, 'noopener,noreferrer');

          // Check if the window was successfully opened
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.error('Failed to open new window. Popup might be blocked.');
            setError('Failed to open login window. Please allow popups for this site.');
          } else {
            // Set up a listener to detect when the window is closed
            const checkWindowClosed = setInterval(() => {
              if (newWindow.closed) {
                clearInterval(checkWindowClosed);
                window.localStorage.removeItem('admin_user_login_window');
                console.log('User login window was closed');
              }
            }, 1000);
          }
        } else {
          console.error('Login URL not found in response:', response.data);
          setError('Login URL not found in response');
        }
      } else {
        console.error('Failed to create login request:', response.data);
        setError(response.data?.msg || 'Failed to create login request');
      }
    } catch (err) {
      console.error('Error creating login request:', err);
      setError(err.response?.data?.msg || 'An error occurred while creating login request');
    } finally {
      setLoading(false);
    }
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
              placeholder="Search by name, email, username..."
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
                setSearchTerm('');
                setFilterReferrer('');
                setPage(0);
                setSortField('created_at');
                setSortDirection('desc');
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
                    onClick={() => handleSort('username')}
                  >
                    Username {renderSortIcon('username')}
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
                    }}
                    onClick={() => handleSort('wallet')}
                  >
                    Wallet {renderSortIcon('wallet')}
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
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading users...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Box>No users found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id} hover>
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
                        {user.username}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {user.refer_id ? (
                        <Chip
                          label={user.refer_id}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
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
                          // onClick={() => handleEditUser(user._id)}
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
