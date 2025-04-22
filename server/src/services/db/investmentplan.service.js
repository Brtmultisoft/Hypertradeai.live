'use strict';
const { investmentPlanModel } = require('../../models');
const { ObjectId } = require('mongodb');
let instance;
/*********************************************
 * METHODS FOR HANDLING INVESTMENTPLAN MODEL QUERIES
 *********************************************/
class InvestmentPlan {
	constructor() {
		//if investmentplan instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = investmentPlanModel;
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
	getAll() {
		return this._model.find({});
	}
}
module.exports = new InvestmentPlan();
