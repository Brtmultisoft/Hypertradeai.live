import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = 'percentage',
  prefix = '$',
  suffix = '',
  onClick,
}) => {
  const theme = useTheme();

  // Format the value based on prefix
  const formattedValue = prefix === '$'
    ? formatCurrency(value)
    : `${prefix}${formatNumber(value)}${suffix}`;

  // Determine change color
  const changeColor = change > 0
    ? theme.palette.success.main
    : change < 0
      ? theme.palette.error.main
      : theme.palette.text.secondary;

  // Format change value
  const formattedChange = changeType === 'percentage'
    ? `${change > 0 ? '+' : ''}${change}%`
    : changeType === 'currency'
      ? formatCurrency(change)
      : `${change > 0 ? '+' : ''}${change}`;

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        borderRadius: 3,
        backgroundColor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.primary.main}30`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 16px rgba(0, 0, 0, 0.1)`,
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Icon and Title */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1.5,
            }}
          >
            {icon && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: `${theme.palette.primary.main}20`,
                  color: theme.palette.primary.main,
                  mr: 1.5,
                }}
              >
                {icon}
              </Box>
            )}
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight="medium"
            >
              {title}
            </Typography>
          </Box>

          {/* Value */}
          <Typography
            variant="h5"
            component="div"
            fontWeight="bold"
            sx={{ mb: 0.5 }}
          >
            {formattedValue}
          </Typography>

          {/* Change */}
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  color: changeColor,
                  fontWeight: 'medium',
                }}
              >
                {formattedChange}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                vs. last period
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
