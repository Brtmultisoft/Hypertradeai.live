const logger = require('../../services/logger');
const log = new logger('ContractDepositController').getChildLogger();
const responseHelper = require('../../utils/customResponse');
const ContractDepositService = require('../../services/contract.deposit.service');

// Initialize contract service
let contractService;
try {
    contractService = new ContractDepositService();
} catch (error) {
    log.error('Failed to initialize ContractDepositService:', error);
}

module.exports = {
    
    /**
     * Get contract information
     */
    getContractInfo: async (req, res) => {
        let responseData = {};
        try {
            if (!contractService) {
                responseData.msg = 'Contract service not available';
                return responseHelper.error(res, responseData);
            }
            
            const contractInfo = await contractService.getContractInfo();
            
            responseData.msg = 'Contract information fetched successfully';
            responseData.data = contractInfo;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting contract info:', error);
            responseData.msg = 'Failed to get contract information';
            return responseHelper.error(res, responseData);
        }
    },
    
    /**
     * Check user balance and allowance
     */
    checkUserBalance: async (req, res) => {
        let responseData = {};
        try {
            const { userAddress, amount } = req.body;
            
            if (!userAddress || !amount) {
                responseData.msg = 'User address and amount are required';
                return responseHelper.error(res, responseData);
            }
            
            if (!contractService) {
                responseData.msg = 'Contract service not available';
                return responseHelper.error(res, responseData);
            }
            
            const balanceInfo = await contractService.checkUserBalance(userAddress, amount);
            
            responseData.msg = 'Balance information fetched successfully';
            responseData.data = balanceInfo;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error checking user balance:', error);
            responseData.msg = 'Failed to check user balance';
            return responseHelper.error(res, responseData);
        }
    },
    
    /**
     * Get user deposit information from contract
     */
    getUserContractDeposits: async (req, res) => {
        let responseData = {};
        try {
            const { userAddress } = req.params;
            const user = req.user;
            
            if (!userAddress) {
                responseData.msg = 'User address is required';
                return responseHelper.error(res, responseData);
            }
            
            if (!contractService) {
                responseData.msg = 'Contract service not available';
                return responseHelper.error(res, responseData);
            }
            
            const depositInfo = await contractService.getUserDepositInfo(userAddress);
            
            responseData.msg = 'User deposit information fetched successfully';
            responseData.data = {
                userAddress,
                userId: user.sub,
                ...depositInfo
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting user contract deposits:', error);
            responseData.msg = 'Failed to get user deposit information';
            return responseHelper.error(res, responseData);
        }
    },
    
    /**
     * Get user deposit history from contract events
     */
    getUserDepositHistory: async (req, res) => {
        let responseData = {};
        try {
            const { userAddress } = req.params;
            const { fromBlock } = req.query;
            
            if (!userAddress) {
                responseData.msg = 'User address is required';
                return responseHelper.error(res, responseData);
            }
            
            if (!contractService) {
                responseData.msg = 'Contract service not available';
                return responseHelper.error(res, responseData);
            }
            
            const history = await contractService.getUserDepositHistory(
                userAddress, 
                fromBlock ? parseInt(fromBlock) : 0
            );
            
            responseData.msg = 'Deposit history fetched successfully';
            responseData.data = {
                userAddress,
                deposits: history,
                count: history.length
            };
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error getting user deposit history:', error);
            responseData.msg = 'Failed to get deposit history';
            return responseHelper.error(res, responseData);
        }
    },
    
    /**
     * Generate deposit instructions for user
     */
    getDepositInstructions: async (req, res) => {
        let responseData = {};
        try {
            const user = req.user;
            const userId = user.sub;
            
            if (!contractService) {
                responseData.msg = 'Contract service not available';
                return responseHelper.error(res, responseData);
            }
            
            const contractInfo = await contractService.getContractInfo();
            
            // Generate deposit instructions
            const instructions = {
                contractAddress: contractInfo.contractAddress,
                usdtAddress: contractInfo.usdtAddress,
                minimumDeposit: contractInfo.minimumDeposit,
                feePercentage: contractInfo.feePercentage,
                userId: userId,
                steps: [
                    {
                        step: 1,
                        title: "Approve USDT",
                        description: "First, approve the contract to spend your USDT tokens",
                        action: "approve",
                        contract: contractInfo.usdtAddress,
                        method: "approve",
                        params: [contractInfo.contractAddress, "amount"]
                    },
                    {
                        step: 2,
                        title: "Make Deposit",
                        description: "Call the deposit function with your amount and user ID",
                        action: "deposit",
                        contract: contractInfo.contractAddress,
                        method: "deposit",
                        params: ["amount", userId]
                    }
                ],
                notes: [
                    `Minimum deposit: ${contractInfo.minimumDeposit} USDT`,
                    `Fee: ${contractInfo.feePercentage / 100}%`,
                    "Make sure you have enough BNB for gas fees",
                    "Your deposit will be automatically credited to your account"
                ]
            };
            
            responseData.msg = 'Deposit instructions generated successfully';
            responseData.data = instructions;
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error generating deposit instructions:', error);
            responseData.msg = 'Failed to generate deposit instructions';
            return responseHelper.error(res, responseData);
        }
    },
    
    /**
     * Verify a deposit transaction
     */
    verifyDeposit: async (req, res) => {
        let responseData = {};
        try {
            const { txHash } = req.body;
            const user = req.user;
            
            if (!txHash) {
                responseData.msg = 'Transaction hash is required';
                return responseHelper.error(res, responseData);
            }
            
            // Check if deposit exists in database
            const { depositDbHandler } = require('../../services/db');
            const deposit = await depositDbHandler.getOneByQuery({
                txid: txHash.toLowerCase()
            });
            
            if (deposit) {
                responseData.msg = 'Deposit found and verified';
                responseData.data = {
                    found: true,
                    deposit: {
                        id: deposit._id,
                        amount: deposit.amount,
                        netAmount: deposit.net_amount,
                        status: deposit.status,
                        createdAt: deposit.created_at
                    }
                };
            } else {
                responseData.msg = 'Deposit not found';
                responseData.data = {
                    found: false,
                    message: 'Transaction may still be processing or invalid'
                };
            }
            
            return responseHelper.success(res, responseData);
            
        } catch (error) {
            log.error('Error verifying deposit:', error);
            responseData.msg = 'Failed to verify deposit';
            return responseHelper.error(res, responseData);
        }
    }
};
