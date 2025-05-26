import React from 'react';
import { Button, Box, Typography, CircularProgress, Grid, Paper } from '@mui/material';

interface ActivationPanelProps {
  userData: any;
  activatingProfit: boolean;
  onActivate: () => void;
}

const ActivationPanel: React.FC<ActivationPanelProps> = ({
  userData,
  activatingProfit,
  onActivate
}) => {
  
  const isActive = userData?.dailyProfitActivated === true;
  const hasInvestment = userData && userData.total_investment > 0;

  return (
    <Box sx={{ width: '100%', marginTop: 4, marginBottom: 2 }}>
      <Button
        onClick={onActivate}
        disabled={isActive || activatingProfit || !hasInvestment}
        variant="contained"
        sx={{
          width: '100%',
          paddingX: 3,
          paddingY: 2,
          borderRadius: 2,
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: isActive
            ? 'rgba(34, 197, 94, 0.5)'
            : !hasInvestment
              ? 'rgba(239, 68, 68, 0.5)'
              : 'green',
          '&:hover': {
            backgroundColor: isActive
              ? 'rgba(34, 197, 94, 0.5)'
              : !hasInvestment
                ? 'rgba(239, 68, 68, 0.5)'
                : '#16a34a',
          },
          cursor: isActive || !hasInvestment || activatingProfit ? 'not-allowed' : 'pointer',
        }}
      >
        {activatingProfit ? (
          <>
            <CircularProgress size={20} sx={{ color: 'white', marginRight: 1 }} />
            Activating...
          </>
        ) : isActive ? (
          'Your Daily Profit Activated for Today'
        ) : !hasInvestment ? (
          'Invest First to Activate'
        ) : (
          'Activate MY Daily Profit for Today'
        )}
      </Button>

      <Typography variant="caption" sx={{ color: 'gray', marginTop: 1, textAlign: 'center', display: 'block' }}>
        Activation resets at midnight UTC. You must activate daily.
      </Typography>

      {/* Status messages */}
      {userData && !isActive && !hasInvestment && (
        <Box sx={{ marginTop: 3, padding: 2, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: '#f87171', fontWeight: 'bold' }}>
            Investment Required
          </Typography>
          <Typography variant="body2" sx={{ color: 'gray', marginTop: 1 }}>
            You need to make an investment in a trading package before you can activate daily profit.
          </Typography>
        </Box>
      )}

      {userData && !isActive && hasInvestment && (
        <Box sx={{ marginTop: 3, padding: 2, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: '#60A5FA', fontWeight: 'bold' }}>
            Activate Daily Profit
          </Typography>
          <Typography variant="body2" sx={{ color: 'gray', marginTop: 1 }}>
            Activate daily profit to start earning 2.5% on your investment today.
          </Typography>
        </Box>
      )}

      {/* We don't need to show this message since the entire panel will be hidden when activated */}
    </Box>
  );
};

export default ActivationPanel;
