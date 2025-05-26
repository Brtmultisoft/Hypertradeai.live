import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { UserData } from './types';

interface EmptyStateProps {
  userData: UserData | null;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ userData }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
        borderRadius: 2,
        border: '1px solid rgba(55, 65, 81, 0.5)',
        textAlign: 'center',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: '2rem',
              color: '#3b82f6',
            }}
          >
            ₿
          </Box>
        </Box>
        <Typography
          variant="h6"
          color="white"
          sx={{ mb: 1, fontWeight: 600 }}
        >
          No Trading Data Available
        </Typography>
        <Typography
          variant="body2"
          color="gray"
          sx={{ maxWidth: 500, mx: 'auto' }}
        >
          {userData?.total_investment || 4 > 0
            ? 'Please activate your daily profit to see live trading data and start earning returns on your investment.'
            : 'Make an investment and activate daily profit to see live trading data and start earning returns.'}
        </Typography>
      </Box>
    </Paper>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
