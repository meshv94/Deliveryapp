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
  if (vendor.deliveryCharge !== undefined && vendor.deliveryCharge !== null) {
    metaItems.push({
      id: 'delivery',
      icon: <DeliveryDiningIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Delivery Charge',
      value: `$${vendor.deliveryCharge.toFixed(2)}`,
      color: '#ff9800',
    });
  }

  // Packaging Charge
  if (vendor.packagingCharge !== undefined && vendor.packagingCharge !== null) {
    metaItems.push({
      id: 'packaging',
      icon: <LocalShippingIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Packaging Charge',
      value: `$${vendor.packagingCharge.toFixed(2)}`,
      color: '#2196f3',
    });
  }

  // Convenience Charge
  if (vendor.convenienceCharge !== undefined && vendor.convenienceCharge !== null) {
    metaItems.push({
      id: 'convenience',
      icon: <LocalOfferIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Convenience Charge',
      value: `$${vendor.convenienceCharge.toFixed(2)}`,
      color: '#9c27b0',
    });
  }

  // Preparation Time
  if (vendor.preparationTime) {
    metaItems.push({
      id: 'prep',
      icon: <AccessTimeIcon sx={{ fontSize: '1.1rem' }} />,
      label: 'Est. Prep Time',
      value: `${vendor.preparationTime} min`,
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
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #e0e0e0',
        py: 1.5,
        position: 'sticky',
        top: 64, // Adjust based on your AppBar height
        zIndex: 50,
        overflow: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#ddd',
              borderRadius: '2px',
            },
          }}
        >
          {metaItems.map((item, index) => (
            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Chip */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  backgroundColor: '#fff',
                  border: `1px solid #e0e0e0`,
                  borderRadius: '20px',
                  padding: '8px 12px',
                  minWidth: 'fit-content',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    borderColor: item.color,
                  },
                }}
              >
                <Box sx={{ color: item.color, display: 'flex' }}>
                  {item.icon}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#999',
                      display: 'block',
                      fontSize: '0.7rem',
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#1a1a1a',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Box>

              {/* Divider between items (except last) */}
              {index < metaItems.length - 1 && (
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 30,
                    opacity: 0.2,
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default VendorMetaBar;
