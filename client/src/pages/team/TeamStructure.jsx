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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  Pagination,
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
  Close as CloseIcon,
  FilterList as FilterListIcon,
  ArrowDownward as ArrowDownwardIcon,
  Layers as LayersIcon,
  Person as PersonIcon,
  MonetizationOn as MonetizationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
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

// Level Box styled component
const LevelBox = styled(Card)(({ theme, mode, active, level }) => {
  // Generate a color based on the level (1-10)
  const getColorByLevel = (level) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      '#9c27b0', // purple
      '#009688', // teal
      '#ff5722', // deep orange
      '#607d8b', // blue grey
      '#795548', // brown
    ];
    return colors[(level - 1) % colors.length];
  };

  const levelColor = getColorByLevel(level);

  return {
    borderRadius: 16,
    border: active
      ? `2px solid ${levelColor}`
      : `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
    backgroundColor: active
      ? mode === 'dark'
        ? `${levelColor}20`
        : `${levelColor}10`
      : mode === 'dark'
        ? theme.palette.background.paper
        : '#FFFFFF',
    boxShadow: active
      ? `0 8px 16px ${levelColor}30`
      : mode === 'dark'
        ? '0 8px 16px rgba(0, 0, 0, 0.2)'
        : '0 8px 16px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    marginBottom: active ? '16px' : '0px', // Add margin when active to make room for dropdown
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: active
        ? `0 12px 24px ${levelColor}40`
        : mode === 'dark'
          ? '0 12px 24px rgba(0, 0, 0, 0.3)'
          : '0 12px 24px rgba(0, 0, 0, 0.1)',
      borderColor: levelColor,
    },
    '&::before': active ? {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '4px',
      backgroundColor: levelColor,
    } : {},
  };
});

// Dropdown content for level members
const LevelDropdown = styled(Box)(({ theme, mode, active, level }) => {
  // Generate a color based on the level (1-10)
  const getColorByLevel = (level) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      '#9c27b0', // purple
      '#009688', // teal
      '#ff5722', // deep orange
      '#607d8b', // blue grey
      '#795548', // brown
    ];
    return colors[(level - 1) % colors.length];
  };

  const levelColor = getColorByLevel(level);

  return {
    maxHeight: active ? '1000px' : '0px',
    opacity: active ? 1 : 0,
    overflow: 'hidden',
    transition: 'all 0.5s ease',
    marginTop: active ? '8px' : '0px',
    borderRadius: '12px',
    border: active ? `1px solid ${levelColor}30` : 'none',
    backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.7)' : 'rgba(255, 255, 255, 0.9)',
    boxShadow: active ? `0 8px 16px ${levelColor}20` : 'none',
    position: 'relative',
    width: '100%',
  };
});

// Member Card styled component
const MemberCard = styled(Card)(({ theme, mode }) => ({
  borderRadius: 12,
  border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
  backgroundColor: mode === 'dark' ? theme.palette.background.paper : '#FFFFFF',
  boxShadow: mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: mode === 'dark' ? '0 6px 12px rgba(0, 0, 0, 0.3)' : '0 6px 12px rgba(0, 0, 0, 0.1)',
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
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [levelMembers, setLevelMembers] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  // We'll use selectedMember state instead of separate member details state
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
    if (!data) return;

    // Check if we have the new response structure with levels and allUsers
    const hasNewStructure = data.data && data.data.levels && Array.isArray(data.data.levels);

    // Get the nested array from either the new or old structure
    const nestedArray = hasNewStructure ? data.data.levels : (data.result || []);
    const allUsersFlat = hasNewStructure ? (data.data.allUsers || []) : [];

    if (!Array.isArray(nestedArray)) {
      console.error("Invalid team data structure:", data);
      return;
    }

    let totalInvestment = 0;
    let activeMembers = 0;
    let maxDepth = nestedArray.length - 1; // The depth is the number of levels in the array
    let allMembers = [];

    // Create level stats array (for levels 1-10)
    const levelStatsArray = Array(10).fill().map(() => ({
      memberCount: 0,
      totalInvestment: 0,
      activeMembers: 0,
      members: []
    }));

    // Process the nested array structure
    nestedArray.forEach((level, levelIndex) => {
      if (Array.isArray(level)) {
        // Skip level 0 (user's own data) if not withInitial
        if (levelIndex > 0 && levelIndex <= 10) {
          // Update level stats
          levelStatsArray[levelIndex - 1].memberCount = level.length;

          level.forEach(member => {
            // Add level information to each member
            member.level = levelIndex;
            allMembers.push(member);

            // Add to level stats
            levelStatsArray[levelIndex - 1].totalInvestment += member.total_investment || 0;
            if (member.total_investment > 0) {
              levelStatsArray[levelIndex - 1].activeMembers++;
            }

            // Add member to level members array
            levelStatsArray[levelIndex - 1].members.push({
              id: member.id || member._id,
              name: member.name || 'Unknown',
              username: member.username || 'unknown',
              email: member.email || 'N/A',
              phone: member.phone_number || 'N/A',
              investment: member.total_investment || 0,
              joinDate: member.created_at || 'N/A',
              status: member.total_investment > 0 ? 'Active' : 'Inactive',
              referrerId: member.refer_id || 'N/A'
            });

            // Calculate global statistics
            totalInvestment += member.total_investment || 0;
            if (member.total_investment > 0) {
              activeMembers++;
            }
          });
        }
      }
    });

    // If we have the flat allUsers array from the new structure, use it to supplement our data
    if (allUsersFlat.length > 0) {
      // We can use this for additional processing if needed
      console.log(`Found ${allUsersFlat.length} users in the flat structure`);
    }

    // Update level stats state
    setLevelStats(levelStatsArray);

    // Transform flat structure to hierarchical tree
    const buildTree = () => {
      // Find the root user (current user)
      const currentUser = nestedArray[0]?.[0] || {
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

  // Handle level selection
  const handleLevelClick = (level) => {
    // Level is 1-based (1-10)
    if (selectedLevel === level) {
      // If clicking the same level, toggle it off
      setSelectedLevel(null);
      setLevelMembers([]);
    } else {
      // Get members for this level (level-1 because array is 0-based)
      const members = levelStats[level-1]?.members || [];
      setLevelMembers(members);
      setSelectedLevel(level);

      // Scroll to the level box after a short delay to allow animation to start
      setTimeout(() => {
        const levelElement = document.getElementById(`level-${level}`);
        if (levelElement) {
          levelElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Handle member click in the level members list
  const handleLevelMemberClick = (member) => {
    // Set the selected member to show details in the right panel
    const memberWithChildren = {
      ...member,
      children: [] // Add empty children array to match the structure expected by the component
    };
    setSelectedMember(memberWithChildren);

    // Scroll to the team tree section to show the member details
    setTimeout(() => {
      const teamTreeSection = document.getElementById('team-tree-section');
      if (teamTreeSection) {
        teamTreeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Handle member click in the team tree
  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  // We no longer need a separate close function as we're using the selectedMember state

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.sponsorID || ''}`;
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  // Process team data when it changes
  useEffect(() => {
    if (teamData) {
      console.log("Team data received:", teamData);
      processTeamData(teamData);
    }
  }, [teamData]);

  // Update UI when team count data changes
  useEffect(() => {
    if (teamCountData) {
      console.log("Team count data received:", teamCountData);
      // Only process if we have both data sets
      if (teamData) {
        processTeamData(teamData);
      }
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

          </Box>
        </Box>
      </StyledReferralBox>

      {/* Team Statistics */}
      <Grid item spacing={3} sx={{ mb: 4 , display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Grid sx={{width:'100%'}} item xs={12} sm={6} md={3}>
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

        <Grid sx={{width:'100%'}} item xs={12} sm={6} md={3}>
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

        <Grid sx={{width:'100%'}} item xs={12} sm={6} md={3}>
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

        <Grid sx={{width:'100%'}}  item xs={12} sm={6} md={3}>
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
          {teamError.msg || teamError.error || 'Failed to load team data. Please try again.'}
          {teamError.details && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Details: {teamError.details}
            </Typography>
          )}
        </Alert>
      )}

      {/* Level Boxes for 1-10 with Dropdown */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {levelStats.map((levelStat, index) => {
          const level = index + 1;
          const isActive = selectedLevel === level;
          const getColorByLevel = (level) => {
            const colors = [
              theme.palette.primary.main,
              theme.palette.success.main,
              theme.palette.warning.main,
              theme.palette.error.main,
              theme.palette.info.main,
              '#9c27b0', // purple
              '#009688', // teal
              '#ff5722', // deep orange
              '#607d8b', // blue grey
              '#795548', // brown
            ];
            return colors[(level - 1) % colors.length];
          };
          const levelColor = getColorByLevel(level);

          return (
            <Box key={level} id={`level-${level}`} sx={{ width: '100%', position: 'relative' }}>
              {/* Level Box Header */}
              <LevelBox
                mode={mode}
                active={isActive}
                level={level}
                onClick={() => handleLevelClick(level)}
                sx={{ width: '100%', cursor: 'pointer' }}
              >
                <CardContent sx={{
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Level {level}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Members: {levelStat.memberCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Investment: {formatCurrency(levelStat.totalInvestment)}
                    </Typography>
                  </Box>
                  <Box>
                    {isActive ? (
                      <ArrowUpwardIcon sx={{ color: levelColor }} />
                    ) : (
                      <ArrowDownwardIcon sx={{ color: 'text.secondary' }} />
                    )}
                  </Box>
                </CardContent>
              </LevelBox>

              {/* Dropdown Content */}
              <Box
                sx={{
                  maxHeight: isActive ? '1000px' : '0px',
                  opacity: isActive ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.5s ease',
                  marginTop: isActive ? '8px' : '0px',
                  borderRadius: '12px',
                  border: isActive ? `1px solid ${levelColor}30` : 'none',
                  backgroundColor: mode === 'dark' ? 'rgba(26, 27, 32, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                  boxShadow: isActive ? `0 8px 16px ${levelColor}20` : 'none',
                  position: 'relative',
                  width: '100%',
                  padding: isActive ? '16px' : '0px',
                }}
              >
                {levelMembers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    No members found at this level.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {levelMembers.map((member) => (
                      <Grid item xs={12} sm={6} md={4} key={member.id}>
                        <MemberCard
                          mode={mode}
                          onClick={() => handleLevelMemberClick(member)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: levelColor }}>
                              {member.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {member.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                @{member.username}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Investment: {formatCurrency(member.investment)}
                              </Typography>
                            </Box>
                          </CardContent>
                        </MemberCard>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Team Tree and Selected Member */}
      <Grid container spacing={3} id="team-tree-section">
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