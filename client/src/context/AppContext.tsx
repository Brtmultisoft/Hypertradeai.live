import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

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

interface AppContextType {
  selectedInstrument: string;
  setSelectedInstrument: (instrument: string) => void;
  instruments: Instrument[];
  marketData: MarketData | null;
  loading: boolean;
  error: string | null;
}

const defaultContext: AppContextType = {
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
};

const TradingContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(TradingContext);

interface AppContextProviderProps {
  children: ReactNode;
}

export const TradingContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>(defaultContext.selectedInstrument);
  const [instruments] = useState<Instrument[]>(defaultContext.instruments);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    try {
      const instrumentsList = instruments.map(i => i.id).join(',');
      const response = await axios.get(
        `https://data-api.coindesk.com/index/cc/v1/latest/tick?market=ccix&instruments=${instrumentsList}&api_key=41cc3cf61b5b042ade7dc4986c66443168db20a01af2b0e8729a506703dcbee4`
      );
      
      if (response.data?.Data?.[selectedInstrument]) {
        const data = response.data.Data[selectedInstrument];
        
        setMarketData({
          instrument: selectedInstrument,
          price: data.VALUE,
          change24h: data.MOVING_24_HOUR_CHANGE_PERCENTAGE,
          volume24h: data.MOVING_24_HOUR_QUOTE_VOLUME,
          high24h: data.MOVING_24_HOUR_HIGH,
          low24h: data.MOVING_24_HOUR_LOW,
          timestamp: data.VALUE_LAST_UPDATE_TS * 1000,
          hourlyChange: data.CURRENT_HOUR_CHANGE_PERCENTAGE,
          hourlyVolume: data.CURRENT_HOUR_QUOTE_VOLUME,
          weeklyChange: data.MOVING_7_DAY_CHANGE_PERCENTAGE,
          monthlyChange: data.MOVING_30_DAY_CHANGE_PERCENTAGE,
          yearlyChange: data.MOVING_365_DAY_CHANGE_PERCENTAGE
        });
      } else {
        console.warn('Selected instrument data not found');
        setMarketData(null);
        setError('No market data available for this instrument at the moment. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setMarketData(null);
      setError('Failed to fetch market data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    
    const intervalId = setInterval(() => {
      fetchMarketData();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [selectedInstrument]);

  const value = {
    selectedInstrument,
    setSelectedInstrument,
    instruments,
    marketData,
    loading,
    error,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};