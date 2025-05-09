import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import IncomeService from '../../services/income.service';
import PageHeader from '../../components/PageHeader';

const DirectIncomeHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [incomeData, setIncomeData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch income data with immediate=true to load data as soon as component mounts
  const {
    data,
    loading,
    error,
    execute: fetchIncomeData,
  } = useApi(() => IncomeService.getDirectIncomes({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm,
    sort_field: sortField,
    sort_direction: sortDirection,
    include_user_data: true, // Request to include user data
    populate_referrals: true, // Request to populate referral user information
    include_user_fields: 'username,email,name,username_from,user_from_email,user_from_name,receiver_username,receiver_email,receiver_name,extra_from_username,extra_from_email,extra_from_name,commission_rate' // Specify the fields we need
  }), true); // Set immediate=true to fetch immediately

  // Fetch income summary with immediate=true
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary,
  } = useApi(() => IncomeService.getIncomeSum({ type: 'referral_bonus' }), true); // Set immediate=true

  // Function to calculate total from all income data
  const calculateTotalIncome = useCallback(async () => {
    try {
      console.log("Calculating total income from all pages...");

      // First try to get the sum directly from the API
      const sumResponse = await IncomeService.getIncomeSum({
        type: 'referral_bonus',
        exact_type_match: true
      });

      if (sumResponse?.result && Array.isArray(sumResponse.result) && sumResponse.result.length > 0) {
        if (sumResponse.result[0].amount) {
          console.log("Got total from sum API:", sumResponse.result[0].amount);
          setTotalIncome(sumResponse.result[0].amount);
          return;
        }
      }

      // If sum API fails, get all income data without pagination
      const allIncomeResponse = await IncomeService.getDirectIncomes({
        limit: 1000, // Request a large number of records
        type: 'referral_bonus',
        exact_type_match: true,
        include_user_data: true // Request to include user data
      });

      if (allIncomeResponse?.result?.list) {
        let total = 0;
        allIncomeResponse.result.list.forEach(income => {
          if (income && typeof income.amount === 'number') {
            total += income.amount;
          }
        });

        console.log("Calculated total from all pages:", total);
        setTotalIncome(total);
      }
    } catch (error) {
      console.error("Error calculating total income:", error);
    }
  }, []);

  // Refetch data when page, rowsPerPage, searchTerm, or sort parameters change
  useEffect(() => {
    fetchIncomeData();
  }, [page, rowsPerPage, searchTerm, sortField, sortDirection, fetchIncomeData]);

  // Update income data when API response changes
  useEffect(() => {
    if (data?.result) {
      const incomeList = data.result.list || [];
      console.log("Income list:", incomeList);

      setIncomeData(incomeList);
      setTotalRows(data.result.total || 0); // Use total from API for pagination

      // Calculate total income from the income data as a backup method
      if (!summaryData?.result) {
        let calculatedTotal = 0;
        incomeList.forEach(income => {
          if (income && typeof income.amount === 'number') {
            calculatedTotal += income.amount;
          }
        });

        // Only set the total if we don't have summary data yet
        if (calculatedTotal > 0) {
          setTotalIncome(calculatedTotal);
          console.log("Calculated backup total from income list:", calculatedTotal);
        }
      }
    }
  }, [data, summaryData]);

  // Update summary data
  useEffect(() => {
    if (summaryData?.result) {
      // Check if result is an array
      if (Array.isArray(summaryData.result)) {
        // Calculate total amount from the array
        let totalAmount = 0;
        summaryData.result.forEach(item => {
          // Add the amount from each item in the array
          if (item && typeof item.amount === 'number') {
            totalAmount += item.amount;
          }
        });

        if (totalAmount > 0) {
          setTotalIncome(totalAmount);
          console.log("Calculated total income:", totalAmount, "from", summaryData.result);
        } else {
          // If no amount found in the array, try calculating from all pages
          calculateTotalIncome();
        }
      } else if (summaryData.result.totalAmount) {
        // If the result has a totalAmount property
        setTotalIncome(summaryData.result.totalAmount);
        console.log("Using provided total amount:", summaryData.result.totalAmount);
      } else if (summaryData.result[0] && typeof summaryData.result[0].amount === 'number') {
        // If the result is an array with a single object containing amount
        setTotalIncome(summaryData.result[0].amount);
        console.log("Using amount from first result item:", summaryData.result[0].amount);
      } else if (typeof summaryData.result === 'number') {
        // If the result is already a number
        setTotalIncome(summaryData.result);
        console.log("Using direct number value:", summaryData.result);
      } else {
        // If no valid amount found, calculate from all pages
        calculateTotalIncome();
        console.log("No valid amount found in summary, calculating from all pages");
      }
    } else {
      // If no summary data available, calculate from all pages
      calculateTotalIncome();
    }
  }, [summaryData, calculateTotalIncome]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0); // Reset to first page when clearing search
  };

  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field with default 'asc' direction
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0); // Reset to first page when sorting
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'credited':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Direct Referral Income" />

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by username, email or transaction ID..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: 1,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} edge="end" size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Direct Income Earned
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {summaryLoading ? <CircularProgress size={24} /> : formatCurrency(totalIncome)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Direct Referral Commission
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                3%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Payment Status
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Instant
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Income Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">
              Error loading income data. Please try again.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'created_at'}
                        direction={sortField === 'created_at' ? sortDirection : 'asc'}
                        onClick={() => handleSort('created_at')}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'amount'}
                        direction={sortField === 'amount' ? sortDirection : 'asc'}
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'extra.referralAmount'}
                        direction={sortField === 'extra.referralAmount' ? sortDirection : 'asc'}
                        onClick={() => handleSort('extra.referralAmount')}
                      >
                        Referral Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Commission Rate</TableCell>
                 
                    <TableCell>
                      <Tooltip title="Email of the user who was referred (generated the commission)">
                        <TableSortLabel
                          active={sortField === 'email' || sortField === 'user_from_email'}
                          direction={(sortField === 'email' || sortField === 'user_from_email') ? sortDirection : 'asc'}
                          onClick={() => handleSort('user_from_email')}
                        >
                          Email
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Name of the user who was referred (generated the commission)">
                        <TableSortLabel
                          active={sortField === 'name' || sortField === 'user_from_name'}
                          direction={(sortField === 'name' || sortField === 'user_from_name') ? sortDirection : 'asc'}
                          onClick={() => handleSort('user_from_name')}
                        >
                          Name
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortField === 'status'}
                        direction={sortField === 'status' ? sortDirection : 'asc'}
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No direct referral income records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeData.map((income) => (
                      <TableRow key={income._id}>
                        <TableCell>{formatDate(income.created_at)}</TableCell>
                        <TableCell>{formatCurrency(income.amount)}</TableCell>
                        <TableCell>{formatCurrency(income.extra?.referralAmount || 0)}</TableCell>
                        <TableCell>
                          {income.commission_rate ? `${income.commission_rate}%` :
                           income.extra?.commissionRate ? `${income.extra.commissionRate}%` : '3%'}
                        </TableCell>
                       
                        <TableCell>
                          <Tooltip title="Email of the user who was referred (generated the commission)">
                            <span>
                              {income.extra_from_email ||
                               income.email ||
                               income.user_from_email ||
                               (income.user_id_from && income.user_id_from.email) ||
                               '-'}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Name of the user who was referred (generated the commission)">
                            <span>
                              {income.extra_from_name ||
                               income.name ||
                               income.user_from_name ||
                               (income.user_id_from && income.user_id_from.name) ||
                               '-'}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={income.status}
                            size="small"
                            color={getStatusColor(income.status)}
                          />
                        </TableCell>
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
      </Paper>
    </Box>
  );
};

export default DirectIncomeHistory;
