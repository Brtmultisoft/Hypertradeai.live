import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  Link,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import useAuth from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';
import { isValidEmail } from '../../utils/validators';

const ForgotPassword = () => {
  const theme = useTheme();
  const { forgotPassword, loading, error } = useAuth();
  const [success, setSuccess] = useState(false);

  // Form validation rules
  const validationRules = {
    email: {
      required: true,
      requiredMessage: 'Email is required',
      validate: (value) => (!isValidEmail(value) ? 'Please enter a valid email address' : null),
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
      email: '',
    },
    validationRules,
    async (formValues) => {
      const result = await forgotPassword(formValues.email);
      if (result.success) {
        setSuccess(true);
        resetForm();
      }
    }
  );

  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        Forgot Password
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter your email address and we'll send you a link to reset your password
      </Typography>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Password reset link has been sent to your email address. Please check your inbox.
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Forgot Password Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <TextField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email}
          fullWidth
          margin="normal"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
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
          disabled={loading || isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading || isSubmitting ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>

        {/* Back to Login Link */}
        <Button
          component={RouterLink}
          to="/login"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Login
        </Button>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
