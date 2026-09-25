import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  Box,
  Typography,
  InputBase,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Stack,
  Fade,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
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

const RECENT_SEARCHES_KEY = 'aapnubazaar_recent_searches';

export default function OmniSearchModal({ open, onClose, initialQuery = '', moduleId = '' }) {
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ dishes: [], stores: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingKeywords, setTrendingKeywords] = useState([
    { label: '🍕 Pizza', query: 'Pizza' },
    { label: '🍔 Burger', query: 'Burger' },
    { label: '🍛 Biryani', query: 'Biryani' },
    { label: '🥪 Sandwich', query: 'Sandwich' },
    { label: '☕ Cold Coffee', query: 'Coffee' },
    { label: '🥗 Salad', query: 'Salad' },
    { label: '🍰 Pastry & Cake', query: 'Cake' },
  ]);
  const [addedItemIds, setAddedItemIds] = useState({});

  // Sync initial query when opened
  useEffect(() => {
    if (open) {
      setQuery(initialQuery || '');
      // Load recent searches
      try {
        const saved = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
        setRecentSearches(Array.isArray(saved) ? saved.slice(0, 6) : []);
      } catch {
        setRecentSearches([]);
      }

      // Fetch dynamic trending searches
      apiClient.get('/app/search/trending')
        .then(res => {
          if (res?.data?.trending && Array.isArray(res.data.trending)) {
            setTrendingKeywords(res.data.trending);
          }
        })
        .catch(() => {});

      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open, initialQuery]);

  // Debounced search suggestions
  useEffect(() => {
    if (!query || !query.trim()) {
      setSuggestions({ dishes: [], stores: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
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

        const res = await apiClient.get('/app/search/suggestions', {
          params: { q: query.trim(), moduleId: moduleId || undefined },
          headers: coords
        });

        if (res?.data) {
          setSuggestions({
            dishes: res.data.dishes || [],
            stores: res.data.stores || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => clearTimeout(timer);
  }, [query, moduleId]);

  // Save to recent searches
  const saveSearchTerm = (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    try {
      let current = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      current = [cleanTerm, ...current.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, 8);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(current));
      setRecentSearches(current);
    } catch {}
  };

  const removeRecentSearch = (e, termToRemove) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter(t => t !== termToRemove);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  const clearAllRecent = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  // Handlers
  const handleFullSearch = (searchVal) => {
    const finalQuery = (searchVal || query).trim();
    if (!finalQuery) return;
    saveSearchTerm(finalQuery);
    onClose();
    navigate(`/search?q=${encodeURIComponent(finalQuery)}${moduleId ? `&moduleId=${moduleId}` : ''}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFullSearch(query);
    }
  };

  const handleSelectStore = (storeId) => {
    saveSearchTerm(query);
    onClose();
    navigate(`/vendor/${storeId}`);
  };

  const handleSelectDish = (dish) => {
    saveSearchTerm(query);
    onClose();
    if (dish.vendor?._id) {
      navigate(`/vendor/${dish.vendor._id}`);
    }
  };

  const handleQuickAddDish = (e, dish) => {
    e.stopPropagation();
    if (dish.vendor?._id) {
      addToCart(dish.vendor._id, {
        _id: dish._id,
        name: dish.name,
        main_price: dish.main_price,
        special_price: dish.special_price,
        image: dish.image,
        packaging_charge: dish.packaging_charge || 0,
        dietary_type: dish.dietary_type
      }, 1);

      setAddedItemIds(prev => ({ ...prev, [dish._id]: true }));
      setTimeout(() => {
        setAddedItemIds(prev => ({ ...prev, [dish._id]: false }));
      }, 1800);
    }
  };

  const hasSuggestions = suggestions.dishes.length > 0 || suggestions.stores.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          top: { xs: 20, sm: 40 },
          position: 'absolute',
          m: 2,
        },
      }}
    >
      {/* Search Bar Input Header */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${BRAND.border}`,
          backgroundColor: '#FFFFFF',
        }}
      >
        <SearchIcon sx={{ color: BRAND.primaryGreen, fontSize: 26 }} />
        <InputBase
          inputRef={inputRef}
          placeholder="Search dishes, groceries, restaurants..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          fullWidth
          sx={{
            fontSize: { xs: '15px', sm: '16px' },
            fontWeight: 500,
            color: BRAND.textPrimary,
          }}
        />

        {query ? (
          <IconButton size="small" onClick={() => setQuery('')} sx={{ color: BRAND.textSecondary, p: 0.5 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}

        {loading ? (
          <CircularProgress size={20} sx={{ color: BRAND.primaryGreen }} />
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleFullSearch(query)}
            disabled={!query.trim()}
            sx={{
              backgroundColor: BRAND.primaryGreen,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              px: 1.8,
              minWidth: 'auto',
              '&:hover': { backgroundColor: BRAND.darkGreen },
            }}
          >
            Search
          </Button>
        )}

        {/* Modal Close Button */}
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close search modal"
          sx={{
            color: BRAND.textSecondary,
            backgroundColor: '#F3F4F6',
            borderRadius: '50%',
            p: 0.8,
            ml: 0.5,
            '&:hover': { backgroundColor: '#E5E7EB', color: BRAND.textPrimary },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Modal Content Area */}
      <Box sx={{ maxHeight: '68vh', overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
        {/* State 1: When user hasn't typed anything yet */}
        {!query.trim() && (
          <Stack spacing={2.5}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <HistoryIcon sx={{ fontSize: 16 }} /> RECENT SEARCHES
                  </Typography>
                  <Button size="small" onClick={clearAllRecent} sx={{ fontSize: '11px', color: BRAND.textSecondary, textTransform: 'none' }}>
                    Clear all
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {recentSearches.map((term, i) => (
                    <Chip
                      key={i}
                      label={term}
                      onClick={() => handleFullSearch(term)}
                      onDelete={(e) => removeRecentSearch(e, term)}
                      deleteIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                      sx={{
                        backgroundColor: '#F3F4F6',
                        color: BRAND.textPrimary,
                        fontWeight: 500,
                        fontSize: '13px',
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: '#E5E7EB' }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Trending & Popular Searches */}
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.2 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: BRAND.orange }} /> POPULAR DISCOVERIES
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {trendingKeywords.map((item, i) => (
                  <Chip
                    key={i}
                    label={item.label}
                    onClick={() => handleFullSearch(item.query)}
                    sx={{
                      backgroundColor: BRAND.lightGreen,
                      color: BRAND.darkGreen,
                      fontWeight: 600,
                      fontSize: '13px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: '1px solid rgba(8, 127, 91, 0.15)',
                      '&:hover': { backgroundColor: '#D7EFE6', transform: 'translateY(-1px)' },
                      transition: 'all 0.15s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        )}

        {/* State 2: When user has typed query */}
        {query.trim() && (
          <Stack spacing={2.5}>
            {/* View full search results banner */}
            <Box
              onClick={() => handleFullSearch(query)}
              sx={{
                p: 1.5,
                borderRadius: '12px',
                backgroundColor: BRAND.lightGreen,
                border: '1px solid rgba(8, 127, 91, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: '#D7EFE6' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <SearchIcon sx={{ color: BRAND.primaryGreen }} />
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: BRAND.darkGreen }}>
                  See all results for "{query}"
                </Typography>
              </Box>
              <ArrowForwardIcon sx={{ color: BRAND.primaryGreen, fontSize: 18 }} />
            </Box>

            {/* Dishes & Products Results */}
            {suggestions.dishes.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.textSecondary, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <RestaurantMenuIcon sx={{ fontSize: 16 }} /> DISHES & ITEMS
                </Typography>
                <Stack spacing={1}>
                  {suggestions.dishes.map((dish) => {
                    const price = dish.special_price && dish.special_price < dish.main_price ? dish.special_price : dish.main_price;
                    const isAdded = addedItemIds[dish._id];

                    return (
                      <Box
                        key={dish._id}
                        onClick={() => handleSelectDish(dish)}
                        sx={{
                          p: 1.2,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          cursor: 'pointer',
                          border: '1px solid #F3F4F6',
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            backgroundColor: '#F9FAFB',
                            borderColor: BRAND.border,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexGrow: 1 }}>
                          <Avatar
                            src={dish.image}
                            variant="rounded"
                            sx={{ width: 48, height: 48, borderRadius: '10px', bgcolor: '#F3F4F6' }}
                          >
                            <RestaurantMenuIcon sx={{ color: BRAND.textSecondary }} />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              {dish.dietary_type === 'veg' && (
                                <Box sx={{ width: 12, height: 12, border: '2px solid #087F5B', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#087F5B' }} />
                                </Box>
                              )}
                              {dish.dietary_type === 'non_veg' && (
                                <Box sx={{ width: 12, height: 12, border: '2px solid #E03131', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Box sx={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: '5px solid #E03131' }} />
                                </Box>
                              )}
                              <Typography sx={{ fontWeight: 700, fontSize: '14px', color: BRAND.textPrimary, noWrap: true }}>
                                {dish.name}
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, noWrap: true }}>
                              by {dish.vendor?.name} {dish.vendor?.distance_km != null ? `• ${dish.vendor.distance_km} km` : ''}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.primaryGreen }}>
                            ₹{price}
                          </Typography>
                          <Button
                            size="small"
                            variant={isAdded ? "contained" : "outlined"}
                            onClick={(e) => handleQuickAddDish(e, dish)}
                            sx={{
                              minWidth: 'auto',
                              px: 1.2,
                              py: 0.4,
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderColor: BRAND.primaryGreen,
                              color: isAdded ? '#fff' : BRAND.primaryGreen,
                              backgroundColor: isAdded ? BRAND.primaryGreen : 'transparent',
                              textTransform: 'none',
                              '&:hover': {
                                backgroundColor: isAdded ? BRAND.darkGreen : BRAND.lightGreen,
                                borderColor: BRAND.primaryGreen,
                              }
                            }}
                          >
                            {isAdded ? <CheckIcon sx={{ fontSize: 14 }} /> : '+ Add'}
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Stores & Vendors Results */}
            {suggestions.stores.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.textSecondary, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StorefrontIcon sx={{ fontSize: 16 }} /> RESTAURANTS & STORES
                </Typography>
                <Stack spacing={1}>
                  {suggestions.stores.map((store) => (
                    <Box
                      key={store._id}
                      onClick={() => handleSelectStore(store._id)}
                      sx={{
                        p: 1.2,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        cursor: 'pointer',
                        border: '1px solid #F3F4F6',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          backgroundColor: '#F9FAFB',
                          borderColor: BRAND.border,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Avatar
                          src={store.image}
                          variant="rounded"
                          sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: '#F3F4F6' }}
                        >
                          <StorefrontIcon sx={{ color: BRAND.textSecondary }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '14px', color: BRAND.textPrimary, noWrap: true }}>
                            {store.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                            {store.distance_km != null && (
                              <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <LocationOnIcon sx={{ fontSize: 13, color: BRAND.primaryGreen }} /> {store.distance_km} km
                              </Typography>
                            )}
                            <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <AccessTimeIcon sx={{ fontSize: 13 }} /> ~{store.preparation_time} mins
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ flexShrink: 0 }}>
                        {store.isOpen ? (
                          <Chip label="OPEN" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 800, bgcolor: BRAND.lightGreen, color: BRAND.darkGreen }} />
                        ) : (
                          <Chip label="CLOSED" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 800, bgcolor: '#FEE2E2', color: '#DC2626' }} />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* No matches fallback */}
            {!loading && !hasSuggestions && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: BRAND.textPrimary }}>
                  No exact matches found for "{query}"
                </Typography>
                <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary, mt: 0.5 }}>
                  Try searching for general keywords like "pizza", "burger", "coffee", or check spelling.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleFullSearch(query)}
                  sx={{
                    mt: 2,
                    borderColor: BRAND.primaryGreen,
                    color: BRAND.primaryGreen,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '8px'
                  }}
                >
                  Search in all categories
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Dialog>
  );
}
