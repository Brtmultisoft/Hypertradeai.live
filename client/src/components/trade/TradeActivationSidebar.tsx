import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  Paper,
  Tooltip,
  Badge,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Computer as ComputerIcon,
  Refresh as RefreshIcon,
  DevicesOther as DevicesOtherIcon,
} from '@mui/icons-material';
import useTradeActivation, { TradeActivation } from '../../hooks/useTradeActivation';
import { format, parseISO } from 'date-fns';

interface TradeActivationSidebarProps {
  open: boolean;
  onClose: () => void;
  width?: number;
}

const TradeActivationSidebar: React.FC<TradeActivationSidebarProps> = ({
  open,
  onClose,
  width = 320,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const {
    activationHistory,
    todayActivation,
    isActivated,
    loading,
    activating,
    error,
    formatDate,
    formatTime,
    isToday,
    fetchActivationHistory,
    activateDailyTrading,
  } = useTradeActivation();

  // Group activations by month
  const groupedActivations = React.useMemo(() => {
    const grouped: Record<string, TradeActivation[]> = {};

    activationHistory.forEach((activation) => {
      const date = new Date(activation.activation_date);
      const monthYear = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }

      grouped[monthYear].push(activation);
    });

    // Sort each month's activations by date (newest first)
    Object.keys(grouped).forEach((month) => {
      grouped[month].sort((a, b) =>
        new Date(b.activation_date).getTime() - new Date(a.activation_date).getTime()
      );
    });

    return grouped;
  }, [activationHistory]);

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'expired':
        return <AccessTimeIcon fontSize="small" color="warning" />;
      case 'cancelled':
        return <CancelIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchActivationHistory();
  };

  // Handle activate
  const handleActivate = async () => {
    await activateDailyTrading();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : width,
          boxSizing: 'border-box',
          bgcolor: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1 }} />
          Trade Activation History
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            Today's Status:
            <Chip
              label={isActivated ? 'Activated' : 'Not Activated'}
              color={isActivated ? 'success' : 'default'}
              size="small"
              icon={isActivated ? <CheckCircleIcon /> : undefined}
              sx={{ ml: 1 }}
            />
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {!isActivated && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleActivate}
            disabled={loading || activating}
            sx={{ mb: 2 }}
          >
            {activating ? <CircularProgress size={24} /> : 'Activate Trading'}
          </Button>
        )}

        {todayActivation && (
          <Fade in={!!todayActivation} timeout={500}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mb: 3,
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 1,
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.main}10 100%)`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 0 10px ${theme.palette.primary.main}30`,
                },
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
                Today's Activation
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2">
                  {formatDate(todayActivation.activation_date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2">
                  {formatTime(todayActivation.activation_time)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DevicesOtherIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2" noWrap>
                  {todayActivation.device_info?.platform || 'Unknown Device'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getStatusIcon(todayActivation.status)}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  Status: {todayActivation.status.charAt(0).toUpperCase() + todayActivation.status.slice(1)}
                </Typography>
              </Box>
            </Paper>
          </Fade>
        )}
      </Box>

      <Divider />

      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>
            <Typography>{error}</Typography>
          </Box>
        ) : activationHistory.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography>No activation history found.</Typography>
          </Box>
        ) : (
          Object.keys(groupedActivations).map((month) => (
            <Box key={month}>
              <Typography
                variant="subtitle1"
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: 'background.default',
                  fontWeight: 'bold',
                }}
              >
                {month}
              </Typography>
              <List dense disablePadding>
                {groupedActivations[month].map((activation) => (
                  <React.Fragment key={activation._id}>
                    <ListItem
                      sx={{
                        px: 2,
                        py: 1,
                        bgcolor: isToday(activation.activation_date)
                          ? `${theme.palette.primary.main}10`
                          : 'transparent',
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDate(activation.activation_date)}
                            </Typography>
                            {isToday(activation.activation_date) && (
                              <Chip
                                label="Today"
                                size="small"
                                color="primary"
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14, color: theme.palette.primary.light }} />
                              <Typography variant="caption">
                                {formatTime(activation.activation_time)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <DevicesOtherIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14, color: theme.palette.text.secondary }} />
                              <Typography variant="caption" noWrap>
                                {activation.device_info?.platform || 'Unknown Device'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              {getStatusIcon(activation.status)}
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                Status: {activation.status.charAt(0).toUpperCase() + activation.status.slice(1)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ))
        )}
      </Box>
    </Drawer>
  );
};

export default TradeActivationSidebar;
