'use strict';
const { settingModel } = require('../../models');
const { ObjectId } = require('mongodb');
let instance;
/*********************************************
 * METHODS FOR HANDLING SETTING MODEL QUERIES
 *********************************************/
class Setting {
	constructor() {
		//if setting instance already exists then return
		if (instance) {
			return instance;
		}
		this.instance = this;
		this._model = settingModel;
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
	updateOneByQuery(query, data, option = {}) {
        option = { ...option, ...{ upsert: true, new: true } }
        return this._model.updateOne(query, data, option);
    }
	deleteById(id) {
		return this._model.findByIdAndRemove(id);
	}
}
module.exports = new Setting();
