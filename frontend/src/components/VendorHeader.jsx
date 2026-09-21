import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
  Avatar,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

// Fallback banner image
const FALLBACK_COVER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"%3E%3Crect fill="%23075B43" width="1200" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="28" font-weight="bold" fill="%23ffffff" font-family="sans-serif" text-anchor="middle" dy=".3em"%3EAapnuBazaar Local Marketplace%3C/text%3E%3C/svg%3E';

// Design Tokens
const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  white: '#FFFFFF',
  textPrimary: '#17221D',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  red: '#E03131',
};

/**
 * VendorHeader Component
 * Clean, compact marketplace vendor hero:
 * - Breadcrumb navigation
 * - Controlled aspect-ratio cover banner with fallback
 * - Overlapping store logo / avatar
 * - Store name, star rating badge, category, distance, prep time, open status
 * - Interactive Share & Favorite buttons
 */
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
  const categoryName = vendor.module?.name || 'Local Store';

  return (
    <Box sx={{ backgroundColor: BRAND.white, borderBottom: `1px solid ${BRAND.border}` }}>
      {/* 1. Breadcrumbs */}
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1280px !important',
          pt: { xs: 1.5, sm: 2 },
          pb: 1,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: '#9CA3AF' }} />}
          sx={{ fontSize: '13px' }}
        >
          <Link
            component="button"
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: BRAND.textSecondary,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '12.5px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              '&:hover': { color: BRAND.primaryGreen },
            }}
          >
            <HomeIcon sx={{ fontSize: 15 }} />
            Home
          </Link>
          <Link
            component="button"
            onClick={() => navigate('/vendors')}
            sx={{
              color: BRAND.textSecondary,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '12.5px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              '&:hover': { color: BRAND.primaryGreen },
            }}
          >
            Shops
          </Link>
          <Typography sx={{ color: BRAND.textPrimary, fontWeight: 700, fontSize: '12.5px' }}>
            {vendor.name}
          </Typography>
        </Breadcrumbs>
      </Container>

      {/* 2. Shop Cover Banner with Actions */}
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1280px !important',
          px: { xs: 2, sm: 3, md: 4 },
          pb: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 150, sm: 200, md: 240 },
            borderRadius: { xs: '14px', sm: '18px' },
            overflow: 'hidden',
            backgroundColor: BRAND.darkGreen,
            border: `1px solid ${BRAND.border}`,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
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

          {/* Dark gradient overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 65%)',
            }}
          />

          {/* Top Right Action Buttons (Share & Favorite) */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3 }}
          >
            <IconButton
              aria-label="Share shop"
              onClick={handleShare}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                width: 36,
                height: 36,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: BRAND.textPrimary,
                '&:hover': { backgroundColor: BRAND.white, color: BRAND.primaryGreen },
              }}
            >
              <ShareIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <IconButton
              aria-label="Add to favorites"
              onClick={handleToggleFavorite}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                width: 36,
                height: 36,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: isFav ? BRAND.red : BRAND.textPrimary,
                '&:hover': { backgroundColor: BRAND.white, color: BRAND.red },
              }}
            >
              {isFav ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Stack>
        </Box>

        {/* 3. Shop Details & Identity Info */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            px: { xs: 0.5, sm: 1 },
            mt: 0,
            position: 'relative',
            zIndex: 4,
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.2 } }}>
            {/* Shop Avatar overlapping banner */}
            <Avatar
              src={vendor.vendor_image || coverImg}
              alt={vendor.name}
              sx={{
                width: { xs: 68, sm: 84 },
                height: { xs: 68, sm: 84 },
                mt: { xs: -4.5, sm: -5.5 },
                border: '4px solid #FFFFFF',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                backgroundColor: BRAND.lightGreen,
                color: BRAND.primaryGreen,
                fontSize: '1.8rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'S'}
            </Avatar>

            {/* Shop Title & Badges with clean spacing */}
            <Box sx={{ pt: { xs: 0.8, sm: 1.2 }, pb: 0.5 }}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '20px', sm: '24px' },
                  color: BRAND.textPrimary,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  mb: 0.5,
                }}
              >
                {vendor.name}
              </Typography>

              {/* Metadata Row: Rating • Category • Distance • Delivery Time • Status */}
              <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                {/* Rating Badge */}
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
                  <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.primaryGreen }}>
                    {vendor.rating || '4.8'}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '12px', color: '#CBD5E1' }}>•</Typography>

                <Typography sx={{ fontSize: '12.5px', color: BRAND.textSecondary, fontWeight: 600 }}>
                  {categoryName}
                </Typography>

                <Typography sx={{ fontSize: '12px', color: '#CBD5E1' }}>•</Typography>

                <Typography sx={{ fontSize: '12.5px', color: BRAND.textSecondary, fontWeight: 500 }}>
                  {distance}
                </Typography>

                <Typography sx={{ fontSize: '12px', color: '#CBD5E1' }}>•</Typography>

                {/* Status Indicator */}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: isOpen ? BRAND.primaryGreen : BRAND.textSecondary,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: '12.5px',
                      color: isOpen ? BRAND.primaryGreen : BRAND.textSecondary,
                      fontWeight: 700,
                    }}
                  >
                    {isOpen ? 'Open now' : 'Closed'}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '12px', color: '#CBD5E1' }}>•</Typography>

                <Typography sx={{ fontSize: '12.5px', color: BRAND.textSecondary, fontWeight: 500 }}>
                  {prepTime}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Share Snackbar */}
      <Snackbar
        open={showShareSnackbar}
        autoHideDuration={2500}
        onClose={() => setShowShareSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowShareSnackbar(false)}
          severity="success"
          sx={{ width: '100%', borderRadius: '10px', fontWeight: 600 }}
        >
          Shop link copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorHeader;
