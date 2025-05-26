export interface TradingPair {
  symbol: string;
  name: string;
  fullName: string;
}

export interface Exchange {
  name: string;
  id?: string;  // Added ID field for unique identification
  logo: string;
  volume?: string;
  pairs?: string;
  price?: string;
  status?: string;
  badge?: {
    text: string;
    color: string;
    textColor?: string;
  };
}

export interface Trade {
  p: string; // price
  q: string; // quantity
  T: number; // timestamp
  m: boolean; // isBuyerMaker (true = buy, false = sell)
  e?: Exchange; // exchange
}

export interface OrderBookItem {
  price: number;
  amount: string;
  total: string;
  depth: number;
}

export interface OrderBook {
  asks: OrderBookItem[];
  bids: OrderBookItem[];
}