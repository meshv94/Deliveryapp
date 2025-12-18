import React, { useState, useMemo } from 'react';
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
  Breadcrumbs,
  Link,
  Fade,
  IconButton,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useVendorDetails from '../hooks/useVendorDetails';
import VendorHeader from '../components/VendorHeader';
import VendorMetaBar from '../components/VendorMetaBar';
import ProductCard from '../components/ProductCard';
import FloatingCartButton from '../components/FloatingCartButton';

/**
 * VendorDetailsPage
 * Main page displaying vendor information and products
 */
const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { vendor, products, loading, error } = useVendorDetails(vendorId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;

    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading State
  if (loading) {
    return (
      <Box sx={{ backgroundColor: '#fff', minHeight: '100vh' }}>
        {/* Banner Skeleton */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height={280}
          sx={{ mb: 2 }}
        />

        {/* Header Skeleton */}
        <Container maxWidth="lg">
          <Box sx={{ py: 3 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  width={150}
                  height={60}
                />
              ))}
            </Stack>
          </Box>
        </Container>

        {/* Products Skeleton */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rectangular" height={300} />
              </Grid>
            ))}
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
          backgroundColor: '#fafbfc',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Fade in timeout={600}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
                border: '2px solid #ffcdd2',
              }}
            >
              <Box
                sx={{
                  fontSize: '4rem',
                  mb: 2,
                }}
              >
                ⚠️
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  color: '#d32f2f',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                Unable to Load Vendor
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 4,
                  lineHeight: 1.7,
                }}
              >
                {error}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Back to Vendors
              </Button>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  // Vendor Not Found State
  if (!vendor) {
    return (
      <Box
        sx={{
          backgroundColor: '#fafbfc',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Fade in timeout={600}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 3,
                textAlign: 'center',
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
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  color: '#1a1a1a',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                Vendor Not Found
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#666',
                  mb: 4,
                  lineHeight: 1.8,
                }}
              >
                The vendor you're looking for doesn't exist or has been removed.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Back to Vendors
              </Button>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh', position: 'relative' }}>
      {/* Vendor Header with Banner */}
      <VendorHeader vendor={vendor} />

      {/* Vendor Meta Info Bar (sticky) */}
      <VendorMetaBar vendor={vendor} />

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs Navigation */}
        <Fade in timeout={400}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{
              mb: 3,
              '& .MuiBreadcrumbs-separator': {
                color: '#999',
              },
            }}
          >
            <Link
              component="button"
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                  color: '#5568d3',
                },
                cursor: 'pointer',
                background: 'none',
                border: 'none',
              }}
            >
              <HomeIcon sx={{ fontSize: '1.1rem' }} />
              Vendors
            </Link>
            <Typography
              sx={{
                color: '#1a1a1a',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {vendor.name}
            </Typography>
          </Breadcrumbs>
        </Fade>

        {/* Products Section */}
        <Box sx={{ mb: 4 }}>
          {/* Section Header with Search */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#1a1a1a',
                    mb: 0.5,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  }}
                >
                  {/* <RestaurantMenuIcon
                    sx={{
                      fontSize: '1.75rem',
                      mr: 1,
                      verticalAlign: 'middle',
                      color: '#667eea',
                    }}
                  /> */}
                  {/* Menu */}
                </Typography>
                {products.length > 0 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  >
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}{' '}
                    {filteredProducts.length !== products.length && `of ${products.length}`}
                  </Typography>
                )}
              </Box>

              {/* Search Bar */}
              {products.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    minWidth: { xs: '100%', sm: 300 },
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.3s ease',
                    '&:focus-within': {
                      borderColor: '#667eea',
                      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                    },
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search menu items..."
                    variant="standard"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#667eea', ml: 1 }} />
                        </InputAdornment>
                      ),
                      sx: {
                        px: 2,
                        py: 1.25,
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      },
                    }}
                  />
                </Paper>
              )}
            </Stack>
          </Box>

          {/* Empty Products State */}
          {products.length === 0 ? (
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
                    opacity: 0.5,
                  }}
                >
                  🍽️
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
                  No Menu Items Yet
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#666',
                    maxWidth: 400,
                    mx: 'auto',
                    lineHeight: 1.7,
                  }}
                >
                  This vendor hasn't added any products yet. Check back soon!
                </Typography>
              </Paper>
            </Fade>
          ) : filteredProducts.length === 0 ? (
            /* No Search Results */
            <Fade in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: 'center',
                  py: 8,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  border: '2px dashed #e0e0e0',
                }}
              >
                <Box
                  sx={{
                    fontSize: '3rem',
                    mb: 2,
                    filter: 'grayscale(1)',
                    opacity: 0.6,
                  }}
                >
                  🔍
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a',
                    mb: 1,
                  }}
                >
                  No items found
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    mb: 3,
                    maxWidth: 350,
                    mx: 'auto',
                  }}
                >
                  We couldn't find any items matching "{searchQuery}"
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setSearchQuery('')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5568d3',
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  Clear Search
                </Button>
              </Paper>
            </Fade>
          ) : (
            <>
              {/* Products Grid */}
              <Grid
                container
                spacing={{ xs: 2, sm: 2.5, md: 3 }}
                sx={{
                  animation: 'fadeIn 0.6s ease-in',
                  '@keyframes fadeIn': {
                    from: {
                      opacity: 0,
                    },
                    to: {
                      opacity: 1,
                    },
                  },
                }}
              >
                {filteredProducts.map((product, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={product._id || product.id}
                    sx={{
                      animation: `slideInUp 0.5s ease-out ${index * 50}ms backwards`,
                      '@keyframes slideInUp': {
                        from: {
                          opacity: 0,
                          transform: 'translateY(20px)',
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateY(0)',
                        },
                      },
                    }}
                  >
                    <ProductCard product={product} vendorId={vendorId} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Container>

      {/* Bottom Spacing */}
      <Box sx={{ py: 4 }} />

      {/* Floating Cart Button */}
      <FloatingCartButton />

      {/* Scroll to Top Button */}
      <Fade in={showScrollTop}>
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: { xs: 90, sm: 100 },
            right: { xs: 16, sm: 24 },
            zIndex: 1000,
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            backgroundColor: '#fff',
            border: '2px solid #667eea',
            boxShadow: '0 4px 16px rgba(102, 126, 234, 0.25)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#667eea',
              transform: 'translateY(-4px)',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
              '& .MuiSvgIcon-root': {
                color: '#fff',
              },
            },
          }}
        >
          <KeyboardArrowUpIcon
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              color: '#667eea',
              transition: 'color 0.3s ease',
            }}
          />
        </IconButton>
      </Fade>
    </Box>
  );
};

export default VendorDetailsPage;
