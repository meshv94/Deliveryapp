import React, { useState, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Skeleton,
  Alert,
  Button,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Fade,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StorefrontIcon from '@mui/icons-material/Storefront';
import useVendors from '../hooks/useVendors';
import VendorCard from '../components/VendorCard';
import CanvasBackground from '../components/CanvasBackground';
import AnimatedVendorCardWrapper from '../components/AnimatedVendorCardWrapper';

const VendorListPage = () => {
  const { vendors, loading, error } = useVendors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Skeleton loaders count
  const skeletonCount = 8;

  // Filter vendors based on search and filters
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];

    let filtered = vendors;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (vendor) =>
          vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedFilter === 'open') {
      filtered = filtered.filter((vendor) => vendor.isOpen !== false);
    } else if (selectedFilter === 'delivery') {
      filtered = filtered.filter((vendor) => vendor.delivery_charge === 0);
    }

    return filtered;
  }, [vendors, searchQuery, selectedFilter]);

  const filters = [
    { id: 'all', label: 'All Vendors', icon: <StorefrontIcon /> },
    { id: 'open', label: 'Open Now', icon: <CheckCircleIcon /> },
    { id: 'delivery', label: 'Free Delivery', icon: <LocalOfferIcon /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa', position: 'relative' }}>
      {/* Canvas Background - Ambient Particles Animation */}
      <CanvasBackground useGradient={false} />

      {/* Main Content - Position Above Canvas */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            py: { xs: 5, sm: 7, md: 8 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            },
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 900,
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                  lineHeight: 1.2,
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  letterSpacing: '-0.02em',
                }}
              >
                Discover Local Vendors
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                }}
              >
                <LocationOnIcon sx={{ fontSize: '1.2rem' }} />
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    opacity: 0.95,
                  }}
                >
                  Fast delivery • Real-time tracking • Best local businesses
                </Typography>
              </Stack>

              {/* Search Bar */}
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search for vendors, cuisines, or dishes..."
                  variant="standard"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{
                            color: '#667eea',
                            fontSize: '1.5rem',
                            ml: 1,
                          }}
                        />
                      </InputAdornment>
                    ),
                    sx: {
                      px: 2,
                      py: 1.5,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      fontWeight: 500,
                      color: '#1a1a1a',
                      '& input::placeholder': {
                        color: '#999',
                        opacity: 1,
                      },
                    },
                  }}
                />
              </Paper>
            </Box>
          </Container>
        </Box>

        {/* Filter Section */}
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Fade in timeout={600}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                backgroundColor: '#fff',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                  <FilterListIcon sx={{ color: '#667eea', fontSize: '1.3rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                      fontSize: '0.9rem',
                    }}
                  >
                    Filters:
                  </Typography>
                </Box>
                {filters.map((filter) => (
                  <Chip
                    key={filter.id}
                    icon={React.cloneElement(filter.icon, {
                      sx: { fontSize: '1.1rem' },
                    })}
                    label={filter.label}
                    onClick={() => setSelectedFilter(filter.id)}
                    variant={selectedFilter === filter.id ? 'filled' : 'outlined'}
                    color={selectedFilter === filter.id ? 'primary' : 'default'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      py: 2.5,
                      px: 1,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      ...(selectedFilter === filter.id
                        ? {
                            backgroundColor: '#667eea',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                              backgroundColor: '#5568d3',
                            },
                          }
                        : {
                            borderColor: '#e0e0e0',
                            '&:hover': {
                              borderColor: '#667eea',
                              backgroundColor: 'rgba(102, 126, 234, 0.05)',
                            },
                          }),
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          </Fade>
        </Container>

        <Container maxWidth="lg" sx={{ pb: 6 }}>
          {/* Error State */}
          {error && !loading && (
            <Fade in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  p: 4,
                  background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
                  border: '2px solid #ffcdd2',
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    fontSize: '3rem',
                    mb: 2,
                  }}
                >
                  ⚠️
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#d32f2f',
                    mb: 1,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  }}
                >
                  Oops! Something went wrong
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    mb: 3,
                    maxWidth: 500,
                    mx: 'auto',
                    lineHeight: 1.7,
                  }}
                >
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  sx={{
                    backgroundColor: '#d32f2f',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                    '&:hover': {
                      backgroundColor: '#b71c1c',
                      boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Try Again
                </Button>
              </Paper>
            </Fade>
          )}

          {/* Loading State - Skeleton Grid */}
          {loading ? (
            <>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  color: '#1a1a1a',
                }}
              >
                <Skeleton width="200px" />
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                      {/* Image Skeleton */}
                      <Skeleton variant="rectangular" height={220} />

                      {/* Content Skeleton */}
                      <Box sx={{ p: 2 }}>
                        <Skeleton variant="text" height={24} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" height={16} width="70%" sx={{ mb: 1 }} />
                        <Skeleton variant="text" height={20} width="60%" sx={{ mb: 1.5 }} />
                        <Stack direction="row" spacing={1} sx={{ gap: 0.75 }}>
                          <Skeleton variant="rounded" width={90} height={28} />
                          <Skeleton variant="rounded" width={90} height={28} />
                        </Stack>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : filteredVendors.length > 0 ? (
            <>
              {/* Section Header with Results */}
              <Fade in timeout={800}>
                <Box sx={{ mb: 3 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          color: '#1a1a1a',
                          fontSize: { xs: '1.35rem', sm: '1.6rem' },
                          mb: 0.5,
                        }}
                      >
                        {selectedFilter === 'all'
                          ? 'Available Now'
                          : selectedFilter === 'open'
                          ? 'Open Vendors'
                          : 'Free Delivery'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }}
                      >
                        {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}{' '}
                        found
                        {searchQuery && (
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              px: 1.5,
                              py: 0.5,
                              backgroundColor: '#667eea',
                              color: '#fff',
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            for "{searchQuery}"
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Fade>

              {/* Vendors Grid with Entrance Animations */}
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {filteredVendors.map((vendor, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={vendor._id || vendor.id}>
                    {/* Animated Wrapper - Adds entrance animation with stagger */}
                    <AnimatedVendorCardWrapper index={index} delay={50}>
                      <VendorCard vendor={vendor} />
                    </AnimatedVendorCardWrapper>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : vendors && vendors.length > 0 && filteredVendors.length === 0 ? (
            /* No Results Found State */
            <Fade in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: 'center',
                  py: 10,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  border: '2px dashed #e0e0e0',
                }}
              >
                <Box
                  sx={{
                    fontSize: '4rem',
                    mb: 2,
                    filter: 'grayscale(1)',
                    opacity: 0.6,
                  }}
                >
                  🔍
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a',
                    mb: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  }}
                >
                  No vendors found
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    mb: 3,
                    maxWidth: 400,
                    mx: 'auto',
                    lineHeight: 1.7,
                  }}
                >
                  We couldn't find any vendors matching your search or filters. Try adjusting
                  your criteria or clearing the search.
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'center' }}
                >
                  <Button
                    variant="contained"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.25,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                      },
                    }}
                  >
                    Clear All Filters
                  </Button>
                </Stack>
              </Paper>
            </Fade>
          ) : (
            /* Empty State - No Vendors */
            <Fade in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: 'center',
                  py: 12,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  border: '2px dashed #e0e0e0',
                }}
              >
                <Box
                  sx={{
                    fontSize: '5rem',
                    mb: 3,
                    filter: 'grayscale(1)',
                    opacity: 0.5,
                  }}
                >
                  🏪
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#1a1a1a',
                      mb: 1.5,
                      fontSize: { xs: '1.35rem', sm: '1.6rem' },
                    }}
                  >
                    No Vendors Available
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#666',
                      mb: 4,
                      maxWidth: 450,
                      mx: 'auto',
                      lineHeight: 1.8,
                      fontSize: '0.95rem',
                    }}
                  >
                    Vendors are currently not available in your area. Check back soon or enable
                    location services to discover nearby businesses.
                  </Typography>
                </Box>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ justifyContent: 'center' }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<LocationOnIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '0.95rem',
                      borderWidth: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      '&:hover': {
                        borderWidth: 2,
                        borderColor: '#5568d3',
                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Enable Location
                  </Button>
                </Stack>
              </Paper>
            </Fade>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default VendorListPage;
