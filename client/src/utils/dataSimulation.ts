import { Trade } from "../types/types";


// Function to fetch real-time price using Binance API
export async function fetchCurrentPrice(symbol: string): Promise<number> {
  console.log(`Fetching price for ${symbol}`);

  try {
    // Try Binance API first as requested
    const binanceSymbol = symbol.toUpperCase();
    const corsProxy = 'https://corsproxy.io/?';
    const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;

    console.log(`Fetching from Binance API for ${binanceSymbol}`);
    const response = await fetch(`${corsProxy}${encodeURIComponent(binanceUrl)}`);

    if (!response.ok) {
      throw new Error(`Binance API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Binance data:", data);

    if (data && data.price) {
      const price = parseFloat(data.price);
      console.log(`Fetched price from Binance for ${binanceSymbol}: $${price}`);
      return price;
    } else {
      throw new Error('Invalid data format received from Binance API');
    }
  } catch (binanceError) {
    console.error('Error fetching from Binance:', binanceError);

    // Map trading pair symbols to CoinGecko format for fallback
    const symbolMap: Record<string, string> = {
      'BTCUSDT': 'bitcoin',
      'ETHUSDT': 'ethereum',
      'BNBUSDT': 'binancecoin',
      'SOLUSDT': 'solana',
      'ADAUSDT': 'cardano',
      'DOGEUSDT': 'dogecoin'
    };

    // Get the corresponding coin ID for CoinGecko
    const coinId = symbolMap[symbol] || 'bitcoin';

    try {
      // Try CoinGecko API as a fallback
      const corsProxy = 'https://corsproxy.io/?';
      const geckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;

      console.log(`Trying CoinGecko API fallback for ${coinId}`);
      const response = await fetch(`${corsProxy}${encodeURIComponent(geckoUrl)}`);

      if (!response.ok) {
        throw new Error(`CoinGecko API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("CoinGecko data:", data);

      if (data && data[coinId] && data[coinId].usd) {
        const price = parseFloat(data[coinId].usd);
        console.log(`Fetched fallback price from CoinGecko for ${coinId}: $${price}`);
        return price;
      } else {
        throw new Error('Invalid data format received from CoinGecko API');
      }
    } catch (geckoError) {
      console.error('Error fetching from CoinGecko:', geckoError);

      // If all APIs fail, use simulated price data
      return generateSimulatedPrice(symbol);
    }
  }
}

// Function to generate realistic simulated prices
function generateSimulatedPrice(symbol: string): number {
  // Base prices for different cryptocurrencies
  const basePrices: Record<string, number> = {
    'BTCUSDT': 65000,
    'ETHUSDT': 3500,
    'BNBUSDT': 600,
    'SOLUSDT': 150,
    'ADAUSDT': 0.45,
    'DOGEUSDT': 0.12
  };

  // Get base price or default to Bitcoin price
  const basePrice = basePrices[symbol] || 65000;

  // Add some randomness to make it look realistic (±2%)
  const randomFactor = 0.98 + (Math.random() * 0.04);
  const simulatedPrice = basePrice * randomFactor;

  console.log(`Using simulated price for ${symbol}: $${simulatedPrice.toFixed(2)}`);
  return simulatedPrice;
}

export const generateRandomTrade = async (currentPrice: number): Promise<Trade> => {
  const volatility = 0.002; // 0.2% volatility
  const randomWalk = (Math.random() - 0.5) * volatility;

  // Array of exchanges with embedded SVG data
  const exchanges = [
    {
      name: 'Binance',
      logo: 'https://cryptologos.cc/logos/binance-bnb-logo.png',
      price: `$${currentPrice.toFixed(2)}`,
      volume: '$12.4B',
      pairs: '740+',
      status: 'active'
    },
    {
      name: 'KuCoin',
      logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png',
      price: `$${(currentPrice * 0.9998).toFixed(2)}`,
      volume: '$5.8B',
      pairs: '580+',
      status: 'ready'
    },
    {
      name: 'Coinbase',
      logo: 'https://cryptologos.cc/logos/coinbase-coin-coin-logo.png',
      price: `$${(currentPrice * 1.0002).toFixed(2)}`,
      volume: '$8.2B',
      pairs: '420+',
      status: 'ready'
    },
    {
      name: 'Crypto.com',
      logo: 'https://cryptologos.cc/logos/crypto-com-coin-cro-logo.png',
      price: `$${(currentPrice * 0.9999).toFixed(2)}`,
      volume: '$3.7B',
      pairs: '250+',
      status: 'ready'
    },
    {
      name: 'OKX',
      logo: 'https://cryptologos.cc/logos/okb-okb-logo.png',
      price: `$${(currentPrice * 1.0001).toFixed(2)}`,
      volume: '$4.9B',
      pairs: '350+',
      status: 'ready'
    },
    {
      name: 'Gate.io',
      logo: 'https://cryptologos.cc/logos/gate-token-gt-logo.png',
      price: `$${(currentPrice * 0.9997).toFixed(2)}`,
      volume: '$2.8B',
      pairs: '280+',
      status: 'ready'
    }
  ];

  const exchangeIndex = Math.floor(Math.random() * exchanges.length);
  // Calculate price with volatility
  const calculatedPrice = currentPrice * (1 + randomWalk);

  return {
    p: calculatedPrice.toFixed(2),
    q: (Math.random() * 2).toFixed(5),
    T: Date.now(),
    m: Math.random() > 0.5,
    e: exchanges[exchangeIndex]
  };
};

export const simulatePriceChange = (currentPrice: number): number => {
  const volatility = 0.002; // 0.2% volatility
  const randomWalk = (Math.random() - 0.5) * volatility;
  return currentPrice * (1 + randomWalk);
};

// Define type for order book entries
export interface OrderBookEntry {
  price: number;
  amount: string;
  total: string;
  depth: number;
}

export const generateOrderBook = (currentPrice: number): { asks: OrderBookEntry[], bids: OrderBookEntry[] } => {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];

  // Generate asks (sell orders)
  for (let i = 0; i < 15; i++) {
    const spreadFactor = 1 + (i * 0.0001);
    const price = currentPrice * spreadFactor;
    const amount = (Math.random() * 2 * Math.max(0.1, 1 - (i * 0.05))).toFixed(4);
    const total = (price * parseFloat(amount)).toFixed(4);
    const depth = Math.max(5, 100 - (i * 6));

    asks.push({ price, amount, total, depth });
  }

  // Generate bids (buy orders)
  for (let i = 0; i < 15; i++) {
    const spreadFactor = 1 - (i * 0.0001);
    const price = currentPrice * spreadFactor;
    const amount = (Math.random() * 2 * Math.max(0.1, 1 - (i * 0.05))).toFixed(4);
    const total = (price * parseFloat(amount)).toFixed(4);
    const depth = Math.max(5, 100 - (i * 6));

    bids.push({ price, amount, total, depth });
  }

  return { asks, bids };
};