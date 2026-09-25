import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Alert,
  Fade,
  Chip,
  IconButton,
  Divider,
  Avatar,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Drawer,
  useTheme,
  useMediaQuery,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import LiveRiderTrackingModal from '../components/LiveRiderTrackingModal';

// AapnuBazaar Brand Design Tokens
const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  orangeLight: '#FFF4E6',
  bgPage: '#F7F9F8',
  white: '#FFFFFF',
  textPrimary: '#17221D',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  red: '#E03131',
  redLight: '#FFF5F5',
  blue: '#1971C2',
  blueLight: '#E7F5FF',
};

// SVG Fallback for store/product images
const FALLBACK_IMG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23F7F9F8" width="100" height="100"/%3E%3Ccircle cx="50" cy="50" r="24" fill="%23EAF7F2"/%3E%3Cpath d="M42 42h16v16h-16z" stroke="%23087F5B" stroke-width="2" fill="none"/%3E%3C/svg%3E';

/**
 * Helper to get status colors
 */
const getStatusBadgeStyle = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') {
    return { bg: BRAND.lightGreen, color: BRAND.primaryGreen, label: 'Delivered' };
  }
  if (s === 'placed' || s === 'confirmed') {
    return { bg: BRAND.lightGreen, color: BRAND.primaryGreen, label: status || 'Placed' };
  }
  if (s === 'processing' || s === 'preparing') {
    return { bg: BRAND.blueLight, color: BRAND.blue, label: status || 'Preparing' };
  }
  if (s === 'out for delivery' || s === 'shipped') {
    return { bg: BRAND.orangeLight, color: BRAND.orange, label: 'Out for Delivery' };
  }
  if (s === 'cancelled' || s === 'rejected') {
    return { bg: BRAND.redLight, color: BRAND.red, label: 'Cancelled' };
  }
  return { bg: '#F3F4F6', color: BRAND.textSecondary, label: status || 'Order Placed' };
};

/**
 * Format Date helper
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Format Date Time helper
 */
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [copiedSnackbar, setCopiedSnackbar] = useState(false);
  const [riderTrackingOrder, setRiderTrackingOrder] = useState(null);

  // Fetch customer orders with silent background updates
  const fetchOrders = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
        setError(null);
      }

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get('/app/my-orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.success) {
        const orderList = Array.isArray(response.data) ? response.data : [];
        setOrders(orderList);

        // Keep selectedOrder in sync if modal is open
        setSelectedOrder((prev) => {
          if (!prev) return null;
          const fresh = orderList.find((o) => o._id === prev._id);
          return fresh || prev;
        });
      } else {
        if (!isBackground) setError(response?.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (!isBackground) setError(err.response?.data?.message || 'Failed to load orders. Please try again.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [navigate]);

  // Initial fetch + 10s auto polling
  useEffect(() => {
    fetchOrders(false);

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => setSelectedOrder(null), 200);
  };

  const handleCopyOrderId = (id, e) => {
    e.stopPropagation();
    if (id) {
      navigator.clipboard.writeText(id);
      setCopiedSnackbar(true);
    }
  };

  // Status Filter Tabs
  const filterTabs = ['All', 'Placed', 'Processing', 'Delivered', 'Cancelled'];

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (selectedFilter === 'All') return orders;

    return orders.filter((order) => {
      const s = (order.status || '').toLowerCase();
      if (selectedFilter === 'Placed') return s === 'placed' || s === 'confirmed';
      if (selectedFilter === 'Processing') return s === 'processing' || s === 'preparing' || s === 'out for delivery';
      if (selectedFilter === 'Delivered') return s === 'delivered';
      if (selectedFilter === 'Cancelled') return s === 'cancelled' || s === 'rejected';
      return true;
    });
  }, [orders, selectedFilter]);

  return (
    <Box
      sx={{
        backgroundColor: BRAND.bgPage,
        minHeight: '100vh',
        pb: { xs: 12, md: 8 },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN PAGE HEADER
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: BRAND.white,
          borderBottom: `1px solid ${BRAND.border}`,
          py: { xs: 2.5, sm: 3.5 },
          mb: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            maxWidth: '1280px !important',
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <IconButton
              onClick={() => navigate('/')}
              aria-label="Back to home"
              sx={{
                backgroundColor: BRAND.bgPage,
                border: `1px solid ${BRAND.border}`,
                width: { xs: 38, sm: 42 },
                height: { xs: 38, sm: 42 },
                color: BRAND.primaryGreen,
                '&:hover': {
                  backgroundColor: BRAND.lightGreen,
                  borderColor: BRAND.primaryGreen,
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '22px', sm: '26px', md: '30px' },
                  color: BRAND.textPrimary,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                My Orders
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '13px', sm: '14.5px' },
                  color: BRAND.textSecondary,
                  mt: 0.3,
                }}
              >
                Track and manage all your purchases from local neighborhood stores
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1280px !important',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Error Alert */}
        {error && (
          <Fade in>
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: '12px', border: `1px solid ${BRAND.redLight}` }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* ─────────────────────────────────────────────────────────────
            2. ORDER STATUS FILTERS & COUNTER
        ───────────────────────────────────────────────────────────── */}
        {!loading && orders.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 1.5,
              mb: 3,
            }}
          >
            {/* Filter Tabs (Horizontal Scrollable on Mobile) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                overflowX: 'auto',
                width: { xs: '100%', sm: 'auto' },
                pb: { xs: 0.5, sm: 0 },
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {filterTabs.map((tab) => {
                const isSelected = selectedFilter === tab;
                return (
                  <Button
                    key={tab}
                    onClick={() => setSelectedFilter(tab)}
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '12.5px', sm: '13px' },
                      px: { xs: 1.8, sm: 2.2 },
                      py: 0.6,
                      height: 36,
                      borderRadius: '10px',
                      backgroundColor: isSelected ? BRAND.primaryGreen : BRAND.white,
                      color: isSelected ? BRAND.white : BRAND.textPrimary,
                      border: isSelected ? `1px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
                      textTransform: 'none',
                      flexShrink: 0,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? BRAND.darkGreen : BRAND.bgPage,
                      },
                    }}
                  >
                    {tab}
                  </Button>
                );
              })}
            </Box>

            {/* Orders Count */}
            <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: BRAND.textSecondary }}>
              Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </Typography>
          </Box>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. ORDERS LISTING / SKELETON / EMPTY / ERROR STATES
        ───────────────────────────────────────────────────────────── */}
        {loading ? (
          /* Skeletons matching exact order card structure */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  p: { xs: 2, sm: 2.5 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Skeleton variant="rounded" width={50} height={50} sx={{ borderRadius: '12px' }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={22} />
                    <Skeleton variant="text" width="40%" height={18} />
                  </Box>
                  <Skeleton variant="rounded" width={70} height={26} sx={{ borderRadius: '999px' }} />
                </Box>
                <Skeleton variant="rectangular" height={1} sx={{ my: 1.5 }} />
                <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={44} sx={{ borderRadius: '10px', mb: 1.5 }} />
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: '10px' }} />
              </Card>
            ))}
          </Box>
        ) : orders.length === 0 ? (
          /* Empty State: No Orders Yet */
          <Fade in timeout={500}>
            <Box
              sx={{
                textAlign: 'center',
                py: { xs: 6, sm: 8 },
                px: 3,
                borderRadius: '20px',
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                maxWidth: 560,
                mx: 'auto',
                my: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <Box
                sx={{
                  width: { xs: 80, sm: 96 },
                  height: { xs: 80, sm: 96 },
                  borderRadius: '50%',
                  backgroundColor: BRAND.lightGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                }}
              >
                <ShoppingBagOutlinedIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: BRAND.primaryGreen }} />
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '20px', sm: '24px' },
                  color: BRAND.textPrimary,
                  mb: 1,
                }}
              >
                No Orders Yet
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: BRAND.textSecondary,
                  maxWidth: 380,
                  mx: 'auto',
                  mb: 3.5,
                  lineHeight: 1.5,
                }}
              >
                Your local shopping journey starts here. Explore nearby neighborhood shops and place your first order.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/vendors')}
                sx={{
                  backgroundColor: BRAND.primaryGreen,
                  color: BRAND.white,
                  fontWeight: 700,
                  px: 4,
                  py: 1.2,
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                  '&:hover': {
                    backgroundColor: BRAND.darkGreen,
                  },
                }}
              >
                Explore Shops →
              </Button>
            </Box>
          </Fade>
        ) : filteredOrders.length === 0 ? (
          /* Empty filter result */
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              px: 3,
              borderRadius: '16px',
              backgroundColor: BRAND.white,
              border: `1px dashed ${BRAND.border}`,
              maxWidth: 480,
              mx: 'auto',
              my: 4,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '16px', color: BRAND.textPrimary, mb: 0.5 }}>
              No {selectedFilter} Orders
            </Typography>
            <Typography sx={{ fontSize: '13.5px', color: BRAND.textSecondary, mb: 2 }}>
              There are no orders matching the "{selectedFilter}" status.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSelectedFilter('All')}
              sx={{
                borderColor: BRAND.primaryGreen,
                color: BRAND.primaryGreen,
                fontWeight: 700,
                borderRadius: '10px',
                textTransform: 'none',
                '&:hover': {
                  borderColor: BRAND.darkGreen,
                  backgroundColor: BRAND.lightGreen,
                },
              }}
            >
              View All Orders
            </Button>
          </Box>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              4. RESPONSIVE CSS GRID FOR ORDER CARDS
          ───────────────────────────────────────────────────────────── */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
              width: '100%',
            }}
          >
            {filteredOrders.map((order) => {
              const statusStyle = getStatusBadgeStyle(order.status);
              const vendorName = order.vendor?.name || 'Local Store';
              const vendorImg = order.vendor?.vendor_image || FALLBACK_IMG;
              const vendorCat = order.vendor?.module?.name || 'Store';
              const itemsList = Array.isArray(order.items) ? order.items : [];
              const previewItems = itemsList.slice(0, 2);
              const remainingCount = itemsList.length - 2;

              return (
                <Card
                  key={order._id}
                  onClick={() => handleOrderClick(order)}
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: '16px',
                    border: `1px solid ${BRAND.border}`,
                    backgroundColor: BRAND.white,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 10px 24px rgba(8, 127, 91, 0.08)',
                      borderColor: BRAND.primaryGreen,
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      flexGrow: 1,
                      '&:last-child': { pb: { xs: 2, sm: 2.5 } },
                    }}
                  >
                    {/* Top: Vendor Info & Status Badge */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                        <Avatar
                          src={vendorImg}
                          alt={vendorName}
                          sx={{
                            width: 46,
                            height: 46,
                            borderRadius: '12px',
                            backgroundColor: BRAND.lightGreen,
                            color: BRAND.primaryGreen,
                            border: `1px solid ${BRAND.border}`,
                            flexShrink: 0,
                          }}
                        >
                          <StorefrontIcon sx={{ fontSize: 24 }} />
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: '15px', sm: '16px' },
                              color: BRAND.textPrimary,
                              lineHeight: 1.3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {vendorName}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '12px',
                              color: BRAND.textSecondary,
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {vendorCat} • {order.total_quantity || itemsList.length} {order.total_quantity === 1 ? 'item' : 'items'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status Badge */}
                      <Chip
                        label={statusStyle.label}
                        size="small"
                        sx={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          fontWeight: 700,
                          fontSize: '11px',
                          height: 24,
                          borderRadius: '999px',
                          flexShrink: 0,
                        }}
                      />
                    </Box>

                    <Divider sx={{ my: 1.2, borderColor: '#F3F4F6' }} />

                    {/* Order Metadata Row (ID, Date) */}
                    <Box sx={{ mb: 1.5 }}>
                      {/* Order ID */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontSize: '11.5px', color: BRAND.textSecondary, fontWeight: 500 }}>
                            Order ID:
                          </Typography>
                          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.textPrimary, fontFamily: 'monospace' }}>
                            #{order._id?.slice(-8).toUpperCase() || 'N/A'}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          aria-label="Copy order ID"
                          onClick={(e) => handleCopyOrderId(order._id, e)}
                          sx={{ p: 0.3, color: BRAND.textSecondary, '&:hover': { color: BRAND.primaryGreen } }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>

                      {/* Placed Date */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <CalendarTodayIcon sx={{ fontSize: 13, color: BRAND.textSecondary }} />
                        <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                          Placed on: <strong style={{ color: BRAND.textPrimary }}>{formatDate(order.createdAt)}</strong>
                        </Typography>
                      </Box>

                      {/* Delivery Date if available */}
                      {order.delivery_date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4 }}>
                          <AccessTimeIcon sx={{ fontSize: 13, color: BRAND.textSecondary }} />
                          <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                            Delivery: <strong style={{ color: BRAND.textPrimary }}>{formatDate(order.delivery_date)}</strong>
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Product Preview Items */}
                    {itemsList.length > 0 && (
                      <Box sx={{ mb: 1.5, p: 1, backgroundColor: BRAND.bgPage, borderRadius: '10px' }}>
                        <Stack spacing={0.8}>
                          {previewItems.map((item, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: '12.5px',
                                  fontWeight: 600,
                                  color: BRAND.textPrimary,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  flex: 1,
                                }}
                              >
                                {item.name || item.product?.name || 'Item'}
                              </Typography>
                              <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, fontWeight: 600, flexShrink: 0 }}>
                                ₹{item.special_price || item.main_price || item.price || 0} × {item.quantity}
                              </Typography>
                            </Box>
                          ))}
                          {remainingCount > 0 && (
                            <Typography sx={{ fontSize: '11px', color: BRAND.primaryGreen, fontWeight: 700 }}>
                              +{remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    )}

                    {/* Total Amount Box */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.4,
                        borderRadius: '10px',
                        backgroundColor: BRAND.lightGreen,
                        border: `1px solid rgba(8, 127, 91, 0.18)`,
                        mt: 'auto',
                        mb: 1.5,
                      }}
                    >
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: BRAND.textPrimary }}>
                        Total Amount
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '17px',
                          fontWeight: 800,
                          color: BRAND.primaryGreen,
                        }}
                      >
                        ₹{(order.total_payable_amount || order.subtotal || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      {['placed', 'preparing', 'processing', 'confirmed', 'ready', 'out for delivery'].includes(
                        String(order.status || '').toLowerCase()
                      ) && (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRiderTrackingOrder(order);
                          }}
                          startIcon={<TwoWheelerIcon sx={{ fontSize: '16px !important' }} />}
                          sx={{
                            background: 'linear-gradient(135deg, #087F5B 0%, #075B43 100%)',
                            color: BRAND.white,
                            borderRadius: '10px',
                            height: 38,
                            fontWeight: 700,
                            fontSize: '12px',
                            textTransform: 'none',
                            boxShadow: '0 3px 10px rgba(8, 127, 91, 0.2)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #075B43 0%, #054231 100%)',
                            },
                          }}
                        >
                          Live Track
                        </Button>
                      )}

                      <Button
                        fullWidth
                        variant={
                          ['placed', 'preparing', 'processing', 'confirmed', 'ready', 'out for delivery'].includes(
                            String(order.status || '').toLowerCase()
                          )
                            ? 'outlined'
                            : 'contained'
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}
                        sx={{
                          backgroundColor: ['placed', 'preparing', 'processing', 'confirmed', 'ready', 'out for delivery'].includes(
                            String(order.status || '').toLowerCase()
                          )
                            ? 'transparent'
                            : BRAND.primaryGreen,
                          color: ['placed', 'preparing', 'processing', 'confirmed', 'ready', 'out for delivery'].includes(
                            String(order.status || '').toLowerCase()
                          )
                            ? BRAND.primaryGreen
                            : BRAND.white,
                          borderColor: BRAND.primaryGreen,
                          borderRadius: '10px',
                          height: 38,
                          fontWeight: 700,
                          fontSize: '12.5px',
                          textTransform: 'none',
                          boxShadow: 'none',
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            backgroundColor: ['placed', 'preparing', 'processing', 'confirmed', 'ready', 'out for delivery'].includes(
                              String(order.status || '').toLowerCase()
                            )
                              ? BRAND.lightGreen
                              : BRAND.darkGreen,
                            borderColor: BRAND.darkGreen,
                          },
                        }}
                      >
                        Details &rarr;
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          5. REDESIGNED ORDER DETAILS MODAL (Desktop Dialog / Mobile Bottom-Sheet)
      ───────────────────────────────────────────────────────────── */}
      {isMobile ? (
        /* Mobile Bottom Sheet Drawer */
        <Drawer
          anchor="bottom"
          open={detailsOpen}
          onClose={handleCloseDetails}
          PaperProps={{
            sx: {
              maxHeight: '90vh',
              height: 'auto',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              backgroundColor: BRAND.white,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {/* Drag Pill Indicator */}
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
            <Box sx={{ width: 44, height: 4, borderRadius: '10px', backgroundColor: '#E5E7EB' }} />
          </Box>
          <OrderDetailsContent
            selectedOrder={selectedOrder}
            onClose={handleCloseDetails}
            onCopyId={handleCopyOrderId}
            onOpenRiderTrack={(order) => {
              handleCloseDetails();
              setRiderTrackingOrder(order);
            }}
          />
        </Drawer>
      ) : (
        /* Desktop Centered Modal */
        <Dialog
          open={detailsOpen}
          onClose={handleCloseDetails}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              maxHeight: '88vh',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
            },
          }}
        >
          <OrderDetailsContent
            selectedOrder={selectedOrder}
            onClose={handleCloseDetails}
            onCopyId={handleCopyOrderId}
            onOpenRiderTrack={(order) => {
              handleCloseDetails();
              setRiderTrackingOrder(order);
            }}
          />
        </Dialog>
      )}

      {/* Live Rider Tracking & Delivery Chat Modal */}
      {Boolean(riderTrackingOrder) && (
        <LiveRiderTrackingModal
          open={Boolean(riderTrackingOrder)}
          onClose={() => setRiderTrackingOrder(null)}
          order={riderTrackingOrder}
        />
      )}

      {/* Copied ID Snackbar */}
      <Snackbar
        open={copiedSnackbar}
        autoHideDuration={2000}
        onClose={() => setCopiedSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: '10px', fontWeight: 600 }}>
          Order ID copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

/**
 * ─────────────────────────────────────────────────────────────
 * SUBCOMPONENT: OrderDetailsContent
 * ─────────────────────────────────────────────────────────────
 */
const OrderDetailsContent = ({ selectedOrder, onClose, onCopyId, onOpenRiderTrack }) => {
  if (!selectedOrder) return null;

  const statusStyle = getStatusBadgeStyle(selectedOrder.status);
  const vendorName = selectedOrder.vendor?.name || 'Local Store';
  const vendorImg = selectedOrder.vendor?.vendor_image || FALLBACK_IMG;
  const itemsList = Array.isArray(selectedOrder.items) ? selectedOrder.items : [];

  // Determine Timeline Progress
  const s = (selectedOrder.status || '').toLowerCase();
  const isCancelled = s === 'cancelled' || s === 'rejected';
  const isPlaced = true;
  const isConfirmed = s === 'confirmed' || s === 'processing' || s === 'preparing' || s === 'out for delivery' || s === 'delivered';
  const isOutForDelivery = s === 'out for delivery' || s === 'delivered';
  const isDelivered = s === 'delivered';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 1. STICKY MODAL HEADER */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: `1px solid ${BRAND.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: BRAND.white,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '17px', sm: '19px' }, color: BRAND.textPrimary }}>
              Order Details
            </Typography>
            <Chip
              label={statusStyle.label}
              size="small"
              sx={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
                fontWeight: 700,
                fontSize: '11px',
                height: 22,
                borderRadius: '999px',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, fontFamily: 'monospace' }}>
              #{selectedOrder._id}
            </Typography>
            <IconButton size="small" aria-label="Copy order ID" onClick={(e) => onCopyId(selectedOrder._id, e)} sx={{ p: 0.2 }}>
              <ContentCopyIcon sx={{ fontSize: 13, color: BRAND.textSecondary }} />
            </IconButton>
          </Box>
        </Box>

        <IconButton aria-label="Close order details" onClick={onClose} sx={{ color: BRAND.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <Box sx={{ overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.5}>
          {/* LIVE TRACKING BANNER FOR ACTIVE ORDERS */}
          {!isCancelled && !isDelivered && (
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #087F5B 0%, #055C41 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(8, 127, 91, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ zIndex: 1, pr: 1.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <TwoWheelerIcon sx={{ fontSize: 20, color: '#FFD43B' }} />
                  Live Rider Tracking
                </Typography>
                <Typography sx={{ fontSize: '12px', opacity: 0.9, mt: 0.3 }}>
                  Track your delivery partner on live map and chat directly
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => onOpenRiderTrack && onOpenRiderTrack(selectedOrder)}
                sx={{
                  backgroundColor: '#ffffff',
                  color: BRAND.primaryGreen,
                  fontWeight: 800,
                  fontSize: '12.5px',
                  borderRadius: '10px',
                  px: 2,
                  py: 0.9,
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    backgroundColor: '#F0FDF4',
                  },
                }}
              >
                Track Live
              </Button>
            </Box>
          )}
          {/* A. VENDOR INFORMATION CARD */}
          <Box
            sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: BRAND.bgPage,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Typography sx={{ fontSize: '11.5px', fontWeight: 800, color: BRAND.primaryGreen, textTransform: 'uppercase', mb: 1.2, letterSpacing: '0.05em' }}>
              Vendor Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar
                src={vendorImg}
                alt={vendorName}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  backgroundColor: BRAND.lightGreen,
                  color: BRAND.primaryGreen,
                  border: `1px solid ${BRAND.border}`,
                }}
              >
                <StorefrontIcon />
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: BRAND.textPrimary }}>
                  {vendorName}
                </Typography>
                {selectedOrder.vendor?.module?.name && (
                  <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                    {selectedOrder.vendor.module.name}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Vendor Contact details if present */}
            <Stack spacing={0.6} sx={{ mt: 1, pt: 1, borderTop: `1px solid ${BRAND.border}` }}>
              {selectedOrder.vendor?.mobile_number && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 15, color: BRAND.primaryGreen }} />
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.textPrimary }}>
                    {selectedOrder.vendor.mobile_number}
                  </Typography>
                </Box>
              )}
              {selectedOrder.vendor?.address && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 15, color: BRAND.primaryGreen, mt: 0.2 }} />
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.textSecondary }}>
                    {selectedOrder.vendor.address}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* B. DELIVERY ADDRESS CARD */}
          {selectedOrder.address && (
            <Box
              sx={{
                p: 2,
                borderRadius: '14px',
                backgroundColor: BRAND.bgPage,
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <Typography sx={{ fontSize: '11.5px', fontWeight: 800, color: BRAND.primaryGreen, textTransform: 'uppercase', mb: 1, letterSpacing: '0.05em' }}>
                Delivery Address
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2 }}>
                <LocationOnIcon sx={{ fontSize: 20, color: BRAND.primaryGreen, mt: 0.2 }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '14px', color: BRAND.textPrimary, mb: 0.3 }}>
                    {selectedOrder.address.name || 'Customer'}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary, lineHeight: 1.4 }}>
                    {selectedOrder.address.address}
                  </Typography>
                  {(selectedOrder.address.city || selectedOrder.address.pincode) && (
                    <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>
                      {selectedOrder.address.city}
                      {selectedOrder.address.pincode ? ` - ${selectedOrder.address.pincode}` : ''}
                    </Typography>
                  )}
                  {selectedOrder.address.mobile_number && (
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.textPrimary, mt: 0.5, fontWeight: 500 }}>
                      Phone: {selectedOrder.address.mobile_number}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* C. ORDER ITEMS SECTION */}
          <Box
            sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: BRAND.bgPage,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Typography sx={{ fontSize: '11.5px', fontWeight: 800, color: BRAND.primaryGreen, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.05em' }}>
              Order Items ({selectedOrder.total_quantity || itemsList.length})
            </Typography>
            <Stack spacing={1.2}>
              {itemsList.map((item, idx) => {
                const itemImg = item.product?.image || FALLBACK_IMG;
                const unitPrice = item.special_price || item.main_price || item.price || 0;
                const lineTotal = item.item_total != null ? item.item_total : unitPrice * item.quantity;

                return (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.2,
                      borderRadius: '10px',
                      backgroundColor: BRAND.white,
                      border: `1px solid ${BRAND.border}`,
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={itemImg}
                        variant="rounded"
                        sx={{ width: 44, height: 44, borderRadius: '8px', backgroundColor: BRAND.bgPage }}
                      >
                        <ReceiptLongIcon sx={{ fontSize: 20, color: BRAND.primaryGreen }} />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '13.5px', color: BRAND.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name || item.product?.name || 'Item'}
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                          ₹{unitPrice.toFixed(0)} × {item.quantity}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: BRAND.primaryGreen, flexShrink: 0 }}>
                      ₹{lineTotal.toFixed(2)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* D. VISUAL ORDER TIMELINE */}
          <Box
            sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: BRAND.bgPage,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Typography sx={{ fontSize: '11.5px', fontWeight: 800, color: BRAND.primaryGreen, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.05em' }}>
              Order Timeline
            </Typography>

            <Box sx={{ pl: 1 }}>
              {isCancelled ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                  <ErrorOutlineIcon sx={{ color: BRAND.red, fontSize: 22 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.red }}>
                      Order Cancelled
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                      This order was cancelled.
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {/* Step 1: Order Placed */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <CheckCircleIcon sx={{ color: BRAND.primaryGreen, fontSize: 20, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.textPrimary }}>
                        Order Placed
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                        {formatDateTime(selectedOrder.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 2: Confirmed / Preparing */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {isConfirmed ? (
                      <CheckCircleIcon sx={{ color: BRAND.primaryGreen, fontSize: 20, mt: 0.2 }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: '#CBD5E1', fontSize: 20, mt: 0.2 }} />
                    )}
                    <Box>
                      <Typography sx={{ fontWeight: isConfirmed ? 700 : 500, fontSize: '13.5px', color: isConfirmed ? BRAND.textPrimary : BRAND.textSecondary }}>
                        Order Confirmed & Preparing
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                        {isConfirmed ? 'Merchant confirmed your order' : 'Pending confirmation'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 3: Out for Delivery */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {isOutForDelivery ? (
                      <CheckCircleIcon sx={{ color: BRAND.primaryGreen, fontSize: 20, mt: 0.2 }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: '#CBD5E1', fontSize: 20, mt: 0.2 }} />
                    )}
                    <Box>
                      <Typography sx={{ fontWeight: isOutForDelivery ? 700 : 500, fontSize: '13.5px', color: isOutForDelivery ? BRAND.textPrimary : BRAND.textSecondary }}>
                        Out for Delivery
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                        {isOutForDelivery ? 'Delivery partner is on the way' : 'Awaiting dispatch'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 4: Delivered */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {isDelivered ? (
                      <CheckCircleIcon sx={{ color: BRAND.primaryGreen, fontSize: 20, mt: 0.2 }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: '#CBD5E1', fontSize: 20, mt: 0.2 }} />
                    )}
                    <Box>
                      <Typography sx={{ fontWeight: isDelivered ? 700 : 500, fontSize: '13.5px', color: isDelivered ? BRAND.textPrimary : BRAND.textSecondary }}>
                        Delivered
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                        {isDelivered ? formatDate(selectedOrder.delivery_date || selectedOrder.updatedAt) : 'Estimated delivery soon'}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              )}
            </Box>
          </Box>

          {/* E. PRICE BREAKDOWN */}
          <Box
            sx={{
              p: 2,
              borderRadius: '14px',
              backgroundColor: BRAND.bgPage,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Typography sx={{ fontSize: '11.5px', fontWeight: 800, color: BRAND.primaryGreen, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.05em' }}>
              Price Breakdown
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>Subtotal</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: BRAND.textPrimary }}>
                  ₹{(selectedOrder.subtotal || 0).toFixed(2)}
                </Typography>
              </Box>

              {selectedOrder.discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '13px', color: BRAND.primaryGreen }}>Discount</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.primaryGreen }}>
                    -₹{(selectedOrder.discount || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}

              {selectedOrder.packaging_charge != null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>Packaging Charge</Typography>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textPrimary }}>
                    ₹{(selectedOrder.packaging_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}

              {selectedOrder.delivery_charge != null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>Delivery Charge</Typography>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textPrimary }}>
                    ₹{(selectedOrder.delivery_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}

              {selectedOrder.convenience_charge != null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>Convenience Charge</Typography>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textPrimary }}>
                    ₹{(selectedOrder.convenience_charge || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 0.8 }} />

              {/* Total Paid Row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: '10px',
                  backgroundColor: BRAND.lightGreen,
                  border: `1px solid rgba(8, 127, 91, 0.2)`,
                }}
              >
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: BRAND.textPrimary }}>
                  Total Paid
                </Typography>
                <Typography sx={{ fontSize: '18px', fontWeight: 800, color: BRAND.primaryGreen }}>
                  ₹{(selectedOrder.total_payable_amount || selectedOrder.subtotal || 0).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* F. PAYMENT INFO (IF AVAILABLE) */}
          {(selectedOrder.payment_method || selectedOrder.payment_status) && (
            <Box
              sx={{
                p: 2,
                borderRadius: '14px',
                backgroundColor: BRAND.bgPage,
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <Typography sx={{ fontSize: '11.5px', fontWeight: 800, color: BRAND.primaryGreen, textTransform: 'uppercase', mb: 1, letterSpacing: '0.05em' }}>
                Payment Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <PaymentIcon sx={{ fontSize: 20, color: BRAND.primaryGreen }} />
                <Box>
                  {selectedOrder.payment_method && (
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: BRAND.textPrimary }}>
                      Method: {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}
                    </Typography>
                  )}
                  {selectedOrder.payment_status && (
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.textSecondary }}>
                      Status: <strong style={{ color: BRAND.primaryGreen }}>{selectedOrder.payment_status}</strong>
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Stack>
      </Box>

      {/* 3. MODAL FOOTER */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderTop: `1px solid ${BRAND.border}`,
          backgroundColor: BRAND.white,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={onClose}
          sx={{
            backgroundColor: BRAND.primaryGreen,
            color: BRAND.white,
            borderRadius: '10px',
            height: 42,
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'none',
            '&:hover': {
              backgroundColor: BRAND.darkGreen,
            },
          }}
        >
          Close Details
        </Button>
      </Box>
    </Box>
  );
};

export default MyOrdersPage;
