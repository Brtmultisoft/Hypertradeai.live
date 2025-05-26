import { useState, useEffect } from 'react';
import { Exchange } from '../types/types';
import { exchanges as staticExchanges } from '../data/exchanges';

export const useExchangeData = (autoRotate: boolean = false, rotationInterval: number = 30000) => {
  const [exchanges, setExchanges] = useState<Exchange[]>(staticExchanges);
  const [currentExchange, setCurrentExchange] = useState<Exchange>(staticExchanges[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch exchange data from CoinGecko API
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchExchangeData = async () => {
      try {
        setLoading(true);
        
        // Use CoinGecko API to get exchange data
        const corsProxy = 'https://corsproxy.io/?';
        const geckoUrl = 'https://api.coingecko.com/api/v3/exchanges?per_page=10';
        
        console.log('Fetching exchange data from CoinGecko API');
        const response = await fetch(`${corsProxy}${encodeURIComponent(geckoUrl)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`CoinGecko API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('CoinGecko exchange data:', data);

        if (mounted && data && Array.isArray(data)) {
          // Map the API data to our Exchange type
          const updatedExchanges = data.slice(0, 6).map((exchange: any, index: number) => {
            // Find the corresponding static exchange to keep logos and other data
            const staticExchange = staticExchanges[index] || staticExchanges[0];
            
            return {
              name: exchange.name,
              logo: staticExchange.logo, // Keep our logo
              volume: `$${(exchange.trade_volume_24h_btc * 65000).toFixed(1)}B`,
              pairs: `${exchange.trust_score_rank < 5 ? '700+' : (exchange.trust_score_rank < 10 ? '500+' : '300+')}`,
              price: staticExchange.price, // Keep our price format
              status: staticExchange.status,
              badge: staticExchange.badge,
              trustScore: exchange.trust_score,
              trustRank: exchange.trust_score_rank
            };
          });
          
          setExchanges(updatedExchanges);
          
          // If the current exchange is not in the new list, set it to the first one
          if (!updatedExchanges.find(e => e.name === currentExchange.name)) {
            setCurrentExchange(updatedExchanges[0]);
          }
          
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching exchange data:', err);
        if (mounted && err.name !== 'AbortError') {
          setError(err.message);
          // Fall back to static data
          setExchanges(staticExchanges);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchExchangeData();

    // Set up polling interval (every 5 minutes)
    const dataInterval = setInterval(fetchExchangeData, 300000);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(dataInterval);
    };
  }, []);

  // Handle auto-rotation of exchanges
  useEffect(() => {
    let rotationTimer: number;
    
    if (autoRotate && exchanges.length > 0) {
      rotationTimer = window.setInterval(() => {
        setCurrentExchange(prevExchange => {
          const currentIndex = exchanges.findIndex(exchange => exchange.name === prevExchange.name);
          const nextIndex = (currentIndex + 1) % exchanges.length;
          console.log(`Auto-rotating exchange: ${exchanges[nextIndex].name}`);
          return exchanges[nextIndex];
        });
      }, rotationInterval);
    }
    
    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate, exchanges, rotationInterval]);

  // Function to manually select an exchange
  const selectExchange = (exchange: Exchange) => {
    setCurrentExchange(exchange);
  };

  return {
    exchanges,
    currentExchange,
    selectExchange,
    loading,
    error
  };
};
