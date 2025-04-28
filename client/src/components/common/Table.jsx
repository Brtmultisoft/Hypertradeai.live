import { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  useTheme,
  Checkbox,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  ViewColumn as ViewColumnIcon,
  SaveAlt as SaveAltIcon,
} from '@mui/icons-material';
import { debounce } from '../../utils/helpers';

// Memoized TableRow component for better performance
const MemoizedTableRow = memo(({ row, columns, onRowClick }) => (
  <TableRow
    hover
    onClick={onRowClick ? () => onRowClick(row) : undefined}
    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
  >
    {columns.map((column) => {
      const value = row[column.id];
      return (
        <TableCell key={column.id} align={column.align || 'left'}>
          {column.format ? column.format(value, row) : value}
        </TableCell>
      );
    })}
  </TableRow>
));

const Table = ({
  columns,
  data,
  title,
  loading = false,
  pagination = true,
  search = true,
  initialSortBy = '',
  initialSortDirection = 'asc',
  onRowClick,
  emptyMessage = 'No data available',
  refreshData = null,
  serverSide = false,
  totalCount = 0,
  onFilterChange = null,
  onSortChange = null,
  onPageChange = null,
  virtualized = false,
  rowHeight = 53, // Default MUI TableRow height
  maxHeight = 440,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.id));
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  // Handle page change with server-side option
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
    if (serverSide && onPageChange) {
      onPageChange(newPage, rowsPerPage);
    }
  }, [serverSide, onPageChange, rowsPerPage]);

  // Handle rows per page change with server-side option
  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    if (serverSide && onPageChange) {
      onPageChange(0, newRowsPerPage);
    }
  }, [serverSide, onPageChange]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setPage(0);
      if (serverSide && onFilterChange) {
        onFilterChange({ search: value });
      }
    }, 300),
    [serverSide, onFilterChange]
  );

  // Handle search
  const handleSearch = useCallback((event) => {
    debouncedSearch(event.target.value);
  }, [debouncedSearch]);

  // Handle sort with server-side option
  const handleSort = useCallback((columnId) => {
    const isAsc = sortBy === columnId && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortDirection(newDirection);
    setSortBy(columnId);

    if (serverSide && onSortChange) {
      onSortChange(columnId, newDirection);
    }
  }, [sortBy, sortDirection, serverSide, onSortChange]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (refreshData) {
      refreshData();
    }
  }, [refreshData]);

  // Export data to CSV
  const exportToCsv = useCallback(() => {
    const visibleData = data.map(row => {
      const newRow = {};
      visibleColumns.forEach(colId => {
        const column = columns.find(col => col.id === colId);
        if (column) {
          newRow[column.label] = row[column.id];
        }
      });
      return newRow;
    });

    const headers = visibleColumns.map(colId => {
      const column = columns.find(col => col.id === colId);
      return column ? column.label : colId;
    });

    const csvContent = [
      headers.join(','),
      ...visibleData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${title || 'data'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, visibleColumns, columns, title]);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (serverSide) return data;

    if (!searchTerm) return data;

    return data.filter((row) => {
      // Search in all string and number fields
      return Object.keys(row).some((key) => {
        const value = row[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });
  }, [data, searchTerm, serverSide]);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (serverSide) return filteredData;

    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Default comparison
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredData, sortBy, sortDirection, serverSide]);

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedData, pagination, page, rowsPerPage]);

  // Calculate visible rows for virtualization
  const visibleRows = useMemo(() => {
    if (!virtualized) return paginatedData;

    const containerHeight = maxHeight;
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const startIndex = Math.max(0, Math.floor(page * rowsPerPage));
    const endIndex = Math.min(startIndex + visibleRowCount, paginatedData.length);

    return paginatedData.slice(startIndex, endIndex);
  }, [paginatedData, virtualized, maxHeight, rowHeight, page, rowsPerPage]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
      }}
    >
      {/* Table Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {/* Title and Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {title && (
            <Typography variant="h6" component="h2" fontWeight="bold">
              {title}
            </Typography>
          )}

          {/* Table Actions */}
          <Box sx={{ display: 'flex', ml: 1 }}>
            {refreshData && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Table options">
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Options Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={exportToCsv}>
                <ListItemIcon>
                  <SaveAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export to CSV" />
              </MenuItem>

              <MenuItem onClick={handleFilterMenuOpen}>
                <ListItemIcon>
                  <ViewColumnIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Show/Hide Columns" />
              </MenuItem>
            </Menu>

            {/* Column Visibility Menu */}
            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={handleFilterMenuClose}
            >
              {columns.map((column) => (
                <MenuItem key={column.id} onClick={() => toggleColumnVisibility(column.id)}>
                  <Checkbox
                    checked={visibleColumns.includes(column.id)}
                    size="small"
                  />
                  <ListItemText primary={column.label} />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>

        {/* Search */}
        {search && (
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              ml: { xs: 0, sm: 'auto' },
              width: { xs: '100%', sm: '250px' },
              mt: { xs: 1, sm: 0 }
            }}
          />
        )}
      </Box>

      {/* Table Content */}
      <TableContainer sx={{ maxHeight: virtualized ? maxHeight : 440 }}>
        <MuiTable stickyHeader>
          <TableHead>
            <TableRow>
              {columns
                .filter(column => visibleColumns.includes(column.id))
                .map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth, width: column.width }}
                  sortDirection={sortBy === column.id ? sortDirection : false}
                  sx={{
                    fontWeight: 'bold',
                    backgroundColor: theme.palette.background.light,
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={sortBy === column.id}
                      direction={sortBy === column.id ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter(col => visibleColumns.includes(col.id)).length}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading data...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (virtualized ? visibleRows : paginatedData).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter(col => visibleColumns.includes(col.id)).length}
                  align="center"
                  sx={{ py: 5 }}
                >
                  <Typography variant="body2">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Use virtualized rows if virtualization is enabled, otherwise use paginated data
              (virtualized ? visibleRows : paginatedData).map((row, index) => (
                <MemoizedTableRow
                  key={row.id || index}
                  row={row}
                  columns={columns.filter(col => visibleColumns.includes(col.id))}
                  onRowClick={onRowClick}
                />
              ))
            )}
          </TableBody>
        </MuiTable>
      </TableContainer>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={serverSide ? totalCount : filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

export default Table;
