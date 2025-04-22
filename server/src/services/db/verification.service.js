'use strict';
const { verificationModel } = require('../../models');
let instance;
/******************************************************
 * METHODS FOR HANDLING EMAIL VERIFICATION MODEL QUERIES
 *******************************************************/
class Verification {
	constructor() {
		//if email instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = verificationModel;
	}
	create(data) {
		let model = new this._model(data);
		return model.save(data);
	}
	getByQuery(query, projection = {}) {
		return this._model.find(query, projection);
	}
	updateByQuery(query, data, option) {
		return this._model.updateMany(query, { $set: data }, option);
	}
	deleteById(id) {
		return this._model.findByIdAndRemove(id);
	}
}
module.exports = new Verification();
