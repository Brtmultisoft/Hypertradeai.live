import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MemberCard = ({ member, onClick }) => {
  const theme = useTheme();

  // Get rank color
  const getRankColor = (rank) => {
    switch (rank?.toUpperCase()) {
      case 'PRIME':
        return theme.palette.info.main;
      case 'VETERAM':
        return theme.palette.success.main;
      case 'ROYAL':
        return theme.palette.warning.main;
      case 'SUPREME':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 16px rgba(0, 0, 0, 0.1)`,
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Member Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {member.avatar ? (
              <Avatar
                src={member.avatar}
                alt={member.name}
                sx={{ width: 48, height: 48 }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: theme.palette.primary.main,
                }}
              >
                <PersonIcon />
              </Avatar>
            )}
            <Box sx={{ ml: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {member.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {member.username || 'username'}
              </Typography>
            </Box>
          </Box>

          {/* Rank */}
          <Chip
            label={member.rank || 'Active'}
            size="small"
            sx={{
              bgcolor: `${getRankColor(member.rank)}20`,
              color: getRankColor(member.rank),
              fontWeight: 'medium',
              borderRadius: 1,
            }}
          />
        </Box>

        {/* Member Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Investment
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {formatCurrency(member.investment || 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Team Size
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {member.teamSize || 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Earnings
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {formatCurrency(member.earnings || 0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Joined
            </Typography>
            <Typography variant="subtitle2" fontWeight="bold">
              {formatDate(member.joinedAt || new Date())}
            </Typography>
          </Box>
        </Box>

        {/* Contact Info */}
        <Box>
          <Typography variant="caption" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body2" noWrap>
            {member.email || 'N/A'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemberCard;
