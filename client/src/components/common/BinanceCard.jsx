import React from 'react';
import {
  Box,
  Card as MuiCard,
  CardContent,
  CardHeader,
  Typography,
  useTheme,
} from '@mui/material';

const BinanceCard = ({
  title,
  subtitle,
  children,
  action,
  onClick,
  hover = true,
  glow = false,
  pulse = false,
  gradient = false,
  sx = {},
  headerSx = {},
  contentSx = {},
  ...props
}) => {
  const theme = useTheme();

  const getCardClasses = () => {
    let classes = 'binance-card';
    if (pulse) classes += ' binance-pulse';
    if (glow) classes += ' binance-glow';
    return classes;
  };

  const getCardStyles = () => {
    const baseStyles = {
      background: gradient 
        ? 'linear-gradient(145deg, #1E2329 0%, #2B3139 50%, #1E2329 100%)'
        : 'linear-gradient(135deg, #1E2329 0%, #2B3139 100%)',
      border: `1px solid rgba(240, 185, 11, 0.1)`,
      borderRadius: 4,
      boxShadow: '0 2px 8px rgba(240, 185, 11, 0.1)',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      ...sx,
    };

    if (hover && onClick) {
      baseStyles['&:hover'] = {
        borderColor: 'rgba(240, 185, 11, 0.3)',
        boxShadow: '0 4px 16px rgba(240, 185, 11, 0.15)',
        transform: 'translateY(-4px)',
      };
    }

    return baseStyles;
  };

  const getHeaderStyles = () => ({
    background: 'linear-gradient(90deg, rgba(240, 185, 11, 0.1) 0%, transparent 100%)',
    borderBottom: `1px solid rgba(240, 185, 11, 0.1)`,
    padding: '16px 24px',
    ...headerSx,
  });

  const getContentStyles = () => ({
    padding: '24px',
    ...contentSx,
  });

  return (
    <MuiCard
      className={getCardClasses()}
      onClick={onClick}
      sx={getCardStyles()}
      {...props}
    >
      {title && (
        <CardHeader
          title={
            <Typography
              variant="h6"
              component="h3"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '1.125rem',
              }}
            >
              {title}
            </Typography>
          }
          subheader={
            subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 0.5,
                }}
              >
                {subtitle}
              </Typography>
            )
          }
          action={action}
          sx={getHeaderStyles()}
        />
      )}
      <CardContent sx={getContentStyles()}>
        {children}
      </CardContent>
    </MuiCard>
  );
};

export default BinanceCard;
