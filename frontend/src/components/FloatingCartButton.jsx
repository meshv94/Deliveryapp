import React from 'react';
import { Box, Button, Badge, Fab } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';

/**
 * Floating Cart Button Component
 * Displays a sticky button at the bottom with cart count and directs to checkout
 */
const FloatingCartButton = () => {
  const navigate = useNavigate();
  const { getCartTotals } = useCartContext();
  const { totalItems } = getCartTotals();

  if (totalItems === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 999,
      }}
    >
      <Fab
        onClick={() => navigate('/cart')}
        sx={{
          backgroundColor: '#087F5B',
          color: '#fff',
          width: 68,
          height: 68,
          boxShadow: '0 8px 24px rgba(8, 127, 91, 0.45)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: '#075B43',
            transform: 'scale(1.08)',
            boxShadow: '0 12px 32px rgba(8, 127, 91, 0.6)',
          },
        }}
      >
        <Badge
          badgeContent={totalItems}
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#FF6B00',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            },
          }}
        >
          <ShoppingCartIcon sx={{ fontSize: 32, color: '#fff' }} />
        </Badge>
      </Fab>
    </Box>
  );
};

export default FloatingCartButton;
