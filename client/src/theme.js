import { createTheme } from '@mui/material/styles';

// Binance-inspired color palette
const colors = {
  primary: {
    main: '#FCD535', // Primary Yellow
    light: '#FFDF6B',
    dark: '#E1B000',
    contrastText: '#000000',
  },
  secondary: {
    main: '#0ECB81', // Green (Profit/Success)
    light: '#3FE1A0',
    dark: '#0A9F65',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#F6465D', // Red (Loss/Warning)
    light: '#FF7A8A',
    dark: '#C41E35',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0B0E11', // Dark Gray / Background
    paper: '#1E2329',
    light: '#2B3139',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B7BDC6',
    disabled: '#5E6673',
  },
  divider: '#2B3139',
};

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'dark',
    ...colors,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: colors.primary.light,
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: colors.secondary.light,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          borderRadius: 8,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.divider}`,
        },
        head: {
          fontWeight: 600,
          backgroundColor: colors.background.light,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: colors.background.light,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.paper,
          borderRight: `1px solid ${colors.divider}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
          boxShadow: `0px 1px 0px ${colors.divider}`,
        },
      },
    },
  },
});

export default theme;
