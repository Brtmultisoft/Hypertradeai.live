import { createTheme } from '@mui/material/styles';

// Binance-inspired color palette - Updated to match main theme
const colors = {
  primary: {
    main: '#F0B90B', // Binance Gold - Primary brand color
    light: '#FCD535', // Lighter gold for hover states
    dark: '#D4A200', // Darker gold for pressed states
    contrastText: '#000000', // Black text on gold background
  },
  secondary: {
    main: '#0ECB81', // Binance Green (Profit/Success)
    light: '#3FE1A0',
    dark: '#0BA572',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#F6465D', // Binance Red (Loss/Warning)
    light: '#FF7A8A',
    dark: '#D93D52',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F0B90B', // Binance Gold for warnings
    light: '#FCD535',
    dark: '#D4A200',
    contrastText: '#000000',
  },
  info: {
    main: '#F0B90B', // Binance Gold for info
    light: '#FCD535',
    dark: '#D4A200',
    contrastText: '#000000',
  },
  success: {
    main: '#0ECB81', // Binance Green
    light: '#3FE1A0',
    dark: '#0BA572',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0B0E11', // Deep black background
    paper: '#1E2329', // Dark card/paper background
    light: '#2B3139', // Secondary background
  },
  text: {
    primary: '#FFFFFF', // White primary text
    secondary: '#B7BDC6', // Light gray secondary text
    disabled: '#5E6673',
  },
  divider: '#2B3139',
  action: {
    active: '#F0B90B', // Gold for active states
    hover: 'rgba(240, 185, 11, 0.08)', // Gold hover with transparency
    selected: 'rgba(240, 185, 11, 0.16)', // Gold selected with transparency
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
  },
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
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.divider}`,
          borderRadius: 8,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: colors.background.light,
          },
        },
      },
    },
  },
});

export default theme;
