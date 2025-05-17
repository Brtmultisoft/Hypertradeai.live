import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Badge,
  useTheme,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import TradeActivationSidebar from './TradeActivationSidebar';
import useTradeActivation from '../../hooks/useTradeActivation';

interface TradeHistoryButtonProps {
  color?: 'primary' | 'secondary' | 'default' | 'inherit' | 'error' | 'info' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  tooltip?: string;
}

const TradeHistoryButton: React.FC<TradeHistoryButtonProps> = ({
  color = 'primary',
  size = 'medium',
  tooltip = 'Trade Activation History',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isActivated, activationHistory } = useTradeActivation();
  const theme = useTheme();

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <Tooltip title={tooltip}>
        <Badge
          color="success"
          variant="dot"
          invisible={!isActivated}
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <IconButton
            color={color}
            size={size}
            onClick={handleOpenSidebar}
            sx={{
              '&:hover': {
                backgroundColor: `${theme.palette.primary.main}20`,
              },
            }}
          >
            <HistoryIcon />
          </IconButton>
        </Badge>
      </Tooltip>

      <TradeActivationSidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
      />
    </>
  );
};

export default TradeHistoryButton;
