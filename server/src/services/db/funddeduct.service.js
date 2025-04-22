'use strict';
const { fundDeductModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING FUNDDEDUCT MODEL QUERIES
 *********************************************/
class FundDeduct {
	constructor() {
		//if funddeduct instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = fundDeductModel;
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
					search(data.search, ['remark'])
				]
			};
		}
		else {
			params = {
				...advancseSearch(data, ['amount', 'remark']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}

		let filter = params;
		const options = pick(data, ['sort_by', 'limit', 'page']);
		options.sort_fields = ['amount', 'remark', 'created_at'];
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
					remark: 1,
					type: 1,
					created_at: 1
				},
			});
			options.pipeline = pipeline;
		}

		const results = await fundDeductModel.paginate(filter, options);
		return results;
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
		return await fundDeductModel.aggregate(pipeline).exec();
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
module.exports = new FundDeduct();
