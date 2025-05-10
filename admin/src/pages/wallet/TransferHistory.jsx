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
  Typography,
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

const TransferHistory = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('');

  // Fetch transfer history data
  const fetchTransferHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/test-fund-transfers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          sort_field: sortField,
          sort_direction: sortDirection,
          type: filterType === 'admin' ? 2 : (filterType === 'user_to_user' ? 0 : (filterType === 'wallet_to_wallet' ? 1 : '')),
          start_date: startDate,
          end_date: endDate,
        },
      });

      console.log('Transfer history response:', response.data);
      if (response.data && response.data.status) {
        // Check if the response has the expected structure with pagination
        if (response.data.result && response.data.result.list) {
          console.log('Found transfers in result.list:', response.data.result.list);
          setTransfers(response.data.result.list || []);
          setTotalTransfers(response.data.result.total || 0);
        }
        // For the test endpoint (old format)
        else if (response.data.data && Array.isArray(response.data.data)) {
          console.log('Found transfers in test endpoint data:', response.data.data);
          setTransfers(response.data.data || []);
          setTotalTransfers(response.data.count || 0);
        }
        // Alternative structure with docs
        else if (response.data.data && response.data.data.docs) {
          console.log('Found transfers in data.docs:', response.data.data.docs);
          setTransfers(response.data.data.docs || []);
          setTotalTransfers(response.data.data.totalDocs || 0);
        }
        // Direct array in result
        else if (response.data.result && Array.isArray(response.data.result)) {
          console.log('Found transfers directly in result array:', response.data.result);
          setTransfers(response.data.result || []);
          setTotalTransfers(response.data.result.length || 0);
        }
        else {
          console.error('Unexpected response structure:', response.data);
          setError('Unexpected response format from server');
        }
      } else {
        setError(response.data?.message || 'Failed to fetch transfer history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching transfer history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchTransferHistory();
  }, [page, rowsPerPage, sortField, sortDirection, filterType]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchTransferHistory();
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle search on Enter key press
  const handleSearchKeyDown = (event) => {
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

  // Handle type filter change
  const handleTypeFilterChange = (event) => {
    setFilterType(event.target.value);
    setPage(0);
  };

  // Apply date filters
  const applyDateFilters = () => {
    setPage(0);
    fetchTransferHistory();
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

  // Get transfer type chip color
  const getTransferTypeChipColor = (type) => {
    // Convert type to number if it's a string
    const typeNum = typeof type === 'string' ? parseInt(type, 10) : type;

    switch (typeNum) {
      case 2: // Admin transfer
        return 'primary';
      case 0: // User to user
        return 'secondary';
      case 1: // Self transfer (wallet to wallet)
        return 'success';
      default:
        return 'default';
    }
  };

  // Get transfer type label
  const getTransferTypeLabel = (type) => {
    // Convert type to number if it's a string
    const typeNum = typeof type === 'string' ? parseInt(type, 10) : type;

    switch (typeNum) {
      case 2: // Admin transfer
        return 'Admin Transfer';
      case 0: // User to user
        return 'User to User';
      case 1: // Self transfer (wallet to wallet)
        return 'Wallet to Wallet';
      default:
        return `Type: ${type}`;
    }
  };

  // Get wallet type label
  const getWalletTypeLabel = (walletType) => {
    if (!walletType) return 'Unknown';

    if (walletType === 'topup' || walletType === 'wallet_topup') {
      return 'Topup Wallet';
    } else if (walletType === 'main' || walletType === 'wallet') {
      return 'Main Wallet';
    } else if (walletType === 'admin') {
      return 'Admin';
    } else {
      return walletType;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Transfer History"
        subtitle="View all fund transfers on the platform"
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
              placeholder="Search by user..."
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
          <Grid item xs={12} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="type-filter-label">Transfer Type</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                value={filterType}
                onChange={handleTypeFilterChange}
                label="Transfer Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="admin">Admin Transfer</MenuItem>
                <MenuItem value="user_to_user">User to User</MenuItem>
                <MenuItem value="wallet_to_wallet">Wallet to Wallet</MenuItem>
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
                setFilterType('');
                setPage(0);
                setSortField('created_at');
                setSortDirection('desc');
                fetchTransferHistory();
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

      {/* Transfer History Table */}
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
                    SR. No. {renderSortIcon('transaction_id')}
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
                    From {renderSortIcon('from_user_id')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('to_user_id')}
                  >
                    To {renderSortIcon('to_user_id')}
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
                    onClick={() => handleSort('type')}
                  >
                    Type {renderSortIcon('type')}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSort('wallet_type')}
                  >
                    Wallet Details {renderSortIcon('wallet_type')}
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
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading transfer history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Box>No transfers found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer,index) => (
                  <TableRow key={transfer._id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {transfer.from_wallet === 'admin' ? (
                        'Admin'
                      ) : transfer.from_user_details ? (
                        `${transfer.from_user_details.name || ''} (${transfer.from_user_details.email || ''})`
                      ) : transfer.user_id_from ? (
                        transfer.user_id_from
                      ) : (
                        'Admin'
                      )}
                    </TableCell>
                    <TableCell>
                      {transfer.to_user_details ? (
                        `${transfer.to_user_details.name || ''} (${transfer.to_user_details.email || ''})`
                      ) : transfer.user_id ? (
                        transfer.user_id
                      ) : (
                        transfer.to_user_id || 'Unknown'
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(transfer.amount || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getTransferTypeLabel(transfer.type)}
                        size="small"
                        color={getTransferTypeChipColor(transfer.type)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">
                          From: {getWalletTypeLabel(transfer.from_wallet)}
                        </Typography>
                        <Typography variant="body2">
                          To: {getWalletTypeLabel(transfer.to_wallet)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(transfer.created_at)}</TableCell>
                    {/* <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          // onClick={() => handleViewTransfer(transfer._id)}
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
          count={totalTransfers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
};

export default TransferHistory;
