import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Alert,
  Stack,
  Skeleton,
  Button,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import useVendorDetails from '../hooks/useVendorDetails';
import VendorHeader from '../components/VendorHeader';
import VendorMetaBar from '../components/VendorMetaBar';
import ProductCard from '../components/ProductCard';

/**
 * VendorDetailsPage
 * Main page displaying vendor information and products
 */
const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const { vendor, products, loading, error } = useVendorDetails(vendorId);
  const [addedProducts, setAddedProducts] = useState(new Set());

  /**
   * Handle Add to Cart
   */
  const handleAddToCart = (product) => {
    // For now, just show visual feedback
    // TODO: Integrate with cart management later
    setAddedProducts((prev) => {
      const updated = new Set(prev);
      updated.add(product._id || product.id);
      return updated;
    });

    // Reset after 2 seconds
    setTimeout(() => {
      setAddedProducts((prev) => {
        const updated = new Set(prev);
        updated.delete(product._id || product.id);
        return updated;
      });
    }, 2000);
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
          backgroundColor: '#fff',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <ErrorOutlineIcon
              sx={{
                fontSize: '4rem',
                color: '#d32f2f',
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Unable to Load Vendor
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.href = '/'}
              sx={{ mt: 2 }}
            >
              Back to Vendors
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Vendor Not Found State
  if (!vendor) {
    return (
      <Box
        sx={{
          backgroundColor: '#fff',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Vendor Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              The vendor you're looking for doesn't exist or has been removed.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.href = '/'}
              sx={{ mt: 2 }}
            >
              Back to Vendors
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Vendor Header with Banner */}
      <VendorHeader vendor={vendor} />

      {/* Vendor Meta Info Bar (sticky) */}
      <VendorMetaBar vendor={vendor} />

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Products Section */}
        <Box sx={{ mb: 4 }}>
          {/* Section Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 3,
              fontSize: { xs: '1.3rem', sm: '1.5rem' },
            }}
          >
            Menu
          </Typography>

          {/* Empty Products State */}
          {products.length === 0 ? (
            <Alert
              severity="info"
              icon={<ShoppingCartIcon />}
              sx={{
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                borderRadius: 2,
                fontSize: '0.95rem',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No products available from this vendor at the moment.
              </Typography>
            </Alert>
          ) : (
            <>
              {/* Products Count */}
              <Typography
                variant="caption"
                sx={{
                  color: '#999',
                  display: 'block',
                  mb: 2.5,
                  fontWeight: 500,
                }}
              >
                {products.length} {products.length === 1 ? 'product' : 'products'} available
              </Typography>

              {/* Products Grid */}
              <Grid
                container
                spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
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
                {products.map((product, index) => (
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
                    <ProductCard
                      product={product}
                      onAddClick={handleAddToCart}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Box>
      </Container>

      {/* Bottom Spacing */}
      <Box sx={{ py: 4 }} />
    </Box>
  );
};

export default VendorDetailsPage;
