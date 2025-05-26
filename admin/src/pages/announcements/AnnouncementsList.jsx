import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import AnnouncementService from '../../services/announcement.service';

const AnnouncementsList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // State for announcements data
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // State for dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'News',
    image: '',
    isActive: true,
    priority: 'Low',
    type: 'General'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch announcements on component mount and when pagination changes
  useEffect(() => {
    fetchAnnouncements();

    // Check if we have state from the AnnouncementsDisplay page
    if (location.state) {
      if (location.state.editAnnouncement) {
        handleEditClick(location.state.editAnnouncement);
      } else if (location.state.deleteAnnouncement) {
        handleDeleteClick(location.state.deleteAnnouncement);
      }
    }
  }, [page, rowsPerPage, location.state]);

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await AnnouncementService.getAllAnnouncements({
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage
      });

      if (response && response.status && response.result) {
        setAnnouncements(response.result.list || []);
        setTotalCount(response.result.total || 0);
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

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle dialog open for adding new announcement
  const handleAddClick = () => {
    setDialogMode('add');
    setFormData({
      title: '',
      description: '',
      category: 'News',
      image: '',
      isActive: true,
      priority: 'Low',
      type: 'General'
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Handle dialog open for editing announcement
  const handleEditClick = (announcement) => {
    setDialogMode('edit');
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      image: announcement.image || '',
      isActive: announcement.isActive,
      // Convert numeric priority to string if needed
      priority: typeof announcement.priority === 'number'
        ? (announcement.priority > 2 ? 'High' : announcement.priority > 1 ? 'Medium' : 'Low')
        : announcement.priority || 'Low',
      type: announcement.type || 'General'
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  // Handle dialog open for viewing announcement
  const handleViewClick = (announcement) => {
    setDialogMode('view');
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      description: announcement.description,
      category: announcement.category,
      image: announcement.image || '',
      isActive: announcement.isActive,
      // Convert numeric priority to string if needed
      priority: typeof announcement.priority === 'number'
        ? (announcement.priority > 2 ? 'High' : announcement.priority > 1 ? 'Medium' : 'Low')
        : announcement.priority || 'Low',
      type: announcement.type || 'General'
    });
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedAnnouncement(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (dialogMode === 'add') {
        // Create new announcement
        const response = await AnnouncementService.createAnnouncement(formData);
        if (response && response.status) {
          setSnackbar({
            open: true,
            message: 'Announcement created successfully',
            severity: 'success'
          });
          fetchAnnouncements();
        } else {
          throw new Error(response?.message || 'Failed to create announcement');
        }
      } else if (dialogMode === 'edit') {
        // Update existing announcement
        const response = await AnnouncementService.updateAnnouncement(selectedAnnouncement._id, formData);
        if (response && response.status) {
          setSnackbar({
            open: true,
            message: 'Announcement updated successfully',
            severity: 'success'
          });
          fetchAnnouncements();
        } else {
          throw new Error(response?.message || 'Failed to update announcement');
        }
      }
      handleDialogClose();
    } catch (error) {
      console.error('Error submitting announcement:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete confirmation dialog open
  const handleDeleteClick = (announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteConfirmOpen(true);
  };

  // Handle delete confirmation dialog close
  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setAnnouncementToDelete(null);
  };

  // Handle delete announcement
  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;

    setDeleting(true);
    try {
      const response = await AnnouncementService.deleteAnnouncement(announcementToDelete._id);
      if (response && response.status) {
        setSnackbar({
          open: true,
          message: 'Announcement deleted successfully',
          severity: 'success'
        });
        fetchAnnouncements();
      } else {
        throw new Error(response?.message || 'Failed to delete announcement');
      }
      handleDeleteConfirmClose();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred',
        severity: 'error'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Announcements Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/announcements-display')}
            sx={{ mr: 2 }}
          >
            View All Announcements
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            Add Announcement
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button color="inherit" size="small" onClick={fetchAnnouncements} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading announcements...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No announcements found
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddClick}
                      sx={{ mt: 2 }}
                    >
                      Add your first announcement
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => (
                  <TableRow key={announcement._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {announcement.image && (
                          <Box
                            component="img"
                            src={announcement.image}
                            alt={announcement.title}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              mr: 2,
                              objectFit: 'cover',
                              backgroundColor: announcement.backgroundColor || 'rgba(51, 117, 187, 0.1)',
                            }}
                            onError={(e) => {
                              e.target.src = `https://placehold.co/40x40/3375BB/FFFFFF?text=${announcement.category || 'News'}`;
                            }}
                          />
                        )}
                        <Typography variant="body2" fontWeight="medium">
                          {announcement.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={announcement.category}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(51, 117, 187, 0.1)',
                          color: theme.palette.primary.main,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={announcement.type || 'General'}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          color: theme.palette.info.main,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {typeof announcement.priority === 'number' ? (
                        <Chip
                          label={announcement.priority > 2 ? 'High' : announcement.priority > 1 ? 'Medium' : 'Low'}
                          size="small"
                          color={announcement.priority > 2 ? 'error' : announcement.priority > 1 ? 'warning' : 'success'}
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label={announcement.priority || 'Low'}
                          size="small"
                          color={
                            announcement.priority === 'High' ? 'error' :
                            announcement.priority === 'Medium' ? 'warning' : 'success'
                          }
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={announcement.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={announcement.isActive ? 'success' : 'default'}
                        variant={announcement.isActive ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">

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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 2
        }}>
          <Typography variant="h6" component="div" fontWeight="bold">
            {dialogMode === 'add' ? 'Add New Announcement' :
             dialogMode === 'edit' ? 'Edit Announcement' : 'View Announcement'}
          </Typography>
          {dialogMode === 'view' && (
            <Chip
              label={formData.isActive ? 'Active' : 'Inactive'}
              size="small"
              color={formData.isActive ? 'success' : 'default'}
              variant={formData.isActive ? 'filled' : 'outlined'}
            />
          )}
        </DialogTitle>

        {dialogMode === 'view' ? (
          // View mode - Show announcement preview
          <DialogContent dividers sx={{ p: 0 }}>
            <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Announcement Preview
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                This is how the announcement will appear to users
              </Typography>

              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  mb: 3,
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Box
                    component="img"
                    src={formData.image }
                    alt={formData.title}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      mr: 3,
                      objectFit: 'cover',
                      backgroundColor: 'rgba(51, 117, 187, 0.1)',
                      padding: 1,
                      flexShrink: 0,
                    }}

                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {formData.title}
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(51, 117, 187, 0.05)',
                        borderRadius: 5,
                        px: 1.5,
                        py: 0.5,
                        ml: 1,
                      }}>
                        <Typography variant="caption" color="primary" fontWeight="medium">
                          {formData.category}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formData.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Announcement Details
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Title
                    </Typography>
                    <Typography variant="body2">{formData.title}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Category
                    </Typography>
                    <Chip
                      label={formData.category}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(51, 117, 187, 0.1)',
                        color: theme.palette.primary.main,
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {formData.description}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Image URL
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: 'break-all',
                        color: formData.image ? 'text.primary' : 'text.disabled',
                        fontStyle: formData.image ? 'normal' : 'italic'
                      }}
                    >
                      {formData.image || 'No image URL provided (using placeholder)'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Type
                    </Typography>
                    <Chip
                      label={formData.type || 'General'}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        color: theme.palette.info.main,
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Priority
                    </Typography>
                    <Chip
                      label={formData.priority}
                      size="small"
                      color={
                        formData.priority === 'High' ? 'error' :
                        formData.priority === 'Medium' ? 'warning' : 'success'
                      }
                      variant="outlined"
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      label={formData.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={formData.isActive ? 'success' : 'default'}
                      variant={formData.isActive ? 'filled' : 'outlined'}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
        ) : (
          // Add/Edit mode - Show form
          <DialogContent dividers>
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="title"
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="description"
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                error={!!formErrors.description}
                helperText={formErrors.description}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleInputChange}
                >
                  <MenuItem value="News">News</MenuItem>
                  <MenuItem value="Update">Update</MenuItem>
                  <MenuItem value="Promotion">Promotion</MenuItem>
                  <MenuItem value="Alert">Alert</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="normal"
                fullWidth
                id="image"
                label="Image URL"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                helperText="Leave empty to use a placeholder image"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={formData.type}
                  label="Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="General">General</MenuItem>
                  <MenuItem value="Important">Important</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Feature">Feature</MenuItem>
                  <MenuItem value="Promotion">Promotion</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleInputChange}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />

              {/* Preview section */}
              {(formData.title || formData.description) && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: theme.palette.background.default, borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Preview
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Box
                      component="img"
                      src={formData.image }
                      alt={formData.title}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        mr: 2,
                        objectFit: 'cover',
                        backgroundColor: 'rgba(51, 117, 187, 0.1)',
                        padding: 1,
                      }}

                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        {formData.title || 'Announcement Title'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formData.description
                          ? (formData.description.length > 100
                              ? `${formData.description.substring(0, 100)}...`
                              : formData.description)
                          : 'Announcement description will appear here...'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, p: 2 }}>
          {dialogMode === 'view' && (
            <>
              <Button
                onClick={() => handleEditClick(selectedAnnouncement)}
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <Button
                onClick={() => handleDeleteClick(selectedAnnouncement)}
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
              <Box sx={{ flex: 1 }} />
            </>
          )}

          <Button onClick={handleDialogClose}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>

          {dialogMode !== 'view' && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting && <CircularProgress size={20} />}
            >
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the announcement "{announcementToDelete?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={20} />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnnouncementsList;
