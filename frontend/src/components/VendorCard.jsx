import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Stack,
  Chip,
  Badge,
  Rating,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// Fallback image
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e0e0e0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image Available%3C/text%3E%3C/svg%3E';

const VendorCard = ({ vendor }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/vendors/${vendor._id || vendor.id}`);
  };

  // Format time (assuming HH:mm format)
  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:mm
  };

  // Check if vendor is open (simple check - you can enhance this logic)
  const isOpen = vendor.isOpen !== false;

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2.5,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: '#fff',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    >
      {/* Image Container with Badge */}
      <Box sx={{ position: 'relative' }}>
        {/* NEW Badge */}
        {vendor.isNew && (
          <Badge
            badgeContent="NEW"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              left: 'auto',
              '& .MuiBadge-badge': {
                backgroundColor: '#FF6B6B',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '0 8px 0 8px',
                padding: '4px 8px',
                minWidth: 'auto',
                height: 'auto',
              },
            }}
          />
        )}

        {/* Vendor Image */}
        <CardMedia
          component="img"
          height="220"
          image={vendor.vendor_image || FALLBACK_IMAGE}
          alt={vendor.name}
          loading="lazy"
          sx={{
            objectFit: 'cover',
            backgroundColor: '#f5f5f5',
          }}
        />

        {/* Status Overlay */}
        {!isOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              Closed
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          gap: 1,
        }}
      >
        {/* Vendor Name and Category */}
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.3,
              color: '#1a1a1a',
              mb: 0.5,
            }}
          >
            {vendor.name}
          </Typography>

          {/* Category */}
          {vendor.module?.name && (
            <Typography
              variant="caption"
              sx={{
                color: '#666',
                fontWeight: 500,
                display: 'block',
              }}
            >
              {vendor.module.name}
            </Typography>
          )}
        </Box>

        {/* Rating */}
        {vendor.rating !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={vendor.rating} readOnly size="small" />
            <Typography variant="caption" sx={{ color: '#999', fontWeight: 500 }}>
              {vendor.rating.toFixed(1)} ({vendor.reviewCount || 0})
            </Typography>
          </Box>
        )}

        {/* Distance */}
        {vendor.distance_km !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666' }}>
            <LocationOnIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {vendor.distance_km} km away
            </Typography>
          </Box>
        )}

        {/* Open Time */}
        {vendor.openTime && vendor.closeTime && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666' }}>
            <AccessTimeIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {formatTime(vendor.openTime)} – {formatTime(vendor.closeTime)}
            </Typography>
          </Box>
        )}

        {/* Delivery Info */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 'auto',
            flexWrap: 'wrap',
            gap: 0.75,
          }}
        >
          {vendor.deliveryCharge !== undefined && (
            <Chip
              icon={<DeliveryDiningIcon sx={{ fontSize: '1rem !important' }} />}
              label={`$${vendor.deliveryCharge.toFixed(2)}`}
              size="small"
              variant="filled"
              sx={{
                backgroundColor: '#f5f5f5',
                color: '#333',
                fontWeight: 600,
                height: 28,
              }}
            />
          )}

          {vendor.deliveryTime && (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '1rem !important' }} />}
              label={`${vendor.deliveryTime} min`}
              size="small"
              variant="filled"
              sx={{
                backgroundColor: '#f5f5f5',
                color: '#333',
                fontWeight: 600,
                height: 28,
              }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default VendorCard;
