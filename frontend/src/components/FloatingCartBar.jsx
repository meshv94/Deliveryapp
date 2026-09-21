import React from 'react';
import {
  Box,
  Typography,
  Button,
  Slide,
  Fade,
} from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * FloatingCartBar Component
 * Responsive sticky/floating cart bar displayed at the bottom of the viewport
 * when the cart has at least 1 item.
 */
const FloatingCartBar = ({
  totalItems = 0,
  subtotal = 0,
  onViewCart,
  vendorName = '',
}) => {
  if (totalItems === 0) {
    return null;
  }

  return (
    <Slide direction="up" in={totalItems > 0} mountOnEnter unmountOnExit timeout={250}>
      <Box
        sx={{
          position: 'fixed',
          zIndex: 1100,
          // Responsive positioning: above mobile bottom navigation on xs
          bottom: {
            xs: 'calc(70px + env(safe-area-inset-bottom, 0px))',
            sm: 24,
            md: 24,
          },
          right: {
            xs: 16,
            sm: 'auto',
            md: 32,
          },
          left: {
            xs: 16,
            sm: '50%',
            md: 'auto',
          },
          transform: {
            xs: 'none',
            sm: 'translateX(-50%)',
            md: 'none',
          },
          width: {
            xs: 'calc(100% - 32px)',
            sm: 400,
            md: 380,
          },
          maxWidth: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#087F5B',
            color: '#FFFFFF',
            borderRadius: '16px',
            p: { xs: 1.5, sm: 1.6 },
            pl: { xs: 2, sm: 2.2 },
            boxShadow: '0 10px 30px rgba(8, 127, 91, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 14px 36px rgba(8, 127, 91, 0.55)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          {/* Left Info: Cart Icon + Items Count + Price */}
          <Box
            onClick={onViewCart}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Cart Icon in Circle Badge */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: 22, color: '#FFFFFF' }} />
            </Box>

            {/* Total items & Subtotal */}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.92rem', sm: '0.98rem' },
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontWeight: 600,
                  }}
                >
                  •
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.98rem', sm: '1.05rem' },
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  ₹{subtotal.toFixed(0)}
                </Typography>
              </Box>

              {vendorName ? (
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mt: 0.2,
                  }}
                >
                  From {vendorName}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.2,
                  }}
                >
                  Delivery FREE included
                </Typography>
              )}
            </Box>
          </Box>

          {/* Right CTA Button */}
          <Button
            variant="contained"
            onClick={onViewCart}
            endIcon={<ArrowForwardIcon sx={{ fontSize: '1.05rem !important' }} />}
            aria-label="View Cart and Open Drawer"
            sx={{
              backgroundColor: '#FFFFFF',
              color: '#087F5B',
              fontWeight: 800,
              fontSize: { xs: '0.82rem', sm: '0.88rem' },
              px: { xs: 1.8, sm: 2.2 },
              py: 0.9,
              borderRadius: '10px',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              ml: 1.5,
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#075B43',
                transform: 'scale(1.02)',
              },
            }}
          >
            View Cart
          </Button>
        </Box>
      </Box>
    </Slide>
  );
};

export default FloatingCartBar;
