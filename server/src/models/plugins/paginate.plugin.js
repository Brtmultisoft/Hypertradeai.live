const paginate = (schema) => {
  /**
   * @typedef {Object} QueryResult
   * @property {Document[]} results - Results found
   * @property {number} page - Current page
   * @property {number} limit - Maximum number of results per page
   * @property {number} totalPages - Total number of pages
   * @property {number} totalResults - Total number of documents
   */
  /**
   * Query for documents with pagination
   * @param {Object} [filter] - Mongo filter
   * @param {Object} [options] - Query options
   * @param {string} [options.sort_by] - Sorting criteria using the format: sortField:(desc|asc). Multiple sorting criteria should be separated by commas (,)
   * @param {string} [options.populate] - Populate data fields. Hierarchy of fields should be separated by (.). Multiple populating criteria should be separated by commas (,)
   * @param {number} [options.limit] - Maximum number of results per page (default = 10)
   * @param {number} [options.page] - Current page (default = 1)
   * @returns {Promise<QueryResult>}
   */
  schema.statics.paginate = async function (filter, options) {
    let sort = (options.pipeline) ? {} : '';

    if (options.sort_by) {
      const sortingCriteria = [];
      options.sort_by.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        if (options.sort_fields.includes(key.toLowerCase())) {
          if (options.pipeline) {
            sort[(key.toLowerCase())] = order.toLowerCase() === 'desc' ? -1 : 1;
          }
          else {
            sortingCriteria.push((order.toLowerCase() === 'desc' ? '-' : '') + key.toLowerCase());
          }
        }
      });
      if (!options.pipeline && sortingCriteria) {
        sort = sortingCriteria.join(' ');
      }
    }

    if(!sort || (typeof sort === 'object' && Object.keys(sort).length === 0)){
      sort = (options.pipeline) ? { 'created_at': -1 } : '-created_at';
    }

    let limit = -1;
    let skip = 0;
    let page = 1;

    if (options.limit != -1) {
      limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
      page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
      skip = (page - 1) * limit;
    }

    if (options.pipeline) {
      let pipeline = [];
      pipeline.push({ $match: filter });
      pipeline = [...pipeline, ...options.pipeline];
      pipeline.push(
        {
          $facet: {
            metadata: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                },
              },
            ],
            list: [
              { $sort: sort },
              { $skip: skip },
              { $limit: limit },
            ],
          },
        },
        {
          $project: {
            list: 1,
            total: { $arrayElemAt: ["$metadata.total", 0] },
          },
        }
      );

      let result = await this.aggregate(pipeline).exec();
      result = result[0];

      let totalPages = 1;
      if (limit > 0) {
        totalPages = Math.ceil(result.total / limit);
      }
      return { ...result, ...{ page, limit, totalPages } };
    } else {
      const countPromise = this.countDocuments(filter).exec();
      let docsPromise = this.find(filter).sort(sort).skip(skip);

      if (options.limit != -1) {
        docsPromise.limit(limit);
      }

      if (options.populate) {
        options.populate.split(',').forEach((populateOption) => {
          docsPromise = docsPromise.populate(
            populateOption
              .split('.')
              .reverse()
              .reduce((a, b) => ({ path: b, populate: a }))
          );
        });
      }
      docsPromise = docsPromise.exec();
      return Promise.all([countPromise, docsPromise]).then((values) => {
        const [totalResults, results] = values;
        let totalPages = 1;
        if (limit > 0) {
          totalPages = Math.ceil(totalResults / limit);
        }

        const result = {
          list: results,
          page,
          limit,
          totalPages,
          total: totalResults,
        };
        return Promise.resolve(result);
      });
    }
  };
};

module.exports = paginate;