import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardActionArea,
  Skeleton,
  Button,
  Fade,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import apiClient from '../services/api';

// AapnuBazaar Brand Design Tokens
const BRAND = {
  green: '#087F5B',
  greenDark: '#075B43',
  greenLight: '#EBFBEE',
  greenBorder: 'rgba(8, 127, 91, 0.2)',
  orange: '#FF6B00',
  orangeTint: '#FFF4E6',
  orangeBorder: 'rgba(255, 107, 0, 0.2)',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  bgPage: '#FAFAF7',
  bgCard: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

// Helper for contextual category styling, fallback badges & icons
const getCategoryMeta = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('groc') || lower.includes('vegetable') || lower.includes('fruit')) {
    return {
      tint: '#EBFBEE',
      accent: '#087F5B',
      border: '#D3F9D8',
      tag: 'Fresh & Daily',
      desc: 'Fresh fruits, vegetables & daily essentials',
      iconEmoji: '🥬',
    };
  }
  if (
    lower.includes('food') ||
    lower.includes('restaurant') ||
    lower.includes('snack') ||
    lower.includes('sweet') ||
    lower.includes('bake') ||
    lower.includes('dining')
  ) {
    return {
      tint: '#FFF4E6',
      accent: '#FF6B00',
      border: '#FFE8CC',
      tag: 'Hot & Tasty',
      desc: 'Local restaurants, sweets & delicious snacks',
      iconEmoji: '🍲',
    };
  }
  if (
    lower.includes('elec') ||
    lower.includes('gadget') ||
    lower.includes('mobile') ||
    lower.includes('tech')
  ) {
    return {
      tint: '#E7F5FF',
      accent: '#1971C2',
      border: '#D0EBFF',
      tag: 'Tech & Gadgets',
      desc: 'Accessories, electronics & appliances',
      iconEmoji: '⚡',
    };
  }
  if (
    lower.includes('pharm') ||
    lower.includes('med') ||
    lower.includes('health') ||
    lower.includes('care')
  ) {
    return {
      tint: '#FFF5F5',
      accent: '#E03131',
      border: '#FFD8D8',
      tag: 'Health & Wellness',
      desc: 'Medicines, personal care & health supplies',
      iconEmoji: '💊',
    };
  }
  if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('wear')) {
    return {
      tint: '#F3F0FF',
      accent: '#7950F2',
      border: '#E5DBFF',
      tag: 'Fashion & Style',
      desc: 'Clothing, footwear & ethnic wear',
      iconEmoji: '👕',
    };
  }
  return {
    tint: '#F0F9F5',
    accent: '#087F5B',
    border: '#D1ECDE',
    tag: 'Local Shops',
    desc: `Explore verified local ${name ? name.toLowerCase() : 'neighborhood'} stores`,
    iconEmoji: '🏪',
  };
};

const ModulesPage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchActiveModules();
  }, []);

  const fetchActiveModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/app/modules/active/list');

      if (response.success && response.data) {
        setModules(response.data);
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.message || 'Failed to load categories. Please try again.');
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    if (!module || !module._id) {
      navigate('/vendors');
      return;
    }
    navigate(`/vendors?moduleId=${module._id}`);
  };

  // Filtered list if filter pill selected
  const displayedModules = React.useMemo(() => {
    if (selectedFilter === 'all') return modules;
    return modules.filter((m) => m._id === selectedFilter);
  }, [modules, selectedFilter]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: BRAND.bgPage,
        pb: { xs: 12, md: 10 },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT HERO & BANNER SECTION
      ───────────────────────────────────────────────────────────── */}
      <Container
        maxWidth="lg"
        sx={{
          pt: { xs: 2.5, sm: 3.5, md: 4.5 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Welcome Header */}
        <Box
          sx={{
            mb: { xs: 2, sm: 2.5 },
            textAlign: { xs: 'left', sm: 'center' },
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '0.78rem', sm: '0.85rem' },
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: BRAND.green,
              mb: 0.4,
            }}
          >
            AapnuBazaar Marketplace
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.45rem', sm: '2rem', md: '2.35rem' },
              fontWeight: 800,
              color: BRAND.textPrimary,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
              mb: 0.6,
            }}
          >
            Explore Local Shopping
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '0.86rem', sm: '0.98rem' },
              color: BRAND.textSecondary,
              maxWidth: 580,
              mx: { xs: 0, sm: 'auto' },
              lineHeight: 1.45,
            }}
          >
            Food, fresh groceries, electronics, and daily essentials from neighborhood stores around you.
          </Typography>
        </Box>

        {/* Compact Promotional Banner (Controlled height on mobile) */}
        <Box
          sx={{
            width: '100%',
            height: { xs: '120px', sm: '180px', md: '230px', lg: '270px' },
            borderRadius: { xs: '16px', sm: '22px' },
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${BRAND.border}`,
            backgroundColor: '#FFFFFF',
            position: 'relative',
            mb: { xs: 2, sm: 2.5 },
          }}
        >
          <img
            src="/cover_img.png"
            alt="AapnuBazaar - Our Local Marketplace"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            2. SERVICE HIGHLIGHTS (Compact Horizontal Scroll on Mobile)
        ───────────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            overflowX: 'auto',
            py: 0.5,
            px: { xs: 0.5, sm: 0 },
            mb: { xs: 3, sm: 4 },
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            justifyContent: { xs: 'flex-start', md: 'center' },
          }}
        >
          {[
            {
              icon: <LocalShippingOutlinedIcon sx={{ color: BRAND.green, fontSize: 17 }} />,
              label: '15-30 Min Delivery',
            },
            {
              icon: <SpaOutlinedIcon sx={{ color: BRAND.green, fontSize: 17 }} />,
              label: '100% Fresh Local',
            },
            {
              icon: <VerifiedOutlinedIcon sx={{ color: BRAND.orange, fontSize: 17 }} />,
              label: 'Verified Stores',
            },
            {
              icon: <LocationOnOutlinedIcon sx={{ color: BRAND.green, fontSize: 17 }} />,
              label: 'Live Order Tracking',
            },
          ].map((item, idx) => (
            <Chip
              key={idx}
              icon={item.icon}
              label={item.label}
              sx={{
                backgroundColor: '#FFFFFF',
                color: BRAND.textPrimary,
                border: `1px solid ${BRAND.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                fontWeight: 700,
                fontSize: { xs: '0.76rem', sm: '0.82rem' },
                py: { xs: 1.8, sm: 2 },
                px: { xs: 0.6, sm: 1 },
                borderRadius: '12px',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: BRAND.green,
                  backgroundColor: BRAND.greenLight,
                },
              }}
            />
          ))}
        </Box>
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          3. CATEGORY DISCOVERY SECTION
      ───────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Section Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'flex-end' },
            justifyContent: 'space-between',
            mb: { xs: 2, sm: 3 },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: BRAND.green,
                mb: 0.3,
              }}
            >
              Marketplace
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.35rem', sm: '1.75rem' },
                color: BRAND.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              Explore Categories
            </Typography>
            <Typography
              sx={{
                fontSize: '0.84rem',
                color: BRAND.textSecondary,
                mt: 0.3,
              }}
            >
              Select a category to start ordering from verified neighborhood shops
            </Typography>
          </Box>

          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/vendors')}
            endIcon={<ArrowForwardIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              color: BRAND.green,
              fontWeight: 700,
              fontSize: '0.85rem',
              p: 0,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                color: BRAND.greenDark,
              },
            }}
          >
            View All Shops
          </Button>
        </Box>

        {/* Quick Horizontal Category Filter Bar (if multiple modules available) */}
        {!loading && modules.length > 1 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              overflowX: 'auto',
              pb: 1,
              mb: 3,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <Chip
              label="🛍️ All Categories"
              onClick={() => setSelectedFilter('all')}
              sx={{
                backgroundColor: selectedFilter === 'all' ? BRAND.green : '#FFFFFF',
                color: selectedFilter === 'all' ? '#FFFFFF' : BRAND.textPrimary,
                fontWeight: 700,
                fontSize: '0.82rem',
                borderRadius: '10px',
                border: `1px solid ${selectedFilter === 'all' ? BRAND.green : BRAND.border}`,
                boxShadow: selectedFilter === 'all' ? '0 3px 10px rgba(8, 127, 91, 0.25)' : 'none',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: selectedFilter === 'all' ? BRAND.greenDark : BRAND.greenLight,
                },
              }}
            />
            {modules.map((m) => {
              const isSelected = selectedFilter === m._id;
              const meta = getCategoryMeta(m.name);
              return (
                <Chip
                  key={m._id}
                  label={`${meta.iconEmoji} ${m.name}`}
                  onClick={() => setSelectedFilter(m._id)}
                  sx={{
                    backgroundColor: isSelected ? BRAND.green : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : BRAND.textPrimary,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    borderRadius: '10px',
                    border: `1px solid ${isSelected ? BRAND.green : BRAND.border}`,
                    boxShadow: isSelected ? '0 3px 10px rgba(8, 127, 91, 0.25)' : 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? BRAND.greenDark : BRAND.greenLight,
                    },
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Error State Banner */}
        {error && !loading && (
          <Fade in timeout={400}>
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                borderRadius: '18px',
                p: { xs: 3, sm: 4 },
                backgroundColor: '#FFF5F5',
                border: '1px solid #FECACA',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  color: '#DC2626',
                  fontSize: '1.05rem',
                  mb: 0.8,
                }}
              >
                Unable to load marketplace categories
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.86rem',
                  color: BRAND.textSecondary,
                  mb: 2.5,
                  maxWidth: 460,
                  mx: 'auto',
                }}
              >
                {error}
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchActiveModules}
                sx={{
                  backgroundColor: BRAND.green,
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 12px rgba(8, 127, 91, 0.2)',
                  '&:hover': {
                    backgroundColor: BRAND.greenDark,
                  },
                }}
              >
                Try Again
              </Button>
            </Paper>
          </Fade>
        )}

        {/* Skeletons Loading (2 columns on mobile, 4 on desktop) */}
        {loading ? (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '18px',
                    p: { xs: 2, sm: 3 },
                    border: `1px solid ${BRAND.border}`,
                    backgroundColor: '#FFFFFF',
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Skeleton
                    variant="circular"
                    width={72}
                    height={72}
                    sx={{ mb: 1.5 }}
                  />
                  <Skeleton variant="text" width="75%" height={24} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="90%" height={16} sx={{ mb: 1.5 }} />
                  <Skeleton variant="rounded" width="60%" height={26} sx={{ borderRadius: '8px' }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : displayedModules.length > 0 ? (
          /* ─────────────────────────────────────────────────────────────
              4. 2-COLUMN MOBILE / 4-COLUMN DESKTOP CATEGORY GRID
          ───────────────────────────────────────────────────────────── */
          <Grid container spacing={{ xs: 1.5, sm: 2.2, md: 3 }}>
            {displayedModules.map((module, index) => {
              const meta = getCategoryMeta(module.name);

              return (
                <Grid item xs={6} sm={4} md={3} key={module._id || index}>
                  <Fade in timeout={400} style={{ transitionDelay: `${index * 60}ms` }}>
                    <Card
                      elevation={0}
                      onClick={() => handleModuleClick(module)}
                      sx={{
                        borderRadius: { xs: '16px', sm: '20px' },
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${BRAND.border}`,
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 10px 25px -4px rgba(8, 127, 91, 0.14)',
                          borderColor: BRAND.green,
                          '& .category-explore-tag': {
                            color: BRAND.greenDark,
                            transform: 'translateX(2px)',
                          },
                          '& .category-img-box': {
                            transform: 'scale(1.05)',
                          },
                        },
                        '&:active': {
                          transform: 'scale(0.98)',
                        },
                      }}
                    >
                      <CardActionArea
                        sx={{
                          p: { xs: 2, sm: 2.8 },
                          flexGrow: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          height: '100%',
                        }}
                      >
                        {/* Subtle Active Indicator Dot */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: { xs: 10, sm: 14 },
                            right: { xs: 10, sm: 14 },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            backgroundColor: BRAND.greenLight,
                            borderRadius: '12px',
                            px: 0.9,
                            py: 0.25,
                          }}
                        >
                          <Box
                            sx={{
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              backgroundColor: BRAND.green,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              color: BRAND.green,
                              lineHeight: 1,
                            }}
                          >
                            Active
                          </Typography>
                        </Box>

                        {/* Category Image / Illustration Container */}
                        <Box
                          className="category-img-box"
                          sx={{
                            width: { xs: 74, sm: 90, md: 100 },
                            height: { xs: 74, sm: 90, md: 100 },
                            borderRadius: '50%',
                            backgroundColor: meta.tint,
                            border: `2px solid ${meta.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: { xs: 1.5, sm: 2 },
                            mt: 0.8,
                            p: 1.2,
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            flexShrink: 0,
                          }}
                        >
                          {module.image ? (
                            <img
                              src={module.image}
                              alt={module.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '50%',
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <Typography
                            sx={{
                              fontSize: { xs: '32px', sm: '38px' },
                              display: module.image ? 'none' : 'block',
                              lineHeight: 1,
                              userSelect: 'none',
                            }}
                          >
                            {meta.iconEmoji}
                          </Typography>
                        </Box>

                        {/* Category Title */}
                        <Typography
                          variant="h5"
                          component="h3"
                          sx={{
                            fontWeight: 800,
                            fontSize: { xs: '0.98rem', sm: '1.15rem' },
                            color: BRAND.textPrimary,
                            mb: 0.4,
                            lineHeight: 1.2,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {module.name}
                        </Typography>

                        {/* Subtitle / Description */}
                        <Typography
                          sx={{
                            fontSize: { xs: '0.74rem', sm: '0.82rem' },
                            color: BRAND.textSecondary,
                            lineHeight: 1.35,
                            mb: 1.8,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {meta.desc}
                        </Typography>

                        {/* Explore Link Tag */}
                        <Box
                          className="category-explore-tag"
                          sx={{
                            mt: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: BRAND.green,
                            fontSize: { xs: '0.78rem', sm: '0.84rem' },
                            fontWeight: 800,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span>Explore</span>
                          <ArrowForwardIcon sx={{ fontSize: 15 }} />
                        </Box>
                      </CardActionArea>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          /* Empty State */
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 6, sm: 8 },
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: `1px solid ${BRAND.border}`,
              p: 4,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                backgroundColor: BRAND.greenLight,
                color: BRAND.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <StorefrontIcon sx={{ fontSize: 34 }} />
            </Box>
            <Typography variant="h6" sx={{ color: BRAND.textPrimary, fontWeight: 800, mb: 0.5 }}>
              No categories available
            </Typography>
            <Typography variant="body2" sx={{ color: BRAND.textSecondary, maxWidth: 360, mx: 'auto' }}>
              Please check back soon for new marketplace categories.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSelectedFilter('all')}
              sx={{
                mt: 2.5,
                borderColor: BRAND.green,
                color: BRAND.green,
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: BRAND.greenLight,
                },
              }}
            >
              Show All Categories
            </Button>
          </Box>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. VERIFIED MARKETPLACE PROMISES SECTION
        ───────────────────────────────────────────────────────────── */}
        <Box sx={{ mt: { xs: 6, sm: 8, md: 9 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Typography
              sx={{
                fontSize: '0.76rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: BRAND.green,
                mb: 0.3,
              }}
            >
              Why AapnuBazaar
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.25rem', sm: '1.55rem' },
                color: BRAND.textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              The Trust of Local Shopping
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: '18px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${BRAND.border}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: BRAND.greenLight,
                    color: BRAND.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StorefrontOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: BRAND.textPrimary }}>
                  Neighborhood First
                </Typography>
                <Typography sx={{ fontSize: '0.84rem', color: BRAND.textSecondary, lineHeight: 1.55 }}>
                  Directly support your trusted local grocers, bakery artisans, and neighborhood specialty stores.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: '18px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${BRAND.border}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: BRAND.orangeTint,
                    color: BRAND.orange,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalShippingOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: BRAND.textPrimary }}>
                  Lightning Fast Delivery
                </Typography>
                <Typography sx={{ fontSize: '0.84rem', color: BRAND.textSecondary, lineHeight: 1.55 }}>
                  Hyperlocal dispatch delivers orders right from neighborhood shops to your doorstep in minutes.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: '18px',
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${BRAND.border}`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: '#F1F5F9',
                    color: BRAND.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VerifiedOutlinedIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: BRAND.textPrimary }}>
                  Verified Quality & Hygiene
                </Typography>
                <Typography sx={{ fontSize: '0.84rem', color: BRAND.textSecondary, lineHeight: 1.55 }}>
                  Every merchant and vendor on AapnuBazaar is verified for hygiene and product authenticity.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ModulesPage;
