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

const LevelRoiIncome = () => {
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
  } = useApi(() => IncomeService.getLevelROIIncomes({
    page: page + 1,
    limit: rowsPerPage,
  }));

  // Fetch income summary
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: fetchSummary,
  } = useApi(() => IncomeService.getIncomeSum({ type: 'level_roi_income' }));

  useEffect(() => {
    fetchIncomeData();
    fetchSummary();
  }, [page, rowsPerPage]); // Removed fetchIncomeData from dependencies

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
      <PageHeader title="Level ROI Income History" />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Level ROI Income Earned
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
                Level ROI Structure
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                7 Levels
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Commission Rates
              </Typography>
              <Typography variant="body1" color="text.primary">
                L1: 25%, L2: 10%, L3: 5%, L4: 4%, L5: 3%, L6: 2%, L7: 1%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
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
                    <TableCell>Level</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" sx={{ py: 2 }}>
                          No level ROI income records found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incomeData.map((income) => (
                      <TableRow key={income._id}>
                        <TableCell>{formatDate(income.created_at)}</TableCell>
                        <TableCell>{formatCurrency(income.amount)}</TableCell>
                        <TableCell>Level {income.level || '-'}</TableCell>
                        <TableCell>{income.description}</TableCell>
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

export default LevelRoiIncome;
