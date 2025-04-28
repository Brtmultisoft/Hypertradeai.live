import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for server-side table operations (pagination, sorting, filtering)
 * @param {Function} fetchFunction - Function to fetch data from server
 * @param {Object} initialParams - Initial parameters for the fetch function
 * @param {boolean} immediate - Whether to fetch data immediately
 * @returns {Object} Table state and handlers
 */
const useServerTable = (fetchFunction, initialParams = {}, immediate = true) => {
  // Table state
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Pagination state
  const [page, setPage] = useState(initialParams.page || 0);
  const [rowsPerPage, setRowsPerPage] = useState(initialParams.limit || 10);
  
  // Sorting state
  const [sortBy, setSortBy] = useState(initialParams.sortBy || '');
  const [sortDirection, setSortDirection] = useState(initialParams.sortDirection || 'asc');
  
  // Filter state
  const [filters, setFilters] = useState(initialParams.filters || {});
  
  // Current params state
  const [params, setParams] = useState({
    page: page + 1, // API usually expects 1-based page index
    limit: rowsPerPage,
    sortBy,
    sortDirection,
    ...filters,
  });

  // Function to fetch data with current params
  const fetchData = useCallback(async (overrideParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Merge current params with override params
      const currentParams = {
        ...params,
        ...overrideParams,
      };
      
      // Update params state
      setParams(currentParams);
      
      // Call fetch function with current params
      const response = await fetchFunction(currentParams);
      
      // Check if response has the expected structure
      if (response && response.result) {
        setData(response.result.list || []);
        setTotalCount(response.result.total || 0);
      } else {
        console.error('Unexpected response structure:', response);
        setError('Unexpected response structure');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, params]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
    fetchData({ page: newPage + 1 }); // API usually expects 1-based page index
  }, [fetchData]);

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback((newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
    fetchData({ page: 1, limit: newRowsPerPage });
  }, [fetchData]);

  // Handle sort change
  const handleSortChange = useCallback((column, direction) => {
    setSortBy(column);
    setSortDirection(direction);
    fetchData({ sortBy: column, sortDirection: direction });
  }, [fetchData]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      
      // Remove filters with empty values
      Object.keys(updatedFilters).forEach(key => {
        if (updatedFilters[key] === '' || updatedFilters[key] === null || updatedFilters[key] === undefined) {
          delete updatedFilters[key];
        }
      });
      
      return updatedFilters;
    });
    
    setPage(0); // Reset to first page
    fetchData({ page: 1, ...newFilters });
  }, [fetchData]);

  // Fetch data on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    // Data
    data,
    loading,
    error,
    totalCount,
    
    // Pagination
    page,
    rowsPerPage,
    
    // Sorting
    sortBy,
    sortDirection,
    
    // Filters
    filters,
    
    // Handlers
    handlePageChange,
    handleRowsPerPageChange,
    handleSortChange,
    handleFilterChange,
    
    // Fetch function
    fetchData,
  };
};

export default useServerTable;
