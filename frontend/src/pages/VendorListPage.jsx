import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Alert,
  Button,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate, useSearchParams } from 'react-router-dom';

import useVendors from '../hooks/useVendors';
import apiClient from '../services/api';

// Fallback shop image
const FALLBACK_SHOP_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect fill="%23FAFAF7" width="400" height="260"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%236B7280" font-family="sans-serif" text-anchor="middle" dy=".3em"%3EAapnuBazaar Local Store%3C/text%3E%3C/svg%3E';

const VendorListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { vendors, loading, error } = useVendors();

  // Search state
  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get('search') || '';
  });

  // Category modules state
  const [modules, setModules] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return searchParams.get('moduleId') || 'all';
  });

  // Sort state: 'recommended' | 'rating' | 'distance' | 'delivery_time'
  const [sortBy, setSortBy] = useState('recommended');

  // Filter toggles: openNow, fastDelivery, hasOffers, favorites
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);
  const filterFavorites = searchParams.get('filter') === 'favorites';

  // Favorites state
  const [favoriteShopIds, setFavoriteShopIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aapnubazaar_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Location states
  const [locationDialog, setLocationDialog] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Location label from saved address or default
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

  // Fetch active categories/modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await apiClient.get('/app/modules/active/list');
        if (res.success && Array.isArray(res.data)) {
          setModules(res.data);
        }
      } catch (err) {
        console.error('Error fetching categories in VendorListPage:', err);
      }
    };
    fetchModules();
  }, []);

  // Sync moduleId from URL param
  useEffect(() => {
    const moduleIdParam = searchParams.get('moduleId');
    if (moduleIdParam) {
      setSelectedCategory(moduleIdParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Check for addresses and coordinates on mount
  useEffect(() => {
    const checkLocationSetup = async () => {
      try {
        const savedCoordinates = localStorage.getItem('userCoordinates');
        if (savedCoordinates) {
          return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
          return;
        }

        const response = await apiClient.get('/app/addresses');
        if (response.success && (!response.data || response.data.length === 0)) {
          setLocationDialog(true);
        }
      } catch (error) {
        console.error('Error checking addresses:', error);
      }
    };

    checkLocationSetup();
  }, []);

  // Geolocation trigger
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        localStorage.setItem(
          'userCoordinates',
          JSON.stringify({
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
          })
        );

        setLocationLoading(false);
        setLocationDialog(false);
        setSnackbarMessage('Location updated successfully!');
        setSnackbarOpen(true);

        setTimeout(() => {
          window.location.reload();
        }, 800);
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSkipLocation = () => {
    setLocationDialog(false);
  };

  // Toggle favorite shop
  const handleToggleFavorite = (vendorId, e) => {
    e.stopPropagation();
    let updated;
    if (favoriteShopIds.includes(vendorId)) {
      updated = favoriteShopIds.filter((id) => id !== vendorId);
      setSnackbarMessage('Removed from favorite shops');
    } else {
      updated = [...favoriteShopIds, vendorId];
      setSnackbarMessage('Added to your favorite shops!');
    }
    setFavoriteShopIds(updated);
    setSnackbarOpen(true);
    localStorage.setItem('aapnubazaar_favorites', JSON.stringify(updated));
  };

  // Handle category selection
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('moduleId');
      setSearchParams(searchParams);
    } else {
      searchParams.set('moduleId', catId);
      setSearchParams(searchParams);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('recommended');
    setFilterOpenNow(false);
    setFilterFastDelivery(false);
    setFilterOffers(false);
    setSearchParams({});
  };

  // Filtered & Sorted Vendors
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];

    let list = [...vendors];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => {
        const name = (v.name || '').toLowerCase();
        const desc = (v.address?.city || v.address?.address_line_1 || '').toLowerCase();
        const moduleName = (v.module?.name || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || moduleName.includes(q);
      });
    }

    // 2. Category Module Filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((v) => {
        const vModId = v.module?._id || v.module;
        return String(vModId) === String(selectedCategory);
      });
    }

    // 3. Filter: Open Now
    if (filterOpenNow) {
      list = list.filter((v) => v.isOpen !== false && v.status !== 0);
    }

    // 4. Filter: Fast Delivery (<= 30 mins prep/delivery)
    if (filterFastDelivery) {
      list = list.filter((v) => (v.preparation_time_minute || 30) <= 30);
    }

    // 5. Filter: Offers (Free delivery or packaging charge 0)
    if (filterOffers) {
      list = list.filter((v) => v.delivery_charge === 0 || v.discount > 0);
    }

    // 5b. Filter: Favorites
    if (filterFavorites) {
      list = list.filter((v) => favoriteShopIds.includes(v._id));
    }

    // 6. Sorting
    if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    } else if (sortBy === 'distance') {
      list.sort((a, b) => {
        const distA = a.distance_km != null ? a.distance_km : 9999;
        const distB = b.distance_km != null ? b.distance_km : 9999;
        return distA - distB;
      });
    } else if (sortBy === 'delivery_time') {
      list.sort((a, b) => {
        const timeA = a.preparation_time_minute || 30;
        const timeB = b.preparation_time_minute || 30;
        return timeA - timeB;
      });
    }
    // 'recommended' maintains original server-side proximity aggregation

    return list;
  }, [vendors, searchQuery, selectedCategory, filterOpenNow, filterFastDelivery, filterOffers, filterFavorites, favoriteShopIds, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    sortBy !== 'recommended' ||
    filterOpenNow ||
    filterFastDelivery ||
    filterOffers ||
    filterFavorites;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FAFAF7', pb: { xs: 8, md: 10 } }}>
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          py: { xs: 3.5, sm: 4.5, md: 5 },
          mb: { xs: 3, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 760, mx: 'auto', textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.85rem', sm: '2.4rem', md: '2.75rem' },
                color: '#151515',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                mb: 1,
              }}
            >
              Discover Local Shops
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: '14.5px', sm: '16px' },
                color: '#6B7280',
                mb: 2.5,
                lineHeight: 1.5,
              }}
            >
              Find food, groceries, electronics and more from shops near you.
            </Typography>

            {/* Location Selector Pill */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 3 }}>
              <Button
                onClick={() => setLocationDialog(true)}
                sx={{
                  backgroundColor: '#FAFAF7',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  px: 2,
                  py: 0.7,
                  color: '#151515',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#EBFBEE', borderColor: '#087F5B' },
                }}
              >
                <LocationOnIcon sx={{ color: '#087F5B', fontSize: 18, mr: 0.8 }} />
                <Typography component="span" sx={{ fontSize: '13px', color: '#6B7280', mr: 0.6 }}>
                  Delivering to:
                </Typography>
                <Typography component="span" sx={{ fontSize: '13.5px', fontWeight: 700, color: '#151515' }}>
                  {locationLabel}
                </Typography>
              </Button>
            </Box>

            {/* Search Input */}
            <Paper
              elevation={0}
              sx={{
                p: 0.6,
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                border: '2px solid #087F5B',
                boxShadow: '0 6px 20px rgba(8, 127, 91, 0.08)',
                display: 'flex',
                alignItems: 'center',
                maxWidth: 620,
                mx: 'auto',
              }}
            >
              <SearchIcon sx={{ color: '#6B7280', ml: 1.5, mr: 1 }} />
              <TextField
                fullWidth
                variant="standard"
                placeholder="Search shops, cuisines, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: { fontSize: { xs: '14px', sm: '15px' }, color: '#151515' },
                }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ mr: 0.5, color: '#9CA3AF' }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Paper>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* ─────────────────────────────────────────────────────────────
            2. CATEGORY FILTERS (HORIZONTAL SCROLLING ON MOBILE)
        ───────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            overflowX: 'auto',
            pb: 1.5,
            mb: 3,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {/* All Category Pill */}
          <Chip
            label="All Categories"
            clickable
            onClick={() => handleCategorySelect('all')}
            sx={{
              fontWeight: 700,
              fontSize: '13.5px',
              py: 2.2,
              px: 1.2,
              borderRadius: '10px',
              backgroundColor: selectedCategory === 'all' ? '#087F5B' : '#FFFFFF',
              color: selectedCategory === 'all' ? '#FFFFFF' : '#151515',
              border: selectedCategory === 'all' ? '1px solid #087F5B' : '1px solid #E5E7EB',
              '&:hover': {
                backgroundColor: selectedCategory === 'all' ? '#075B43' : '#F3F4F6',
              },
            }}
          />

          {/* Dynamic Module Categories from Database */}
          {(modules.length > 0
            ? modules
            : [
                { _id: 'cat-grocery', name: 'Grocery' },
                { _id: 'cat-food', name: 'Food' },
                { _id: 'cat-stores', name: 'Stores' },
                { _id: 'cat-electronics', name: 'Electronics' },
              ]
          ).map((mod) => {
            const isSelected = selectedCategory === mod._id;
            return (
              <Chip
                key={mod._id}
                label={mod.name}
                clickable
                onClick={() => handleCategorySelect(mod._id)}
                sx={{
                  fontWeight: 700,
                  fontSize: '13.5px',
                  py: 2.2,
                  px: 1.2,
                  borderRadius: '10px',
                  backgroundColor: isSelected ? '#087F5B' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#151515',
                  border: isSelected ? '1px solid #087F5B' : '1px solid #E5E7EB',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: isSelected ? '#075B43' : '#F3F4F6',
                  },
                }}
              />
            );
          })}
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            3. FILTER BAR (SORT & TOGGLE FILTERS)
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.8, sm: 2 },
            borderRadius: '14px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            mb: 3,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Left: Filter Toggle Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', mr: 0.5, display: { xs: 'none', sm: 'block' } }}>
              Filters:
            </Typography>

            {/* Filter: Open Now */}
            <Chip
              label="Open Now"
              clickable
              onClick={() => setFilterOpenNow(!filterOpenNow)}
              sx={{
                fontWeight: 600,
                fontSize: '12.5px',
                borderRadius: '8px',
                backgroundColor: filterOpenNow ? '#EBFBEE' : '#FAFAF7',
                color: filterOpenNow ? '#087F5B' : '#6B7280',
                border: filterOpenNow ? '1.5px solid #087F5B' : '1px solid #E5E7EB',
                '&:hover': { backgroundColor: filterOpenNow ? '#EBFBEE' : '#F3F4F6' },
              }}
            />

            {/* Filter: Fast Delivery */}
            <Chip
              label="Fast Delivery (≤ 30m)"
              clickable
              onClick={() => setFilterFastDelivery(!filterFastDelivery)}
              sx={{
                fontWeight: 600,
                fontSize: '12.5px',
                borderRadius: '8px',
                backgroundColor: filterFastDelivery ? '#EBFBEE' : '#FAFAF7',
                color: filterFastDelivery ? '#087F5B' : '#6B7280',
                border: filterFastDelivery ? '1.5px solid #087F5B' : '1px solid #E5E7EB',
                '&:hover': { backgroundColor: filterFastDelivery ? '#EBFBEE' : '#F3F4F6' },
              }}
            />

            {/* Filter: Offers */}
            <Chip
              label="Offers / Free Delivery"
              clickable
              onClick={() => setFilterOffers(!filterOffers)}
              sx={{
                fontWeight: 600,
                fontSize: '12.5px',
                borderRadius: '8px',
                backgroundColor: filterOffers ? '#FFF4E6' : '#FAFAF7',
                color: filterOffers ? '#FF6B00' : '#6B7280',
                border: filterOffers ? '1.5px solid #FF6B00' : '1px solid #E5E7EB',
                '&:hover': { backgroundColor: filterOffers ? '#FFF4E6' : '#F3F4F6' },
              }}
            />

            {/* Filter: Favorites */}
            <Chip
              icon={<FavoriteIcon sx={{ fontSize: '15px !important', color: filterFavorites ? '#E03131 !important' : '#6B7280' }} />}
              label="Favorites"
              clickable
              onClick={() => {
                if (filterFavorites) {
                  searchParams.delete('filter');
                  setSearchParams(searchParams);
                } else {
                  searchParams.set('filter', 'favorites');
                  setSearchParams(searchParams);
                }
              }}
              sx={{
                fontWeight: 600,
                fontSize: '12.5px',
                borderRadius: '8px',
                backgroundColor: filterFavorites ? '#FFF5F5' : '#FAFAF7',
                color: filterFavorites ? '#E03131' : '#6B7280',
                border: filterFavorites ? '1.5px solid #FFC9C9' : '1px solid #E5E7EB',
                '&:hover': { backgroundColor: filterFavorites ? '#FFF5F5' : '#F3F4F6' },
              }}
            />

            {hasActiveFilters && (
              <Button
                size="small"
                onClick={handleClearFilters}
                sx={{
                  color: '#E03131',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textTransform: 'none',
                  p: 0.5,
                  ml: 0.5,
                  '&:hover': { backgroundColor: '#FFF5F5' },
                }}
              >
                Reset
              </Button>
            )}
          </Box>

          {/* Right: Sort Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
              Sort:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  backgroundColor: '#FAFAF7',
                  border: '1px solid #E5E7EB',
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                <MenuItem value="recommended" sx={{ fontSize: '13px' }}>Recommended</MenuItem>
                <MenuItem value="rating" sx={{ fontSize: '13px' }}>Rating (High to Low)</MenuItem>
                <MenuItem value="distance" sx={{ fontSize: '13px' }}>Distance (Nearest)</MenuItem>
                <MenuItem value="delivery_time" sx={{ fontSize: '13px' }}>Delivery Time (Fastest)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            4. RESULT COUNT
        ───────────────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography sx={{ fontSize: '14.5px', fontWeight: 700, color: '#151515' }}>
            {loading ? 'Searching shops...' : `${filteredVendors.length} ${filteredVendors.length === 1 ? 'shop' : 'shops'} found`}
          </Typography>
          {selectedCategory !== 'all' && (
            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
              Filtered by Category
            </Typography>
          )}
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            5. SHOP GRID (DESKTOP: 3-4 COL, TABLET: 2 COL, MOBILE: 1 COL)
        ───────────────────────────────────────────────────────────── */}
        {loading ? (
          <Grid container spacing={{ xs: 2.5, sm: 3 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: '16px' }} />
              </Grid>
            ))}
          </Grid>
        ) : filteredVendors.length > 0 ? (
          <Grid container spacing={{ xs: 2.5, sm: 3 }}>
            {filteredVendors.map((vendor) => {
              const isFav = favoriteShopIds.includes(vendor._id);
              const isOpen = vendor.isOpen !== false && vendor.status !== 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={vendor._id}>
                  <Card
                    onClick={() => navigate(`/vendors/${vendor._id}`)}
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
                        borderColor: '#087F5B',
                      },
                    }}
                  >
                    {/* Shop Image Container */}
                    <Box sx={{ position: 'relative', height: 170, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        image={vendor.vendor_image || FALLBACK_SHOP_IMAGE}
                        alt={vendor.name}
                        loading="lazy"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          '&:hover': { transform: 'scale(1.03)' },
                        }}
                        onError={(e) => {
                          e.target.src = FALLBACK_SHOP_IMAGE;
                        }}
                      />

                      {/* Top Badges */}
                      <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        {/* Status Chip */}
                        <Chip
                          label={isOpen ? 'Open Now' : 'Closed'}
                          size="small"
                          sx={{
                            backgroundColor: isOpen ? '#EBFBEE' : 'rgba(255, 255, 255, 0.95)',
                            color: isOpen ? '#087F5B' : '#6B7280',
                            fontWeight: 700,
                            fontSize: '11px',
                            border: isOpen ? '1px solid #B2F2BB' : '1px solid #E5E7EB',
                            backdropFilter: 'blur(4px)',
                          }}
                        />

                        {/* Favorite Button */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleFavorite(vendor._id, e)}
                          sx={{
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            color: isFav ? '#E03131' : '#6B7280',
                            '&:hover': { backgroundColor: '#FFFFFF', color: '#E03131' },
                          }}
                        >
                          {isFav ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </IconButton>
                      </Box>

                      {/* Category Tag Overlay */}
                      {vendor.module?.name && (
                        <Chip
                          label={vendor.module.name}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 10,
                            left: 10,
                            backgroundColor: 'rgba(21, 21, 21, 0.75)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '11px',
                            backdropFilter: 'blur(4px)',
                          }}
                        />
                      )}
                    </Box>

                    {/* Shop Details */}
                    <CardContent sx={{ p: 2.2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: '17px',
                          color: '#151515',
                          lineHeight: 1.3,
                          mb: 0.8,
                        }}
                      >
                        {vendor.name}
                      </Typography>

                      {/* Rating, Distance, Delivery Time */}
                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <StarIcon sx={{ fontSize: 16, color: '#FF922B' }} />
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#151515' }}>
                            {vendor.rating || '4.8'}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>•</Typography>
                        <Typography sx={{ fontSize: '12.5px', color: '#6B7280', fontWeight: 500 }}>
                          {vendor.distance_km != null ? `${vendor.distance_km} km` : '1.2 km'}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>•</Typography>
                        <Typography sx={{ fontSize: '12.5px', color: '#6B7280', fontWeight: 500 }}>
                          {vendor.preparation_time_minute ? `${vendor.preparation_time_minute}m` : '20–30 min'}
                        </Typography>
                      </Stack>

                      {/* View Shop CTA */}
                      <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #F3F4F6' }}>
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            backgroundColor: '#087F5B',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            py: 0.8,
                            fontWeight: 700,
                            fontSize: '13.5px',
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#075B43' },
                          }}
                        >
                          View Shop →
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              6. BEAUTIFUL EMPTY STATE (EXACT TEXT FROM USER SPEC)
          ───────────────────────────────────────────────────────────── */
          <Paper
            elevation={0}
            sx={{
              p: { xs: 5, sm: 7 },
              textAlign: 'center',
              borderRadius: '20px',
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              maxWidth: 620,
              mx: 'auto',
              my: 4,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#FAFAF7',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <StorefrontIcon sx={{ fontSize: 32, color: '#6B7280' }} />
            </Box>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.4rem', sm: '1.75rem' },
                color: '#151515',
                mb: 1,
              }}
            >
              No shops found
            </Typography>

            <Typography
              sx={{
                fontSize: '15px',
                color: '#6B7280',
                mb: 3.5,
              }}
            >
              Try changing your search or filters.
            </Typography>

            <Button
              variant="contained"
              onClick={handleClearFilters}
              sx={{
                backgroundColor: '#087F5B',
                color: '#FFFFFF',
                px: 3.5,
                py: 1.2,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14.5px',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#075B43' },
              }}
            >
              Clear Filters
            </Button>
          </Paper>
        )}
      </Container>

      {/* Location Permission Dialog */}
      <Dialog
        open={locationDialog}
        onClose={handleSkipLocation}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: '#EBFBEE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MyLocationIcon sx={{ fontSize: 26, color: '#087F5B' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#151515' }}>
                Enable Location
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                Find nearest neighborhood vendors
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#6B7280', lineHeight: 1.6 }}>
            We use your location to calculate exact store distances and provide accurate delivery time estimates.
          </Typography>

          {locationError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {locationError}
            </Alert>
          )}

          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              backgroundColor: '#FAFAF7',
              border: '1px solid #E5E7EB',
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: '#087F5B', mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: '#151515', fontWeight: 600 }}>
                  Shows stores sorted by closest distance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: '#087F5B', mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: '#151515', fontWeight: 600 }}>
                  Accurate doorstep delivery estimates
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: '#087F5B', mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: '#151515', fontWeight: 600 }}>
                  Discover local neighborhood merchants
                </Typography>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleSkipLocation}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#6B7280',
            }}
          >
            Maybe Later
          </Button>
          <Button
            variant="contained"
            onClick={getCurrentLocation}
            disabled={locationLoading}
            startIcon={
              locationLoading ? (
                <CircularProgress size={18} sx={{ color: '#fff' }} />
              ) : (
                <MyLocationIcon />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: '10px',
              backgroundColor: '#087F5B',
              '&:hover': {
                backgroundColor: '#075B43',
              },
            }}
          >
            {locationLoading ? 'Getting Location...' : 'Enable Location'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{
            width: '100%',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorListPage;
