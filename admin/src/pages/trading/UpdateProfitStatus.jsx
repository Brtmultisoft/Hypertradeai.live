import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import axios from 'axios';
import { API_URL } from '../../config';
import useAuth from '../../hooks/useAuth';
import { format } from 'date-fns';
// No layout import needed as it's handled by the router

const UpdateProfitStatus = () => {
  // Get token from Auth context
  const { token } = useAuth();

  // Form state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [profitStatus, setProfitStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [profitAmount, setProfitAmount] = useState('0');
  const [profitError, setProfitError] = useState('');
  const [cronExecutionId, setCronExecutionId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Form validation
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (!profitStatus) newErrors.profitStatus = 'Profit status is required';

    if (profitStatus === 'processed' && (isNaN(parseFloat(profitAmount)) || parseFloat(profitAmount) < 0)) {
      newErrors.profitAmount = 'Valid profit amount is required for processed status';
    }

    if ((profitStatus === 'failed' || profitStatus === 'skipped') && !profitError) {
      newErrors.profitError = 'Error message is required for failed or skipped status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        profitStatus,
        profitAmount: parseFloat(profitAmount) || 0,
        profitError: profitError || null,
        cronExecutionId: cronExecutionId || null
      };

      // Add userId only if it's provided
      if (userId.trim()) {
        payload.userId = userId.trim();
      }

      const response = await axios.post(
        `${API_URL}/admin/trade-activations/update-profit-status`,
        payload,
        {
          headers: {
            token: token
          }
        }
      );

      if (response.data.status) {
        setResult(response.data.data);
      } else {
        throw new Error(response.data.msg || 'Failed to update profit status');
      }
    } catch (err) {
      console.error('Error updating profit status:', err);
      setError(err.response?.data?.msg || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setProfitStatus('');
    setUserId('');
    setProfitAmount('0');
    setProfitError('');
    setCronExecutionId('');
    setErrors({});
    setResult(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Update Profit Status
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manually update profit status for trade activations within a date range
        </Typography>
      </Box>

        <Card>
          <CardHeader title="Update Profit Status" />
          <Divider />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.startDate,
                          helperText: errors.startDate
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.endDate,
                          helperText: errors.endDate
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.profitStatus}>
                    <InputLabel id="profit-status-label">Profit Status</InputLabel>
                    <Select
                      labelId="profit-status-label"
                      value={profitStatus}
                      label="Profit Status"
                      onChange={(e) => setProfitStatus(e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="processed">Processed</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                      <MenuItem value="skipped">Skipped</MenuItem>
                    </Select>
                    {errors.profitStatus && (
                      <FormHelperText>{errors.profitStatus}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="User ID (Optional)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    helperText="Leave empty to update all users in the date range"
                  />
                </Grid>
                {profitStatus === 'processed' && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Profit Amount"
                      type="number"
                      value={profitAmount}
                      onChange={(e) => setProfitAmount(e.target.value)}
                      error={!!errors.profitAmount}
                      helperText={errors.profitAmount || 'Amount to set for each activation'}
                      InputProps={{
                        inputProps: { min: 0, step: 0.01 }
                      }}
                    />
                  </Grid>
                )}
                {(profitStatus === 'failed' || profitStatus === 'skipped') && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Error Message"
                      value={profitError}
                      onChange={(e) => setProfitError(e.target.value)}
                      error={!!errors.profitError}
                      helperText={errors.profitError || 'Reason for failure or skip'}
                    />
                  </Grid>
                )}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cron Execution ID (Optional)"
                    value={cronExecutionId}
                    onChange={(e) => setCronExecutionId(e.target.value)}
                    helperText="Associate with a specific cron execution"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={20} color="inherit" />}
                    >
                      {loading ? 'Updating...' : 'Update Profit Status'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset Form
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {result && (
          <Paper sx={{ mt: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Results
            </Typography>
            <Typography variant="body1">
              Successfully updated {result.modifiedCount} out of {result.matchedCount} trade activations.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Date Range: {new Date(result.dateRange.startDate).toLocaleDateString()} to {new Date(result.dateRange.endDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New Profit Status: {result.profitStatus}
            </Typography>
          </Paper>
        )}
    </Container>
  );
};

export default UpdateProfitStatus;
