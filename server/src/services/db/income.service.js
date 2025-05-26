'use strict';
const { incomeModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING INCOME MODEL QUERIES
 *********************************************/
class Income {
	constructor() {
		//if income instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = incomeModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
	}
	async getAll(data, user_id = null) {
		let params = {};
		if (user_id) {
			params.user_id = ObjectId(user_id);
		}
		if (data.type !== undefined) {
			// Handle both numeric and string types
			if (!isNaN(parseInt(data.type)) && typeof data.type !== 'string') {
				params.type = parseInt(data.type);
			} else {
				// If exact_type_match is true, use exact string matching
				// This is important for enum fields like 'referral_bonus'
				if (data.exact_type_match) {
					params.type = data.type;
				} else {
					// Otherwise use regex for partial matching (backward compatibility)
					params.type = new RegExp(data.type, 'i');
				}
			}

			// Log the type parameter for debugging
			console.log('Income type filter:', params.type);
		}

		// Apply standard filters if not searching
		if (!data.search) {
			params = {
				...advancseSearch(data, ['amount', 'wamt', 'uamt', 'camt', 'iamount', 'level', 'pool', 'days']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}

		let filter = params;
		const options = pick(data, ['sort_by', 'limit', 'page']);
		options.sort_fields = ['amount', 'wamt', 'uamt', 'camt', 'iamount', 'level', 'pool', 'days', 'created_at'];
		options.populate = '';
		options.pipeline = [];

		// Always include user lookup for referral data
		const userLookupPipeline = [
			// Convert and lookup user_id
			{
				$addFields: {
					user_id: {
						$convert: {
							input: "$user_id",
							to: "objectId",
							onError: 0,
							onNull: 0
						}
					}
				}
			},
			{
				$lookup: {
					from: "users",
					localField: "user_id",
					foreignField: "_id",
					as: "user"
				}
			},
			{ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

			// Convert and lookup user_id_from (referral user)
			{
				$addFields: {
					user_id_from: {
						$convert: {
							input: "$user_id_from",
							to: "objectId",
							onError: 0,
							onNull: 0
						}
					}
				}
			},
			{
				$lookup: {
					from: "users",
					localField: "user_id_from",
					foreignField: "_id",
					as: "user_from"
				}
			},
			{ $unwind: { path: "$user_from", preserveNullAndEmptyArrays: true } }
		];

		// Add user lookup to pipeline
		options.pipeline = [...userLookupPipeline, ...options.pipeline];

		if (data.search) {
			// Create a pipeline for searching across user fields
			const searchPipeline = [
				{
					$match: {
						$or: [
							{ "user_from.username": { $regex: data.search, $options: "i" } },
							{ "user_from.email": { $regex: data.search, $options: "i" } },
							{ "user_from.name": { $regex: data.search, $options: "i" } },
							{ "_id": data.search.match(/^[0-9a-fA-F]{24}$/) ? ObjectId(data.search) : null }
						]
					}
				}
			];

			// Add the search pipeline
			options.pipeline = [...options.pipeline, ...searchPipeline];
			console.log('Search pipeline:', JSON.stringify(searchPipeline));
		}

		// Add projection stage to format the data
		const projectionPipeline = [{
			$project: {
					user_id: 1,
					user_id_from: {
						$cond: {
							if: { $ifNull: ["$user_from", false] },
							then: {
								_id: "$user_id_from",
								username: { $ifNull: ["$user_from.username", ""] },
								email: { $ifNull: ["$user_from.email", ""] },
								name: { $ifNull: ["$user_from.name", ""] }
							},
							else: "$user_id_from"
						}
					},
					investment_id: 1,
					investment_plan_id: 1,
					username: {
						$ifNull: ["$user.username", ""]
					},
					user: {
						$ifNull: ["$user.name", ""]
					},
					user_email: {
						$ifNull: ["$user.email", ""]
					},
					username_from: {
						$ifNull: ["$user_from.username", ""]
					},
					user_from_name: {
						$ifNull: ["$user_from.name", ""]
					},
					user_from_email: {
						$ifNull: ["$user_from.email", ""]
					},
					amount: 1,
					wamt: 1,
					uamt: 1,
					camt: 1,
					iamount: 1,
					level: 1,
					pool: 1,
					days: 1,
					type: 1,
					status: 1,
					extra: 1,
					created_at: 1
				}
		}];

		// Add projection pipeline to options
		options.pipeline = [...options.pipeline, ...projectionPipeline];

		console.log('Income filter:', JSON.stringify(filter));
		console.log('Income options:', JSON.stringify(options));

		// First, count documents with the specific filter to see if we have any matching data
		const filteredCount = await incomeModel.countDocuments(filter).exec();
		console.log('Incomes matching filter:', filteredCount);

		// Also get total count for pagination info
		const totalCount = await incomeModel.countDocuments({}).exec();
		console.log('Total incomes in database:', totalCount);

		try {
			// Always use the provided filter - don't fall back to showing all data
			// This ensures we only show data of the requested type
			const results = await incomeModel.paginate(filter, options);
			console.log("Result of the filtered query:", results);

			// If we have results, return them
			if (results && results.list) {
				return results;
			}

			// If paginate fails or returns no results, return empty list with proper pagination info
			return {
				list: [],
				page: options.page || 1,
				limit: options.limit || 10,
				total: filteredCount, // Use filtered count for total
				totalPages: Math.ceil(filteredCount / (options.limit || 10))
			};
		} catch (error) {
			console.error('Error in paginate:', error);
			// Return empty results with proper pagination info
			return {
				list: [],
				page: options.page || 1,
				limit: options.limit || 10,
				total: filteredCount, // Use filtered count for total
				totalPages: Math.ceil(filteredCount / (options.limit || 10))
			};
		}
	}
	getCount(data, user_id = null) {
		let params = { };
		if (user_id) {
			params.user_id = user_id;
		}
        if (data.status !== undefined) {
            params.status = data.status ? true : false;
        }
        if (data.type !== undefined) {
            params.type = data.type ? data.type : 0;
        }
		return this._model.countDocuments(params).exec();
	}
	async getSum(data, user_id = null) {
		let params = {};
		if (user_id) {
			params.user_id = ObjectId(user_id);
		}
        if (data.status !== undefined) {
            params.status = data.status ? true : false;
        }
        if (data.type !== undefined) {
            params.type = data.type ? data.type : 0;
        }

		let pipeline = [];
		pipeline.push({ $match: params });
		pipeline.push({
			$project: {
				_id: 1,
				amount: 1
			}
		});
		pipeline.push({
			$group: {
				_id: null,
				amount: { $sum: "$amount" },
				count: { $sum: 1 }
			}
		});
		return await incomeModel.aggregate(pipeline).exec();
	}
	getById(id, projection = {}) {
		return this._model.findOne({ _id: id }, projection);
	}
	getOneByQuery(query, projection = {}) {
		return this._model.findOne(query, projection);
	}
	getByQuery(query, projection = {}) {
		return this._model.find(query, projection);
	}
	updateById(id, data, option = {}) {
		option = { ...{ new: true }, ...option }
		return this._model.findByIdAndUpdate(id, { $set: data }, option);
	}
	updateByQuery(query, data, option = {}) {
		option = { ...{ new: true }, ...option }
		return this._model.updateMany(query, { $set: data }, option);
	}
	deleteById(id) {
		return this._model.findByIdAndRemove(id);
	}
	getByQueryToArray(query, projection = {}) {
        return this._model.find(query, projection).lean()
    }
}
module.exports = new Income();
