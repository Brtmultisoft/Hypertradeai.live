const { ethers } = require('ethers');
const logger = require('./logger');
const log = new logger('ContractDepositService').getChildLogger();

// Contract ABI (Application Binary Interface)
const DEPOSIT_CONTRACT_ABI = [
    "event DepositMade(address indexed user, uint256 amount, uint256 fee, uint256 netAmount, uint256 timestamp, string userId)",
    "function deposit(uint256 amount, string calldata userId) external",
    "function getContractBalance() external view returns (uint256)",
    "function getUserDepositInfo(address user) external view returns (uint256 totalDeposits, uint256 depositCount)",
    "function minimumDeposit() external view returns (uint256)",
    "function feePercentage() external view returns (uint256)"
];

// USDT Contract ABI (for approvals and transfers)
const USDT_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function decimals() external view returns (uint8)"
];

class ContractDepositService {
    constructor() {
        // BSC Mainnet configuration
        this.rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
        this.contractAddress = process.env.DEPOSIT_CONTRACT_ADDRESS;
        this.usdtAddress = process.env.USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955'; // BSC USDT
        this.privateKey = process.env.ADMIN_PRIVATE_KEY;
        
        // Initialize provider and contracts
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        
        this.depositContract = new ethers.Contract(
            this.contractAddress,
            DEPOSIT_CONTRACT_ABI,
            this.provider
        );
        
        this.usdtContract = new ethers.Contract(
            this.usdtAddress,
            USDT_ABI,
            this.provider
        );
        
        // Start event listener
        this.startEventListener();
    }
    
    /**
     * Start listening for deposit events
     */
    startEventListener() {
        log.info('Starting deposit event listener...');
        
        this.depositContract.on('DepositMade', async (user, amount, fee, netAmount, timestamp, userId, event) => {
            try {
                log.info('Deposit event detected:', {
                    user,
                    amount: amount.toString(),
                    fee: fee.toString(),
                    netAmount: netAmount.toString(),
                    timestamp: timestamp.toString(),
                    userId,
                    txHash: event.transactionHash,
                    blockNumber: event.blockNumber
                });
                
                await this.processDepositEvent({
                    user,
                    amount,
                    fee,
                    netAmount,
                    timestamp,
                    userId,
                    txHash: event.transactionHash,
                    blockNumber: event.blockNumber
                });
                
            } catch (error) {
                log.error('Error processing deposit event:', error);
            }
        });
        
        log.info('Deposit event listener started successfully');
    }
    
    /**
     * Process deposit event and update database
     */
    async processDepositEvent(eventData) {
        try {
            const { depositDbHandler, userDbHandler } = require('../services/db');
            
            // Convert amounts from wei to USDT (6 decimals)
            const amountUSDT = parseFloat(ethers.formatUnits(eventData.amount, 6));
            const feeUSDT = parseFloat(ethers.formatUnits(eventData.fee, 6));
            const netAmountUSDT = parseFloat(ethers.formatUnits(eventData.netAmount, 6));
            
            // Find user by ID
            const user = await userDbHandler.getById(eventData.userId);
            if (!user) {
                log.error('User not found for deposit:', eventData.userId);
                return;
            }
            
            // Check if deposit already exists
            const existingDeposit = await depositDbHandler.getOneByQuery({
                txid: eventData.txHash.toLowerCase()
            });
            
            if (existingDeposit) {
                log.info('Deposit already processed:', eventData.txHash);
                return;
            }
            
            // Create deposit record
            const depositData = {
                user_id: user._id,
                amount: amountUSDT,
                fee: feeUSDT,
                net_amount: netAmountUSDT,
                amount_coin: netAmountUSDT,
                rate: 1,
                txid: eventData.txHash.toLowerCase(),
                address: eventData.user.toLowerCase(),
                currency: 'USDT',
                currency_coin: 'USDT',
                status: 2, // Automatically approved for contract deposits
                data: {
                    blockNumber: eventData.blockNumber,
                    timestamp: eventData.timestamp.toString(),
                    contractAddress: this.contractAddress,
                    method: 'contract_deposit'
                }
            };
            
            // Save deposit
            const deposit = await depositDbHandler.create(depositData);
            log.info('Deposit record created:', deposit._id);
            
            // Update user wallet balance
            const currentBalance = user.wallet_topup || 0;
            const newBalance = currentBalance + netAmountUSDT;
            
            await userDbHandler.updateById(user._id, {
                wallet_topup: newBalance
            });
            
            log.info('User balance updated:', {
                userId: user._id,
                oldBalance: currentBalance,
                newBalance: newBalance,
                depositAmount: netAmountUSDT
            });
            
        } catch (error) {
            log.error('Error processing deposit event:', error);
            throw error;
        }
    }
    
    /**
     * Get contract information
     */
    async getContractInfo() {
        try {
            const [balance, minimumDeposit, feePercentage] = await Promise.all([
                this.depositContract.getContractBalance(),
                this.depositContract.minimumDeposit(),
                this.depositContract.feePercentage()
            ]);
            
            return {
                contractAddress: this.contractAddress,
                balance: ethers.formatUnits(balance, 6),
                minimumDeposit: ethers.formatUnits(minimumDeposit, 6),
                feePercentage: feePercentage.toString(),
                usdtAddress: this.usdtAddress
            };
        } catch (error) {
            log.error('Error getting contract info:', error);
            throw error;
        }
    }
    
    /**
     * Get user deposit information from contract
     */
    async getUserDepositInfo(userAddress) {
        try {
            const [totalDeposits, depositCount] = await this.depositContract.getUserDepositInfo(userAddress);
            
            return {
                totalDeposits: ethers.formatUnits(totalDeposits, 6),
                depositCount: depositCount.toString()
            };
        } catch (error) {
            log.error('Error getting user deposit info:', error);
            throw error;
        }
    }
    
    /**
     * Check if user has sufficient USDT balance and allowance
     */
    async checkUserBalance(userAddress, amount) {
        try {
            const amountWei = ethers.parseUnits(amount.toString(), 6);
            
            const [balance, allowance] = await Promise.all([
                this.usdtContract.balanceOf(userAddress),
                this.usdtContract.allowance(userAddress, this.contractAddress)
            ]);
            
            return {
                balance: ethers.formatUnits(balance, 6),
                allowance: ethers.formatUnits(allowance, 6),
                hasBalance: balance >= amountWei,
                hasAllowance: allowance >= amountWei
            };
        } catch (error) {
            log.error('Error checking user balance:', error);
            throw error;
        }
    }
    
    /**
     * Get past deposit events for a user
     */
    async getUserDepositHistory(userAddress, fromBlock = 0) {
        try {
            const filter = this.depositContract.filters.DepositMade(userAddress);
            const events = await this.depositContract.queryFilter(filter, fromBlock);
            
            return events.map(event => ({
                user: event.args.user,
                amount: ethers.formatUnits(event.args.amount, 6),
                fee: ethers.formatUnits(event.args.fee, 6),
                netAmount: ethers.formatUnits(event.args.netAmount, 6),
                timestamp: event.args.timestamp.toString(),
                userId: event.args.userId,
                txHash: event.transactionHash,
                blockNumber: event.blockNumber
            }));
        } catch (error) {
            log.error('Error getting user deposit history:', error);
            throw error;
        }
    }
}

module.exports = ContractDepositService;
