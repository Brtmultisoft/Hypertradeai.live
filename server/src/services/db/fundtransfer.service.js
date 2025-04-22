'use strict';
const { fundTransferModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING FUNDTRANSFER MODEL QUERIES
 *********************************************/
class FundTransfer {
	constructor() {
		//if fundtransfer instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = fundTransferModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
	}
	async getAll(data, user_id = null) {
		let params = {};
		if (user_id) {
			// Check both user_id and user_id_from fields
			// Check if user_id is a valid ObjectId
			let objectIdParam;
			try {
				if (user_id.length === 24) {
					objectIdParam = ObjectId(user_id);
				}
			} catch (error) {
				// Not a valid ObjectId, just use the string
				console.log('Not a valid ObjectId:', user_id);
			}

			params.$or = [
				{ user_id_from: user_id },
				{ user_id: user_id }
			];

			// Add ObjectId version if it's valid
			if (objectIdParam) {
				params.$or.push({ user_id_from: objectIdParam });
				params.$or.push({ user_id: objectIdParam });
			}
		}

		// Handle type parameter for filtering
		if (data.type !== undefined && data.type !== '') {
			// Convert to number if it's a string
			if (typeof data.type === 'string') {
				// Handle string values from frontend
				if (data.type === '2' || data.type === 'admin') {
					params.type = 2; // Admin transfers
				} else if (data.type === '1' || data.type === 'wallet_to_wallet') {
					params.type = 1; // Self transfers (wallet to wallet)
				} else if (data.type === '0' || data.type === 'user_to_user') {
					params.type = 0; // User to user transfers
				} else {
					// Try to parse as number
					params.type = parseInt(data.type, 10);
				}
			} else {
				// Already a number
				params.type = data.type;
			}
			console.log('Filtering by type:', params.type);
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
				...advancseSearch(data, ['amount', 'fee', 'remark']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}

		console.log('Fund transfer query params:', params);

		let filter = params;
		const options = pick(data, ['sort_by', 'limit', 'page']);
		options.sort_fields = ['amount', 'fee', 'remark', 'created_at'];
		options.populate = '';
		//if (!user_id) {
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
					_id: 1,
					user_id: 1,
					user_id_from: 1,
					username: {
						$ifNull: ["$user.username", ""]
					},
					user: {
						$ifNull: ["$user.name", ""]
					},
					username_from: {
						$ifNull: ["$user_from.username", "admin"]
					},
					user_from: {
						$ifNull: ["$user_from.name", "Admin"]
					},
					// Add user details for frontend display
					from_user_details: {
						$cond: [
							{ $eq: ["$from_wallet", "admin"] },
							null,
							{
								name: { $ifNull: ["$user_from.name", ""] },
								email: { $ifNull: ["$user_from.email", ""] },
								username: { $ifNull: ["$user_from.username", ""] }
							}
						]
					},
					to_user_details: {
						name: { $ifNull: ["$user.name", ""] },
						email: { $ifNull: ["$user.email", ""] },
						username: { $ifNull: ["$user.username", ""] }
					},
					amount: 1,
					fee: 1,
					remark: 1,
					type: 1,
					from_wallet: 1,
					to_wallet: 1,
					status: 1,
					created_at: 1,
					updated_at: 1
				},
			});
			options.pipeline = pipeline;
		//}

		const results = await fundTransferModel.paginate(filter, options);
		return results;
	}
	getCount(data, user_id = null) {
		let params = { };
		if (user_id) {
			// Check if user_id is a valid ObjectId
			let objectIdParam;
			try {
				if (user_id.length === 24) {
					objectIdParam = ObjectId(user_id);
				}
			} catch (error) {
				// Not a valid ObjectId, just use the string
				console.log('Not a valid ObjectId:', user_id);
			}

			params.$or = [
				{ user_id_from: user_id },
				{ user_id: user_id }
			];

			// Add ObjectId version if it's valid
			if (objectIdParam) {
				params.$or.push({ user_id_from: objectIdParam });
				params.$or.push({ user_id: objectIdParam });
			}
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
		if (data.type !== undefined) {
			params.type = parseInt(data.type);
		}
		if (user_id) {
			// Check both user_id and user_id_from fields
			// Check if user_id is a valid ObjectId
			let objectIdParam;
			try {
				if (user_id.length === 24) {
					objectIdParam = ObjectId(user_id);
				}
			} catch (error) {
				// Not a valid ObjectId, just use the string
				console.log('Not a valid ObjectId:', user_id);
			}

			params.$or = [
				{ user_id_from: user_id },
				{ user_id: user_id }
			];

			// Add ObjectId version if it's valid
			if (objectIdParam) {
				params.$or.push({ user_id_from: objectIdParam });
				params.$or.push({ user_id: objectIdParam });
			}
		}
        if (data.status !== undefined) {
            params.status = data.status ? true : false;
        }
        // Type is already handled above

		let pipeline = [];
		pipeline.push({ $match: params });
		pipeline.push({
			_id: 1,
			amount: 1
		});
		pipeline.push({
			$group: {
				_id: null,
				amount: { $sum: "$amount" },
				count: { $sum: 1 }
			}
		});
		return await fundTransferModel.aggregate(pipeline).exec();
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
module.exports = new FundTransfer();
