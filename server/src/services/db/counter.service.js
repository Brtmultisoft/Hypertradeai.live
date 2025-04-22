'use strict';
const { counterModel } = require('../../models');
let instance;
/*********************************************
 * METHODS FOR HANDLING COUNTER MODEL QUERIES
 *********************************************/
class Counter {
    constructor() {
        //if counter instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._model = counterModel;
    }
    create(data) {
        let model = new this._model(data);
        return model.save(data);
    }
    getOneByQuery(query, projection = {}) {
        return this._model.findOne(query, projection);
    }
    updateById(id, data, option = {}) {
        option = { ...{ new: true }, ...option }
        return this._model.findByIdAndUpdate(id, { $set: data }, option);
    }
}
module.exports = new Counter();
