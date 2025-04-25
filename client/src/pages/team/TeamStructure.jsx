import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
  InputBase,
  Chip,
  styled,
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  ArrowUpward as ArrowUpwardIcon,
  Visibility as VisibilityIcon,
  BarChart as BarChartIcon,
  Groups as GroupsIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import TeamTree from '../../components/team/TeamTree';
import useApi from '../../hooks/useApi';
import TeamService from '../../services/team.service';
import useAuth from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

// Styled components for Trust Wallet-like UI
const StyledStatCard = styled(Card)(({ theme, mode }) => ({
  height: '100%',
  borderRadius: 16,
  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
  backgroundColor: mode === 'dark' ? theme.palette.background.paper : '#FFFFFF',
  boxShadow: mode === 'dark' ? '0 8px 16px rgba(0, 0, 0, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: mode === 'dark' ? '0 12px 24px rgba(0, 0, 0, 0.3)' : '0 12px 24px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledIconWrapper = styled(Box)(({ theme, color, mode }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color ? `${color}${mode === 'dark' ? '20' : '10'}` : theme.palette.primary.main + '10',
  color: color || theme.palette.primary.main,
  marginRight: theme.spacing(2),
}));

const StyledSearchBox = styled(Paper)(({ theme, mode }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 12,
  padding: theme.spacing(0.5, 2),
  marginBottom: theme.spacing(3),
  backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider}`,
}));

const StyledReferralBox = styled(Box)(({ theme, mode }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 12,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backgroundColor: mode === 'dark'
    ? 'rgba(51, 117, 187, 0.1)'
    : 'rgba(51, 117, 187, 0.05)',
  border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : 'rgba(51, 117, 187, 0.1)'}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: mode === 'dark'
      ? 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.2), transparent 70%)'
      : 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.1), transparent 70%)',
    zIndex: 0,
  },
}));

const StyledTeamTreeContainer = styled(Card)(({ theme, mode }) => ({
  borderRadius: 16,
  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
  backgroundColor: mode === 'dark' ? theme.palette.background.paper : '#FFFFFF',
  boxShadow: mode === 'dark' ? '0 8px 16px rgba(0, 0, 0, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  height: '100%',
}));

const StyledMemberDetailCard = styled(Card)(({ theme, mode }) => ({
  borderRadius: 16,
  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
  backgroundColor: mode === 'dark' ? theme.palette.background.paper : '#FFFFFF',
  boxShadow: mode === 'dark' ? '0 8px 16px rgba(0, 0, 0, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  height: '100%',
  position: 'relative',
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

const TeamStructure = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);
  const [processedTeamData, setProcessedTeamData] = useState(null);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    totalInvestment: 0,
    maxDepth: 0,
    activeMembers: 0,
  });

  // Fetch team structure data with immediate=true to load data as soon as component mounts
  const {
    data: teamData,
    loading: loadingTeam,
    error: teamError,
    execute: fetchTeamData,
  } = useApi(() => TeamService.getDownline(), true); // Set immediate=true to fetch immediately

  // Fetch team count with immediate=true
  const {
    data: teamCountData,
    loading: loadingTeamCount,
    execute: fetchTeamCount,
  } = useApi(() => TeamService.getDownlineLength(), true); // Set immediate=true to fetch immediately

  // Process team data to calculate statistics and transform to tree structure
  const processTeamData = (data) => {
    if (!data || !data.result || !Array.isArray(data.result)) return;

    const nestedArray = data.result;
    let totalInvestment = 0;
    let activeMembers = 0;
    let maxDepth = nestedArray.length - 1; // The depth is the number of levels in the array
    let allMembers = [];

    // Flatten the nested array structure
    nestedArray.forEach((level, levelIndex) => {
      if (Array.isArray(level)) {
        level.forEach(member => {
          // Add level information to each member
          member.level = levelIndex;
          allMembers.push(member);

          // Calculate statistics
          totalInvestment += member.total_investment || 0;
          if (member.total_investment > 0) {
            activeMembers++;
          }
        });
      }
    });

    // Transform flat structure to hierarchical tree
    const buildTree = () => {
      // Find the root user (current user)
      const currentUser = allMembers.find(member => member.level === 0) || {
        id: 'root',
        name: user?.name || 'You',
        username: user?.username || 'Current User',
        investment: user?.total_investment || 0,
        rank: 'ACTIVE',
        children: []
      };

      // Create a tree structure
      const tree = {
        id: currentUser.id || currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
        investment: currentUser.total_investment || 0,
        rank: currentUser.rank || 'ACTIVE',
        children: []
      };

      // Add direct referrals (level 1)
      const directReferrals = allMembers.filter(member => member.level === 1);
      tree.children = directReferrals.map(member => ({
        id: member.id || member._id,
        name: member.name,
        username: member.username,
        investment: member.total_investment || 0,
        rank: member.rank || 'ACTIVE',
        joinDate: member.created_at,
        children: []
      }));

      // Add indirect referrals (level 2+)
      for (let level = 2; level < nestedArray.length; level++) {
        const levelMembers = allMembers.filter(member => member.level === level);

        // For each member in this level, find their parent in the previous level
        levelMembers.forEach(member => {
          const parentId = member.refer_id;
          const findAndAddToParent = (node) => {
            if (node.id === parentId || node._id === parentId) {
              node.children.push({
                id: member.id || member._id,
                name: member.name,
                username: member.username,
                investment: member.total_investment || 0,
                rank: member.rank || 'ACTIVE',
                joinDate: member.created_at,
                children: []
              });
              return true;
            }

            if (node.children) {
              for (const child of node.children) {
                if (findAndAddToParent(child)) {
                  return true;
                }
              }
            }

            return false;
          };

          findAndAddToParent(tree);
        });
      }

      return tree;
    };

    // Build the tree and update state
    const treeData = buildTree();
    setProcessedTeamData(treeData);

    setTeamStats({
      totalMembers: allMembers.length,
      totalInvestment,
      maxDepth,
      activeMembers,
    });
  };

  // Handle member click in the team tree
  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.sponsorID || ''}`;
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  // Process team data when it changes
  useEffect(() => {
    if (teamData?.result) {
      processTeamData(teamData);
    }
  }, [teamData]);

  // Update UI when team count data changes
  useEffect(() => {
    if (teamCountData) {
      processTeamData(teamData);
    }
  }, [teamData, teamCountData]);

  // Format referral link
  const getReferralLink = () => {
    return `${window.location.origin}/register?ref=${user?.sponsorID || ''}`;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Page Header with Search */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, md: 0 }, fontWeight: 700 }}>
          Team Structure
        </Typography>

        <StyledSearchBox mode={mode}>
          <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
          <InputBase
            placeholder="Search team members..."
            fullWidth
            sx={{ fontSize: '0.9rem' }}
          />
        </StyledSearchBox>
      </Box>

      {/* Referral Link Box */}
      <StyledReferralBox mode={mode}>
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StyledIconWrapper color={theme.palette.primary.main} mode={mode}>
              <PersonAddIcon />
            </StyledIconWrapper>
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                Share your referral link
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: { xs: '100%', sm: 400 }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getReferralLink()}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Copy Referral Link">
              <IconButton
                onClick={copyReferralLink}
                sx={{
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  '&:hover': {
                    bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              color="primary"
              startIcon={<ShareIcon />}
              onClick={copyReferralLink}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                fontWeight: 600,
                boxShadow: mode === 'dark' ? '0 4px 12px rgba(51, 117, 187, 0.3)' : '0 4px 12px rgba(51, 117, 187, 0.2)',
                '&:hover': {
                  boxShadow: mode === 'dark' ? '0 6px 16px rgba(51, 117, 187, 0.4)' : '0 6px 16px rgba(51, 117, 187, 0.3)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Share
            </Button>
          </Box>
        </Box>
      </StyledReferralBox>

      {/* Team Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StyledStatCard mode={mode}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StyledIconWrapper color={theme.palette.primary.main} mode={mode}>
                  <PeopleIcon />
                </StyledIconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Members
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {loadingTeamCount ? <CircularProgress size={24} /> : teamStats.totalMembers}
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min((teamStats.totalMembers / 100) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  }
                }}
              />
            </CardContent>
          </StyledStatCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StyledStatCard mode={mode}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StyledIconWrapper color={theme.palette.success.main} mode={mode}>
                  <BarChartIcon />
                </StyledIconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Investment
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {loadingTeam ? <CircularProgress size={24} /> : formatCurrency(teamStats.totalInvestment)}
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min((teamStats.totalInvestment / 10000) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                  }
                }}
              />
            </CardContent>
          </StyledStatCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StyledStatCard mode={mode}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StyledIconWrapper color={theme.palette.warning.main} mode={mode}>
                  <AccountTreeIcon />
                </StyledIconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Team Depth
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {loadingTeam ? <CircularProgress size={24} /> : teamStats.maxDepth} Levels
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={Math.min((teamStats.maxDepth / 10) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                  }
                }}
              />
            </CardContent>
          </StyledStatCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StyledStatCard mode={mode}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StyledIconWrapper color={theme.palette.info.main} mode={mode}>
                  <GroupsIcon />
                </StyledIconWrapper>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Members
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {loadingTeam ? <CircularProgress size={24} /> : teamStats.activeMembers}
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={teamStats.totalMembers > 0 ? (teamStats.activeMembers / teamStats.totalMembers) * 100 : 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                  }
                }}
              />
            </CardContent>
          </StyledStatCard>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {teamError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.error.main}20`,
            '& .MuiAlert-icon': {
              color: theme.palette.error.main
            }
          }}
        >
          {teamError.msg || 'Failed to load team data. Please try again.'}
        </Alert>
      )}

      {/* Team Tree and Selected Member */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedMember ? 8 : 12}>
          <StyledTeamTreeContainer mode={mode}>
            <Box sx={{
              p: { xs: 2, sm: 3 },
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Team Hierarchy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View your complete team structure and member details
                </Typography>
              </Box>

              <Box sx={{
                mt: { xs: 1, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                display: { xs: 'flex', sm: 'block' },
                justifyContent: { xs: 'flex-end', sm: 'flex-start' }
              }}>
                <Tooltip title="Expand All">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      mr: 1
                    }}
                  >
                    <AccountTreeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Zoom">
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{
              p: { xs: 1, sm: 2 },
              height: { xs: 'auto', sm: 'calc(100% - 80px)' },
              maxHeight: { xs: '70vh', sm: 'none' },
              overflowY: 'auto',
              overflowX: 'hidden',
            }}>
              <TeamTree
                data={processedTeamData}
                loading={loadingTeam}
                onMemberClick={handleMemberClick}
              />
            </Box>
          </StyledTeamTreeContainer>
        </Grid>

        {/* Selected Member Details */}
        {selectedMember && (
          <Grid item xs={12} md={4}>
            <StyledMemberDetailCard mode={mode}>
              <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight="bold">
                  Member Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detailed information about the selected team member
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {/* Member Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: theme.palette.primary.main,
                      boxShadow: `0 0 0 4px ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : 'rgba(51, 117, 187, 0.1)'}`,
                    }}
                  >
                    {selectedMember.name?.charAt(0) || 'U'}
                  </Avatar>

                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedMember.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{selectedMember.username || 'username'}
                    </Typography>

                    <Chip
                      label={selectedMember.rank || 'Active'}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: `${theme.palette.primary.main}20`,
                        color: theme.palette.primary.main,
                        fontWeight: 'medium',
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Member Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      height: '100%',
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Investment
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.success.main }}>
                        {formatCurrency(selectedMember.investment || 0)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      height: '100%',
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Direct Referrals
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.primary.main }}>
                        {selectedMember.children?.length || 0}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Member Details */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Join Date
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1,
                    }}>
                      <CheckCircleIcon fontSize="small" color="primary" />
                    </Box>
                    <Typography variant="body1">
                      {selectedMember.joinDate || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<VisibilityIcon />}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      fontWeight: 600,
                    }}
                  >
                    View Details
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ShareIcon />}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      fontWeight: 600,
                      boxShadow: mode === 'dark' ? '0 4px 12px rgba(51, 117, 187, 0.3)' : '0 4px 12px rgba(51, 117, 187, 0.2)',
                      '&:hover': {
                        boxShadow: mode === 'dark' ? '0 6px 16px rgba(51, 117, 187, 0.4)' : '0 6px 16px rgba(51, 117, 187, 0.3)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Contact
                  </Button>
                </Box>
              </CardContent>
            </StyledMemberDetailCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TeamStructure;
