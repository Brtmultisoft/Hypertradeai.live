import { Box, Button, Typography, useTheme } from '@mui/material';
import { Link } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: { xs: '6rem', md: '10rem' },
          fontWeight: 700,
          color: theme.palette.primary.main,
          mb: 2,
        }}
      >
        404
      </Typography>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          mb: 3,
          fontWeight: 600,
        }}
      >
        Page Not Found
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 4,
          maxWidth: 500,
          color: theme.palette.text.secondary,
        }}
      >
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </Typography>
      <Button
        component={Link}
        to="/dashboard"
        variant="contained"
        color="primary"
        size="large"
        startIcon={<HomeIcon />}
        sx={{ py: 1.2, px: 3 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
