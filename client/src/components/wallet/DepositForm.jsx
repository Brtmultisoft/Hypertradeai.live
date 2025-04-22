import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Alert,
  Divider,
  Tabs,
  Tab,
  Grid,
  Paper,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  ContentCopy as ContentCopyIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { formatCurrency, formatWalletAddress } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import useForm from '../../hooks/useForm';

const DepositForm = ({
  walletAddress = '',
  onDeposit,
  loading = false,
  error = null,
  success = false,
  minAmount = 50,
  maxAmount = 10000,
}) => {
  const theme = useTheme();
  const [paymentMethod, setPaymentMethod] = useState('crypto');
  const [copied, setCopied] = useState(false);

  // Form validation rules
  const validationRules = {
    amount: {
      required: true,
      requiredMessage: 'Amount is required',
      min: minAmount,
      minMessage: `Amount must be at least ${formatCurrency(minAmount)}`,
      max: maxAmount,
      maxMessage: `Amount cannot exceed ${formatCurrency(maxAmount)}`,
      validate: (value) => {
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        return null;
      },
    },
  };

  // Initialize form
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      amount: '',
    },
    validationRules,
    async (formValues) => {
      if (onDeposit) {
        await onDeposit({
          ...formValues,
          method: paymentMethod,
        });
      }
    }
  );

  // Handle payment method change
  const handlePaymentMethodChange = (event, newValue) => {
    setPaymentMethod(newValue);
  };

  // Handle copy wallet address
  const handleCopyAddress = async () => {
    const success = await copyToClipboard(walletAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" component="h2" fontWeight="bold" gutterBottom>
          Deposit Funds
        </Typography>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Deposit request submitted successfully!
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Payment Method Tabs */}
        <Tabs
          value={paymentMethod}
          onChange={handlePaymentMethodChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Cryptocurrency" value="crypto" />
          <Tab label="Bank Transfer" value="bank" />
          <Tab label="Credit Card" value="card" />
        </Tabs>

        {/* Deposit Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Amount Field */}
          <TextField
            label="Amount"
            name="amount"
            value={values.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.amount && Boolean(errors.amount)}
            helperText={
              (touched.amount && errors.amount) ||
              `Min: ${formatCurrency(minAmount)}, Max: ${formatCurrency(maxAmount)}`
            }
            fullWidth
            margin="normal"
            type="number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyIcon />
                </InputAdornment>
              ),
            }}
          />

          <Divider sx={{ my: 3 }} />

          {/* Payment Method Content */}
          {paymentMethod === 'crypto' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Send your deposit to the following wallet address:
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* QR Code */}
                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                    }}
                  >
                    <QrCodeIcon sx={{ fontSize: 100, color: theme.palette.text.secondary }} />
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Scan QR Code
                    </Typography>
                  </Paper>
                </Grid>

                {/* Wallet Address */}
                <Grid item xs={12} sm={8}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Wallet Address (USDT TRC20)
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {walletAddress || 'TXz8SjhFZ1CqX2fR9ZMQ9sTdJVZMqcbRMf'}
                    </Typography>
                    <Button
                      startIcon={<ContentCopyIcon />}
                      onClick={handleCopyAddress}
                      size="small"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </Paper>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    Please make sure to send only USDT (TRC20) to this address. Other tokens may be lost.
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}

          {paymentMethod === 'bank' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Bank Transfer Details:
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Bank Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Global Bank Ltd.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Account Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      HyperTrade MLM
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Account Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      1234567890
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      SWIFT/BIC
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      GLBKUS12
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Reference
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      Your Username + Deposit
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Alert severity="info" sx={{ mt: 2 }}>
                Please include your username in the payment reference to help us identify your deposit.
              </Alert>
            </Box>
          )}

          {paymentMethod === 'card' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Credit Card Payment:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                You will be redirected to our secure payment processor after clicking the "Deposit" button.
              </Alert>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  textAlign: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/payment-methods.png"
                  alt="Payment Methods"
                  sx={{ maxWidth: '100%', height: 40 }}
                />
              </Paper>
            </Box>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Deposit Funds'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepositForm;
