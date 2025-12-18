import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
  Avatar,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CallIcon from '@mui/icons-material/Call';
import ShareIcon from '@mui/icons-material/Share';
import StorefrontIcon from '@mui/icons-material/Storefront';

/**
 * VendorHeader Component
 * Displays vendor information including banner, name, description, and meta info
 *
 * @param {object} vendor - Vendor data object
 */
const VendorHeader = ({ vendor }) => {
  const navigate = useNavigate();
  const [bannerError, setBannerError] = useState(false);
  const [showShareSnackbar, setShowShareSnackbar] = useState(false);

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

  // Get banner image URL or use fallback
  const bannerImage = vendor.vendorBanner || vendor.banner;
  const hasBanner = bannerImage && !bannerError;

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vendor.name,
          text: `Check out ${vendor.name} on DeliveryApp!`,
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowShareSnackbar(true);
  };

  return (
    <>
      {/* Back Button - Fixed at top */}
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            color: '#667eea',
            padding: { xs: 1, sm: 1.25 },
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
        </IconButton>
      </Box>

      {/* Banner Section */}
      <Box
        sx={{
          width: '100%',
          height: { xs: 200, sm: 280, md: 320 },
          position: 'relative',
          overflow: 'hidden',
          background: hasBanner
            ? 'transparent'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {/* Background Image or Pattern */}
        {hasBanner ? (
          <Box
            component="img"
            src={bannerImage}
            alt={`${vendor.name} banner`}
            onError={() => setBannerError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          /* Fallback Pattern Design */
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {/* Centered Store Icon for fallback */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1,
              }}
            >
              <StorefrontIcon
                sx={{
                  fontSize: { xs: '3rem', sm: '4rem' },
                  color: 'rgba(255, 255, 255, 0.9)',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                }}
              />
            </Box>
          </Box>
        )}

        {/* Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isOpen
              ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)'
              : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)',
            zIndex: 1,
          }}
        />
      </Box>

      {/* Vendor Info Section */}
      <Box
        sx={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e0e0e0',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 2.5, sm: 3, md: 3.5 } }}>
          {/* Header with Status */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2, gap: 2 }}
          >
            <Box flex={1}>
              {/* Vendor Name */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                  mb: 0,
                }}
              >
                {vendor.name}
              </Typography>
            </Box>

            {/* Status Badge */}
            <Chip
              label={isOpen ? 'Open' : 'Closed'}
              color={isOpen ? 'success' : 'error'}
              variant="filled"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                height: { xs: 28, sm: 32 },
                minWidth: { xs: 70, sm: 80 },
              }}
            />
          </Stack>

          {/* Description */}
          {vendor.description && (
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                lineHeight: 1.7,
                mb: 3,
                maxWidth: { xs: '100%', sm: '85%', md: '80%' },
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {vendor.description}
            </Typography>
          )}

          {/* Meta Info Bar */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 3 }}
            sx={{
              mb: 3,
              flexWrap: 'wrap',
            }}
          >
            {/* Open Time */}
            {vendor.open_time && vendor.close_time && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  minHeight: 48,
                }}
              >
                <AccessTimeIcon
                  sx={{
                    color: '#4caf50',
                    fontSize: { xs: '1.3rem', sm: '1.5rem' },
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#999',
                      display: 'block',
                      fontSize: '0.7rem',
                      mb: 0.25,
                      lineHeight: 1,
                    }}
                  >
                    Hours
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#1a1a1a',
                      fontSize: { xs: '0.875rem', sm: '0.9rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    {formatTime(vendor.open_time)} – {formatTime(vendor.close_time)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Location */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minHeight: 48,
                flex: 1,
              }}
            >
              <LocationOnIcon
                sx={{
                  color: '#1976d2',
                  fontSize: { xs: '1.3rem', sm: '1.5rem' },
                  flexShrink: 0,
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#999',
                    display: 'block',
                    fontSize: '0.7rem',
                    mb: 0.25,
                    lineHeight: 1,
                  }}
                >
                  Location
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: { xs: '0.875rem', sm: '0.9rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}
                  title={address}
                >
                  {address}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 1.5 }}>
            {vendor.mobile_number && (
              <Button
                variant="contained"
                size="medium"
                startIcon={<CallIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />}
                href={`tel:${vendor.mobile_number}`}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  px: { xs: 2.5, sm: 3 },
                  py: { xs: 1, sm: 1.25 },
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Call Vendor
              </Button>
            )}

            <Button
              variant="outlined"
              size="medium"
              startIcon={<ShareIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }} />}
              onClick={handleShare}
              sx={{
                borderColor: '#e0e0e0',
                color: '#666',
                fontWeight: 600,
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1, sm: 1.25 },
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                borderWidth: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  color: '#667eea',
                  borderWidth: 1.5,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Share
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Share Snackbar */}
      <Snackbar
        open={showShareSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowShareSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setShowShareSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          Link copied to clipboard!
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default VendorHeader;
