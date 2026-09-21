import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Skeleton,
  Button,
  TextField,
  InputAdornment,
  Fade,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import useVendorDetails from '../hooks/useVendorDetails';
import { useCartContext } from '../context/CartContext';
import apiClient from '../services/api';
import VendorHeader from '../components/VendorHeader';
import ProductCard from '../components/ProductCard';
import FloatingCartBar from '../components/FloatingCartBar';
import CartDrawer from '../components/CartDrawer';

// Brand Design Tokens
const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  orangeLight: '#FFF4E6',
  bgPage: '#F7F9F8',
  white: '#FFFFFF',
  textPrimary: '#17221D',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  borderInput: '#DDE5E1',
  red: '#E03131',
  redLight: '#FFF5F5',
};

/**
 * VendorDetailsPage Component
 * Professional marketplace vendor details & product catalog:
 * - Controlled compact vendor hero
 * - In-shop search & responsive horizontal category navigation
 * - 2-column mobile / 4-column desktop product grid with uniform vertical cards
 * - Real-time CartContext integration & floating cart summary
 * - Slide-in cart drawer / mobile bottom sheet
 */
const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { vendor, products, loading, error } = useVendorDetails(vendorId);
  const { getVendorCart } = useCartContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modules, setModules] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Fetch active modules/categories from API for mapping
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await apiClient.get('/app/modules/active/list');
        if (res?.data && Array.isArray(res.data)) {
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
      <Box sx={{ backgroundColor: BRAND.bgPage, minHeight: '100vh', pb: 10 }}>
        {/* Skeleton Banner */}
        <Box sx={{ backgroundColor: BRAND.white, pb: 3, borderBottom: `1px solid ${BRAND.border}` }}>
          <Container maxWidth="lg" sx={{ maxWidth: '1280px !important', px: { xs: 2, sm: 3, md: 4 }, pt: 2 }}>
            <Skeleton variant="text" width={140} height={24} sx={{ mb: 1.5 }} />
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '16px' }} />
          </Container>
        </Box>

        {/* Skeleton Grid */}
        <Container maxWidth="lg" sx={{ maxWidth: '1280px !important', px: { xs: 1.5, sm: 2.5, md: 3 }, mt: 3 }}>
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: '12px', mb: 2.5 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: { xs: 1.5, sm: 2, md: 2.5 },
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Box
                key={i}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  overflow: 'hidden',
                }}
              >
                <Skeleton variant="rectangular" height={150} />
                <Box sx={{ p: 1.5 }}>
                  <Skeleton variant="text" width="80%" height={22} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="45%" height={18} sx={{ mb: 1.5 }} />
                  <Skeleton variant="rectangular" height={36} sx={{ borderRadius: '10px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>
    );
  }

  // Error State
  if (error) {
    return (
      <Box
        sx={{
          backgroundColor: BRAND.bgPage,
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              p: 5,
              borderRadius: '16px',
              textAlign: 'center',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: BRAND.redLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 32, color: BRAND.red }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: BRAND.textPrimary, mb: 1 }}>
              Unable to Load Shop
            </Typography>
            <Typography variant="body2" sx={{ color: BRAND.textSecondary, mb: 3 }}>
              {error || 'Something went wrong while fetching the vendor details.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/vendors')}
              sx={{
                backgroundColor: BRAND.primaryGreen,
                color: BRAND.white,
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1,
                textTransform: 'none',
                '&:hover': { backgroundColor: BRAND.darkGreen },
              }}
            >
              Browse Other Shops
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  // Vendor Not Found State
  if (!vendor) {
    return (
      <Box
        sx={{
          backgroundColor: BRAND.bgPage,
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              p: 5,
              borderRadius: '16px',
              textAlign: 'center',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: BRAND.bgPage,
                border: `1px solid ${BRAND.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <StorefrontIcon sx={{ fontSize: 32, color: BRAND.textSecondary }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: BRAND.textPrimary, mb: 1 }}>
              Shop Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: BRAND.textSecondary, mb: 3 }}>
              This shop is currently unavailable or has been removed.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/vendors')}
              sx={{
                backgroundColor: BRAND.primaryGreen,
                color: BRAND.white,
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1,
                textTransform: 'none',
                '&:hover': { backgroundColor: BRAND.darkGreen },
              }}
            >
              Discover Local Shops
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: BRAND.bgPage,
        minHeight: '100vh',
        pb: { xs: 18, md: 10 },
        position: 'relative',
      }}
    >
      {/* 1. SHOP HEADER (Cover, Avatar, Name, Rating, Badges, Actions) */}
      <VendorHeader vendor={vendor} />

      {/* 2. MAIN CATALOG CONTAINER (CENTERED 1280PX) */}
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1280px !important',
          mt: { xs: 2.5, sm: 3 },
          px: { xs: 1.5, sm: 2.5, md: 3 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* IN-SHOP SEARCH BAR */}
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.borderInput}`,
              borderRadius: '12px',
              height: { xs: 46, sm: 48 },
              px: 1.5,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                borderColor: BRAND.primaryGreen,
                boxShadow: `0 0 0 3px ${BRAND.lightGreen}`,
              },
            }}
          >
            <SearchIcon sx={{ color: BRAND.textSecondary, mr: 1, fontSize: 22 }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder={`Search products in ${vendor.name || 'this shop'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: '13.5px', sm: '14.5px' },
                  color: BRAND.textPrimary,
                  fontWeight: 500,
                },
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                sx={{ color: BRAND.textSecondary, p: 0.5 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* DYNAMIC CATEGORY TABS (HORIZONTAL SCROLLING) */}
        {categoryTabs.length > 1 && (
          <Box
            sx={{
              mb: 2.5,
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
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  startIcon={
                    isPopular ? (
                      <WhatshotIcon
                        sx={{
                          fontSize: '16px !important',
                          color: isSelected ? `${BRAND.white} !important` : `${BRAND.orange} !important`,
                        }}
                      />
                    ) : null
                  }
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '12.5px', sm: '13px' },
                    px: { xs: 1.8, sm: 2.2 },
                    py: 0.6,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: isSelected ? BRAND.primaryGreen : BRAND.white,
                    color: isSelected ? BRAND.white : BRAND.textPrimary,
                    border: isSelected ? `1px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
                    textTransform: 'none',
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? BRAND.darkGreen : BRAND.bgPage,
                      borderColor: isSelected ? BRAND.darkGreen : BRAND.border,
                    },
                  }}
                >
                  {cat}
                </Button>
              );
            })}
          </Box>
        )}

        {/* SECTION HEADING & ITEM COUNT */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                color: BRAND.textPrimary,
                fontSize: { xs: '15px', sm: '17px' },
              }}
            >
              {selectedCategory === 'All'
                ? 'All Products'
                : selectedCategory === 'Popular'
                ? 'Popular Items'
                : selectedCategory}
            </Typography>
            <Box
              sx={{
                backgroundColor: BRAND.lightGreen,
                color: BRAND.primaryGreen,
                fontWeight: 700,
                fontSize: '11.5px',
                px: 0.8,
                py: 0.2,
                borderRadius: '6px',
              }}
            >
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </Box>
          </Box>

          {searchQuery && (
            <Button
              size="small"
              onClick={() => setSearchQuery('')}
              sx={{
                color: BRAND.orange,
                fontWeight: 600,
                fontSize: '12.5px',
                textTransform: 'none',
                p: '2px 6px',
              }}
            >
              Clear search
            </Button>
          )}
        </Box>

        {/* PRODUCT GRID / EMPTY STATES */}
        {products.length === 0 ? (
          /* No products in vendor shop */
          <Fade in timeout={400}>
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 3,
                borderRadius: '16px',
                backgroundColor: BRAND.white,
                border: `1px dashed ${BRAND.border}`,
                maxWidth: 540,
                mx: 'auto',
                my: 4,
              }}
            >
              <LocalMallOutlinedIcon sx={{ fontSize: 48, color: BRAND.textSecondary, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND.textPrimary, mb: 0.5 }}>
                No products available
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND.textSecondary }}>
                This shop hasn't added products yet.
              </Typography>
            </Box>
          </Fade>
        ) : filteredProducts.length === 0 ? (
          /* No filter / search results */
          <Fade in timeout={400}>
            <Box
              sx={{
                textAlign: 'center',
                py: 7,
                px: 3,
                borderRadius: '16px',
                backgroundColor: BRAND.white,
                border: `1px dashed ${BRAND.border}`,
                maxWidth: 540,
                mx: 'auto',
                my: 4,
              }}
            >
              <SearchIcon sx={{ fontSize: 44, color: BRAND.textSecondary, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: BRAND.textPrimary, mb: 0.5 }}>
                No products found
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND.textSecondary, mb: 2.5 }}>
                Try another search or change your filter.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                sx={{
                  backgroundColor: BRAND.primaryGreen,
                  color: BRAND.white,
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 3,
                  py: 1,
                  fontSize: '13.5px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: BRAND.darkGreen,
                  },
                }}
              >
                Clear Search
              </Button>
            </Box>
          </Fade>
        ) : (
          /* 2-Column Mobile & 4-Column Desktop CSS Grid */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: { xs: 1.5, sm: 2, md: 2.5 },
              width: '100%',
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                vendorId={vendorId}
              />
            ))}
          </Box>
        )}
      </Container>

      {/* 3. STICKY FLOATING CART BAR (Floats above mobile bottom navigation) */}
      <FloatingCartBar
        totalItems={cartDetails.totalItems}
        subtotal={cartDetails.subtotal}
        vendorName={vendor.name}
        onViewCart={() => setIsCartDrawerOpen(true)}
      />

      {/* 4. SLIDE-IN CART DRAWER (Desktop right-drawer / Mobile bottom-sheet) */}
      <CartDrawer
        open={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        vendorId={vendorId}
        vendorName={vendor.name}
        items={cartDetails.items}
        subtotal={cartDetails.subtotal}
        totalItems={cartDetails.totalItems}
      />

      {/* 5. SCROLL TO TOP BUTTON */}
      <Fade in={showScrollTop}>
        <IconButton
          onClick={scrollToTop}
          aria-label="Scroll to top"
          sx={{
            position: 'fixed',
            bottom: { xs: cartDetails.totalItems > 0 ? 140 : 80, md: 32 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
            width: 44,
            height: 44,
            backgroundColor: BRAND.white,
            border: `2px solid ${BRAND.primaryGreen}`,
            boxShadow: '0 4px 16px rgba(8, 127, 91, 0.2)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: BRAND.primaryGreen,
              transform: 'translateY(-2px)',
              '& .MuiSvgIcon-root': {
                color: BRAND.white,
              },
            },
          }}
        >
          <KeyboardArrowUpIcon
            sx={{
              fontSize: '1.5rem',
              color: BRAND.primaryGreen,
              transition: 'color 0.2s ease',
            }}
          />
        </IconButton>
      </Fade>
    </Box>
  );
};

export default VendorDetailsPage;
