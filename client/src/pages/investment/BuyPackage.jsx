import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
  Star as StarIcon,
  AccountBalanceWallet as WalletIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
    ShoppingCart as ShoppingCartIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import useApi from '../../hooks/useApi';
import InvestmentService from '../../services/investment.service';
import useAuth from '../../hooks/useAuth';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

const BuyPackage = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [animateAmount, setAnimateAmount] = useState(false);

  // Fetch investment plans
  const {
    data: plansData,
    loading: plansLoading,
    error: plansError,
  } = useApi(() => InvestmentService.getInvestmentPlans(), true);

  // Add investment - only create the API handler, don't execute immediately
  const {
    data: investmentData,
    loading: investmentLoading,
    error: investmentError,
    execute: addInvestment,
  } = useApi((data) => InvestmentService.addTradingPackage(data), false);

  // Handle successful investment
  useEffect(() => {
    if (investmentData?.result) {
      setShowConfirmation(false);

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Your investment has been successfully processed.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: theme.palette.primary.main,
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [investmentData, theme.palette.primary.main, navigate]);

  useEffect(() => {
    if (investmentError) {
      setError(investmentError.msg || 'Failed to process investment');
      setShowConfirmation(false);
    }
  }, [investmentError]);

  // Set default selected plan when data loads
  useEffect(() => {
    if (plansData?.result && plansData.result.length > 0 && !selectedPlan) {
      setSelectedPlan(plansData.result[0]);
    } else if (plansData?.data && plansData.data.length > 0 && !selectedPlan) {
      setSelectedPlan(plansData.data[0]);
    }
  }, [plansData, selectedPlan]);

  // Animation for amount changes
  useEffect(() => {
    if (amount) {
      setAnimateAmount(true);
      const timer = setTimeout(() => setAnimateAmount(false), 500);
      return () => clearTimeout(timer);
    }
  }, [amount]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setAmount('');
    setError('');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setError('');
  };

  const handlePercentageSelect = (percentage) => {
    if (!selectedPlan) return;

    const availableBalance = user?.wallet_topup || 0;
    const minAmount = selectedPlan.amount_from;
    const maxAmount = Math.min(selectedPlan.amount_to, availableBalance);

    const calculatedAmount = (availableBalance * percentage / 100).toFixed(2);
    const finalAmount = Math.max(minAmount, Math.min(maxAmount, calculatedAmount));

    setAmount(finalAmount.toString());
    setError('');
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < selectedPlan.amount_from) {
      setError(`Minimum investment amount is ${formatCurrency(selectedPlan.amount_from)}`);
      return false;
    }

    if (selectedPlan.amount_to > 0 && numAmount > selectedPlan.amount_to) {
      setError(`Maximum investment amount is ${formatCurrency(selectedPlan.amount_to)}`);
      return false;
    }

    if (numAmount > user.wallet_topup) {
      setError('Insufficient balance in your wallet');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateAmount()) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmInvestment = async () => {
    try {
      await addInvestment({ amount: parseFloat(amount) });
    } catch (error) {
      setError(error.message || 'Failed to process investment');
      setShowConfirmation(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
  };

  // Get plans data from API response
  const plans = plansData?.result || plansData?.data || [];

  // Calculate estimated returns
  const calculateReturns = () => {
    if (!selectedPlan || !amount || isNaN(parseFloat(amount))) {
      return {
        daily: 0,
        monthly: 0,
        yearly: 0
      };
    }

    const investmentAmount = parseFloat(amount);
    const dailyPercentage = selectedPlan.percentage / 100;
    const dailyReturn = investmentAmount * (dailyPercentage / 100);

    return {
      daily: dailyReturn,
      monthly: dailyReturn * 30,
      yearly: dailyReturn * 365
    };
  };

  const returns = calculateReturns();

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} edge="start" sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ mr: 1 }}>
              {selectedPlan?.title || 'Trading Package'}
            </Typography>
            <IconButton size="small" onClick={toggleFavorite}>
              {favorite ? <StarIcon sx={{ color: '#F3BA2F' }} /> : <StarBorderIcon />}
            </IconButton>
          </Box>
        </Box>
        <IconButton onClick={() => navigate('/investment-history')}>
          <HistoryIcon />
        </IconButton>
      </Box>

      {/* Trust Wallet Style Price Chart Area */}
      <Box
        sx={{
          height: { xs: 200, sm: 250 },
          background: mode === 'dark'
            ? 'linear-gradient(135deg, rgba(51, 117, 187, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(180deg, rgba(245, 247, 250, 0.8) 0%, rgba(255, 255, 255, 1) 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'dark'
              ? 'radial-gradient(circle at 30% 30%, rgba(51, 117, 187, 0.4), transparent 70%)'
              : 'radial-gradient(circle at 30% 30%, rgba(51, 117, 187, 0.1), transparent 70%)',
            opacity: 0.8,
            zIndex: 0,
            animation: 'pulse 8s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.5 },
              '50%': { opacity: 0.8 },
              '100%': { opacity: 0.5 },
            },
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Trust Wallet Style Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.1,
            background: `radial-gradient(circle, ${theme.palette.primary.main}30 10%, transparent 10.5%) 0 0,
                        radial-gradient(circle, ${theme.palette.primary.main}30 10%, transparent 10.5%) 8px 8px`,
            backgroundSize: '16px 16px',
            animation: 'pulse 4s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { opacity: 0.05 },
              '50%': { opacity: 0.15 },
              '100%': { opacity: 0.05 },
            },
          }}
        />

        {/* Trust Wallet Style Grid Lines */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.15,
            backgroundImage: `
              linear-gradient(90deg, ${theme.palette.primary.main}20 1px, transparent 1px),
              linear-gradient(180deg, ${theme.palette.primary.main}20 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            animation: 'moveLines 20s infinite linear',
            '@keyframes moveLines': {
              '0%': { backgroundPosition: '0 0' },
              '100%': { backgroundPosition: '20px 20px' },
            },
          }}
        />

        {/* Trust Wallet Style Animated Chart Line */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '40%',
            bottom: '20%',
            left: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='none' stroke='%233375BB' stroke-width='4' d='M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,213.3C840,224,960,224,1080,208C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'moveChart 30s infinite linear',
              '@keyframes moveChart': {
                '0%': { backgroundPosition: '0% center' },
                '100%': { backgroundPosition: '100% center' },
              },
            }
          }}
        />

        {/* Trust Wallet Logo Animation */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              borderRadius: '50%',
              backgroundColor: 'rgba(51, 117, 187, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(51, 117, 187, 0.2)',
              animation: 'float 3s infinite ease-in-out',
              '@keyframes float': {
                '0%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' },
                '100%': { transform: 'translateY(0px)' },
              },
              mb: 2,
            }}
          >
            <AccountBalanceWalletIcon
              sx={{
                fontSize: { xs: 40, sm: 50 },
                color: theme.palette.primary.main,
              }}
            />
          </Box>


        </Box>

        {/* Package title overlay with animation */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: { xs: '15px 20px', sm: '20px 30px' },
            background: mode === 'dark'
              ? 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
              : 'linear-gradient(to top, rgba(240, 244, 248, 0.1), transparent)',
            animation: 'fadeInUp 0.8s ease-out',
            '@keyframes fadeInUp': {
              '0%': { transform: 'translateY(20px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: mode === 'dark' ? '#fff' : '#000',
              textShadow: mode === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : 'none',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {selectedPlan?.title || 'Trading Package'}
            <Box
              sx={{
                ml: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: mode === 'dark' ? 'rgba(14, 203, 129, 0.2)' : 'rgba(240, 244, 248, 1)',
                borderRadius: 20,
                px: 1.5,
                py: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: mode === 'dark' ? '#0ECB81' : '#000',
                  fontWeight: 'bold',
                  textShadow: 'none',
                }}
              >
                {selectedPlan?.percentage ? `${selectedPlan.percentage / 100}% Daily` : ''}
              </Typography>
            </Box>
          </Typography>
        </Box>
      </Box>

      {/* Trading Form */}
      <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Package Selection */}
        {plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress
              sx={{
                color: mode === 'dark' ? '#fff' : '#000',
                animation: 'spin 1.5s linear infinite, pulse-opacity 2s ease-in-out infinite',
                '@keyframes pulse-opacity': {
                  '0%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                  '100%': { opacity: 0.6 },
                },
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }}
            />
          </Box>
        ) : plansError ? (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              animation: 'slide-in 0.5s ease-out',
              '@keyframes slide-in': {
                '0%': { transform: 'translateY(-20px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              }
            }}
          >
            Failed to load trading packages
          </Alert>
        ) : (
          <Box
            sx={{
              mb: 4,
              animation: 'fade-in 0.6s ease-out',
              '@keyframes fade-in': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              }
            }}
          >
            <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              color: mode === 'dark' ? theme.palette.primary.main : '#000',
              textShadow: mode === 'dark' ? '0 0 1px rgba(51, 117, 187, 0.2)' : 'none',
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 4,
                height: 24,
                backgroundColor: mode === 'dark' ? theme.palette.primary.main : '#000',
                marginRight: 1.5,
                borderRadius: 4,
                boxShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.5)' : 'none',
              }
            }}
          >
           Select Trading Package
          </Typography>

            <Grid container spacing={2.5}>
              {plans.map((plan, index) => (
                <Grid item xs={6} sm={4} key={plan._id}>
                  <Paper
                    elevation={selectedPlan?._id === plan._id ? 8 : 0}
                    onClick={() => handlePlanSelect(plan)}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: mode === 'dark'
                        ? `2px solid ${selectedPlan?._id === plan._id ? theme.palette.primary.main : 'transparent'}`
                        : `1px solid ${selectedPlan?._id === plan._id ? '#000' : '#E6E8EA'}`,
                      backgroundColor: mode === 'dark'
                        ? (selectedPlan?._id === plan._id ? 'rgba(51, 117, 187, 0.15)' : 'rgba(255,255,255,0.05)')
                        : 'rgba(255, 255, 255, 1)',
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: selectedPlan?._id === plan._id ? 'translateY(-8px)' : 'none',
                      boxShadow: selectedPlan?._id === plan._id
                        ? mode === 'dark'
                          ? '0 12px 24px rgba(51, 117, 187, 0.3)'
                          : '0 8px 16px rgba(0, 0, 0, 0.08)'
                        : mode === 'dark'
                          ? '0 4px 8px rgba(0, 0, 0, 0.2)'
                          : '0 2px 8px rgba(0, 0, 0, 0.03)',
                      position: 'relative',
                      '&::after': selectedPlan?._id === plan._id ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: mode === 'dark'
                          ? 'linear-gradient(90deg, #3375BB, #2A5F9E, #3375BB)'
                          : 'linear-gradient(90deg, #3375BB, #000, #3375BB)',
                        backgroundSize: '200% 100%',
                        animation: 'gradientMove 3s linear infinite',
                        '@keyframes gradientMove': {
                          '0%': { backgroundPosition: '0% 0%' },
                          '100%': { backgroundPosition: '200% 0%' },
                        },
                      } : {},
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: mode === 'dark'
                          ? '0 12px 24px rgba(0,0,0,0.15)'
                          : '0 12px 24px rgba(51, 117, 187, 0.15)',
                        backgroundColor: selectedPlan?._id === plan._id
                          ? mode === 'dark' ? 'rgba(51, 117, 187, 0.15)' : 'rgba(51, 117, 187, 0.12)'
                          : mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(51, 117, 187, 0.05)',
                      },
                      animation: `fade-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
                      '@keyframes fade-slide-in': {
                        '0%': { transform: 'translateY(30px)', opacity: 0 },
                        '100%': { transform: selectedPlan?._id === plan._id ? 'translateY(-8px)' : 'translateY(0)', opacity: 1 },
                      },
                      '&::before': selectedPlan?._id === plan._id ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.2), transparent 70%)',
                        zIndex: 0,
                      } : {}
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {/* Package Icon */}
                      <Box
                        sx={{
                          width: { xs: 50, sm: 60 },
                          height: { xs: 50, sm: 60 },
                          borderRadius: '50%',
                          background: selectedPlan?._id === plan._id
                            ? mode === 'dark'
                              ? 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)'
                              : 'linear-gradient(135deg, #000 0%, #333 100%)'
                            : mode === 'dark'
                              ? `${theme.palette.primary.main}15`
                              : 'rgba(245, 247, 250, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transform: selectedPlan?._id === plan._id ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: selectedPlan?._id === plan._id
                            ? mode === 'dark'
                              ? '0 8px 20px rgba(51, 117, 187, 0.4)'
                              : '0 8px 20px rgba(0, 0, 0, 0.15)'
                            : mode === 'dark'
                              ? '0 4px 12px rgba(0, 0, 0, 0.2)'
                              : '0 4px 12px rgba(0, 0, 0, 0.05)',
                          animation: selectedPlan?._id === plan._id
                            ? 'pulse-icon 3s infinite, rotate-subtle 15s linear infinite'
                            : 'rotate-subtle 20s linear infinite',
                          '@keyframes pulse-icon': {
                            '0%': { boxShadow: '0 0 0 0 rgba(51, 117, 187, 0.4)' },
                            '70%': { boxShadow: '0 0 0 15px rgba(51, 117, 187, 0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(51, 117, 187, 0)' },
                          },
                          '@keyframes rotate-subtle': {
                            '0%': { transform: selectedPlan?._id === plan._id ? 'scale(1.1) rotate(0deg)' : 'scale(1) rotate(0deg)' },
                            '100%': { transform: selectedPlan?._id === plan._id ? 'scale(1.1) rotate(360deg)' : 'scale(1) rotate(360deg)' },
                          }
                        }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: selectedPlan?._id === plan._id ? '#fff' : theme.palette.primary.main,
                            fontWeight: 'bold',
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                          }}
                        >
                          {plan.title.charAt(0)}
                        </Typography>
                      </Box>

                      {/* Package Title */}
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{
                          mb: 0.5,
                          color: mode === 'dark'
                            ? (selectedPlan?._id === plan._id ? theme.palette.primary.main : theme.palette.text.primary)
                            : '#000',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {plan.title}
                      </Typography>

                      {/* ROI */}
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{
                          mb: 1,
                          color: mode === 'dark'
                            ? (selectedPlan?._id === plan._id ? theme.palette.primary.main : theme.palette.text.primary)
                            : '#000',
                          transition: 'all 0.3s ease',
                          textShadow: selectedPlan?._id === plan._id ? '0 0 8px rgba(51, 117, 187, 0.3)' : 'none',
                        }}
                      >
                        {plan.percentage / 100}%
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: mode === 'dark'
                            ? (selectedPlan?._id === plan._id ? theme.palette.primary.main : theme.palette.text.secondary)
                            : (selectedPlan?._id === plan._id ? '#3375BB' : '#6E7C87'),
                          transition: 'all 0.3s ease',
                          fontWeight: selectedPlan?._id === plan._id ? 'medium' : 'normal',
                        }}
                      >
                        Daily ROI
                      </Typography>

                      {/* Investment Range */}
                      <Box
                        sx={{
                          mt: 1.5,
                          pt: 1.5,
                          width: '100%',
                          borderTop: `1px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: mode === 'dark' ? theme.palette.text.secondary : '#3375BB',
                            fontSize: '0.7rem',
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 10,
                            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(51, 117, 187, 0.08)',
                          }}
                        >
                          {formatCurrency(plan.amount_from)} - {formatCurrency(plan.amount_to)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Amount Input */}
        <Box
          sx={{
            mb: 4,
            animation: 'fade-in 0.6s ease-out 0.2s both',
            '@keyframes fade-in': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            }
          }}
        >
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              color: mode === 'dark' ? theme.palette.primary.main : '#000',
              textShadow: mode === 'dark' ? '0 0 1px rgba(51, 117, 187, 0.2)' : 'none',
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 4,
                height: 24,
                backgroundColor: mode === 'dark' ? theme.palette.primary.main : '#000',
                marginRight: 1.5,
                borderRadius: 4,
                boxShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.5)' : 'none',
              }
            }}
          >
            Investment Amount
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.05)' : 'rgba(255, 255, 255, 1)',
              border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : '#E6E8EA'}`,
              mb: 2,
              position: 'relative',
              overflow: 'hidden',
              boxShadow: mode === 'dark'
                ? '0 8px 20px rgba(0,0,0,0.05)'
                : '0 2px 8px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                boxShadow: mode === 'dark'
                  ? '0 10px 25px rgba(0,0,0,0.08)'
                  : '0 4px 12px rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-2px)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: mode === 'dark'
                  ? 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.1), transparent 70%)'
                  : 'radial-gradient(circle at top right, rgba(51, 117, 187, 0.05), transparent 70%)',
                zIndex: 0,
              },
              animation: 'fadeInUp 0.6s ease-out',
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              }
            }}
          >
            {/* Available Balance */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
                pb: 2.5,
                borderBottom: `1px dashed ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(14, 203, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1.5,
                  }}
                >
                  <WalletIcon sx={{ color: mode === 'dark' ? theme.palette.primary.main : '#000', fontSize: 18 }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Available Balance
                </Typography>
              </Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  color: mode === 'dark' ? theme.palette.primary.main : '#000',
                  textShadow: mode === 'dark' ? '0 0 1px rgba(51, 117, 187, 0.2)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  animation: 'fadeIn 0.5s ease-out',
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'translateY(5px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  }
                }}
              >
                {formatCurrency(user?.wallet_topup || 0)}
                <RefreshIcon
                  sx={{
                    ml: 1,
                    fontSize: 18,
                    opacity: 0.7,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'rotate(180deg)',
                    }
                  }}
                />
              </Typography>
            </Box>

            {/* Amount Input with Enhanced Animation */}
            <Box sx={{ position: 'relative', mb: 3, zIndex: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  backgroundColor: '#0ECB81',
                  opacity: animateAmount ? 0.1 : 0,
                  transition: 'opacity 0.5s ease',
                  borderRadius: 2,
                  zIndex: 2,
                }}
              />

              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -5,
                    left: -5,
                    right: -5,
                    bottom: -5,
                    background: mode === 'dark'
                      ? 'linear-gradient(90deg, #0ECB81, #0BA572, #0ECB81)'
                      : 'linear-gradient(90deg, #3375BB, #000, #3375BB)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient 3s ease infinite',
                    borderRadius: 3,
                    opacity: mode === 'dark' ? 0.5 : 0.2,
                    filter: 'blur(8px)',
                    zIndex: -1,
                    '@keyframes gradient': {
                      '0%': { backgroundPosition: '0% 50%' },
                      '50%': { backgroundPosition: '100% 50%' },
                      '100%': { backgroundPosition: '0% 50%' },
                    },
                  }
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  type="number"
                  error={!!error}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: { xs: '1.1rem', sm: '1.3rem' },
                      fontWeight: 'bold',
                      backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,1)',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(51, 117, 187, 0.3)',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(51, 117, 187, 0.3)',
                        border: '1px solid rgba(51, 117, 187, 0.5)',
                      },
                      '&:hover': {
                        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                      },
                      '&::before': {
                        content: '"$"',
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: { xs: '1.1rem', sm: '1.3rem' },
                        fontWeight: 'bold',
                        color: mode === 'dark' ? theme.palette.primary.main : '#000',
                        zIndex: 1,
                      }
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: { xs: '14px 14px 14px 40px', sm: '18px 14px 18px 40px' },
                      textAlign: 'right',
                      paddingRight: '16px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Percentage Buttons */}
            <Box sx={{ display: 'flex', gap: 1, zIndex: 1, position: 'relative' }}>
              {[25, 50, 75, 100].map((percent) => (
                <Button
                  key={percent}
                  variant="contained"
                  size="large"
                  onClick={() => handlePercentageSelect(percent)}
                  sx={{
                    flex: 1,
                    py: { xs: 0.8, sm: 1.2 },
                    borderRadius: 2,
                    fontWeight: 'bold',
                    backgroundColor: percent === 100
                      ? '#3375BB'
                      : mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#3375BB',
                    color: '#fff',
                    boxShadow: percent === 100
                      ? mode === 'dark' ? '0 4px 10px rgba(51, 117, 187, 0.3)' : '0 4px 10px rgba(0, 0, 0, 0.1)'
                      : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': percent === 100 ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle at center, rgba(255,255,255,0.2), transparent 70%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    } : {},
                    '&:hover': {
                      backgroundColor: '#2A5F9E',
                      color: '#fff',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(51, 117, 187, 0.3)',
                      '&::before': {
                        opacity: 1,
                      }
                    },
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    animation: percent === 100 ? 'pulse-button 2s infinite' : 'none',
                    '@keyframes pulse-button': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                      '100%': { transform: 'scale(1)' },
                    },
                  }}
                >
                  {percent}%
                </Button>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Estimated Returns */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.05)' : 'rgba(255, 255, 255, 1)',
            border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : '#E6E8EA'}`,
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: mode === 'dark'
              ? '0 8px 20px rgba(0,0,0,0.05)'
              : '0 2px 8px rgba(0, 0, 0, 0.03)',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 10px 25px rgba(0,0,0,0.08)'
                : '0 4px 12px rgba(0, 0, 0, 0.05)',
              transform: 'translateY(-2px)',
            },
            animation: 'fadeInUp 0.6s ease-out 0.3s both',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(20px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: mode === 'dark'
                ? 'radial-gradient(circle at bottom left, rgba(51, 117, 187, 0.1), transparent 70%)'
                : 'radial-gradient(circle at bottom left, rgba(51, 117, 187, 0.05), transparent 70%)',
              zIndex: 0,
            }
          }}
        >
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              color: mode === 'dark' ? theme.palette.primary.main : '#000',
              textShadow: mode === 'dark' ? '0 0 1px rgba(51, 117, 187, 0.2)' : 'none',
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 4,
                height: 24,
                backgroundColor: mode === 'dark' ? theme.palette.primary.main : '#000',
                marginRight: 1.5,
                borderRadius: 4,
                boxShadow: mode === 'dark' ? '0 0 8px rgba(51, 117, 187, 0.5)' : 'none',
              }
            }}
          >
            Estimated Returns
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  textAlign: 'center',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(51, 117, 187, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(51, 117, 187, 0.05) 0%, transparent 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-5px)',
                    boxShadow: mode === 'dark'
                      ? '0 8px 20px rgba(0,0,0,0.1)'
                      : '0 8px 20px rgba(0,0,0,0.05)',
                    '&::before': {
                      opacity: 1,
                    }
                  },
                  animation: 'fadeInStagger 0.5s ease-out forwards',
                  animationDelay: '0.3s',
                  '@keyframes fadeInStagger': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                    fontWeight: 'medium',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Daily Return
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                  }}
                >
                  {formatCurrency(returns.daily)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  textAlign: 'center',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(51, 117, 187, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(51, 117, 187, 0.05) 0%, transparent 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-5px)',
                    boxShadow: mode === 'dark'
                      ? '0 8px 20px rgba(0,0,0,0.1)'
                      : '0 8px 20px rgba(0,0,0,0.05)',
                    '&::before': {
                      opacity: 1,
                    }
                  },
                  animation: 'fadeInStagger 0.5s ease-out forwards',
                  animationDelay: '0.3s',
                  '@keyframes fadeInStagger': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                    fontWeight: 'medium',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Monthly Return
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                  }}
                >
                  {formatCurrency(returns.monthly)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box
                 sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  textAlign: 'center',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(51, 117, 187, 0.1) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(51, 117, 187, 0.05) 0%, transparent 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-5px)',
                    boxShadow: mode === 'dark'
                      ? '0 8px 20px rgba(0,0,0,0.1)'
                      : '0 8px 20px rgba(0,0,0,0.05)',
                    '&::before': {
                      opacity: 1,
                    }
                  },
                  animation: 'fadeInStagger 0.5s ease-out forwards',
                  animationDelay: '0.3s',
                  '@keyframes fadeInStagger': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  }
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                    fontWeight: 'medium',
                    display: 'block',
                    mb: 1,
                  }}
                >
                  Yearly Return
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: mode === 'dark' ? theme.palette.primary.main : '#000',
                  }}
                >
                  {formatCurrency(returns.yearly)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
              }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Action Button */}
        <Box
          sx={{
            mt: 'auto',
            position: 'relative',
            animation: 'fadeIn 0.6s ease-out 0.4s both',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            }
          }}
        >
          {/* Animated gradient border */}
          <Box
            sx={{
              position: 'absolute',
              top: -3,
              left: -3,
              right: -3,
              bottom: -3,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #3375BB, #2A5F9E, #3375BB)',
              backgroundSize: '200% 200%',
              animation: 'gradient 2s ease infinite',
              opacity: 0.7,
              filter: 'blur(8px)',
              '@keyframes gradient': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
              zIndex: 0,
            }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!amount || !selectedPlan || investmentLoading}
            sx={{
              py: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              backgroundColor: '#3375BB',
              backgroundImage: 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              boxShadow: '0 10px 20px rgba(51, 117, 187, 0.3)',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                backgroundColor: '#2A5F9E',
                transform: 'translateY(-3px)',
                boxShadow: '0 15px 30px rgba(51, 117, 187, 0.4)',
              },
              '&:active': {
                transform: 'translateY(-1px)',
                boxShadow: '0 5px 15px rgba(51, 117, 187, 0.4)',
              },
              '&.Mui-disabled': {
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              }
            }}
          >
            {investmentLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'inherit',
                    mr: 1,
                    animation: 'spin 1s linear infinite, pulse-opacity 2s ease-in-out infinite',
                    '@keyframes pulse-opacity': {
                      '0%': { opacity: 0.6 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.6 },
                    },
                  }}
                />
                Processing...
              </Box>
            ) : (
              <>
                Buy {selectedPlan?.title || 'Package'}
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    ml: 1,
                    animation: 'bounce 1s infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateX(0)' },
                      '50%': { transform: 'translateX(5px)' },
                    }
                  }}
                >
                  →
                </Box>
              </>
            )}
          </Button>
        </Box>
      </Box>

      {/* Enhanced Confirmation Dialog */}
      {showConfirmation && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            animation: 'fadeIn 0.3s ease-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            }
          }}
          onClick={handleCancelConfirmation}
        >
          <Paper
            sx={{
              width: '100%',
              maxWidth: 420,
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.4s ease-out',
              '@keyframes slideUp': {
                '0%': { transform: 'translateY(50px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              },
              position: 'relative',
              overflow: 'hidden',
              border: mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background gradient */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: 'linear-gradient(90deg, #3375BB, #2A5F9E)',
              }}
            />

            <Box sx={{ position: 'relative' }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(51, 117, 187, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(51, 117, 187, 0.4)' },
                      '70%': { boxShadow: '0 0 0 15px rgba(51, 117, 187, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(51, 117, 187, 0)' },
                    }
                  }}
                >
                  <ShoppingCartIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  gutterBottom
                  sx={{ color: theme.palette.primary.main }}
                >
                  Confirm Purchase
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please review your investment details before confirming
                </Typography>
              </Box>

              <Divider sx={{ my: 2, borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

              {/* Investment Details */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(245, 247, 250, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
                  animation: 'fadeIn 0.5s ease-out',
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Package
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: mode === 'dark' ? '#fff' : '#000' }}
                    >
                      {selectedPlan?.title}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Investment Amount
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: theme.palette.primary.main }}
                    >
                      {formatCurrency(parseFloat(amount))}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Daily ROI
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: mode === 'dark' ? '#fff' : '#000' }}
                    >
                      {selectedPlan?.percentage / 100}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Daily Return
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: theme.palette.primary.main }}
                    >
                      {formatCurrency(returns.daily)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Total Summary */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? 'rgba(51, 117, 187, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${mode === 'dark' ? 'rgba(51, 117, 187, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`,
                  boxShadow: mode === 'dark' ? '0 4px 12px rgba(51, 117, 187, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.03)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(51, 117, 187, 0.2) 0%, transparent 100%)'
                      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%)',
                    zIndex: 0,
                  },
                  animation: 'fadeIn 0.5s ease-out 0.2s both',
                  '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  Total Investment
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: theme.palette.primary.main }}
                >
                  {formatCurrency(parseFloat(amount))}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCancelConfirmation}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    color: mode === 'dark' ? '#fff' : '#000',
                    '&:hover': {
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleConfirmInvestment}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#3375BB',
                    backgroundImage: 'linear-gradient(135deg, #3375BB 0%, #2A5F9E 100%)',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 16px rgba(51, 117, 187, 0.3)',
                    '&:hover': {
                      backgroundColor: '#2A5F9E',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 20px rgba(51, 117, 187, 0.4)',
                    },
                  }}
                >
                  {investmentLoading ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    'Confirm Purchase'
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default BuyPackage;
