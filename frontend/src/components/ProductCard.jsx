import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import StarIcon from '@mui/icons-material/Star';
import { useCartContext } from '../context/CartContext';

// Branded SVG Fallback for Product Images
const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect fill="%23F7F9F8" width="300" height="300"/%3E%3Ccircle cx="150" cy="140" r="50" fill="%23EAF7F2"/%3E%3Cpath d="M135 125h30v35h-30z M140 125a10 10 0 0 1 20 0" stroke="%23087F5B" stroke-width="3" fill="none"/%3E%3Ctext x="150" y="220" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="%23087F5B" text-anchor="middle"%3EAapnuBazaar%3C/text%3E%3C/svg%3E';

// Design Tokens
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
  bgCard: '#FFFFFF',
};

/**
 * ProductCard Component
 * High-performing vertical product card:
 * - Fixed 1:1 image container with graceful fallback & discount tag
 * - 2-line clamped title with fixed min-height for baseline grid alignment
 * - Prominent price with strikethrough comparison
 * - Full-width / large [ + Add ] and connected quantity stepper
 */
const ProductCard = ({ product, vendorId, onAddClick }) => {
  const { addToCart, getProductQuantity, updateQuantity, removeFromCart } = useCartContext();
  const [imageError, setImageError] = useState(false);

  const cartQuantity = getProductQuantity(vendorId, product._id);

  // Pricing calculations
  const hasSpecialPrice =
    product.special_price != null &&
    product.special_price < product.main_price &&
    product.special_price > 0;
  const mainPrice = product.main_price || product.price || 0;
  const specialPrice = product.special_price || 0;
  const displayPrice = hasSpecialPrice ? specialPrice : mainPrice;

  // Discount percentage calculation
  const discountPercent =
    hasSpecialPrice && mainPrice > 0
      ? Math.round(((mainPrice - specialPrice) / mainPrice) * 100)
      : 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(vendorId, product, 1);
    if (onAddClick) {
      onAddClick(product);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(vendorId, product._id, cartQuantity + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (cartQuantity <= 1) {
      removeFromCart(vendorId, product._id);
    } else {
      updateQuantity(vendorId, product._id, cartQuantity - 1);
    }
  };

  const imgSrc = !imageError && product.image ? product.image : FALLBACK_PRODUCT_IMAGE;

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        backgroundColor: BRAND.bgCard,
        border: `1px solid ${BRAND.border}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 24px rgba(8, 127, 91, 0.08)',
          borderColor: BRAND.primaryGreen,
        },
      }}
    >
      {/* Product Image Container (1:1 / Fixed Height) */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 135, sm: 160, md: 175 },
          backgroundColor: '#F7F9F8',
          overflow: 'hidden',
        }}
      >
        <CardMedia
          component="img"
          image={imgSrc}
          alt={product.name || 'Product'}
          loading="lazy"
          onError={() => setImageError(true)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'scale(1.04)',
            },
          }}
        />

        {/* Dietary Tag Overlay (Veg / Non-Veg / Vegan) */}
        {product.dietary_type && product.dietary_type !== 'none' && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              px: 0.6,
              py: 0.4,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {product.dietary_type === 'veg' && (
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  border: '2px solid #087F5B',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#087F5B' }} />
              </Box>
            )}
            {product.dietary_type === 'non_veg' && (
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  border: '2px solid #E03131',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: '7px solid #E03131',
                  }}
                />
              </Box>
            )}
            {product.dietary_type === 'vegan' && (
              <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#087F5B', lineHeight: 1 }}>
                🌱 VEGAN
              </Typography>
            )}
            {product.dietary_type === 'egg' && (
              <Typography sx={{ fontSize: '10px', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>
                🥚 EGG
              </Typography>
            )}
          </Box>
        )}

        {/* Discount Tag Overlay */}
        {discountPercent > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: BRAND.orangeLight,
              color: BRAND.orange,
              fontWeight: 800,
              fontSize: { xs: '10px', sm: '11px' },
              px: 0.8,
              py: 0.2,
              borderRadius: '6px',
              border: `1px solid rgba(255, 107, 0, 0.25)`,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            }}
          >
            {discountPercent}% OFF
          </Box>
        )}

        {/* Preparation Time / Rating overlay */}
        {product.preparation_time_minute > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              backgroundColor: 'rgba(23, 34, 29, 0.75)',
              color: '#FFFFFF',
              px: 0.7,
              py: 0.2,
              borderRadius: '6px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>
              ⏱ {product.preparation_time_minute}m
            </Typography>
          </Box>
        )}

        {/* Rating overlay if available */}
        {(product.rating || product.avgRating) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              px: 0.6,
              py: 0.2,
              borderRadius: '6px',
              backdropFilter: 'blur(4px)',
            }}
          >
            <StarIcon sx={{ fontSize: 12, color: BRAND.primaryGreen }} />
            <Typography sx={{ fontSize: '11px', fontWeight: 800, color: BRAND.textPrimary }}>
              {product.rating || product.avgRating}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Product Content & Details */}
      <CardContent
        sx={{
          p: { xs: 1.2, sm: 1.5 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: { xs: 1.2, sm: 1.5 } },
        }}
      >
        {/* Product Title (Guaranteed 2 lines max with uniform minHeight) */}
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: '13.5px', sm: '15px' },
            color: BRAND.textPrimary,
            lineHeight: 1.3,
            minHeight: { xs: '35px', sm: '39px' },
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.5,
          }}
        >
          {product.name}
        </Typography>

        {/* Short Description */}
        {product.description && (
          <Typography
            sx={{
              color: BRAND.textSecondary,
              fontSize: { xs: '11px', sm: '12px' },
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
            }}
          >
            {product.description}
          </Typography>
        )}

        {/* Pricing Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.8,
            mb: 1.2,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '15px', sm: '16px' },
              color: BRAND.primaryGreen,
            }}
          >
            ₹{displayPrice.toFixed(0)}
          </Typography>

          {hasSpecialPrice && (
            <Typography
              sx={{
                textDecoration: 'line-through',
                color: '#9CA3AF',
                fontWeight: 500,
                fontSize: { xs: '12px', sm: '13px' },
              }}
            >
              ₹{mainPrice.toFixed(0)}
            </Typography>
          )}
        </Box>

        {/* Bottom CTA Section: [ + Add ] or [ −  qty  + ] */}
        <Box sx={{ mt: 'auto', width: '100%' }}>
          {cartQuantity > 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                backgroundColor: BRAND.primaryGreen,
                borderRadius: '10px',
                color: BRAND.white,
                px: 0.5,
                py: 0.2,
                height: { xs: 34, sm: 38 },
                boxShadow: '0 2px 8px rgba(8, 127, 91, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton
                size="small"
                aria-label={`Decrease quantity of ${product.name}`}
                onClick={handleDecrement}
                sx={{
                  color: BRAND.white,
                  p: { xs: 0.3, sm: 0.5 },
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <RemoveIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
              </IconButton>

              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '13px', sm: '14px' },
                  userSelect: 'none',
                }}
              >
                {cartQuantity}
              </Typography>

              <IconButton
                size="small"
                aria-label={`Increase quantity of ${product.name}`}
                onClick={handleIncrement}
                sx={{
                  color: BRAND.white,
                  p: { xs: 0.3, sm: 0.5 },
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <AddIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              sx={{
                backgroundColor: BRAND.primaryGreen,
                color: BRAND.white,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                height: { xs: 34, sm: 38 },
                fontSize: { xs: '12.5px', sm: '13.5px' },
                boxShadow: 'none',
                transition: 'all 0.18s ease',
                '&:hover': {
                  backgroundColor: BRAND.darkGreen,
                  boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
                },
              }}
            >
              Add
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
