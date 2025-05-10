import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  InputAdornment,
  Slider,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTradingContext } from '../../context/TradingContext';
import { useTradingData } from '../../hooks/useTradingData';
import { NumericFormat } from 'react-number-format';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const TradingPanel: React.FC = () => {
  // Get instrument selection from trading context
  const { selectedInstrument, instruments } = useTradingContext();

  // Get user data and BTC price from trading data hook
  const { userData, btcPrice } = useTradingData();
  const [tabValue, setTabValue] = useState(0);
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Find the selected instrument name and symbol
  const selectedInstrumentName = instruments.find(i => i.id === selectedInstrument)?.name || 'Bitcoin';
  const currencySymbol = selectedInstrument.split('-')[0];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Reset form when changing tabs
    setAmount('');
    setTotal('');
    setSliderValue(0);
    setSuccess(false);
    setError('');
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = event.target.value;
    setAmount(newAmount);

    if (newAmount && !isNaN(parseFloat(newAmount))) {
      const calculatedTotal = (parseFloat(newAmount) * btcPrice).toFixed(2);
      setTotal(calculatedTotal);
    } else {
      setTotal('');
    }
  };

  const handleTotalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = event.target.value;
    setTotal(newTotal);

    if (newTotal && !isNaN(parseFloat(newTotal))) {
      const calculatedAmount = (parseFloat(newTotal) / btcPrice).toFixed(8);
      setAmount(calculatedAmount);
    } else {
      setAmount('');
    }
  };

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setSliderValue(value);

    // Calculate amount based on slider percentage of max investment
    const maxInvestment = 1000; // Example max investment
    const calculatedTotal = (maxInvestment * (value / 100)).toFixed(2);
    setTotal(calculatedTotal);

    if (btcPrice) {
      const calculatedAmount = (parseFloat(calculatedTotal) / btcPrice).toFixed(8);
      setAmount(calculatedAmount);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Validate inputs
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (!total || parseFloat(total) <= 0) {
        throw new Error('Please enter a valid total');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Show success message
      setSuccess(true);

      // Reset form
      setAmount('');
      setTotal('');
      setSliderValue(0);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If user hasn't activated daily profit, don't show trading panel
  if (!userData?.dailyProfitActivated) {
    return null;
  }

  // Add a console log to show that trading panel is being rendered
  console.log('Rendering trading panel - Daily profit is activated');

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Trade {selectedInstrumentName}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 'bold',
            },
            '& .Mui-selected': {
              color: tabValue === 0 ? 'primary.main' : 'secondary.main',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: tabValue === 0 ? 'primary.main' : 'secondary.main',
            }
          }}
        >
          <Tab label="Buy" id="trading-tab-0" aria-controls="trading-tabpanel-0" />
          <Tab label="Sell" id="trading-tab-1" aria-controls="trading-tabpanel-1" />
        </Tabs>

        {/* Buy Panel */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label={`Amount (${currencySymbol})`}
                fullWidth
                value={amount}
                onChange={handleAmountChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Total (USD)"
                fullWidth
                value={total}
                onChange={handleTotalChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>
                Amount: {sliderValue}%
              </Typography>
              <Slider
                value={sliderValue}
                onChange={handleSliderChange}
                aria-labelledby="amount-slider"
                valueLabelDisplay="auto"
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(0, 230, 118, 0.16)',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Current Price: <NumericFormat value={btcPrice} displayType={'text'} thousandSeparator={true} prefix={'$'} decimalScale={2} fixedDecimalScale />
              </Typography>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  {`Successfully purchased ${amount} ${currencySymbol} for $${total}`}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={loading || !amount || !total}
                sx={{
                  py: 1.5,
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: '#16a34a',
                  },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  `Buy ${currencySymbol}`
                )}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Sell Panel */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label={`Amount (${currencySymbol})`}
                fullWidth
                value={amount}
                onChange={handleAmountChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Total (USD)"
                fullWidth
                value={total}
                onChange={handleTotalChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography gutterBottom>
                Amount: {sliderValue}%
              </Typography>
              <Slider
                value={sliderValue}
                onChange={handleSliderChange}
                aria-labelledby="amount-slider"
                valueLabelDisplay="auto"
                sx={{
                  color: 'secondary.main',
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(255, 82, 82, 0.16)',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Current Price: <NumericFormat value={btcPrice} displayType={'text'} thousandSeparator={true} prefix={'$'} decimalScale={2} fixedDecimalScale />
              </Typography>
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  {`Successfully sold ${amount} ${currencySymbol} for $${total}`}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={loading || !amount || !total}
                color="secondary"
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  `Sell ${currencySymbol}`
                )}
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default TradingPanel;
