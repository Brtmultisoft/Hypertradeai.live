import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Button,
  Divider,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  AccountBalance as AccountBalanceIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import useApi from '../../hooks/useApi';
import WalletService from '../../services/wallet.service';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const TransactionHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactionData, setTransactionData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Fetch deposits
  const {
    data: depositData,
    loading: loadingDeposits,
    error: depositError,
    execute: fetchDeposits,
  } = useApi(() => WalletService.getAllDeposits({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    start_date: startDate ? startDate.toISOString() : undefined,
    end_date: endDate ? endDate.toISOString() : undefined,
  }), true); // Set immediate=true to fetch immediately

  // Fetch withdrawals
  const {
    data: withdrawalData,
    loading: loadingWithdrawals,
    error: withdrawalError,
    execute: fetchWithdrawals,
  } = useApi(() => WalletService.getAllWithdrawals({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    start_date: startDate ? startDate.toISOString() : undefined,
    end_date: endDate ? endDate.toISOString() : undefined,
  }), true); // Set immediate=true to fetch immediately

  // Fetch deposit summary
  const {
    data: depositSummaryData,
    loading: loadingDepositSummary,
  } = useApi(() => WalletService.getDepositSum(), true);

  // Fetch withdrawal summary
  const {
    data: withdrawalSummaryData,
    loading: loadingWithdrawalSummary,
  } = useApi(() => WalletService.getWithdrawalSum(), true);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle filter type change
  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
    setPage(0);
  };

  // Handle filter status change
  const handleFilterStatusChange = (event) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (filterType === 'all' || filterType === 'deposits') {
      fetchDeposits();
    }
    if (filterType === 'all' || filterType === 'withdrawals') {
      fetchWithdrawals();
    }
  };

  // Handle date filter clear
  const handleClearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    // Refetch data
    if (filterType === 'all' || filterType === 'deposits') {
      fetchDeposits();
    }
    if (filterType === 'all' || filterType === 'withdrawals') {
      fetchWithdrawals();
    }
  };

  // Handle date filter apply
  const handleApplyDateFilter = () => {
    // Refetch data with date filters
    if (filterType === 'all' || filterType === 'deposits') {
      fetchDeposits();
    }
    if (filterType === 'all' || filterType === 'withdrawals') {
      fetchWithdrawals();
    }
  };

  // Get status label
  const getStatusLabel = (status) => {
    // Convert to number if it's a string
    const statusCode = typeof status === 'string' ? parseInt(status) : status;

    switch (statusCode) {
      case 0:
        return 'Pending';
      case 2:
        return 'Approved';
      case 1:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    // Convert to number if it's a string
    const statusCode = typeof status === 'string' ? parseInt(status) : status;

    switch (statusCode) {
      case 0:
        return 'warning';
      case 2:
        return 'success';
      case 1:
        return 'error';
      default:
        return 'default';
    }
  };

  // Combine and process deposit and withdrawal data
  useEffect(() => {
    let combinedData = [];
    let totalCount = 0;

    console.log('Deposit data:', depositData);
    console.log('Withdrawal data:', withdrawalData);

    if (depositData?.data && (filterType === 'all' || filterType === 'deposits')) {
      // Handle different response formats for deposits
      let deposits = [];
      if (depositData.data.list) {
        deposits = depositData.data.list;
        totalCount += depositData.data.total || 0;
      }

      deposits.forEach(deposit => {
        combinedData.push({
          ...deposit,
          type: 'deposit',
        });
      });
    }

    if (withdrawalData?.data && (filterType === 'all' || filterType === 'withdrawals')) {
      // Handle different response formats for withdrawals
      let withdrawals = [];
      if (withdrawalData.data.list) {
        withdrawals = withdrawalData.data.list;
        totalCount += withdrawalData.data.total || 0;
      }

      withdrawals.forEach(withdrawal => {
        combinedData.push({
          ...withdrawal,
          type: 'withdrawal',
        });
      });
    }

    // Sort by date (newest first)
    combinedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // If we're showing both types, we need to handle pagination manually
    if (filterType === 'all') {
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      combinedData = combinedData.slice(startIndex, endIndex);
    }

    setTransactionData(combinedData);
    setTotalRows(totalCount);
  }, [depositData, withdrawalData, filterType, page, rowsPerPage]);

  // Update summary data
  useEffect(() => {
    if (depositSummaryData?.data && depositSummaryData.data.length > 0) {
      setTotalDeposits(depositSummaryData.data[0]?.amount || 0);
    }
  }, [depositSummaryData]);

  useEffect(() => {
    if (withdrawalSummaryData?.data && withdrawalSummaryData.data.length > 0) {
      setTotalWithdrawals(withdrawalSummaryData.data[0]?.amount || 0);
    }
  }, [withdrawalSummaryData]);

  // Refetch data when filters change
  useEffect(() => {
    // Always fetch data when filters change, regardless of their values
    if (filterType === 'all' || filterType === 'deposits') {
      fetchDeposits();
    }
    if (filterType === 'all' || filterType === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [page, rowsPerPage, filterType, filterStatus, startDate, endDate, fetchDeposits, fetchWithdrawals]);

  const loading = loadingDeposits || loadingWithdrawals;
  const error = depositError || withdrawalError;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Transaction History" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Transactions
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {loading ? <CircularProgress size={24} /> : totalRows}
              </Typography>
            </CardContent>
          </Card>
        </Grid> */}
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ArrowDownwardIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Deposits
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {loadingDepositSummary ? <CircularProgress size={24} /> : formatCurrency(totalDeposits)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ArrowUpwardIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Withdrawals
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {loadingWithdrawalSummary ? <CircularProgress size={24} /> : formatCurrency(totalWithdrawals)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="filter-type-label">Transaction Type</InputLabel>
                <Select
                  labelId="filter-type-label"
                  id="filter-type"
                  value={filterType}
                  onChange={handleFilterTypeChange}
                  label="Transaction Type"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Transactions</MenuItem>
                  <MenuItem value="deposits">Deposits Only</MenuItem>
                  <MenuItem value="withdrawals">Withdrawals Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="filter-status-label">Status</InputLabel>
                <Select
                  labelId="filter-status-label"
                  id="filter-status"
                  value={filterStatus}
                  onChange={handleFilterStatusChange}
                  label="Status"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="0">Pending</MenuItem>
                  <MenuItem value="2">Approved</MenuItem>
                  <MenuItem value="2">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Date Range Filter */}
          {/* <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DateRangeIcon fontSize="small" sx={{ mr: 0.5 }} />
                Date Range Filter
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  maxDate={endDate || undefined}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  minDate={startDate || undefined}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handleClearDateFilter}
                  disabled={!startDate && !endDate}
                  fullWidth
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  onClick={handleApplyDateFilter}
                  disabled={!startDate && !endDate}
                  fullWidth
                >
                  Apply
                </Button>
              </Box>
            </Grid>
          </Grid> */}
        </CardContent>
      </Card>

      {/* Transaction History Table */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              Error loading transaction data. Please try again.
            </Alert>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Fee</TableCell>
                    <TableCell>Net Amount</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactionData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No transaction records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactionData.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                            size="small"
                            color={transaction.type === 'deposit' ? 'success' : 'error'}
                            icon={transaction.type === 'deposit' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{formatCurrency(transaction.fee || 0)}</TableCell>
                        <TableCell>{formatCurrency(transaction.net_amount || transaction.amount)}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={transaction.txid || transaction.transaction_id || transaction._id || 'N/A'}
                          >
                            {transaction.txid || transaction.transaction_id || transaction._id || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(transaction.status)}
                            size="small"
                            color={getStatusColor(transaction.status)}
                          />
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
              count={totalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Card>
    </Box>
  );
};

export default TransactionHistory;
