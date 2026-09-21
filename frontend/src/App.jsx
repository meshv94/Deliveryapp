import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import { CartProvider } from './context/CartContext';
import VendorListPage from './pages/VendorListPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AddressPage from './pages/AddressPage';
import MyOrdersPage from './pages/MyOrdersPage';
import HomePage from './pages/HomePage';
import ModulesPage from './pages/ModulesPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';

// AapnuBazaar Design System Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#087F5B',
      light: '#099268',
      dark: '#075B43',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B00',
      light: '#FF922B',
      dark: '#E8590C',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#087F5B',
      light: '#EBFBEE',
    },
    warning: {
      main: '#FF6B00',
      light: '#FFF4E6',
    },
    error: {
      main: '#E03131',
      light: '#FFF5F5',
    },
    background: {
      default: '#FAFAF7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#151515',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem', // 48px
      letterSpacing: '-0.025em',
      lineHeight: 1.15,
      color: '#151515',
      '@media (min-width:900px)': {
        fontSize: '3.75rem', // 60px
      },
    },
    h2: {
      fontWeight: 800,
      fontSize: '2rem', // 32px
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      color: '#151515',
      '@media (min-width:900px)': {
        fontSize: '2.5rem', // 40px
      },
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem', // 24px
      letterSpacing: '-0.015em',
      color: '#151515',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.25rem', // 20px
      letterSpacing: '-0.01em',
      color: '#151515',
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.125rem', // 18px
      color: '#151515',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem', // 16px
      color: '#151515',
    },
    body1: {
      fontSize: '1rem', // 16px
      lineHeight: 1.6,
      color: '#151515',
    },
    body2: {
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
      color: '#6B7280',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.9375rem', // 15px
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 18px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(8, 127, 91, 0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          backgroundColor: '#087F5B',
          '&:hover': {
            backgroundColor: '#075B43',
          },
        },
        containedSecondary: {
          backgroundColor: '#FF6B00',
          '&:hover': {
            backgroundColor: '#E8590C',
          },
        },
        outlined: {
          borderColor: '#E5E7EB',
          color: '#151515',
          '&:hover': {
            borderColor: '#087F5B',
            backgroundColor: '#EBFBEE',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: '16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filledPrimary: {
          backgroundColor: '#EBFBEE',
          color: '#087F5B',
        },
        filledSecondary: {
          backgroundColor: '#FFF4E6',
          color: '#FF6B00',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: '#087F5B',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#087F5B',
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <Router>
          <Routes>
            {/* Standalone Login Screen */}
            <Route path="/login" element={<LoginPage />} />

            {/* Application routes wrapped with Layout */}
            <Route
              path="*"
              element={
                <Layout>
                  <Routes>
                    {/* Home / Marketplace Landing Page */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/modules" element={<ModulesPage />} />

                    {/* Store Discovery */}
                    <Route path="/vendors" element={<VendorListPage />} />

                    {/* Store Details & Product Menu */}
                    <Route path="/vendors/:vendorId" element={<VendorDetailsPage />} />

                    {/* Cart & Checkout */}
                    <Route path="/cart" element={<CartPage />} />

                    {/* User Profile & Saved Addresses */}
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/address" element={<AddressPage />} />

                    {/* Order History */}
                    <Route path="/my-orders" element={<MyOrdersPage />} />

                    {/* Stripe Payment Callback */}
                    <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
