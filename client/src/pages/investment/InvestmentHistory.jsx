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
import InvestmentService from '../../services/investment.service';
import PageHeader from '../../components/PageHeader';

const InvestmentHistory = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [investmentData, setInvestmentData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [activeInvestments, setActiveInvestments] = useState(0);

  // Fetch investment data with immediate=true to load data as soon as component mounts
  const {
    data,
    loading,
    error,
    execute: fetchInvestmentData,
  } = useApi(() => InvestmentService.getUserInvestments({
    page: page + 1,
    limit: rowsPerPage,
  }), true); // Set immediate=true to fetch immediately

  // Fetch investment summary with immediate=true
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary,
  } = useApi(() => InvestmentService.getInvestmentSum({ status: 'active' }), true); // Set immediate=true

  // Refetch data when page or rowsPerPage changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 10) { // Only refetch if not on first page with default rows
      fetchInvestmentData();
    }
  }, [page, rowsPerPage, fetchInvestmentData]);

  // Update investment data when API response changes
  useEffect(() => {
    console.log('Investment data:', data);
    if (data?.result) {
      setInvestmentData(data.result || []);
      setTotalRows(data.result.length || 0);

    } else if (data?.data) {
      // Handle alternative response format
      if (data.data.docs) {
        // Paginated response
        setInvestmentData(data.data.docs || []);
        setTotalRows(data.data.totalDocs || 0);
      } else {
        // Array response
        setInvestmentData(data.data || []);
        setTotalRows(data.data.length || 0);
      }
    }
  }, [data]);

  // Update summary data
  useEffect(() => {
    console.log('Summary data:', summaryData);
    if (!summaryData) {
      console.log('Summary data is null or undefined');
      return;
    }

    if (summaryData.data) {
      // Check if data is in the expected format
      if (Array.isArray(summaryData.data) && summaryData.data.length > 0) {
        // Format from the backend is an array with a single object containing amount and count
        console.log('Using array format data');
        setTotalInvestment(summaryData.data[0]?.amount || 0);
        setActiveInvestments(summaryData.data[0]?.count || 0);
      } else if (typeof summaryData.data === 'object') {
        // Object format
        console.log('Using object format data');
        setTotalInvestment(summaryData.data.totalInvestment || summaryData.data.amount || 0);
        setActiveInvestments(summaryData.data.activeInvestments || summaryData.data.count || 0);
      }
    } else if (summaryData.result) {
      // Alternative format with result property
      console.log('Using result property data');
      if (Array.isArray(summaryData.result) && summaryData.result.length > 0) {
        setTotalInvestment(summaryData.result[0]?.amount || 0);
        setActiveInvestments(summaryData.result[0]?.count || 0);
      } else {
        setTotalInvestment(summaryData.result.totalInvestment || summaryData.result.amount || 0);
        setActiveInvestments(summaryData.result.activeInvestments || summaryData.result.count || 0);
      }
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
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Investment History" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Investment
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {summaryLoading ? <CircularProgress size={24} /> : formatCurrency(totalInvestment)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Active Investments
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {summaryLoading ? <CircularProgress size={24} /> : activeInvestments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Daily ROI Rate
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                8%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Investment Table */}
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
              Error loading investment data. Please try again.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Package</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Daily ROI</TableCell>
                    <TableCell>Total Earned</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investmentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No investment records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    investmentData.map((investment) => (
                      <TableRow key={investment._id}>
                        <TableCell>{formatDate(investment.created_at)}</TableCell>
                        <TableCell>{investment.extra?.plan_name || 'Trading Package'}</TableCell>
                        <TableCell>{formatCurrency(investment.amount)}</TableCell>
                        <TableCell>{formatCurrency((investment.amount * investment.daily_profit) / 100)}</TableCell>
                        <TableCell>{formatCurrency(investment.total_earnings || 0)}</TableCell>
                        <TableCell>
                          <Chip
                            label={investment.status}
                            size="small"
                            color={getStatusColor(investment.status)}
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

export default InvestmentHistory;
