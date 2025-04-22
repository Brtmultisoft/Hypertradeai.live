'use strict';
const logger = require('../../services/logger');
const log = new logger('AdminInvestmentPlanController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const { investmentPlanDbHandler } = require('../../services/db');

module.exports = {
    getAll: async (req, res) => {
        let reqObj = req.query;
        log.info('Received request for getAll:', reqObj);

        let responseData = {};
        try {
            let getList = await investmentPlanDbHandler.getByQuery({});
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let id = req.params.id;
        try {
            let getData = await investmentPlanDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    add: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            let data = {
                title: reqObj.title,
                amount_from: reqObj.amount_from || 0,
                amount_to: reqObj.amount_to || 0,
                percentage: reqObj.percentage || 0,
                days: reqObj.days || 0,
                frequency_in_days: reqObj.frequency_in_days || 1,
                type: reqObj.type || 0,
                status: reqObj.status !== undefined ? reqObj.status : true,
                extra: reqObj.extra || {},
            };

            await investmentPlanDbHandler.create(data);

            responseData.msg = "Data added successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to add data with error::', error);
            responseData.msg = "Failed to add data";
            return responseHelper.error(res, responseData);
        }
    },

    delete: async (req, res) => {
        let responseData = {};
        let planId = req.params.id;
        try {
            await investmentPlanDbHandler.deleteById(planId);

            responseData.msg = "Data deleted successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to delete data with error::', error);
            responseData.msg = "Failed to delete data";
            return responseHelper.error(res, responseData);
        }
    },

    update: async (req, res) => {
        let responseData = {};
        let reqObj = req.body;
        try {
            let existingPlan = await investmentPlanDbHandler.getByQuery({ _id: reqObj.id });
            if (!existingPlan.length) {
                responseData.msg = "Invalid data";
                return responseHelper.error(res, responseData);
            }

            let updatedData = {
                title: reqObj.title || existingPlan.title,
                amount_from: reqObj.amount_from || existingPlan.amount_from,
                amount_to: reqObj.amount_to || existingPlan.amount_to,
                percentage: reqObj.percentage || existingPlan.percentage,
                days: reqObj.days || existingPlan.days,
                frequency_in_days: reqObj.frequency_in_days || existingPlan.frequency_in_days,
                type: reqObj.type || existingPlan.type,
                status: reqObj.status !== undefined ? reqObj.status : existingPlan.status,
                extra: reqObj.extra || existingPlan.extra,
            };

            let result = await investmentPlanDbHandler.updateById(reqObj.id, updatedData);

            responseData.msg = "Data updated successfully!";
            responseData.data = result;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to update data with error::', error);
            responseData.msg = "Failed to update data";
            return responseHelper.error(res, responseData);
        }
    }
};












// // 'use strict';

// // const logger = require('../../services/logger');
// // const log = new logger('AdminInveatmentPlanController').getChildLogger();
// // const { investmentPlanDbHandler } = require('../../services/db');
// // const responseHelper = require('../../utils/customResponse');
// // const config = require('../../config/config');

// // module.exports = {

// //     getAll: async (req, res) => {
// //         let reqObj = req.query;
// //         log.info('Recieved request for getAll:', reqObj);
// //         let responseData = {};
// //         try {
// //             let getList = await investmentPlanDbHandler.getByQuery({});
// //             responseData.msg = 'Data fetched successfully!';
// //             responseData.data = getList;
// //             return responseHelper.success(res, responseData);
// //         } catch (error) {
// //             log.error('failed to fetch data with error::', error);
// //             responseData.msg = 'Failed to fetch data';
// //             return responseHelper.error(res, responseData);
// //         }
// //     },

// //     getOne: async (req, res) => {
// //         let responseData = {};
// //         let id = req.params.id;
// //         try {
// //             let getData = await investmentPlanDbHandler.getById(id);
// //             responseData.msg = "Data fetched successfully!";
// //             responseData.data = getData;
// //             return responseHelper.success(res, responseData);
// //         } catch (error) {
// //             log.error('failed to fetch data with error::', error);
// //             responseData.msg = 'Failed to fetch data';
// //             return responseHelper.error(res, responseData);
// //         }
// //     },

// //     add: async (req, res) => {
// //         let responseData = {};
// //         let reqObj = req.body;
// //         try {
// //             // Validate and format the request data
// //             let data = {
// //                 title: reqObj.title,
// //                 amount_from: reqObj.amount_from || 0, 
// //                 amount_to: reqObj.amount_to || 0, 
// //                 percentage: reqObj.percentage || 0, 
// //                 days: reqObj.days || 0, 
// //                 frequency_in_days: reqObj.frequency_in_days || 1, 
// //                 type: reqObj.type || 0, 
// //                 status: reqObj.status !== undefined ? reqObj.status : true, 
// //                 extra: reqObj.extra || {}, 
// //             };

// //             // Create the investment plan in the database
// //             await investmentPlanDbHandler.create(data);

// //             responseData.msg = "Data added successfully!";
// //             return responseHelper.success(res, responseData);
// //         } catch (error) {
// //             log.error('Failed to add data with error::', error);
// //             responseData.msg = "Failed to add data";
// //             return responseHelper.error(res, responseData);
// //         }
// //     },
// //     delete: async (req, res) => {
// //         let responseData = {};
// //         let planId = req.params.id;
// //         try {
// //             // Delete the investment plan from the database
// //             await investmentPlanDbHandler.deleteById(planId);

// //             responseData.msg = "Data deleted successfully!";
// //             return responseHelper.success(res, responseData);
// //         } catch (error) {
// //             log.error('Failed to delete data with error::', error);
// //             responseData.msg = "Failed to delete data";
// //             return responseHelper.error(res, responseData);
// //         }
// //     },


// //     update: async (req, res) => {
// //         let responseData = {};
// //         let reqObj = req.body;
// //         try {
// //             let getByQuery = await investmentPlanDbHandler.getByQuery({ _id: reqObj.id });
// //             if (!getByQuery.length) {
// //                 responseData.msg = "Invailid data";
// //                 return responseHelper.error(res, responseData);
// //             }
// //             let updatedObj = {

// //             }

// //             let updatedData = await investmentPlanDbHandler.updateById(id, updatedObj);
// //             responseData.msg = "Data updated successfully!";
// //             responseData.data = updatedData;
// //             return responseHelper.success(res, responseData);
// //         } catch (error) {
// //             log.error('failed to update data with error::', error);
// //             responseData.msg = "Failed to update data";
// //             return responseHelper.error(res, responseData);
// //         }
// //     }
// // };

// 'use strict';
// const logger = require('../../services/logger');
// const log = new logger('AdminInvestmentPlanController').getChildLogger();
// const responseHelper = require('../../utils/customResponse');
// const { ethers } = require('ethers');

// // Smart contract details
// const contractAddress = '0xE34e0B9eC6d4036C6f93f7F7c029e8Be5FF59b45'; // Your contract address
// const abi = [
//     {
//         "inputs": [],
//         "stateMutability": "nonpayable",
//         "type": "constructor"
//     },
//     {
//         "anonymous": false,
//         "inputs": [
//             {
//                 "indexed": true,
//                 "internalType": "address",
//                 "name": "user",
//                 "type": "address"
//             },
//             {
//                 "indexed": false,
//                 "internalType": "uint256",
//                 "name": "planId",
//                 "type": "uint256"
//             },
//             {
//                 "indexed": false,
//                 "internalType": "uint256",
//                 "name": "amount",
//                 "type": "uint256"
//             }
//         ],
//         "name": "Invested",
//         "type": "event"
//     },
//     {
//         "inputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "_planId",
//                 "type": "uint256"
//             }
//         ],
//         "name": "getPlan",
//         "outputs": [
//             {
//                 "components": [
//                     {
//                         "internalType": "uint256",
//                         "name": "id",
//                         "type": "uint256"
//                     },
//                     {
//                         "internalType": "uint256",
//                         "name": "amount",
//                         "type": "uint256"
//                     },
//                     {
//                         "internalType": "uint256",
//                         "name": "percentage",
//                         "type": "uint256"
//                     },
//                     {
//                         "internalType": "uint256",
//                         "name": "duration",
//                         "type": "uint256"
//                     }
//                 ],
//                 "internalType": "struct RoboMineInvestment.Plan",
//                 "name": "",
//                 "type": "tuple"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [],
//         "name": "getTotalPlans",
//         "outputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "_planId",
//                 "type": "uint256"
//             }
//         ],
//         "name": "invest",
//         "outputs": [],
//         "stateMutability": "payable",
//         "type": "function"
//     },
//     {
//         "inputs": [],
//         "name": "owner",
//         "outputs": [
//             {
//                 "internalType": "address",
//                 "name": "",
//                 "type": "address"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "name": "plans",
//         "outputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "id",
//                 "type": "uint256"
//             },
//             {
//                 "internalType": "uint256",
//                 "name": "amount",
//                 "type": "uint256"
//             },
//             {
//                 "internalType": "uint256",
//                 "name": "percentage",
//                 "type": "uint256"
//             },
//             {
//                 "internalType": "uint256",
//                 "name": "duration",
//                 "type": "uint256"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [],
//         "name": "totalPlans",
//         "outputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     }
// ]; // Insert your contract ABI here

// // Setup the provider and contract instance (using Hardhat's local network as an example)
// const { JsonRpcProvider } = require('ethers').providers;
// const provider = new JsonRpcProvider('https://sepolia.infura.io/v3/487f1c813d184391962081af535a6cd7');

// const contract = new ethers.Contract(contractAddress, abi, provider);

// // Controller methods
// module.exports = {
//     getAll: async (req, res) => {
//         let reqObj = req.query;
//         log.info('Received request for getAll:', reqObj);

//         let responseData = {};
//         try {
//             // Fetch all the investment plans from the contract
//             const totalPlans = await contract.getTotalPlans();
//             const plans = [];
//             for (let i = 1; i <= totalPlans; i++) {
//                 const plan = await contract.getPlan(i);

//                 // Convert BigNumber values to human-readable format
//                 const planId = plan[0].toString(); // BigNumber to string
//                 const amount = ethers.utils.formatUnits(plan[1], 18); // Assuming the amount is in 18 decimals
//                 const percentage = plan[2].toString(); // BigNumber to string
//                 const duration = plan[3].toString(); // BigNumber to string
                
//                 // Add the converted values to the plans array
//                 plans.push({
//                     planId,
//                     amount,
//                     percentage,
//                     duration
//                 });
//             }
//             responseData.msg = 'Data fetched successfully!';
//             responseData.data = plans;
//             return responseHelper.success(res, responseData);
//         } catch (error) {
//             log.error('Failed to fetch all investment plans', {
//                 error: error.message,
//                 stack: error.stack,
//                 request: reqObj,
//                 contractAddress
//             });
//             responseData.msg = 'Failed to fetch data for all plans. Please check the logs for details.';
//             return responseHelper.error(res, responseData);
//         }
//     },

//     getOne: async (req, res) => {
//         let responseData = {};
//         let id = req.params.id;
//         try {
//             // Fetch a single investment plan from the contract
//             const plan = await contract.getPlan(id);
//             responseData.msg = "Data fetched successfully!";
//             responseData.data = plan;
//             return responseHelper.success(res, responseData);
//         } catch (error) {
//             log.error(`Failed to fetch investment plan with ID: ${id}`, {
//                 error: error.message,
//                 stack: error.stack,
//                 request: req.params,
//                 contractAddress
//             });
//             responseData.msg = `Failed to fetch data for plan with ID: ${id}. Please check the logs for details.`;
//             return responseHelper.error(res, responseData);
//         }
//     }
// };


