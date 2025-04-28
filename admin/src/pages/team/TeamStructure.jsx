import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  Divider,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Home as HomeIcon,
  SupervisorAccount as SupervisorAccountIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/PageHeader';
import TeamTree from '../../components/team/TeamTree';

const TeamStructure = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [expandAll, setExpandAll] = useState(false);

  // Fetch team structure data
  const fetchTeamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-user-downline`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data && response.data.result) {
        setTeamData(processTeamData(response.data));
      } else {
        setError('No team data available');
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(err.response?.data?.msg || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  // Process team data to transform to tree structure
  const processTeamData = (data) => {
    if (!data || !data.result || !Array.isArray(data.result)) return null;

    const nestedArray = data.result;
    let allMembers = [];

    // Flatten the nested array and add level information
    nestedArray.forEach((levelMembers, levelIndex) => {
      if (Array.isArray(levelMembers)) {
        levelMembers.forEach((member) => {
          allMembers.push({
            ...member,
            level: levelIndex,
          });
        });
      }
    });

    // Build the tree structure
    return buildTree(allMembers, nestedArray);
  };

  // Transform flat structure to hierarchical tree
  const buildTree = (allMembers, nestedArray) => {
    // Find the root user (admin or default user)
    const rootUser = allMembers.find(member => member.level === 0) || {
      id: 'root',
      _id: 'root',
      name: 'Admin',
      username: 'Admin',
      email: 'admin@example.com',
      total_investment: 0,
      children: []
    };

    // Create a tree structure
    const tree = {
      id: rootUser._id || rootUser.id,
      name: rootUser.name,
      username: rootUser.username,
      email: rootUser.email,
      investment: rootUser.total_investment || 0,
      joinDate: rootUser.created_at,
      children: []
    };

    // Add direct referrals (level 1)
    const directReferrals = allMembers.filter(member => member.level === 1);
    tree.children = directReferrals.map(member => ({
      id: member._id,
      name: member.name,
      username: member.username,
      email: member.email,
      investment: member.total_investment || 0,
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
          if (node.id === parentId) {
            node.children.push({
              id: member._id,
              name: member.name,
              username: member.username,
              email: member.email,
              investment: member.total_investment || 0,
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

  // Handle user selection
  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  // Handle expand/collapse all
  const handleExpandToggle = () => {
    setExpandAll(prev => !prev);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Load data on component mount
  useEffect(() => {
    fetchTeamData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Team Structure"
        subtitle="View the complete hierarchical structure of all users"
        icon={<AccountTreeIcon fontSize="large" />}
      />

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          component={RouterLink}
          to="/all-team"
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <SupervisorAccountIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Team Management
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <AccountTreeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Team Structure
        </Typography>
      </Breadcrumbs>

      {/* Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search users..."
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: '100%', sm: 250 } }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTeamData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </Typography>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 2}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title={expandAll ? "Collapse All" : "Expand All"}>
            <IconButton onClick={handleExpandToggle}>
              {expandAll ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Team Tree */}
        <Grid item xs={12} md={selectedUser ? 8 : 12}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="h6" fontWeight="bold">
                  Team Hierarchy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on any user to view their details
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 'calc(100vh - 300px)',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  p: 2,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  transition: 'transform 0.3s ease',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    {error}
                  </Alert>
                ) : !teamData ? (
                  <Alert severity="info" sx={{ m: 2 }}>
                    No team data available
                  </Alert>
                ) : (
                  <TeamTree
                    data={teamData}
                    onMemberClick={handleUserClick}
                    searchTerm={searchTerm}
                    expandAll={expandAll}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Details */}
        {selectedUser && (
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent>
                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    User Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed information about the selected user
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedUser.name || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Username: {selectedUser.username || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email: {selectedUser.email || 'N/A'}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Investment:</strong> ${selectedUser.investment?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Join Date:</strong> {selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Direct Referrals:</strong> {selectedUser.children?.length || 0}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to={`/edit-user/${selectedUser.id}`}
                      fullWidth
                    >
                      Edit User
                    </Button>
                  </Box>
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
