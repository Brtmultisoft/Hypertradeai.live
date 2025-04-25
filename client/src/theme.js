import { createTheme } from '@mui/material/styles';

// Trust Wallet exact color palettes
const darkColors = {
    primary: {
        main: '#3375BB', // Trust Blue - Primary brand color
        light: '#4A8AD4',
        dark: '#2A5F9E',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#0ECB81', // Trust Green - Success actions
        light: '#3FE1A0',
        dark: '#0BA572',
        contrastText: '#FFFFFF',
    },
    info: {
        main: '#3375BB', // Trust Blue for info
        light: '#4A8AD4',
        dark: '#2A5F9E',
        contrastText: '#FFFFFF',
    },
    success: {
        main: '#0ECB81', // Trust Green
        light: '#3FE1A0',
        dark: '#0BA572',
        contrastText: '#FFFFFF',
    },
    warning: {
        main: '#F0B90B', // Trust Yellow - Warning actions
        light: '#F8CF4D',
        dark: '#D4A200',
        contrastText: '#FFFFFF',
    },
    error: {
        main: '#F6465D', // Trust Red - Error/Danger actions
        light: '#FF7A8A',
        dark: '#D93D52',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#0B0E11', // Trust Dark Background
        paper: '#1E2329', // Trust Dark Card/Paper
        light: '#2B3139', // Trust Dark Secondary Background
        card: '#1E2329',
        actionButton: '#2B3139',
        highlight: '#2B3139', // Highlighted areas
    },
    text: {
        primary: '#FFFFFF',
        secondary: '#848E9C', // Trust Wallet secondary text
        disabled: '#5E6673',
        hint: '#848E9C',
    },
    divider: '#2B3139',
    action: {
        active: '#3375BB',
        hover: 'rgba(51, 117, 187, 0.08)',
        selected: 'rgba(51, 117, 187, 0.16)',
        disabled: 'rgba(255, 255, 255, 0.3)',
        disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
};

const lightColors = {
    primary: {
        main: '#3375BB', // Trust Blue - Primary brand color
        light: '#4A8AD4',
        dark: '#2A5F9E',
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#0ECB81', // Trust Green - Success actions
        light: '#3FE1A0',
        dark: '#0BA572',
        contrastText: '#FFFFFF',
    },
    info: {
        main: '#3375BB', // Trust Blue for info
        light: '#4A8AD4',
        dark: '#2A5F9E',
        contrastText: '#FFFFFF',
    },
    success: {
        main: '#0ECB81', // Trust Green
        light: '#3FE1A0',
        dark: '#0BA572',
        contrastText: '#FFFFFF',
    },
    warning: {
        main: '#F0B90B', // Trust Yellow - Warning actions
        light: '#F8CF4D',
        dark: '#D4A200',
        contrastText: '#FFFFFF',
    },
    error: {
        main: '#F6465D', // Trust Red - Error/Danger actions
        light: '#FF7A8A',
        dark: '#D93D52',
        contrastText: '#FFFFFF',
    },
    background: {
        default: '#F5F7FA', // Trust Light Background
        paper: '#FFFFFF', // Trust Light Card/Paper
        light: '#F8FAFD', // Trust Light Secondary Background
        card: '#FFFFFF',
        actionButton: '#F5F7FA',
        highlight: '#F8FAFD', // Highlighted areas
    },
    text: {
        primary: '#1E2329', // Trust Wallet primary text
        secondary: '#707A8A', // Trust Wallet secondary text
        disabled: '#AEB4BC',
        hint: '#707A8A',
    },
    divider: '#E6E8EA', // Trust Wallet light divider
    action: {
        active: '#3375BB',
        hover: 'rgba(51, 117, 187, 0.08)',
        selected: 'rgba(51, 117, 187, 0.16)',
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
};

// Create theme instances for dark and light modes
const createAppTheme = (mode) => {
    const colors = mode === 'dark' ? darkColors : lightColors;

    return createTheme({
        palette: {
            mode,
            ...colors,
        },
        shape: {
            borderRadius: 12, // Trust Wallet uses rounded corners
        },
        typography: {
            fontFamily: '"SF Pro Display", "Inter", "Roboto", "Helvetica", "Arial", sans-serif', // Trust Wallet uses SF Pro
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 500,
            fontWeightBold: 600,
            h1: {
                fontWeight: 700,
                fontSize: '2.5rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            h2: {
                fontWeight: 700,
                fontSize: '2rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            h3: {
                fontWeight: 600,
                fontSize: '1.75rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            h4: {
                fontWeight: 600,
                fontSize: '1.5rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            h5: {
                fontWeight: 600,
                fontSize: '1.25rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            h6: {
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
            },
            subtitle1: {
                fontWeight: 500,
                fontSize: '1rem',
                lineHeight: 1.5,
                letterSpacing: '-0.01em',
            },
            subtitle2: {
                fontWeight: 500,
                fontSize: '0.875rem',
                lineHeight: 1.5,
                letterSpacing: '-0.01em',
            },
            body1: {
                fontWeight: 400,
                fontSize: '1rem',
                lineHeight: 1.5,
            },
            body2: {
                fontWeight: 400,
                fontSize: '0.875rem',
                lineHeight: 1.5,
            },
            button: {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '-0.01em',
            },
            caption: {
                fontWeight: 400,
                fontSize: '0.75rem',
                lineHeight: 1.5,
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: colors.background.default,
                        scrollbarWidth: 'thin',
                        '&::-webkit-scrollbar': {
                            width: '6px',
                            height: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: mode === 'dark' ? '#1E2329' : '#F5F7FA',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: mode === 'dark' ? '#2B3139' : '#E6E8EA',
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: mode === 'dark' ? '#3C424C' : '#AEB4BC',
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none',
                        padding: '8px 16px',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: 'none',
                            transform: 'translateY(-1px)',
                        },
                        '&:active': {
                            transform: 'translateY(1px)',
                        },
                    },
                    containedPrimary: {
                        background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`,
                        },
                    },
                    containedSecondary: {
                        background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.dark} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${colors.secondary.light} 0%, ${colors.secondary.main} 100%)`,
                        },
                    },
                    outlined: {
                        borderWidth: '1px',
                        '&:hover': {
                            borderWidth: '1px',
                        },
                    },
                    sizeLarge: {
                        padding: '12px 24px',
                        fontSize: '1rem',
                    },
                    sizeSmall: {
                        padding: '4px 12px',
                        fontSize: '0.75rem',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.background.card,
                        borderRadius: 16,
                        boxShadow: mode === 'dark' ?
                            '0px 4px 12px rgba(0, 0, 0, 0.2)' : '0px 4px 12px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: mode === 'dark' ?
                                '0px 8px 24px rgba(0, 0, 0, 0.3)' : '0px 8px 24px rgba(0, 0, 0, 0.1)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: colors.background.paper,
                        backgroundImage: 'none',
                    },
                    elevation1: {
                        boxShadow: mode === 'dark' ?
                            '0px 2px 8px rgba(0, 0, 0, 0.2)' : '0px 2px 8px rgba(0, 0, 0, 0.05)',
                    },
                    elevation2: {
                        boxShadow: mode === 'dark' ?
                            '0px 4px 12px rgba(0, 0, 0, 0.2)' : '0px 4px 12px rgba(0, 0, 0, 0.05)',
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: `1px solid ${colors.divider}`,
                        padding: '16px',
                    },
                    head: {
                        fontWeight: 600,
                        backgroundColor: colors.background.light,
                        color: colors.text.secondary,
                    },
                },
            },
            MuiTableRow: {
                styleOverrides: {
                    root: {
                        '&:hover': {
                            backgroundColor: colors.background.highlight,
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
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: 100,
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                            color: colors.primary.main,
                        },
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: {
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: colors.primary.main,
                    },
                    root: {
                        minHeight: 48,
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            '& fieldset': {
                                borderColor: colors.divider,
                            },
                            '&:hover fieldset': {
                                borderColor: mode === 'dark' ? colors.primary.light : colors.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: colors.primary.main,
                            },
                        },
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                    input: {
                        padding: '12px 16px',
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: mode === 'dark' ? colors.primary.light : colors.primary.main,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.primary.main,
                            borderWidth: 2,
                        },
                    },
                    notchedOutline: {
                        borderColor: colors.divider,
                    },
                },
            },
        },
    });
};

// Export theme creation function
export { createAppTheme };

// Default theme (dark mode)
const theme = createAppTheme('dark');
export default theme;