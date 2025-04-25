import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  useTheme,
  styled,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

// Styled components for Trust Wallet-like UI
const StyledMemberCard = styled(Card)(({ theme, mode }) => ({
  borderRadius: 16,
  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
  backgroundColor: mode === 'dark' ? theme.palette.background.paper : '#FFFFFF',
  boxShadow: mode === 'dark' ? '0 8px 16px rgba(0, 0, 0, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.05)',
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  overflow: 'hidden',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: mode === 'dark' ? '0 12px 24px rgba(0, 0, 0, 0.3)' : '0 12px 24px rgba(0, 0, 0, 0.1)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

const StyledAvatar = styled(Avatar)(({ theme, mode }) => ({
  width: 64,
  height: 64,
  backgroundColor: theme.palette.primary.main,
  boxShadow: `0 0 0 4px ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : 'rgba(51, 117, 187, 0.1)'}`,
}));

const MemberCard = ({ member, onClick }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();

  // Get rank color
  const getRankColor = (rank) => {
    switch (rank?.toUpperCase()) {
      case 'PRIME':
        return theme.palette.info.main;
      case 'VETERAN':
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
    <StyledMemberCard mode={mode} onClick={onClick}>
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StyledAvatar
                mode={mode}
                src={member.avatar}
              >
                {member.name?.charAt(0) || <PersonIcon />}
              </StyledAvatar>

              <Box sx={{ ml: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {member.name || 'User'}
                  </Typography>
                  {member.isVerified && (
                    <Tooltip title="Verified">
                      <VerifiedUserIcon
                        fontSize="small"
                        color="primary"
                        sx={{ fontSize: 16, opacity: 0.8 }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  @{member.username || 'username'}
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
        </Box>

        <Divider />

        {/* Member Stats */}
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              height: '100%',
            }}>
              <Typography variant="caption" color="text.secondary">
                Investment
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ color: theme.palette.success.main }}
              >
                {formatCurrency(member.investment || 0)}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={Math.min((member.investment / 5000) * 100, 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  mt: 1,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                  }
                }}
              />
            </Box>

            <Box sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              height: '100%',
            }}>
              <Typography variant="caption" color="text.secondary">
                Team Size
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ color: theme.palette.primary.main }}
              >
                {member.teamSize || 0}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={Math.min((member.teamSize / 50) * 100, 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  mt: 1,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  }
                }}
              />
            </Box>

            <Box sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              height: '100%',
            }}>
              <Typography variant="caption" color="text.secondary">
                Earnings
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                sx={{ color: theme.palette.warning.main }}
              >
                {formatCurrency(member.earnings || 0)}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={Math.min((member.earnings / 1000) * 100, 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  mt: 1,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 2,
                    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                  }
                }}
              />
            </Box>

            <Box sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              height: '100%',
            }}>
              <Typography variant="caption" color="text.secondary">
                Joined
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
              >
                {formatDate(member.joinedAt || new Date())}
              </Typography>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                color: theme.palette.info.main,
              }}>
                <CheckCircleIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14 }} />
                <Typography variant="caption">Verified</Typography>
              </Box>
            </Box>
          </Box>

          {/* Contact Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Email
            </Typography>
            <Typography
              variant="body2"
              noWrap
              sx={{
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                p: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
              }}
            >
              {member.email || 'N/A'}
            </Typography>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                sx={{
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Share">
              <IconButton
                size="small"
                sx={{
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </StyledMemberCard>
  );
};

export default MemberCard;
