import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AnnouncementService from '../../services/announcement.service';

const AnnouncementsDisplay = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State for announcements data
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AnnouncementService.getAllAnnouncements({
        limit: 100 // Get more announcements for display
      });

      if (response && response.status && response.result) {
        setAnnouncements(response.result.list || []);
      } else {
        throw new Error('Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError(error.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  // Filter announcements based on search term and filters
  const filteredAnnouncements = announcements.filter(announcement => {
    // Filter by search term
    const matchesSearch =
      searchTerm === '' ||
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by category
    const matchesCategory =
      categoryFilter === 'all' ||
      announcement.category === categoryFilter;

    // Filter by status
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && announcement.isActive) ||
      (statusFilter === 'inactive' && !announcement.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort announcements by priority (high to low) and then by date (newest first)
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    // First sort by priority (high to low)
    const getPriorityValue = (priority) => {
      if (typeof priority === 'number') {
        return priority;
      }
      switch (priority) {
        case 'High': return 3;
        case 'Medium': return 2;
        case 'Low': return 1;
        default: return 0;
      }
    };

    const priorityA = getPriorityValue(a.priority);
    const priorityB = getPriorityValue(b.priority);

    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }

    // Then sort by date (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Handle edit announcement
  const handleEditClick = (announcement) => {
    navigate('/announcements', { state: { editAnnouncement: announcement } });
  };

  // Handle delete announcement
  const handleDeleteClick = (announcement) => {
    navigate('/announcements', { state: { deleteAnnouncement: announcement } });
  };

  // Get unique categories for filter
  const categories = ['all', ...new Set(announcements.map(a => a.category))];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="primary"
            onClick={() => navigate('/announcements')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Announcements Display
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchAnnouncements}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button color="inherit" size="small" onClick={fetchAnnouncements} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading announcements...
          </Typography>
        </Box>
      ) : sortedAnnouncements.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            No announcements found
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchAnnouncements}
            sx={{ mt: 2 }}
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedAnnouncements.map((announcement) => (
            <Grid item xs={12} md={6} lg={4} key={announcement._id}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: announcement.isActive ? 1 : 0.7,
                  border: announcement.isActive ? 'none' : `1px dashed ${theme.palette.divider}`,
                }}
              >
                {/* Status indicator */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Chip
                    label={announcement.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={announcement.isActive ? 'success' : 'default'}
                    variant={announcement.isActive ? 'filled' : 'outlined'}
                  />
                </Box>

                {/* Priority indicator */}
                <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                  <Chip
                    label={typeof announcement.priority === 'number'
                      ? (announcement.priority > 2 ? 'High' : announcement.priority > 1 ? 'Medium' : 'Low')
                      : announcement.priority || 'Low'
                    }
                    size="small"
                    color={
                      (announcement.priority === 'High' || announcement.priority > 2) ? 'error' :
                      (announcement.priority === 'Medium' || announcement.priority > 1) ? 'warning' : 'success'
                    }
                    variant="outlined"
                    sx={{ minWidth: 55 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, mt: 2 }}>
                  <Box
                    component="img"
                    src={announcement.image || `https://placehold.co/80x80/3375BB/FFFFFF?text=${announcement.category || 'News'}`}
                    alt={announcement.title}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      mr: 2,
                      objectFit: 'cover',
                      backgroundColor: 'rgba(51, 117, 187, 0.1)',
                      padding: 1,
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.target.src = `https://placehold.co/80x80/3375BB/FFFFFF?text=${announcement.category || 'News'}`;
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Chip
                        label={announcement.category}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(51, 117, 187, 0.1)',
                          color: theme.palette.primary.main,
                          mb: 1
                        }}
                      />
                      {announcement.type && (
                        <Chip
                          label={announcement.type}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            color: theme.palette.info.main,
                            mb: 1
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {announcement.title}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    flex: 1
                  }}
                >
                  {announcement.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Typography>

                  <Box>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(announcement)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(announcement)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AnnouncementsDisplay;
