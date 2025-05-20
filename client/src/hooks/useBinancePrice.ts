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
const CACHE_DURATION = 5000; // Cache duration in ms (5 seconds) - increased for stability
const API_POLL_INTERVAL = 3000; // API polling interval in ms (3 seconds) - slightly increased to reduce API load
const MAX_RETRY_ATTEMPTS = 5; // Maximum number of retry attempts - increased for better resilience
const RETRY_DELAY = 1000; // Base delay between retries in ms
const USE_WEBSOCKET = true; // Whether to use WebSocket for real-time updates
const WEBSOCKET_RECONNECT_DELAY = 2000; // Base delay before reconnecting WebSocket in ms - reduced for faster recovery
const WEBSOCKET_CONNECTION_TIMEOUT = 5000; // Timeout for WebSocket connection in ms
const FETCH_TIMEOUT = 5000; // Timeout for fetch requests in ms

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
   * Enhanced with multiple API endpoints and better error handling
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
      // Define multiple Binance API endpoints to try
      const endpoints = [
        `https://api.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`,
        `https://api1.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`,
        `https://api2.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`,
        `https://api3.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`
      ];

      // Try each endpoint until one succeeds
      let priceValue = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          console.log(`Fetching price from ${endpoint}`);
          const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          priceValue = parseFloat(data.price);

          // If we got a valid price, break the loop
          if (!isNaN(priceValue) && priceValue > 0) {
            console.log(`Successfully fetched price from ${endpoint}: ${priceValue}`);
            break;
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${endpoint}:`, err);
          lastError = err;
          // Continue to the next endpoint
        }
      }

      // If we got a valid price from any endpoint
      if (priceValue !== null && !isNaN(priceValue) && priceValue > 0) {
        // Update the cache
        window.binancePriceCache[normalizedSymbol] = {
          price: priceValue,
          timestamp: now,
          symbol: normalizedSymbol
        };

        // Reset retry counter on success
        retryAttemptsRef.current = 0;

        return priceValue;
      }

      // If all endpoints failed, throw the last error
      throw lastError || new Error('All API endpoints failed');
    } catch (err) {
      console.error('Error fetching price:', err);

      // Handle errors with retry logic
      if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
        retryAttemptsRef.current++;

        // Exponential backoff for retries
        const backoffDelay = RETRY_DELAY * Math.pow(2, retryAttemptsRef.current - 1);
        console.log(`Scheduling retry in ${backoffDelay}ms (attempt ${retryAttemptsRef.current}/${MAX_RETRY_ATTEMPTS})`);

        // Schedule retry
        setTimeout(() => {
          activeCallRef.current = false;
          fetchPrice(normalizedSymbol);
        }, backoffDelay);
      } else {
        // Max retries reached, set error state
        console.error(`Failed to fetch price after ${MAX_RETRY_ATTEMPTS} attempts`);
        setError(`Failed to fetch price after ${MAX_RETRY_ATTEMPTS} attempts`);
        retryAttemptsRef.current = 0;
      }

      // Return the last cached price if available, otherwise null
      if (cache) {
        console.log('Returning stale cached price as fallback:', cache.price);
        return cache.price;
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
   * Enhanced with better error handling and reconnection logic
   */
  const setupWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnect timer
    if (wsReconnectTimerRef.current !== null) {
      clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
    }

    try {
      console.log('Attempting to connect to Binance WebSocket...');

      // Try alternative WebSocket endpoints if the main one fails
      // Binance provides multiple WebSocket endpoints
      const endpoints = [
        'wss://stream.binance.com:9443/ws/btcusdt@ticker',
        'wss://stream.binance.com/ws/btcusdt@ticker',
        'wss://fstream.binance.com/ws/btcusdt@ticker'
      ];

      // Use the first endpoint initially, will try others on failure
      const ws = new WebSocket(endpoints[0]);

      // Set a connection timeout
      const connectionTimeoutId = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection timeout, closing and retrying...');
          ws.close();
        }
      }, 5000); // 5 second connection timeout

      ws.onopen = () => {
        // Connection established
        console.log('Binance WebSocket connection established successfully');
        clearTimeout(connectionTimeoutId); // Clear the connection timeout
        retryAttemptsRef.current = 0;
        setError(null); // Clear any previous error messages
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
          // Don't fail completely on a single message error
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeoutId); // Clear the connection timeout

        // Try the next endpoint if available
        const currentEndpointIndex = endpoints.indexOf(ws.url);
        if (currentEndpointIndex < endpoints.length - 1 && retryAttemptsRef.current < 1) {
          console.log(`Trying alternative WebSocket endpoint: ${endpoints[currentEndpointIndex + 1]}`);
          // Close current connection and try the next endpoint
          ws.close();

          // Small delay before trying the next endpoint
          setTimeout(() => {
            try {
              const nextWs = new WebSocket(endpoints[currentEndpointIndex + 1]);
              wsRef.current = nextWs;

              // Set up the same event handlers for the new connection
              nextWs.onopen = ws.onopen;
              nextWs.onmessage = ws.onmessage;
              nextWs.onerror = ws.onerror;
              nextWs.onclose = ws.onclose;
            } catch (err) {
              console.error('Error setting up alternative WebSocket:', err);
              setError('WebSocket connection error, falling back to REST API');
              setupRESTPolling();
            }
          }, 1000);

          return;
        }

        // If we've tried all endpoints or too many retries, fall back to REST API
        setError('WebSocket connection error, falling back to REST API');
        setupRESTPolling();
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}`);
        clearTimeout(connectionTimeoutId); // Clear the connection timeout

        // Schedule reconnection with exponential backoff
        const backoffDelay = WEBSOCKET_RECONNECT_DELAY * Math.pow(2, retryAttemptsRef.current);
        console.log(`Scheduling WebSocket reconnection in ${backoffDelay}ms (attempt ${retryAttemptsRef.current + 1}/${MAX_RETRY_ATTEMPTS})`);

        wsReconnectTimerRef.current = window.setTimeout(() => {
          if (retryAttemptsRef.current < MAX_RETRY_ATTEMPTS) {
            retryAttemptsRef.current++;
            setupWebSocket();
          } else {
            console.log('Maximum WebSocket reconnection attempts reached, switching to REST API polling');
            setError('WebSocket connection failed after multiple attempts, using REST API fallback');
            // Fall back to REST API polling
            setupRESTPolling();
          }
        }, backoffDelay);
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
   * Enhanced with better error handling and retry logic
   */
  const setupRESTPolling = useCallback(() => {
    console.log('Setting up REST API polling as fallback for price data');

    // Clear any existing polling interval
    if (pollTimerRef.current !== null) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    // Reset retry counter for REST API
    retryAttemptsRef.current = 0;

    const fetchAndUpdatePrices = async () => {
      try {
        console.log('Fetching price data via REST API...');

        // Try multiple price sources in case one fails
        let btcPriceValue = null;

        // First try Binance API
        btcPriceValue = await fetchPrice('BTCUSDT');

        // If Binance API fails, try alternative APIs
        if (btcPriceValue === null) {
          console.log('Primary API failed, trying alternative sources...');

          try {
            // Try CoinGecko as a backup
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            if (response.ok) {
              const data = await response.json();
              if (data && data.bitcoin && data.bitcoin.usd) {
                btcPriceValue = data.bitcoin.usd;
                console.log('Successfully fetched price from CoinGecko:', btcPriceValue);
              }
            }
          } catch (backupError) {
            console.error('Error fetching from backup API:', backupError);
          }
        }

        // If we have a valid price, update the UI
        if (btcPriceValue !== null) {
          // Update the cache
          window.binancePriceCache['BTCUSDT'] = {
            price: btcPriceValue,
            timestamp: Date.now(),
            symbol: 'BTCUSDT'
          };

          // Update state
          setBtcPrice(btcPriceValue);
          setPrice(btcPriceValue); // Also set as the main price
          updateExchangePrices(btcPriceValue);
          setLoading(false);
          setError(null); // Clear any previous errors

          // Reset retry counter on success
          retryAttemptsRef.current = 0;
        } else {
          // If all APIs failed, increment retry counter
          retryAttemptsRef.current++;

          if (retryAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
            console.error(`Failed to fetch price data after ${MAX_RETRY_ATTEMPTS} attempts`);
            setError(`Failed to fetch price data after ${MAX_RETRY_ATTEMPTS} attempts. Using last known price.`);

            // Use last known price from cache if available
            const cachedPrice = window.binancePriceCache['BTCUSDT'];
            if (cachedPrice && cachedPrice.price) {
              console.log('Using last cached price:', cachedPrice.price);
              setBtcPrice(cachedPrice.price);
              setPrice(cachedPrice.price);
              updateExchangePrices(cachedPrice.price);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchAndUpdatePrices:', error);
      }
    };

    // Initial fetch
    fetchAndUpdatePrices();

    // Set up polling with a ref to allow cleanup
    // Use a slightly faster interval for REST API to compensate for WebSocket
    pollTimerRef.current = window.setInterval(fetchAndUpdatePrices, API_POLL_INTERVAL);

    return () => {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchPrice, updateExchangePrices]);

  /**
   * Main effect for setting up data fetching strategy (WebSocket or REST)
   * Enhanced with better initialization and cleanup
   */
  useEffect(() => {
    let mounted = true;
    console.log('Initializing price data fetching strategy...');

    // Initial fetch to ensure we have data immediately
    const initialFetch = async () => {
      try {
        console.log('Performing initial price fetch...');
        const price = await fetchPrice('BTCUSDT');

        if (mounted && price !== null) {
          console.log('Initial price fetch successful:', price);
          setBtcPrice(price);
          setPrice(price);
          updateExchangePrices(price);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error during initial price fetch:', error);
        // Continue with setup even if initial fetch fails
      }
    };

    // Start with initial fetch
    initialFetch().then(() => {
      // Then set up the main data source
      if (mounted) {
        if (USE_WEBSOCKET) {
          console.log('Using WebSocket as primary data source');
          setupWebSocket();
        } else {
          console.log('Using REST API polling as primary data source');
          setupRESTPolling();
        }
      }
    });

    // Set up a fallback mechanism in case the primary method fails
    const fallbackTimerId = setTimeout(() => {
      if (mounted && loading) {
        console.log('Primary data source taking too long, setting up fallback...');
        // If we're still loading after 10 seconds, try the alternative method
        if (USE_WEBSOCKET) {
          console.log('WebSocket taking too long, adding REST API polling as backup');
          setupRESTPolling();
        }
      }
    }, 10000); // 10 second fallback timeout

    return () => {
      console.log('Cleaning up price data fetching resources...');
      mounted = false;

      // Clear fallback timer
      clearTimeout(fallbackTimerId);

      // Clean up WebSocket
      if (wsRef.current) {
        console.log('Closing WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clean up reconnect timer
      if (wsReconnectTimerRef.current !== null) {
        console.log('Clearing WebSocket reconnect timer');
        clearTimeout(wsReconnectTimerRef.current);
        wsReconnectTimerRef.current = null;
      }

      // Clean up polling interval
      if (pollTimerRef.current !== null) {
        console.log('Clearing REST API polling interval');
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchPrice, setupWebSocket, setupRESTPolling, updateExchangePrices, loading]);

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
