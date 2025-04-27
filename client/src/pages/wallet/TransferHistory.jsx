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
} from '@mui/material';
import {
  Search as SearchIcon,
  SwapHoriz as SwapHorizIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import useApi from '../../hooks/useApi';
import WalletService from '../../services/wallet.service';
import { formatCurrency, formatDate } from '../../utils/formatters';

const TransferHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transferData, setTransferData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalTransferred, setTotalTransferred] = useState(0);
  const [totalReceived, setTotalReceived] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Fetch transfer data with immediate=true to load data as soon as component mounts
  const {
    data,
    loading,
    error,
    execute: fetchTransferData,
  } = useApi(() => WalletService.getAllFundTransfers({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm || undefined,
    type: filterType !== 'all' ? filterType : undefined,
  }), true); // Set immediate=true to fetch immediately

  // Fetch transfer summary with immediate=true
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary,
  } = useApi(() => WalletService.getFundTransferSum(), true); // Set immediate=true to fetch immediately

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

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
    setPage(0);
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchTransferData();
  };

  // Get transfer type label
  const getTransferTypeLabel = (type) => {
    switch (type) {
      case 0:
        return 'User to User';
      case 1:
        return 'Self Transfer';
      default:
        return 'Unknown';
    }
  };

  // Get transfer type color
  const getTransferTypeColor = (type) => {
    switch (type) {
      case 0:
        return 'primary';
      case 1:
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Get wallet type label
  const getWalletLabel = (wallet) => {
    switch (wallet) {
      case 'main':
        return 'Main Wallet';
      case 'topup':
        return 'Topup Wallet';
      case 'admin':
        return 'Admin Wallet';
      default:
        return 'Unknown';
    }
  };

  // Update transfer data when API response changes
  useEffect(() => {
    if (data?.result) {
      setTransferData(data.result.list);
      setTotalRows(data.result.total || 0);
    }
  }, [data]);
  
  // Update summary data when API response changes
  useEffect(() => {
    if (summaryData?.result) {
      // Calculate total transferred and received
      const summary = summaryData.result[0] || { amount: 0, count: 0 };
      setTotalTransferred(summary.result.amount || 0);
      setTotalReceived(summary.result.amount || 0); // This should be calculated differently if API provides separate data
    }
  }, [summaryData]);

  // Refetch data when page, rowsPerPage, or filterType changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 10 || filterType !== 'all') { // Only refetch if not on default settings
      fetchTransferData();
    }
  }, [page, rowsPerPage, filterType, fetchTransferData]);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Transfer History" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
  
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Transferred
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {summaryLoading ? <CircularProgress size={24} /> : formatCurrency(totalTransferred)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Received
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {summaryLoading ? <CircularProgress size={24} /> : formatCurrency(totalReceived)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="filter-type-label">
                  <FilterListIcon fontSize="small" sx={{ mr: 1 }} />
                  Filter by Type
                </InputLabel>
                <Select
                  labelId="filter-type-label"
                  id="filter-type"
                  value={filterType}
                  onChange={handleFilterChange}
                  label="Filter by Type"
                >
                  <MenuItem value="all">All Transfers</MenuItem>
                  <MenuItem value="0">User to User</MenuItem>
                  <MenuItem value="1">Self Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Box component="form" onSubmit={handleSearchSubmit}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search by remark or username"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transfer History Table */}
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
            <Typography color="error">
              Error loading transfer data. Please try again.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Amount</TableCell>

                    <TableCell>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transferData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No transfer records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transferData.map((transfer) => (
                      <TableRow key={transfer._id}>
                        <TableCell>{formatDate(transfer.created_at)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getTransferTypeLabel(transfer.type)}
                            size="small"
                            color={getTransferTypeColor(transfer.type)}
                          />
                        </TableCell>
                        <TableCell>
                          {transfer.username_from || 'You'} ({getWalletLabel(transfer.from_wallet)})
                        </TableCell>
                        <TableCell>
                          {transfer.username || 'You'} ({getWalletLabel(transfer.to_wallet)})
                        </TableCell>
                        <TableCell>{formatCurrency(transfer.amount)}</TableCell>

                        <TableCell>{transfer.remark}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
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

export default TransferHistory;
