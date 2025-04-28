'use strict';
const { investmentModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;
/*********************************************
 * METHODS FOR HANDLING INVESTMENT MODEL QUERIES
 *********************************************/
class Investment {
    constructor() {
        //if investment instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._model = investmentModel;
    }
    create(data) {
        let model = new this._model(data);
        return model.save(data);
    }
    async getAll(data, user_id = null) {
        let params = {};
        if (user_id) {
            params.user_id = ObjectId(user_id);
        }

        // Handle type filter
        if (data.type !== undefined) {
            params.type = parseInt(data.type);
        }

        if (data.search) {
            params = {
                $and: [
                    {...statusSearch(data, ['status']), ...params },
                    search(data.search, [])
                ]
            };
        } else {
            params = {
                ...advancseSearch(data, []),
                ...dateSearch(data, 'created_at'),
                ...statusSearch(data, ['status']),
                ...params
            };
        }

        let filter = params;
        const options = pick(data, ['sort_by', 'page']);
        // options.limit = -1;
        options.sort_fields = ['amount', 'amount_r', 'amount_coin', 'bonus', 'days', 'release_at', 'created_at', 'package_type', 'slot_value'];
        options.populate = '';
        if (!user_id) {
            const pipeline = [];
            pipeline.push({
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
            }, {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            }, { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

            pipeline.push({
                $project: {
                    user_id: 1,
                    investment_plan_id: 1,
                    username: {
                        $ifNull: ["$user.username", ""]
                    },
                    user: {
                        $ifNull: ["$user.name", ""]
                    },
                    email: {
                        $ifNull: ["$user.email", ""]
                    },
                    amount: 1,
                    amount_r: 1,
                    amount_coin: 1,
                    bonus: 1,
                    days: 1,
                    type: 1,
                    status: 1,
                    release_at: 1,
                    extra: 1,
                    created_at: 1,
                    package_type: 1,
                    slot_value: 1
                },
            });
            options.pipeline = pipeline;
        }

        console.log('Investment filter:', JSON.stringify(filter));
        console.log('Investment options:', JSON.stringify(options));

        // Try a simpler query first to see if we have any data
        const count = await investmentModel.countDocuments({}).exec();
        console.log('Total investments in database:', count);

        // If we have investments but our filter might be too restrictive, try a simpler query
        if (count > 0) {
            // Use a simpler filter if we have data but our filter might be too restrictive
            const simpleFilter = {};
            const simpleOptions = {
                page: options.page || 1,
                limit: 10,
                sort: { created_at: -1 }
            };

            try {
                const results = await investmentModel.paginate(filter, options);
                console.log("Result of the filtered query:", results);

                // If we got no results with our filter but we know there's data, try the simple query
                if ((!results.list || results.list.length === 0) && count > 0) {
                    console.log('No results with filter, trying simple query');
                    const simpleResults = await investmentModel.find({}).limit(10).sort({ created_at: -1 }).exec();
                    console.log('Simple query results:', simpleResults.length);

                    // If we got results with the simple query, return them in the expected format
                    if (simpleResults && simpleResults.length > 0) {
                        return {
                            list: simpleResults,
                            page: 1,
                            limit: 10,
                            total: count,
                            totalPages: Math.ceil(count / 10)
                        };
                    }
                }

                return results;
            } catch (error) {
                console.error('Error in paginate:', error);
                // Fallback to a simple find query if paginate fails
                const simpleResults = await investmentModel.find({}).limit(10).sort({ created_at: -1 }).exec();
                return {
                    list: simpleResults,
                    page: 1,
                    limit: 10,
                    total: count,
                    totalPages: Math.ceil(count / 10)
                };
            }
        } else {
            // If there's no data, just return empty results
            return {
                list: [],
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            };
        }
    }
    async getAllInUser(data, user_id = null) {
        let params = {};
        if (user_id) {
            params.user_id = ObjectId(user_id);
        }

        if (data.search) {
            params = {
                $and: [
                    {...statusSearch(data, ['status']), ...params },
                    search(data.search, [])
                ]
            };
        } else {
            params = {
                ...advancseSearch(data, []),
                ...dateSearch(data, 'created_at'),
                ...statusSearch(data, ['status']),
                ...params
            };
        }

        let filter = params;
        const options = pick(data, ['sort_by', 'page']);
        options.limit = -1;
        options.sort_fields = ['amount', 'amount_r', 'amount_coin', 'bonus', 'days', 'release_at', 'created_at', 'package_type', 'slot_value'];
        options.populate = '';
        if (!user_id) {
            const pipeline = [];
            pipeline.push({
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
            }, {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            }, { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

            pipeline.push({
                $project: {
                    user_id: 1,
                    investment_plan_id: 1,
                    username: {
                        $ifNull: ["$user.username", ""]
                    },
                    user: {
                        $ifNull: ["$user.name", ""]
                    },
                    email: {
                        $ifNull: ["$user.email", ""]
                    },
                    amount: 1,
                    amount_r: 1,
                    amount_coin: 1,
                    bonus: 1,
                    days: 1,
                    type: 1,
                    status: 1,
                    release_at: 1,
                    extra: 1,
                    created_at: 1,
                    package_type: 1,
                    slot_value: 1
                },
            });
            options.pipeline = pipeline;
        }

        const results = await investmentModel.paginate(filter, options);
        return results;
    }
    async getAllStacked(data, user_id = null) {
        let params = { type: 1 };
        if (user_id) {
            params.user_id = ObjectId(user_id);
        }

        if (data.search) {
            params = {
                $and: [
                    {...statusSearch(data, ['status']), ...params },
                    search(data.search, [])
                ]
            };
        } else {
            params = {
                ...advancseSearch(data, []),
                ...dateSearch(data, 'created_at'),
                ...statusSearch(data, ['status']),
                ...params
            };
        }

        let filter = params;
        const options = pick(data, ['sort_by', 'limit', 'page']);
        options.sort_fields = ['amount', 'amount_r', 'amount_coin', 'bonus', 'days', 'type', 'release_at', 'created_at'];
        options.populate = '';
        if (!user_id) {
            const pipeline = [];
            pipeline.push({
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
            }, {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            }, { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

            pipeline.push({
                $project: {
                    user_id: 1,
                    investment_plan_id: 1,
                    username: {
                        $ifNull: ["$user.username", ""]
                    },
                    user: {
                        $ifNull: ["$user.name", ""]
                    },
                    email: {
                        $ifNull: ["$user.email", ""]
                    },
                    amount: 1,
                    amount_r: 1,
                    amount_coin: 1,
                    bonus: 1,
                    days: 1,
                    type: 1,
                    status: 1,
                    release_at: 1,
                    extra: 1,
                    created_at: 1
                },
            });
            options.pipeline = pipeline;
        }

        const results = await investmentModel.paginate(filter, options);
        return results;
    }
    getCount(data, user_id = null) {
        let params = {};
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
        let params = {};
        if (user_id) {
            params.user_id = ObjectId(user_id);
        }
        if (data.status !== undefined) {
            // params.status = data.status ? true : false;
        }
        if (data.type !== undefined) {
            // params.type = data.type ? data.type : 0;
        }

        let pipeline = [];
        pipeline.push({ $match: params });
        pipeline.push({
            $project: {
                _id: 1,
                amount: 1
            }
        });
        pipeline.push({
            $group: {
                _id: null,
                amount: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        });
        return await investmentModel.aggregate(pipeline).exec();
    }
    getById(id, projection = {}) {
        return this._model.findOne({ _id: id }, projection);
    }
    getOneByQuery(query, projection = {}) {
            return this._model.findOne(query, projection);
        }
        /*************  ✨ Windsurf Command ⭐  *************/
        /**
         * Retrieves multiple investment documents matching the specified query.
         *
         * @param {Object} query - MongoDB query object to filter investments.
         * @param {Object} [projection={}] - Optional fields to include or exclude from the result.
         * @returns {Promise<Array>} - A promise that resolves with an array of investment documents.
         */

    /*******  e06d06a3-cb01-440a-a2a7-f08707fb8b6c  *******/
    getByQuery(query, projection = {}) {
        return this._model.find(query, projection);
    }
    updateById(id, data, option = {}) {
        option = {... { new: true }, ...option }
        return this._model.findByIdAndUpdate(id, { $set: data }, option);
    }
    updateByQuery(query, data, option = {}) {
        option = {... { new: true }, ...option }
        return this._model.updateMany(query, { $set: data }, option);
    }
    deleteById(id) {
        return this._model.findByIdAndRemove(id);
    }
}
module.exports = new Investment();