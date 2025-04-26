import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';

const AuthLayout = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        backgroundImage: 'linear-gradient(rgba(11, 14, 17, 0.9), rgba(11, 14, 17, 0.9)), url(/auth-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center' }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
          }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="HypeTrade AI"
              sx={{ height: 60 }}
            />
            <Typography
              variant="h5"
              component="h1"
              sx={{ mt: 2, color: theme.palette.primary.main, fontWeight: 'bold' }}
            >
              HypeTrade AI
            </Typography>
          </Box>

          {/* Auth Form Content */}
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
