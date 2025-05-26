'use strict';
const logger = require('../../services/logger');
const log = new logger('WithdrawalController').getChildLogger();
const { withdrawalDbHandler, userDbHandler, settingDbHandler } = require('../../services/db');
const responseHelper = require('../../utils/customResponse');
const config = require('../../config/config');
const { userModel } = require('../../models');
const axios = require('axios')

const ethers = require('ethers');

const getExchangeRate = async (amount) => {
    try {

        const response = await axios.post(
            'https://api.coinbrain.com/public/coin-info',
            { "56": ["0xC9F641c5EF43C845897Aaf319e80bceA729d2a1F"] }
        )

        if (response.status !== 200) throw "No Conversion Rate Found!"

        let conversionRate = 1 / response.data[0]?.priceUsd
        return {
            conversionRate,
            netAmount: (conversionRate * amount).toFixed(4)
        }

    } catch (error) {
        throw error
    }
}

const withdrawStatusType = {
    0: "PENDING",
    1: "REJECTED",
    2: "APPROVED"
}

const initiateTxn = async (txn, priv_key) => {
    try {

        let hash = null
        const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org:443');

        const wallet = new ethers.Wallet(priv_key, provider);

        // Create contract instance
        const contractInstance = new ethers.Contract(config.withdrawAddress, config.withdrawABI, wallet);
        const amount = (txn.net_amount * (10 ** 18)).toString()

        // Calculate gas fee
        let gasLimit = await contractInstance.estimateGas["transfer"](txn.address, amount)
        let gasPrice = await provider.getGasPrice()
        gasLimit = gasLimit.mul(110).div(100)
        gasPrice = gasPrice.mul(2)

        // Check wallet balance for gas fee
        const balance = await wallet.getBalance();
        if (balance.lt(gasPrice)) {
            throw 'Insufficient balance for gas fee'
        }

        try {

            hash = (await contractInstance.transfer(txn.address, amount, { gasLimit, gasPrice })).hash

        } catch (error) {
            console.error('Error:', error)
            hash = error.transaction.hash
        }

        // make the status approved/pending/rejected accordingly
        if (hash) {
            txn.txid = hash
            txn.status = 2
        } else {
            txn.status = 0
        }
        txn.remark = withdrawStatusType[txn.status]
        await txn.save()

    } catch (error) {
        throw error
    }
}

// Function to release staking to wallet
const releaseStakingToWallet = async (req, res) => {
    let responseData = {};
    let user = req.user;
    let user_id = user.sub;

    try {
        // Get user data
        let userData = await userDbHandler.getById(user_id);

        if (!userData) {
            responseData.msg = 'User not found';
            return responseHelper.error(res, responseData);
        }

        // Check if user has any staked investment
        if (!userData.total_investment || userData.total_investment <= 0) {
            responseData.msg = 'You do not have any staked investment to release';
            return responseHelper.error(res, responseData);
        }

        const stakingAmount = userData.total_investment;

        console.log(`Releasing staking to wallet for user ${user_id}. Staking amount: ${stakingAmount}`);

        // Update user record - move staking to wallet
        const updateResult = await userDbHandler.updateOneByQuery(
            { _id: user_id },
            {
                $inc: {
                    wallet: stakingAmount,  // Add staking amount to wallet
                    total_investment: -stakingAmount  // Reset total investment
                },
                $set: {
                    dailyProfitActivated: false,  // Deactivate daily profit
                    lastDailyProfitActivation: null  // Clear last activation date
                }
            }
        );

        console.log('User wallet update result:', updateResult);

        // Update all active investments to 'completed' status
        try {
            // Import the investment database handler
            const { investmentDbHandler } = require('../../services/db');

            // Update all active investments for this user to 'completed'
            const investmentUpdateResult = await investmentDbHandler.updateManyByQuery(
                {
                    user_id: user_id,
                    status: 'active' // Only update active investments
                },
                {
                    $set: {
                        status: 'completed',
                        extra: {
                            completedReason: 'staking_released_to_wallet',
                            completedDate: new Date()
                        }
                    }
                }
            );

            console.log('Investment update result:', investmentUpdateResult);
        } catch (investmentError) {
            console.error('Error updating investments:', investmentError);
            // Don't fail the operation if investment update fails
        }

        // Create a transaction record for this operation
        try {
            const { transactionDbHandler } = require('../../services/db');

            await transactionDbHandler.create({
                user_id: user_id,
                type: 'staking_release',
                amount: stakingAmount,
                status: 'completed',
                description: 'Staking released to wallet',
                created_at: new Date(),
                extra: {
                    previousStakingAmount: stakingAmount,
                    operation: 'release_to_wallet'
                }
            });
        } catch (transactionError) {
            console.error('Error creating transaction record:', transactionError);
            // Don't fail the operation if transaction creation fails
        }

        responseData.msg = 'Staking successfully released to your wallet';
        responseData.data = {
            releasedAmount: stakingAmount,
            newWalletBalance: userData.wallet + stakingAmount,
            remainingStaking: 0
        };

        return responseHelper.success(res, responseData);
    } catch (error) {
        log.error('Failed to release staking to wallet with error:', error);
        responseData.msg = typeof error === 'string' ? error : 'Failed to release staking to wallet';
        return responseHelper.error(res, responseData);
    }
};

// Function to release staking to trade wallet (wallet_topup)
const releaseStakingToTradeWallet = async (req, res) => {
    let responseData = {};
    let user = req.user;
    let user_id = user.sub;

    try {
        // Get user data
        let userData = await userDbHandler.getById(user_id);

        if (!userData) {
            responseData.msg = 'User not found';
            return responseHelper.error(res, responseData);
        }

        // Check if user has any staked investment
        if (!userData.total_investment || userData.total_investment <= 0) {
            responseData.msg = 'You do not have any staked investment to release';
            return responseHelper.error(res, responseData);
        }

        const stakingAmount = userData.total_investment;

        console.log(`Releasing staking to trade wallet for user ${user_id}. Staking amount: ${stakingAmount}`);

        // Update user record - move staking to trade wallet (wallet_topup)
        const updateResult = await userDbHandler.updateOneByQuery(
            { _id: user_id },
            {
                $inc: {
                    wallet_topup: stakingAmount,  // Add staking amount to trade wallet
                    total_investment: -stakingAmount  // Reset total investment
                },
                $set: {
                    dailyProfitActivated: false,  // Deactivate daily profit
                    lastDailyProfitActivation: null  // Clear last activation date
                }
            }
        );

        console.log('User trade wallet update result:', updateResult);

        // Update all active investments to 'completed' status
        try {
            // Import the investment database handler
            const { investmentDbHandler } = require('../../services/db');

            // Update all active investments for this user to 'completed'
            const investmentUpdateResult = await investmentDbHandler.updateManyByQuery(
                {
                    user_id: user_id,
                    status: 'active' // Only update active investments
                },
                {
                    $set: {
                        status: 'completed',
                        extra: {
                            completedReason: 'staking_released_to_trade_wallet',
                            completedDate: new Date()
                        }
                    }
                }
            );

            console.log('Investment update result:', investmentUpdateResult);
        } catch (investmentError) {
            console.error('Error updating investments:', investmentError);
            // Don't fail the operation if investment update fails
        }

        // Create a transaction record for this operation
        try {
            const { transactionDbHandler } = require('../../services/db');

            await transactionDbHandler.create({
                user_id: user_id,
                type: 'staking_release_to_trade',
                amount: stakingAmount,
                status: 'completed',
                description: 'Staking released to trade wallet',
                created_at: new Date(),
                extra: {
                    previousStakingAmount: stakingAmount,
                    operation: 'release_to_trade_wallet',
                    noConversion: true,
                    exactAmountReleased: true
                }
            });
        } catch (transactionError) {
            console.error('Error creating transaction record:', transactionError);
            // Don't fail the operation if transaction creation fails
        }

        responseData.msg = `Staking (${stakingAmount.toFixed(2)} USDT) successfully released to your trade wallet without any conversion`;
        responseData.data = {
            releasedAmount: stakingAmount,
            newTradeWalletBalance: userData.wallet_topup + stakingAmount,
            remainingStaking: 0,
            exactAmountReleased: true,
            noConversion: true
        };

        return responseHelper.success(res, responseData);
    } catch (error) {
        log.error('Failed to release staking to trade wallet with error:', error);
        responseData.msg = typeof error === 'string' ? error : 'Failed to release staking to trade wallet';
        return responseHelper.error(res, responseData);
    }
};

module.exports = {
    // Add the new functions to the exports
    releaseStakingToWallet,
    releaseStakingToTradeWallet,

    getAll: async (req, res) => {
        let reqObj = req.query;
        let user = req.user;
        let user_id = user.sub;
        log.info('Recieved request for getAll:', reqObj);
        let responseData = {};
        try {
            let getList = await withdrawalDbHandler.getAll(reqObj, user_id);
            responseData.msg = 'Data fetched successfully!';
            responseData.data = getList;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getOne: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let id = req.params.id;
        try {
            let getData = await withdrawalDbHandler.getById(id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    add: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.body;
        try {
            let user = await userDbHandler.getById(user_id);
            let amount = parseFloat(reqObj.amount);

            // Check if user has set a withdrawal wallet
            if (!user.withdraw_wallet) {
                responseData.msg = 'Please set a withdrawal wallet address in your profile before making a withdrawal';
                return responseHelper.error(res, responseData);
            }

            // Use the user's registered withdrawal wallet
            let address = user.withdraw_wallet;

            // Check if user has sufficient balance
            if (user?.wallet < amount) {
                responseData.msg = `Insufficient Fund!`;
                return responseHelper.error(res, responseData);
            }

            // Check if user has already made a withdrawal today
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            if (user.last_withdrawal_date && new Date(user.last_withdrawal_date) >= today) {
                responseData.msg = 'You can only make one withdrawal per day. Please try again tomorrow.';
                return responseHelper.error(res, responseData);
            }

            // Check if withdrawal amount is within limits (20% of trade amount)
            if (user.total_investment === 0) {
                responseData.msg = 'You need to have active investments to make withdrawals';
                return responseHelper.error(res, responseData);
            }

            // Use last_investment_amount if available, otherwise fall back to total_investment
            const investmentAmount = user.last_investment_amount > 0 ? user.last_investment_amount : user.total_investment;
            const maxWithdrawalAmount = investmentAmount * 0.2; // 20% of investment amount

            if (amount > maxWithdrawalAmount) {
                responseData.msg = `Withdrawal amount exceeds the maximum limit of 20% of your ${user.last_investment_amount > 0 ? 'latest' : 'total'} investment ($${maxWithdrawalAmount.toFixed(2)})`;
                return responseHelper.error(res, responseData);
            }

            // Calculate admin and service charge (5%)
            const adminFee = amount * 0.05;
            const net_amount = amount - adminFee;

            // Prepare data for storage
            let data = {
                user_id: user_id,
                amount: amount,
                fee: adminFee,
                net_amount: net_amount,
                address: address,
                extra: {
                    walletType: 'wallet',
                    adminFee: adminFee,
                    feePercentage: 5
                }
            }

            // Update user's wallet balance and last withdrawal date
            await userModel.updateOne(
                { _id: user_id },
                {
                    $inc: {
                        wallet: -amount,
                        wallet_withdraw: amount,
                        "extra.withdrawals": amount
                    },
                    $set: {
                        last_withdrawal_date: new Date()
                    }
                }
            ).then(async val => {
                if (!val.modifiedCount > 0) throw "Unable to update amount!"

                // Create withdrawal record
                await withdrawalDbHandler.create(data)
                    .catch(e => { throw `Something went wrong while creating withdrawal report: ${e}` })
            }).catch(e => { throw e })

            responseData.msg = "Amount has been withdrawn successfully!";
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to update data with error::', error);
            responseData.msg = typeof error === 'string' ? error : "Failed to process withdrawal";
            return responseHelper.error(res, responseData);
        }
    },

    getCount: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await withdrawalDbHandler.getCount(reqObj, user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    getSum: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.query;
        try {
            let getData = await withdrawalDbHandler.getSum(reqObj, user_id);
            responseData.msg = "Data fetched successfully!";
            responseData.data = getData;
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('failed to fetch data with error::', error);
            responseData.msg = 'Failed to fetch data';
            return responseHelper.error(res, responseData);
        }
    },

    // Request withdrawal (requires admin approval)
    requestWithdrawal: async (req, res) => {
        let responseData = {};
        let user = req.user;
        let user_id = user.sub;
        let reqObj = req.body;
        try {
            // Get user data
            let userData = await userDbHandler.getById(user_id);
            let amount = parseFloat(reqObj.amount);
            let address = reqObj.address;

            // Get staking release options
            let stakingReleaseOption = reqObj.stakingReleaseOption || 'none'; // 'none', 'partial', 'full'
            let stakingReleaseAmount = parseFloat(reqObj.stakingReleaseAmount || 0);
            let stakingReleasePercentage = parseInt(reqObj.stakingReleasePercentage || 0);

            // For backward compatibility
            let unlockStaking = stakingReleaseOption !== 'none' || reqObj.unlockStaking === true;

            // Validate request - but only if we're not just releasing staking to wallet
            // For partial or full staking release with withdrawal, we still need amount and address
            if (stakingReleaseOption !== 'wallet' && (!amount || isNaN(amount) || amount <= 0)) {
                responseData.msg = 'Please enter a valid amount';
                return responseHelper.error(res, responseData);
            }

            if (stakingReleaseOption !== 'wallet' && !address) {
                responseData.msg = 'Please enter a valid wallet address';
                return responseHelper.error(res, responseData);
            }

            // Check if user has sufficient balance - but only if we're actually withdrawing
            if (stakingReleaseOption !== 'wallet' && userData?.wallet < amount) {
                responseData.msg = 'Insufficient funds in your wallet';
                return responseHelper.error(res, responseData);
            }

            // Check minimum withdrawal amount - but only if we're actually withdrawing
            if (stakingReleaseOption !== 'wallet' && amount < 0) {
                responseData.msg = 'Minimum withdrawal amount is 50 USDT';
                return responseHelper.error(res, responseData);
            }

            // Calculate fee (10% of withdrawal amount)
            const fee = amount * 0.1; // 10% fee
            const netAmount = amount - fee;

            // If we're only releasing staking to wallet or doing a partial release without withdrawal,
            // we don't need to create a withdrawal record
            if (stakingReleaseOption === 'wallet' ||
                (stakingReleaseOption === 'partial' && (!address || address.trim() === '') && amount <= 0.01)) {

                // Determine the amount to release based on the option
                const releaseAmount = stakingReleaseOption === 'partial' ?
                    userData.total_investment * 0.5 : // 50% for partial
                    userData.total_investment;        // 100% for wallet
                // Handle the staking release directly
                console.log(`Releasing staking to wallet for user ${user_id}. Staking amount: ${userData.total_investment}`);

                // Update user record - move staking to wallet
                // IMPORTANT: We're directly moving the exact amount without any conversion
                const updateObj = {
                    $inc: {
                        wallet: releaseAmount,  // Add exact release amount to wallet (no conversion)
                        total_investment: -releaseAmount  // Reduce total investment by exact release amount
                    }
                };

                // For full release, also deactivate daily profit
                if (stakingReleaseOption === 'wallet' || releaseAmount >= userData.total_investment) {
                    updateObj.$set = {
                        dailyProfitActivated: false,  // Deactivate daily profit
                        lastDailyProfitActivation: null  // Clear last activation date
                    };
                }

                const updateResult = await userDbHandler.updateOneByQuery(
                    { _id: user_id },
                    updateObj
                );

                console.log('User wallet update result:', updateResult);

                // Handle investments based on release type
                try {
                    if (stakingReleaseOption === 'partial') {
                        // For partial release, update investment records to reflect 50% reduction
                        const activeInvestments = await investmentDbHandler.getManyByQuery({
                            user_id: user_id,
                            status: 'active'
                        });

                        console.log(`Found ${activeInvestments.length} active investments to update for partial release`);

                        // Update each investment to reduce its amount by 50%
                        for (const investment of activeInvestments) {
                            const originalAmount = investment.amount || 0;
                            const newAmount = originalAmount * 0.5;

                            await investmentDbHandler.updateById(investment._id, {
                                amount: newAmount,
                                extra: {
                                    ...(investment.extra || {}),
                                    originalAmount: originalAmount,
                                    partiallyReleased: true,
                                    partialReleaseDate: new Date(),
                                    partialReleasePercentage: 50,
                                    partialReleaseToWallet: true
                                }
                            });
                        }

                        console.log('Investments updated for partial release to wallet');
                    } else {
                        // For full release, mark all investments as completed
                        const investmentUpdateResult = await investmentDbHandler.updateManyByQuery(
                            {
                                user_id: user_id,
                                status: 'active' // Only update active investments
                            },
                            {
                                $set: {
                                    status: 'completed',
                                    extra: {
                                        completedReason: 'staking_released_to_wallet',
                                        completedDate: new Date()
                                    }
                                }
                            }
                        );

                        console.log('Investment update result for full release:', investmentUpdateResult);
                    }
                } catch (investmentError) {
                    console.error('Error updating investments:', investmentError);
                    // Don't fail the operation if investment update fails
                }

                // Create a transaction record for this operation
                try {
                    const { transactionDbHandler } = require('../../services/db');

                    const transactionType = stakingReleaseOption === 'partial' ?
                        'partial_staking_release' : 'staking_release';

                    const description = stakingReleaseOption === 'partial' ?
                        '50% of staking released to wallet' : 'Staking released to wallet';

                    await transactionDbHandler.create({
                        user_id: user_id,
                        type: transactionType,
                        amount: releaseAmount,
                        status: 'completed',
                        description: description,
                        created_at: new Date(),
                        extra: {
                            previousStakingAmount: userData.total_investment,
                            releaseAmount: releaseAmount,
                            releasePercentage: stakingReleaseOption === 'partial' ? 50 : 100,
                            remainingStaking: userData.total_investment - releaseAmount,
                            operation: stakingReleaseOption === 'partial' ? 'partial_release_to_wallet' : 'release_to_wallet',
                            noConversion: true, // Flag to indicate no conversion happened
                            originalCurrency: 'USDT', // The original currency remains the same
                            exactAmountReleased: true // Flag to indicate exact amount was released
                        }
                    });
                } catch (transactionError) {
                    console.error('Error creating transaction record:', transactionError);
                    // Don't fail the operation if transaction creation fails
                }

                // Prepare success message based on release type
                if (stakingReleaseOption === 'partial') {
                    responseData.msg = `50% of your staking (${releaseAmount.toFixed(2)} USDT) has been successfully released to your wallet without any conversion`;
                    responseData.data = {
                        releasedAmount: releaseAmount,
                        newWalletBalance: userData.wallet + releaseAmount,
                        remainingStaking: userData.total_investment - releaseAmount,
                        exactAmountReleased: true,
                        noConversion: true
                    };
                } else {
                    responseData.msg = `Your staking (${releaseAmount.toFixed(2)} USDT) has been successfully released to your wallet without any conversion`;
                    responseData.data = {
                        releasedAmount: releaseAmount,
                        newWalletBalance: userData.wallet + releaseAmount,
                        remainingStaking: 0,
                        exactAmountReleased: true,
                        noConversion: true
                    };
                }

                return responseHelper.success(res, responseData);
            }

            // For normal withdrawals or withdrawals with staking release
            // Create withdrawal record with pending status
            const withdrawalData = {
                user_id: user_id,
                amount: amount,
                fee: fee,
                net_amount: netAmount,
                address: address,
                status: 0, // Pending status
                remark: 'Pending admin approval',
                currency: 'USDT',
                extra: {
                    walletType: 'wallet',
                    adminFee: fee,
                    requestDate: new Date(),
                    stakingReleaseOption: stakingReleaseOption,
                    stakingReleaseAmount: stakingReleaseAmount,
                    stakingReleasePercentage: stakingReleasePercentage
                }
            };

            // Deduct amount from user's wallet and move to wallet_withdraw (pending withdrawals)
            console.log(`Deducting ${amount} from user ${user_id}'s wallet and adding to wallet_withdraw`);

            // Create update object for user
            let updateObj = {
                $inc: {
                    wallet: -amount,
                    wallet_withdraw: amount
                }
            };

            // Handle staking release based on the selected option
            if (stakingReleaseOption !== 'none' && userData.total_investment > 0) {
                console.log(`Processing staking release for user ${user_id}. Option: ${stakingReleaseOption}, Current investment: ${userData.total_investment}`);

                if (stakingReleaseOption === 'partial') {
                    // Partial release (50%)
                    const releaseAmount = userData.total_investment * 0.5;
                    const remainingInvestment = userData.total_investment - releaseAmount;

                    console.log(`Partial staking release: ${releaseAmount} USDT (50%). Remaining investment: ${remainingInvestment} USDT`);

                    // Add the partial investment to the withdrawal amount
                    withdrawalData.extra.stakingAmount = releaseAmount;
                    withdrawalData.extra.totalWithdrawalAmount = amount + releaseAmount;
                    withdrawalData.extra.remainingInvestment = remainingInvestment;

                    // Update the remark to indicate partial staking was released
                    withdrawalData.remark = 'Pending admin approval (includes partial staking release)';

                    // Update user's investment status - reduce by 50%
                    updateObj.$set = {
                        total_investment: remainingInvestment
                    };

                    // Add a note about partial staking release in the withdrawal record
                    withdrawalData.extra.stakingPartiallyReleased = true;

                } else if (stakingReleaseOption === 'full') {
                    // Full release (100%)
                    console.log(`Full staking release: ${userData.total_investment} USDT (100%)`);

                    // Add the total_investment to the withdrawal amount
                    withdrawalData.extra.stakingAmount = userData.total_investment;
                    withdrawalData.extra.totalWithdrawalAmount = amount + userData.total_investment;

                    // Update the remark to indicate full staking was released
                    withdrawalData.remark = 'Pending admin approval (includes full staking release)';

                    // Update user's investment status - reset completely
                    updateObj.$set = {
                        total_investment: 0, // Reset total investment
                        dailyProfitActivated: false, // Deactivate daily profit
                        lastDailyProfitActivation: null // Clear last activation date
                    };

                    // Add a note about full staking release in the withdrawal record
                    withdrawalData.extra.stakingFullyReleased = true;
                }
            }

            // Update user record
            const updateResult = await userDbHandler.updateOneByQuery({_id : user_id}, updateObj);
            console.log('User wallet update result:', updateResult);

            // Create withdrawal record
            const withdrawal = await withdrawalDbHandler.create(withdrawalData);

            // Handle investments based on staking release option
            if (stakingReleaseOption !== 'none' && userData.total_investment > 0) {
                try {
                    // Import the investment database handler
                    const { investmentDbHandler } = require('../../services/db');

                    if (stakingReleaseOption === 'partial') {
                        // For partial release, update investment records to reflect 50% reduction
                        const activeInvestments = await investmentDbHandler.getManyByQuery({
                            user_id: user_id,
                            status: 'active'
                        });

                        console.log(`Found ${activeInvestments.length} active investments to update for partial release`);

                        // Update each investment to reduce its amount by 50%
                        for (const investment of activeInvestments) {
                            const originalAmount = investment.amount || 0;
                            const newAmount = originalAmount * 0.5;

                            await investmentDbHandler.updateById(investment._id, {
                                amount: newAmount,
                                extra: {
                                    ...(investment.extra || {}),
                                    originalAmount: originalAmount,
                                    partiallyReleased: true,
                                    partialReleaseDate: new Date(),
                                    partialReleasePercentage: 50
                                }
                            });
                        }

                        console.log('Investments updated for partial release');

                    } else if (stakingReleaseOption === 'full') {
                        // For full release, mark all investments as completed
                        const investmentUpdateResult = await investmentDbHandler.updateManyByQuery(
                            {
                                user_id: user_id,
                                status: 'active' // Only update active investments
                            },
                            {
                                $set: {
                                    status: 'completed',
                                    extra: {
                                        completedReason: 'staking_fully_released',
                                        completedDate: new Date()
                                    }
                                }
                            }
                        );

                        console.log('Investments marked as completed for full release:', investmentUpdateResult);
                    }
                } catch (investmentError) {
                    console.error('Error updating investments:', investmentError);
                    // Don't fail the withdrawal if investment update fails
                }
            }

            // Prepare success response
            let successMsg = 'Withdrawal request submitted successfully. It will be processed after admin approval.';

            if (stakingReleaseOption === 'partial' && userData.total_investment > 0) {
                successMsg = 'Withdrawal request submitted with 50% staking release. It will be processed after admin approval.';
            } else if (stakingReleaseOption === 'full' && userData.total_investment > 0) {
                successMsg = 'Withdrawal request submitted with full staking release. It will be processed after admin approval.';
            }

            responseData.msg = successMsg;
            responseData.data = {
                withdrawal_id: withdrawal._id,
                amount: amount,
                fee: fee,
                net_amount: netAmount,
                status: 'Pending',
                stakingReleaseOption: stakingReleaseOption,
                stakingReleaseAmount: stakingReleaseOption === 'partial'
                    ? userData.total_investment * 0.5
                    : (stakingReleaseOption === 'full' ? userData.total_investment : 0),
                stakingReleasePercentage: stakingReleaseOption === 'partial'
                    ? 50
                    : (stakingReleaseOption === 'full' ? 100 : 0)
            };
            return responseHelper.success(res, responseData);
        } catch (error) {
            log.error('Failed to process withdrawal request with error:', error);
            responseData.msg = typeof error === 'string' ? error : 'Failed to process withdrawal request';
            return responseHelper.error(res, responseData);
        }
    },
};