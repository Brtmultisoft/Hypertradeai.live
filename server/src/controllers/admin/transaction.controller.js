'use strict';
const logger = require('../../services/logger');
const log = new logger('TransactionController').getChildLogger();
const axios = require('axios');
const responseHelper = require('../../utils/customResponse');
const Web3 = require('web3');

module.exports = {
    // Check transaction status on the blockchain
    checkTransactionStatus: async (req, res) => {
        let responseData = {};
        try {
            // Check if user is authenticated
            if (!req.user) {
                responseData.msg = 'Unauthorized access';
                return responseHelper.error(res, responseData, 403);
            }

            const { txHash } = req.params;

            if (!txHash) {
                responseData.msg = 'Transaction hash is required';
                return responseHelper.error(res, responseData);
            }

            // Create a web3 instance
            const web3 = new Web3('https://bsc-dataseed.binance.org');

            // Get transaction receipt
            const receipt = await web3.eth.getTransactionReceipt(txHash);

            // Get transaction details
            const transaction = await web3.eth.getTransaction(txHash);

            // If receipt is null, transaction is still pending
            if (!receipt) {
                responseData.msg = 'Transaction is pending';
                responseData.result = {
                    confirmed: false,
                    pending: true,
                    hash: txHash,
                    transaction: transaction || null
                };
                return responseHelper.success(res, responseData);
            }

            // Get block details for timestamp
            const block = await web3.eth.getBlock(receipt.blockNumber);

            // Check if transaction was successful
            const success = receipt.status;

            if (success) {
                responseData.msg = 'Transaction confirmed';
                responseData.result = {
                    confirmed: true,
                    success: true,
                    hash: txHash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed,
                    timestamp: block ? block.timestamp : null,
                    receipt: receipt,
                    transaction: transaction
                };
            } else {
                responseData.msg = 'Transaction failed';
                responseData.result = {
                    confirmed: true,
                    success: false,
                    error: 'Transaction execution failed',
                    hash: txHash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed,
                    timestamp: block ? block.timestamp : null,
                    receipt: receipt,
                    transaction: transaction
                };
            }

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error in checkTransactionStatus:', error);
            responseData.msg = 'Error checking transaction status: ' + error.message;
            responseData.result = {
                confirmed: false,
                error: error.message,
                hash: req.params.txHash
            };
            return responseHelper.error(res, responseData);
        }
    },

    // Get transaction details from BSCScan API
    getTransactionDetails: async (req, res) => {
        let responseData = {};
        try {
            // Check if user is authenticated
            if (!req.user) {
                responseData.msg = 'Unauthorized access';
                return responseHelper.error(res, responseData, 403);
            }

            const { txHash } = req.params;

            if (!txHash) {
                responseData.msg = 'Transaction hash is required';
                return responseHelper.error(res, responseData);
            }

            // BSCScan API key (should be stored in environment variables)
            const apiKey = process.env.BSCSCAN_API_KEY || '';

            // Call BSCScan API
            const response = await axios.get(`https://api.bscscan.com/api`, {
                params: {
                    module: 'transaction',
                    action: 'gettxreceiptstatus',
                    txhash: txHash,
                    apikey: apiKey
                }
            });

            if (response.data.status === '1') {
                // Get transaction details
                const txResponse = await axios.get(`https://api.bscscan.com/api`, {
                    params: {
                        module: 'proxy',
                        action: 'eth_getTransactionByHash',
                        txhash: txHash,
                        apikey: apiKey
                    }
                });

                responseData.msg = 'Transaction details fetched successfully';
                responseData.result = {
                    receipt: response.data.result,
                    transaction: txResponse.data.result
                };
            } else {
                responseData.msg = 'Failed to fetch transaction details';
                responseData.result = response.data;
            }

            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Error in getTransactionDetails:', error);
            responseData.msg = 'Error fetching transaction details: ' + error.message;
            return responseHelper.error(res, responseData);
        }
    }
};
