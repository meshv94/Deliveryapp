import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  Chip,
  Stack,
  IconButton,
  Skeleton,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';

import apiClient from '../services/api';
import { useCartContext } from '../context/CartContext';

// Fallback images
const FALLBACK_SHOP_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect fill="%23FAFAF7" width="400" height="260"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%236B7280" font-family="sans-serif" text-anchor="middle" dy=".3em"%3EAapnuBazaar Local Store%3C/text%3E%3C/svg%3E';

const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23FAFAF7" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%236B7280" font-family="sans-serif" text-anchor="middle" dy=".3em"%3EFresh Product%3C/text%3E%3C/svg%3E';

const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCartContext();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [modules, setModules] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [favoriteShopIds, setFavoriteShopIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aapnubazaar_favorites') || '[]');
    } catch {
      return [];
    }
  });

  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(true);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Read saved address/location label
  const locationLabel = (() => {
    try {
      const activeAddress = localStorage.getItem('activeDeliveryAddress');
      if (activeAddress) {
        const parsed = JSON.parse(activeAddress);
        return parsed.city || parsed.address_line_1 || 'Surat, Gujarat';
      }
    } catch {}
    return 'Surat, Gujarat';
  })();

  const token = localStorage.getItem('authToken');

  // Fetch Categories / Modules
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingModules(true);
        const res = await apiClient.get('/app/modules/active/list');
        if (res.success && Array.isArray(res.data)) {
          setModules(res.data);
        } else {
          setModules([]);
        }
      } catch (err) {
        console.error('Error fetching modules:', err);
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Vendors & Popular Products
  useEffect(() => {
    const fetchVendorsAndProducts = async () => {
      try {
        setLoadingVendors(true);

        // Fetch vendors if authenticated, otherwise use vendors endpoint with coordinates
        let vendorList = [];
        try {
          const res = await apiClient.get('/app/vendors/active');
          if (res?.success && Array.isArray(res.data)) {
            vendorList = res.data;
          } else if (Array.isArray(res)) {
            vendorList = res;
          }
        } catch (vErr) {
          console.log('Vendors fetch notice:', vErr?.message || vErr);
        }

        setVendors(vendorList);
        setLoadingVendors(false);

        // Fetch sample products from top 3 vendors
        if (vendorList.length > 0 && token) {
          const productsAccumulator = [];

          for (const vendor of vendorList.slice(0, 3)) {
            try {
              const pRes = await apiClient.get(`/app/vendors/products/?vendor_id=${vendor._id}`);
              if (pRes?.success && pRes.data?.products) {
                const activeProds = pRes.data.products
                  .filter((p) => p.isActive !== false)
                  .map((p) => ({
                    ...p,
                    vendorId: vendor._id,
                    shopName: vendor.name,
                    shopRating: vendor.rating || 4.8,
                  }));
                productsAccumulator.push(...activeProds);
              }
            } catch (pErr) {
              console.log('Product fetch notice:', pErr?.message || pErr);
            }
          }

          setPopularProducts(productsAccumulator.slice(0, 8));
        } else {
          setPopularProducts([]);
        }
      } catch (err) {
        console.error('Error loading vendors/products:', err);
      } finally {
        setLoadingVendors(false);
      }
    };

    fetchVendorsAndProducts();
  }, [token]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/vendors?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/vendors');
    }
  };

  // Toggle Favorite Shop
  const handleToggleFavorite = (vendorId, e) => {
    e.stopPropagation();
    let updated;
    if (favoriteShopIds.includes(vendorId)) {
      updated = favoriteShopIds.filter((id) => id !== vendorId);
      setSnackbar({ open: true, message: 'Removed from favorite shops', severity: 'info' });
    } else {
      updated = [...favoriteShopIds, vendorId];
      setSnackbar({ open: true, message: 'Saved to your favorite shops!', severity: 'success' });
    }
    setFavoriteShopIds(updated);
    localStorage.setItem('aapnubazaar_favorites', JSON.stringify(updated));
  };

  // Direct Add Product to Cart
  const handleAddProductToCart = (product, e) => {
    e.stopPropagation();
    try {
      addToCart(product.vendorId, product, 1);
      setSnackbar({
        open: true,
        message: `${product.name} added to cart!`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Could not add product to cart',
        severity: 'error',
      });
    }
  };

  // Copy Promo Code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSnackbar({ open: true, message: `Coupon ${code} copied to clipboard!`, severity: 'success' });
  };

  // Filter Favorite Vendors
  const favoriteVendors = vendors.filter((v) => favoriteShopIds.includes(v._id));

  // Category Styling Helpers
  const getCategoryTheme = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('groc')) {
      return { bg: '#EBFBEE', text: '#087F5B', border: '#D3F9D8', icon: '🥬', desc: 'Fresh fruits, vegetables & daily essentials' };
    }
    if (lower.includes('food')) {
      return { bg: '#FFF4E6', text: '#FF6B00', border: '#FFE8CC', icon: '🍲', desc: 'Neighborhood restaurants, sweets & snacks' };
    }
    if (lower.includes('elec')) {
      return { bg: '#E7F5FF', text: '#1971C2', border: '#D0EBFF', icon: '⚡', desc: 'Gadgets, accessories & mobile repairs' };
    }
    return { bg: '#F3F0FF', text: '#7950F2', border: '#E5DBFF', icon: '🏪', desc: 'Local stationery, hardware & general stores' };
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FAFAF7', pb: { xs: 8, md: 10 } }}>
      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          pt: { xs: 2.5, md: 8 },
          pb: { xs: 3, md: 9 },
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          {/* ── DEDICATED MOBILE HERO ── */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Typography sx={{ fontSize: '15px', color: '#6B7280', fontWeight: 600, mb: 0.5 }}>
              Hi 👋
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.45rem', sm: '1.85rem' },
                fontWeight: 800,
                color: '#151515',
                lineHeight: 1.25,
                mb: 1.5,
                letterSpacing: '-0.02em',
              }}
            >
              What are you looking for today?
            </Typography>

            {/* Location selector */}
            <Box
              onClick={() => {
                if (token) navigate('/address');
                else navigate('/vendors');
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                backgroundColor: '#FAFAF7',
                border: '1px solid #E5E7EB',
                borderRadius: '20px',
                px: 1.5,
                py: 0.6,
                cursor: 'pointer',
                mb: 2,
                minHeight: 36,
              }}
            >
              <LocationOnIcon sx={{ color: '#087F5B', fontSize: 16 }} />
              <Typography sx={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                Deliver to:
              </Typography>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#151515' }}>
                {locationLabel}
              </Typography>
            </Box>

            {/* Mobile Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1.5px solid #087F5B',
                boxShadow: '0 4px 14px rgba(8, 127, 91, 0.08)',
                p: 0.5,
                width: '100%',
              }}
            >
              <SearchIcon sx={{ color: '#087F5B', ml: 1, mr: 0.8, fontSize: 22 }} />
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search shops, groceries, food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: '14px', color: '#151515' },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: '#087F5B',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  px: 2.2,
                  py: 1,
                  minHeight: 40,
                  fontWeight: 700,
                  fontSize: '13px',
                  textTransform: 'none',
                  flexShrink: 0,
                  '&:hover': { backgroundColor: '#075B43' },
                }}
              >
                Search
              </Button>
            </Box>

            {/* Quick Filter Tags on Mobile */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                overflowX: 'auto',
                mt: 1.5,
                pb: 0.5,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {['Fresh Veggies', 'Dairy & Milk', 'Bakery', 'Snacks'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => navigate(`/vendors?search=${encodeURIComponent(tag)}`)}
                  sx={{
                    backgroundColor: '#FAFAF7',
                    border: '1px solid #E5E7EB',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    height: 28,
                    '&:hover': { backgroundColor: '#EBFBEE', borderColor: '#087F5B', color: '#087F5B' },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* ── DESKTOP HERO ── */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Left Column: Core UX Message & Search */}
            <Grid item xs={12} md={6.5}>
              <Box>
                {/* Small Eyebrow */}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.6, py: 0.6, borderRadius: '50px', backgroundColor: '#EBFBEE', border: '1px solid #B2F2BB', mb: 2.5 }}>
                  <VerifiedIcon sx={{ fontSize: 16, color: '#087F5B' }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#087F5B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    YOUR LOCAL MARKETPLACE
                  </Typography>
                </Box>

                {/* Main Heading */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    color: '#151515',
                    mb: 2,
                  }}
                >
                  Everything Local,
                  <br />
                  <Box component="span" sx={{ color: '#087F5B' }}>
                    Delivered to You.
                  </Box>
                </Typography>

                {/* Supporting Text */}
                <Typography
                  sx={{
                    fontSize: { xs: '15px', sm: '17px' },
                    color: '#6B7280',
                    lineHeight: 1.6,
                    maxWidth: 500,
                    mb: 3.5,
                  }}
                >
                  Discover your favorite neighborhood shops, food, groceries and more — all in one place.
                </Typography>

                {/* Location Selector Pill */}
                <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    onClick={() => {
                      if (token) navigate('/address');
                      else navigate('/vendors');
                    }}
                    sx={{
                      backgroundColor: '#FAFAF7',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      px: 1.8,
                      py: 0.8,
                      textTransform: 'none',
                      color: '#151515',
                      '&:hover': { backgroundColor: '#EBFBEE', borderColor: '#087F5B' },
                    }}
                  >
                    <LocationOnIcon sx={{ color: '#087F5B', fontSize: 18, mr: 1 }} />
                    <Typography component="span" sx={{ fontSize: '13px', color: '#6B7280', mr: 0.6 }}>
                      Deliver to:
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '13.5px', fontWeight: 700, color: '#151515' }}>
                      {locationLabel}
                    </Typography>
                  </Button>
                </Box>

                {/* Search Bar */}
                <Box
                  component="form"
                  onSubmit={handleSearchSubmit}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '2px solid #087F5B',
                    boxShadow: '0 8px 24px rgba(8, 127, 91, 0.08)',
                    p: 0.6,
                    maxWidth: 540,
                    mb: 3,
                  }}
                >
                  <SearchIcon sx={{ color: '#6B7280', ml: 1.5, mr: 1 }} />
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Search for products, shops or food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: { xs: '14px', sm: '15px' }, color: '#151515' },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      backgroundColor: '#087F5B',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      px: { xs: 2, sm: 3 },
                      py: 1.2,
                      fontWeight: 700,
                      fontSize: '14px',
                      textTransform: 'none',
                      flexShrink: 0,
                      '&:hover': { backgroundColor: '#075B43' },
                    }}
                  >
                    Explore Shops →
                  </Button>
                </Box>

                {/* Popular Search Suggestions */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280', fontWeight: 600 }}>
                    Popular:
                  </Typography>
                  {['Fresh Dairy', 'Organic Veggies', 'Local Bakery', 'Snacks', 'Pharmacy'].map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onClick={() => navigate(`/vendors?search=${encodeURIComponent(tag)}`)}
                      sx={{
                        backgroundColor: '#FAFAF7',
                        border: '1px solid #E5E7EB',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#EBFBEE', borderColor: '#087F5B', color: '#087F5B' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Right Column: AapnuBazaar Marketplace Artwork & Floating Badges */}
            <Grid item xs={12} md={5.5}>
              <Box sx={{ position: 'relative', width: '100%', maxWidth: 520, mx: 'auto' }}>
                {/* Main Hero Visual Card */}
                <Box
                  sx={{
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.08)',
                    backgroundColor: '#FFFFFF',
                    position: 'relative',
                    aspectRatio: '4/3',
                  }}
                >
                  <img
                    src="/cover_img.png"
                    alt="AapnuBazaar Local Marketplace"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {/* Subtle Vignette */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 60%)',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>

                {/* Floating Marketplace Pill 1: Grocery */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -14,
                    left: -12,
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '30px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    zIndex: 2,
                  }}
                >
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EBFBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    🥬
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#151515' }}>Grocery</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>100% Fresh Daily</Typography>
                  </Box>
                </Box>

                {/* Floating Marketplace Pill 2: Fast Delivery */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -16,
                    left: 20,
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '30px',
                    backgroundColor: '#087F5B',
                    color: '#FFFFFF',
                    boxShadow: '0 10px 24px rgba(8, 127, 91, 0.3)',
                    zIndex: 2,
                  }}
                >
                  <LocalShippingOutlinedIcon sx={{ fontSize: 20 }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 700 }}>20–30 Min Delivery</Typography>
                </Box>

                {/* Floating Marketplace Pill 3: Food & Snacks */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '35%',
                    right: -16,
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '30px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    zIndex: 2,
                  }}
                >
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FFF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    🍲
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#151515' }}>Local Food</Typography>
                    <Typography sx={{ fontSize: '10px', color: '#FF6B00' }}>Neighborhood Chefs</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>

      {/* ─────────────────────────────────────────────────────────────
          3. SHOP BY CATEGORY
      ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 5, md: 7 } }} id="categories">
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, color: '#151515', mb: 0.5 }}>
                Shop by Category
              </Typography>
              <Typography sx={{ fontSize: '15px', color: '#6B7280' }}>
                Find what you need from local stores around you.
              </Typography>
            </Box>
            <Button
              onClick={() => navigate('/modules')}
              endIcon={<ArrowForwardIcon />}
              sx={{ color: '#087F5B', fontWeight: 700, fontSize: '14px', textTransform: 'none', display: { xs: 'none', sm: 'inline-flex' } }}
            >
              All Categories
            </Button>
          </Box>

          {/* Category Cards - Horizontal Grid on Desktop, Horizontal Scroll on Mobile */}
          <Box
            sx={{
              display: 'flex',
              gap: 2.5,
              overflowX: { xs: 'auto', md: 'visible' },
              pb: { xs: 2, md: 0 },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {loadingModules
              ? [1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={160}
                    sx={{ flex: '1 0 220px', borderRadius: '16px' }}
                  />
                ))
              : (modules.length > 0 ? modules : [
                  { _id: 'cat-grocery', name: 'Grocery' },
                  { _id: 'cat-food', name: 'Food' },
                  { _id: 'cat-stores', name: 'Stores' },
                  { _id: 'cat-electronics', name: 'Electronics' },
                ]).map((module) => {
                  const theme = getCategoryTheme(module.name);
                  return (
                    <Card
                      key={module._id}
                      onClick={() => navigate(`/vendors?moduleId=${module._id}`)}
                      elevation={0}
                      sx={{
                        flex: { xs: '0 0 200px', sm: '0 0 240px', md: 1 },
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 160,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
                          borderColor: theme.text,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '14px',
                            backgroundColor: theme.bg,
                            border: `1px solid ${theme.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
                          }}
                        >
                          {theme.icon}
                        </Box>
                        <ArrowForwardIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#151515', mb: 0.5 }}>
                          {module.name}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.4 }}>
                          {theme.desc}
                        </Typography>
                      </Box>
                    </Card>
                  );
                })}
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          4. POPULAR SHOPS NEAR YOU
      ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 4, md: 7 }, backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3.5 } }}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: '1.45rem', md: '2.25rem' }, fontWeight: 800, color: '#151515', mb: 0.5 }}>
                Popular Shops Near You
              </Typography>
              <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#6B7280' }}>
                Trusted local businesses delivering to your doorstep.
              </Typography>
            </Box>
            <Button
              onClick={() => navigate('/vendors')}
              endIcon={<ArrowForwardIcon />}
              sx={{ color: '#087F5B', fontWeight: 700, fontSize: '13.5px', textTransform: 'none', flexShrink: 0 }}
            >
              See All →
            </Button>
          </Box>

          {/* MOBILE VIEW: Horizontal Scrolling Shop Cards */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              gap: 2,
              overflowX: 'auto',
              pb: 1.5,
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {loadingVendors
              ? [1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={230}
                    sx={{ flex: '0 0 260px', borderRadius: '16px' }}
                  />
                ))
              : vendors.map((vendor) => {
                  const isFav = favoriteShopIds.includes(vendor._id);
                  return (
                    <Card
                      key={vendor._id}
                      onClick={() => navigate(`/vendors/${vendor._id}`)}
                      elevation={0}
                      sx={{
                        flex: '0 0 260px',
                        scrollSnapAlign: 'start',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#087F5B' },
                      }}
                    >
                      <Box sx={{ position: 'relative', height: 130, backgroundColor: '#F3F4F6' }}>
                        <CardMedia
                          component="img"
                          image={vendor.vendor_image || FALLBACK_SHOP_IMAGE}
                          alt={vendor.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = FALLBACK_SHOP_IMAGE;
                          }}
                        />
                        {vendor.module?.name && (
                          <Chip
                            label={vendor.module.name}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              fontWeight: 700,
                              fontSize: '10px',
                              height: 20,
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleFavorite(vendor._id, e)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                            color: isFav ? '#E03131' : '#6B7280',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {isFav ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Box>
                      <CardContent sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#151515', mb: 0.5, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {vendor.name}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                            <StarIcon sx={{ fontSize: 14, color: '#FF922B' }} />
                            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#151515' }}>
                              {vendor.rating || '4.8'}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>•</Typography>
                          <Typography sx={{ fontSize: '11.5px', color: '#6B7280' }}>
                            {vendor.distance_km ? `${vendor.distance_km} km` : '1.2 km'}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>•</Typography>
                          <Typography sx={{ fontSize: '11.5px', color: '#6B7280' }}>
                            {vendor.preparation_time_minute ? `${vendor.preparation_time_minute}m` : '20–30m'}
                          </Typography>
                        </Stack>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#E5E7EB',
                            color: '#087F5B',
                            fontWeight: 700,
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontSize: '12px',
                            minHeight: 34,
                            mt: 'auto',
                          }}
                        >
                          View Shop →
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
          </Box>

          {/* DESKTOP VIEW: Multi-Column Grid */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Grid container spacing={3}>
              {loadingVendors ? (
                [1, 2, 3, 4].map((i) => (
                  <Grid item sm={6} md={3} key={i}>
                    <Skeleton variant="rectangular" height={260} sx={{ borderRadius: '16px' }} />
                  </Grid>
                ))
              ) : vendors.length > 0 ? (
                vendors.slice(0, 4).map((vendor) => {
                  const isFav = favoriteShopIds.includes(vendor._id);
                  return (
                    <Grid item sm={6} md={3} key={vendor._id}>
                      <Card
                        onClick={() => navigate(`/vendors/${vendor._id}`)}
                        elevation={0}
                        sx={{
                          height: '100%',
                          borderRadius: '16px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          position: 'relative',
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
                            borderColor: '#087F5B',
                          },
                        }}
                      >
                        <Box sx={{ position: 'relative', height: 160, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                          <CardMedia
                            component="img"
                            image={vendor.vendor_image || FALLBACK_SHOP_IMAGE}
                            alt={vendor.name}
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = FALLBACK_SHOP_IMAGE;
                            }}
                          />
                          {vendor.module?.name && (
                            <Chip
                              label={vendor.module.name}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(4px)',
                                fontWeight: 700,
                                fontSize: '11px',
                                color: '#151515',
                              }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleFavorite(vendor._id, e)}
                            sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              backgroundColor: '#FFFFFF',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                              color: isFav ? '#E03131' : '#6B7280',
                              '&:hover': { backgroundColor: '#FFFFFF', color: '#E03131' },
                            }}
                          >
                            {isFav ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#151515', mb: 0.5, lineHeight: 1.3 }}>
                            {vendor.name}
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <StarIcon sx={{ fontSize: 16, color: '#FF922B' }} />
                              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#151515' }}>
                                {vendor.rating || '4.8'}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>•</Typography>
                            <Typography sx={{ fontSize: '12.5px', color: '#6B7280' }}>
                              {vendor.distance_km ? `${vendor.distance_km} km` : '1.2 km'}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>•</Typography>
                            <Typography sx={{ fontSize: '12.5px', color: '#6B7280' }}>
                              {vendor.preparation_time_minute ? `${vendor.preparation_time_minute}m` : '20–30 min'}
                            </Typography>
                          </Stack>
                          <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px solid #F3F4F6' }}>
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: '#E5E7EB',
                                color: '#087F5B',
                                fontWeight: 700,
                                borderRadius: '8px',
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: '#087F5B',
                                  backgroundColor: '#EBFBEE',
                                },
                              }}
                            >
                              View Shop →
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      borderRadius: '16px',
                      border: '1px dashed #E5E7EB',
                      backgroundColor: '#FAFAF7',
                    }}
                  >
                    <StorefrontIcon sx={{ fontSize: 44, color: '#087F5B', mb: 1.5 }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '17px', color: '#151515', mb: 0.5 }}>
                      Local Shops Are Ready for Delivery
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2.5, maxWidth: 440, mx: 'auto' }}>
                      Sign in to see nearby shops delivering directly to your exact delivery location.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/vendors')}
                      sx={{ backgroundColor: '#087F5B', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { backgroundColor: '#075B43' } }}
                    >
                      Explore All Shops
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          5. POPULAR PRODUCTS (POPULAR NEAR YOU) - 2-COLUMN MOBILE GRID
      ───────────────────────────────────────────────────────────── */}
      {popularProducts.length > 0 && (
        <Box sx={{ py: { xs: 4, md: 7 } }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3.5 } }}>
              <Box>
                <Typography variant="h2" sx={{ fontSize: { xs: '1.45rem', md: '2.25rem' }, fontWeight: 800, color: '#151515', mb: 0.5 }}>
                  Popular Near You
                </Typography>
                <Typography sx={{ fontSize: { xs: '13px', sm: '15px' }, color: '#6B7280' }}>
                  Frequently ordered essentials and specialties from local stores.
                </Typography>
              </Box>
              <Button
                onClick={() => navigate('/vendors')}
                endIcon={<ArrowForwardIcon />}
                sx={{ color: '#087F5B', fontWeight: 700, fontSize: '13.5px', textTransform: 'none', flexShrink: 0 }}
              >
                Explore More
              </Button>
            </Box>

            {/* 2-Column Grid on Mobile (xs={6}), 4-Column on Desktop (md={3}) */}
            <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
              {popularProducts.map((prod) => {
                const hasDiscount = prod.special_price && prod.special_price < prod.main_price;
                const price = hasDiscount ? prod.special_price : prod.main_price || prod.price || 0;
                const originalPrice = prod.main_price || prod.price || 0;
                const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

                return (
                  <Grid item xs={6} sm={6} md={3} key={prod._id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: '16px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.08)',
                          borderColor: '#087F5B',
                        },
                      }}
                    >
                      {/* Product Image & Badges */}
                      <Box sx={{ position: 'relative', height: { xs: 115, sm: 160 }, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>
                        <CardMedia
                          component="img"
                          image={prod.image || FALLBACK_PRODUCT_IMAGE}
                          alt={prod.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = FALLBACK_PRODUCT_IMAGE;
                          }}
                        />

                        {/* Discount Badge */}
                        {hasDiscount && (
                          <Chip
                            label={`${discountPct}% OFF`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              backgroundColor: '#FF6B00',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: { xs: '9px', sm: '11px' },
                              height: { xs: 18, sm: 22 },
                            }}
                          />
                        )}
                      </Box>

                      {/* Info & Add Action */}
                      <CardContent sx={{ p: { xs: 1.2, sm: 2 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '13px', sm: '15px' },
                            color: '#151515',
                            mb: 0.5,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: { xs: 34, sm: 40 },
                          }}
                        >
                          {prod.name}
                        </Typography>

                        {/* Store Origin & Rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography
                            sx={{
                              fontSize: { xs: '11px', sm: '12px' },
                              color: '#6B7280',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '75%',
                            }}
                          >
                            {prod.shopName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                            <StarIcon sx={{ fontSize: 12, color: '#FF922B' }} />
                            <Typography sx={{ fontSize: { xs: '11px', sm: '12px' }, fontWeight: 700, color: '#151515' }}>
                              {prod.shopRating || '4.8'}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Price & Add Button */}
                        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #F3F4F6' }}>
                          <Box>
                            <Typography sx={{ fontSize: { xs: '14.5px', sm: '17px' }, fontWeight: 800, color: '#087F5B', lineHeight: 1 }}>
                              ₹{price.toFixed(0)}
                            </Typography>
                            {hasDiscount && (
                              <Typography sx={{ fontSize: { xs: '10.5px', sm: '12px' }, textDecoration: 'line-through', color: '#9CA3AF' }}>
                                ₹{originalPrice.toFixed(0)}
                              </Typography>
                            )}
                          </Box>

                          <Button
                            size="small"
                            variant="contained"
                            onClick={(e) => handleAddProductToCart(prod, e)}
                            sx={{
                              backgroundColor: '#087F5B',
                              color: '#FFFFFF',
                              borderRadius: '8px',
                              px: { xs: 1.2, sm: 1.8 },
                              py: 0.5,
                              minHeight: 34,
                              minWidth: { xs: 54, sm: 64 },
                              fontWeight: 700,
                              fontSize: { xs: '11.5px', sm: '13px' },
                              textTransform: 'none',
                              '&:hover': { backgroundColor: '#075B43' },
                            }}
                          >
                            Add
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. FAVORITE SHOPS
      ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 5, md: 7 }, backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }} id="favorites">
        <Container maxWidth="lg">
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, color: '#151515', mb: 0.5 }}>
              Your Favorite Shops
            </Typography>
            <Typography sx={{ fontSize: '15px', color: '#6B7280' }}>
              Quick access to your preferred neighborhood stores.
            </Typography>
          </Box>

          {favoriteVendors.length > 0 ? (
            <Grid container spacing={{ xs: 2.5, md: 3 }}>
              {favoriteVendors.map((vendor) => (
                <Grid item xs={12} sm={6} md={3} key={vendor._id}>
                  <Card
                    onClick={() => navigate(`/vendors/${vendor._id}`)}
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#087F5B',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={vendor.vendor_image || FALLBACK_SHOP_IMAGE}
                      alt={vendor.name}
                      sx={{ width: 64, height: 64, borderRadius: '12px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = FALLBACK_SHOP_IMAGE;
                      }}
                    />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#151515', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vendor.name}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 0.5 }}>
                        {vendor.module?.name || 'Local Store'}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#087F5B' }}>
                        ⭐ {vendor.rating || '4.8'}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            /* Graceful Empty State as specified in Prompt */
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 5 },
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FAFAF7',
                maxWidth: 620,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#FFF5F5',
                  border: '1px solid #FFC9C9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <FavoriteBorderOutlinedIcon sx={{ color: '#E03131', fontSize: 28 }} />
              </Box>
              <Typography sx={{ fontSize: '17px', fontWeight: 700, color: '#151515', mb: 1 }}>
                Discover shops you love and save them for quick access.
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3, maxWidth: 440, mx: 'auto' }}>
                Tap the heart icon on any store card to add it to your personal favorites list for faster ordering.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/vendors')}
                sx={{
                  backgroundColor: '#087F5B',
                  color: '#FFFFFF',
                  px: 3.5,
                  py: 1,
                  borderRadius: '8px',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#075B43' },
                }}
              >
                Explore Shops
              </Button>
            </Paper>
          )}
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          7. OFFERS & DEALS SECTION
      ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 5, md: 7 } }} id="offers">
        <Container maxWidth="lg">
          <Box sx={{ mb: 3.5 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, color: '#151515', mb: 0.5 }}>
              Offers & Local Deals
            </Typography>
            <Typography sx={{ fontSize: '15px', color: '#6B7280' }}>
              Save more on everyday essentials with verified neighbourhood discounts.
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {/* Large Promotional Card */}
            <Grid item xs={12} md={7}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: '20px',
                  backgroundColor: '#075B43',
                  color: '#FFFFFF',
                  p: { xs: 3, sm: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 12px 32px rgba(7, 91, 67, 0.25)',
                }}
              >
                {/* Background Vector Circles */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    pointerEvents: 'none',
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Chip
                    label="LOCAL WELCOME SPECIAL"
                    size="small"
                    sx={{
                      backgroundColor: '#FF6B00',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '11px',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h3" sx={{ fontSize: { xs: '1.75rem', sm: '2.2rem' }, fontWeight: 800, lineHeight: 1.2, mb: 1.5 }}>
                    Flat ₹50 OFF on Your First 3 Local Orders
                  </Typography>
                  <Typography sx={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, maxWidth: 440, mb: 3 }}>
                    Enjoy fresh fruits, vegetables, food, and grocery items from top verified neighborhood stores.
                  </Typography>
                </Box>

                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                  <Button
                    onClick={() => handleCopyCode('AAPNU50')}
                    variant="outlined"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      color: '#FFFFFF',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      px: 2,
                      py: 0.8,
                      fontWeight: 700,
                      fontSize: '13px',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: '#FFFFFF' },
                    }}
                  >
                    CODE: AAPNU50
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => navigate('/vendors')}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#075B43',
                      borderRadius: '8px',
                      px: 2.5,
                      py: 0.8,
                      fontWeight: 800,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#F3F4F6' },
                    }}
                  >
                    Shop Now →
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* 2 Smaller Promotional Cards */}
            <Grid item xs={12} md={5}>
              <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ height: '100%' }}>
                {/* Small Offer Card 1 */}
                <Card
                  elevation={0}
                  onClick={() => navigate('/vendors')}
                  sx={{
                    flex: 1,
                    borderRadius: '16px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    p: 2.5,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#087F5B',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  <Box>
                    <Chip
                      label="FREE DELIVERY"
                      size="small"
                      sx={{ backgroundColor: '#EBFBEE', color: '#087F5B', fontWeight: 800, fontSize: '11px', mb: 1 }}
                    />
                    <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#151515', mb: 0.5 }}>
                      Zero Delivery Fee on Orders Above ₹249
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                      Delivered within 3 km from your nearest neighborhood shop.
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#087F5B', mt: 1.5 }}>
                    Claim Free Delivery →
                  </Typography>
                </Card>

                {/* Small Offer Card 2 */}
                <Card
                  elevation={0}
                  onClick={() => navigate('/vendors')}
                  sx={{
                    flex: 1,
                    borderRadius: '16px',
                    border: '1px solid #FFE8CC',
                    backgroundColor: '#FFF4E6',
                    p: 2.5,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#FF6B00',
                      boxShadow: '0 8px 20px rgba(255, 107, 0, 0.1)',
                    },
                  }}
                >
                  <Box>
                    <Chip
                      label="FARM FRESH"
                      size="small"
                      sx={{ backgroundColor: '#FF6B00', color: '#FFFFFF', fontWeight: 800, fontSize: '11px', mb: 1 }}
                    />
                    <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#151515', mb: 0.5 }}>
                      Up to 25% OFF on Morning Mandi Harvests
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                      Seasonal fruits and green vegetables delivered fresh daily.
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#FF6B00', mt: 1.5 }}>
                    Explore Mandi Deals →
                  </Typography>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          8. WHY AAPNUBAZAAR
      ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 6, md: 8 }, backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto', mb: 5 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.85rem', md: '2.4rem' }, fontWeight: 800, color: '#151515', mb: 1 }}>
              Why Shop With AapnuBazaar?
            </Typography>
            <Typography sx={{ fontSize: '15px', color: '#6B7280' }}>
              We empower your local neighborhood merchants while providing speedy, dependable service right to your doorstep.
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {[
              {
                icon: <StoreOutlinedIcon sx={{ fontSize: 28, color: '#087F5B' }} />,
                title: 'Local Shops',
                desc: 'Shop from businesses you already know and trust.',
              },
              {
                icon: <LocalShippingOutlinedIcon sx={{ fontSize: 28, color: '#087F5B' }} />,
                title: 'Fast Delivery',
                desc: 'Get your orders delivered conveniently.',
              },
              {
                icon: <ThumbUpOutlinedIcon sx={{ fontSize: 28, color: '#087F5B' }} />,
                title: 'Your Choice',
                desc: 'Choose the shops you love.',
              },
              {
                icon: <SecurityOutlinedIcon sx={{ fontSize: 28, color: '#087F5B' }} />,
                title: 'Secure Payments',
                desc: 'Simple and secure checkout.',
              },
              {
                icon: <TrackChangesOutlinedIcon sx={{ fontSize: 28, color: '#087F5B' }} />,
                title: 'Live Order Tracking',
                desc: 'Track your order from shop to doorstep.',
              },
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} md={2.4} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: '14px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FAFAF7',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      borderColor: '#087F5B',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
                    },
                  }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#EBFBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#151515', mb: 0.8 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                    {item.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          9. BECOME A SELLER (COMPACT MOBILE CARD)
      ───────────────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 3.5, md: 7 } }}>
        <Container maxWidth="lg">
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: '18px', md: '24px' },
              backgroundColor: '#075B43',
              color: '#FFFFFF',
              p: { xs: 2.5, sm: 4, md: 5 },
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(7, 91, 67, 0.25)',
            }}
          >
            <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center">
              <Grid item xs={12} md={7.5}>
                <Chip
                  label="PARTNER WITH AAPNUBAZAAR"
                  size="small"
                  sx={{
                    backgroundColor: '#FF6B00',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '10.5px',
                    mb: 1.5,
                  }}
                />
                <Typography variant="h2" sx={{ fontSize: { xs: '1.35rem', sm: '2rem', md: '2.4rem' }, fontWeight: 800, lineHeight: 1.25, mb: 1 }}>
                  Own a Local Business?
                  <br />
                  <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Take your shop online with AapnuBazaar.
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: { xs: '13.5px', sm: '15px' }, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, maxWidth: 540, mb: { xs: 2, md: 3 } }}>
                  Reach more customers, manage products, and grow your sales with our zero-hassle local merchant tools.
                </Typography>

                {/* CTAs */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5 }}>
                  <Button
                    variant="contained"
                    onClick={() => window.open('http://localhost:5175', '_blank')}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#075B43',
                      px: 3,
                      py: 1.2,
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '14px',
                      minHeight: 44,
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#F3F4F6' },
                    }}
                  >
                    Register Your Shop →
                  </Button>

                  <Button
                    variant="text"
                    onClick={() => window.open('http://localhost:5175/login', '_blank')}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      px: 2,
                      py: 1,
                      fontWeight: 700,
                      fontSize: '13.5px',
                      textTransform: 'none',
                      textDecoration: 'underline',
                      minHeight: 40,
                      '&:hover': { color: '#FFFFFF', backgroundColor: 'transparent' },
                    }}
                  >
                    Already a seller? Login
                  </Button>
                </Box>
              </Grid>

              {/* Badges Column - Desktop Only */}
              <Grid item xs={12} md={4.5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Stack spacing={2}>
                    {[
                      '0% Commission for the first 30 days',
                      'Instant order alerts on your mobile phone',
                      'Fast payouts directly to your bank account',
                      'Reach 10,000+ local customers in your neighborhood',
                    ].map((text, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CheckCircleIcon sx={{ color: '#FF922B', fontSize: 20, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '13.5px', color: '#FFFFFF', fontWeight: 600 }}>
                          {text}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Card>
        </Container>
      </Box>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '10px', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;
