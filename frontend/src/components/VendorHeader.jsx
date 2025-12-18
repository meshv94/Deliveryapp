import React from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CallIcon from '@mui/icons-material/Call';
import ShareIcon from '@mui/icons-material/Share';

// Fallback banner image
const FALLBACK_BANNER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="300"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23667eea;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23764ba2;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23grad)" width="1200" height="300"/%3E%3C/svg%3E';

/**
 * VendorHeader Component
 * Displays vendor information including banner, name, description, and meta info
 *
 * @param {object} vendor - Vendor data object
 */
const VendorHeader = ({ vendor }) => {
  const navigate = useNavigate();

  if (!vendor) {
    return null;
  }

  // Format time (assuming HH:mm format)
  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  // Check if vendor is open
  const isOpen = vendor.isOpen !== false;

  // Format address
  const address =
    vendor.address ||
    (vendor.location ? `${vendor.location.city}, ${vendor.location.country}` : 'Address not available');

  return (
    <>
      {/* Back Button - Fixed at top */}
      <Box
        sx={{
          position: 'fixed',
          top: 72, // Adjust based on your AppBar height
          left: 16,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <IconButton
          size="small"
          onClick={() => navigate('/')}
          sx={{
            color: '#667eea',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      {/* Banner Image */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 200, sm: 280, md: 320 },
          backgroundImage: `url(${vendor.vendorBanner || vendor.banner || FALLBACK_BANNER})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#667eea',
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.45)',
          },
        }}
      />

      {/* Vendor Info Section */}
      <Box
        sx={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
          {/* Header with Status */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box flex={1}>
              {/* Vendor Name */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  color: '#1a1a1a',
                  mb: 0.5,
                }}
              >
                {vendor.name}
              </Typography>

              {/* Category */}
              {vendor.module?.name && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontWeight: 500,
                    mb: 1.5,
                  }}
                >
                  {vendor.module.name}
                </Typography>
              )}
            </Box>

            {/* Status Badge */}
            <Chip
              label={isOpen ? 'Open' : 'Closed'}
              color={isOpen ? 'success' : 'error'}
              variant="filled"
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                height: 32,
              }}
            />
          </Stack>

          {/* Description */}
          {vendor.description && (
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                lineHeight: 1.6,
                mb: 2.5,
                maxWidth: '80%',
              }}
            >
              {vendor.description}
            </Typography>
          )}

          {/* Meta Info Bar */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              mb: 2.5,
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            {/* Open Time */}
            {vendor.openTime && vendor.closeTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon
                  sx={{
                    color: '#4caf50',
                    fontSize: '1.4rem',
                  }}
                />
                <Box>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                    Hours
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#1a1a1a' }}
                  >
                    {formatTime(vendor.openTime)} – {formatTime(vendor.closeTime)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon
                sx={{
                  color: '#1976d2',
                  fontSize: '1.4rem',
                }}
              />
              <Box>
                <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                  Location
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={address}
                >
                  {address}
                </Typography>
              </Box>
            </Box>

            {/* Delivery Charge */}
            {vendor.deliveryCharge !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeliveryDiningIcon
                  sx={{
                    color: '#ff9800',
                    fontSize: '1.4rem',
                  }}
                />
                <Box>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                    Delivery
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#1a1a1a' }}
                  >
                    ${vendor.deliveryCharge.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Prep Time */}
            {vendor.preparationTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon
                  sx={{
                    color: '#9c27b0',
                    fontSize: '1.4rem',
                  }}
                />
                <Box>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
                    Prep Time
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#1a1a1a' }}
                  >
                    {vendor.preparationTime} min
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            {vendor.contactNumber && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<CallIcon />}
                href={`tel:${vendor.contactNumber}`}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#5568d3',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                Call
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              sx={{
                borderColor: '#ddd',
                color: '#666',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#bbb',
                  backgroundColor: '#fafafa',
                },
              }}
            >
              Share
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

export default VendorHeader;
