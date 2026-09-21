import { createTheme } from '@mui/material';
import { brandColors } from './tokens';

export const theme = createTheme({
  palette: {
    primary: {
      main: brandColors.primaryGreen,
      light: brandColors.lightGreen,
      dark: brandColors.darkGreen,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: brandColors.orange,
      light: brandColors.lightOrange,
      dark: '#E05D00',
      contrastText: '#FFFFFF',
    },
    info: {
      main: brandColors.blueAccent,
      light: brandColors.lightBlue,
      dark: '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    success: {
      main: brandColors.success,
      light: brandColors.successLight,
      dark: '#15803D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: brandColors.warning,
      light: brandColors.warningLight,
      dark: '#D97706',
    },
    error: {
      main: brandColors.error,
      light: brandColors.errorLight,
      dark: '#B91C1C',
    },
    background: {
      default: brandColors.adminBg,
      paper: brandColors.white,
    },
    text: {
      primary: brandColors.primaryText,
      secondary: brandColors.secondaryText,
    },
    divider: brandColors.border,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, color: brandColors.primaryText },
    h2: { fontWeight: 800, color: brandColors.primaryText },
    h3: { fontWeight: 800, color: brandColors.primaryText },
    h4: { fontWeight: 800, color: brandColors.primaryText },
    h5: { fontWeight: 700, color: brandColors.primaryText },
    h6: { fontWeight: 700, color: brandColors.primaryText },
    body1: { color: brandColors.primaryText, fontSize: '0.95rem' },
    body2: { color: brandColors.secondaryText, fontSize: '0.85rem' },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 700,
          boxShadow: 'none',
          padding: '8px 18px',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(8, 127, 91, 0.2)',
          },
        },
        containedPrimary: {
          backgroundColor: brandColors.primaryGreen,
          '&:hover': {
            backgroundColor: brandColors.darkGreen,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backgroundColor: '#FFFFFF',
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 4px 20px rgba(20, 33, 61, 0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(20, 33, 61, 0.04)',
          border: `1px solid ${brandColors.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${brandColors.border}`,
          padding: '16px 20px',
        },
        head: {
          color: brandColors.secondaryText,
          fontWeight: 700,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
  },
});

export default theme;
