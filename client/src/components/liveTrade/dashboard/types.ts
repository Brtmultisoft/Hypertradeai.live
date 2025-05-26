export interface TradeData {
  id: string;
  exchange: string;
  type: 'buy' | 'sell';
  orderId: string;
  price: string;
  amount: string;
  total: string;
  timestamp: string;
}

export interface UserData {
  total_investment: number;
  dailyProfitActivated: boolean;
  [key: string]: any;
}

export interface AnimationState {
  newRowIds: string[];
  updatedRowIds: string[];
}

export type TradeFilterType = 'all' | 'buy' | 'sell';
