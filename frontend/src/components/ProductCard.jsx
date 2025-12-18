import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';

// Fallback product image
const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em"%3EProduct Image%3C/text%3E%3C/svg%3E';

/**
 * ProductCard Component
 * Displays individual product information with add button
 *
 * @param {object} product - Product data object
 * @param {function} onAddClick - Callback when add button is clicked
 */
const ProductCard = ({ product, onAddClick }) => {
  const handleAddClick = (e) => {
    e.stopPropagation();
    if (onAddClick) {
      onAddClick(product);
    }
  };

  // Format price with proper decimal places
  const formatPrice = (price) => {
    if (typeof price !== 'number') return '$0.00';
    return `$${price.toFixed(2)}`;
  };

  // Check if product has special price
  const hasSpecialPrice =
    product.specialPrice && product.specialPrice < product.price;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#fff',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      {/* Product Image */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="200"
          image={product.productImage || product.image || FALLBACK_PRODUCT_IMAGE}
          alt={product.name}
          loading="lazy"
          sx={{
            objectFit: 'cover',
            backgroundColor: '#f5f5f5',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />

        {/* Special Price Badge */}
        {hasSpecialPrice && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: '#FF6B6B',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Sale
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '14px',
          gap: 1,
        }}
      >
        {/* Product Name */}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            fontSize: '0.95rem',
            lineHeight: 1.3,
            color: '#1a1a1a',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Typography>

        {/* Description (optional) */}
        {product.description && (
          <Typography
            variant="caption"
            sx={{
              color: '#999',
              fontSize: '0.8rem',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </Typography>
        )}

        {/* Price Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
          {hasSpecialPrice ? (
            <>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'line-through',
                  color: '#ccc',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                }}
              >
                {formatPrice(product.price)}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#FF6B6B',
                  fontSize: '1.05rem',
                }}
              >
                {formatPrice(product.specialPrice)}
              </Typography>
            </>
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#667eea',
                fontSize: '1.05rem',
              }}
            >
              {formatPrice(product.price)}
            </Typography>
          )}
        </Box>

        {/* Preparation Time */}
        {product.preparationTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimerIcon sx={{ fontSize: '1rem', color: '#ff9800' }} />
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
              {product.preparationTime} min
            </Typography>
          </Box>
        )}

        {/* Add Button */}
        <Button
          variant="contained"
          size="small"
          fullWidth
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{
            mt: 1.5,
            backgroundColor: '#667eea',
            color: '#fff',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '6px',
            padding: '8px 12px',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#5568d3',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            },
          }}
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
