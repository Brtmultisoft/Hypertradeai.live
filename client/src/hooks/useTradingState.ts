import { useState, useCallback } from 'react';

export const useTradingState = () => {
  const [tradingActive, setTradingActive] = useState<boolean>(false);
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [activeTrades, setActiveTrades] = useState<number>(0);
  const [sessionTime, setSessionTime] = useState<number>(0);
  
  // Increment session time by 1 second
  const incrementSessionTime = useCallback(() => {
    setSessionTime(prev => prev + 1);
  }, []);
  
  // Add a new active trade
  const addActiveTrade = useCallback(() => {
    setActiveTrades(prev => prev + 1);
  }, []);
  
  // Remove an active trade
  const removeActiveTrade = useCallback(() => {
    setActiveTrades(prev => Math.max(0, prev - 1));
  }, []);
  
  return {
    tradingActive,
    setTradingActive,
    totalProfit,
    setTotalProfit,
    activeTrades,
    addActiveTrade,
    removeActiveTrade,
    sessionTime,
    incrementSessionTime
  };
};