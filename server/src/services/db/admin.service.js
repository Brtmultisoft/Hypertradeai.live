'use strict';
const { adminModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING ADMIN MODEL QUERIES
 *********************************************/
class Admin {
	constructor() {
		//if admin instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = adminModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
	}
	async getAll(data, admin_id) {
		console.log(admin_id)
		let params = { is_super_admin: { $ne: true }, _id: { $ne: ObjectId(admin_id) } };

		if (data.search) {
			params = {
				$and: [
					{ ...statusSearch(data, ['status']), ...params },
					search(data.search, ['email', 'name'])
				]
			};
		}
		else {
			params = {
				...advancseSearch(data, ['email', 'name']),
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
				name: 1,
				email: 1,
				phone_number: 1,
				status: 1,
				created_at: 1
			},
		});
		options.pipeline = pipeline;

		const results = await adminModel.paginate(filter, options);
		return results;
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
module.exports = new Admin();
