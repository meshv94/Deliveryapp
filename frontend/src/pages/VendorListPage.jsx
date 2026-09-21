import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Alert,
  Button,
  Stack,
  TextField,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ClearIcon from '@mui/icons-material/Clear';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate, useSearchParams } from 'react-router-dom';

import useVendors from '../hooks/useVendors';
import apiClient from '../services/api';

// Fallback shop image
const FALLBACK_SHOP_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="260"%3E%3Crect fill="%23F7F9F8" width="400" height="260"/%3E%3Ctext x="50%25" y="50%25" font-size="16" font-weight="bold" fill="%23087F5B" font-family="sans-serif" text-anchor="middle" dy=".3em"%3EAapnuBazaar Local Store%3C/text%3E%3C/svg%3E';

// AapnuBazaar Brand Design Tokens
const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#E8F7F1',
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

  // Filter toggles
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterFastDelivery, setFilterFastDelivery] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);
  const filterFavorites = searchParams.get('filter') === 'favorites';

  // Favorites state synced with localStorage
  const [favoriteShopIds, setFavoriteShopIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aapnubazaar_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Location dialog & states
  const [locationDialog, setLocationDialog] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Active delivery address/city label
  const [activeLocationName, setActiveLocationName] = useState(() => {
    try {
      const activeAddress = localStorage.getItem('activeDeliveryAddress');
      if (activeAddress) {
        const parsed = JSON.parse(activeAddress);
        return parsed.city || parsed.displayLabel || parsed.address_line_1 || parsed.address || 'Ahmedabad';
      }
      const savedCity = localStorage.getItem('userCity') || localStorage.getItem('userAddress');
      if (savedCity) return savedCity;
    } catch {}
    return 'Ahmedabad';
  });

  // Listen for address changes in storage
  useEffect(() => {
    const handleAddressUpdated = () => {
      try {
        const activeAddress = localStorage.getItem('activeDeliveryAddress');
        if (activeAddress) {
          const parsed = JSON.parse(activeAddress);
          setActiveLocationName(parsed.city || parsed.displayLabel || parsed.address_line_1 || parsed.address || 'Ahmedabad');
        } else {
          const savedCity = localStorage.getItem('userCity') || localStorage.getItem('userAddress');
          if (savedCity) setActiveLocationName(savedCity);
        }
      } catch {}
    };

    window.addEventListener('address_updated', handleAddressUpdated);
    window.addEventListener('storage', handleAddressUpdated);
    return () => {
      window.removeEventListener('address_updated', handleAddressUpdated);
      window.removeEventListener('storage', handleAddressUpdated);
    };
  }, []);

  // Fetch active marketplace categories
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await apiClient.get('/app/modules/active/list');
        if (res?.success && Array.isArray(res.data)) {
          setModules(res.data);
        }
      } catch (err) {
        console.error('Error fetching categories in VendorListPage:', err);
      }
    };
    fetchModules();
  }, []);

  // Sync params from URL
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

  // Check saved address on initial mount
  useEffect(() => {
    const checkLocationSetup = async () => {
      try {
        const savedCoordinates = localStorage.getItem('userCoordinates');
        if (savedCoordinates) return;

        const token = localStorage.getItem('authToken');
        if (!token) return;

        const response = await apiClient.get('/app/addresses');
        if (response?.success && (!response.data || response.data.length === 0)) {
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
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedCity = 'Current Location';
        let formattedAddress = 'Current Location';

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCpAhl9zWxIfigpQ17hkcgjHoKPNDP07pI';
        try {
          const resp = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const geoData = await resp.json();
          if (geoData.status === 'OK' && geoData.results && geoData.results[0]) {
            formattedAddress = geoData.results[0].formatted_address;
            geoData.results[0].address_components?.forEach((c) => {
              if (c.types.includes('locality')) {
                detectedCity = c.long_name;
              } else if (!detectedCity || detectedCity === 'Current Location') {
                if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality')) {
                  detectedCity = c.long_name;
                }
              }
            });
          }
        } catch (e) {
          console.warn('Geocoding lookup error:', e);
        }

        localStorage.setItem(
          'userCoordinates',
          JSON.stringify({
            latitude,
            longitude,
            timestamp: new Date().toISOString(),
          })
        );
        localStorage.setItem('userCity', detectedCity);
        localStorage.setItem(
          'activeDeliveryAddress',
          JSON.stringify({
            city: detectedCity,
            address: formattedAddress,
            latitude,
            longitude,
          })
        );

        setActiveLocationName(detectedCity);
        window.dispatchEvent(new Event('address_updated'));

        setLocationLoading(false);
        setLocationDialog(false);
        setSnackbarMessage(`Location updated to ${detectedCity}!`);
        setSnackbarOpen(true);
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in browser settings.';
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
  const handleToggleFavorite = useCallback(
    (vendorId, e) => {
      e.stopPropagation();
      let updated;
      if (favoriteShopIds.includes(vendorId)) {
        updated = favoriteShopIds.filter((id) => id !== vendorId);
        setSnackbarMessage('Removed from favorites');
      } else {
        updated = [...favoriteShopIds, vendorId];
        setSnackbarMessage('Added to your favorite shops!');
      }
      setFavoriteShopIds(updated);
      setSnackbarOpen(true);
      localStorage.setItem('aapnubazaar_favorites', JSON.stringify(updated));
    },
    [favoriteShopIds]
  );

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

  // Clear all active filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('recommended');
    setFilterOpenNow(false);
    setFilterFastDelivery(false);
    setFilterOffers(false);
    setSearchParams({});
  };

  // Filtered and Sorted Vendors
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];

    let list = [...vendors];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => {
        const name = (v.name || '').toLowerCase();
        const city = (v.address?.city || v.address?.address_line_1 || '').toLowerCase();
        const moduleName = (v.module?.name || '').toLowerCase();
        return name.includes(q) || city.includes(q) || moduleName.includes(q);
      });
    }

    // 2. Category Module Filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((v) => {
        const vModId = v.module?._id || v.module;
        return String(vModId) === String(selectedCategory);
      });
    }

    // 3. Open Now Filter
    if (filterOpenNow) {
      list = list.filter((v) => v.isOpen !== false && v.status !== 0);
    }

    // 4. Fast Delivery (<= 30 min)
    if (filterFastDelivery) {
      list = list.filter((v) => (v.preparation_time_minute || 30) <= 30);
    }

    // 5. Offers Filter
    if (filterOffers) {
      list = list.filter((v) => v.delivery_charge === 0 || v.discount > 0);
    }

    // 6. Favorites Filter
    if (filterFavorites) {
      list = list.filter((v) => favoriteShopIds.includes(v._id));
    }

    // 7. Sort Options
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

    return list;
  }, [
    vendors,
    searchQuery,
    selectedCategory,
    filterOpenNow,
    filterFastDelivery,
    filterOffers,
    filterFavorites,
    favoriteShopIds,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    sortBy !== 'recommended' ||
    filterOpenNow ||
    filterFastDelivery ||
    filterOffers ||
    filterFavorites;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: BRAND.bgPage,
        pb: { xs: 12, md: 8 },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT MARKETPLACE HERO & SEARCH SECTION
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: BRAND.white,
          borderBottom: `1px solid ${BRAND.border}`,
          pt: { xs: 2.5, sm: 3.5, md: 4 },
          pb: { xs: 2.5, sm: 3.5, md: 4 },
          mb: { xs: 2.5, sm: 3, md: 3.5 },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            maxWidth: '1280px !important',
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
            {/* Page Title */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '24px', sm: '28px', md: '34px' },
                color: BRAND.textPrimary,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                mb: 0.8,
              }}
            >
              Discover Local Shops
            </Typography>

            {/* Subtitle */}
            <Typography
              sx={{
                fontSize: { xs: '13px', sm: '15px' },
                color: BRAND.textSecondary,
                mb: 1.8,
                lineHeight: 1.45,
              }}
            >
              Find food, groceries, electronics and more from verified neighborhood stores.
            </Typography>

            {/* Location Selector Pill */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 2 }}>
              <Button
                onClick={() => setLocationDialog(true)}
                sx={{
                  backgroundColor: BRAND.bgPage,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: '10px',
                  px: 1.8,
                  py: 0.6,
                  color: BRAND.textPrimary,
                  textTransform: 'none',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    backgroundColor: BRAND.lightGreen,
                    borderColor: BRAND.primaryGreen,
                  },
                }}
              >
                <LocationOnIcon sx={{ color: BRAND.primaryGreen, fontSize: 18, mr: 0.6 }} />
                <Typography component="span" sx={{ fontSize: '12.5px', color: BRAND.textSecondary, mr: 0.5 }}>
                  Delivering to:
                </Typography>
                <Typography component="span" sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.textPrimary }}>
                  {activeLocationName}
                </Typography>
              </Button>
            </Box>

            {/* Prominent Search Bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.borderInput}`,
                borderRadius: '12px',
                height: { xs: 46, sm: 50 },
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
                placeholder="Search shops, cuisines, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: { xs: '14px', sm: '15px' },
                    color: BRAND.textPrimary,
                    fontWeight: 500,
                  },
                }}
              />
              {searchQuery && (
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{ color: BRAND.textSecondary, p: 0.5 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT CONTAINER (CENTERED 1280PX)
      ───────────────────────────────────────────────────────────── */}
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1280px !important',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Category Navigation (Horizontal Scrolling Bar) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            mb: 2,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {/* "All" Category Pill */}
          <Button
            onClick={() => handleCategorySelect('all')}
            sx={{
              fontWeight: 700,
              fontSize: { xs: '13px', sm: '13.5px' },
              px: { xs: 2, sm: 2.5 },
              py: 0.8,
              height: 38,
              borderRadius: '10px',
              backgroundColor: selectedCategory === 'all' ? BRAND.primaryGreen : BRAND.white,
              color: selectedCategory === 'all' ? BRAND.white : BRAND.textPrimary,
              border: selectedCategory === 'all' ? `1px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
              textTransform: 'none',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: selectedCategory === 'all' ? BRAND.darkGreen : BRAND.bgPage,
                borderColor: selectedCategory === 'all' ? BRAND.darkGreen : BRAND.border,
              },
            }}
          >
            All Categories
          </Button>

          {/* Dynamic Categories */}
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
              <Button
                key={mod._id}
                onClick={() => handleCategorySelect(mod._id)}
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '13px', sm: '13.5px' },
                  px: { xs: 2, sm: 2.5 },
                  py: 0.8,
                  height: 38,
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
                {mod.name}
              </Button>
            );
          })}
        </Box>

        {/* Filter & Sort Bar (Single Row, No Multi-line Wrapping) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            overflowX: 'auto',
            pb: 1,
            mb: 2.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {/* Sort Dropdown */}
          <FormControl size="small" sx={{ minWidth: 150, flexShrink: 0 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              sx={{
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '10px',
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                height: 38,
                color: BRAND.textPrimary,
                '& .MuiSelect-select': { py: 0.8, px: 1.5 },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              }}
            >
              <MenuItem value="recommended" sx={{ fontSize: '13px', fontWeight: 600 }}>
                Recommended
              </MenuItem>
              <MenuItem value="rating" sx={{ fontSize: '13px' }}>
                Rating: High to Low
              </MenuItem>
              <MenuItem value="distance" sx={{ fontSize: '13px' }}>
                Distance: Nearest
              </MenuItem>
              <MenuItem value="delivery_time" sx={{ fontSize: '13px' }}>
                Fastest Delivery
              </MenuItem>
            </Select>
          </FormControl>

          {/* Filter: Open Now */}
          <Button
            onClick={() => setFilterOpenNow(!filterOpenNow)}
            sx={{
              fontWeight: 600,
              fontSize: '12.5px',
              height: 38,
              px: 1.8,
              borderRadius: '10px',
              backgroundColor: filterOpenNow ? BRAND.lightGreen : BRAND.white,
              color: filterOpenNow ? BRAND.primaryGreen : BRAND.textPrimary,
              border: filterOpenNow ? `1.5px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
              textTransform: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: filterOpenNow ? BRAND.lightGreen : BRAND.bgPage,
              },
            }}
          >
            Open Now
          </Button>

          {/* Filter: ≤ 30 min */}
          <Button
            onClick={() => setFilterFastDelivery(!filterFastDelivery)}
            sx={{
              fontWeight: 600,
              fontSize: '12.5px',
              height: 38,
              px: 1.8,
              borderRadius: '10px',
              backgroundColor: filterFastDelivery ? BRAND.lightGreen : BRAND.white,
              color: filterFastDelivery ? BRAND.primaryGreen : BRAND.textPrimary,
              border: filterFastDelivery ? `1.5px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
              textTransform: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: filterFastDelivery ? BRAND.lightGreen : BRAND.bgPage,
              },
            }}
          >
            ≤ 30 min
          </Button>

          {/* Filter: Offers */}
          <Button
            onClick={() => setFilterOffers(!filterOffers)}
            sx={{
              fontWeight: 600,
              fontSize: '12.5px',
              height: 38,
              px: 1.8,
              borderRadius: '10px',
              backgroundColor: filterOffers ? BRAND.orangeLight : BRAND.white,
              color: filterOffers ? BRAND.orange : BRAND.textPrimary,
              border: filterOffers ? `1.5px solid ${BRAND.orange}` : `1px solid ${BRAND.border}`,
              textTransform: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: filterOffers ? BRAND.orangeLight : BRAND.bgPage,
              },
            }}
          >
            Offers
          </Button>

          {/* Filter: Favorites */}
          <Button
            startIcon={
              <FavoriteIcon
                sx={{
                  fontSize: '16px !important',
                  color: filterFavorites ? `${BRAND.red} !important` : `${BRAND.textSecondary} !important`,
                }}
              />
            }
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
              height: 38,
              px: 1.8,
              borderRadius: '10px',
              backgroundColor: filterFavorites ? BRAND.redLight : BRAND.white,
              color: filterFavorites ? BRAND.red : BRAND.textPrimary,
              border: filterFavorites ? `1.5px solid ${BRAND.red}` : `1px solid ${BRAND.border}`,
              textTransform: 'none',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: filterFavorites ? BRAND.redLight : BRAND.bgPage,
              },
            }}
          >
            Favorites
          </Button>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              sx={{
                color: BRAND.red,
                fontSize: '12.5px',
                fontWeight: 700,
                textTransform: 'none',
                height: 38,
                px: 1.5,
                borderRadius: '10px',
                flexShrink: 0,
                '&:hover': { backgroundColor: BRAND.redLight },
              }}
            >
              Reset All
            </Button>
          )}
        </Box>

        {/* Result Count Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2.5,
          }}
        >
          <Typography sx={{ fontSize: '15px', fontWeight: 700, color: BRAND.textPrimary }}>
            {loading
              ? 'Searching nearby shops...'
              : `${filteredVendors.length} ${filteredVendors.length === 1 ? 'shop' : 'shops'} near you`}
          </Typography>
          {selectedCategory !== 'all' && (
            <Typography sx={{ fontSize: '13px', color: BRAND.primaryGreen, fontWeight: 600 }}>
              Filtered by category
            </Typography>
          )}
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            3. VENDOR GRID / SKELETON / EMPTY / ERROR STATES
        ───────────────────────────────────────────────────────────── */}
        {error ? (
          /* Error State */
          <Box
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              borderRadius: '16px',
              border: `1px solid ${BRAND.border}`,
              backgroundColor: BRAND.white,
              maxWidth: 580,
              mx: 'auto',
              my: 4,
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
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '20px', color: BRAND.textPrimary, mb: 1 }}>
              Unable to load shops
            </Typography>
            <Typography sx={{ fontSize: '14px', color: BRAND.textSecondary, mb: 3 }}>
              {error || 'Something went wrong while loading nearby shops.'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                backgroundColor: BRAND.primaryGreen,
                color: BRAND.white,
                px: 3.5,
                py: 1,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'none',
                '&:hover': { backgroundColor: BRAND.darkGreen },
              }}
            >
              Try Again
            </Button>
          </Box>
        ) : loading ? (
          /* Skeletons Matching Exact Card Structure */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <Box
                key={item}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  overflow: 'hidden',
                }}
              >
                <Skeleton
                  variant="rectangular"
                  sx={{
                    width: '100%',
                    height: { xs: 195, sm: 180, md: 180 },
                  }}
                />
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="text" width="75%" height={26} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={42} sx={{ borderRadius: '10px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : filteredVendors.length > 0 ? (
          /* Responsive CSS Grid (1 col mobile, 2 col tablet-sm, 3 col tablet-md, 4 col desktop) */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
              width: '100%',
            }}
          >
            {filteredVendors.map((vendor) => {
              const isFav = favoriteShopIds.includes(vendor._id);
              const isOpen = vendor.isOpen !== false && vendor.status !== 0;

              return (
                <Card
                  key={vendor._id}
                  onClick={() => navigate(`/vendors/${vendor._id}`)}
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: '16px',
                    border: `1px solid ${BRAND.border}`,
                    backgroundColor: BRAND.white,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 10px 24px rgba(8, 127, 91, 0.09)',
                      borderColor: BRAND.primaryGreen,
                    },
                  }}
                >
                  {/* Shop Image Container with Overlays */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: { xs: 195, sm: 180, md: 180 },
                      backgroundColor: BRAND.bgPage,
                      overflow: 'hidden',
                    }}
                  >
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

                    {/* Top Badges: Status (Left) & Favorite (Right) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        right: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        zIndex: 2,
                      }}
                    >
                      {/* Status Badge */}
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          backgroundColor: isOpen ? BRAND.lightGreen : 'rgba(255, 255, 255, 0.95)',
                          color: isOpen ? BRAND.primaryGreen : BRAND.textSecondary,
                          fontWeight: 700,
                          fontSize: '11.5px',
                          px: 1,
                          py: 0.4,
                          borderRadius: '8px',
                          border: isOpen
                            ? `1px solid rgba(8, 127, 91, 0.25)`
                            : `1px solid ${BRAND.border}`,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: isOpen ? BRAND.primaryGreen : BRAND.textSecondary,
                          }}
                        />
                        {isOpen ? 'Open Now' : 'Closed'}
                      </Box>

                      {/* Favorite Button */}
                      <IconButton
                        size="small"
                        onClick={(e) => handleToggleFavorite(vendor._id, e)}
                        sx={{
                          backgroundColor: BRAND.white,
                          width: 34,
                          height: 34,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          color: isFav ? BRAND.red : BRAND.textSecondary,
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            backgroundColor: BRAND.white,
                            transform: 'scale(1.08)',
                            color: BRAND.red,
                          },
                        }}
                      >
                        {isFav ? (
                          <FavoriteIcon sx={{ fontSize: 18 }} />
                        ) : (
                          <FavoriteBorderIcon sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    </Box>

                    {/* Bottom Image Overlay Badges */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        right: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        zIndex: 2,
                      }}
                    >
                      {/* Category Tag Overlay */}
                      {vendor.module?.name && (
                        <Box
                          sx={{
                            backgroundColor: 'rgba(23, 34, 29, 0.85)',
                            color: BRAND.white,
                            fontWeight: 700,
                            fontSize: '11px',
                            px: 1,
                            py: 0.3,
                            borderRadius: '6px',
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          {vendor.module.name}
                        </Box>
                      )}

                      {/* Delivery Time Overlay */}
                      <Box
                        sx={{
                          backgroundColor: 'rgba(23, 34, 29, 0.85)',
                          color: BRAND.white,
                          fontWeight: 700,
                          fontSize: '11px',
                          px: 1,
                          py: 0.3,
                          borderRadius: '6px',
                          backdropFilter: 'blur(4px)',
                          ml: 'auto',
                        }}
                      >
                        {vendor.preparation_time_minute
                          ? `${vendor.preparation_time_minute}m`
                          : '20–30 min'}
                      </Box>
                    </Box>
                  </Box>

                  {/* Card Content & Details */}
                  <CardContent
                    sx={{
                      p: 2,
                      flexGrow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Store Title (Guaranteed 2 lines max with uniform minHeight for baseline alignment) */}
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '16px', sm: '17px' },
                        color: BRAND.textPrimary,
                        lineHeight: 1.3,
                        mb: 1,
                        minHeight: { xs: '22px', sm: '44px' },
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {vendor.name}
                    </Typography>

                    {/* Metadata Row: Rating • Distance • Category/Location */}
                    <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="center"
                      sx={{ mb: 2, flexWrap: 'wrap' }}
                    >
                      {/* Rating Chip */}
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.3,
                          backgroundColor: BRAND.lightGreen,
                          px: 0.8,
                          py: 0.2,
                          borderRadius: '6px',
                        }}
                      >
                        <StarIcon sx={{ fontSize: 13, color: BRAND.primaryGreen }} />
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: BRAND.primaryGreen,
                          }}
                        >
                          {vendor.rating || '4.8'}
                        </Typography>
                      </Box>

                      <Typography sx={{ fontSize: '12px', color: '#CBD5E1' }}>•</Typography>

                      {/* Distance */}
                      <Typography
                        sx={{
                          fontSize: '12.5px',
                          color: BRAND.textSecondary,
                          fontWeight: 600,
                        }}
                      >
                        {vendor.distance_km != null ? `${vendor.distance_km} km` : '1.2 km'}
                      </Typography>

                      <Typography sx={{ fontSize: '12px', color: '#CBD5E1' }}>•</Typography>

                      {/* Store Category or City */}
                      <Typography
                        sx={{
                          fontSize: '12.5px',
                          color: BRAND.textSecondary,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '45%',
                        }}
                      >
                        {vendor.address?.city || vendor.module?.name || 'Store'}
                      </Typography>
                    </Stack>

                    {/* Full-width View Shop CTA Button (Aligned at bottom) */}
                    <Box sx={{ mt: 'auto' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          backgroundColor: BRAND.primaryGreen,
                          color: BRAND.white,
                          borderRadius: '10px',
                          height: 42,
                          fontWeight: 600,
                          fontSize: '13.5px',
                          textTransform: 'none',
                          boxShadow: 'none',
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            backgroundColor: BRAND.darkGreen,
                            boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
                          },
                        }}
                      >
                        View Shop →
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          /* Empty State */
          <Box
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              borderRadius: '16px',
              border: `1px solid ${BRAND.border}`,
              backgroundColor: BRAND.white,
              maxWidth: 580,
              mx: 'auto',
              my: 4,
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

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '18px', sm: '20px' },
                color: BRAND.textPrimary,
                mb: 0.8,
              }}
            >
              No shops found
            </Typography>

            <Typography
              sx={{
                fontSize: '14px',
                color: BRAND.textSecondary,
                mb: 3,
              }}
            >
              Try changing your search or filters.
            </Typography>

            <Button
              variant="contained"
              onClick={handleClearFilters}
              sx={{
                backgroundColor: BRAND.primaryGreen,
                color: BRAND.white,
                px: 3.5,
                py: 1,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'none',
                '&:hover': { backgroundColor: BRAND.darkGreen },
              }}
            >
              Clear Filters
            </Button>
          </Box>
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
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: BRAND.lightGreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MyLocationIcon sx={{ fontSize: 24, color: BRAND.primaryGreen }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: BRAND.textPrimary }}>
                Enable Location
              </Typography>
              <Typography variant="caption" sx={{ color: BRAND.textSecondary }}>
                Find nearest neighborhood vendors
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: BRAND.textSecondary, lineHeight: 1.6 }}>
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
              backgroundColor: BRAND.bgPage,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: BRAND.primaryGreen, mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: BRAND.textPrimary, fontWeight: 600 }}>
                  Shows stores sorted by closest distance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: BRAND.primaryGreen, mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: BRAND.textPrimary, fontWeight: 600 }}>
                  Accurate doorstep delivery estimates
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: BRAND.primaryGreen, mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: BRAND.textPrimary, fontWeight: 600 }}>
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
              color: BRAND.textSecondary,
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
              backgroundColor: BRAND.primaryGreen,
              '&:hover': {
                backgroundColor: BRAND.darkGreen,
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
