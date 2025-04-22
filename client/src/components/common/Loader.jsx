import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

const Loader = ({ text = 'Loading...', fullPage = false, size = 40 }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullPage ? '100vh' : '100%',
        width: '100%',
        p: 4,
      }}
    >
      <CircularProgress
        size={size}
        sx={{ color: theme.palette.primary.main }}
      />
      {text && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default Loader;
