import React from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';
import TableSkeleton from './TableSkeleton';

const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
`;

interface LoadingStateProps {
  showSkeleton?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = React.memo(({ showSkeleton = true }) => {
  // If showSkeleton is true, show the skeleton loading UI
  if (showSkeleton) {
    return <TableSkeleton rowCount={7} />;
  }

  // Otherwise show the simple loading spinner
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 4,
        flexDirection: 'column',
        width: '100%',
        minHeight: 200,
      }}
    >
      <CircularProgress
        size={40}
        thickness={4}
        sx={{
          mb: 2,
          color: '#3b82f6',
        }}
      />
      <Typography
        variant="body2"
        color="gray"
        sx={{
          animation: `${pulse} 1.5s infinite ease-in-out`,
        }}
      >
        Fetching live trading data...
      </Typography>
    </Box>
  );
});

LoadingState.displayName = 'LoadingState';

export default LoadingState;
