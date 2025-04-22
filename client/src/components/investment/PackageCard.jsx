import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Check as CheckIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const PackageCard = ({
  packageData,
  onSelect,
  selected = false,
  disabled = false,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `2px solid ${
          selected ? theme.palette.primary.main : theme.palette.divider
        }`,
        backgroundColor: selected
          ? `${theme.palette.primary.main}05`
          : theme.palette.background.paper,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: disabled ? 'none' : 'translateY(-4px)',
          boxShadow: disabled
            ? 'none'
            : `0 8px 16px rgba(0, 0, 0, 0.1)`,
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Package Header */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography
            variant="h5"
            component="h3"
            fontWeight="bold"
            color={selected ? theme.palette.primary.main : 'text.primary'}
            gutterBottom
          >
            {packageData.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {packageData.description}
          </Typography>
        </Box>

        {/* Package Price */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
            <Typography
              variant="h4"
              component="span"
              fontWeight="bold"
              color={selected ? theme.palette.primary.main : 'text.primary'}
            >
              {formatCurrency(packageData.amount_from)}
            </Typography>
            <Typography variant="h6" component="span" color="text.secondary" sx={{ mx: 1 }}>
              -
            </Typography>
            <Typography
              variant="h4"
              component="span"
              fontWeight="bold"
              color={selected ? theme.palette.primary.main : 'text.primary'}
            >
              {formatCurrency(packageData.amount_to)}
            </Typography>
          </Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            {formatPercentage(packageData.percentage / 100)} Daily ROI
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Package Features */}
        <List sx={{ mb: 'auto', p: 0 }}>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
              <TrendingUpIcon />
            </ListItemIcon>
            <ListItemText
              primary={`${formatPercentage(packageData.percentage / 100)} Daily Profit`}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
              <PaymentsIcon />
            </ListItemIcon>
            <ListItemText
              primary="First Deposit Bonus"
              secondary={`Up to ${formatCurrency(
                Object.values(packageData.first_deposit_bonus || {}).pop() || 0
              )}`}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText
              primary="Referral Bonus"
              secondary={`Up to ${formatCurrency(
                Object.values(packageData.referral_bonus || {}).pop() || 0
              )}`}
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
              <CheckIcon />
            </ListItemIcon>
            <ListItemText
              primary={`Level 1-3 Team Commission (${packageData.team_commission?.level1 || 0}%, ${
                packageData.team_commission?.level2 || 0
              }%, ${packageData.team_commission?.level3 || 0}%)`}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItem>
        </List>

        {/* Action Button */}
        <Button
          variant={selected ? 'contained' : 'outlined'}
          color="primary"
          fullWidth
          size="large"
          onClick={() => !disabled && onSelect(packageData)}
          disabled={disabled}
          sx={{ mt: 3 }}
        >
          {selected ? 'Selected' : 'Select Package'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PackageCard;
