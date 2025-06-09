import React from 'react';
import {
  TextField,
  InputAdornment,
  useTheme,
  Box,
  Typography,
} from '@mui/material';

const BinanceInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error = false,
  helperText,
  startIcon,
  endIcon,
  fullWidth = true,
  disabled = false,
  required = false,
  multiline = false,
  rows = 4,
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  const getInputStyles = () => ({
    '& .MuiOutlinedInput-root': {
      background: 'rgba(30, 35, 41, 0.8)',
      borderRadius: 2,
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: error 
          ? theme.palette.error.main 
          : 'rgba(240, 185, 11, 0.1)',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: error 
          ? theme.palette.error.main 
          : 'rgba(240, 185, 11, 0.3)',
      },
      '&.Mui-focused': {
        background: 'rgba(30, 35, 41, 1)',
        '& fieldset': {
          borderColor: error 
            ? theme.palette.error.main 
            : theme.palette.primary.main,
          borderWidth: '2px',
          boxShadow: error 
            ? `0 0 0 2px rgba(246, 70, 93, 0.2)` 
            : `0 0 0 2px rgba(240, 185, 11, 0.2)`,
        },
      },
      '&.Mui-disabled': {
        background: 'rgba(30, 35, 41, 0.5)',
        '& fieldset': {
          borderColor: 'rgba(240, 185, 11, 0.05)',
        },
      },
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      padding: '12px 16px',
      fontSize: '0.875rem',
      '&::placeholder': {
        color: theme.palette.text.secondary,
        opacity: 0.7,
      },
      '&.Mui-disabled': {
        color: theme.palette.text.disabled,
        WebkitTextFillColor: theme.palette.text.disabled,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      fontSize: '0.875rem',
      fontWeight: 500,
      '&.Mui-focused': {
        color: error ? theme.palette.error.main : theme.palette.primary.main,
      },
      '&.Mui-error': {
        color: theme.palette.error.main,
      },
    },
    '& .MuiFormHelperText-root': {
      color: error ? theme.palette.error.main : theme.palette.text.secondary,
      fontSize: '0.75rem',
      marginTop: '8px',
      marginLeft: '4px',
    },
    ...sx,
  });

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <Typography
          variant="body2"
          component="label"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 600,
            marginBottom: '8px',
            display: 'block',
          }}
        >
          {label}
          {required && (
            <span style={{ color: theme.palette.error.main, marginLeft: '4px' }}>
              *
            </span>
          )}
        </Typography>
      )}
      <TextField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        disabled={disabled}
        required={required}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        className="binance-input"
        sx={getInputStyles()}
        InputProps={{
          startAdornment: startIcon && (
            <InputAdornment position="start">
              <Box sx={{ color: theme.palette.text.secondary }}>
                {startIcon}
              </Box>
            </InputAdornment>
          ),
          endAdornment: endIcon && (
            <InputAdornment position="end">
              <Box sx={{ color: theme.palette.text.secondary }}>
                {endIcon}
              </Box>
            </InputAdornment>
          ),
        }}
        {...props}
      />
    </Box>
  );
};

export default BinanceInput;
