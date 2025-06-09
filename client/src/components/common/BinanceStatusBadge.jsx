import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const BinanceStatusBadge = ({
  status = 'active', // 'active', 'inactive', 'pending', 'warning', 'info'
  text,
  size = 'medium', // 'small', 'medium', 'large'
  showIcon = true,
  variant = 'filled', // 'filled', 'outlined'
  sx = {},
  ...props
}) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'success':
      case 'completed':
      case 'approved':
        return {
          color: '#0ECB81', // Binance Green
          backgroundColor: 'rgba(14, 203, 129, 0.1)',
          borderColor: 'rgba(14, 203, 129, 0.3)',
          icon: <CheckCircleIcon />,
          className: 'status-active',
        };
      case 'inactive':
      case 'failed':
      case 'rejected':
      case 'cancelled':
        return {
          color: '#F6465D', // Binance Red
          backgroundColor: 'rgba(246, 70, 93, 0.1)',
          borderColor: 'rgba(246, 70, 93, 0.3)',
          icon: <CancelIcon />,
          className: 'status-inactive',
        };
      case 'pending':
      case 'processing':
      case 'waiting':
        return {
          color: '#F0B90B', // Binance Gold
          backgroundColor: 'rgba(240, 185, 11, 0.1)',
          borderColor: 'rgba(240, 185, 11, 0.3)',
          icon: <ScheduleIcon />,
          className: 'status-pending',
        };
      case 'warning':
      case 'caution':
        return {
          color: '#F0B90B', // Binance Gold
          backgroundColor: 'rgba(240, 185, 11, 0.1)',
          borderColor: 'rgba(240, 185, 11, 0.3)',
          icon: <WarningIcon />,
          className: 'status-pending',
        };
      case 'info':
      case 'information':
        return {
          color: '#B7BDC6', // Binance Secondary Text
          backgroundColor: 'rgba(183, 189, 198, 0.1)',
          borderColor: 'rgba(183, 189, 198, 0.3)',
          icon: <InfoIcon />,
          className: 'status-info',
        };
      default:
        return {
          color: '#B7BDC6',
          backgroundColor: 'rgba(183, 189, 198, 0.1)',
          borderColor: 'rgba(183, 189, 198, 0.3)',
          icon: <InfoIcon />,
          className: 'status-info',
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          padding: '4px 8px',
          fontSize: '0.625rem',
          iconSize: '12px',
          borderRadius: '12px',
        };
      case 'large':
        return {
          padding: '8px 16px',
          fontSize: '0.875rem',
          iconSize: '18px',
          borderRadius: '20px',
        };
      default: // medium
        return {
          padding: '6px 12px',
          fontSize: '0.75rem',
          iconSize: '16px',
          borderRadius: '16px',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const sizeConfig = getSizeConfig();

  const getStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: showIcon ? '6px' : 0,
      padding: sizeConfig.padding,
      borderRadius: sizeConfig.borderRadius,
      fontSize: sizeConfig.fontSize,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      transition: 'all 0.2s ease',
      ...sx,
    };

    if (variant === 'filled') {
      return {
        ...baseStyles,
        color: statusConfig.color,
        backgroundColor: statusConfig.backgroundColor,
        border: `1px solid ${statusConfig.borderColor}`,
      };
    } else {
      return {
        ...baseStyles,
        color: statusConfig.color,
        backgroundColor: 'transparent',
        border: `1px solid ${statusConfig.borderColor}`,
      };
    }
  };

  const displayText = text || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Box
      className={statusConfig.className}
      sx={getStyles()}
      {...props}
    >
      {showIcon && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: sizeConfig.iconSize,
            '& svg': {
              fontSize: 'inherit',
            },
          }}
        >
          {statusConfig.icon}
        </Box>
      )}
      <Typography
        component="span"
        sx={{
          fontSize: 'inherit',
          fontWeight: 'inherit',
          color: 'inherit',
          lineHeight: 1,
        }}
      >
        {displayText}
      </Typography>
    </Box>
  );
};

export default BinanceStatusBadge;
