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
        minHeight: 300,
        maxHeight: 400,
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
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 200,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* NEW Badge */}
        {vendor.isNew && (
          <Badge
            badgeContent="NEW"
            sx={{
              position: 'absolute',
              top: 20,
              right: 40,
              zIndex: 2,
              '& .MuiBadge-badge': {
                backgroundColor: '#FF6B6B',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '0 8px 0 8px',
                padding: '8px 15px',
                minWidth: 'auto',
                height: 'auto',
              },
            }}
          />
        )}

        {/* Vendor Image */}
        <CardMedia
          component="img"
          image={vendor.vendor_image || FALLBACK_IMAGE}
          alt={vendor.name}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
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
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          gap: 1,
          minHeight: 0,
          overflow: 'hidden',
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
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {vendor.module.name}
            </Typography>
          )}
        </Box>

        {/* Rating */}
        {/* {vendor.rating !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating value={vendor.rating} readOnly size="small" />
            <Typography variant="caption" sx={{ color: '#999', fontWeight: 500 }}>
              {vendor.rating.toFixed(1)} ({vendor.reviewCount || 0})
            </Typography>
          </Box>
        )} */}

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
        {vendor.open_time && vendor.close_time && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#666' }}>
            <AccessTimeIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {formatTime(vendor.open_time)} – {formatTime(vendor.close_time)}
            </Typography>
          </Box>
        )}

        {/* Delivery Info */}
        {/* <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 'auto',
            flexWrap: 'wrap',
            gap: 0.75,
          }}
        >
          {vendor.delivery_charge !== undefined && (
            <Chip
              icon={<DeliveryDiningIcon sx={{ fontSize: '1rem !important' }} />}
              label={`$${vendor.delivery_charge.toFixed(2)}`}
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
        </Stack> */}
      </CardContent>
    </Card>
  );
};

export default VendorCard;
