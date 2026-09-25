import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Chip,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Stack,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../services/api';
import ProductCard from '../components/ProductCard';
import OmniSearchModal from '../components/OmniSearchModal';
import FloatingCartBar from '../components/FloatingCartBar';
import CartDrawer from '../components/CartDrawer';
import { useCartContext } from '../context/CartContext';

const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  orangeLight: '#FFF4E6',
  white: '#FFFFFF',
  textPrimary: '#17221D',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  bgPage: '#F7F9F8',
};

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const moduleId = searchParams.get('moduleId') || '';

  // Tab: 0 = 'all', 1 = 'dishes', 2 = 'stores'
  const [activeTab, setActiveTab] = useState(0);

  // Filters
  const [vegOnly, setVegOnly] = useState(false);
  const [under30Mins, setUnder30Mins] = useState(false);
  const [hasOffersOnly, setHasOffersOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Results & Loading
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ vendors: [], products: [], totalVendors: 0, totalProducts: 0 });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const coords = {};
      try {
        const active = localStorage.getItem('activeDeliveryAddress');
        if (active) {
          const parsed = JSON.parse(active);
          if (parsed.latitude && parsed.longitude) {
            coords['x-latitude'] = parsed.latitude.toString();
            coords['x-longitude'] = parsed.longitude.toString();
          }
        }
      } catch {}

      const params = {
        q: query,
        moduleId: moduleId || undefined,
        dietary: vegOnly ? 'veg' : 'all',
        maxDeliveryTime: under30Mins ? 30 : undefined,
        hasOffers: hasOffersOnly ? 'true' : undefined,
        openNow: openNowOnly ? 'true' : undefined,
        sortBy,
      };

      const res = await apiClient.get('/app/search/results', { params, headers: coords });
      if (res?.data) {
        setResults(res.data);
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
    } finally {
      setLoading(false);
    }
  }, [query, moduleId, vegOnly, under30Mins, hasOffersOnly, openNowOnly, sortBy]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const totalCount = results.totalProducts + results.totalVendors;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: BRAND.bgPage, pb: 12 }}>
      {/* Top Search Banner & Header */}
      <Box
        sx={{
          backgroundColor: BRAND.white,
          borderBottom: `1px solid ${BRAND.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: BRAND.textPrimary }}>
              <ArrowBackIcon />
            </IconButton>

            {/* Clickable Search Input triggering Omnisearch modal */}
            <Box
              onClick={() => setIsSearchModalOpen(true)}
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: '12px',
                px: 2,
                py: 1,
                cursor: 'pointer',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#E5E7EB',
                  borderColor: BRAND.primaryGreen,
                },
              }}
            >
              <SearchIcon sx={{ color: BRAND.primaryGreen, mr: 1, fontSize: 22 }} />
              <Typography sx={{ fontSize: '15px', fontWeight: 600, color: BRAND.textPrimary, flexGrow: 1 }}>
                {query || 'Search for food, groceries, stores...'}
              </Typography>
              <Chip
                label="Edit"
                size="small"
                sx={{
                  height: 24,
                  fontSize: '11px',
                  fontWeight: 700,
                  bgcolor: BRAND.lightGreen,
                  color: BRAND.darkGreen,
                }}
              />
            </Box>
          </Box>

          {/* Tab Navigation: All | Dishes & Items | Stores */}
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: '44px',
                '& .MuiTab-root': {
                  minHeight: '44px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  px: 2,
                  color: BRAND.textSecondary,
                  '&.Mui-selected': { color: BRAND.primaryGreen },
                },
                '& .MuiTabs-indicator': { backgroundColor: BRAND.primaryGreen, height: 3, borderRadius: '3px' },
              }}
            >
              <Tab label={`All (${totalCount})`} />
              <Tab label={`Dishes & Items (${results.totalProducts})`} />
              <Tab label={`Stores & Vendors (${results.totalVendors})`} />
            </Tabs>
          </Box>
        </Container>

        {/* Filter & Sort Action Strip */}
        <Box sx={{ borderTop: `1px solid ${BRAND.border}`, backgroundColor: '#FAFAFA', py: 1 }}>
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                overflowX: 'auto',
                pb: { xs: 0.5, sm: 0 },
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {/* Pure Veg Switch Pill */}
              <Box
                onClick={() => setVegOnly(!vegOnly)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.4,
                  py: 0.6,
                  borderRadius: '20px',
                  border: `1.5px solid ${vegOnly ? BRAND.primaryGreen : '#D1D5DB'}`,
                  backgroundColor: vegOnly ? BRAND.lightGreen : BRAND.white,
                  color: vegOnly ? BRAND.darkGreen : BRAND.textPrimary,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    border: '2px solid #087F5B',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#087F5B' }} />
                </Box>
                Veg Only
              </Box>

              {/* Fast Delivery (< 30 mins) */}
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: '15px !important' }} />}
                label="Under 30 Mins"
                clickable
                onClick={() => setUnder30Mins(!under30Mins)}
                sx={{
                  fontWeight: 600,
                  fontSize: '12.5px',
                  borderRadius: '20px',
                  bgcolor: under30Mins ? BRAND.lightGreen : BRAND.white,
                  color: under30Mins ? BRAND.darkGreen : BRAND.textPrimary,
                  border: `1.5px solid ${under30Mins ? BRAND.primaryGreen : '#D1D5DB'}`,
                  '&:hover': { bgcolor: under30Mins ? BRAND.lightGreen : '#F3F4F6' },
                }}
              />

              {/* Great Offers */}
              <Chip
                icon={<LocalOfferIcon sx={{ fontSize: '15px !important', color: BRAND.orange }} />}
                label="Offers & Discounts"
                clickable
                onClick={() => setHasOffersOnly(!hasOffersOnly)}
                sx={{
                  fontWeight: 600,
                  fontSize: '12.5px',
                  borderRadius: '20px',
                  bgcolor: hasOffersOnly ? BRAND.orangeLight : BRAND.white,
                  color: hasOffersOnly ? BRAND.orange : BRAND.textPrimary,
                  border: `1.5px solid ${hasOffersOnly ? BRAND.orange : '#D1D5DB'}`,
                }}
              />

              {/* Open Stores Only */}
              <Chip
                label="Open Now"
                clickable
                onClick={() => setOpenNowOnly(!openNowOnly)}
                sx={{
                  fontWeight: 600,
                  fontSize: '12.5px',
                  borderRadius: '20px',
                  bgcolor: openNowOnly ? BRAND.lightGreen : BRAND.white,
                  color: openNowOnly ? BRAND.darkGreen : BRAND.textPrimary,
                  border: `1.5px solid ${openNowOnly ? BRAND.primaryGreen : '#D1D5DB'}`,
                }}
              />

              <Box sx={{ flexGrow: 1 }} />

              {/* Sort By Dropdown */}
              <FormControl size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    height: 32,
                    backgroundColor: BRAND.white,
                    '& .MuiSelect-select': { py: 0.5, px: 1.5 },
                  }}
                >
                  <MenuItem value="relevance">Relevance</MenuItem>
                  <MenuItem value="distance">Nearest First</MenuItem>
                  <MenuItem value="time">Fastest Delivery</MenuItem>
                  <MenuItem value="price_low">Price: Low to High</MenuItem>
                  <MenuItem value="price_high">Price: High to Low</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Main Results Container */}
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: BRAND.primaryGreen }} />
            <Typography sx={{ mt: 2, fontSize: '14px', fontWeight: 600, color: BRAND.textSecondary }}>
              Searching restaurants and dishes near you...
            </Typography>
          </Box>
        ) : totalCount === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, backgroundColor: BRAND.white, borderRadius: '20px', p: 4 }}>
            <StorefrontIcon sx={{ fontSize: 60, color: BRAND.textSecondary, mb: 1 }} />
            <Typography sx={{ fontSize: '20px', fontWeight: 800, color: BRAND.textPrimary }}>
              No matches found for "{query}"
            </Typography>
            <Typography sx={{ fontSize: '14px', color: BRAND.textSecondary, mt: 1, maxWidth: 450, mx: 'auto' }}>
              We couldn't find any dishes or stores matching your filters. Try clearing some filters or searching for popular dishes like Pizza, Biryani, or Burgers.
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setVegOnly(false);
                setUnder30Mins(false);
                setHasOffersOnly(false);
                setOpenNowOnly(false);
                setSortBy('relevance');
              }}
              sx={{
                mt: 3,
                backgroundColor: BRAND.primaryGreen,
                fontWeight: 700,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': { backgroundColor: BRAND.darkGreen }
              }}
            >
              Reset All Filters
            </Button>
          </Box>
        ) : (
          <Stack spacing={4}>
            {/* TAB 0: ALL RESULTS (Blended View) */}
            {activeTab === 0 && (
              <>
                {/* Top Matching Stores Row */}
                {results.vendors.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography sx={{ fontSize: '18px', fontWeight: 800, color: BRAND.textPrimary }}>
                        Matching Restaurants & Stores ({results.vendors.length})
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(2)}
                        sx={{ color: BRAND.primaryGreen, fontWeight: 700, textTransform: 'none' }}
                      >
                        View all stores →
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      {results.vendors.slice(0, 3).map((store) => (
                        <Grid item xs={12} sm={6} md={4} key={store._id}>
                          <Card
                            onClick={() => navigate(`/vendor/${store._id}`)}
                            sx={{
                              borderRadius: '16px',
                              cursor: 'pointer',
                              border: `1px solid ${BRAND.border}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-3px)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                borderColor: BRAND.primaryGreen,
                              },
                            }}
                          >
                            <Box sx={{ position: 'relative', height: 130 }}>
                              <CardMedia
                                component="img"
                                height="130"
                                image={store.vendor_image || '/placeholder-store.jpg'}
                                alt={store.name}
                                sx={{ objectFit: 'cover' }}
                              />
                              <Chip
                                label={store.isOpen ? 'OPEN' : 'CLOSED'}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  bgcolor: store.isOpen ? BRAND.primaryGreen : '#DC2626',
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '10px',
                                  height: 20,
                                }}
                              />
                            </Box>
                            <CardContent sx={{ p: 1.5 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.textPrimary, noWrap: true }}>
                                {store.name}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, noWrap: true, mt: 0.2 }}>
                                {store.address}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                                <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <LocationOnIcon sx={{ fontSize: 13, color: BRAND.primaryGreen }} /> {store.distance_km} km
                                </Typography>
                                <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <AccessTimeIcon sx={{ fontSize: 13 }} /> ~{store.estimated_delivery_time} mins
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Matching Dishes Grid */}
                {results.products.length > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography sx={{ fontSize: '18px', fontWeight: 800, color: BRAND.textPrimary }}>
                        Matching Dishes & Items ({results.products.length})
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(1)}
                        sx={{ color: BRAND.primaryGreen, fontWeight: 700, textTransform: 'none' }}
                      >
                        View all dishes →
                      </Button>
                    </Box>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      {results.products.map((product) => (
                        <Grid item xs={6} sm={4} md={3} key={product._id}>
                          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <ProductCard
                              product={product}
                              vendorId={product.vendor?._id}
                            />
                            {/* Vendor Attribution Footnote */}
                            <Box
                              onClick={() => navigate(`/vendor/${product.vendor?._id}`)}
                              sx={{
                                mt: 0.8,
                                px: 1,
                                py: 0.5,
                                backgroundColor: BRAND.white,
                                borderRadius: '8px',
                                border: `1px solid ${BRAND.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                '&:hover': { borderColor: BRAND.primaryGreen },
                              }}
                            >
                              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: BRAND.textSecondary, noWrap: true }}>
                                🏪 {product.vendor?.name}
                              </Typography>
                              {product.vendor?.distance_km != null && (
                                <Typography sx={{ fontSize: '10px', color: BRAND.primaryGreen, fontWeight: 700, flexShrink: 0 }}>
                                  {product.vendor.distance_km} km
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </>
            )}

            {/* TAB 1: ALL DISHES & ITEMS */}
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                  {results.products.map((product) => (
                    <Grid item xs={6} sm={4} md={3} key={product._id}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <ProductCard
                          product={product}
                          vendorId={product.vendor?._id}
                        />
                        <Box
                          onClick={() => navigate(`/vendor/${product.vendor?._id}`)}
                          sx={{
                            mt: 0.8,
                            px: 1,
                            py: 0.5,
                            backgroundColor: BRAND.white,
                            borderRadius: '8px',
                            border: `1px solid ${BRAND.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': { borderColor: BRAND.primaryGreen },
                          }}
                        >
                          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: BRAND.textSecondary, noWrap: true }}>
                            🏪 {product.vendor?.name}
                          </Typography>
                          {product.vendor?.distance_km != null && (
                            <Typography sx={{ fontSize: '10px', color: BRAND.primaryGreen, fontWeight: 700, flexShrink: 0 }}>
                              {product.vendor.distance_km} km
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* TAB 2: ALL RESTAURANTS & STORES */}
            {activeTab === 2 && (
              <Box>
                <Grid container spacing={2}>
                  {results.vendors.map((store) => (
                    <Grid item xs={12} sm={6} md={4} key={store._id}>
                      <Card
                        onClick={() => navigate(`/vendor/${store._id}`)}
                        sx={{
                          borderRadius: '16px',
                          cursor: 'pointer',
                          border: `1px solid ${BRAND.border}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            borderColor: BRAND.primaryGreen,
                          },
                        }}
                      >
                        <Box sx={{ position: 'relative', height: 140 }}>
                          <CardMedia
                            component="img"
                            height="140"
                            image={store.vendor_image || '/placeholder-store.jpg'}
                            alt={store.name}
                            sx={{ objectFit: 'cover' }}
                          />
                          <Chip
                            label={store.isOpen ? 'OPEN NOW' : 'CLOSED'}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: store.isOpen ? BRAND.primaryGreen : '#DC2626',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '10px',
                              height: 20,
                            }}
                          />
                        </Box>
                        <CardContent sx={{ p: 2 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '16px', color: BRAND.textPrimary, noWrap: true }}>
                            {store.name}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, noWrap: true, mt: 0.3 }}>
                            {store.address}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
                            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                              <LocationOnIcon sx={{ fontSize: 15, color: BRAND.primaryGreen }} /> {store.distance_km} km away
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                              <AccessTimeIcon sx={{ fontSize: 15 }} /> {store.estimated_delivery_time} mins
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Stack>
        )}
      </Container>

      {/* Omnisearch Modal Trigger */}
      <OmniSearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={query}
        moduleId={moduleId}
      />

      {/* Floating Cart Bar & Drawer */}
      <FloatingCartBar onOpenCart={() => setIsCartDrawerOpen(true)} />
      <CartDrawer
        open={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onProceedToCheckout={() => {
          setIsCartDrawerOpen(false);
          navigate('/cart');
        }}
      />
    </Box>
  );
}
