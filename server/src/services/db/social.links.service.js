'use strict';
const { socialLinksModel, userModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING INCOME MODEL QUERIES
 *********************************************/
class SocialLinks {
	constructor() {
		//if income instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = socialLinksModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
	}
	async getAll(data, user_id = null) {
		let params = {};
	
		if (user_id) {
			params.refer_id = ObjectId(user_id);
		}
	
		// Check if the 'extra' object contains any of the social media URLs
		let socialQuery = {
			$or: [
				{ "extra.facebookUrl": { $exists: true, $ne: "" } },
				{ "extra.linkedinUrl": { $exists: true, $ne: "" } },
				{ "extra.twitterUrl": { $exists: true, $ne: "" } },
				{ "extra.instagramUrl": { $exists: true, $ne: "" } }
			]
		};
		
		// Combine the social media query with other filters
		params = {
			...params,
			$and: [
				{ ...socialQuery } // This will filter users based on the existence of any of the social URLs in 'extra'
			]
		};
	
		if (data.search) {
			params = {
				$and: [
					{ ...statusSearch(data, ['status']), ...dateSearch(data, 'created_at'), ...params },
					search(data.search, ['username', 'email', 'name'])
				]
			};
		} else {
			params = {
				...advancseSearch(data, ['username', 'email', 'name']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}
	
		let filter = params;
		const options = pick(data, ['sort_by', 'limit', 'page']);
		options.sort_fields = ['email', 'name', 'created_at'];
		options.populate = '';
		const pipeline = [];
	
		pipeline.push({
			$project: {
				refer_id: 1,
				placement_id: 1,
				position: 1,
				username: 1,
				email: 1,
				name: 1,
				address: 1,
				phone_number: 1,
				avatar: 1,
				email_verified: 1,
				reward: 1,
				wallet: 1,
				wallet_topup: 1,
				topup: 1,
				topup_at: 1,
				is_default: 1,
				extra: 1,
				status: 1,
				created_at: 1,
				country_code: 1,
				country: 1,
				state: 1,
				wallet_address: 1,
				city: 1,
			},
		});
	
		options.pipeline = pipeline;
		if (options.limit == -1) {
			options.populate = 'name,email,status';
		}
	
		// Run the query
		const results = await userModel.paginate(filter, options);
	
		return results;
	}
	async getAllWithoutLimit(data, user_id = null) {
		let params = {};
	
		if (user_id) {
			params.refer_id = ObjectId(user_id);
		}
	
		// Check if the 'extra' object contains any of the social media URLs
		let socialQuery = {
			$or: [
				{ "extra.facebookUrl": { $exists: true, $ne: "" } },
				{ "extra.linkedinUrl": { $exists: true, $ne: "" } },
				{ "extra.twitterUrl": { $exists: true, $ne: "" } },
				{ "extra.instagramUrl": { $exists: true, $ne: "" } }
			]
		};
	
		// Combine the social media query with other filters
		params = {
			...params,
			$and: [
				{ ...socialQuery } // This will filter users based on the existence of any of the social URLs in 'extra'
			]
		};
	
		if (data.search) {
			params = {
				$and: [
					{ ...statusSearch(data, ['status']), ...dateSearch(data, 'created_at'), ...params },
					search(data.search, ['username', 'email', 'name'])
				]
			};
		} else {
			params = {
				...advancseSearch(data, ['username', 'email', 'name']),
				...dateSearch(data, 'created_at'),
				...statusSearch(data, ['status']),
				...params
			};
		}
	
		let filter = params;
	
		const pipeline = [
			{ $match: filter },
			{
				$project: {
					refer_id: 1,
					placement_id: 1,
					position: 1,
					username: 1,
					email: 1,
					name: 1,
					address: 1,
					phone_number: 1,
					avatar: 1,
					email_verified: 1,
					reward: 1,
					wallet: 1,
					wallet_topup: 1,
					topup: 1,
					topup_at: 1,
					is_default: 1,
					extra: 1,
					status: 1,
					created_at: 1,
					country_code: 1,
					country: 1,
					state: 1,
					wallet_address: 1,
					city: 1,
				},
			}
		];
	
		// Execute the query
		const results = await userModel.aggregate(pipeline).exec();
	
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
		let params = { type: type };
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
		return await socialLinksModel.aggregate(pipeline).exec();
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
module.exports = new SocialLinks();
