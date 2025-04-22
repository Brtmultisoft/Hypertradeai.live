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
  Autocomplete,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useForm from '../../hooks/useForm';

const TransferForm = ({
  balance = 0,
  onTransfer,
  loading = false,
  error = null,
  success = false,
  userOptions = [],
  loadingUsers = false,
  onSearchUser,
}) => {
  const theme = useTheme();
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
      min: 1,
      minMessage: 'Amount must be at least 1',
      max: balance,
      maxMessage: `Amount cannot exceed your balance of ${formatCurrency(balance)}`,
      validate: (value) => {
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        return null;
      },
    },
    description: {
      maxLength: 100,
      maxLengthMessage: 'Description cannot exceed 100 characters',
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
      recipient: '',
      amount: '',
      description: '',
    },
    validationRules,
    async (formValues) => {
      if (onTransfer) {
        await onTransfer({
          ...formValues,
          recipient: selectedUser?.id || formValues.recipient,
        });
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
          Transfer Funds
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
            Transfer completed successfully!
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Transfer Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Recipient Field */}
          <Autocomplete
            id="recipient"
            options={userOptions}
            loading={loadingUsers}
            getOptionLabel={(option) => option.username || option.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Recipient"
                name="recipient"
                value={values.recipient}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.recipient && Boolean(errors.recipient)}
                helperText={touched.recipient && errors.recipient}
                placeholder="Enter username or select from list"
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
            helperText={touched.amount && errors.amount}
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
            multiline
            rows={2}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionIcon />
                </InputAdornment>
              ),
            }}
          />

          <Divider sx={{ my: 3 }} />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || isSubmitting || balance <= 0}
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
      </CardContent>
    </Card>
  );
};

export default TransferForm;
