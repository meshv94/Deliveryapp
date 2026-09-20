import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Stack,
  Skeleton,
  Button,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Fade,
  IconButton,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import useVendorDetails from '../hooks/useVendorDetails';
import { useCartContext } from '../context/CartContext';
import apiClient from '../services/api';
import VendorHeader from '../components/VendorHeader';
import ProductCard from '../components/ProductCard';

/**
 * Redesigned VendorDetailsPage
 * Authentic local store experience with:
 * - Cover & identity header
 * - In-shop product search
 * - Category tabs (All, Popular, and dynamic categories from API)
 * - Premium product cards with inline stepper
 * - Sticky desktop Mini-Cart & Mobile bottom cart bar
 */
const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { vendor, products, loading, error } = useVendorDetails(vendorId);
  const { getVendorCart, updateQuantity, removeFromCart } = useCartContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modules, setModules] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch active modules/categories from API for mapping
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await apiClient.get('/app/modules/active/list');
        if (res.data && Array.isArray(res.data)) {
          setModules(res.data);
        }
      } catch (err) {
        console.error('Error fetching modules for category tabs:', err);
      }
    };
    fetchModules();
  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to get category name for a product
  const getProductCategory = (product) => {
    if (product.module_id && typeof product.module_id === 'object' && product.module_id.name) {
      return product.module_id.name;
    }
    if (product.module_id && typeof product.module_id === 'string') {
      const match = modules.find((m) => m._id === product.module_id);
      if (match) return match.name;
    }
    if (product.category) return product.category;
    return 'General';
  };

  // Derive unique categories present in the shop's products
  const categoryTabs = useMemo(() => {
    if (!products || products.length === 0) return ['All'];

    const catSet = new Set();
    let hasPopular = false;

    products.forEach((p) => {
      // Check if popular / has special price
      if (p.special_price && p.special_price < p.main_price) {
        hasPopular = true;
      }
      const cat = getProductCategory(p);
      if (cat) catSet.add(cat);
    });

    const list = ['All'];
    if (hasPopular) {
      list.push('Popular');
    }
    catSet.forEach((c) => {
      if (c && !list.includes(c)) list.push(c);
    });

    return list;
  }, [products, modules]);

  // Filter products based on active category & search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Category filter
      if (selectedCategory === 'Popular') {
        const isDiscounted = product.special_price && product.special_price < product.main_price;
        if (!isDiscounted) return false;
      } else if (selectedCategory !== 'All') {
        const cat = getProductCategory(product);
        if (cat.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesDesc = product.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery, modules]);

  // Cart calculation for this vendor
  const vendorCartItems = useMemo(() => {
    if (!vendorId) return [];
    return getVendorCart(vendorId) || [];
  }, [vendorId, getVendorCart]);

  // Detailed items in cart with product info
  const cartDetails = useMemo(() => {
    if (!products || products.length === 0 || vendorCartItems.length === 0) {
      return { items: [], totalItems: 0, subtotal: 0 };
    }

    let subtotal = 0;
    let totalItems = 0;
    const items = [];

    vendorCartItems.forEach((ci) => {
      const product = products.find((p) => p._id === ci.product_id);
      if (product) {
        const price =
          product.special_price && product.special_price < product.main_price
            ? product.special_price
            : product.main_price || product.price || 0;
        const lineTotal = price * ci.quantity;
        subtotal += lineTotal;
        totalItems += ci.quantity;
        items.push({
          product,
          quantity: ci.quantity,
          price,
          lineTotal,
        });
      }
    });

    return { items, totalItems, subtotal };
  }, [products, vendorCartItems]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#FAFAF7', minHeight: '100vh', pb: 8 }}>
        <Skeleton variant="rectangular" width="100%" height={300} />
        <Container maxWidth="lg" sx={{ mt: 3 }}>
          <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 3, mb: 4 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Grid container spacing={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box
        sx={{
          backgroundColor: '#FAFAF7',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: '20px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <Box sx={{ fontSize: '3.5rem', mb: 2 }}>⚠️</Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#151515', mb: 1.5 }}>
              Unable to Load Shop
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/vendors')}
              sx={{
                backgroundColor: '#087F5B',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1.2,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#075B43' },
              }}
            >
              Browse Other Shops
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Vendor Not Found State
  if (!vendor) {
    return (
      <Box
        sx={{
          backgroundColor: '#FAFAF7',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: '20px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 60, color: '#9CA3AF', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#151515', mb: 1.5 }}>
              Shop Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
              This shop is currently unavailable or has been removed.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/vendors')}
              sx={{
                backgroundColor: '#087F5B',
                color: '#fff',
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1.2,
                textTransform: 'none',
                '&:hover': { backgroundColor: '#075B43' },
              }}
            >
              Discover Local Shops
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: '#FAFAF7',
        minHeight: '100vh',
        pb: { xs: 12, lg: 8 },
        position: 'relative',
      }}
    >
      {/* 1. SHOP HEADER with Breadcrumbs, Cover, Logo, Details, Actions */}
      <VendorHeader vendor={vendor} />

      {/* 2. MAIN STORE VIEW */}
      <Container maxWidth="lg" sx={{ mt: 3.5, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
          {/* LEFT / CENTER: Store Catalog (Search + Category Tabs + Products) */}
          <Grid item xs={12} lg={cartDetails.totalItems > 0 ? 8.2 : 12}>
            {/* SHOP SEARCH */}
            <Box sx={{ mb: 2.5 }}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '14px',
                  border: '1.5px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease',
                  '&:focus-within': {
                    borderColor: '#087F5B',
                    boxShadow: '0 4px 16px rgba(8, 127, 91, 0.12)',
                  },
                }}
              >
                <TextField
                  fullWidth
                  size="medium"
                  placeholder={`Search products in ${vendor.name || 'this shop'}...`}
                  variant="standard"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ pl: 2 }}>
                        <SearchIcon sx={{ color: '#087F5B', fontSize: 24 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end" sx={{ pr: 1.5 }}>
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                    sx: {
                      py: 1.2,
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#151515',
                    },
                  }}
                />
              </Paper>
            </Box>

            {/* CATEGORY TABS */}
            {categoryTabs.length > 1 && (
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  overflowX: 'auto',
                  pb: 1,
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {categoryTabs.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const isPopular = cat === 'Popular';

                  return (
                    <Chip
                      key={cat}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isPopular && <WhatshotIcon sx={{ fontSize: 16, color: isSelected ? '#fff' : '#FF6B00' }} />}
                          <span>{cat}</span>
                        </Box>
                      }
                      onClick={() => setSelectedCategory(cat)}
                      clickable
                      sx={{
                        px: 1,
                        py: 2.2,
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: isSelected ? '#087F5B' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#4B5563',
                        border: isSelected ? '1px solid #087F5B' : '1px solid #E5E7EB',
                        boxShadow: isSelected
                          ? '0 4px 12px rgba(8, 127, 91, 0.25)'
                          : '0 2px 6px rgba(0,0,0,0.02)',
                        '&:hover': {
                          backgroundColor: isSelected ? '#075B43' : '#F3F4F6',
                          borderColor: isSelected ? '#075B43' : '#D1D5DB',
                        },
                      }}
                    />
                  );
                })}
              </Box>
            )}

            {/* SECTION HEADING & RESULT COUNT */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#151515',
                    fontSize: '1.15rem',
                  }}
                >
                  {selectedCategory === 'All'
                    ? 'All Products'
                    : selectedCategory === 'Popular'
                    ? 'Popular Items'
                    : selectedCategory}
                </Typography>
                <Chip
                  label={`${filteredProducts.length} items`}
                  size="small"
                  sx={{
                    backgroundColor: '#EBFBEE',
                    color: '#087F5B',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 22,
                  }}
                />
              </Box>

              {searchQuery && (
                <Button
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{
                    color: '#FF6B00',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                  }}
                >
                  Clear search
                </Button>
              )}
            </Box>

            {/* PRODUCT GRID */}
            {products.length === 0 ? (
              /* No Products in store */
              <Fade in timeout={500}>
                <Paper
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 3,
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px dashed #D1D5DB',
                  }}
                >
                  <LocalMallOutlinedIcon sx={{ fontSize: 50, color: '#9CA3AF', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#151515', mb: 0.5 }}>
                    No products added yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', maxWidth: 360, mx: 'auto' }}>
                    This vendor hasn't published any items yet. Please check back later!
                  </Typography>
                </Paper>
              </Fade>
            ) : filteredProducts.length === 0 ? (
              /* No Search/Filter Results */
              <Fade in timeout={500}>
                <Paper
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    py: 7,
                    px: 3,
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px dashed #D1D5DB',
                  }}
                >
                  <SearchIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#151515', mb: 0.5 }}>
                    No items found
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', maxWidth: 360, mx: 'auto', mb: 2 }}>
                    We couldn't find any products matching your filters in this shop.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    sx={{
                      borderColor: '#087F5B',
                      color: '#087F5B',
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#075B43',
                        backgroundColor: '#EBFBEE',
                      },
                    }}
                  >
                    Reset Filters
                  </Button>
                </Paper>
              </Fade>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                {filteredProducts.map((product) => (
                  <Grid
                    item
                    xs={12}
                    sm={cartDetails.totalItems > 0 ? 12 : 6}
                    md={6}
                    key={product._id || product.id}
                  >
                    <ProductCard product={product} vendorId={vendorId} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* RIGHT: Desktop Sticky Mini-Cart */}
          {cartDetails.totalItems > 0 && (
            <Grid
              item
              xs={12}
              lg={3.8}
              sx={{
                display: { xs: 'none', lg: 'block' },
              }}
            >
              <Box
                sx={{
                  position: 'sticky',
                  top: '96px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
                  overflow: 'hidden',
                }}
              >
                {/* Mini-Cart Header */}
                <Box
                  sx={{
                    p: 2.5,
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: '#FAFAF7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCartIcon sx={{ color: '#087F5B', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, color: '#151515', fontSize: '1rem' }}>
                      Your Cart
                    </Typography>
                  </Box>
                  <Chip
                    label={`${cartDetails.totalItems} ${cartDetails.totalItems === 1 ? 'item' : 'items'}`}
                    size="small"
                    sx={{
                      backgroundColor: '#087F5B',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 22,
                    }}
                  />
                </Box>

                {/* Cart Items List */}
                <Box
                  sx={{
                    p: 2.5,
                    maxHeight: '360px',
                    overflowY: 'auto',
                  }}
                >
                  <Stack spacing={2}>
                    {cartDetails.items.map(({ product, quantity, price, lineTotal }) => (
                      <Box
                        key={product._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                        }}
                      >
                        {/* Item Details */}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#151515',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: '#6B7280', mt: 0.2 }}>
                            ₹{price.toFixed(2)} × {quantity}
                          </Typography>
                        </Box>

                        {/* Inline Stepper */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#EBFBEE',
                            borderRadius: '8px',
                            border: '1px solid #B2F2BB',
                            px: 0.5,
                            py: 0.2,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (quantity === 1) {
                                removeFromCart(vendorId, product._id);
                              } else {
                                updateQuantity(vendorId, product._id, quantity - 1);
                              }
                            }}
                            sx={{ color: '#087F5B', p: 0.3 }}
                          >
                            <RemoveIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.82rem',
                              color: '#087F5B',
                              px: 0.8,
                            }}
                          >
                            {quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(vendorId, product._id, quantity + 1)}
                            sx={{ color: '#087F5B', p: 0.3 }}
                          >
                            <AddIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </Box>

                        {/* Line Total */}
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            color: '#151515',
                            minWidth: 52,
                            textAlign: 'right',
                          }}
                        >
                          ₹{lineTotal.toFixed(0)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: '#E5E7EB' }} />

                {/* Subtotal & Bill Section */}
                <Box sx={{ p: 2.5, backgroundColor: '#FFFFFF' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>
                      Subtotal
                    </Typography>
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#151515' }}>
                      ₹{cartDetails.subtotal.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280' }}>
                      Delivery Fee
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#087F5B' }}>
                      Standard
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2, borderColor: '#F3F4F6' }} />

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#151515' }}>
                      Total
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#087F5B' }}>
                      ₹{cartDetails.subtotal.toFixed(2)}
                    </Typography>
                  </Box>

                  {/* Checkout CTA */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => navigate('/cart')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      backgroundColor: '#087F5B',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      py: 1.4,
                      borderRadius: '12px',
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(8, 127, 91, 0.3)',
                      '&:hover': {
                        backgroundColor: '#075B43',
                        boxShadow: '0 6px 18px rgba(8, 127, 91, 0.4)',
                      },
                    }}
                  >
                    Proceed to Cart
                  </Button>

                  {/* Guarantee info */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.6,
                      mt: 1.8,
                    }}
                  >
                    <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: '#087F5B' }} />
                    <Typography sx={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>
                      Freshly prepared & securely packed
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* 3. MOBILE STICKY BOTTOM CART BAR */}
      {cartDetails.totalItems > 0 && (
        <Fade in timeout={300}>
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              position: 'fixed',
              bottom: { xs: 'calc(52px + env(safe-area-inset-bottom, 0px))', md: 0 },
              left: 0,
              right: 0,
              zIndex: 1200,
              backgroundColor: '#075B43',
              color: '#FFFFFF',
              px: { xs: 2, sm: 3 },
              py: 1.5,
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
              alignItems: 'center',
              justifyContent: 'space-between',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.2 }}>
                {cartDetails.totalItems} {cartDetails.totalItems === 1 ? 'item' : 'items'} • ₹
                {cartDetails.subtotal.toFixed(0)}
              </Typography>
              <Typography sx={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.8)', mt: 0.2 }}>
                From {vendor.name}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={() => navigate('/cart')}
              endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem' }} />}
              sx={{
                backgroundColor: '#FFFFFF',
                color: '#075B43',
                fontWeight: 800,
                fontSize: '0.88rem',
                px: 2.5,
                py: 0.9,
                borderRadius: '10px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: '#FAFAF7',
                },
              }}
            >
              View Cart
            </Button>
          </Box>
        </Fade>
      )}

      {/* 4. SCROLL TO TOP BUTTON */}
      <Fade in={showScrollTop}>
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: { xs: cartDetails.totalItems > 0 ? 80 : 24, lg: 28 },
            right: { xs: 18, sm: 28 },
            zIndex: 1000,
            width: 48,
            height: 48,
            backgroundColor: '#FFFFFF',
            border: '2px solid #087F5B',
            boxShadow: '0 4px 16px rgba(8, 127, 91, 0.2)',
            transition: 'all 0.25s ease',
            '&:hover': {
              backgroundColor: '#087F5B',
              transform: 'translateY(-2px)',
              '& .MuiSvgIcon-root': {
                color: '#FFFFFF',
              },
            },
          }}
        >
          <KeyboardArrowUpIcon
            sx={{
              fontSize: '1.6rem',
              color: '#087F5B',
              transition: 'color 0.2s ease',
            }}
          />
        </IconButton>
      </Fade>
    </Box>
  );
};

export default VendorDetailsPage;
