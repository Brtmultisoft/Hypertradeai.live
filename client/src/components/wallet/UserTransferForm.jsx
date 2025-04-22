import { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Button,
  Typography,
  CircularProgress,
  Autocomplete,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useForm from '../../hooks/useForm';

const UserTransferForm = ({
  balance = 0,
  onTransfer,
  loading = false,
  userOptions = [],
  loadingUsers = false,
  onSearchUser,
}) => {
  const [selectedUser, setSelectedUser] = useState(null);

  // Form validation rules
  const validationRules = {
    recipient: {
      required: true,
      requiredMessage: 'Recipient is required',
    },
    amount: {
      required: true,
      requiredMessage: 'Amount is required',
      min: 10,
      minMessage: 'Minimum transfer amount is $10',
      max: balance,
      maxMessage: `Amount cannot exceed your topup wallet balance of ${formatCurrency(balance)}`,
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
    setFieldValue,
    resetForm,
  } = useForm(
    {
      recipient: '',
      amount: '',
      remark: 'Fund transfer',
    },
    validationRules,
    async (formValues) => {
      if (onTransfer) {
        await onTransfer({
          ...formValues,
          recipient: selectedUser?.id || formValues.recipient,
        });
        resetForm();
        setSelectedUser(null);
      }
    }
  );

  // Handle user selection
  const handleUserSelect = (event, user) => {
    setSelectedUser(user);
    if (user) {
      setFieldValue('recipient', user.username || user.id);
    } else {
      setFieldValue('recipient', '');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="subtitle1" gutterBottom>
        Transfer to another user
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Funds will be sent from your topup wallet to the recipient's topup wallet.
      </Alert>

      {/* Recipient Field */}
      <Autocomplete
        id="recipient"
        options={userOptions}
        loading={loadingUsers}
        getOptionLabel={(option) => `${option.username} (${option.email || 'No email'})`}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Recipient Username or Email"
            name="recipient"
            value={values.recipient}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.recipient && Boolean(errors.recipient)}
            helperText={touched.recipient && errors.recipient}
            placeholder="Enter username or email"
            fullWidth
            margin="normal"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {loadingUsers ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        onChange={handleUserSelect}
        onInputChange={(event, newInputValue) => {
          if (onSearchUser && newInputValue.length > 2) {
            onSearchUser(newInputValue);
          }
        }}
      />

      {/* Amount Field */}
      <TextField
        label="Amount"
        name="amount"
        value={values.amount}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.amount && Boolean(errors.amount)}
        helperText={touched.amount && errors.amount ? errors.amount : `Available: ${formatCurrency(balance)}`}
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
        disabled={loading || isSubmitting || balance <= 0}
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

export default UserTransferForm;
