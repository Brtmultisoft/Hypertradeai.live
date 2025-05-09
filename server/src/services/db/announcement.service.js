'use strict';
const { announcementModel } = require('../../models');
const { ObjectId } = require('mongodb');
const { pick, search, advancseSearch, dateSearch, statusSearch } = require('../../utils/pick');
let instance;

/*********************************************
 * METHODS FOR HANDLING ANNOUNCEMENT MODEL QUERIES
 *********************************************/
class Announcement {
    constructor() {
        //if announcement instance already exists then return
        if (instance) {
            return instance;
        }
        this.instance = this;
        this._model = announcementModel;
    }

    async create(data) {
        try {
            let model = new this._model(data);
            return await model.save();
        } catch (error) {
            console.error('Error creating announcement:', error);
            throw error;
        }
    }

    async getAll(data, user_id = null) {
        let params = {};

        // Filter by active status if specified
        if (data.isActive !== undefined) {
            params.isActive = data.isActive === 'true' || data.isActive === true;
        }

        // Filter by category if specified
        if (data.category) {
            params.category = data.category;
        }

        // Filter by type if specified
        if (data.type) {
            params.type = data.type;
        }

        // Filter by priority if specified
        if (data.priority) {
            params.priority = data.priority;
        }

        // Search by title or description
        if (data.search) {
            params.$or = [
                { title: new RegExp(data.search, 'i') },
                { description: new RegExp(data.search, 'i') }
            ];
        }

        // Date range filters
        if (data.start_date && data.end_date) {
            params.created_at = {
                $gte: new Date(data.start_date),
                $lte: new Date(data.end_date)
            };
        } else if (data.start_date) {
            params.created_at = { $gte: new Date(data.start_date) };
        } else if (data.end_date) {
            params.created_at = { $lte: new Date(data.end_date) };
        }

        // Pagination
        const page = parseInt(data.page) || 1;
        const limit = parseInt(data.limit) || 10;
        const skip = (page - 1) * limit;

        // Sorting
        let sort = {};
        if (data.sort_field) {
            sort[data.sort_field] = data.sort_direction === 'desc' ? -1 : 1;
        } else {
            // Custom sorting for priority field
            if (data.sort_by_priority === 'true' || data.sort_by_priority === true) {
                // We'll handle priority sorting in memory since it can be either string or number
                sort = { created_at: -1 }; // Default to date sorting
            } else {
                // Default sort by creation date (newest first)
                sort = { created_at: -1 };
            }
        }

        try {
            // Get total count for pagination
            const total = await this._model.countDocuments(params);

            // Get the announcements with pagination and sorting
            let list = await this._model.find(params)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email')
                .lean();

            // Custom sorting for priority if needed
            if (data.sort_by_priority === 'true' || data.sort_by_priority === true) {
                // Sort by priority (High > Medium > Low)
                list = list.sort((a, b) => {
                    const getPriorityValue = (priority) => {
                        if (typeof priority === 'number') {
                            return priority;
                        }
                        switch (priority) {
                            case 'High': return 3;
                            case 'Medium': return 2;
                            case 'Low': return 1;
                            default: return 0;
                        }
                    };

                    const priorityA = getPriorityValue(a.priority);
                    const priorityB = getPriorityValue(b.priority);

                    if (priorityB !== priorityA) {
                        return priorityB - priorityA;
                    }

                    // If priorities are the same, sort by date
                    return new Date(b.created_at) - new Date(a.created_at);
                });
            }

            return {
                list,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error in getAll announcements:', error);
            throw error;
        }
    }

    async getById(id, projection = {}) {
        try {
            return await this._model.findOne({ _id: id }, projection)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');
        } catch (error) {
            console.error('Error getting announcement by ID:', error);
            return null;
        }
    }

    async getOneByQuery(query, projection = {}) {
        try {
            return await this._model.findOne(query, projection)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');
        } catch (error) {
            console.error('Error getting announcement by query:', error);
            return null;
        }
    }

    async getManyByQuery(query, projection = {}) {
        try {
            return await this._model.find(query, projection)
                .populate('createdBy', 'name email')
                .populate('updatedBy', 'name email');
        } catch (error) {
            console.error('Error getting many announcements by query:', error);
            return [];
        }
    }

    async updateById(id, data) {
        try {
            return await this._model.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    }

    async deleteById(id) {
        try {
            return await this._model.findByIdAndDelete(id);
        } catch (error) {
            console.error('Error deleting announcement:', error);
            throw error;
        }
    }
}

module.exports = new Announcement();
