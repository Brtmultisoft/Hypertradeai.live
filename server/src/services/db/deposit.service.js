'use strict';
const { depositModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING DEPOSIT MODEL QUERIES
 *********************************************/
class Deposit {
	constructor() {
		//if deposit instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = depositModel;
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
					search(data.search, ['txid', 'address', 'currency', 'currency_coin'])
				]
			};
		}
		else {
			params = {
				...advancseSearch(data, ['txid', 'address', 'currency', 'currency_coin']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}

		let filter = params;
		const options = pick(data, ['sort_by', 'limit', 'page']);
		options.sort_fields = ['txid', 'address', 'currency', 'currency_coin', 'amount', 'fee', 'net_amount', 'amount_coin', 'created_at'];
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
					extra: 1,
					status: 1,
					created_at: 1
				},
			});
			options.pipeline = pipeline;
		}

		const results = await depositModel.paginate(filter, options);
		return results;
	}
	getCount(data, user_id = null) {
		let params = {};
		if (user_id) {
			params.user_id = user_id;
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
		return await depositModel.aggregate(pipeline).exec();
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
}
module.exports = new Deposit();
