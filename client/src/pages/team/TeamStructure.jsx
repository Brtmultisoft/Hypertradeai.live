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
} from '@mui/material';
import {
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import TeamTree from '../../components/team/TeamTree';
import useApi from '../../hooks/useApi';
import TeamService from '../../services/team.service';
import useAuth from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';

const TeamStructure = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState(null);
  const [processedTeamData, setProcessedTeamData] = useState(null);
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    totalInvestment: 0,
    maxDepth: 0,
    activeMembers: 0,
  });

  // Fetch team structure data
  const {
    data: teamData,
    loading: loadingTeam,
    error: teamError,
    execute: fetchTeamData,
  } = useApi(() => TeamService.getDownline());

  // Fetch team count
  const {
    data: teamCountData,
    loading: loadingTeamCount,
    execute: fetchTeamCount,
  } = useApi(() => TeamService.getDownlineLength());

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
    const referralLink = `${window.location.origin}/register?ref=${user?.username || ''}`;
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTeamData();
    fetchTeamCount();
  }, []);

  // Process team data when it changes
  useEffect(() => {
    if (teamData) {
      processTeamData(teamData);
    }
  }, [teamData, teamCountData]);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Team Structure"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShareIcon />}
            onClick={copyReferralLink}
          >
            Share Referral Link
          </Button>
        }
      />

      {/* Team Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Team Members
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {loadingTeamCount ? <CircularProgress size={24} /> : teamStats.totalMembers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Active Members
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {loadingTeam ? <CircularProgress size={24} /> : teamStats.activeMembers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Team Investment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold">
                  {loadingTeam ? <CircularProgress size={24} /> : formatCurrency(teamStats.totalInvestment)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Team Depth
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountTreeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {loadingTeam ? <CircularProgress size={24} /> : teamStats.maxDepth} Levels
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Alert */}
      {teamError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {teamError.msg || 'Failed to load team data. Please try again.'}
        </Alert>
      )}

      {/* Team Tree and Selected Member */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedMember ? 8 : 12}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Hierarchy
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TeamTree
                data={processedTeamData}
                loading={loadingTeam}
                onMemberClick={handleMemberClick}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Member Details */}
        {selectedMember && (
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Member Details
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedMember.name || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {selectedMember.username || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Investment
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(selectedMember.investment || 0)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Rank
                  </Typography>
                  <Typography variant="body1">
                    {selectedMember.rank || 'Active'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Direct Referrals
                  </Typography>
                  <Typography variant="body1">
                    {selectedMember.children?.length || 0}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Join Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedMember.joinDate || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default TeamStructure;
