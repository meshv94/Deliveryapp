import { createTheme } from '@mui/material';
import { getDesignTokens } from './tokens';

export const createAppTheme = (mode = 'light') => {
  const colors = getDesignTokens(mode);
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primaryGreen,
        light: colors.lightGreen,
        dark: colors.darkGreen,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: colors.orange,
        light: colors.lightOrange,
        dark: '#E05D00',
        contrastText: '#FFFFFF',
      },
      info: {
        main: colors.blueAccent,
        light: colors.lightBlue,
        dark: '#1D4ED8',
        contrastText: '#FFFFFF',
      },
      success: {
        main: colors.success,
        light: colors.successLight,
        dark: '#15803D',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: colors.warning,
        light: colors.warningLight,
        dark: '#D97706',
      },
      error: {
        main: colors.error,
        light: colors.errorLight,
        dark: '#B91C1C',
      },
      background: {
        default: colors.adminBg,
        paper: colors.white,
      },
      text: {
        primary: colors.primaryText,
        secondary: colors.secondaryText,
      },
      divider: colors.border,
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 800, color: colors.primaryText },
      h2: { fontWeight: 800, color: colors.primaryText },
      h3: { fontWeight: 800, color: colors.primaryText },
      h4: { fontWeight: 800, color: colors.primaryText },
      h5: { fontWeight: 700, color: colors.primaryText },
      h6: { fontWeight: 700, color: colors.primaryText },
      body1: { color: colors.primaryText, fontSize: '0.95rem' },
      body2: { color: colors.secondaryText, fontSize: '0.85rem' },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.adminBg,
            color: colors.primaryText,
            transition: 'background-color 0.25s ease, color 0.25s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colors.white,
            backgroundImage: 'none',
            transition: 'background-color 0.25s ease, border-color 0.25s ease',
          },
          elevation0: {
            backgroundImage: 'none',
          },
          elevation1: {
            backgroundColor: colors.white,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(20, 33, 61, 0.04)',
            border: `1px solid ${colors.border}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
            padding: '8px 18px',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${colors.border}`,
            color: colors.primaryText,
          },
          head: {
            color: colors.secondaryText,
            fontWeight: 700,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            backgroundColor: isDark ? '#1C2541' : '#F8FAFC',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1C2541' : '#FFFFFF',
            '& fieldset': {
              borderColor: colors.border,
            },
            '&:hover fieldset': {
              borderColor: isDark ? '#475569' : '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primaryGreen,
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.white,
            backgroundImage: 'none',
            border: `1px solid ${colors.border}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.white,
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

export const theme = createAppTheme('light');
export default theme;
