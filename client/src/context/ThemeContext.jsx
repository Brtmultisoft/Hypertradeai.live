import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createAppTheme } from '../theme';
import CssBaseline from '@mui/material/CssBaseline';

// Create context
const ThemeContext = createContext({
  mode: 'dark',
  toggleTheme: () => {},
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize theme mode from localStorage or default to 'dark'
  const [mode, setMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('theme-mode');
      const initialMode = savedMode && (savedMode === 'light' || savedMode === 'dark') ? savedMode : 'dark';
      console.log('🎨 Theme loaded from localStorage:', initialMode);
      return initialMode;
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return 'dark';
    }
  });

  // Save theme mode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('theme-mode', mode);
      console.log('💾 Theme saved to localStorage:', mode);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [mode]);

  // Toggle theme function
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Context value
  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
