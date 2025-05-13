import { useState, useEffect, useCallback } from 'react';
import { Exchange } from '../types/types';


const AVAILABLE_EXCHANGES: Exchange[] = [
  {
    name: 'Binance',
    id: 'binance1',
    logo: 'https://cryptologos.cc/logos/binance-bnb-logo.png',
    volume: '$12.4B',
    pairs: '740+',
    status: 'active',
    badge: {
      text: 'Popular',
      color: 'rgba(240, 185, 11, 0.2)',
      textColor: '#f0b90b'
    }
  },
  {
    name: 'KuCoin',
    id: 'kucoin1',
    logo: 'https://cryptologos.cc/logos/kucoin-token-kcs-logo.png',
    volume: '$5.8B',
    pairs: '580+',
    status: 'ready'
  },
  {
    name: 'Coinbase',
    id: 'coinbase1',
    logo: 'https://cryptologos.cc/logos/coinbase-coin-coin-logo.png',
    volume: '$8.2B',
    pairs: '420+',
    status: 'ready'
  },
  {
    name: 'Crypto.com',
    id: 'crypto1',
    logo: 'https://cryptologos.cc/logos/crypto-com-coin-cro-logo.png',
    volume: '$3.2B',
    pairs: '350+',
    status: 'ready'
  },
  {
    name: 'OKX',
    id: 'okx1',
    logo: 'https://cryptologos.cc/logos/okb-okb-logo.png',
    volume: '$4.5B',
    pairs: '400+',
    status: 'ready'
  },
  {
    name: 'Gate.io',
    id: 'gate1',
    logo: 'https://cryptologos.cc/logos/gate-token-gt-logo.png',
    volume: '$2.8B',
    pairs: '320+',
    status: 'ready'
  },
];

const DEFAULT_EXCHANGE = AVAILABLE_EXCHANGES[0];

export const useBinancePrice = (
  symbol: string,
  autoRotateExchanges: boolean = false,
  rotationInterval: number = 5000
) => {
  const [price, setPrice] = useState<number | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exchanges, setExchanges] = useState<Exchange[]>(AVAILABLE_EXCHANGES);
  const [currentExchange, setCurrentExchange] = useState<Exchange>(DEFAULT_EXCHANGE);

  const fetchBtcPrice = useCallback(async (controller: AbortController) => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error('Network error fetching BTCUSDT');
      const data = await response.json();
      const btcUsdtPrice = parseFloat(data.price);
      setBtcPrice(btcUsdtPrice);
      console.log(`BTCUSDT price: $${btcUsdtPrice}`);
      return btcUsdtPrice;
    } catch (err) {
      console.error('BTC price fetch error:', err);
      return null;
    }
  }, []);

  const fetchPrice = useCallback(async (controller: AbortController) => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${"BTCUSDT"}`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error('Failed to fetch symbol price');
      const data = await response.json();
      const tokenPrice = parseFloat(data.price);
      setPrice(tokenPrice);
      setLoading(false);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Price fetch error:', err);
        setError('Error fetching price');
        setLoading(false);
      }
    }
  }, [symbol]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBtcPrice(controller);
    return () => controller.abort();
  }, [fetchBtcPrice]);

  useEffect(() => {
    if (btcPrice !== null) {
      setExchanges(prev =>
        prev.map(exchange => {
          const variation = 1 + (Math.random() * 0.002 - 0.001);
          const adjusted = btcPrice * variation;
          return {
            ...exchange,
            price: `$${adjusted.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`
          };
        })
      );
    }
  }, [btcPrice]);

  useEffect(() => {
    if (!autoRotateExchanges || exchanges.length === 0) return;

    const rotationTimer = window.setInterval(() => {
      setCurrentExchange(prev => {
        const currentIndex = exchanges.findIndex(e => e.id === prev.id);
        const nextIndex = (currentIndex + 1) % exchanges.length;
        console.log(`Rotating to: ${exchanges[nextIndex].name}`);
        return exchanges[nextIndex];
      });
    }, rotationInterval);

    return () => clearInterval(rotationTimer);
  }, [autoRotateExchanges, exchanges, rotationInterval]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      if (mounted) await fetchPrice(controller);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchPrice]);

  const selectExchange = useCallback((exchange: Exchange) => {
    setCurrentExchange(exchange);
  }, []);

  return {
    price,
    btcPrice,
    error,
    loading,
    exchanges,
    currentExchange,
    selectExchange
  };
};
