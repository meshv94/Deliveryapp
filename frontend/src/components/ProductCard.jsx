import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import { useCartContext } from '../context/CartContext';

// Fallback product image
const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f5f5f5" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em"%3EProduct Image%3C/text%3E%3C/svg%3E';

/**
 * ProductCard Component
 * Displays individual product information with add to cart button
 * Allows quantity selection before adding to cart
 *
 * @param {object} product - Product data object
 * @param {string} vendorId - Vendor ID for the product
 * @param {function} onAddClick - Optional callback when add button is clicked
 */
const ProductCard = ({ product, vendorId, onAddClick }) => {
  const { addToCart, getProductQuantity, updateQuantity, removeFromCart } = useCartContext();
  const [quantity, setQuantity] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });

  const cartQuantity = getProductQuantity(vendorId, product._id);

  const handleAddClick = (e) => {
    e.stopPropagation();
    const cartQuantityToSet =  cartQuantity ? cartQuantity : 1;
    setQuantity(cartQuantityToSet);
    setOpenDialog(true);
  };

  const handleAddToCart = () => {
    try {
      const ItemQuantity = quantity - cartQuantity;
      addToCart(vendorId, product, ItemQuantity);
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: `${quantity} item${quantity > 1 ? 's' : ''} added to cart!`,
        type: 'success',
      });

      // Call optional callback
      if (onAddClick) {
        onAddClick(product);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to add to cart',
        type: 'error',
      });
    }
  };

  const handleQuantityChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setQuantity(value);
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  // Check if product has special price
  const hasSpecialPrice =
    product.special_price && product.special_price < product.main_price;

  // Use correct price fields
  const mainPrice = product.main_price || product.price || 0;
  const specialPrice = product.special_price || 0;

  const displayPrice = hasSpecialPrice ? specialPrice : mainPrice;

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        minHeight: { xs: 150, sm: 160 },
        display: 'flex',
        flexDirection: 'row',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#fff',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(8, 127, 91, 0.12)',
          transform: 'translateY(-2px)',
          borderColor: '#087F5B',
        },
      }}
    >
      {/* Content - Left Side */}
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '14px 16px',
          gap: 0.75,
          minWidth: 0,
        }}
      >
        <Box>
          {/* Product Name */}
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '0.95rem',
              lineHeight: 1.3,
              color: '#151515',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 0.5,
            }}
          >
            {product.name}
          </Typography>

          {/* Description (optional) */}
          {product.description && (
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontSize: '0.78rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 0.5,
              }}
            >
              {product.description}
            </Typography>
          )}

          {/* Rating if available */}
          {(product.rating || product.avgRating) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.5 }}>
              <StarIcon sx={{ fontSize: '0.85rem', color: '#FF922B' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#151515', fontSize: '0.75rem' }}>
                {product.rating || product.avgRating}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price & Prep Info Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.75 }}>
            {hasSpecialPrice ? (
              <>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#087F5B',
                    fontSize: '1.05rem',
                  }}
                >
                  ₹{specialPrice.toFixed(2)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: 'line-through',
                    color: '#9CA3AF',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                  }}
                >
                  ₹{mainPrice.toFixed(2)}
                </Typography>
                <Chip
                  label={`${Math.round(((mainPrice - specialPrice) / mainPrice) * 100)}% OFF`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    color: '#FF6B00',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 18,
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </>
            ) : (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#151515',
                  fontSize: '1.05rem',
                }}
              >
                ₹{mainPrice.toFixed(2)}
              </Typography>
            )}
          </Box>

          {/* Preparation Time & Cart Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {product.preparation_time_min && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: '0.9rem', color: '#FF6B00' }} />
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.72rem' }}>
                  {product.preparation_time_min} min
                </Typography>
              </Box>
            )}
            {cartQuantity > 0 && (
              <Chip
                label={`${cartQuantity} in cart`}
                size="small"
                sx={{
                  backgroundColor: '#087F5B',
                  color: '#fff',
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Product Image with Button - Right Side */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
          width: { xs: 110, sm: 125 },
          flexShrink: 0,
        }}
      >
        {/* Image Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 80, sm: 88 },
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#FAFAF7',
            mb: 1,
          }}
        >
          {product.image ? (
            <CardMedia
              component="img"
              image={product.image}
              alt={product.name || 'Product'}
              loading="lazy"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.08)',
                },
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              AapnuBazaar
            </Box>
          )}
        </Box>

        {/* Add Button or Stepper Controls */}
        {cartQuantity > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              backgroundColor: '#087F5B',
              borderRadius: '10px',
              color: '#fff',
              px: 0.6,
              py: 0.3,
              minHeight: 38,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (cartQuantity === 1) {
                  removeFromCart(vendorId, product._id);
                } else {
                  updateQuantity(vendorId, product._id, cartQuantity - 1);
                }
              }}
              sx={{ color: '#fff', p: 0.6, width: 32, height: 32 }}
            >
              <RemoveIcon sx={{ fontSize: '0.95rem' }} />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', px: 0.5 }}>
              {cartQuantity}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                updateQuantity(vendorId, product._id, cartQuantity + 1);
              }}
              sx={{ color: '#fff', p: 0.6, width: 32, height: 32 }}
            >
              <AddIcon sx={{ fontSize: '0.95rem' }} />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="contained"
            size="small"
            fullWidth
            startIcon={<AddIcon sx={{ fontSize: '0.95rem' }} />}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(vendorId, product, 1);
              setSnackbar({
                open: true,
                message: `${product.name} added to cart!`,
                type: 'success',
              });
            }}
            sx={{
              backgroundColor: '#087F5B',
              color: '#fff',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: '10px',
              py: 0.8,
              minHeight: 38,
              fontSize: '0.82rem',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#075B43',
                boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
              },
            }}
          >
            ADD
          </Button>
        )}
      </Box>

      {/* Add to Cart Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            border: '1px solid #E5E7EB',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#151515' }}>
          {product.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ p: 1.5, backgroundColor: '#FAFAF7', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
              Price per item: <strong style={{ color: '#151515', fontSize: '1.05rem' }}>₹{displayPrice.toFixed(2)}</strong>
            </Typography>
            {hasSpecialPrice && (
              <Typography variant="caption" sx={{ color: '#087F5B', fontWeight: 700, display: 'block' }}>
                🎉 You save ₹{(mainPrice - specialPrice).toFixed(2)} per item!
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#151515' }}>
              Select Quantity:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={decrementQuantity} 
                disabled={quantity === 1}
                sx={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  p: 0.75,
                  '&:hover': { backgroundColor: '#FAFAF7' },
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <TextField
                type="number"
                size="small"
                value={quantity}
                onChange={handleQuantityChange}
                inputProps={{ min: 1, max: 100, style: { textAlign: 'center', width: '45px', fontWeight: 700 } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              <IconButton 
                size="small" 
                onClick={incrementQuantity}
                sx={{
                  border: '1px solid #087F5B',
                  backgroundColor: 'rgba(8, 127, 91, 0.08)',
                  color: '#087F5B',
                  borderRadius: '8px',
                  p: 0.75,
                  '&:hover': { backgroundColor: 'rgba(8, 127, 91, 0.15)' },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)} 
            variant="outlined"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E5E7EB',
              color: '#6B7280',
              '&:hover': { borderColor: '#9CA3AF', backgroundColor: '#FAFAF7' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            variant="contained"
            sx={{
              backgroundColor: '#087F5B',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': {
                backgroundColor: '#075B43',
              },
            }}
          >
            Add to Cart • ₹{(displayPrice * quantity).toFixed(2)}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ProductCard;
