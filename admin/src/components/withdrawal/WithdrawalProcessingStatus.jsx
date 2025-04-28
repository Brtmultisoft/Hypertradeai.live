import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Divider,
  useTheme,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const WithdrawalProcessingStatus = ({
  txHash,
  onClose,
  amount,
  fee,
  netAmount
}) => {
  const theme = useTheme();

  // Get blockchain explorer URL
  const getExplorerUrl = () => {
    return `https://bscscan.com/tx/${txHash}`;
  };

  // Open transaction in BSCScan
  const viewOnBscScan = () => {
    window.open(getExplorerUrl(), '_blank');
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Withdrawal Processed Successfully
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Success Message */}
      <Alert
        severity="success"
        icon={<CheckCircleIcon fontSize="inherit" />}
        sx={{ mb: 3 }}
      >
        Your withdrawal request has been approved and processed successfully.
      </Alert>

      {/* Amount Information */}
      {amount && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.background.neutral,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {parseFloat(amount).toFixed(2)} USDT
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Network Fee (10%):
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">
                {fee ? parseFloat(fee).toFixed(2) : (parseFloat(amount) * 0.1).toFixed(2)} USDT
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Net Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {netAmount ? parseFloat(netAmount).toFixed(2) : (parseFloat(amount) * 0.9).toFixed(2)} USDT
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Transaction Information */}
      {txHash && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: theme.palette.background.neutral,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Transaction Hash:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                mr: 1,
                flex: 1
              }}
            >
              {txHash}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityIcon />}
              onClick={viewOnBscScan}
            >
              View on BSCScan
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary">
            The transaction has been submitted to the blockchain. You can view the details by clicking the button above.
          </Typography>
        </Paper>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="success"
        >
          Done
        </Button>
      </Box>
    </Box>
  );
};

export default WithdrawalProcessingStatus;
