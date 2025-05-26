import { useState, useEffect, useCallback } from 'react';
import UserService from '../services/user.service';
import { useSnackbar } from 'notistack';
import { format, isToday as dateFnsIsToday, parseISO, subDays } from 'date-fns';

// Define types for trade activation data
export interface TradeActivation {
  _id: string;
  user_id: string;
  activation_date: string;
  activation_time: string;
  ip_address: string;
  device_info: {
    userAgent?: string;
    platform?: string;
    [key: string]: any;
  };
  status: 'active' | 'expired' | 'cancelled';
  expiry_date: string;
  metadata: {
    user_email?: string;
    username?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface TradeActivationStatus {
  isActivated: boolean;
  activation: TradeActivation | null;
  user: {
    dailyProfitActivated: boolean;
    lastDailyProfitActivation: string | null;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterOptions {
  startDate: string | null;
  endDate: string | null;
}

export const useTradeActivation = () => {
  const [activationHistory, setActivationHistory] = useState<TradeActivation[]>([]);
  const [todayActivation, setTodayActivation] = useState<TradeActivation | null>(null);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activating, setActivating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: subDays(new Date(), 10).toISOString(),
    endDate: null
  });
  // Add a cache to prevent redundant API calls
  const [apiCache, setApiCache] = useState<{
    [key: string]: {
      data: any;
      timestamp: number;
    }
  }>({});
  const { enqueueSnackbar } = useSnackbar();

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Format time for display in 12-hour format
  const formatTime = (timeString: string): string => {
    try {
      // If timeString is in HH:MM:SS format
      const [hours, minutes, seconds] = timeString.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        return timeString;
      }

      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM

      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // Check if a date is today
  const isToday = (dateString: string): boolean => {
    try {
      return dateFnsIsToday(parseISO(dateString));
    } catch (error) {
      console.error('Error checking if date is today:', error);
      return false;
    }
  };

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Update pagination
  const updatePagination = useCallback((newPage: number, newLimit?: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
      limit: newLimit || prev.limit
    }));
  }, []);

  // Generate a cache key based on parameters
  const generateCacheKey = useCallback((page: number, limit: number, filters: FilterOptions) => {
    return `history_${page}_${limit}_${filters.startDate || 'null'}_${filters.endDate || 'null'}`;
  }, []);

  // Check if cache is valid (less than 30 seconds old)
  const isCacheValid = useCallback((cacheKey: string) => {
    const cacheEntry = apiCache[cacheKey];
    if (!cacheEntry) return false;

    const now = Date.now();
    const cacheAge = now - cacheEntry.timestamp;
    // Cache is valid for 30 seconds
    return cacheAge < 30000;
  }, [apiCache]);

  // Fetch activation history with date filtering and pagination
  const fetchActivationHistory = useCallback(async (page?: number, limit?: number, newFilters?: Partial<FilterOptions>) => {
    try {
      // Apply new filters if provided
      const currentFilters = { ...filters };
      if (newFilters) {
        Object.assign(currentFilters, newFilters);
        updateFilters(newFilters);
      }

      const currentPage = page || pagination.page;
      const currentLimit = limit || pagination.limit;

      // Generate cache key
      const cacheKey = generateCacheKey(currentPage, currentLimit, currentFilters);

      // Check if we have a valid cache entry
      if (isCacheValid(cacheKey)) {
        console.log('Using cached activation history data');
        const cachedData = apiCache[cacheKey].data;
        setActivationHistory(cachedData.activations || []);
        setPagination(cachedData.pagination || pagination);

        // Still check for today's activation
        const todayAct = cachedData.activations.find((act: TradeActivation) => isToday(act.activation_date));
        if (todayAct) {
          setTodayActivation(todayAct);
          setIsActivated(true);
        }

        return;
      }

      // If no valid cache, proceed with API call
      setLoading(true);
      setError(null);

      // Prepare query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', String(currentPage));
      queryParams.append('limit', String(currentLimit));

      if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate);

      const response = await UserService.getTradeActivationHistory(queryParams.toString());

      if (response.status) {
        const { activations, pagination: paginationData, filters: responseFilters } = response.data;

        // Update state
        setActivationHistory(activations || []);
        setPagination(paginationData || pagination);

        // Update filters with server response
        if (responseFilters) {
          setFilters(responseFilters);
        }

        // Cache the response
        setApiCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: response.data,
            timestamp: Date.now()
          }
        }));

        // Find today's activation
        const todayActivation = activations.find((act: TradeActivation) => isToday(act.activation_date));

        if (todayActivation) {
          setTodayActivation(todayActivation);
          setIsActivated(true);
        } else if (!activations.some((act: TradeActivation) => isToday(act.activation_date))) {
          // Only fetch status if we don't have today's activation in the current data
          // and we haven't already checked all pages
          const statusCacheKey = 'activation_status';
          if (!isCacheValid(statusCacheKey)) {
            await fetchActivationStatus();
          }
        }
      } else {
        throw new Error(response.message || 'Failed to fetch activation history');
      }
    } catch (err: any) {
      console.error('Error fetching activation history:', err);
      setError(err.message || 'Failed to fetch activation history');
      enqueueSnackbar('Failed to fetch activation history', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, filters, pagination, updateFilters, generateCacheKey, isCacheValid, apiCache]);

  // Fetch activation status
  const fetchActivationStatus = useCallback(async () => {
    try {
      // Check if we have a valid cache entry
      const cacheKey = 'activation_status';
      if (isCacheValid(cacheKey)) {
        console.log('Using cached activation status data');
        const cachedData = apiCache[cacheKey].data;
        setIsActivated(cachedData.isActivated);
        setTodayActivation(cachedData.activation);
        return;
      }

      setLoading(true);
      setError(null);
      const response = await UserService.getDailyTradingStatus();

      if (response.status) {
        const { isActivated, activation } = response.data;
        setIsActivated(isActivated);
        setTodayActivation(activation);

        // Cache the response
        setApiCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: response.data,
            timestamp: Date.now()
          }
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch activation status');
      }
    } catch (err: any) {
      console.error('Error fetching activation status:', err);
      setError(err.message || 'Failed to fetch activation status');
    } finally {
      setLoading(false);
    }
  }, [isCacheValid, apiCache]);

  // Clear all cache
  const clearCache = useCallback(() => {
    setApiCache({});
  }, []);

  // Activate daily trading
  const activateDailyTrading = useCallback(async () => {
    try {
      setActivating(true);
      setError(null);
      const response = await UserService.activateDailyTrading();

      if (response.status) {
        const { activation } = response.data;
        setTodayActivation(activation);
        setIsActivated(true);
        enqueueSnackbar('Daily trading activated successfully', { variant: 'success' });

        // Clear cache since data has changed
        clearCache();

        // Refresh activation history
        fetchActivationHistory();
        return true;
      } else {
        throw new Error(response.message || 'Failed to activate daily trading');
      }
    } catch (err: any) {
      console.error('Error activating daily trading:', err);
      setError(err.message || 'Failed to activate daily trading');
      enqueueSnackbar(err.message || 'Failed to activate daily trading', { variant: 'error' });
      return false;
    } finally {
      setActivating(false);
    }
  }, [enqueueSnackbar, fetchActivationHistory, clearCache]);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters({
      startDate: subDays(new Date(), 10).toISOString(),
      endDate: null
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    // Clear cache when filters are reset
    clearCache();
  }, [clearCache]);

  // Load data on mount
  useEffect(() => {
    // Use Promise.all to fetch both activation history and status in parallel
    Promise.all([
      fetchActivationHistory(),
      fetchActivationStatus()
    ]).catch(error => {
      console.error('Error initializing trade activation data:', error);
    });

    // Set up interval to clear cache every 5 minutes to ensure fresh data
    const cacheCleanupInterval = setInterval(() => {
      clearCache();
    }, 5 * 60 * 1000);

    // Clean up interval on unmount
    return () => {
      clearInterval(cacheCleanupInterval);
    };
  }, [fetchActivationHistory, fetchActivationStatus, clearCache]);

  return {
    // Data
    activationHistory,
    todayActivation,
    isActivated,
    loading,
    activating,
    error,
    pagination,
    filters,

    // Formatting functions
    formatDate,
    formatTime,
    isToday,

    // Data fetching functions
    fetchActivationHistory,
    fetchActivationStatus,
    activateDailyTrading,

    // Filter and pagination functions
    updateFilters,
    updatePagination,
    resetFilters,
    clearCache
  };
};

export default useTradeActivation;
