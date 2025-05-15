import { useState, useEffect, useCallback, useRef } from 'react';
import { Exchange } from '../types/types';

// Global cache for price data to share across hook instances
interface PriceCache {
  price: number | null;
  timestamp: number;
  symbol: string;
}

// Extend Window interface to include our global cache
declare global {
  interface Window {
    binancePriceCache: Record<string, PriceCache>;
  }
}

// Create a global cache object to share price data across components
if (!window.binancePriceCache) {
  window.binancePriceCache = {};
}

// Configuration
const CACHE_DURATION = 2000; // Cache duration in ms (2 seconds)
const API_POLL_INTERVAL = 2000; // API polling interval in ms (2 seconds)
const MAX_RETRY_ATTEMPTS = 3; // Maximum number of retry attempts
const RETRY_DELAY = 1000; // Delay between retries in ms
const USE_WEBSOCKET = true; // Whether to use WebSocket for real-time updates
const WEBSOCKET_RECONNECT_DELAY = 3000; // Delay before reconnecting WebSocket in ms

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
];

const DEFAULT_EXCHANGE = AVAILABLE_EXCHANGES[0];

/**
 * Custom hook for fetching and managing cryptocurrency price data from Binance API
 * with optimized API calls, caching, and error handling
 *
 * @param _symbol - Symbol parameter (kept for backward compatibility but not used)
 * @param autoRotateExchanges - Whether to automatically rotate between exchanges
 * @param rotationInterval - Interval in ms for exchange rotation
 */
export const useBinancePrice = (
  _symbol: string = 'BTCUSDT', // Prefixed with underscore to indicate it's not used
  autoRotateExchanges: boolean = false,
  rotationInterval: number = 5000
) => {
  const [price, setPrice] = useState<number | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exchanges, setExchanges] = useState<Exchange[]>(AVAILABLE_EXCHANGES);
  const [currentExchange, setCurrentExchange] = useState<Exchange>(DEFAULT_EXCHANGE);

  // Use refs to track active API calls, retry attempts, and WebSocket connection
  const activeCallRef = useRef<boolean>(false);
  const retryAttemptsRef = useRef<number>(0);
  const pollTimerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimerRef = useRef<number | null>(null);

  /**
   * Fetch price data from Binance API with caching and retry logic
   */
  const fetchPrice = useCallback(async (targetSymbol: string = 'BTCUSDT'): Promise<number | null> => {
    // Normalize symbol to uppercase
    const normalizedSymbol = targetSymbol.toUpperCase();

    // Check if we already have a recent cached price
    const cache = window.binancePriceCache[normalizedSymbol];
    const now = Date.now();

    if (cache && (now - cache.timestamp < CACHE_DURATION)) {
      return cache.price;
    }

    // Prevent concurrent API calls for the same symbol
    if (activeCallRef.current) {
      return null;
    }

    activeCallRef.current = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const priceValue = parseFloat(data.price);

      // Update the cache
      window.binancePriceCache[normalizedSymbol] = {
        price: priceValue,
        timestamp: now,
        symbol: normalizedSymbol
      };

      // Reset retry counter on success
      retryAttemptsRef.current = 0;

      return priceValue;
    } catch (err) {
      // Handle errors with retry logic
      if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
        retryAttemptsRef.current++;

        // Exponential backoff for retries
        const backoffDelay = RETRY_DELAY * Math.pow(2, retryAttemptsRef.current - 1);

        // Schedule retry
        setTimeout(() => {
          activeCallRef.current = false;
          fetchPrice(normalizedSymbol);
        }, backoffDelay);
      } else {
        // Max retries reached, set error state
        setError(`Failed to fetch price after ${MAX_RETRY_ATTEMPTS} attempts`);
        retryAttemptsRef.current = 0;
      }

      return null;
    } finally {
      activeCallRef.current = false;
    }
  }, []);

  /**
   * Update exchange prices based on BTC price
   */
  const updateExchangePrices = useCallback((baseBtcPrice: number) => {
    setExchanges(prev =>
      prev.map(exchange => {
        // Create slight variations for different exchanges
        const variation = 1 + (Math.random() * 0.002 - 0.001);
        const adjusted = baseBtcPrice * variation;
        return {
          ...exchange,
          price: `$${adjusted.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`
        };
      })
    );
  }, []);

  /**
   * Setup WebSocket connection for real-time price updates
   */
  const setupWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Clear any pending reconnect timer
    if (wsReconnectTimerRef.current !== null) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }

    try {
      // Connect to Binance WebSocket API for BTCUSDT ticker
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

      ws.onopen = () => {
        // Connection established
        retryAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data && data.c) {
            const priceValue = parseFloat(data.c); // Current price

            // Update the cache
            window.binancePriceCache['BTCUSDT'] = {
              price: priceValue,
              timestamp: Date.now(),
              symbol: 'BTCUSDT'
            };

            // Update state
            setBtcPrice(priceValue);
            setPrice(priceValue);
            updateExchangePrices(priceValue);
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Fall back to REST API on WebSocket error
        setError('WebSocket connection error, falling back to REST API');
      };

      ws.onclose = () => {
        // Schedule reconnection
        wsReconnectTimerRef.current = window.setTimeout(() => {
          if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
            retryAttemptsRef.current++;
            setupWebSocket();
          } else {
            setError('WebSocket connection failed, using REST API fallback');
            // Fall back to REST API polling
            setupRESTPolling();
          }
        }, WEBSOCKET_RECONNECT_DELAY);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error setting up WebSocket:', err);
      // Fall back to REST API polling
      setupRESTPolling();
    }
  }, [updateExchangePrices]);

  /**
   * Setup REST API polling as fallback
   */
  const setupRESTPolling = useCallback(() => {
    // Clear any existing polling interval
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
    }

    const fetchAndUpdatePrices = async () => {
      // Always fetch BTCUSDT as the base price
      const btcPriceValue = await fetchPrice('BTCUSDT');

      if (btcPriceValue !== null) {
        setBtcPrice(btcPriceValue);
        setPrice(btcPriceValue); // Also set as the main price
        updateExchangePrices(btcPriceValue);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchAndUpdatePrices();

    // Set up polling with a ref to allow cleanup
    pollTimerRef.current = window.setInterval(fetchAndUpdatePrices, API_POLL_INTERVAL);
  }, [fetchPrice, updateExchangePrices]);

  /**
   * Main effect for setting up data fetching strategy (WebSocket or REST)
   */
  useEffect(() => {
    let mounted = true;

    if (USE_WEBSOCKET) {
      setupWebSocket();
    } else {
      setupRESTPolling();
    }

    // Initial fetch to ensure we have data while WebSocket connects
    fetchPrice('BTCUSDT').then(price => {
      if (mounted && price !== null) {
        setBtcPrice(price);
        setPrice(price);
        updateExchangePrices(price);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;

      // Clean up WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clean up reconnect timer
      if (wsReconnectTimerRef.current !== null) {
        clearTimeout(wsReconnectTimerRef.current);
        wsReconnectTimerRef.current = null;
      }

      // Clean up polling interval
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchPrice, setupWebSocket, setupRESTPolling, updateExchangePrices]);

  /**
   * Effect for exchange rotation
   */
  useEffect(() => {
    if (!autoRotateExchanges || exchanges.length === 0) return;

    const rotationTimer = window.setInterval(() => {
      setCurrentExchange(prev => {
        const currentIndex = exchanges.findIndex(e => e.id === prev.id);
        const nextIndex = (currentIndex + 1) % exchanges.length;
        return exchanges[nextIndex];
      });
    }, rotationInterval);

    return () => clearInterval(rotationTimer);
  }, [autoRotateExchanges, exchanges, rotationInterval]);

  /**
   * Callback to manually select an exchange
   */
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
