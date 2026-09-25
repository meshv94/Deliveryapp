import React from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Button,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  NotificationsOutlined as BellIcon,
  RestaurantRounded as KitchenIcon,
  LocalShippingOutlined as DeliveryIcon,
  CheckCircleOutlineRounded as DeliveredIcon,
  CancelOutlined as CancelIcon,
  ShoppingBagOutlined as OrderIcon,
  DeleteOutlineRounded as DeleteIcon,
  DoneAllRounded as DoneAllIcon,
  ArrowForwardRounded as ArrowForwardIcon,
  AccessTimeRounded as TimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BRAND = {
  primaryGreen: '#087F5B',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  orangeLight: '#FFF4E6',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  blue: '#1971C2',
  blueLight: '#E7F5FF',
  red: '#E03131',
  redLight: '#FFF5F5',
  textPrimary: '#17221D',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

// Relative time formatting
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Type to Icon + Color styling
const getNotificationTypeStyle = (type, status) => {
  const t = String(type || '').toLowerCase();
  const s = String(status || '').toLowerCase();

  if (t === 'order_preparing' || s === 'preparing' || s === 'processing') {
    return {
      icon: KitchenIcon,
      color: BRAND.amber,
      bg: BRAND.amberLight,
      tag: 'Cooking',
    };
  }
  if (t === 'order_out_for_delivery' || s === 'out for delivery' || s === 'ready') {
    return {
      icon: DeliveryIcon,
      color: BRAND.blue,
      bg: BRAND.blueLight,
      tag: 'On the Way',
    };
  }
  if (t === 'order_delivered' || s === 'delivered') {
    return {
      icon: DeliveredIcon,
      color: BRAND.primaryGreen,
      bg: BRAND.lightGreen,
      tag: 'Delivered',
    };
  }
  if (t === 'order_cancelled' || s === 'cancelled') {
    return {
      icon: CancelIcon,
      color: BRAND.red,
      bg: BRAND.redLight,
      tag: 'Cancelled',
    };
  }
  return {
    icon: OrderIcon,
    color: BRAND.orange,
    bg: BRAND.orangeLight,
    tag: 'Order Placed',
  };
};

export default function NotificationPopover({
  anchorEl,
  open,
  onClose,
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}) {
  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read && onMarkAsRead) {
      await onMarkAsRead(notif._id);
    }
    onClose();
    navigate('/my-orders');
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: { xs: 320, sm: 380 },
          maxHeight: 520,
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${BRAND.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${BRAND.border}`,
          bgcolor: '#FAFBFB',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '15px', color: BRAND.textPrimary }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} New`}
              size="small"
              sx={{
                height: 20,
                fontSize: '11px',
                fontWeight: 800,
                bgcolor: BRAND.orangeLight,
                color: BRAND.orange,
              }}
            />
          )}
        </Box>

        {unreadCount > 0 && (
          <Button
            size="small"
            startIcon={<DoneAllIcon sx={{ fontSize: '16px !important' }} />}
            onClick={onMarkAllAsRead}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '11.5px',
              color: BRAND.primaryGreen,
              p: 0.5,
              minWidth: 0,
              '&:hover': { bgcolor: 'transparent', color: BRAND.primaryGreen },
            }}
          >
            Mark all read
          </Button>
        )}
      </Box>

      {/* Notifications List Body */}
      <Box sx={{ overflowY: 'auto', flexGrow: 1, maxHeight: 380 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={26} sx={{ color: BRAND.primaryGreen }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: BRAND.lightGreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <BellIcon sx={{ color: BRAND.primaryGreen, fontSize: 26 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '14px', color: BRAND.textPrimary, mb: 0.5 }}>
              All Caught Up!
            </Typography>
            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
              You have no new notifications. Order updates will appear here in real time.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider sx={{ borderColor: '#F3F4F6' }} />}>
            {notifications.map((notif) => {
              const style = getNotificationTypeStyle(notif.type, notif.status);
              const IconComp = style.icon;

              return (
                <Box
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    p: 1.8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    bgcolor: notif.is_read ? BRAND.white : '#F6FBF9',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    '&:hover': {
                      bgcolor: '#F0F9F5',
                    },
                  }}
                >
                  {/* Unread indicator bar */}
                  {!notif.is_read && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3.5,
                        bgcolor: BRAND.primaryGreen,
                      }}
                    />
                  )}

                  {/* Icon Avatar */}
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: style.bg,
                      color: style.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.3,
                    }}
                  >
                    <IconComp sx={{ fontSize: 20 }} />
                  </Box>

                  {/* Content */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: notif.is_read ? 700 : 800,
                          color: BRAND.textPrimary,
                          lineHeight: 1.2,
                        }}
                      >
                        {notif.title}
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, flexShrink: 0, ml: 1 }}>
                        {timeAgo(notif.createdAt)}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: BRAND.textSecondary,
                        lineHeight: 1.35,
                        mb: 1,
                      }}
                    >
                      {notif.message}
                    </Typography>

                    {/* Footer Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={style.tag}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '10.5px',
                          fontWeight: 700,
                          bgcolor: style.bg,
                          color: style.color,
                        }}
                      />

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title="Delete notification">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteNotification) onDeleteNotification(notif._id);
                            }}
                            sx={{
                              p: 0.4,
                              color: '#9CA3AF',
                              '&:hover': { color: BRAND.red },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Button
                          size="small"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: '13px !important' }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notif);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: BRAND.primaryGreen,
                            p: 0,
                            minWidth: 0,
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Footer view all orders */}
      <Box
        sx={{
          p: 1.2,
          textAlign: 'center',
          borderTop: `1px solid ${BRAND.border}`,
          bgcolor: '#FAFBFB',
        }}
      >
        <Button
          fullWidth
          size="small"
          onClick={() => {
            onClose();
            navigate('/my-orders');
          }}
          sx={{
            textTransform: 'none',
            fontSize: '12px',
            fontWeight: 700,
            color: BRAND.primaryGreen,
            py: 0.5,
          }}
        >
          View All Orders & Live Status &rarr;
        </Button>
      </Box>
    </Menu>
  );
}
