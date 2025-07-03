import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Container,
  Stack,
  useTheme,
  alpha,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  AccountBalance as AccountBalanceIcon,
  MonetizationOn as MonetizationOnIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import roiSettingsService from '../../services/roi-settings.service';
import ApiService from '../../services/api.service';
import useAuth from '../../hooks/useAuth';

// Styled components for Binance-like dark theme
const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1e2329 0%, #2b3139 100%)',
  border: '1px solid #2b3139',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  '&:hover': {
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease'
  }
}));

const MetricCard = styled(Card)(({ theme, color = '#f0b90b' }) => ({
  background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
  border: `1px solid ${alpha(color, 0.2)}`,
  borderRadius: '12px',
  padding: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.5)} 100%)`
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 25px ${alpha(color, 0.3)}`,
    transition: 'all 0.3s ease'
  }
}));

const SettingsTable = styled(Paper)(({ theme }) => ({
  background: '#1e2329',
  border: '1px solid #2b3139',
  borderRadius: '12px',
  overflow: 'hidden',
  '& .MuiTableHead-root': {
    background: 'linear-gradient(135deg, #2b3139 0%, #1e2329 100%)'
  },
  '& .MuiTableCell-head': {
    color: '#f0b90b',
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #2b3139'
  },
  '& .MuiTableCell-body': {
    color: '#ffffff',
    borderBottom: '1px solid #2b3139',
    '&:hover': {
      backgroundColor: alpha('#f0b90b', 0.05)
    }
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: alpha('#f0b90b', 0.03)
  }
}));

const ROISettings = () => {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState({});
  const [tradingPackages, setTradingPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, setting: null });
  const [formData, setFormData] = useState({});

  // Dynamic settings configuration based on trading packages
  const [settingsConfig, setSettingsConfig] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fallback effect - if no settings config after 3 seconds, use fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settingsConfig.length === 0 && !loading) {
        console.log('No settings config found, using fallback');
        generateFallbackSettings();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [settingsConfig.length, loading]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        alert('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Starting to fetch initial data...');

      // First fetch trading packages, then ROI settings
      await fetchTradingPackages(token);
      await fetchROISettings(token);

      console.log('Initial data fetch completed');
    } catch (error) {
      console.error('Error fetching initial data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingPackages = async (token) => {
    try {
      console.log('Fetching trading packages...');

      // Use ApiService to fetch trading packages
      const response = await ApiService.request({
        endpoint: '/admin/settings/trading-packages',
        token,
        requestId: 'trading_packages'
      });

      console.log('Trading packages response:', response);

      if (response && response.success && response.data) {
        console.log('Found trading packages:', response.data.length);
        setTradingPackages(response.data);
        generateDynamicSettings(response.data);
      } else {
        console.log('No trading packages found, using fallback');
        // Fallback to default settings if no packages found
        generateFallbackSettings();
      }
    } catch (error) {
      console.error('Error fetching trading packages:', error);
      // Fallback to default settings if packages can't be fetched
      generateFallbackSettings();
    }
  };

  const generateFallbackSettings = () => {
    console.log('Generating fallback settings...');
    const fallbackSettings = [
      {
        key: 'silver_package_monthly_roi_min',
        label: 'Silver Package Min ROI (%)',
        description: 'Minimum monthly ROI percentage for Silver package',
        category: 'Silver Package',
        type: 'number',
        min: 1,
        max: 100
      },
      {
        key: 'silver_package_monthly_roi_max',
        label: 'Silver Package Max ROI (%)',
        description: 'Maximum monthly ROI percentage for Silver package',
        category: 'Silver Package',
        type: 'number',
        min: 1,
        max: 100
      },
      {
        key: 'gold_package_monthly_roi_min',
        label: 'Gold Package Min ROI (%)',
        description: 'Minimum monthly ROI percentage for Gold package',
        category: 'Gold Package',
        type: 'number',
        min: 1,
        max: 100
      },
      {
        key: 'gold_package_monthly_roi_max',
        label: 'Gold Package Max ROI (%)',
        description: 'Maximum monthly ROI percentage for Gold package',
        category: 'Gold Package',
        type: 'number',
        min: 1,
        max: 100
      },
      {
        key: 'withdrawal_fee_percentage',
        label: 'Withdrawal Fee (%)',
        description: 'Withdrawal fee percentage charged on all withdrawals',
        category: 'Withdrawal Settings',
        type: 'number',
        min: 0,
        max: 50
      },
      {
        key: 'minimum_withdrawal_amount',
        label: 'Minimum Withdrawal ($)',
        description: 'Minimum withdrawal amount allowed in USD',
        category: 'Withdrawal Settings',
        type: 'number',
        min: 1,
        max: 1000
      },
      {
        key: 'silver_package_amount_threshold',
        label: 'Amount Threshold ($)',
        description: 'Investment amount threshold to determine Silver vs Gold package',
        category: 'General Settings',
        type: 'number',
        min: 100,
        max: 100000
      }
    ];

    setSettingsConfig(fallbackSettings);
  };

  const generateDynamicSettings = (packages) => {
    console.log('Generating dynamic settings for packages:', packages);
    const dynamicSettings = [];

    // Add ROI settings for each trading package
    packages.forEach(pkg => {
      const packageName = pkg.name || pkg.title || 'Unknown Package';
      const packageKey = packageName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      console.log(`Adding settings for package: ${packageName} (${packageKey})`);

      dynamicSettings.push(
        {
          key: `${packageKey}_monthly_roi_min`,
          label: `${packageName} Min ROI (%)`,
          description: `Minimum monthly ROI percentage for ${packageName}`,
          category: packageName,
          type: 'number',
          min: 1,
          max: 100,
          packageId: pkg._id
        },
        {
          key: `${packageKey}_monthly_roi_max`,
          label: `${packageName} Max ROI (%)`,
          description: `Maximum monthly ROI percentage for ${packageName}`,
          category: packageName,
          type: 'number',
          min: 1,
          max: 100,
          packageId: pkg._id
        }
      );
    });

    // Add general settings
    dynamicSettings.push(
      {
        key: 'withdrawal_fee_percentage',
        label: 'Withdrawal Fee (%)',
        description: 'Withdrawal fee percentage charged on all withdrawals',
        category: 'Withdrawal Settings',
        type: 'number',
        min: 0,
        max: 50
      },
      {
        key: 'minimum_withdrawal_amount',
        label: 'Minimum Withdrawal ($)',
        description: 'Minimum withdrawal amount allowed in USD',
        category: 'Withdrawal Settings',
        type: 'number',
        min: 1,
        max: 1000
      }
    );

    console.log('Generated dynamic settings:', dynamicSettings);
    setSettingsConfig(dynamicSettings);
  };

  const generateDynamicSettingsFromOrganized = (organizedData) => {
    console.log('Generating settings from organized data:', organizedData);
    const dynamicSettings = [];

    // Add ROI settings for each trading package
    organizedData.tradingPackages.forEach(pkg => {
      dynamicSettings.push(
        {
          key: pkg.roiRange.min.settingName,
          label: `${pkg.name} Min ROI (%)`,
          description: `Minimum monthly ROI percentage for ${pkg.name}`,
          category: pkg.name,
          type: 'number',
          min: 1,
          max: 100,
          packageId: pkg.id
        },
        {
          key: pkg.roiRange.max.settingName,
          label: `${pkg.name} Max ROI (%)`,
          description: `Maximum monthly ROI percentage for ${pkg.name}`,
          category: pkg.name,
          type: 'number',
          min: 1,
          max: 100,
          packageId: pkg.id
        }
      );
    });

    // Add withdrawal settings
    organizedData.withdrawalSettings.forEach(setting => {
      dynamicSettings.push({
        key: setting.key,
        label: setting.label,
        description: setting.description,
        category: setting.category,
        type: 'number',
        min: setting.key === 'withdrawal_fee_percentage' ? 0 : 1,
        max: setting.key === 'withdrawal_fee_percentage' ? 50 : 1000
      });
    });

    // Add general settings
    organizedData.generalSettings.forEach(setting => {
      dynamicSettings.push({
        key: setting.key,
        label: setting.label,
        description: setting.description,
        category: setting.category,
        type: 'number',
        min: 100,
        max: 100000
      });
    });

    // Add any settings from rawSettings not already included
    const existingKeys = new Set(dynamicSettings.map(s => s.key));
    organizedData.rawSettings.forEach(setting => {
      if (!existingKeys.has(setting.name)) {
        dynamicSettings.push({
          key: setting.name,
          label: setting.extra?.label || setting.name,
          description: setting.extra?.description || '',
          category: setting.extra?.category || 'Other',
          type: setting.extra?.type || 'number',
          min: 1,
          max: 100
        });
      }
    });

    console.log('Generated settings from organized data:', dynamicSettings);
    setSettingsConfig(dynamicSettings);
  };

  const fetchROISettings = async (token) => {
    try {
      console.log('Fetching ROI settings...');

      const response = await roiSettingsService.getROISettings(token);

      console.log('ROI settings response:', response);

      if (response && response.success && response.data) {
        // Handle new organized data structure
        if (response.data.rawSettings) {
          // New organized structure
          const settingsMap = {};
          response.data.rawSettings.forEach(setting => {
            settingsMap[setting.name] = setting;
          });
          console.log('ROI settings mapped (organized):', settingsMap);
          setSettings(settingsMap);

          // Update trading packages if available
          if (response.data.tradingPackages) {
            setTradingPackages(response.data.tradingPackages);
            generateDynamicSettingsFromOrganized(response.data);
          }
        } else {
          // Old structure - array of settings
          const settingsMap = {};
          response.data.forEach(setting => {
            settingsMap[setting.name] = setting;
          });
          console.log('ROI settings mapped (legacy):', settingsMap);
          setSettings(settingsMap);
        }
      } else {
        console.log('Failed to fetch ROI settings:', response);
        alert('Failed to fetch ROI settings');
      }
    } catch (error) {
      console.error('Error fetching ROI settings:', error);
      alert('Error fetching ROI settings');
    }
  };

  const handleEditSetting = (settingKey) => {
    const config = settingsConfig.find(c => c.key === settingKey);
    const setting = settings[settingKey];

    setFormData({
      name: settingKey,
      value: setting?.value || '',
      description: config?.description || ''
    });
    setEditDialog({ open: true, setting: config });
  };

  const handleSaveSetting = async () => {
    try {
      setSaving(true);

      const token = getToken();
      if (!token) {
        alert('Authentication token not found. Please login again.');
        setSaving(false);
        return;
      }

      // Validate the setting first
      const validation = roiSettingsService.validateROISetting(formData.name, formData.value);
      if (!validation.valid) {
        alert(validation.message);
        setSaving(false);
        return;
      }

      const response = await roiSettingsService.updateROISetting(formData, token);

      if (response.success) {
        alert('ROI setting updated successfully');
        setEditDialog({ open: false, setting: null });
        fetchROISettings(); // Refresh settings
      } else {
        alert(response.message || 'Failed to update ROI setting');
      }
    } catch (error) {
      console.error('Error updating ROI setting:', error);
      alert('Error updating ROI setting');
    } finally {
      setSaving(false);
    }
  };

  const calculateDailyROI = (monthlyROI) => {
    return roiSettingsService.calculateDailyROI(monthlyROI);
  };

  const renderSettingsTable = (configItems) => {
    if (configItems.length === 0) {
      return (
        <Typography sx={{ color: '#848e9c', textAlign: 'center', py: 2 }}>
          No settings found in this category
        </Typography>
      );
    }

    return (
      <SettingsTable>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Setting</TableCell>
                <TableCell>Current Value</TableCell>
                <TableCell>Additional Info</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {configItems.map((config) => {
                const setting = settings[config.key];
                const value = setting?.value || 'Not Set';
                const isROI = config.key.includes('roi');

                const getCategoryColor = (category) => {
                  const colors = {
                    'Withdrawal Settings': '#ff6b6b',
                    'General Settings': '#4ecdc4'
                  };

                  // For trading packages, use dynamic colors
                  if (colors[category]) {
                    return colors[category];
                  }

                  // Generate consistent color for trading packages
                  const packageColors = ['#00d4aa', '#f0b90b', '#9c88ff', '#ffa726', '#26c6da', '#ab47bc'];
                  const packageIndex = tradingPackages.findIndex(pkg => pkg.name === category);
                  return packageColors[packageIndex % packageColors.length] || '#4ecdc4';
                };

                return (
                  <TableRow key={config.key}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: getCategoryColor(config.category)
                          }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 500 }}>
                            {config.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#848e9c' }}>
                            {config.description.length > 40
                              ? `${config.description.substring(0, 40)}...`
                              : config.description
                            }
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="h6"
                        sx={{
                          color: value === 'Not Set' ? '#848e9c' : getCategoryColor(config.category),
                          fontWeight: 600
                        }}
                      >
                        {value === 'Not Set' ? 'Not Set' :
                          `${value}${isROI || config.key.includes('percentage') ? '%' : config.key.includes('amount') ? ' USD' : ''}`
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {isROI && config.key.includes('monthly_roi') && value !== 'Not Set' ? (
                        <Typography variant="body2" sx={{ color: '#848e9c' }}>
                          Daily: {calculateDailyROI(value)}%
                        </Typography>
                      ) : config.key === 'withdrawal_fee_percentage' && value !== 'Not Set' ? (
                        <Typography variant="body2" sx={{ color: '#848e9c' }}>
                          Applied to all withdrawals
                        </Typography>
                      ) : config.key === 'minimum_withdrawal_amount' && value !== 'Not Set' ? (
                        <Typography variant="body2" sx={{ color: '#848e9c' }}>
                          Minimum required
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#848e9c' }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Setting">
                        <IconButton
                          size="small"
                          onClick={() => handleEditSetting(config.key)}
                          sx={{
                            color: '#f0b90b',
                            '&:hover': {
                              backgroundColor: alpha('#f0b90b', 0.1),
                              color: '#fcd535'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SettingsTable>
    );
  };

  const getROIRange = (packageName) => {
    const packageKey = packageName.toLowerCase().replace(/\s+/g, '_');
    const min = settings[`${packageKey}_monthly_roi_min`]?.value || 0;
    const max = settings[`${packageKey}_monthly_roi_max`]?.value || 0;
    return { min, max };
  };

  // Get unique package categories for metrics display
  const getPackageCategories = () => {
    const categories = settingsConfig
      .filter(config => config.key.includes('_monthly_roi_min'))
      .map(config => config.category);
    return [...new Set(categories)];
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress sx={{ color: '#f0b90b' }} size={60} />
          <Typography sx={{ ml: 2, color: '#ffffff' }}>Loading settings...</Typography>
        </Box>
      </Container>
    );
  }

  // Debug info
  console.log('Current state:', {
    settingsConfig: settingsConfig.length,
    settings: Object.keys(settings).length,
    tradingPackages: tradingPackages.length
  });

  // If no settings config, show fallback
  if (settingsConfig.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography sx={{ color: '#ffffff' }}>No settings configuration found. Please refresh the page.</Typography>
          <Button
            variant="outlined"
            onClick={fetchInitialData}
            sx={{ ml: 2, borderColor: '#f0b90b', color: '#f0b90b' }}
          >
            Refresh
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f0b90b 0%, #fcd535 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SettingsIcon sx={{ color: '#000', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: '#ffffff',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f0b90b 0%, #fcd535 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
               Withdrawal Settings
            </Typography>
           
          </Box>
        </Stack>
      </Box>

      {/* Trading Packages Overview */}
      

      {/* Withdrawal & General Settings */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={4}>
          <MetricCard color="#ff6b6b">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  display: 'flex'
                }}
              >
                <MonetizationOnIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#848e9c', mb: 0.5 }}>
                  Withdrawal Fee
                </Typography>
                <Typography variant="h5" sx={{ color: '#ff6b6b', fontWeight: 700 }}>
                  {settings.withdrawal_fee_percentage?.value || '10'}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#848e9c' }}>
                  Applied to all withdrawals
                </Typography>
              </Box>
            </Stack>
          </MetricCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <MetricCard color="#4ecdc4">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  display: 'flex'
                }}
              >
                <SecurityIcon sx={{ color: '#fff', fontSize: 24 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#848e9c', mb: 0.5 }}>
                  Minimum Withdrawal
                </Typography>
                <Typography variant="h5" sx={{ color: '#4ecdc4', fontWeight: 700 }}>
                  ${settings.minimum_withdrawal_amount?.value || '20'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#848e9c' }}>
                  Required minimum amount
                </Typography>
              </Box>
            </Stack>
          </MetricCard>
        </Grid>

       
      </Grid>

      {/* Settings Configuration */}
      <StyledCard>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 600, mb: 0.5 }}>
                Configuration Settings
              </Typography>
              <Typography variant="body2" sx={{ color: '#848e9c' }}>
                Manage ROI ranges and withdrawal parameters for {tradingPackages.length} trading packages
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchInitialData}
              disabled={loading}
              sx={{
                borderColor: '#f0b90b',
                color: '#f0b90b',
                '&:hover': {
                  borderColor: '#fcd535',
                  backgroundColor: alpha('#f0b90b', 0.1)
                }
              }}
            >
              Refresh
            </Button>
          </Stack>

   
          {settingsConfig.length > 0 && (
            <Box sx={{ mb: 3 }}>
           
              {/* Withdrawal Settings Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MonetizationOnIcon />
                  Withdrawal Settings
                </Typography>
                {renderSettingsTable(settingsConfig.filter(config => config.category === 'Withdrawal Settings'))}
              </Box>

              {/* General Settings Section */}
              {settingsConfig.filter(config => config.category === 'General Settings').length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#4ecdc4', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    General Settings
                  </Typography>
                  {renderSettingsTable(settingsConfig.filter(config => config.category === 'General Settings'))}
                </Box>
              )}

              {/* Other ROI Settings Section (for legacy/extra settings) */}
              {settingsConfig.filter(config =>
                config.category !== 'Withdrawal Settings' &&
                config.category !== 'General Settings' &&
                !tradingPackages.some(pkg => config.category === pkg.name)
              ).length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#f0b90b', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon />
                    Other ROI Settings
                  </Typography>
                  {renderSettingsTable(settingsConfig.filter(config =>
                    config.category !== 'Withdrawal Settings' &&
                    config.category !== 'General Settings' &&
                    !tradingPackages.some(pkg => config.category === pkg.name)
                  ))}
                </Box>
              )}
            </Box>
          )}

        </CardContent>
      </StyledCard>

      {/* Edit Setting Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, setting: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1e2329 0%, #2b3139 100%)',
            border: '1px solid #2b3139',
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', borderBottom: '1px solid #2b3139' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f0b90b 0%, #fcd535 100%)',
                display: 'flex'
              }}
            >
              <EditIcon sx={{ color: '#000', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#ffffff' }}>
              Edit {editDialog.setting?.label}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert
            severity="info"
            sx={{
              mb: 3,
              backgroundColor: alpha('#f0b90b', 0.1),
              border: `1px solid ${alpha('#f0b90b', 0.2)}`,
              '& .MuiAlert-icon': { color: '#f0b90b' }
            }}
          >
            <Typography variant="body2" sx={{ color: '#ffffff' }}>
              {editDialog.setting?.description}
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Value"
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            inputProps={{
              min: editDialog.setting?.min,
              max: editDialog.setting?.max,
              step: editDialog.setting?.type === 'number' ? 0.01 : 1
            }}
            helperText={
              editDialog.setting?.key.includes('roi') && formData.value
                ? `Daily equivalent: ${calculateDailyROI(formData.value)}%`
                : `Range: ${editDialog.setting?.min} - ${editDialog.setting?.max}`
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                '& fieldset': { borderColor: '#2b3139' },
                '&:hover fieldset': { borderColor: '#f0b90b' },
                '&.Mui-focused fieldset': { borderColor: '#f0b90b' }
              },
              '& .MuiInputLabel-root': { color: '#848e9c' },
              '& .MuiFormHelperText-root': { color: '#848e9c' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #2b3139' }}>
          <Button
            onClick={() => setEditDialog({ open: false, setting: null })}
            sx={{ color: '#848e9c' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSetting}
            disabled={saving || !formData.value}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: '#000' }} /> : <SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #f0b90b 0%, #fcd535 100%)',
              color: '#000',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #fcd535 0%, #f0b90b 100%)'
              },
              '&:disabled': {
                background: '#2b3139',
                color: '#848e9c'
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ROISettings;
