import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  useTheme,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import IncomeService from '../../services/income.service';
import PageHeader from '../../components/PageHeader';

const LevelRoiIncome = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [incomeData, setIncomeData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch income data with immediate=true to load data as soon as component mounts
  const {
    data,
    loading,
    error,
    execute: fetchIncomeData,
  } = useApi(() => IncomeService.getLevelROIIncomes({
    page: page + 1,
    limit: rowsPerPage,
  }), true); // Set immediate=true to fetch immediately

  // Fetch income summary with immediate=true
  const {
    data: summaryData,
    loading: summaryLoading,
  } = useApi(() => IncomeService.getIncomeSum({ type: 'level_roi_income' }), true); // Set immediate=true

  // Refetch data when page or rowsPerPage changes
  useEffect(() => {
    if (page > 0 || rowsPerPage !== 10) { // Only refetch if not on first page with default rows
      fetchIncomeData();
    }
  }, [page, rowsPerPage, fetchIncomeData]);

  // Update income data when API response changes
  useEffect(() => {
    if (data?.result) {
      setIncomeData(data.result.list || []);
      setTotalRows(data.result.total || 0); // Use total from API for pagination
    }
  }, [data]);

  // Update summary data
  useEffect(() => {
    if (summaryData?.result) {
      setTotalIncome(summaryData.result.totalAmount || 0);
    }
  }, [summaryData]);

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = incomeData.filter((income) => {
      const matchesSearch = searchTerm === '' ||
        income.extra?.fromUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.user_from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.user_from_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.amount.toString().includes(searchTerm);

      const matchesStatus = statusFilter === '' || income.status === statusFilter;
      const matchesLevel = levelFilter === '' || income.level.toString() === levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'fromUser':
          aValue = a.extra?.fromUser || a.user_from_email || '';
          bValue = b.extra?.fromUser || b.user_from_email || '';
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [incomeData, searchTerm, statusFilter, levelFilter, sortBy, sortOrder]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handler functions for search, filter, and sorting
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleLevelFilterChange = (event) => {
    setLevelFilter(event.target.value);
    setPage(0);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLevelFilter('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'credited':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      1: { bg: '#e3f2fd', color: '#1976d2', label: 'Level 1' },
      2: { bg: '#f3e5f5', color: '#7b1fa2', label: 'Level 2' },
      3: { bg: '#e8f5e8', color: '#388e3c', label: 'Level 3' },
      4: { bg: '#fff3e0', color: '#f57c00', label: 'Level 4' },
      5: { bg: '#fce4ec', color: '#c2185b', label: 'Level 5' },
      6: { bg: '#e0f2f1', color: '#00695c', label: 'Level 6' },
      7: { bg: '#f1f8e9', color: '#558b2f', label: 'Level 7' },
      8: { bg: '#fff8e1', color: '#ff8f00', label: 'Level 8' },
      9: { bg: '#fafafa', color: '#424242', label: 'Level 9' },
      10: { bg: '#e8eaf6', color: '#3f51b5', label: 'Level 10' },
    };
    return colors[level] || { bg: '#f5f5f5', color: '#666', label: `Level ${level}` };
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader title="Level ROI Income" />

      {/* Summary Card */}
      {/* <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: `1px solid ${theme.palette.divider}`,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }} gutterBottom>
                    Total Team Trade Income
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {summaryLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : formatCurrency(totalIncome, 4)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                    From {filteredAndSortedData.length} transactions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      {/* Search and Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover}20 100%)`,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user email, name, or amount..."
              value={searchTerm}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                  }
                }
              }}
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
                sx={{
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="credited">Credited</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Level</InputLabel>
              <Select
                value={levelFilter}
                label="Level"
                onChange={handleLevelFilterChange}
                sx={{
                  borderRadius: 3,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <MenuItem value="">All Levels</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <MenuItem key={level} value={level.toString()}>
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Tooltip title="Clear all filters">
                <IconButton
                  onClick={clearFilters}
                  size="medium"
                  sx={{
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    px: 2,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                    Clear
                  </Typography>
                </IconButton>
              </Tooltip>

              <Chip
                icon={<TrendingUpIcon />}
                label={`${filteredAndSortedData.length} Records`}
                color="primary"
                variant="filled"
                sx={{
                  borderRadius: 3,
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  height: 40,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          background: theme.palette.background.paper,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">
              Error loading income data. Please try again.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead
                  sx={{
                    backgroundColor: theme.palette.action.hover,
                    '& .MuiTableCell-head': {
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      borderBottom: `2px solid ${theme.palette.divider}`,
                    }
                  }}
                >
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'created_at'}
                        direction={sortBy === 'created_at' ? sortOrder : 'asc'}
                        onClick={() => handleSort('created_at')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${theme.palette.primary.main} !important`
                          }
                        }}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <TableSortLabel
                        active={sortBy === 'fromUser'}
                        direction={sortBy === 'fromUser' ? sortOrder : 'asc'}
                        onClick={() => handleSort('fromUser')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${theme.palette.primary.main} !important`
                          }
                        }}
                      >
                        From User
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'amount'}
                        direction={sortBy === 'amount' ? sortOrder : 'asc'}
                        onClick={() => handleSort('amount')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${theme.palette.primary.main} !important`
                          }
                        }}
                      >
                        Amount
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <TableSortLabel
                        active={sortBy === 'level'}
                        direction={sortBy === 'level' ? sortOrder : 'asc'}
                        onClick={() => handleSort('level')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${theme.palette.primary.main} !important`
                          }
                        }}
                      >
                        Level
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'status'}
                        direction={sortBy === 'status' ? sortOrder : 'asc'}
                        onClick={() => handleSort('status')}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: `${theme.palette.primary.main} !important`
                          }
                        }}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box sx={{ py: 4 }}>
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            {filteredAndSortedData.length === 0 && incomeData.length > 0
                              ? 'No records match your search criteria'
                              : 'No Level ROI income records found'
                            }
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {filteredAndSortedData.length === 0 && incomeData.length > 0
                              ? 'Try adjusting your search or filter criteria'
                              : 'Income records will appear here once available'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((income) => {
                      const levelColor = getLevelColor(income.level);
                      return (
                        <TableRow
                          key={income._id}
                          sx={{
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                              transform: 'translateY(-1px)',
                              transition: 'all 0.2s ease-in-out',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: theme.palette.action.hover + '20',
                            },
                            borderLeft: `4px solid ${levelColor.color}`,
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Box>
                              <Typography variant="body2" fontWeight="600" color="text.primary">
                                {formatDate(income.created_at)}
                              </Typography>
                              {/* Mobile: Show additional info */}
                              {isMobile && (
                                <Stack spacing={1} sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="primary.main" fontWeight="medium">
                                    {income.extra?.fromUser || income.user_from_email || 'N/A'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Chip
                                      label={levelColor.label}
                                      size="small"
                                      sx={{
                                        backgroundColor: levelColor.bg,
                                        color: levelColor.color,
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem',
                                        height: 24,
                                        borderRadius: 2,
                                      }}
                                    />
                                    <Chip
                                      label={income.status.charAt(0).toUpperCase() + income.status.slice(1)}
                                      size="small"
                                      color={getStatusColor(income.status)}
                                      sx={{ fontSize: '0.7rem', height: 24, borderRadius: 2 }}
                                    />
                                  </Box>
                                </Stack>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, py: 2 }}>
                            <Box>
                              <Typography variant="body2" fontWeight="600" color="primary.main">
                                {income.extra?.fromUser || income.user_from_email || 'N/A'}
                              </Typography>
                              {income.user_from_name && (
                                <Typography variant="caption" color="text.secondary">
                                  {income.user_from_name}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              color="success.main"
                              sx={{
                                fontSize: { xs: '1rem', sm: '1.25rem' },
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}
                            >
                              {formatCurrency(income.amount, 4)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, py: 2 }}>
                            <Chip
                              label={levelColor.label}
                              size="medium"
                              sx={{
                                backgroundColor: levelColor.bg,
                                color: levelColor.color,
                                fontWeight: 'bold',
                                border: `2px solid ${levelColor.color}30`,
                                borderRadius: 3,
                                fontSize: '0.875rem',
                                height: 32,
                                boxShadow: `0 2px 8px ${levelColor.color}20`,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={income.status.charAt(0).toUpperCase() + income.status.slice(1)}
                              size="medium"
                              color={getStatusColor(income.status)}
                              sx={{
                                fontWeight: 'bold',
                                borderRadius: 3,
                                fontSize: '0.875rem',
                                height: 32,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredAndSortedData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              showFirstButton
              showLastButton
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                '& .MuiTablePagination-toolbar': {
                  paddingLeft: { xs: 1, sm: 2 },
                  paddingRight: { xs: 1, sm: 2 },
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                },
              }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LevelRoiIncome;
