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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Block as BlockIcon,
  LockOpen as UnblockIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import UserService from '../../services/user.service';
import ApiService from '../../services/api.service';
import axios from 'axios';
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
  const [blockingUser, setBlockingUser] = useState(null);
  const [unblockingUser, setUnblockingUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showUnblockDialog, setShowUnblockDialog] = useState(false);

  // User details dialog state
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  // Use debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Add state for create user modal and form fields
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState(null);
  const [createUserFields, setCreateUserFields] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    refer_id: 'admin',
    referrerEmail: '',
  });
  const [referrerLoading, setReferrerLoading] = useState(false);
  const [sponsorIdReadOnly, setSponsorIdReadOnly] = useState(false);

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
        // setError(response?.message || 'Failed to fetch users');
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

  // Open block dialog
  const openBlockDialog = (userId) => {
    setBlockingUser(userId);
    setBlockReason('Blocked by administrator');
    setShowBlockDialog(true);
  };

  // Close block dialog
  const closeBlockDialog = () => {
    setShowBlockDialog(false);
    setBlockingUser(null);
    setBlockReason('');
  };

  // Handle block user
  const handleBlockUser = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Get the admin token
      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        closeBlockDialog();
        return;
      }

      // Call the API to block the user
      const response = await UserService.blockUser({
        userId: blockingUser,
        reason: blockReason,
        token,
      });

      if (response && response.status) {
        setSuccessMessage(response.msg || 'User has been blocked successfully');
        // Refresh the user list
        fetchUsers();
        closeBlockDialog();
      } else {
        setError(response?.msg || 'Failed to block user');
        closeBlockDialog();
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      setError(err.response?.data?.msg || 'An error occurred while blocking the user');
      closeBlockDialog();
    } finally {
      setLoading(false);
    }
  };

  // Open unblock dialog
  const openUnblockDialog = (userId) => {
    setUnblockingUser(userId);
    setShowUnblockDialog(true);
  };

  // Close unblock dialog
  const closeUnblockDialog = () => {
    setShowUnblockDialog(false);
    setUnblockingUser(null);
  };

  // Handle unblock user
  const handleUnblockUser = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Get the admin token
      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        closeUnblockDialog();
        return;
      }

      // Call the API to unblock the user
      const response = await UserService.unblockUser({
        userId: unblockingUser,
        token,
      });

      if (response && response.status) {
        setSuccessMessage(response.msg || 'User has been unblocked successfully');
        // Refresh the user list
        fetchUsers();
        closeUnblockDialog();
      } else {
        setError(response?.msg || 'Failed to unblock user');
        closeUnblockDialog();
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
      setError(err.response?.data?.msg || 'An error occurred while unblocking the user');
      closeUnblockDialog();
    } finally {
      setLoading(false);
    }
  };

  // Handle view user details
  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      // Get the admin token
      const token = getToken();
      if (!token) {
        setError('Admin authentication token not found. Please log in again.');
        return;
      }

      console.log(`Fetching user details for ID: ${userId}`);

      // Try direct axios call first as a fallback
      try {
        const directResponse = await axios.get(`${API_URL}/admin/get-user/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Direct API call response:', directResponse.data);

        if (directResponse.data && directResponse.data.status) {
          const userData = directResponse.data.data || directResponse.data.result;
          if (!userData) {
            throw new Error('User data not found in the response');
          }

          console.log('Setting user details from direct call:', userData);
          setSelectedUserDetails(userData);
          setShowUserDetailsDialog(true);
          setLoading(false);
          return;
        }
      } catch (directError) {
        console.error('Direct API call failed, trying UserService:', directError);
      }

      // If direct call fails, try the UserService
      const response = await UserService.getUserById(userId, token);

      console.log('UserService response:', response);

      if (response && response.status) {
        const userData = response.data || response.result;
        if (!userData) {
          console.error('User data is null or undefined');
          setError('User data not found in the response');
          setLoading(false);
          return;
        }

        console.log('Setting user details from UserService:', userData);
        setSelectedUserDetails(userData);
        setShowUserDetailsDialog(true);
      } else {
        console.error('Failed to fetch user details:', response);
        setError(response?.msg || 'Failed to fetch user details');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data?.msg || 'Server error while fetching user details');
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response received from server. Please check your connection.');
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Close user details dialog
  const closeUserDetailsDialog = () => {
    setShowUserDetailsDialog(false);
    setSelectedUserDetails(null);
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
          // setError('Failed to open login window. Please allow popups for this site.');
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

  // Open/close create user dialog
  const openCreateUserDialog = () => {
    setCreateUserFields({ name: '', email: '', password: '', phone_number: '', refer_id: 'admin', referrerEmail: '' });
    setCreateUserError(null);
    setSponsorIdReadOnly(false);
    setShowCreateUserDialog(true);
  };
  const closeCreateUserDialog = () => {
    setShowCreateUserDialog(false);
    setCreateUserError(null);
  };

  // Handle form field changes
  const handleCreateUserFieldChange = (e) => {
    setCreateUserFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'referrerEmail') {
      if (!e.target.value) setSponsorIdReadOnly(false);
    }
  };

  // Handle referrer email blur to auto-fill sponsorID
  const handleReferrerEmailBlur = async () => {
    const email = createUserFields.referrerEmail.trim();
    if (!email) {
      setSponsorIdReadOnly(false);
      setCreateUserFields((prev) => ({ ...prev, refer_id: 'admin' }));
      return;
    }
    setReferrerLoading(true);
    setCreateUserError(null);
    try {
      const token = getToken();
      if (!token) {
        setCreateUserError('Admin authentication token not found. Please log in again.');
        setReferrerLoading(false);
        return;
      }
      // Try to fetch user by email
      let response;
      if (UserService.getUserByEmail) {
        response = await UserService.getUserByEmail(email, token);
      } else {
        response = await axios.get(`${API_URL}/admin/get-user-by-email/${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        response = response.data;
      }
      if (response && response.status && (response.data || response.result)) {
        const user = response.data || response.result;
        setCreateUserFields((prev) => ({ ...prev, refer_id: user.sponsorID || 'admin' }));
        setSponsorIdReadOnly(true);
      } else {
        setCreateUserFields((prev) => ({ ...prev, refer_id: 'admin' }));
        setCreateUserError('Referrer email not found.');
        setSponsorIdReadOnly(false);
      }
    } catch (err) {
      setCreateUserFields((prev) => ({ ...prev, refer_id: 'admin' }));
      setCreateUserError('Referrer email not found.');
      setSponsorIdReadOnly(false);
    } finally {
      setReferrerLoading(false);
    }
  };

  // Handle create user submit
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserError(null);
    try {
      const token = getToken();
      if (!token) {
        setCreateUserError('Admin authentication token not found. Please log in again.');
        setCreateUserLoading(false);
        return;
      }
      // Use refer_id for backend, default to 'admin'
      const payload = {
        ...createUserFields,
        refer_id: createUserFields.refer_id || 'admin',
      };
      // Remove sponsorID and referrerEmail from payload
      delete payload.sponsorID;
      delete payload.referrerEmail;
      // Use UserService or direct API call
      let response;
      if (UserService.createUser) {
        response = await UserService.createUser({ ...payload, token });
      } else {
        response = await axios.post(`${API_URL}/admin/create-user`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        response = response.data;
      }
      if (response && (response.status || response.success)) {
        setSuccessMessage('User created successfully!');
        closeCreateUserDialog();
        fetchUsers();
      } else {
        setCreateUserError(response?.msg || response?.message || 'Failed to create user');
      }
    } catch (err) {
      setCreateUserError(err.response?.data?.msg || err.message || 'An error occurred while creating user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="All Team Members"
        subtitle="Manage all users and their referral relationships"
      />

      {/* Create User Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" color="primary" onClick={openCreateUserDialog}>
          Create User
        </Button>
      </Box>

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
                    S.No. {renderSortIcon('transaction_id')}
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
                    Wallet (Max) {renderSortIcon('wallet')}
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                          color="primary"
                          sx={{ textTransform: 'none', fontWeight: 'normal', p: 0, minWidth: 'auto' }}
                          onClick={() => handleLoginAsUser(user._id)}
                        >
                          {user.name}
                        </Button>
                        {user.is_blocked && (
                          <Tooltip title={user.block_reason || 'User is blocked'}>
                            <Chip
                              icon={<WarningIcon />}
                              label="Blocked"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
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
                          onClick={() => handleViewUser(user._id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          color="secondary"
                          sx={{ mr: 1 }}
                          onClick={() => navigate(`/edit-user/${user._id}`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.is_blocked ? "Unblock User" : "Block User"}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!user.is_blocked}
                              onChange={() => user.is_blocked ? openUnblockDialog(user._id) : openBlockDialog(user._id)}
                              color={user.is_blocked ? "error" : "success"}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="caption" color={user.is_blocked ? "error" : "success"}>
                              {user.is_blocked ? "Blocked" : "Active"}
                            </Typography>
                          }
                          sx={{ ml: 0, mr: 0 }}
                        />
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

      {/* Block User Dialog */}
      <Dialog
        open={showBlockDialog}
        onClose={closeBlockDialog}
        aria-labelledby="block-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderTop: '4px solid',
            borderColor: 'error.main',
            borderRadius: '8px',
          }
        }}
      >
        <DialogTitle id="block-dialog-title">
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
              <BlockIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Block User Account</Typography>
              <Typography variant="caption" color="text.secondary">
                This action will prevent the user from accessing the platform
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
            <Typography variant="body2">
              <strong>Warning:</strong> Blocking this user will prevent them from logging in and using the platform.
              They will not be able to activate daily trading or access any features.
            </Typography>
          </Box>

          <TextField
            autoFocus
            margin="dense"
            id="block-reason"
            label="Reason for blocking"
            placeholder="Please provide a reason for blocking this user"
            type="text"
            fullWidth
            variant="outlined"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            helperText="This reason will be shown to the user when they attempt to log in"
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeBlockDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleBlockUser}
            variant="contained"
            color="error"
            startIcon={<BlockIcon />}
            disabled={!blockReason.trim()}
          >
            Block User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unblock User Dialog */}
      <Dialog
        open={showUnblockDialog}
        onClose={closeUnblockDialog}
        aria-labelledby="unblock-dialog-title"
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderTop: '4px solid',
            borderColor: 'success.main',
            borderRadius: '8px',
          }
        }}
      >
        <DialogTitle id="unblock-dialog-title">
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
              <UnblockIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">Unblock User Account</Typography>
              <Typography variant="caption" color="text.secondary">
                This action will restore user access to the platform
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.dark' }}>
            <Typography variant="body2">
              <strong>Note:</strong> Unblocking this user will allow them to log in and use the platform again.
              They will be able to activate daily trading and access all features.
            </Typography>
          </Box>

          <DialogContentText>
            Are you sure you want to unblock this user?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeUnblockDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleUnblockUser}
            variant="contained"
            color="success"
            startIcon={<UnblockIcon />}
          >
            Unblock User
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog
        open={showUserDetailsDialog}
        onClose={closeUserDetailsDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar
                src={selectedUserDetails?.avatar}
                sx={{
                  width: 56,
                  height: 56,
                  mr: 2,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              >
                {selectedUserDetails?.name?.charAt(0) || selectedUserDetails?.username?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {selectedUserDetails?.name || 'User Details'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedUserDetails?.email || 'No email available'}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={closeUserDetailsDialog} edge="end">
              <ArrowBackIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {selectedUserDetails && selectedUserDetails._id ? (
            <Box sx={{ p: 0 }}>
              <Grid container spacing={0}>
                {/* Left Column - Basic Information */}
                <Grid item xs={12} md={6} sx={{ borderRight: { md: `1px solid ${theme.palette.divider}` } }}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, mb: 2 }}>
                      Basic Information
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails._id || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Sponsor ID</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.sponsorID || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.username || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Phone Number</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.phone_number || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip
                          label={selectedUserDetails.status ? "Active" : "Inactive"}
                          color={selectedUserDetails.status ? "success" : "error"}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Block Status</Typography>
                        <Chip
                          label={selectedUserDetails.is_blocked ? "Blocked" : "Not Blocked"}
                          color={selectedUserDetails.is_blocked ? "error" : "success"}
                          size="small"
                        />
                      </Grid>

                      {selectedUserDetails.is_blocked && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Block Reason</Typography>
                          <Typography variant="body2" color="error" gutterBottom>
                            {selectedUserDetails.block_reason || 'No reason provided'}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Joined On</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.created_at ? formatDate(selectedUserDetails.created_at) : 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.updated_at ? formatDate(selectedUserDetails.updated_at) : 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Referred By</Typography>
                        <Typography variant="body2" gutterBottom>
                          {selectedUserDetails.referrer_name ? (
                            `${selectedUserDetails.referrer_name} (${selectedUserDetails.referrer_email || 'No email'})`
                          ) : (
                            selectedUserDetails.refer_id === 'admin' ? 'Admin' : (selectedUserDetails.refer_id || 'N/A')
                          )}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, mb: 2, mt: 4 }}>
                      Location Information
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Country</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.country || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Country Code</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.country_code || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">State</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.state || 'N/A'}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">City</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.city || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* Right Column - Financial Information */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, mb: 2 }}>
                      Financial Information
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Main Wallet</Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary" gutterBottom>
                          {formatCurrency(selectedUserDetails.wallet || 0)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Topup Wallet</Typography>
                        <Typography variant="body1" fontWeight="bold" color="secondary" gutterBottom>
                          {formatCurrency(selectedUserDetails.wallet_topup || 0)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Total Investment</Typography>
                        <Typography variant="body2" gutterBottom>{formatCurrency(selectedUserDetails.total_investment || 0)}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Last Investment Amount</Typography>
                        <Typography variant="body2" gutterBottom>{formatCurrency(selectedUserDetails.last_investment_amount || 0)}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Reward Points</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.reward || 0}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Rank</Typography>
                        <Chip
                          label={selectedUserDetails.rank || 'ACTIVE'}
                          color="primary"
                          size="small"
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, mb: 2, mt: 4 }}>
                      Trading Information
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Daily Profit Activated</Typography>
                        <Chip
                          label={selectedUserDetails.dailyProfitActivated ? "Yes" : "No"}
                          color={selectedUserDetails.dailyProfitActivated ? "success" : "default"}
                          size="small"
                        />
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Last Activation</Typography>
                        <Typography variant="body2" gutterBottom>
                          {selectedUserDetails.lastDailyProfitActivation ?
                            (typeof selectedUserDetails.lastDailyProfitActivation === 'string' ?
                              formatDate(selectedUserDetails.lastDailyProfitActivation) :
                              selectedUserDetails.lastDailyProfitActivation.toString()) :
                            'Never'}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Trade Booster</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.trade_booster || 0}%</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Level ROI Income</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.level_roi_income || 0}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                        <Typography variant="body2" gutterBottom>
                          {selectedUserDetails.last_login_date ?
                            (typeof selectedUserDetails.last_login_date === 'string' ?
                              formatDate(selectedUserDetails.last_login_date) :
                              selectedUserDetails.last_login_date.toString()) :
                            'Never'}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Daily Logins</Typography>
                        <Typography variant="body2" gutterBottom>{selectedUserDetails.daily_logins || 0}</Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1, mb: 2, mt: 4 }}>
                      Wallet Addresses
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Wallet Address</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }} gutterBottom>
                          {selectedUserDetails.wallet_address || 'N/A'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Withdraw Wallet</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }} gutterBottom>
                          {selectedUserDetails.withdraw_wallet || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 5 }}>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography variant="h6" color="error" gutterBottom>
                    Error Loading User Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {error || 'Could not load user details. Please try again.'}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      if (selectedUserDetails?._id) {
                        handleViewUser(selectedUserDetails._id);
                      } else {
                        closeUserDetailsDialog();
                      }
                    }}
                  >
                    Retry
                  </Button>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => {
              closeUserDetailsDialog();
              if (selectedUserDetails?._id) {
                navigate(`/edit-user/${selectedUserDetails._id}`);
              }
            }}
            color="primary"
            startIcon={<EditIcon />}
          >
            Edit User
          </Button>

          <Button
            onClick={closeUserDetailsDialog}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={showCreateUserDialog}
        onClose={closeCreateUserDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '8px' } }}
      >
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateUser} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Name"
              name="name"
              value={createUserFields.name}
              onChange={handleCreateUserFieldChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={createUserFields.email}
              onChange={handleCreateUserFieldChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={createUserFields.password}
              onChange={handleCreateUserFieldChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone Number"
              name="phone_number"
              value={createUserFields.phone_number}
              onChange={handleCreateUserFieldChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Referrer Email (optional)"
              name="referrerEmail"
              value={createUserFields.referrerEmail}
              onChange={handleCreateUserFieldChange}
              onBlur={handleReferrerEmailBlur}
              helperText={referrerLoading ? 'Looking up referrer...' : 'Enter email to auto-fill Sponsor ID'}
              disabled={referrerLoading}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Referral ID (defaults to admin)"
              name="refer_id"
              value={createUserFields.refer_id}
              onChange={handleCreateUserFieldChange}
              InputProps={{ readOnly: sponsorIdReadOnly }}
            />
            {createUserError && (
              <Alert severity="error" sx={{ mt: 2 }}>{createUserError}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateUserDialog} disabled={createUserLoading}>Cancel</Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            color="primary"
            disabled={createUserLoading || !createUserFields.name || !createUserFields.email || !createUserFields.password || !createUserFields.phone_number}
          >
            {createUserLoading ? <CircularProgress size={20} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllTeam;