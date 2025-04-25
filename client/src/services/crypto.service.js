import axios from 'axios';
import api from './api';

// CoinGecko API base URL (for fallback only)
const API_URL = 'https://api.coingecko.com/api/v3';

// List of crypto assets we want to display
const CRYPTO_IDS = [
    'bitcoin',
    'ethereum',
    'binancecoin',
    'matic-network',
    'usd-coin',
    'tether'
];

// Cache for crypto prices
let priceCache = {
    data: null,
    timestamp: 0,
    expiryTime: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Fallback data in case the API is unavailable
const FALLBACK_PRICES = [{
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 65000,
        price_change_percentage_24h: 2.5,
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
    },
    {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 3500,
        price_change_percentage_24h: 1.8,
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
    },
    {
        id: 'binancecoin',
        symbol: 'bnb',
        name: 'BNB',
        current_price: 580,
        price_change_percentage_24h: 0.9,
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
    },
    {
        id: 'matic-network',
        symbol: 'matic',
        name: 'Polygon',
        current_price: 0.85,
        price_change_percentage_24h: -0.5,
        image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png'
    },
    {
        id: 'usd-coin',
        symbol: 'usdc',
        name: 'USD Coin',
        current_price: 1,
        price_change_percentage_24h: 0.01,
        image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
    },
    {
        id: 'tether',
        symbol: 'usdt',
        name: 'Tether',
        current_price: 1,
        price_change_percentage_24h: 0.01,
        image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png'
    }
];

// Service for fetching cryptocurrency data
const CryptoService = {
    // Get current prices for multiple cryptocurrencies
    getPrices: async() => {
        try {
            // Check if cache is valid
            const now = Date.now();
            if (priceCache.data && (now - priceCache.timestamp < priceCache.expiryTime)) {
                console.log('Using cached crypto prices');
                return priceCache.data;
            }

            // Try direct CoinGecko API first (will fail with CORS in browser)
            try {
                const response = await axios.get(`${API_URL}/coins/markets`, {
                    params: {
                        vs_currency: 'usd',
                        ids: CRYPTO_IDS.join(','),
                        order: 'market_cap_desc',
                        per_page: 10,
                        page: 1,
                        sparkline: false,
                        price_change_percentage: '24h'
                    }
                });

                // Update cache
                priceCache.data = response.data;
                priceCache.timestamp = now;

                return response.data;
            } catch (error) {
                console.warn('Direct CoinGecko API failed, using fallback data:', error);

                // If all else fails, return fallback data
                console.log('Using hardcoded fallback data');

                // Update cache with fallback data
                priceCache.data = FALLBACK_PRICES;
                priceCache.timestamp = now;

                return FALLBACK_PRICES;
            }
        } catch (error) {
            console.error('Error fetching crypto prices:', error);

            // If we have cached data, return it even if expired
            if (priceCache.data) {
                console.log('Using expired cache as fallback');
                return priceCache.data;
            }

            // If all else fails, return fallback data
            console.log('Using hardcoded fallback data');
            return FALLBACK_PRICES;
        }
    },

    // Get detailed information for a specific cryptocurrency
    getCoinDetails: async(coinId) => {
        try {
            // Try direct CoinGecko API
            try {
                const response = await axios.get(`${API_URL}/coins/${coinId}`, {
                    params: {
                        localization: false,
                        tickers: false,
                        market_data: true,
                        community_data: false,
                        developer_data: false,
                        sparkline: false
                    }
                });

                return response.data;
            } catch (error) {
                console.warn(`Error fetching details for ${coinId}:`, error);

                // Return a fallback coin from our list
                const fallbackCoin = FALLBACK_PRICES.find(coin => coin.id === coinId);
                if (fallbackCoin) {
                    return {
                        id: fallbackCoin.id,
                        symbol: fallbackCoin.symbol,
                        name: fallbackCoin.name,
                        image: { large: fallbackCoin.image },
                        market_data: {
                            current_price: { usd: fallbackCoin.current_price },
                            price_change_percentage_24h: fallbackCoin.price_change_percentage_24h
                        }
                    };
                }

                throw error;
            }
        } catch (error) {
            console.error(`Error fetching details for ${coinId}:`, error);
            throw error;
        }
    },

    // Clear the cache (useful for manual refresh)
    clearCache: () => {
        priceCache.data = null;
        priceCache.timestamp = 0;
    }
};

// Crypto asset data with reliable image URLs and fallback colors
export const CRYPTO_ASSETS = [{
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        fallbackColor: '#F7931A',
        fallbackText: 'BTC'
    },
    {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        fallbackColor: '#627EEA',
        fallbackText: 'ETH'
    },
    {
        id: 'binancecoin',
        symbol: 'bnb',
        name: 'BNB',
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
        fallbackColor: '#F3BA2F',
        fallbackText: 'BNB'
    },
    {
        id: 'matic-network',
        symbol: 'matic',
        name: 'Polygon',
        image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
        fallbackColor: '#8247E5',
        fallbackText: 'MATIC'
    },
    {
        id: 'usd-coin',
        symbol: 'usdc',
        name: 'USD Coin',
        image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
        fallbackColor: '#2775CA',
        fallbackText: 'USDC'
    },
    {
        id: 'tether',
        symbol: 'usdt',
        name: 'Tether',
        image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
        fallbackColor: '#26A17B',
        fallbackText: 'USDT'
    }
];

export default CryptoService;