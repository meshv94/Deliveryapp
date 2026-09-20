import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';

const DashboardBanner = ({
  title = 'AapnuBazaar Local Marketplace Operations',
  subtitle = 'Real-time neighborhood store management, catalog administration, and live order coordination.',
  buttonText = 'Manage Operations',
  onAction,
}) => {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #087F5B 0%, #075B43 60%, #054734 100%)',
        color: '#FFFFFF',
        p: { xs: 2.5, sm: 3.5, md: 4 },
        mb: 3.5,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 28px rgba(8, 127, 91, 0.22)',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 0, 0.25) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ zIndex: 1, maxWidth: { xs: '100%', md: '68%' } }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.65rem' },
            lineHeight: 1.25,
            mb: 0.8,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          startIcon={<StorefrontIcon sx={{ fontSize: '1.1rem !important', color: '#087F5B' }} />}
          sx={{
            zIndex: 1,
            backgroundColor: '#FFFFFF',
            color: '#087F5B',
            fontWeight: 800,
            fontSize: '0.88rem',
            borderRadius: '50px',
            px: 3,
            py: 1.2,
            minHeight: 44,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: '#F8FAFC',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.16)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
};

export default DashboardBanner;
