import ApiService from './api.service';

/**
 * User Service for handling user-related API calls
 */
const UserService = {
  /**
   * Get all users with pagination, sorting, and filtering
   * @param {Object} options - Request options
   * @returns {Promise} Users data
   */
  async getAllUsers({
    page = 1,
    limit = 10,
    search = '',
    sortField = 'wallet',
    sortDirection = 'desc',
    referrerEmail = '',
    token,
    useCache = true,
  }) {
    const sortByParam = sortField ? `${sortField}:${sortDirection}` : 'wallet:desc';

    try {
      // First try with the optimized endpoint
      return await ApiService.request({
        endpoint: '/admin/get-all-users',
        params: {
          page,
          limit,
          search,
          sort_by: sortByParam,
          referrer_email: referrerEmail,
        },
        token,
        useCache,
        requestId: `users_${page}_${limit}_${sortByParam}_${search}_${referrerEmail}`,
      });
    } catch (error) {
      console.error('Error in primary endpoint, trying fallback:', error.detailedMessage || error.message);

      // If the optimized endpoint fails, try a fallback endpoint
      try {
        // Try alternative endpoint if available
        const fallbackResponse = await ApiService.request({
          endpoint: '/admin/users', // Fallback endpoint if different
          params: {
            page,
            limit,
            search,
            sort_by: sortByParam,
            referrer_email: referrerEmail,
          },
          token,
          useCache: false, // Don't use cache for fallback
          requestId: `users_fallback_${page}_${limit}_${sortByParam}_${search}_${referrerEmail}`,
        });

        console.log('Fallback endpoint succeeded');
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('Fallback endpoint also failed:', fallbackError.detailedMessage || fallbackError.message);

        // Add the fallback error information to the original error
        error.fallbackError = fallbackError;

        // Rethrow the original error with enhanced information
        throw error;
      }
    }
  },

  /**
   * Prefetch next page of users for smoother pagination
   * @param {Object} options - Request options
   */
  prefetchNextPage({
    currentPage,
    limit,
    search,
    sortField,
    sortDirection,
    referrerEmail,
    token,
  }) {
    // Only prefetch if we're not on the first page (to avoid duplicate requests)
    if (currentPage > 0) {
      this.getAllUsers({
        page: currentPage + 2, // +2 because currentPage is 0-based, but API is 1-based
        limit,
        search,
        sortField,
        sortDirection,
        referrerEmail,
        token,
        useCache: true,
      }).catch(() => {
        // Silently fail for prefetch requests
        console.log('Prefetch request failed, but that\'s okay');
      });
    }
  },

  /**
   * Create a login request for a user
   * @param {Object} options - Request options
   * @returns {Promise} Login request response
   */
  async createLoginRequest({ userId, token }) {
    const loginAttemptId = `login_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    return ApiService.request({
      method: 'POST',
      endpoint: '/admin/user-login-request',
      data: {
        user_id: userId,
        clear_existing: true,
        login_attempt_id: loginAttemptId,
      },
      token,
      useCache: false,
      requestId: `login_${userId}`,
    });
  },

  /**
   * Get user statistics and users in parallel
   * @param {Object} options - Request options
   * @returns {Promise} Combined data
   */
  async getUsersWithStats({
    page = 1,
    limit = 10,
    search = '',
    sortField = 'wallet',
    sortDirection = 'desc',
    referrerEmail = '',
    token,
  }) {
    const requests = [
      {
        endpoint: '/admin/get-all-users',
        params: {
          page,
          limit,
          search,
          sort_by: `${sortField}:${sortDirection}`,
          referrer_email: referrerEmail,
        },
        token,
        requestId: `users_${page}_${limit}_${sortField}_${sortDirection}_${search}_${referrerEmail}`,
      },
      {
        endpoint: '/admin/user-stats',
        token,
        requestId: 'user_stats',
      },
    ];

    const [usersResponse, statsResponse] = await ApiService.parallel(requests);

    return {
      users: usersResponse,
      stats: statsResponse,
    };
  },
};

export default UserService;
