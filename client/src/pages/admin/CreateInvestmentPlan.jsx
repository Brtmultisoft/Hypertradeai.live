import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import useApi from '../../hooks/useApi';
import InvestmentService from '../../services/investment.service';

const CreateInvestmentPlan = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    title: 'Trading Package',
    amount_from: 50,
    amount_to: 1000000,
    percentage: 8,
    days: 1,
    frequency_in_days: 1,
    referral_bonus: 3,
    team_commission: {
      level1: 25,
      level2: 10,
      level3: 5,
      level4: 4,
      level5: 3,
      level6: 2,
      level7: 1,
    },
    status: true,
    extra: {
      description: 'MLM Trading Package with 8% daily ROI and 7-level team commission structure',
      min_direct_referrals_for_level_roi: 1,
    },
  });

  const [existingPlan, setExistingPlan] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Fetch existing plans
  const {
    data: plansData,
    loading: plansLoading,
    error: plansError,
    execute: fetchPlans,
  } = useApi(() => InvestmentService.getInvestmentPlans());

  // Create/update plan
  const {
    data: createData,
    loading: createLoading,
    error: createError,
    execute: createPlan,
  } = useApi((data) => InvestmentService.createInvestmentPlan(data), false);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plansData?.data?.length > 0) {
      setExistingPlan(plansData.data[0]);
      
      // Pre-fill form with existing plan data
      const plan = plansData.data[0];
      setFormData({
        title: plan.title || 'Trading Package',
        amount_from: plan.amount_from || 50,
        amount_to: plan.amount_to || 1000000,
        percentage: plan.percentage || 8,
        days: plan.days || 1,
        frequency_in_days: plan.frequency_in_days || 1,
        referral_bonus: plan.referral_bonus || 3,
        team_commission: plan.team_commission || {
          level1: 25,
          level2: 10,
          level3: 5,
          level4: 4,
          level5: 3,
          level6: 2,
          level7: 1,
        },
        status: plan.status !== undefined ? plan.status : true,
        extra: plan.extra || {
          description: 'MLM Trading Package with 8% daily ROI and 7-level team commission structure',
          min_direct_referrals_for_level_roi: 1,
        },
      });
    }
  }, [plansData]);

  useEffect(() => {
    if (createData) {
      setSuccess('Investment plan saved successfully!');
      fetchPlans(); // Refresh plans
    }
  }, [createData]);

  useEffect(() => {
    if (createError) {
      setError(createError.msg || 'Failed to save investment plan');
    }
  }, [createError]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('team_commission.')) {
      const level = name.split('.')[1];
      setFormData({
        ...formData,
        team_commission: {
          ...formData.team_commission,
          [level]: type === 'number' ? parseFloat(value) : value,
        },
      });
    } else if (name === 'status') {
      setFormData({
        ...formData,
        status: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseFloat(value) : value,
      });
    }
    
    // Clear messages
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    
    try {
      await createPlan(formData);
    } catch (err) {
      setError(err.message || 'Failed to save investment plan');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader 
        title={existingPlan ? 'Update Investment Plan' : 'Create Investment Plan'} 
        subtitle="Configure the MLM investment plan parameters"
      />
      
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Plan Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.status}
                      onChange={handleInputChange}
                      name="status"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Minimum Investment ($)"
                  name="amount_from"
                  type="number"
                  value={formData.amount_from}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Maximum Investment ($)"
                  name="amount_to"
                  type="number"
                  value={formData.amount_to}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: formData.amount_from }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Daily ROI (%)"
                  name="percentage"
                  type="number"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: 0.1, min: 0.1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Days (for profit calculation)"
                  name="days"
                  type="number"
                  value={formData.days}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Frequency in Days (for profit distribution)"
                  name="frequency_in_days"
                  type="number"
                  value={formData.frequency_in_days}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Referral and Commission Structure
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Direct Referral Bonus (%)"
                  name="referral_bonus"
                  type="number"
                  value={formData.referral_bonus}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Min Direct Referrals for Level ROI"
                  name="extra.min_direct_referrals_for_level_roi"
                  type="number"
                  value={formData.extra.min_direct_referrals_for_level_roi}
                  onChange={(e) => setFormData({
                    ...formData,
                    extra: {
                      ...formData.extra,
                      min_direct_referrals_for_level_roi: parseInt(e.target.value),
                    },
                  })}
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Level ROI Income Structure
                </Typography>
              </Grid>
              
              {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                <Grid item xs={6} md={3} lg={1.7} key={level}>
                  <TextField
                    label={`Level ${level} (%)`}
                    name={`team_commission.level${level}`}
                    type="number"
                    value={formData.team_commission[`level${level}`]}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    inputProps={{ step: 0.1, min: 0 }}
                  />
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="extra.description"
                  value={formData.extra.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    extra: {
                      ...formData.extra,
                      description: e.target.value,
                    },
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              
              {success && (
                <Grid item xs={12}>
                  <Alert severity="success">{success}</Alert>
                </Grid>
              )}
              
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={createLoading}
                  sx={{ mt: 2 }}
                >
                  {createLoading ? (
                    <CircularProgress size={24} />
                  ) : existingPlan ? (
                    'Update Investment Plan'
                  ) : (
                    'Create Investment Plan'
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default CreateInvestmentPlan;
