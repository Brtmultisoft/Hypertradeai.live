import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface Instrument {
  id: string;
  name: string;
}

interface MarketData {
  instrument: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  hourlyChange: number;
  hourlyVolume: number;
  weeklyChange: number;
  monthlyChange: number;
  yearlyChange: number;
}

// Define the trade data interface
interface TradeData {
  id: string;
  exchange: string;
  type: 'buy' | 'sell';
  orderId: string;
  price: string;
  amount: string;
  total: string;
  timestamp: string;
}

// Define user data interface
interface UserData {
  _id?: string;
  total_investment: number;
  dailyProfitActivated: boolean;
  lastDailyProfitActivation?: Date;
  extra?: any;
  [key: string]: any;
}

// Define the context type
interface TradingContextType {
  selectedInstrument: string;
  setSelectedInstrument: (instrument: string) => void;
  instruments: Instrument[];
  marketData: MarketData | null;
  loading: boolean;
  error: string | null;
  btcPrice: number;
  tradeData: TradeData[];
  loadingTrades: boolean;
  autoRotate: boolean;
  setAutoRotate: (autoRotate: boolean) => void;
  userData: UserData | null;
  activatingProfit: boolean;
  handleActivateDailyProfit: () => Promise<void>;
}

// Create default context values
const defaultContext: TradingContextType = {
  selectedInstrument: 'BTC-USD',
  setSelectedInstrument: () => {},
  instruments: [
    { id: 'BTC-USD', name: 'Bitcoin' },
    { id: 'ETH-USD', name: 'Ethereum' },
    { id: 'SOL-USD', name: 'Solana' },
    { id: 'XRP-USD', name: 'Ripple' },
    { id: 'ADA-USD', name: 'Cardano' },
    { id: 'DOGE-USD', name: 'Dogecoin' },
    { id: 'DOT-USD', name: 'Polkadot' },
    { id: 'LINK-USD', name: 'Chainlink' }
  ],
  marketData: null,
  loading: false,
  error: null,
  btcPrice: 84500,
  tradeData: [],
  loadingTrades: false,
  autoRotate: true,
  setAutoRotate: () => {},
  userData: {
    _id: 'mock-user-id',
    total_investment: 5000,
    dailyProfitActivated: false, // Set to false by default, user needs to activate
    lastLogin: new Date().toISOString()
  },
  activatingProfit: false,
  handleActivateDailyProfit: async () => {}
};

// Create the context
const TradingContext = createContext<TradingContextType>(defaultContext);

// Create a hook to use the context
export const useTradingContext = () => useContext(TradingContext);

// Define the provider props
interface TradingContextProviderProps {
  children: ReactNode;
}

// Create the provider component
export const TradingContextProvider: React.FC<TradingContextProviderProps> = ({ children }) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>(defaultContext.selectedInstrument);
  const [instruments] = useState<Instrument[]>(defaultContext.instruments);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [btcPrice, setBtcPrice] = useState(84500);
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [autoRotateTimer, setAutoRotateTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [userData, setUserData] = useState<UserData | null>({
    _id: 'mock-user-id',
    total_investment: 5000,
    dailyProfitActivated: false, // Set to false by default, user needs to activate
    lastLogin: new Date().toISOString()
  });
  const [activatingProfit, setActivatingProfit] = useState<boolean>(false);

  // Generate random trade data
  const generateRandomTradeData = () => {
    setLoadingTrades(true);

    try {
      const exchanges = ['Binance', 'xtpub', 'bullish', 'Coinbase', 'Kraken'];
      const types: Array<'buy' | 'sell'> = ['buy', 'sell'];
      const basePrice = btcPrice;
      const currentInstrument = selectedInstrument.split('-')[0]; // Extract the currency part (BTC, ETH, etc.)

      const randomData: TradeData[] = [];

      for (let i = 0; i < 15; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const priceValue = (Math.random() * 0.01 + 0.001).toFixed(6);
        const amountValue = (basePrice + (Math.random() * 100 - 50)).toFixed(2);
        const totalValue = (parseFloat(priceValue) * parseFloat(amountValue)).toFixed(2);

        const date = new Date();
        date.setSeconds(date.getSeconds() - i * 3);

        randomData.push({
          exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
          type,
          orderId: Math.floor(Math.random() * 10000000000).toString(),
          price: priceValue,
          amount: amountValue,
          total: totalValue,
          timestamp: date.toLocaleTimeString(),
          id: `trade-${currentInstrument}-${Date.now()}-${i}`
        });
      }

      // Create market data
      const change24h = Math.random() * 4 - 2; // -2% to +2%
      const timestamp = Date.now();

      setMarketData({
        instrument: selectedInstrument,
        price: btcPrice,
        change24h,
        volume24h: 28500000000,
        high24h: btcPrice * 1.02,
        low24h: btcPrice * 0.98,
        timestamp,
        hourlyChange: Math.random() * 1 - 0.5, // -0.5% to +0.5%
        hourlyVolume: 1200000000,
        weeklyChange: Math.random() * 8 - 4, // -4% to +4%
        monthlyChange: Math.random() * 15 - 7.5, // -7.5% to +7.5%
        yearlyChange: Math.random() * 80 - 20 // -20% to +60%
      });

      setTradeData(randomData);
      setLoading(false);
    } catch (error) {
      setError('Failed to generate trade data');
    } finally {
      setLoadingTrades(false);
    }

    // Schedule next update in 1-2 seconds (faster updates)
    setTimeout(() => {
      setRefreshData(prev => !prev);
    }, 1000 + Math.random() * 1000);
  };



  // Get base price for an instrument
  const getBasePrice = (instrument: string): number => {
    switch (instrument) {
      case 'ETH-USD': return 3200;
      case 'SOL-USD': return 145;
      case 'XRP-USD': return 0.55;
      case 'ADA-USD': return 0.45;
      case 'DOGE-USD': return 0.12;
      case 'DOT-USD': return 6.5;
      case 'LINK-USD': return 15.8;
      default: return 84500; // BTC-USD
    }
  };

  const updateMetrics = () => {
    // Generate price based on selected instrument
    const basePrice = getBasePrice(selectedInstrument);

    // Add some randomness to the price
    const volatilityFactor = 0.002; // 0.2% volatility
    const randomChange = basePrice * volatilityFactor * (Math.random() * 2 - 1);
    const newPrice = basePrice + randomChange;

    setBtcPrice(prevPrice => {
      const diff = newPrice - prevPrice;
      return prevPrice + (diff * 0.5); // Smoother transition
    });

    // Schedule next metrics update in 1-2 seconds (faster updates)
    const nextUpdateTime = 1000 + Math.random() * 1000;
    setTimeout(() => {
      updateMetrics();
    }, nextUpdateTime);
  };

  // Function to rotate to the next instrument
  const rotateToNextInstrument = () => {
    const currentIndex = instruments.findIndex(i => i.id === selectedInstrument);
    const nextIndex = (currentIndex + 1) % instruments.length;
    const nextInstrument = instruments[nextIndex];
    setSelectedInstrument(nextInstrument.id);
  };

  // Setup auto-rotation
  useEffect(() => {
    // Clear any existing timer
    if (autoRotateTimer) {
      clearTimeout(autoRotateTimer);
      setAutoRotateTimer(null);
    }

    // If auto-rotate is enabled, set up a new timer
    if (autoRotate) {
      // Random delay between 2-3 seconds
      const rotationDelay = 2000 + Math.random() * 1000;

      const timer = setTimeout(() => {
        rotateToNextInstrument();
      }, rotationDelay);

      setAutoRotateTimer(timer);
    }

    // Cleanup function
    return () => {
      if (autoRotateTimer) {
        clearTimeout(autoRotateTimer);
      }
    };
  }, [selectedInstrument, autoRotate]);

  // Clean up all timers when component unmounts
  useEffect(() => {
    return () => {
      if (autoRotateTimer) {
        clearTimeout(autoRotateTimer);
      }
    };
  }, []);

  // Initialize metrics and data
  useEffect(() => {
    updateMetrics();
    generateRandomTradeData();
  }, []);

  // Update data when refreshData changes
  useEffect(() => {
    generateRandomTradeData();
  }, [refreshData]);

  // Update metrics when selectedInstrument changes
  useEffect(() => {
    // Reset the price based on the new instrument
    const initialPrice = getBasePrice(selectedInstrument);

    // Set the initial price with a small random variation
    setBtcPrice(initialPrice + (initialPrice * 0.001 * (Math.random() * 2 - 1)));

    // Generate new trade data for the selected instrument
    generateRandomTradeData();

    // Set loading state to true briefly to show loading indicators
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, [selectedInstrument]);

  // Handle daily profit activation
  const handleActivateDailyProfit = async () => {
    try {
      setActivatingProfit(true);

      // Simulate API call to activate daily profit
      // In a real app, this would be an actual API call like:
      // const response = await axios.post('/api/activate-daily-profit', { userId: userData?._id });
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update user data
      setUserData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          dailyProfitActivated: true,
          lastDailyProfitActivation: new Date()
        };
      });
    } catch (error) {
      setError('Failed to activate daily profit');
    } finally {
      setActivatingProfit(false);
    }
  };

  // Create the context value object
  const contextValue: TradingContextType = {
    selectedInstrument,
    setSelectedInstrument,
    instruments,
    marketData,
    loading,
    error,
    btcPrice,
    tradeData,
    loadingTrades,
    autoRotate,
    setAutoRotate,
    userData,
    activatingProfit,
    handleActivateDailyProfit
  };

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
};

export default TradingContext;
