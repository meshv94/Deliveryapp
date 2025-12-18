import React from 'react';
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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import useVendors from '../hooks/useVendors';
import VendorCard from '../components/VendorCard';
import CanvasBackground from '../components/CanvasBackground';
import AnimatedVendorCardWrapper from '../components/AnimatedVendorCardWrapper';

const VendorListPage = () => {
  const { vendors, loading, error } = useVendors();

  // Skeleton loaders count
  const skeletonCount = 8;

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
            py: { xs: 4, sm: 6 },
            mb: 4,
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 800,
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.5rem' },
              }}
            >
              Order from Local Vendors
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
              <LocationOnIcon />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Fast delivery • Real-time tracking • Best local businesses
              </Typography>
            </Stack>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ pb: 6 }}>
          {/* Error State */}
          {error && !loading && (
            <Alert
              severity="error"
              sx={{
                mb: 4,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Stack>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  {error}
                </Typography>
                <Box>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                    sx={{
                      backgroundColor: '#d32f2f',
                      '&:hover': {
                        backgroundColor: '#b71c1c',
                      },
                    }}
                  >
                    Try Again
                  </Button>
                </Box>
              </Stack>
            </Alert>
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
          ) : vendors && vendors.length > 0 ? (
            <>
              {/* Section Header */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  }}
                >
                  Available Now
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#999',
                    mt: 0.5,
                  }}
                >
                  {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} found
                </Typography>
              </Box>

              {/* Vendors Grid with Entrance Animations */}
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {vendors.map((vendor, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={vendor._id || vendor.id}>
                    {/* Animated Wrapper - Adds entrance animation with stagger */}
                    <AnimatedVendorCardWrapper index={index} delay={50}>
                      <VendorCard vendor={vendor} />
                    </AnimatedVendorCardWrapper>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            /* Empty State */
            <Paper
              elevation={0}
              sx={{
                textAlign: 'center',
                py: 12,
                borderRadius: 3,
                backgroundColor: '#f9f9f9',
                border: '1px solid #eee',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#1a1a1a',
                    mb: 1,
                  }}
                >
                  No vendors available
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#999',
                    mb: 3,
                    maxWidth: 400,
                    mx: 'auto',
                  }}
                >
                  Vendors are currently not available in your area. Check back soon or enable location services.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Refresh Page
              </Button>
            </Paper>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default VendorListPage;
