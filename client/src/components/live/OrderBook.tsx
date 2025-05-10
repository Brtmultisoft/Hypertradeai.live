import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Skeleton,
  useTheme
} from '@mui/material';
import { useTradingContext } from '../../context/TradingContext';
import { NumericFormat } from 'react-number-format';

interface Order {
  price: number;
  amount: number;
  total: number;
}

const OrderBook: React.FC = () => {
  const { btcPrice, loading, selectedInstrument, instruments } = useTradingContext();

  // Find the selected instrument name
  const selectedInstrumentName = instruments.find(i => i.id === selectedInstrument)?.name || 'Bitcoin';
  const currencySymbol = selectedInstrument.split('-')[0];
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const theme = useTheme();

  useEffect(() => {
    if (btcPrice) {
      generateOrderBookData();
    }
  }, [btcPrice]);

  const generateOrderBookData = () => {
    if (!btcPrice) return;

    const currentPrice = btcPrice;
    const buyOrdersData: Order[] = [];
    const sellOrdersData: Order[] = [];

    // Generate mock buy orders (bids) slightly below current price
    for (let i = 0; i < 8; i++) {
      const priceFactor = 1 - ((i + 1) * 0.001 + Math.random() * 0.001);
      const price = currentPrice * priceFactor;
      const amount = Math.random() * 2 + 0.1;
      buyOrdersData.push({
        price,
        amount,
        total: price * amount
      });
    }

    // Generate mock sell orders (asks) slightly above current price
    for (let i = 0; i < 8; i++) {
      const priceFactor = 1 + ((i + 1) * 0.001 + Math.random() * 0.001);
      const price = currentPrice * priceFactor;
      const amount = Math.random() * 2 + 0.1;
      sellOrdersData.push({
        price,
        amount,
        total: price * amount
      });
    }

    // Sort sell orders by price ascending
    sellOrdersData.sort((a, b) => a.price - b.price);

    // Sort buy orders by price descending
    buyOrdersData.sort((a, b) => b.price - a.price);

    setBuyOrders(buyOrdersData);
    setSellOrders(sellOrdersData);
  };

  if (loading && !btcPrice) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Book
          </Typography>
          <Skeleton variant="rectangular" width="100%" height={400} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {selectedInstrumentName} Order Book
        </Typography>

        <TableContainer sx={{ maxHeight: 200 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Price (USD)</TableCell>
                <TableCell align="right">Amount ({currencySymbol})</TableCell>
                <TableCell align="right">Total (USD)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sellOrders.map((order, index) => (
                <TableRow key={`sell-${index}`}>
                  <TableCell sx={{ color: theme.palette.secondary.main }}>
                    <NumericFormat
                      value={order.price}
                      displayType={'text'}
                      thousandSeparator={true}
                      prefix={'$'}
                      decimalScale={2}
                      fixedDecimalScale
                    />
                  </TableCell>
                  <TableCell align="right">
                    <NumericFormat
                      value={order.amount}
                      displayType={'text'}
                      decimalScale={4}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <NumericFormat
                      value={order.total}
                      displayType={'text'}
                      thousandSeparator={true}
                      prefix={'$'}
                      decimalScale={2}
                      fixedDecimalScale
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            py: 1,
            textAlign: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            my: 1
          }}
        >
          <Typography
            variant="h6"
            color="primary.main"
            sx={{ fontWeight: 700 }}
          >
            <NumericFormat
              value={btcPrice || 0}
              displayType={'text'}
              thousandSeparator={true}
              prefix={'$'}
              decimalScale={2}
              fixedDecimalScale
            />
          </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 200 }}>
          <Table size="small">
            <TableBody>
              {buyOrders.map((order, index) => (
                <TableRow key={`buy-${index}`}>
                  <TableCell sx={{ color: theme.palette.primary.main }}>
                    <NumericFormat
                      value={order.price}
                      displayType={'text'}
                      thousandSeparator={true}
                      prefix={'$'}
                      decimalScale={2}
                      fixedDecimalScale
                    />
                  </TableCell>
                  <TableCell align="right">
                    <NumericFormat
                      value={order.amount}
                      displayType={'text'}
                      decimalScale={4}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <NumericFormat
                      value={order.total}
                      displayType={'text'}
                      thousandSeparator={true}
                      prefix={'$'}
                      decimalScale={2}
                      fixedDecimalScale
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default OrderBook;