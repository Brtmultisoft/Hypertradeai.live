'use strict';

/**
 * Helper functions for pagination
 */
const paginationHelper = {
  /**
   * Transform mongoose-paginate-v2 response to a standardized format
   * @param {Object} paginateResult - Result from mongoose-paginate-v2
   * @returns {Object} Standardized pagination response
   */
  getPaginationResponse: (paginateResult) => {
    const {
      docs,
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage
    } = paginateResult;

    return {
      data: docs,
      pagination: {
        total: totalDocs,
        limit,
        totalPages,
        currentPage: page,
        hasPrevPage,
        hasNextPage,
        prevPage: prevPage || null,
        nextPage: nextPage || null
      }
    };
  },

  /**
   * Create pagination parameters for manual pagination
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @returns {Object} Pagination parameters
   */
  getPaginationParams: (page = 1, limit = 10) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    return {
      skip,
      limit: limitNum,
      page: pageNum
    };
  },

  /**
   * Create pagination response for manual pagination
   * @param {Array} data - Data array
   * @param {number} total - Total number of items
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @returns {Object} Pagination response
   */
  createPaginationResponse: (data, total, page = 1, limit = 10) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      data,
      pagination: {
        total,
        limit: limitNum,
        totalPages,
        currentPage: pageNum,
        hasPrevPage: pageNum > 1,
        hasNextPage: pageNum < totalPages,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
        nextPage: pageNum < totalPages ? pageNum + 1 : null
      }
    };
  }
};

module.exports = {
  paginationHelper
};
