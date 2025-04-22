import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
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

  // Fetch income data
  const {
    data,
    loading,
    error,
    execute: fetchIncomeData,
  } = useApi(() => IncomeService.getDirectIncomes({
    page: page + 1,
    limit: rowsPerPage,
  }));

  // Fetch income summary
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary,
  } = useApi(() => IncomeService.getIncomeSum({ type: 'referral_bonus' }));

  useEffect(() => {
    fetchIncomeData();
    fetchSummary();
  }, [page, rowsPerPage]);

  // Update income data when API response changes
  useEffect(() => {
    if (data?.result) {
      setIncomeData(data.result.list || []);
      setTotalRows(data.result.list.length || 0);
    }
  }, [data]);

  // Update summary data
  useEffect(() => {
    if (summaryData?.result) {
      setTotalIncome(summaryData.result.totalAmount || 0);
    }
  }, [summaryData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Referral Amount</TableCell>
                    <TableCell>Commission Rate</TableCell>
                    <TableCell>From User</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
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
                        <TableCell>3%</TableCell>
                        <TableCell>{income.user_id_from ? 'ID: ' + income.user_id_from.toString().substring(0, 8) + '...' : '-'}</TableCell>
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
