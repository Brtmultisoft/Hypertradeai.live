'use strict';
const { userModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING USER MODEL QUERIES
 *********************************************/
class User {
    constructor() {
        //if user instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._model = userModel;
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

        if (data.search) {
            params = {
                $and: [
                    { ...statusSearch(data, ['status']), ...dateSearch(data, 'created_at'), ...params },
                    search(data.search, ['username', 'email', 'name'])
                ]
            };
        }
        else {
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
                trace_id:1,
                level:1,
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
                wallet_address:1,
                city: 1,
                total_investment:1,
            },
        });
        options.pipeline = pipeline;
        if (options.limit == -1) {
            options.populate = 'name,email,status';
        }

        const results = await userModel.paginate(filter, options);
        return results;
    }
    getCount(refer_id, status = null) {
        let q = {};
        if (refer_id) {
            q.refer_id = refer_id;
        }
        if (status !== null) {
            q.status = status;
        }
        return this._model.countDocuments(q).exec();
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
    getByQueryToArray(query, projection = {}) {
        return this._model.find(query, projection).lean()
    }
updateById(id, data, option = {}) {
        option = { ...{ new: true }, ...option }
        return this._model.findByIdAndUpdate(id, { $set: data }, option);
    }
    updateOneByQuery(query, data, option = {}) {
        option = { ...option, ...{ upsert: true, new: true } }
        return this._model.updateOne(query, data, option);
    }
    updateByQuery(query, data, option = {}) {
        option = { ...{ new: true }, ...option }
        return this._model.updateMany(query, { $set: data }, option);
    }
    deleteById(id) {
        return this._model.findByIdAndRemove(id);
    }
}
module.exports = new User();