import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stepper,
  Step,
  StepLabel,
  useTheme,
} from '@mui/material';
import { formatCurrency } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import InvestmentService from '../../services/investment.service';
import PageHeader from '../../components/PageHeader';
import PackageCard from '../../components/investment/PackageCard';
import useAuth from '../../hooks/useAuth';
import Swal from 'sweetalert2';

const BuyPackage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');

  // Fetch investment plans
  const {
    data: plansData,
    loading: plansLoading,
    error: plansError,
    execute: fetchPlans,
  } = useApi(() => InvestmentService.getInvestmentPlans(), true); // Set immediate to true

  // Add investment - only create the API handler, don't execute immediately
  const {
    data: investmentData,
    loading: investmentLoading,
    error: investmentError,
    execute: addInvestment,
  } = useApi((data) => InvestmentService.addTradingPackage(data), false);

  // Handle successful investment
  useEffect(() => {
    if (investmentData?.result) {
      // Move to confirmation step
      setActiveStep(2);

      // Refresh all data
      // refreshAllData();

      // Trigger investment created event
      // triggerUpdate('investmentCreated');

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Your investment has been successfully processed.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: theme.palette.primary.main,
      });
    }
  }, [investmentData, theme.palette.primary.main]);

  useEffect(() => {
    if (investmentError) {
      setError(investmentError.msg || 'Failed to process investment');
    }
  }, [investmentError]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setActiveStep(1);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < selectedPlan.amount_from) {
      setError(`Minimum investment amount is ${formatCurrency(selectedPlan.amount_from)}`);
      return false;
    }

    if (selectedPlan.amount_to > 0 && numAmount > selectedPlan.amount_to) {
      setError(`Maximum investment amount is ${formatCurrency(selectedPlan.amount_to)}`);
      return false;
    }

    if (numAmount > user.wallet_topup) {
      setError('Insufficient balance in your top-up wallet');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateAmount()) {
      return;
    }

    try {
      await addInvestment({ amount: parseFloat(amount) });
    } catch (error) {
      setError(error.message || 'Failed to process investment');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const steps = ['Select Package', 'Enter Amount', 'Confirmation'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            {plansLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : plansError ? (
              <Alert severity="error">Failed to load investment plans</Alert>
            ) : (
              <Grid container spacing={3}>
                {plansData?.result ? (
                  // If data is in result property
                  plansData.result.map((plan) => (
                    <Grid item xs={12} md={6} lg={4} sx={{ display: 'flex', justifyContent: 'center' }} key={plan._id}>
                      <PackageCard
                        packageData={plan}
                        onSelect={handlePlanSelect}
                        selected={selectedPlan?._id === plan._id}
                      />
                    </Grid>
                  ))
                ) : plansData?.data ? (
                  // If data is in data property
                  plansData.data.map((plan) => (
                    <Grid item xs={12} md={6} lg={4} key={plan._id}>
                      <PackageCard
                        packageData={plan}
                        onSelect={handlePlanSelect}
                        selected={selectedPlan?._id === plan._id}
                      />
                    </Grid>
                  ))
                ) : null}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Investment Details
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Package
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPlan?.title}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Daily ROI
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedPlan?.percentage / 100}%
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Available Balance
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(user?.wallet_topup || 0)}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Investment Range
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(selectedPlan?.amount_from)} - {formatCurrency(selectedPlan?.amount_to)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ position: 'relative' }}>
                    <Typography
                      sx={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    >
                      $
                    </Typography>
                    <TextField
                      label="Investment Amount"
                      variant="outlined"
                      fullWidth
                      value={amount}
                      onChange={handleAmountChange}
                      type="number"
                      sx={{ '& input': { paddingLeft: '24px' } }}
                      helperText={`Min: ${formatCurrency(selectedPlan?.amount_from)}, Max: ${formatCurrency(selectedPlan?.amount_to)}`}
                      error={!!error}
                    />
                  </Box>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack} variant="outlined">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={investmentLoading || !amount}
                >
                  {investmentLoading ? <CircularProgress size={24} /> : 'Invest Now'}
                </Button>
              </Box>
            </Paper>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom color="primary">
                Investment Successful!
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" sx={{ mb: 2 }}>
                Your investment of {formatCurrency(parseFloat(amount))} has been successfully processed.
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You will start earning daily ROI of {selectedPlan?.percentage / 100}% from tomorrow.
              </Typography>

              {investmentData?.result?.firstDepositBonus > 0 && (
                <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                  You received a first deposit bonus of {formatCurrency(investmentData.result.firstDepositBonus)}!
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                sx={{ mt: 2 }}
              >
                Go to Dashboard
              </Button>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Buy Trading Package" />

      <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}
    </Box>
  );
};

export default BuyPackage;
