'use strict';
const { teamRewardModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING TEAMREWARD MODEL QUERIES
 *********************************************/
class TeamReward {
	constructor() {
		//if teamreward instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = teamRewardModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
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
	updateById(id, data) {
		return this._model.findByIdAndUpdate(id, data, { new: true });
	}
	updateByQuery(query, data) {
		return this._model.updateMany(query, data, { new: true });
	}
	deleteById(id) {
		return this._model.findByIdAndDelete(id);
	}
	deleteByQuery(query) {
		return this._model.deleteMany(query);
	}
	async getAll(data, user_id = null) {
		const filter = {};
		const options = {};
		const { limit, page, sortBy, sortType, ...restQuery } = data;
		if (limit && page) {
			options.limit = parseInt(limit);
			options.page = parseInt(page);
		}
		if (sortBy && sortType) {
			options.sort = { [sortBy]: sortType === 'asc' ? 1 : -1 };
		} else {
			options.sort = { created_at: -1 };
		}
		if (user_id) {
			filter.user_id = ObjectId(user_id);
		}
		if (restQuery.status) {
			filter.status = restQuery.status;
		}
		if (restQuery.start_date && restQuery.end_date) {
			filter.created_at = {
				$gte: new Date(restQuery.start_date),
				$lte: new Date(restQuery.end_date)
			};
		}
		const results = await teamRewardModel.paginate(filter, options);
		return results;
	}
	getCount(data, user_id = null) {
		let params = {};
		if (user_id) {
			params.user_id = user_id;
		}
        if (data.status !== undefined) {
            params.status = data.status;
        }
		return this._model.countDocuments(params).exec();
	}
	async getSum(data, user_id = null) {
		let params = {};
		if (user_id) {
			params.user_id = ObjectId(user_id);
		}
        if (data.status !== undefined) {
            params.status = data.status;
        }

		let pipeline = [];
		pipeline.push({ $match: params });
		pipeline.push({
			$group: {
				_id: null,
				reward_amount: { $sum: "$reward_amount" },
				count: { $sum: 1 }
			}
		});
		return await teamRewardModel.aggregate(pipeline).exec();
	}
}

module.exports = new TeamReward();
