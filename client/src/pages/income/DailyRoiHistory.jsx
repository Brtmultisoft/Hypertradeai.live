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
import { formatCurrency, formatDate, formatPercentage } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import IncomeService from '../../services/income.service';
import InvestmentService from '../../services/investment.service';
import PageHeader from '../../components/PageHeader';

const DailyRoiHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [incomeData, setIncomeData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [dailyRoiRate, setDailyRoiRate] = useState(8/30); // 8% monthly distributed daily

  // Fetch income data with immediate=true to load data as soon as component mounts
  const {
    data,
    loading,
    error,
    execute: fetchIncomeData,
  } = useApi(() => IncomeService.getIncomeHistory({
    type: 'daily_profit',
    page: page + 1,
    limit: rowsPerPage,
  }), true); // Set immediate=true to fetch immediately

  // Fetch income summary with immediate=true
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary,
  } = useApi(() => IncomeService.getIncomeSum({ type: 'daily_profit' }), true); // Set immediate=true

  // Fetch investment summary with immediate=true
  const {
    data: investmentSummaryData,
    loading: investmentSummaryLoading,
    error: investmentSummaryError,
    execute: fetchInvestmentSummary,
  } = useApi(() => InvestmentService.getInvestmentSum({ status: 'active' }), true); // Set immediate=true

  // Refetch data when page or rowsPerPage changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 10) { // Only refetch if not on first page with default rows
      fetchIncomeData();
    }
  }, [page, rowsPerPage, fetchIncomeData]);

  // Update income data when API response changes
  useEffect(() => {
    if (data?.result) {
      setIncomeData(data.result.list || []);
      setTotalRows(data.result.total || 0); // Use total from API for pagination
    }
  }, [data]);

  // Update summary data
  useEffect(() => {
    console.log("fsdfasdfsa;odkfjasfj",summaryData?.result[0]?.amount);
    
      setTotalIncome(summaryData?.result[0]?.amount || 0);
    
  }, [summaryData]);

  // Update investment summary data
  useEffect(() => {
    if (investmentSummaryData?.result && investmentSummaryData.result.length > 0) {
      setTotalInvestment(investmentSummaryData.result[0].amount || 0);
    }
  }, [investmentSummaryData]);

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
      <PageHeader title="Daily ROI History" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Daily ROI Earned
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {summaryLoading ? <CircularProgress size={24} /> : formatCurrency(totalIncome)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                MPR Rate
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                8%
              </Typography>
            </CardContent>
          </Card>
        </Grid> */}

        {/* <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Distribution Frequency
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                Daily
              </Typography>
            </CardContent>
          </Card>
        </Grid> */}
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
                    <TableCell>Investment Amount</TableCell>
                    <TableCell>ROI Rate</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No Daily ROI income records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeData.map((income) => (
                      <TableRow key={income._id}>
                        <TableCell>{formatDate(income.created_at)}</TableCell>
                        <TableCell>{formatCurrency(income.amount)}</TableCell>
                        <TableCell>{formatCurrency(income.extra?.investmentAmount || 0)}</TableCell>
                        <TableCell>{(income.extra?.profitPercentage || 2.66).toFixed(3)}%</TableCell>
                        <TableCell>{income.description || 'Daily trading profit'}</TableCell>
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

export default DailyRoiHistory;
