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
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CallIcon from '@mui/icons-material/Call';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import VerifiedIcon from '@mui/icons-material/Verified';
import StorefrontIcon from '@mui/icons-material/Storefront';

// Fallback banner
const FALLBACK_COVER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"%3E%3Crect fill="%23075B43" width="1200" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="28" fill="%23ffffff" font-family="sans-serif" text-anchor="middle" dy=".3em"%3EAapnuBazaar Local Marketplace%3C/text%3E%3C/svg%3E';

const VendorHeader = ({ vendor }) => {
  const navigate = useNavigate();
  const [showShareSnackbar, setShowShareSnackbar] = useState(false);
  const [favoriteShopIds, setFavoriteShopIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aapnubazaar_favorites') || '[]');
    } catch {
      return [];
    }
  });

  if (!vendor) return null;

  const vendorId = vendor._id || vendor.id;
  const isFav = favoriteShopIds.includes(vendorId);
  const isOpen = vendor.isOpen !== false && vendor.status !== 0;

  // Toggle favorite
  const handleToggleFavorite = () => {
    let updated;
    if (isFav) {
      updated = favoriteShopIds.filter((id) => id !== vendorId);
    } else {
      updated = [...favoriteShopIds, vendorId];
    }
    setFavoriteShopIds(updated);
    localStorage.setItem('aapnubazaar_favorites', JSON.stringify(updated));
  };

  // Share action
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: vendor.name,
          text: `Order from ${vendor.name} on AapnuBazaar!`,
          url: window.location.href,
        });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    navigator.clipboard.writeText(window.location.href);
    setShowShareSnackbar(true);
  };

  const coverImg = vendor.vendor_image || vendor.banner || '/cover_img.png';
  const prepTime = vendor.preparation_time_minute ? `${vendor.preparation_time_minute} min` : '20–30 min';
  const distance = vendor.distance_km != null ? `${vendor.distance_km} km` : '1.2 km';
  const addressText = vendor.address?.address_line_1 || vendor.address?.city || (typeof vendor.address === 'string' ? vendor.address : 'Surat, Gujarat');

  return (
    <Box sx={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
      {/* 1. Breadcrumbs */}
      <Container maxWidth="lg" sx={{ pt: 2.5, pb: 1.5 }}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#9CA3AF' }} />}
          sx={{ fontSize: '13.5px' }}
        >
          <Link
            component="button"
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: '#6B7280',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              '&:hover': { color: '#087F5B' },
            }}
          >
            <HomeIcon sx={{ fontSize: 16 }} />
            Home
          </Link>
          <Link
            component="button"
            onClick={() => navigate('/vendors')}
            sx={{
              color: '#6B7280',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              '&:hover': { color: '#087F5B' },
            }}
          >
            Shops
          </Link>
          <Typography sx={{ color: '#151515', fontWeight: 700, fontSize: '13px' }}>
            {vendor.name}
          </Typography>
        </Breadcrumbs>
      </Container>

      {/* 2. Large Shop Cover Image */}
      <Container maxWidth="lg" sx={{ pb: 3 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 180, sm: 260, md: 320 },
            borderRadius: { xs: '16px', sm: '20px' },
            overflow: 'hidden',
            backgroundColor: '#075B43',
            border: '1px solid #E5E7EB',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box
            component="img"
            src={coverImg}
            alt={vendor.name}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            onError={(e) => {
              e.target.src = FALLBACK_COVER;
            }}
          />

          {/* Gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
            }}
          />

          {/* Top Right Action Buttons (Share & Favorite) */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 14, right: 14, zIndex: 3 }}
          >
            <IconButton
              onClick={handleShare}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: '#151515',
                '&:hover': { backgroundColor: '#FFFFFF', color: '#087F5B' },
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>

            <IconButton
              onClick={handleToggleFavorite}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: isFav ? '#E03131' : '#151515',
                '&:hover': { backgroundColor: '#FFFFFF', color: '#E03131' },
              }}
            >
              {isFav ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
          </Stack>
        </Box>

        {/* 3. Shop Details & Identity Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mt: -4,
            px: { xs: 1, sm: 2 },
            position: 'relative',
            zIndex: 4,
            gap: 2,
          }}
        >
          {/* Shop Logo & Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={vendor.vendor_image || coverImg}
              alt={vendor.name}
              sx={{
                width: { xs: 72, sm: 90 },
                height: { xs: 72, sm: 90 },
                border: '4px solid #FFFFFF',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
                backgroundColor: '#EBFBEE',
                color: '#087F5B',
                fontSize: '2rem',
                fontWeight: 800,
              }}
            >
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'S'}
            </Avatar>

            <Box sx={{ pt: { xs: 3.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.2rem' },
                    color: '#151515',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {vendor.name}
                </Typography>
                <VerifiedIcon sx={{ color: '#087F5B', fontSize: 22 }} />
              </Box>

              {/* Category & Status */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                {vendor.module?.name && (
                  <Chip
                    label={vendor.module.name}
                    size="small"
                    sx={{
                      backgroundColor: '#EBFBEE',
                      color: '#087F5B',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  />
                )}
                <Chip
                  label={isOpen ? 'Open Now' : 'Closed'}
                  size="small"
                  sx={{
                    backgroundColor: isOpen ? '#EBFBEE' : '#FFF5F5',
                    color: isOpen ? '#087F5B' : '#E03131',
                    fontWeight: 700,
                    fontSize: '11px',
                    border: isOpen ? '1px solid #B2F2BB' : '1px solid #FFC9C9',
                  }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Quick Contact CTA */}
          {vendor.mobile_number && (
            <Box sx={{ pt: { xs: 0, sm: 3 }, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
              <Button
                variant="outlined"
                href={`tel:${vendor.mobile_number}`}
                startIcon={<CallIcon />}
                sx={{
                  borderColor: '#E5E7EB',
                  color: '#151515',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  borderRadius: '10px',
                  px: 2.2,
                  py: 0.8,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#087F5B',
                    backgroundColor: '#EBFBEE',
                    color: '#087F5B',
                  },
                }}
              >
                Call Store
              </Button>
            </Box>
          )}
        </Box>

        {/* 4. Meta Badges Strip: Rating, Distance, Delivery Time, Address */}
        <Paper
          elevation={0}
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: '14px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FAFAF7',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: { xs: 2, sm: 3 },
          }}
        >
          {/* ⭐ Rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#FFF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StarIcon sx={{ fontSize: 17, color: '#FF922B' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#151515', lineHeight: 1 }}>
                {vendor.rating || '4.8'}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                Verified Rating
              </Typography>
            </Box>
          </Box>

          {/* Delivery Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#EBFBEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 17, color: '#087F5B' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#151515', lineHeight: 1 }}>
                {prepTime}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                Delivery Time
              </Typography>
            </Box>
          </Box>

          {/* Distance */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#E7F5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocationOnIcon sx={{ fontSize: 17, color: '#1971C2' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#151515', lineHeight: 1 }}>
                {distance}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                From Your Location
              </Typography>
            </Box>
          </Box>

          {/* Store Address / Hours */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: { sm: 'auto' } }}>
            <DeliveryDiningIcon sx={{ fontSize: 20, color: '#087F5B' }} />
            <Typography sx={{ fontSize: '12.5px', color: '#6B7280', fontWeight: 600 }}>
              {addressText}
            </Typography>
          </Box>
        </Paper>

        {/* Optional Description */}
        {vendor.description && (
          <Typography sx={{ fontSize: '14px', color: '#6B7280', mt: 2, px: 0.5, lineHeight: 1.6 }}>
            {vendor.description}
          </Typography>
        )}
      </Container>

      {/* Share Toast */}
      <Snackbar
        open={showShareSnackbar}
        autoHideDuration={2500}
        onClose={() => setShowShareSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: '10px', fontWeight: 600 }}>
          Store link copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorHeader;
