import React from 'react';
import {
  Box,
  Container,
  Stack,
  Chip,
  Typography,
  Divider,
} from '@mui/material';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

/**
 * VendorMetaBar Component
 * Displays vendor charges and meta information in a horizontal scrollable bar
 *
 * @param {object} vendor - Vendor data object
 */
const VendorMetaBar = ({ vendor }) => {
  if (!vendor) {
    return null;
  }

  const metaItems = [];

  // Delivery Charge
  if (vendor.delivery_charge !== undefined && vendor.delivery_charge !== null) {
    metaItems.push({
      id: 'delivery',
      icon: <DeliveryDiningIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Delivery Charge',
      value: `$${vendor.delivery_charge.toFixed(2)}`,
      color: '#ff9800',
    });
  }

  // Packaging Charge
  if (vendor.packaging_charge !== undefined && vendor.packaging_charge !== null) {
    metaItems.push({
      id: 'packaging',
      icon: <LocalShippingIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Packaging Charge',
      value: `$${vendor.packaging_charge.toFixed(2)}`,
      color: '#2196f3',
    });
  }

  // Convenience Charge
  if (vendor.convenience_charge !== undefined && vendor.convenience_charge !== null) {
    metaItems.push({
      id: 'convenience',
      icon: <LocalOfferIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Convenience Charge',
      value: `$${vendor.convenience_charge.toFixed(2)}`,
      color: '#9c27b0',
    });
  }

  // Preparation Time
  if (vendor.preparation_time_minutes !== undefined && vendor.preparation_time_minutes !== null) {
    metaItems.push({
      id: 'prep',
      icon: <AccessTimeIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Est. Prep Time',
      value: `${vendor.preparation_time_minutes} min`,
      color: '#4caf50',
    });
  }

  // If no meta items, return empty
  if (metaItems.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e8e8e8',
        py: { xs: 1.5, sm: 2 },
        position: 'sticky',
        top: { xs: 56, sm: 64 },
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 0.5,
            scrollbarWidth: 'thin',
            scrollbarColor: '#ddd transparent',
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#ddd',
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: '#bbb',
              },
            },
          }}
        >
          {metaItems.map((item) => (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                backgroundColor: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: '16px',
                padding: { xs: '10px 14px', sm: '12px 16px' },
                minWidth: 'fit-content',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#fff',
                  borderColor: item.color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${item.color}20`,
                },
              }}
            >
              {/* Icon with background */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  borderRadius: '12px',
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}
              >
                {React.cloneElement(item.icon, {
                  sx: { fontSize: { xs: '1.2rem', sm: '1.35rem' } },
                })}
              </Box>

              {/* Text content */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#888',
                    display: 'block',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 500,
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                    mb: 0.25,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default VendorMetaBar;
