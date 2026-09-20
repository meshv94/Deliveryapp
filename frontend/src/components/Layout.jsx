import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  IconButton,
  Badge,
  Stack,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Button,
  Avatar,
  Grid,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartTotals } = useCartContext();
  const { totalItems } = getCartTotals();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Read logged in user if available
  const userData = (() => {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch {
      return {};
    }
  })();

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('deliveryCart');
    setDrawerOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: <HomeOutlinedIcon fontSize="small" /> },
    { label: 'Shops', path: '/vendors', icon: <StorefrontOutlinedIcon fontSize="small" /> },
    { label: 'Categories', path: '/modules', icon: <AppsOutlinedIcon fontSize="small" /> },
    { label: 'Offers', path: '/#offers', isAnchor: true, icon: <LocalOfferOutlinedIcon fontSize="small" /> },
  ];

  const handleNavClick = (link) => {
    if (link.isAnchor) {
      if (location.pathname === '/') {
        const el = document.getElementById('offers');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      navigate('/#offers');
      return;
    }
    navigate(link.path);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FAFAF7' }}>
      {/* Top Banner Notice (Optional subtle local notice) */}
      <Box
        sx={{
          backgroundColor: '#075B43',
          color: '#FFFFFF',
          py: 0.6,
          px: 2,
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <span>🌱 AapnuBazaar: 100% Fresh Local Groceries, Food & Essentials Delivered in Minutes</span>
      </Box>

      {/* Main Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.04)' : 'none',
          transition: 'box-shadow 0.2s ease',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              px: { xs: 0.5, sm: 1 },
              py: { xs: 0.5, sm: 1 },
              minHeight: { xs: 58, sm: 66 },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* ── MOBILE HEADER (Menu | Logo | Cart | Profile) ── */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              {/* Left: Menu & Brand Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={toggleDrawer(true)}
                  aria-label="Open navigation menu"
                  sx={{
                    width: 44,
                    height: 44,
                    color: '#151515',
                    mr: 0.5,
                  }}
                >
                  <MenuIcon />
                </IconButton>

                <Box
                  onClick={() => navigate('/')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      backgroundColor: '#EBFBEE',
                      p: 0.4,
                      mr: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src="/aapnubazaar-logo.png"
                      alt="AapnuBazaar"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#087F5B' }}>Aapnu</span>
                    <span style={{ color: '#FF6B00' }}>Bazaar</span>
                  </Typography>
                </Box>
              </Box>

              {/* Right: Cart & Profile */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                {/* Mobile Cart */}
                <IconButton
                  onClick={() => navigate('/cart')}
                  aria-label="View Cart"
                  sx={{
                    width: 44,
                    height: 44,
                    color: '#087F5B',
                  }}
                >
                  <Badge
                    badgeContent={totalItems}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#FF6B00',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '10px',
                        height: 18,
                        minWidth: 18,
                      },
                    }}
                  >
                    <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
                  </Badge>
                </IconButton>

                {/* Mobile Profile */}
                <IconButton
                  onClick={() => {
                    if (token) navigate('/profile');
                    else navigate('/login');
                  }}
                  aria-label="Profile"
                  sx={{
                    width: 44,
                    height: 44,
                    color: '#151515',
                  }}
                >
                  <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Stack>
            </Box>

            {/* ── DESKTOP HEADER (Logo | Nav Links | Actions) ── */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              {/* Brand Logo Section */}
              <Box
                onClick={() => navigate('/')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    backgroundColor: '#EBFBEE',
                    p: 0.5,
                    mr: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src="/aapnubazaar-logo.png"
                    alt="AapnuBazaar"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography
                    component="div"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.05,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: '#087F5B' }}>Aapnu</span>
                    <span style={{ color: '#FF6B00' }}>Bazaar</span>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '8.5px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      mt: 0.2,
                    }}
                  >
                    Our Local Marketplace
                  </Typography>
                </Box>
              </Box>

              {/* Desktop Navigation Links */}
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Button
                      key={link.label}
                      onClick={() => handleNavClick(link)}
                      startIcon={link.icon}
                      sx={{
                        color: isActive ? '#087F5B' : '#151515',
                        backgroundColor: isActive ? '#EBFBEE' : 'transparent',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '14px',
                        px: 1.8,
                        py: 0.8,
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: isActive ? '#EBFBEE' : '#F3F4F6',
                          color: '#087F5B',
                        },
                      }}
                    >
                      {link.label}
                    </Button>
                  );
                })}
              </Stack>

              {/* Right Action Icons & Auth */}
              <Stack direction="row" spacing={1.2} alignItems="center">
                {/* Location Selector */}
                <Button
                  onClick={() => {
                    if (token) navigate('/address');
                    else navigate('/vendors');
                  }}
                  startIcon={<LocationOnOutlinedIcon sx={{ color: '#087F5B', fontSize: '18px' }} />}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.6,
                    borderRadius: '8px',
                    backgroundColor: '#FAFAF7',
                    border: '1px solid #E5E7EB',
                    color: '#151515',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#EBFBEE',
                      borderColor: '#087F5B',
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'left', lineHeight: 1.15 }}>
                    <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#6B7280' }}>
                      Deliver to
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#151515',
                        maxWidth: 110,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Surat, Gujarat
                    </Typography>
                  </Box>
                </Button>

                {/* Cart Button with Counter */}
                <Button
                  variant="contained"
                  onClick={() => navigate('/cart')}
                  startIcon={
                    <Badge
                      badgeContent={totalItems}
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#FF6B00',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '11px',
                          height: 18,
                          minWidth: 18,
                        },
                      }}
                    >
                      <ShoppingBagOutlinedIcon sx={{ fontSize: '20px' }} />
                    </Badge>
                  }
                  sx={{
                    backgroundColor: '#087F5B',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    px: 2,
                    py: 0.9,
                    fontSize: '14px',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: '#075B43',
                    },
                  }}
                >
                  Cart
                </Button>

                {/* Login / Profile CTA */}
                {token ? (
                  <IconButton
                    onClick={toggleDrawer(true)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      color: '#151515',
                      '&:hover': {
                        backgroundColor: '#EBFBEE',
                        color: '#087F5B',
                        borderColor: '#087F5B',
                      },
                    }}
                  >
                    <PersonOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    sx={{
                      borderColor: '#E5E7EB',
                      color: '#151515',
                      borderRadius: '8px',
                      px: 2,
                      py: 0.8,
                      fontSize: '13.5px',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#087F5B',
                        backgroundColor: '#EBFBEE',
                        color: '#087F5B',
                      },
                    }}
                  >
                    Login
                  </Button>
                )}
              </Stack>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Clean Side Navigation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: 290, sm: 340 },
            backgroundColor: '#FFFFFF',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.08)',
          },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#EBFBEE', color: '#087F5B', width: 36, height: 36, fontWeight: 700 }}>
              {userData.name ? userData.name.charAt(0).toUpperCase() : 'A'}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#151515' }}>
                {userData.name || 'AapnuBazaar Customer'}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                {userData.mobile_number ? `+91 ${userData.mobile_number}` : 'Local Marketplace'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={toggleDrawer(false)} size="small" sx={{ color: '#6B7280' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <List sx={{ px: 1.5, py: 2 }}>
          {navLinks.map((item) => (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  setDrawerOpen(false);
                  handleNavClick(item);
                }}
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  backgroundColor: location.pathname === item.path ? '#EBFBEE' : 'transparent',
                  color: location.pathname === item.path ? '#087F5B' : '#151515',
                  '&:hover': {
                    backgroundColor: '#F3F4F6',
                  },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#087F5B' : '#6B7280', minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '14px', fontWeight: location.pathname === item.path ? 700 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}

          <Divider sx={{ my: 1.5 }} />

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setDrawerOpen(false);
                navigate('/my-orders');
              }}
              sx={{ borderRadius: '8px', py: 1 }}
            >
              <ListItemIcon sx={{ color: '#6B7280', minWidth: 38 }}>
                <ReceiptLongOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="My Orders" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setDrawerOpen(false);
                navigate('/address');
              }}
              sx={{ borderRadius: '8px', py: 1 }}
            >
              <ListItemIcon sx={{ color: '#6B7280', minWidth: 38 }}>
                <LocationOnOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Saved Addresses" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setDrawerOpen(false);
                navigate('/profile');
              }}
              sx={{ borderRadius: '8px', py: 1 }}
            >
              <ListItemIcon sx={{ color: '#6B7280', minWidth: 38 }}>
                <PersonOutlineOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                setDrawerOpen(false);
                navigate('/profile');
              }}
              sx={{ borderRadius: '8px', py: 1 }}
            >
              <ListItemIcon sx={{ color: '#6B7280', minWidth: 38 }}>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>

          {token && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    borderRadius: '8px',
                    py: 1,
                    color: '#E03131',
                    '&:hover': { backgroundColor: '#FFF5F5' },
                  }}
                >
                  <ListItemIcon sx={{ color: '#E03131', minWidth: 38 }}>
                    <LogoutOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '14px', fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>

      {/* Main Content View */}
      <Box component="main" sx={{ flexGrow: 1, pb: { xs: 9, md: 0 } }}>
        {children}
      </Box>

      {/* AapnuBazaar Clean Marketplace Footer */}
      <Box
        component="footer"
        sx={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E5E7EB',
          py: { xs: 5, sm: 6 },
          mt: 'auto',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="space-between">
            {/* Brand column */}
            <Grid item xs={12} md={3.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <img
                  src="/aapnubazaar-logo.png"
                  alt="AapnuBazaar"
                  style={{ width: '32px', height: '32px', objectFit: 'contain', marginRight: '10px' }}
                />
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                  <span style={{ color: '#087F5B' }}>Aapnu</span>
                  <span style={{ color: '#FF6B00' }}>Bazaar</span>
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6, maxWidth: 320, mb: 2 }}>
                Our Local Marketplace connecting neighborhood shops with customers for fresh, fast, and authentic products.
              </Typography>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#087F5B' }}>
                📍 Serving Your Neighborhood Daily
              </Typography>
            </Grid>

            {/* Marketplace */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#151515', mb: 2 }}>
                Marketplace
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="/vendors" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Shops
                </Typography>
                <Typography component="a" href="/modules" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Categories
                </Typography>
                <Typography component="a" href="/#offers" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Offers & Deals
                </Typography>
              </Stack>
            </Grid>

            {/* For Customers */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#151515', mb: 2 }}>
                For Customers
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="/my-orders" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Orders
                </Typography>
                <Typography component="a" href="/#favorites" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Favorites
                </Typography>
                <Typography component="a" href="/profile" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Help & Support
                </Typography>
              </Stack>
            </Grid>

            {/* For Sellers */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#151515', mb: 2 }}>
                For Sellers
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="http://localhost:5175" target="_blank" rel="noopener noreferrer" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Register Your Shop
                </Typography>
                <Typography component="a" href="http://localhost:5175/login" target="_blank" rel="noopener noreferrer" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Seller Login
                </Typography>
              </Stack>
            </Grid>

            {/* Company */}
            <Grid item xs={6} sm={3} md={2}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#151515', mb: 2 }}>
                Company
              </Typography>
              <Stack spacing={1}>
                <Typography component="a" href="/#about" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  About Us
                </Typography>
                <Typography component="a" href="/#contact" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Contact
                </Typography>
                <Typography component="a" href="/#terms" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Terms & Conditions
                </Typography>
                <Typography component="a" href="/#privacy" sx={{ fontSize: '13.5px', color: '#6B7280', textDecoration: 'none', '&:hover': { color: '#087F5B' } }}>
                  Privacy Policy
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: '#E5E7EB' }} />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '13px', color: '#9CA3AF' }}>
              © {new Date().getFullYear()} AapnuBazaar — Our Local Marketplace. All rights reserved.
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
              Made with ❤️ for local businesses & communities
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* ── MOBILE BOTTOM NAVIGATION (Home | Shops | Orders | Favorites | Profile) ── */}
      <Box
        component="nav"
        aria-label="Mobile Navigation"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E5E7EB',
          boxShadow: '0 -2px 14px rgba(0, 0, 0, 0.08)',
          px: 0.5,
          py: 0.5,
          pb: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {[
          {
            label: 'Home',
            path: '/',
            icon: <HomeOutlinedIcon sx={{ fontSize: 22 }} />,
            activeIcon: <HomeIcon sx={{ fontSize: 22 }} />,
            isActive: location.pathname === '/',
            onClick: () => navigate('/'),
          },
          {
            label: 'Shops',
            path: '/vendors',
            icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} />,
            activeIcon: <StorefrontIcon sx={{ fontSize: 22 }} />,
            isActive: location.pathname === '/vendors' && !location.search.includes('favorites'),
            onClick: () => navigate('/vendors'),
          },
          {
            label: 'Orders',
            path: '/my-orders',
            icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 22 }} />,
            activeIcon: <ReceiptLongIcon sx={{ fontSize: 22 }} />,
            isActive: location.pathname === '/my-orders',
            onClick: () => {
              if (token) navigate('/my-orders');
              else navigate('/login');
            },
          },
          {
            label: 'Favorites',
            path: '/vendors?filter=favorites',
            icon: <FavoriteBorderOutlinedIcon sx={{ fontSize: 22 }} />,
            activeIcon: <FavoriteIcon sx={{ fontSize: 22 }} />,
            isActive: location.search.includes('favorites'),
            onClick: () => navigate('/vendors?filter=favorites'),
          },
          {
            label: 'Profile',
            path: token ? '/profile' : '/login',
            icon: <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
            activeIcon: <PersonIcon sx={{ fontSize: 22 }} />,
            isActive: location.pathname === '/profile' || location.pathname === '/login',
            onClick: () => {
              if (token) navigate('/profile');
              else navigate('/login');
            },
          },
        ].map((item) => (
          <Box
            key={item.label}
            onClick={item.onClick}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 54,
              minHeight: 46,
              py: 0.3,
              px: 0.5,
              cursor: 'pointer',
              color: item.isActive ? '#087F5B' : '#6B7280',
              transition: 'all 0.15s ease',
              borderRadius: '8px',
              userSelect: 'none',
              '&:active': { transform: 'scale(0.92)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.isActive ? item.activeIcon : item.icon}
            </Box>
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: item.isActive ? 700 : 500,
                color: item.isActive ? '#087F5B' : '#6B7280',
                mt: 0.3,
                lineHeight: 1,
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Layout;
