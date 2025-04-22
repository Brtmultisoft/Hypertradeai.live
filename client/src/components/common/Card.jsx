import {
  Box,
  Card as MuiCard,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';

const Card = ({
  title,
  value,
  icon,
  description,
  loading = false,
  color,
  trend,
  onClick,
}) => {
  const theme = useTheme();
  
  // Determine card color
  const cardColor = color || theme.palette.primary.main;
  
  // Determine trend color
  const trendColor = trend > 0 
    ? theme.palette.success.main 
    : trend < 0 
      ? theme.palette.error.main 
      : theme.palette.text.secondary;

  return (
    <MuiCard
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 16px rgba(0, 0, 0, 0.1)`,
        } : {},
      }}
    >
      <CardContent sx={{ height: '100%', p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          {/* Title */}
          <Typography
            variant="subtitle1"
            component="h3"
            color="text.secondary"
            fontWeight="medium"
          >
            {title}
          </Typography>

          {/* Icon */}
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: `${cardColor}20`,
                color: cardColor,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {/* Value */}
        <Box sx={{ mb: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', height: 42 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Typography
              variant="h4"
              component="div"
              fontWeight="bold"
              sx={{ color: cardColor }}
            >
              {value}
            </Typography>
          )}
        </Box>

        {/* Description and Trend */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
          
          {trend !== undefined && (
            <Typography
              variant="body2"
              sx={{
                ml: description ? 1 : 0,
                color: trendColor,
                fontWeight: 'medium',
              }}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </Typography>
          )}
        </Box>
      </CardContent>
    </MuiCard>
  );
};

export default Card;
