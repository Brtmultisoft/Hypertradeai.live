import { useState } from 'react';
import { Box, Button, Typography, Alert, Paper } from '@mui/material';
import useAuth from '../../hooks/useAuth';
import AuthService from '../../services/auth.service';

const TwoFATest = () => {
  const { user } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Test login with a user that has 2FA enabled
      const response = await AuthService.login('test@example.com', 'password123');
      
      if (response.success && response.userData && response.userData.requires_2fa_verification) {
        setTestResult({
          success: true,
          message: '✅ 2FA is working! OTP sent to email.',
          data: response.userData
        });
      } else if (response.success) {
        setTestResult({
          success: true,
          message: '✅ Login successful (no 2FA required)',
          data: response.userData
        });
      } else {
        setTestResult({
          success: false,
          message: '❌ Login failed: ' + response.error
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const test2FAToggle = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      // Test enabling 2FA
      const response = await AuthService.toggle2FAMethod('otpless');
      
      if (response.status) {
        setTestResult({
          success: true,
          message: '✅ 2FA toggle working! Method set to OTPless.',
          data: response.data
        });
      } else {
        setTestResult({
          success: false,
          message: '❌ 2FA toggle failed: ' + response.msg
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: '❌ Error: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        2FA System Test
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current User: {user?.email || 'Not logged in'}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={test2FAToggle}
          disabled={loading || !user}
        >
          Test 2FA Toggle
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={testLogin}
          disabled={loading}
        >
          Test Login Flow
        </Button>
      </Box>

      {testResult && (
        <Alert 
          severity={testResult.success ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            {testResult.message}
          </Typography>
          {testResult.data && (
            <Typography variant="caption" component="pre" sx={{ mt: 1, display: 'block' }}>
              {JSON.stringify(testResult.data, null, 2)}
            </Typography>
          )}
        </Alert>
      )}
    </Paper>
  );
};

export default TwoFATest;
