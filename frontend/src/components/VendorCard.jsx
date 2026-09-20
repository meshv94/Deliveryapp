import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Stack,
  Chip,
  Rating,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import VerifiedIcon from '@mui/icons-material/Verified';

// Fallback image
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FAFAF7" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%236B7280" text-anchor="middle" dy=".3em"%3EAapnuBazaar Store%3C/text%3E%3C/svg%3E';

const VendorCard = ({ vendor }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/vendors/${vendor._id || vendor.id}`);
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const isOpen = vendor.isOpen !== false && vendor.status !== 0;

  return (
    <Card
      onClick={handleClick}
      elevation={0}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.08)',
          borderColor: '#087F5B',
          '& .vendor-name': {
            color: '#087F5B',
          },
        },
      }}
    >
      {/* Thumbnail Container with Badges */}
      <Box sx={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
        <CardMedia
          component="img"
          image={vendor.vendor_image || FALLBACK_IMAGE}
          alt={vendor.name}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'scale(1.04)' },
          }}
          onError={(e) => {
            e.target.src = FALLBACK_IMAGE;
          }}
        />

        {/* Top Badges */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {/* Status Badge */}
          <Chip
            size="small"
            label={isOpen ? 'Open Now' : 'Closed'}
            sx={{
              backgroundColor: isOpen ? '#EBFBEE' : 'rgba(255, 255, 255, 0.95)',
              color: isOpen ? '#087F5B' : '#6B7280',
              fontWeight: 700,
              fontSize: '11px',
              border: isOpen ? '1px solid #B2F2BB' : '1px solid #E5E7EB',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Module / Category Tag */}
          {vendor.module?.name && (
            <Chip
              size="small"
              label={vendor.module.name}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#151515',
                fontWeight: 600,
                fontSize: '11px',
                border: '1px solid #E5E7EB',
                backdropFilter: 'blur(4px)',
              }}
            />
          )}
        </Box>

        {/* Closed Overlay */}
        {!isOpen && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#FFFFFF', fontWeight: 700, fontSize: '14px', px: 2, py: 0.5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '6px' }}>
              Currently Closed
            </Typography>
          </Box>
        )}
      </Box>

      {/* Card Content */}
      <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title and Verified */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Typography
            className="vendor-name"
            sx={{
              fontWeight: 700,
              fontSize: '17px',
              color: '#151515',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s ease',
            }}
          >
            {vendor.name}
          </Typography>
          <VerifiedIcon sx={{ fontSize: '16px', color: '#087F5B', flexShrink: 0 }} />
        </Box>

        {/* Address snippet */}
        {vendor.address && (
          <Typography
            sx={{
              fontSize: '12.5px',
              color: '#6B7280',
              mb: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {vendor.address}
          </Typography>
        )}

        {/* Store Key Info Row */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            pt: 1,
            mt: 'auto',
            borderTop: '1px solid #F3F4F6',
            fontSize: '12.5px',
            color: '#6B7280',
          }}
        >
          {/* Prep time */}
          {vendor.preparation_time_minute ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <AccessTimeIcon sx={{ fontSize: '15px', color: '#087F5B' }} />
              <span>{vendor.preparation_time_minute} min</span>
            </Box>
          ) : null}

          {/* Distance */}
          {vendor.distance_km !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LocationOnIcon sx={{ fontSize: '15px', color: '#FF6B00' }} />
              <span>{vendor.distance_km} km</span>
            </Box>
          )}

          {/* Delivery charge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, ml: 'auto' }}>
            <DeliveryDiningIcon sx={{ fontSize: '16px', color: '#087F5B' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#151515' }}>
              {vendor.delivery_charge && vendor.delivery_charge > 0
                ? `₹${vendor.delivery_charge}`
                : 'Free Delivery'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VendorCard;
