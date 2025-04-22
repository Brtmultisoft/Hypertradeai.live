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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  Wallet as WalletIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useForm from '../../hooks/useForm';

const WithdrawForm = ({
  balance = 0,
  onWithdraw,
  loading = false,
  error = null,
  success = false,
  minAmount = 50,
  maxAmount = 10000,
  fee = 0,
}) => {
  const theme = useTheme();
  const [withdrawMethod, setWithdrawMethod] = useState('crypto');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Calculate max amount considering fee
  const maxWithdrawAmount = Math.min(balance, maxAmount);

  // Form validation rules
  const validationRules = {
    amount: {
      required: true,
      requiredMessage: 'Amount is required',
      min: minAmount,
      minMessage: `Amount must be at least ${formatCurrency(minAmount)}`,
      max: maxWithdrawAmount,
      maxMessage: `Amount cannot exceed ${formatCurrency(maxWithdrawAmount)}`,
      validate: (value) => {
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        return null;
      },
    },
    walletAddress: {
      required: withdrawMethod === 'crypto',
      requiredMessage: 'Wallet address is required',
      minLength: withdrawMethod === 'crypto' ? 20 : 0,
      minLengthMessage: 'Please enter a valid wallet address',
    },
    bankDetails: {
      required: withdrawMethod === 'bank',
      requiredMessage: 'Bank details are required',
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
    setFieldValue,
  } = useForm(
    {
      amount: '',
      walletAddress: '',
      bankDetails: '',
      description: '',
    },
    validationRules,
    async (formValues) => {
      if (onWithdraw) {
        await onWithdraw({
          ...formValues,
          method: withdrawMethod,
          fee,
          netAmount: Number(formValues.amount) - fee,
        });
      }
    }
  );

  // Handle withdraw method change
  const handleWithdrawMethodChange = (event, newValue) => {
    setWithdrawMethod(newValue);
  };

  // Calculate net amount
  const netAmount = values.amount ? Number(values.amount) - fee : 0;

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
          Withdraw Funds
        </Typography>

        {/* Balance Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            mb: 3,
            borderRadius: 1,
            backgroundColor: `${theme.palette.primary.main}10`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceIcon
              sx={{ color: theme.palette.primary.main, mr: 1 }}
            />
            <Typography variant="subtitle2" color="text.secondary">
              Available Balance
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold">
            {formatCurrency(balance)}
          </Typography>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Withdrawal request submitted successfully!
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Withdraw Method Tabs */}
        <Tabs
          value={withdrawMethod}
          onChange={handleWithdrawMethodChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          <Tab label="Cryptocurrency" value="crypto" />
          <Tab label="Bank Transfer" value="bank" />
        </Tabs>

        {/* Withdraw Form */}
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
              `Min: ${formatCurrency(minAmount)}, Max: ${formatCurrency(maxWithdrawAmount)}`
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

          {/* Fee and Net Amount Display */}
          {values.amount && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 2,
                mt: 2,
                mb: 3,
                borderRadius: 1,
                backgroundColor: theme.palette.background.light,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Withdrawal Fee:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(fee)}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  You will receive:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(netAmount > 0 ? netAmount : 0)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Wallet Address Field (for Crypto) */}
          {withdrawMethod === 'crypto' && (
            <TextField
              label="Wallet Address"
              name="walletAddress"
              value={values.walletAddress}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.walletAddress && Boolean(errors.walletAddress)}
              helperText={touched.walletAddress && errors.walletAddress}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WalletIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Bank Details Field (for Bank Transfer) */}
          {withdrawMethod === 'bank' && (
            <TextField
              label="Bank Details"
              name="bankDetails"
              value={values.bankDetails}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.bankDetails && Boolean(errors.bankDetails)}
              helperText={touched.bankDetails && errors.bankDetails}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              placeholder="Bank Name, Account Number, Account Name, SWIFT/BIC, etc."
            />
          )}

          {/* Description Field */}
          <TextField
            label="Description (Optional)"
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.description && Boolean(errors.description)}
            helperText={touched.description && errors.description}
            fullWidth
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionIcon />
                </InputAdornment>
              ),
            }}
          />

          <Divider sx={{ my: 3 }} />

          {/* Terms Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                color="primary"
              />
            }
            label="I confirm that the withdrawal information is correct and I understand that incorrect information may result in loss of funds."
            sx={{ mb: 2 }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={
              loading ||
              isSubmitting ||
              !agreedToTerms ||
              balance <= 0 ||
              balance < minAmount
            }
          >
            {loading || isSubmitting ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Withdraw Funds'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WithdrawForm;
