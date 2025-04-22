'use strict'
const responseHelper = require('../../utils/customResponse');
const { investmentPlanDbHandler, settingDbHandler } = require('../../services/db')
const { settingModel, investmentPlanModel } = require('../../models');

let settings = [
    {
        "name": "tokenDistribution",
        "value": 0.05,
        "extra": {
            "levels": [10, 5]
        }
    },
    {
        "name": "withdrawConditions",
        "extra": {
            "minWithdrawal": 10
        }
    }
]

const update = async (model, data, handler) => {

    try {
        if (data.length === 0) throw "No Data Exists !!!"
        await model.deleteMany({})
        for (let i = 0; i < data.length; i++) {
            await handler.create(data[i])
        }
    } catch (error) {
        throw error
    }

}

module.exports = {

    setup: async (req, res, msg) => {
        let responseData = {};
        try {

            // TODO: "SETUP DB ACCOR TO PLAN"
            await update(settingModel, settings, settingDbHandler)

            responseData.msg = msg ?? 'Setup Completed !!!'
            return responseHelper.success(res, responseData);

        } catch (error) {
            console.log("Error while setting up DB: ", error)
            responseData.msg = 'Internal Server Error';
            return responseHelper.error(res, responseData);
        }



    }

}