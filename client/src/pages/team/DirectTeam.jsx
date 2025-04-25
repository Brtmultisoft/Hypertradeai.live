import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  CircularProgress,
  useTheme,
  TextField,
  InputAdornment,
  Button,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import useApi from '../../hooks/useApi';
import TeamService from '../../services/team.service';
import useAuth from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Swal from 'sweetalert2';

const DirectTeam = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [teamData, setTeamData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalInvestment: 0,
  });

  // Fetch direct team data with immediate=true to load data as soon as component mounts
  const {
    data,
    loading,
    error,
    execute: fetchTeamData,
  } = useApi(() => TeamService.getDirectTeam({
    page: page + 1,
    limit: rowsPerPage,
    search: searchTerm || undefined,
  }), true); // Set immediate=true to fetch immediately

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchTeamData();
  };

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.sponsorID || ''}`;
    navigator.clipboard.writeText(referralLink);
    Swal.fire({
            title: 'Success!',
            text: 'Your referral link has been copied to the clipboard.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: theme.palette.primary.main,
          });
  };

  // Calculate team statistics
  const calculateTeamStats = (members) => {
    if (!members || !members.length) return;

    const activeMembers = members.filter(member => member.total_investment > 0);
    const totalInvestment = members.reduce((sum, member) => sum + (member.total_investment || 0), 0);

    setTeamStats({
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      totalInvestment,
    });
  };

  // Update team data when API response changes
  useEffect(() => {
    if (data?.result) {
      // Check if result is an array (direct referrals)
      const directReferrals = Array.isArray(data.result.list) ? data.result.list : [];
      setTeamData(directReferrals);
      setTotalRows(directReferrals.length || 0);
      calculateTeamStats(directReferrals);
    }
  }, [data]);

  // Refetch data when page or rowsPerPage changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 10) { // Only refetch if not on first page with default rows
      fetchTeamData();
    }
  }, [page, rowsPerPage, fetchTeamData]);

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Direct Team Members"
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
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Direct Referrals
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {loading ? <CircularProgress size={24} /> : teamStats.totalMembers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Active Members
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {loading ? <CircularProgress size={24} /> : teamStats.activeMembers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Team Investment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {loading ? <CircularProgress size={24} /> : formatCurrency(teamStats.totalInvestment)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Box component="form" onSubmit={handleSearchSubmit}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search by name, username, or email"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      type="submit"
                    >
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
            Direct Referrals
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
            Members who joined using your referral link
          </Typography>
          <Divider />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Typography color="error">
                Error loading team data. Please try again.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell>Investment</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 3, textAlign: 'center' }}>
                            <PeopleIcon sx={{ fontSize: 40, color: theme.palette.text.secondary, mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                              No Direct Referrals Yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Share your referral link to start building your team.
                            </Typography>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<ShareIcon />}
                              onClick={copyReferralLink}
                              sx={{ mt: 2 }}
                            >
                              Share Referral Link
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamData.map((member) => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {member.avatar ? (
                                <Avatar src={member.avatar} alt={member.name} />
                              ) : (
                                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                  <PersonIcon />
                                </Avatar>
                              )}
                              <Typography variant="body2" sx={{ ml: 2 }}>
                                {member.name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{member.username || 'N/A'}</TableCell>
                          <TableCell>{member.email || 'N/A'}</TableCell>
                          <TableCell>{formatDate(member.created_at) || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(member.total_investment || 0)}</TableCell>
                          <TableCell>
                            <Chip
                              label={member.total_investment > 0 ? 'Active' : 'Inactive'}
                              color={member.total_investment > 0 ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalRows}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DirectTeam;
