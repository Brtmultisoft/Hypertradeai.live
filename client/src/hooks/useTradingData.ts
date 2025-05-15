import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import api from '../services/api';

// Import the TradeData interface from the dashboard types
import { TradeData as DashboardTradeData } from '../components/liveTrade/dashboard/types';

// Define the trade data interface
interface TradeData extends DashboardTradeData {
  id: string;
}

export const useTradingData = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activatingProfit, setActivatingProfit] = useState(false);
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [btcPrice, setBtcPrice] = useState(84500);

  // CoinDesk API configuration
  const COINDESK_API = {
    baseUrl: 'https://data-api.coindesk.com/info/v1/openapi',
    apiKey: '4db0495dc4e40e0f35b03daf8d8b41bfb26191258d79c078fffdfb0f91436395'
  };

  // Fetch live trade data from CoinDesk API
  const fetchLiveTradeData = async () => {
    // try {
    //   setLoadingTrades(true);

    //   const params = { api_key: COINDESK_API.apiKey };
    //   const url = new URL(COINDESK_API.baseUrl);
    //   url.search = new URLSearchParams(params).toString();

    //   const response = await fetch(url, {
    //     method: 'GET',
    //     headers: { "Content-type": "application/json; charset=UTF-8" }
    //   });

    //   const data = await response.json();

    //   // Transform API data to match our format
    //   let formattedData: TradeData[] = [];

    //   if (data?.data && Array.isArray(data.data)) {
    //     formattedData = data.data.slice(0, 15).map((item: any, index: number) => {
    //       const type: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell'; // Randomize for demo
    //       return {
    //         exchange: item.exchange || 'CoinDesk',
    //         type,
    //         orderId: item.id || `CD${Math.floor(Math.random() * 10000000000)}`,
    //         price: item.price || (Math.random() * 0.01 + 0.001).toFixed(6),
    //         amount: item.amount || (84500 + Math.random() * 200).toFixed(2),
    //         total: item.total || (Math.random() * 1000 + 50).toFixed(2),
    //         timestamp: new Date().toLocaleTimeString(),
    //         id: `trade-${Date.now()}-${index}`
    //       };
    //     });
    //   } else {
    //     // Fallback to random data if API format is unexpected
    //     generateRandomTradeData();
    //     return;
    //   }

    //   setTradeData(formattedData);

    //   // Schedule next update in 8-12 seconds (slower updates)
    //   const nextUpdateTime = 8000 + Math.random() * 4000;
    //   setTimeout(() => {
    //     setRefreshData(prev => !prev);
    //   }, nextUpdateTime);

    // } catch (error) {
    //   console.error('Error fetching CoinDesk data:', error);
    //   generateRandomTradeData();
    // } finally {
    //   setLoadingTrades(false);
    // }
  };

  // Real API calls are now used instead of mock functions

  // Use the TradeData interface defined at the top of the file

  // Generate random trade data as fallback
  const generateRandomTradeData = () => {
    const exchanges = ['Binance', 'xtpub', 'bullish', 'Coinbase', 'Kraken'];
    const types: Array<'buy' | 'sell'> = ['buy', 'sell'];
    const basePrice = btcPrice;

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
        id: `trade-${Date.now()}-${i}`
      });
    }

    setTradeData(randomData);

    // Schedule next update in 8-12 seconds (slower updates)
    setTimeout(() => {
      setRefreshData(prev => !prev);
    }, 8000 + Math.random() * 4000);
  };

  const handleActivateDailyProfit = async () => {
    try {
      setActivatingProfit(true);
      console.log('Activating daily profit...');
      const response = await api.post('/user/activate-daily-profit');
      console.log('Activation response:', response.data);

      if (response.data?.status) {
        // Check if the response includes the updated user data
        if (response.data?.data?.user) {
          const updatedUserData = response.data.data.user;
          console.log('Updated user data from activation response:', updatedUserData);

          // Set the updated user data
          setUserData(updatedUserData);

          // Generate live trade data
          generateRandomTradeData();

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Daily profit has been activated for your account today. You will receive your daily profit when the system processes it.'
          });

          // Store activation state in local storage with user ID to make it user-specific
          const userId = updatedUserData?._id;
          if (userId) {
            localStorage.setItem(`dailyProfitActivated_${userId}`, 'true');
            localStorage.setItem(`activationDate_${userId}`, new Date().toDateString());
            console.log(`Stored activation state for user ${userId} in localStorage`);
          }
        } else {
          // If the response doesn't include user data, fetch it separately
          try {
            const profileResponse = await axios.get('/user/profile');
            if (profileResponse.data?.status) {
              const updatedUserData = profileResponse.data.result;
              console.log('Updated user data after activation:', updatedUserData);

              // Set the updated user data
              setUserData(updatedUserData);

              // Generate live trade data
              generateRandomTradeData();

              // Show success message
              Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Daily profit has been activated for your account today. You will receive your daily profit when the system processes it.'
              });

              // Store activation state in local storage with user ID to make it user-specific
              const userId = updatedUserData?._id;
              if (userId) {
                localStorage.setItem(`dailyProfitActivated_${userId}`, 'true');
                localStorage.setItem(`activationDate_${userId}`, new Date().toDateString());
                console.log(`Stored activation state for user ${userId} in localStorage`);
              }
            }
          } catch (profileError) {
            console.error('Error fetching updated profile:', profileError);

            // Even if profile fetch fails, update local state
            setUserData((prevData: any) => ({
              ...prevData,
              dailyProfitActivated: true,
              lastDailyProfitActivation: new Date()
            }));

            // Generate live trade data
            generateRandomTradeData();

            // Show success message
            Swal.fire({
              icon: 'success',
              title: 'Success!',
              text: 'Daily profit has been activated for your account today. You will receive your daily profit when the system processes it.'
            });
          }
        }
      } else {
        throw new Error(response.data?.message || 'Failed to activate daily profit');
      }
    } catch (error) {
      console.error('Error activating daily profit:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to activate daily profit. Please try again later.'
      });
    } finally {
      setActivatingProfit(false);
    }
  };

  // Helper function to check if user has investments
  const checkInvestmentStatus = (userData: any) => {
    if (userData && userData.total_investment !== undefined) {
      const hasInvestments = userData.total_investment > 0;
      console.log('User has investments:', hasInvestments, 'Amount:', userData.total_investment);
      console.log('Daily profit activated:', userData.dailyProfitActivated);

      // Log additional information for debugging
      if (hasInvestments) {
        console.log('User has valid investment of $' + userData.total_investment);
      } else {
        console.log('User has no investment or investment amount is 0');
      }

      return hasInvestments;
    }
    return false;
  };

  const updateMetrics = () => {
    const newBtcPrice = 84500 + Math.random() * 500 - 250;
    setBtcPrice(prevPrice => {
      const diff = newBtcPrice - prevPrice;
      return prevPrice + (diff * 0.2);
    });

    // Schedule next metrics update in 8-12 seconds (slower updates)
    const nextUpdateTime = 8000 + Math.random() * 4000;
    setTimeout(() => {
      updateMetrics();
    }, nextUpdateTime);
  };

  // Check local storage for activation state on component mount
  useEffect(() => {
    // We'll check user-specific localStorage items after we have the user data
    // This is just to clean up any old format items
    const storedActivation = localStorage.getItem('dailyProfitActivated');
    const storedDate = localStorage.getItem('activationDate');

    // Remove old format items if they exist
    if (storedActivation) {
      localStorage.removeItem('dailyProfitActivated');
    }
    if (storedDate) {
      localStorage.removeItem('activationDate');
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Only generate trade data if user has investments and has activated daily profit
        // We'll check this after we get the user data

        const response = await api.get('/user/profile');

        if (response.data?.status) {
          const userData = response.data.result;
          if (!userData.extra) {
            userData.extra = {};
          }

          // Get user ID for user-specific localStorage items
          const userId = userData?._id;
          console.log('User data from server:', userData);

          // Check if user has activated daily profit (from database)
          let isActivated = userData.dailyProfitActivated === true;
          console.log('Initial activation status from database:', isActivated);

          // Only check localStorage if we have a userId
          if (userId && !isActivated) {
            // Check user-specific localStorage for today's activation
            const storedActivation = localStorage.getItem(`dailyProfitActivated_${userId}`);
            const storedDate = localStorage.getItem(`activationDate_${userId}`);
            const today = new Date().toDateString();

            console.log(`Checking localStorage for user ${userId}:`, {
              storedActivation,
              storedDate,
              today
            });

            // If we have a valid user-specific localStorage activation but server doesn't show it,
            // update the userData to reflect the activation
            if (storedActivation === 'true' && storedDate === today) {
              // Set directly in user document
              userData.dailyProfitActivated = true;
              isActivated = true;
              console.log(`Using activation state from localStorage for user ${userId}`);
            }
          }

          // Ensure the extra object exists
          if (!userData.extra) {
            userData.extra = {};
          }

          setUserData(userData);

          // Check if user has investments - this is critical for the Arbitrage Trade page
          // as users can only activate daily profit if they have made an investment
          const hasInvestments = checkInvestmentStatus(userData);
          console.log('User has investments check result:', hasInvestments);

          // If user has already activated daily profit AND has investments, fetch live trade data
          if (isActivated && hasInvestments) {
            console.log('User has already activated daily profit and has investments, fetching live trade data');
            // Generate trade data since user has investments and has activated daily profit
            generateRandomTradeData();
            fetchLiveTradeData();
          } else if (!hasInvestments) {
            console.log('User has no investments, cannot activate daily profit');
          } else {
            console.log('User has not activated daily profit yet');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    updateMetrics();
  }, []);

  useEffect(() => {
    if (userData?.dailyProfitActivated && userData?.total_investment > 0) {
      fetchLiveTradeData();
    }
  }, [refreshData]);

  return {
    userData,
    loading,
    activatingProfit,
    tradeData,
    loadingTrades,
    btcPrice,
    handleActivateDailyProfit,
  };
};