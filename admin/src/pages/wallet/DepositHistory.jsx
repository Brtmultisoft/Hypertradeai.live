import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';
import PageHeader from '../../components/PageHeader';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, API_URL } from '../../config';

const DepositHistory = () => {
  const theme = useTheme();
  const { getToken } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchDepositHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/admin/get-all-deposits`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm || undefined,
          sortBy: sortField || 'created_at',
          order: sortDirection || 'desc',
          status: filterStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      if (response.data?.status) {
        const depositList = response.data.result.list || [];
        setDeposits(depositList);
        setTotalDeposits(response.data.result.total || 0);
      } else {
        setError(response.data?.message || 'Failed to fetch deposit history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      console.error('Error fetching deposit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepositHistory();
  }, [page, rowsPerPage, sortField, sortDirection, filterStatus]);

  const handleSearch = () => {
    setPage(0);
    fetchDepositHistory();
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />;
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 2:
        return 'success';
      case 1:
        return 'warning';
      case 0:
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shorten = (text) => text?.slice(0, 6) + '...' + text?.slice(-4);

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader title="Deposit History" subtitle="All deposit transactions" />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={handleSearch}><SearchIcon /></IconButton></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="1">Pending</MenuItem>
                <MenuItem value="2">Success</MenuItem>
                <MenuItem value="0">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3} md={1}>
            <Button fullWidth onClick={handleSearch} variant="contained" startIcon={<DateRangeIcon />}>Apply</Button>
          </Grid>
          <Grid item xs={12} sm={3} md={2}>
            <Button fullWidth onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); setFilterStatus(''); setSortField('created_at'); setSortDirection('desc'); setPage(0); fetchDepositHistory(); }} variant="outlined" startIcon={<RefreshIcon />}>Reset</Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {["Username", "User", "User ID", "TxID", "Amount", "Currency", "Address", "Status", "Date"].map((col, i) => (
                  <TableCell key={i} onClick={() => handleSort(col.toLowerCase())} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    {col} {renderSortIcon(col.toLowerCase())}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10}><Box textAlign="center"><CircularProgress /><div>Loading...</div></Box></TableCell></TableRow>
              ) : deposits.length === 0 ? (
                <TableRow><TableCell colSpan={10}><Box textAlign="center">No records found</Box></TableCell></TableRow>
              ) : (
                deposits.map((dep) => (
                  <TableRow key={dep._id}>
                    <TableCell>{dep.username}</TableCell>
                    <TableCell>{dep.user}</TableCell>
                    <TableCell>{dep.user_id || '-'}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title={dep.txid}><span>{shorten(dep.txid)}</span></Tooltip>
                        <Tooltip title="Copy TxID"><IconButton size="small" onClick={() => handleCopy(dep.txid)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="View on BscScan"><IconButton size="small" href={`https://bscscan.com/tx/${dep.txid}`} target="_blank" rel="noopener noreferrer"><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>{formatCurrency(dep.amount)}</TableCell>
                    <TableCell>{dep.currency}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title={dep.address}><span>{shorten(dep.address)}</span></Tooltip>
                        <Tooltip title="Copy Address"><IconButton size="small" onClick={() => handleCopy(dep.address)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={['Rejected', 'Pending', 'Completed'][dep.status]} color={getStatusChipColor(dep.status)} size="small" /></TableCell>
                    <TableCell>{formatDate(dep.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          component="div"
          count={totalDeposits}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default DepositHistory;
