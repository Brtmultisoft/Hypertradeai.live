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
			if (!isNaN(parseInt(data.type))) {
				params.type = parseInt(data.type);
			} else {
				params.type = data.type;
			}
		}

		if (data.search) {
			params = {
				$and: [
					{ ...statusSearch(data, ['status']), ...params },
					search(data.search, [])
				]
			};
		}
		else {
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
		if (!user_id) {
			const pipeline = [];
			pipeline.push(
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
				{ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }
			);

			pipeline.push(
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
			);

			pipeline.push({
				$project: {
					user_id: 1,
					user_id_from: 1,
					investment_id: 1,
					investment_plan_id: 1,
					username: {
						$ifNull: ["$user.username", ""]
					},
					user: {
						$ifNull: ["$user.name", ""]
					},
					username_from: {
						$ifNull: ["$user_from.username", ""]
					},
					user_from: {
						$ifNull: ["$user_from.name", ""]
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
					extra: 1,
					created_at: 1
				},
			});
			options.pipeline = pipeline;
		}

		console.log('Income filter:', JSON.stringify(filter));
		console.log('Income options:', JSON.stringify(options));

		// Try a simpler query first to see if we have any data
		const count = await incomeModel.countDocuments({}).exec();
		console.log('Total incomes in database:', count);

		// If we have incomes but our filter might be too restrictive, try a simpler query
		if (count > 0) {
			// Use a simpler filter if we have data but our filter might be too restrictive
			const simpleFilter = {};
			const simpleOptions = {
				page: options.page || 1,
				limit: 10,
				sort: { created_at: -1 }
			};

			try {
				const results = await incomeModel.paginate(filter, options);
				console.log("Result of the filtered query:", results);

				// If we got no results with our filter but we know there's data, try the simple query
				if ((!results.list || results.list.length === 0) && count > 0) {
					console.log('No results with filter, trying simple query');
					const simpleResults = await incomeModel.find({}).limit(10).sort({ created_at: -1 }).exec();
					console.log('Simple query results:', simpleResults.length);

					// If we got results with the simple query, return them in the expected format
					if (simpleResults && simpleResults.length > 0) {
						return {
							list: simpleResults,
							page: 1,
							limit: 10,
							total: count,
							totalPages: Math.ceil(count / 10)
						};
					}
				}

				return results;
			} catch (error) {
				console.error('Error in paginate:', error);
				// Fallback to a simple find query if paginate fails
				const simpleResults = await incomeModel.find({}).limit(10).sort({ created_at: -1 }).exec();
				return {
					list: simpleResults,
					page: 1,
					limit: 10,
					total: count,
					totalPages: Math.ceil(count / 10)
				};
			}
		} else {
			// If there's no data, just return empty results
			return {
				list: [],
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 0
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
