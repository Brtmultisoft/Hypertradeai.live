import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const PageHeader = ({ title, subtitle, action }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}
    >
      <Box>
        <Typography 
          variant="h5" 
          component="h1" 
          fontWeight="bold"
          color="text.primary"
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {action && (
        <Box>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
