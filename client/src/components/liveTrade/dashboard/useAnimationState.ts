import { useState, useEffect, useRef } from 'react';
import { TradeData, AnimationState } from './types';

export const useAnimationState = (tradeData: TradeData[], isEnabled: boolean): AnimationState => {
  const [newRowIds, setNewRowIds] = useState<string[]>([]);
  const [updatedRowIds, setUpdatedRowIds] = useState<string[]>([]);
  const prevTradeDataRef = useRef<TradeData[]>([]);

  useEffect(() => {
    if (tradeData.length > 0 && isEnabled) {
      const newIds: string[] = [];
      const updatedIds: string[] = [];

      // Find new rows (not in previous data)
      tradeData.forEach(trade => {
        const prevTrade = prevTradeDataRef.current.find(pt => pt.id === trade.id);

        if (!prevTrade) {
          // This is a new row
          newIds.push(trade.id);
        } else if (
          prevTrade.price !== trade.price ||
          prevTrade.amount !== trade.amount ||
          prevTrade.total !== trade.total
        ) {
          // This row has updated values
          updatedIds.push(trade.id);
        }
      });

      setNewRowIds(newIds);
      setUpdatedRowIds(updatedIds);

      // Update the reference to current data
      prevTradeDataRef.current = [...tradeData];

      // Clear animation states after animation completes
      // Increased to 3500ms for slower, smoother animations
      const timer = setTimeout(() => {
        setNewRowIds([]);
        setUpdatedRowIds([]);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [tradeData, isEnabled]);

  return { newRowIds, updatedRowIds };
};

export default useAnimationState;
