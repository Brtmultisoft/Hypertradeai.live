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
  Card,
  CardContent,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  AccountBalanceWallet as WalletIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import WalletService from '../../services/wallet.service';
import PageHeader from '../../components/PageHeader';

const WithdrawalHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch withdrawals
  const {
    data: withdrawalData,
    loading,
    error,
    execute: fetchWithdrawals,
  } = useApi(() => WalletService.getAllWithdrawals({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  }), true);

  // Fetch withdrawal summary
  const {
    data: summaryData,
    loading: summaryLoading,
  } = useApi(() => WalletService.getWithdrawalSum(), true);

  const [withdrawals, setWithdrawals] = useState([]);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [copySnackbar, setCopySnackbar] = useState(false);

  // Process withdrawal data
  useEffect(() => {
    if (withdrawalData?.data) {
      let withdrawalList = [];
      let total = 0;

      // Handle different response structures
      if (withdrawalData.data.list) {
        // Structure: { data: { list: [...], total: ... } }
        withdrawalList = withdrawalData.data.list;
        total = withdrawalData.data.total || 0;
      } else if (withdrawalData.data.docs) {
        // Structure: { data: { docs: [...], totalDocs: ... } }
        withdrawalList = withdrawalData.data.docs;
        total = withdrawalData.data.totalDocs || 0;
      } else if (Array.isArray(withdrawalData.data)) {
        // Structure: { data: [...] }
        withdrawalList = withdrawalData.data;
        total = withdrawalData.data.length;
      } else if (withdrawalData.data.data && Array.isArray(withdrawalData.data.data)) {
        // Structure: { data: { data: [...] } }
        withdrawalList = withdrawalData.data.data;
        total = withdrawalData.data.data.length;
      }

      setWithdrawals(withdrawalList);
      setTotalWithdrawals(total);
    }
  }, [withdrawalData]);

  // Process summary data
  useEffect(() => {
    if (summaryData?.data && summaryData.data.length > 0) {
      setTotalAmount(summaryData.data[0]?.amount || 0);
    }
  }, [summaryData]);

  // Handle search
  const handleSearch = () => {
    setPage(0);
    fetchWithdrawals();
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

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  // Apply date filters
  const applyDateFilters = () => {
    setPage(0);
    fetchWithdrawals();
  };

  // Get status label
  const getStatusLabel = (status) => {
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    switch (statusCode) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Get status chip color
  const getStatusChipColor = (status) => {
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    switch (statusCode) {
      case 0: return 'warning';
      case 1: return 'success';
      case 2: return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const statusCode = typeof status === 'string' ? parseInt(status) : status;
    switch (statusCode) {
      case 0: return <PendingIcon fontSize="small" />;
      case 1: return <CheckCircleIcon fontSize="small" />;
      case 2: return <CancelIcon fontSize="small" />;
      default: return null;
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySnackbar(true);
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Withdrawal History" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Withdrawals
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalWithdrawals}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
              placeholder="Search by transaction ID, address..."
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
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="0">Pending</MenuItem>
                <MenuItem value="1">Approved</MenuItem>
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
              onChange={(e) => setStartDate(e.target.value)}
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
              onChange={(e) => setEndDate(e.target.value)}
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
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setFilterStatus('all');
                setPage(0);
                fetchWithdrawals();
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error.message || 'Failed to load withdrawal history'}
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
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Request Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Transaction ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fee</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Net Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Wallet Address</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Approval Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reason/Notes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Box sx={{ mt: 1 }}>
                      Loading withdrawal history...
                    </Box>
                  </TableCell>
                </TableRow>
              ) : withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Box>No withdrawals found</Box>
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal._id || withdrawal.id} hover>
                      <TableCell>{formatDate(withdrawal.created_at)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 100,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={
                              withdrawal.status === 1 || withdrawal.status === '1'
                                ? (withdrawal.txid || 'No Transaction Hash')
                                : `Withdrawal ID: ${withdrawal.id || withdrawal._id}`
                            }
                          >
                            {withdrawal.status === 1 || withdrawal.status === '1'
                              ? (withdrawal.txid || 'No TX Hash')
                              : `WD-${(withdrawal.id || withdrawal._id)?.toString().slice(-8)}`
                            }
                          </Typography>

                          {/* Copy button for transaction ID/withdrawal ID */}
                          <Tooltip title={
                            withdrawal.status === 1 || withdrawal.status === '1'
                              ? "Copy Transaction Hash"
                              : "Copy Withdrawal ID"
                          }>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => copyToClipboard(
                                withdrawal.status === 1 || withdrawal.status === '1'
                                  ? (withdrawal.txid || withdrawal._id)
                                  : (withdrawal.id || withdrawal._id)
                              )}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    <TableCell>{formatCurrency(withdrawal.amount || 0)}</TableCell>
                    <TableCell>{formatCurrency(withdrawal.fee || 0)}</TableCell>
                    <TableCell>{formatCurrency(withdrawal.net_amount || withdrawal.amount || 0)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={withdrawal.address || 'N/A'}
                      >
                        {withdrawal.address || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(withdrawal.status !== undefined ? withdrawal.status : 0)}
                        size="small"
                        color={getStatusChipColor(withdrawal.status !== undefined ? withdrawal.status : 0)}
                        icon={getStatusIcon(withdrawal.status !== undefined ? withdrawal.status : 0)}
                      />
                    </TableCell>
                    <TableCell>
                      {(withdrawal.status === 1 || withdrawal.status === '1') && withdrawal.approved_at ? (
                        <Typography variant="body2" color="success.main">
                          {formatDate(withdrawal.approved_at)}
                        </Typography>
                      ) : (withdrawal.status === 2 || withdrawal.status === '2') && withdrawal.extra?.rejectionDate ? (
                        <Typography variant="body2" color="error.main">
                          {formatDate(withdrawal.extra.rejectionDate)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={withdrawal.remark || withdrawal.extra?.rejectionReason || withdrawal.reason || withdrawal.admin_notes || 'No reason provided'}
                      >
                        {withdrawal.remark || withdrawal.extra?.rejectionReason || withdrawal.reason || withdrawal.admin_notes || (
                          withdrawal.status === 1 || withdrawal.status === '1' ? 'Approved by admin' :
                          withdrawal.status === 2 || withdrawal.status === '2' ? 'Rejected by admin' :
                          'Pending approval'
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        {/* Copy Transaction ID */}
                        <Tooltip title="Copy Transaction ID">
                          <IconButton
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                            onClick={() => copyToClipboard(withdrawal.txid || withdrawal.id || withdrawal._id)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Copy Wallet Address */}
                        {withdrawal.address && (
                          <Tooltip title="Copy Wallet Address">
                            <IconButton
                              size="small"
                              color="secondary"
                              sx={{ mr: 1 }}
                              onClick={() => copyToClipboard(withdrawal.address)}
                            >
                              <WalletIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Show transaction hash for approved withdrawals */}
                        {(withdrawal.status === 1 || withdrawal.status === '1') && withdrawal.txid && withdrawal.txid !== 'manual-approval' && (
                          <Tooltip title={`Transaction Hash: ${withdrawal.txid}`}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => copyToClipboard(withdrawal.txid)}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalWithdrawals}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySnackbar}
        autoHideDuration={2000}
        onClose={() => setCopySnackbar(false)}
        message="Copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default WithdrawalHistory;
