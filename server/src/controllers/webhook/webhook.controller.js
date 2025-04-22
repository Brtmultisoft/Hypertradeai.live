'use strict';
const logger = require('../../services/logger');
const log = new logger('IncomeController').getChildLogger();
const { incomeDbHandler, userDbHandler, investmentDbHandler, investmentPlanDbHandler, settingDbHandler, depositDbHandler, withdrawalDbHandler } = require('../../services/db');
const { getChildLevelsByRefer, getTopLevelByRefer, getChildLevels, getSingleDimensional } = require('../../services/commonFun');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const { userModel } = require('../../models');
const axios = require("axios")

const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const fetchLivePrice = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        return response.data.binancecoin.usd
    } catch (error) {
        console.error('Error while fetching live price:', error);
        throw 'error while fetching live price';
    }
}

module.exports = {

    // 0 - Pending, 1 - Processed, 2 - Approved
    deposit_webhook: async (req, res) => {

        let reqObj = req.body
        log.info('Recieved deposit request', reqObj)
        let responseData = {};

        console.log(reqObj)

        try {

            if (!reqObj.confirmed) throw "Transaction not confirmed yet!"
            if (reqObj.chainId !== "0x38") throw "Wrong network ID!"

            let { hash, value, fromAddress, toAddress } = reqObj.txs[0]

            // if (contract.toLowerCase() !== config.contractDepositAddress.toLowerCase()) throw `Contract: ${contract} & depositContractAddress: ${config?.contractDepositAddress} doesn't match!`
            // if (tokenSymbol !== config.tokenSymbol) throw `TokenSymbol: ${tokenSymbol} & tokenSymbol: ${config.tokenSymbol} doesn't match!`
            if (toAddress.toLowerCase() !== config.contractDepositAddress.toLowerCase()) throw `To Address: ${toAddress} & depositAddress: ${config.contractDepositAddress} doesn't match!`

            const depositReport = await depositDbHandler.getOneByQuery({ txid: hash, status: 0 })
            if (!depositReport) throw `No Reports Found: ${depositReport}`

            const OneBNBToUSDT = await fetchLivePrice().catch(e => { throw e })
            const amount = (parseFloat(parseInt(value) / (10 ** 18)) * OneBNBToUSDT).toFixed(5)

            depositReport.amount_coin = amount
            depositReport.address = fromAddress.toLowerCase()
            depositReport.currency = "BNB"
            depositReport.status = 2
            await depositReport.save()

            await userDbHandler.updateOneByQuery(
                { _id: depositReport.user_id },
                {
                    $inc: {
                        "extra.gas_wallet": amount,
                        "extra.deposits": amount
                    }
                }
            ).catch(e => { throw `Unable to update the user data reason is: ${e}` })

            return responseHelper.success(res, responseData);

        } catch (error) {

            log.error('failed to fetch users data with error::', error)
            return responseHelper.error(res, responseData)

        }

    },

    withdraw_webhook: async (req, res) => {

        let reqObj = req.body
        log.info('Recieved deposit request', reqObj)
        let responseData = {};

        try {

            let { id, txid, amount } = reqObj

            const withdrawalReport = await withdrawalDbHandler.getById(ObjectId(id))
            if (!withdrawalReport) throw `No Reports Found: ${withdrawalReport}`

            withdrawalReport.txid = txid
            withdrawalReport.status = 2
            await withdrawalReport.save()

            await userDbHandler.updateOneByQuery(
                { _id: ObjectId(withdrawalReport.user_id) },
                {
                    $inc: {
                        extra: {
                            withdrawals: amount
                        }
                    }
                }
            )

            return responseHelper.success(res, responseData);

        } catch (error) {

            log.error('failed to fetch users data with error::', error)
            return responseHelper.error(res, responseData)

        }

    },

}

/**
 * 
NATIVE TRANSACTION RESPONSE: (BNB)
{
  confirmed: true,
  chainId: '0x38',
  abi: [],
  streamId: '718de069-ce01-407e-96fa-499f58d29fa9',
  tag: '',
  retries: 0,
  block: {
    number: '42789947',
    hash: '0xf8ec9e1adcc1da669d1ffcc93c214d6aac7adc3c76a7009a03dec578dcd28206',
    timestamp: '1727949660'
  },
  logs: [],
  txs: [
    {
      hash: '0xc86766134ae6ebe44da6ca40b3530da0f5e21bba916b3aed27f41e012079d0c5',
      gas: '27534',
      gasPrice: '3000000000',
      nonce: '2956',
      input: '0x0077990500000000000000000000000000000000000000000000000000005af3107a4000',
      transactionIndex: '39',
      fromAddress: '0x6e22d47d5afde5baf633abc0c805781483bcc69e',
      toAddress: '0x3d6ce0f96d881c81e5b5fb17addd0d95cb0146a4',
      value: '100000000000000',
      type: '2',
      v: '0',
      r: '42370870811344159654055574104497028610172797677768863407360477610313893097657',
      s: '10108921798767785400213872860940404432739331796672800877222849905093459785925',
      receiptCumulativeGasUsed: '7491609',
      receiptGasUsed: '27534',
      receiptContractAddress: null,
      receiptRoot: null,
      receiptStatus: '1',
      triggered_by: [Array]
    }
  ],
  txsInternal: [],
  erc20Transfers: [],
  erc20Approvals: [],
  nftTokenApprovals: [],
  nftApprovals: { ERC721: [], ERC1155: [] },
  nftTransfers: [],
  nativeBalances: []
}

 */

/**
 * 

 * ERC20 TOKEN TRANSFER RESPONSE:
        {
            confirmed: true,
            chainId: '0x38',
            abi: [{ name: 'Transfer', type: 'event', anonymous: false, inputs: [Array] }],
            streamId: 'af473932-51d4-4138-bd80-a26007f1a6f1',
            tag: 'HARI@4274',
            retries: 0,
            block: {
                number: '38799859',
                hash: '0x998a48d51a4c2386805acaa60b9414ad6656a4c967f6afbfec745e27f7141b47',
                timestamp: '1715945120'
            },
            logs:
                [
                    {
                        logIndex: '59',
                        transactionHash: '0x18ef1ac18b6507e23c5923f86ea93f821a65d07d76a7ddd37a907e770bf3a421',
                        address: '0x55d398326f99059ff775485246999027b3197955',
                        data: '0x000000000000000000000000000000000000000000000000016345785d8a0000',
                        topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                        topic1: '0x0000000000000000000000006e22d47d5afde5baf633abc0c805781483bcc69e',
                        topic2: '0x00000000000000000000000056df895f30d236aa545a39c81e00b9cde6d4498a',
                        topic3: null, triggered_by: [Array]
                    }
                ],
            txs: [
                {
                    hash: '0x18ef1ac18b6507e23c5923f86ea93f821a65d07d76a7ddd37a907e770bf3a421',
                    gas: '34491',
                    gasPrice: '3000000000',
                    nonce: '2943',
                    input: '0xa9059cbb00000000000000000000000056df895f30d236aa545a39c81e00b9cde6d4498a000000000000000000000000000000000000000000000000016345785d8a0000',
                    transactionIndex: '42',
                    fromAddress: '0x6e22d47d5afde5baf633abc0c805781483bcc69e',
                    toAddress: '0x55d398326f99059ff775485246999027b3197955',
                    value: '0',
                    type: '2',
                    v: '1',
                    r: '65411181362743644717914113138171679906945025327329131165569294829561217334403',
                    s: '51167440948242887575234283509885104599809865548333670466427275889782286259218',
                    receiptCumulativeGasUsed: '2642227',
                    receiptGasUsed: '34491',
                    receiptContractAddress: null,
                    receiptRoot: null,
                    receiptStatus: '1',
                    triggered_by: [Array]
                }
            ],
            txsInternal: [],
            erc20Transfers: [
                {
                    transactionHash: '0x18ef1ac18b6507e23c5923f86ea93f821a65d07d76a7ddd37a907e770bf3a421',
                    logIndex: '59',
                    contract: '0x55d398326f99059ff775485246999027b3197955',
                    triggered_by: [Array],
                    from: '0x6e22d47d5afde5baf633abc0c805781483bcc69e',
                    to: '0x56df895f30d236aa545a39c81e00b9cde6d4498a',
                    value: '100000000000000000',
                    tokenName: 'Tether USD',
                    tokenSymbol: 'USDT',
                    tokenDecimals: '18',
                    valueWithDecimals: '0.1',
                    possibleSpam: false
                }
            ],
            erc20Approvals: [],
            nftTokenApprovals: [],
            nftApprovals: {
                ERC721: [],
                ERC1155: []
            },
            nftTransfers: [],
            nativeBalances: []
        }
 * 
 */