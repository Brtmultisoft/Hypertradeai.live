import React from 'react';
import { Button as MuiButton, CircularProgress, useTheme } from '@mui/material';

const BinanceButton = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  sx = {},
  binanceStyle = 'primary', // 'primary', 'secondary', 'danger'
  ...props
}) => {
  const theme = useTheme();

  // Determine Binance-specific styling
  const getBinanceClasses = () => {
    switch (binanceStyle) {
      case 'primary':
        return 'binance-btn-primary';
      case 'secondary':
        return 'binance-btn-secondary';
      case 'danger':
        return 'admin-btn-danger';
      default:
        return 'binance-btn-primary';
    }
  };

  const getBinanceStyles = () => {
    const baseStyles = {
      position: 'relative',
      fontWeight: 600,
      borderRadius: 2,
      textTransform: 'none',
      transition: 'all 0.3s ease',
      ...sx,
    };

    switch (binanceStyle) {
      case 'primary':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: '#000000',
          border: 'none',
          boxShadow: '0 2px 8px rgba(240, 185, 11, 0.1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(240, 185, 11, 0.15)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: 'rgba(240, 185, 11, 0.3)',
            color: 'rgba(0, 0, 0, 0.5)',
            transform: 'none',
            boxShadow: 'none',
          },
        };
      case 'secondary':
        return {
          ...baseStyles,
          background: 'transparent',
          color: theme.palette.primary.main,
          border: `1px solid ${theme.palette.primary.main}30`,
          '&:hover': {
            background: 'rgba(240, 185, 11, 0.1)',
            borderColor: theme.palette.primary.main,
            transform: 'translateY(-1px)',
          },
          '&:disabled': {
            color: 'rgba(240, 185, 11, 0.3)',
            borderColor: 'rgba(240, 185, 11, 0.1)',
            transform: 'none',
          },
        };
      case 'danger':
        return {
          ...baseStyles,
          background: theme.palette.error.main,
          color: '#FFFFFF',
          border: 'none',
          '&:hover': {
            background: theme.palette.error.dark,
            transform: 'translateY(-1px)',
          },
          '&:disabled': {
            background: 'rgba(246, 70, 93, 0.3)',
            transform: 'none',
          },
        };
      default:
        return baseStyles;
    }
  };

  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={getBinanceClasses()}
      sx={getBinanceStyles()}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={size === 'small' ? 16 : size === 'large' ? 28 : 20}
          sx={{
            position: 'absolute',
            color: binanceStyle === 'primary' ? '#000000' : 'inherit',
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
    </MuiButton>
  );
};

export default BinanceButton;
