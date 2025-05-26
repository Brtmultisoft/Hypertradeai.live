import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Skeleton,
  Link,
  Chip,
  Box,
  useTheme
} from '@mui/material';

import { Clock, Newspaper } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  url: string;
  tags: string[];
}

const MarketNews: React.FC = () => {
  const { selectedInstrument } = useAppContext();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  
  useEffect(() => {
    setLoading(true);
    // Generate mock news data based on selected instrument
    setTimeout(() => {
      generateMockNews();
      setLoading(false);
    }, 1000);
  }, [selectedInstrument]);

  const generateMockNews = () => {
    const currency = selectedInstrument.split('-')[0];
    const mockNews: NewsItem[] = [
      {
        id: 1,
        title: `${currency} Surges to New Heights as Institutional Adoption Grows`,
        source: 'CoinDesk',
        time: '2 hours ago',
        url: '#',
        tags: ['Bullish', 'Institutional']
      },
      {
        id: 2,
        title: `Major Exchange Announces New ${currency} Trading Pairs`,
        source: 'CryptoNews',
        time: '5 hours ago',
        url: '#',
        tags: ['Exchange', 'Trading']
      },
      {
        id: 3,
        title: `Analyst Predicts ${currency} Will Reach New ATH by End of Year`,
        source: 'Bloomberg',
        time: '12 hours ago',
        url: '#',
        tags: ['Analysis', 'Forecast']
      },
      {
        id: 4,
        title: `${currency} Network Sees Record Transaction Volume`,
        source: 'The Block',
        time: '1 day ago',
        url: '#',
        tags: ['Network', 'Adoption']
      }
    ];
    
    setNews(mockNews);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Newspaper size={20} style={{ marginRight: '8px' }} />
            Latest News
          </Typography>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ mb: 2 }}>
              <Skeleton variant="text" width="90%" height={30} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Newspaper size={20} style={{ marginRight: '8px' }} />
          Latest News
        </Typography>
        
        <List disablePadding>
          {news.map((item) => (
            <ListItem 
              key={item.id} 
              disableGutters 
              sx={{ 
                py: 1.5, 
                px: 0,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&:last-child': {
                  borderBottom: 'none'
                }
              }}
            >
              <ListItemText
                primary={
                  <Link 
                    href={item.url} 
                    color="inherit" 
                    underline="hover"
                    sx={{ fontWeight: 500 }}
                  >
                    {item.title}
                  </Link>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: 'text.secondary',
                      mb: 0.5
                    }}>
                      <Typography 
                        variant="caption" 
                        component="span" 
                        sx={{ mr: 1 }}
                      >
                        {item.source}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: '0.75rem'
                      }}>
                        <Clock size={12} style={{ marginRight: '4px' }} />
                        {item.time}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.tags.map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          variant="outlined" 
                          sx={{ 
                            height: 20, 
                            '& .MuiChip-label': { 
                              px: 0.8,
                              fontSize: '0.625rem'
                            } 
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default MarketNews;