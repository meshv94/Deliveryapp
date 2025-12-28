import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './App.css';
import Layout from './components/Layout';
import { CartProvider } from './context/CartContext';
import VendorListPage from './pages/VendorListPage';
import VendorDetailsPage from './pages/VendorDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AddressPage from './pages/AddressPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ModulesPage from './pages/ModulesPage';

// Create Material UI theme with modern, trustworthy colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8b9dee',
      dark: '#5568d3',
      contrastText: '#fff',
    },
    secondary: {
      main: '#764ba2',
      light: '#8b5db8',
      dark: '#603d87',
      contrastText: '#fff',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    background: {
      default: '#fafafa',
      paper: '#fff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: '8px',
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
            {/* Login/Register Page (without Layout) */}
            <Route path="/login" element={<LoginPage />} />

            {/* All other pages with Layout */}
            <Route path="*" element={
              <Layout>
                <Routes>
                  {/* Home - Modules Selection */}
                  <Route path="/" element={<ModulesPage />} />
                  <Route path="/modules" element={<ModulesPage />} />

                  {/* Vendor Listing */}
                  <Route path="/vendors" element={<VendorListPage />} />

                  {/* Vendor Details & Products */}
                  <Route path="/vendors/:vendorId" element={<VendorDetailsPage />} />

                  {/* Cart */}
                  <Route path="/cart" element={<CartPage />} />

                  {/* Profile */}
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Address */}
                  <Route path="/address" element={<AddressPage />} />

                  {/* My Orders */}
                  <Route path="/my-orders" element={<MyOrdersPage />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
