import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useForm from '../../hooks/useForm';

const SelfTransferForm = ({
  walletBalance = 0,
  topupBalance = 0,
  onTransfer,
  loading = false,
}) => {
  // Form validation rules
  const validationRules = {
    amount: {
      required: true,
      requiredMessage: 'Amount is required',
      min: 10,
      minMessage: 'Minimum transfer amount is $10',
      max: walletBalance,
      maxMessage: `Amount cannot exceed your main wallet balance of ${formatCurrency(walletBalance)}`,
      validate: (value) => {
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        return null;
      },
    },
    remark: {
      required: true,
      requiredMessage: 'Remark is required',
      minLength: 3,
      minLengthMessage: 'Remark must be at least 3 characters',
      maxLength: 100,
      maxLengthMessage: 'Remark cannot exceed 100 characters',
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
    resetForm,
  } = useForm(
    {
      amount: '',
      remark: 'Self transfer',
    },
    validationRules,
    async (formValues) => {
      if (onTransfer) {
        await onTransfer({
          ...formValues,
          from_wallet: 'main',
          to_wallet: 'topup',
        });
        resetForm();
      }
    }
  );

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="subtitle1" gutterBottom>
        Transfer from Main Wallet to Topup Wallet
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        You can only transfer funds from your Main Wallet to your Topup Wallet.
      </Alert>

      {/* Amount Field */}
      <TextField
        label="Amount"
        name="amount"
        value={values.amount}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.amount && Boolean(errors.amount)}
        helperText={touched.amount && errors.amount ? errors.amount : `Available: ${formatCurrency(walletBalance)}`}
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

      {/* Remark Field */}
      <TextField
        label="Remark"
        name="remark"
        value={values.remark}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.remark && Boolean(errors.remark)}
        helperText={touched.remark && errors.remark}
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

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={loading || isSubmitting || walletBalance <= 0}
        sx={{ mt: 3 }}
      >
        {loading || isSubmitting ? (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            Processing...
          </>
        ) : (
          'Transfer Funds'
        )}
      </Button>
    </Box>
  );
};

export default SelfTransferForm;
