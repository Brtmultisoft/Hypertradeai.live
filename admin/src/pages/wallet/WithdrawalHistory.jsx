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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Backdrop,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import WithdrawalProcessingStatus from '../../components/withdrawal/WithdrawalProcessingStatus';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';

const WithdrawalHistory = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Processing status dialog
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [transactionHash, setTransactionHash] = useState(null);
  const [processingAmount, setProcessingAmount] = useState(null);
  const [processingFee, setProcessingFee] = useState(null);
  const [processingNetAmount, setProcessingNetAmount] = useState(null);

  // Fetch withdrawal history data
  const fetchWithdrawalHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-all-withdrawals`, {
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
        console.log('Withdrawal response:', response.data);

        // Handle different response formats
        if (response.data.result && response.data.result.docs) {
          // Standard paginated format
          console.log('Using standard paginated format with docs array');
          setWithdrawals(response.data.result.docs || []);
          setTotalWithdrawals(response.data.result.totalDocs || 0);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Alternative format with data array
          console.log('Using alternative format with data array');
          setWithdrawals(response.data.data || []);
          setTotalWithdrawals(response.data.data.length || 0);
        } else if (response.data.result && Array.isArray(response.data.result)) {
          // Alternative format with result array
          console.log('Using alternative format with result array');
          setWithdrawals(response.data.result || []);
          setTotalWithdrawals(response.data.result.length || 0);
        } else {
          // Fallback
          console.log('Using fallback format');
          const withdrawalData = response.data.result || response.data.data || [];
          setWithdrawals(Array.isArray(withdrawalData) ? withdrawalData : [withdrawalData]);
          setTotalWithdrawals(Array.isArray(withdrawalData) ? withdrawalData.length : 1);
        }

        // Log the first withdrawal for debugging
        if (response.data.result && response.data.result.docs && response.data.result.docs.length > 0) {
          console.log('First withdrawal:', response.data.result.docs[0]);
        }
      } else {
        console.error('Failed to fetch withdrawal history:', response.data);
        setError(response.data?.message || 'Failed to fetch withdrawal history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching withdrawal history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchWithdrawalHistory();
  }, [page, rowsPerPage, sortField, sortDirection, filterStatus]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchWithdrawalHistory();
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
    fetchWithdrawalHistory();
  };

  // Open approval dialog
  const handleOpenApproveDialog = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setDialogAction('approve');
    setActionReason('');
    setOpenDialog(true);
  };

  // Open rejection dialog
  const handleOpenRejectDialog = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setDialogAction('reject');
    setActionReason('');
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWithdrawal(null);
    setDialogAction('');
    setActionReason('');
  };

  // Handle reason change
  const handleReasonChange = (event) => {
    setActionReason(event.target.value);
  };

  // Handle withdrawal action (approve/reject)
  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal) return;

    setActionLoading(true);

    try {
      const token = getToken();

      // If approving, use the process withdrawal endpoint directly
      if (dialogAction === 'approve') {
        // Debug information
        console.log('Selected withdrawal:', selectedWithdrawal);
        console.log('API URL:', API_URL);
        console.log('Wallet address:', selectedWithdrawal.address || selectedWithdrawal.wallet_address);

        // Make sure we have a wallet address
        const walletAddress = selectedWithdrawal.address || selectedWithdrawal.wallet_address;

        if (!walletAddress) {
          setError('Wallet address is missing. Cannot process withdrawal.');
          setActionLoading(false);
          return;
        }

        const requestData = {
          withdrawalId: selectedWithdrawal._id,
          amount: selectedWithdrawal.amount.toString(),
          walletAddress: walletAddress
        };

        console.log('Request data:', requestData);

        try {
          const response = await axios.post(`${API_URL}/admin/withdrawals/process`, requestData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log('Response:', response);

          if (response.data && response.data.status) {
            // Get transaction hash and amount details from response
            const txHash = response.data.transactionHash;
            const totalAmount = response.data.amount || selectedWithdrawal.amount;
            const fee = response.data.fee || (totalAmount * 0.1);
            const netAmount = response.data.netAmount || (totalAmount - fee);

            // Set state for processing dialog
            setTransactionHash(txHash);
            setProcessingAmount(totalAmount);
            setProcessingFee(fee);
            setProcessingNetAmount(netAmount);

            // Close approval dialog
            handleCloseDialog();

            // Open processing status dialog
            setProcessingDialogOpen(true);

            // Refresh data in background
            fetchWithdrawalHistory();
          } else {
            console.error('API returned error:', response.data);
            setError(response.data?.message || 'Failed to approve and process withdrawal');
          }
        } catch (apiError) {
          console.error('API call error details:', apiError);
          if (apiError.response) {
            console.error('Error response:', apiError.response.data);
            console.error('Error status:', apiError.response.status);
          } else if (apiError.request) {
            console.error('No response received:', apiError.request);
          } else {
            console.error('Error setting up request:', apiError.message);
          }
          throw apiError; // Re-throw to be caught by the outer catch
        }
      } else {
        // For rejection, use the existing endpoint
        const response = await axios.post(`${API_URL}/admin/reject-withdrawal/${selectedWithdrawal._id}`, {
          reason: actionReason,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.status) {
          // Close dialog
          handleCloseDialog();
          // Refresh data
          fetchWithdrawalHistory();
        } else {
          setError(response.data?.message || 'Failed to reject withdrawal');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || `An error occurred while ${dialogAction}ing withdrawal`);
      console.error(`Error ${dialogAction}ing withdrawal:`, err);
    } finally {
      setActionLoading(false);
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

  // Get status chip color
  const getStatusChipColor = (status) => {
    // Convert to number if it's a string
    const statusCode = typeof status === 'string' ? parseInt(status) : status;

    switch (statusCode) {
      case 1: // Approved
        return 'success';
      case 0: // Pending
        return 'warning';
      case 2: // Rejected
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    // Convert to number if it's a string
    const statusCode = typeof status === 'string' ? parseInt(status) : status;

    switch (statusCode) {
      case 1: // Approved
        return 'Approved';
      case 0: // Pending
        return 'Pending';
      case 2: // Rejected
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title="Withdrawal History"
        subtitle="Manage all withdrawal requests on the platform"
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
              onKeyDown={handleSearchKeyPress}
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
                <MenuItem value="1">Approved</MenuItem>
                <MenuItem value="0">Pending</MenuItem>
                <MenuItem value="2">Rejected</MenuItem>
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
                fetchWithdrawalHistory();
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

      {/* Withdrawal History Table */}
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
                    onClick={() => handleSort('wallet_address')}
                  >
                    Wallet Address {renderSortIcon('wallet_address')}
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
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading withdrawal history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Box>No withdrawals found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal._id} hover>
                    <TableCell>{withdrawal.txid || withdrawal.transaction_id || withdrawal._id}</TableCell>
                    <TableCell>
                      {withdrawal.user_details ? (
                        `${withdrawal.user_details.name} (${withdrawal.user_details.email})`
                      ) : withdrawal.user_name ? (
                        `${withdrawal.user_name} (${withdrawal.user_email || 'No email'})`
                      ) : withdrawal.username ? (
                        `${withdrawal.username} (${withdrawal.email || 'No email'})`
                      ) : (
                        withdrawal.user_id
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(withdrawal.amount || 0)}</TableCell>
                    <TableCell>{withdrawal.payment_method || withdrawal.currency || 'USDT'}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {withdrawal.address || withdrawal.wallet_address || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(withdrawal.status !== undefined ? withdrawal.status : 0)}
                        size="small"
                        color={getStatusChipColor(withdrawal.status !== undefined ? withdrawal.status : 0)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                            // onClick={() => handleViewWithdrawal(withdrawal._id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {(withdrawal.status === 0 || withdrawal.status === '0') && (
                          <>
                            <Tooltip title="Approve & Process Withdrawal">
                              <IconButton
                                size="small"
                                color="success"
                                sx={{ mr: 1 }}
                                onClick={() => handleOpenApproveDialog(withdrawal)}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenRejectDialog(withdrawal)}
                                sx={{ mr: 1 }}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}

                        {/* Process button removed as approval now automatically processes the withdrawal */}
                      </Box>
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
          count={totalWithdrawals}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogAction === 'approve' ? 'Approve & Process Withdrawal' : 'Reject Withdrawal'}
        </DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <>
              <DialogContentText>
                {dialogAction === 'approve'
                  ? 'Are you sure you want to approve and process this withdrawal request? This will immediately send funds to the user\'s wallet address via blockchain transaction.'
                  : 'Are you sure you want to reject this withdrawal request? Funds will be returned to the user\'s wallet.'}
              </DialogContentText>

              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Withdrawal Details:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      User:
                    </Typography>
                    <Typography variant="body1">
                      {selectedWithdrawal.user_details
                        ? `${selectedWithdrawal.user_details.name} (${selectedWithdrawal.user_details.email})`
                        : selectedWithdrawal.user_id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Amount:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(selectedWithdrawal.amount || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Wallet Address:
                    </Typography>
                    <Typography variant="body1">
                      {selectedWithdrawal.wallet_address || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <TextField
                fullWidth
                label={`Reason for ${dialogAction === 'approve' ? 'approval' : 'rejection'}`}
                multiline
                rows={3}
                value={actionReason}
                onChange={handleReasonChange}
                variant="outlined"
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleWithdrawalAction}
            color={dialogAction === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            {dialogAction === 'approve' ? 'Approve & Process' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Processing Status Dialog */}
      <Dialog
        open={processingDialogOpen}
        onClose={() => setProcessingDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <WithdrawalProcessingStatus
          txHash={transactionHash}
          amount={processingAmount}
          fee={processingFee}
          netAmount={processingNetAmount}
          onClose={() => {
            setProcessingDialogOpen(false);
            setTransactionHash(null);
            setProcessingAmount(null);
            setProcessingFee(null);
            setProcessingNetAmount(null);
            fetchWithdrawalHistory();
          }}
        />
      </Dialog>
    </Box>
  );
};

export default WithdrawalHistory;
