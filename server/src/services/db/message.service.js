'use strict';
const { messageModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING MESSAGE MODEL QUERIES
 *********************************************/
class Message {
	constructor() {
		//if message instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = messageModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
	}
	async getAll(data, user_id = null, user_id_from = null, type = 'inbox') {
		let params = {};
		if (user_id) {
			params.user_id = ObjectId(user_id);
		}
		else if(user_id == null && type == 'inbox'){
			params.user_id = null;
		}
		if (user_id_from) {
			params.user_id_from = ObjectId(user_id_from);
		}
		else if(user_id_from == null && type == 'sent'){
			params.user_id_from = null;
		}

		if (data.search) {
			params = {
				$and: [
					{ ...statusSearch(data, ['status']), ...statusSearch(data, ['is_read']), ...params },
					search(data.search, ['subject', 'message'])
				]
			};
		}
		else {
			params = {
				...advancseSearch(data, ['subject', 'message']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...statusSearch(data, ['is_read']),
				...params
			};
		}

		let filter = params;
		const options = pick(data, ['sort_by', 'limit', 'page']);
		options.sort_fields = ['subject', 'message', 'created_at'];
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
					subject: 1,
					message: 1,
					type: 1,
					is_read: 1,
					status: 1,
					extra: 1,
					created_at: 1
				},
			});
			options.pipeline = pipeline;
		//}

		const results = await messageModel.paginate(filter, options);
		return results;
	}
	getCount(user_id, is_read = false) {
		return this._model.countDocuments({ user_id: user_id, is_read: is_read }).exec();
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
module.exports = new Message();
