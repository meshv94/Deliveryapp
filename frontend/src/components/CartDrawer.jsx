import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Divider,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';

/**
 * CartDrawer Component
 * Modern marketplace cart drawer with slide-in animation on desktop
 * and bottom-sheet presentation on mobile.
 */
const CartDrawer = ({
  open,
  onClose,
  vendorId,
  vendorName = '',
  items = [],
  subtotal = 0,
  totalItems = 0,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { updateQuantity, removeFromCart } = useCartContext();

  const handleProceedToCheckout = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open}
      onClose={onClose}
      elevation={16}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420, md: 450 },
          maxHeight: isMobile ? '88vh' : '100vh',
          height: isMobile ? 'auto' : '100%',
          borderTopLeftRadius: isMobile ? '24px' : '0px',
          borderTopRightRadius: isMobile ? '24px' : '0px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMobile
            ? '0 -10px 40px rgba(0, 0, 0, 0.2)'
            : '-10px 0 40px rgba(0, 0, 0, 0.12)',
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(21, 21, 21, 0.5)',
            backdropFilter: 'blur(3px)',
          },
        },
      }}
    >
      {/* Mobile Top Drag Indicator */}
      {isMobile && (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box
            sx={{
              width: 44,
              height: 4,
              borderRadius: '10px',
              backgroundColor: '#E5E7EB',
            }}
          />
        </Box>
      )}

      {/* Drawer Header */}
      <Box
        sx={{
          px: 3,
          py: 2.2,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FAFAF7',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <ShoppingBagOutlinedIcon sx={{ color: '#087F5B', fontSize: 24 }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: '#151515',
                  letterSpacing: '-0.02em',
                }}
              >
                Your Cart
              </Typography>
              <Chip
                label={`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
                size="small"
                sx={{
                  backgroundColor: '#EBFBEE',
                  color: '#087F5B',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  height: 22,
                }}
              />
            </Box>
            {vendorName && (
              <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', mt: 0.2 }}>
                From <strong>{vendorName}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Close cart drawer"
          sx={{
            color: '#6B7280',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            p: 0.8,
            borderRadius: '10px',
            '&:hover': {
              backgroundColor: '#F3F4F6',
              color: '#151515',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Drawer Body - Items List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 240,
              textAlign: 'center',
              color: '#9CA3AF',
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 54, color: '#D1D5DB', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, color: '#151515', fontSize: '1rem' }}>
              Your cart is empty
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mt: 0.5, maxWidth: 220 }}>
              Add items from the store to proceed with your order
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2} divider={<Divider sx={{ borderColor: '#F3F4F6' }} />}>
            {items.map(({ product, quantity, price, lineTotal }) => (
              <Box
                key={product._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.8,
                  py: 0.5,
                }}
              >
                {/* Product Image */}
                <Avatar
                  src={product.image}
                  variant="rounded"
                  alt={product.name}
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: '12px',
                    backgroundColor: '#FAFAF7',
                    border: '1px solid #E5E7EB',
                    flexShrink: 0,
                  }}
                >
                  <ShoppingBagOutlinedIcon sx={{ color: '#9CA3AF' }} />
                </Avatar>

                {/* Product Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      color: '#151515',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {product.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: '#6B7280', mt: 0.3 }}>
                    ₹{price.toFixed(2)}
                  </Typography>
                </Box>

                {/* Stepper + Line Total */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.8 }}>
                  {/* Stepper Controls */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#EBFBEE',
                      border: '1px solid #B2F2BB',
                      borderRadius: '8px',
                      px: 0.4,
                      py: 0.2,
                    }}
                  >
                    <IconButton
                      size="small"
                      aria-label="Decrease quantity"
                      onClick={() => {
                        if (quantity === 1) {
                          removeFromCart(vendorId, product._id);
                        } else {
                          updateQuantity(vendorId, product._id, quantity - 1);
                        }
                      }}
                      sx={{ color: '#087F5B', p: 0.35, width: 26, height: 26 }}
                    >
                      <RemoveIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>

                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: '#087F5B',
                        minWidth: 24,
                        textAlign: 'center',
                      }}
                    >
                      {quantity}
                    </Typography>

                    <IconButton
                      size="small"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(vendorId, product._id, quantity + 1)}
                      sx={{ color: '#087F5B', p: 0.35, width: 26, height: 26 }}
                    >
                      <AddIcon sx={{ fontSize: '0.85rem' }} />
                    </IconButton>
                  </Box>

                  {/* Line Total */}
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#151515' }}>
                    ₹{lineTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Drawer Footer - Summary & Checkout CTA */}
      {items.length > 0 && (
        <Box
          sx={{
            p: 3,
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Bill Summary */}
          <Stack spacing={1.1} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.88rem', color: '#6B7280' }}>Subtotal</Typography>
              <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#151515' }}>
                ₹{subtotal.toFixed(2)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: '#087F5B' }} />
                <Typography sx={{ fontSize: '0.88rem', color: '#6B7280' }}>Delivery Fee</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#087F5B' }}>
                FREE
              </Typography>
            </Box>

            <Divider sx={{ my: 0.5, borderColor: '#F3F4F6' }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#151515' }}>
                Total
              </Typography>
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#087F5B' }}>
                ₹{subtotal.toFixed(2)}
              </Typography>
            </Box>
          </Stack>

          {/* Primary CTA: Proceed to Checkout */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleProceedToCheckout}
            endIcon={<ArrowForwardIcon />}
            aria-label="Proceed to checkout"
            sx={{
              backgroundColor: '#087F5B',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1rem',
              py: 1.5,
              borderRadius: '14px',
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(8, 127, 91, 0.3)',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: '#075B43',
                boxShadow: '0 6px 20px rgba(8, 127, 91, 0.4)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Proceed to Checkout
          </Button>

          {/* Secondary CTA: Continue Shopping */}
          <Button
            fullWidth
            onClick={onClose}
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.9rem' }} />}
            aria-label="Continue shopping"
            sx={{
              mt: 1.2,
              color: '#6B7280',
              fontWeight: 700,
              fontSize: '0.88rem',
              textTransform: 'none',
              py: 0.8,
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#151515',
              },
            }}
          >
            Continue Shopping
          </Button>

          {/* Guarantee Badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.6,
              mt: 1.8,
              color: '#9CA3AF',
            }}
          >
            <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: '#087F5B' }} />
            <Typography sx={{ fontSize: '11.5px', color: '#6B7280', fontWeight: 600 }}>
              Safe & Contactless Local Delivery
            </Typography>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default CartDrawer;
