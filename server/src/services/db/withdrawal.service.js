'use strict';
const { withdrawalModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING WITHDRAWAL MODEL QUERIES
 *********************************************/
class Withdrawal {
	constructor() {
		//if withdrawal instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = withdrawalModel;
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

		if (data.search) {
			params = {
				$and: [
					{ ...statusSearch(data, ['status']), ...params },
					search(data.search, ['txid', 'address', 'currency', 'currency_coin', 'remark'])
				]
			};
		}
		else {
			params = {
				...advancseSearch(data, ['txid', 'address', 'currency', 'currency_coin', 'remark']),
				...dateSearch(data, 'created_at'),
				...dateSearch(data, 'approved_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}

		let filter = params;

		// Handle pagination and sorting
		const options = {
			limit: data.limit ? parseInt(data.limit) : 10,
			page: data.page ? parseInt(data.page) : 1,
			populate: '',
			sort: {}
		};

		// Handle sort field and direction
		if (data.sort_field && data.sort_direction) {
			console.log(`Sorting by ${data.sort_field} in ${data.sort_direction} order`);
			options.sort[data.sort_field] = data.sort_direction === 'desc' ? -1 : 1;
		} else {
			// Default sort by created_at descending
			options.sort.created_at = -1;
		}

		console.log('Withdrawal query filter:', filter);
		console.log('Withdrawal query options:', options);

		// Define valid sort fields
		options.sort_fields = ['txid', 'address', 'currency', 'currency_coin', 'amount', 'fee', 'net_amount', 'amount_coin', 'created_at'];
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

			pipeline.push({
				$project: {
					user_id: 1,
					username: {
						$ifNull: ["$user.username", ""]
					},
					user: {
						$ifNull: ["$user.name", ""]
					},
					amount: 1,
					fee: 1,
					net_amount: 1,
					amount_coin: 1,
					rate: 1,
					txid: 1,
					address: 1,
					currency: 1,
					currency_coin: 1,
					remark: 1,
					extra: 1,
					status: 1,
					approved_at: 1,
					created_at: 1
				},
			});
			options.pipeline = pipeline;
		}

		const results = await withdrawalModel.paginate(filter, options);
		return results;
	}
	getCount(data, user_id = null) {
		let params = {};
		if (user_id) {
			params.user_id = user_id;
		}

		// Handle numeric status values (0, 1, 2)
		if (data.status !== undefined) {
			// If it's a boolean query, use the original logic
			if (typeof data.status === 'boolean') {
				params.status = data.status ? true : false;
			} else {
				// Otherwise, use the numeric value
				params.status = parseInt(data.status);
			}
		}

		if (data.currency_coin !== undefined) {
			params.currency_coin = data.currency_coin;
		}
		if (data.currency !== undefined) {
			params.currency = data.currency;
		}

		console.log('Count query:', params);
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
		if (data.currency_coin !== undefined) {
			params.currency_coin = data.currency_coin;
		}
		if (data.currency !== undefined) {
			params.currency = data.currency;
		}

		let pipeline = [];
		pipeline.push({ $match: params });
		pipeline.push({
			$project: {
				_id: 1,
				amount: 1,
				fee: 1,
				net_amount: 1
			}
		});
		pipeline.push({
			$group: {
				_id: null,
				amount: { $sum: "$amount" },
				fee: { $sum: "$fee" },
				net_amount: { $sum: "$net_amount" },
				count: { $sum: 1 }
			}
		});
		return await withdrawalModel.aggregate(pipeline).exec();
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
	updateOneByQuery(query, data, option = {}) {
        option = { ...option, ...{ upsert: true, new: true } }
        return this._model.updateOne(query, data, option);
    }
	deleteById(id) {
		return this._model.findByIdAndRemove(id);
	}
}
module.exports = new Withdrawal();
