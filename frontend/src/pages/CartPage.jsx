import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  Grid,
  Chip,
  Fade,
  Slide,
  useMediaQuery,
  useTheme,
  Radio,
  RadioGroup,
  Stack,
  IconButton,
  TextField,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useNavigate } from 'react-router-dom';

import { useCartContext } from '../context/CartContext';
import apiClient from '../api/apiClient';
import AddressFormDialog from '../components/AddressFormDialog';

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
  borderInput: '#DDE5E1',
  red: '#E03131',
  redLight: '#FFF5F5',
};

// Fallback SVG for Product Images
const FALLBACK_PRODUCT_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23F7F9F8" width="100" height="100"/%3E%3Ccircle cx="50" cy="50" r="22" fill="%23EAF7F2"/%3E%3Cpath d="M42 42h16v16h-16z" stroke="%23087F5B" stroke-width="2" fill="none"/%3E%3C/svg%3E';

const CartPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { cart, loading: cartLoading, clearCart, updateQuantity, removeFromCart } = useCartContext();

  const [checkoutData, setCheckoutData] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [deliveryType, setDeliveryType] = useState('today'); // 'today' or 'schedule'
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isPayButtonDisabled, setIsPayButtonDisabled] = useState(true);
  const [disableMessage, setDisableMessage] = useState('');
  const [clearCartDialogOpen, setClearCartDialogOpen] = useState(false);
  const [payingLoading, setPayingLoading] = useState(false);

  // Fetch checkout data with optional address
  const fetchCheckoutWithAddress = async (addressId = null) => {
    try {
      setCheckoutLoading(true);
      setError(null);

      // Get cart from localStorage
      const cartData = JSON.parse(localStorage.getItem('deliveryCart') || '[]');

      // Check if cart is empty
      if (!cartData.cart || cartData.cart.length === 0) {
        setCheckoutData(null);
        setCheckoutLoading(false);
        return;
      }

      // Prepare checkout payload
      const checkoutPayload = {
        cart: cartData.cart || [],
      };

      if (addressId) {
        checkoutPayload.selectedAddressId = addressId;
      }

      const token = localStorage.getItem('authToken');

      const response = await apiClient.post('/app/checkout', checkoutPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.success) {
        setCheckoutData(response.data);
        setIsPayButtonDisabled(response.is_disable_pay_button || false);
        setDisableMessage(response.disable_message || '');
      } else {
        setError(response?.message || 'Failed to load checkout data.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load checkout data. Please try again.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await apiClient.get('/app/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.success) {
        const addressList = response.data || [];
        setAddresses(addressList);

        // Auto-select default address if none is selected yet
        const defaultAddr = addressList.find((addr) => addr.isDefault) || addressList[0];
        if (defaultAddr && !selectedAddress) {
          setSelectedAddress(defaultAddr._id);
          await fetchCheckoutWithAddress(defaultAddr._id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  // Call checkout API and fetch addresses on page load / cart change
  useEffect(() => {
    if (cart.length > 0) {
      fetchCheckoutWithAddress(selectedAddress);
      fetchAddresses();
    }
  }, [cart]);

  // Handle address selection change
  const handleAddressChange = async (addressId) => {
    setSelectedAddress(addressId);
    await fetchCheckoutWithAddress(addressId);
  };

  // Handle address dialog save
  const handleSaveAddress = async (formData) => {
    try {
      setSubmittingAddress(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.post('/app/addresses', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.success) {
        setAddressDialogOpen(false);
        fetchAddresses();
        if (response.data?._id) {
          setSelectedAddress(response.data._id);
          await fetchCheckoutWithAddress(response.data._id);
        }
      }
    } catch (err) {
      console.error('Error saving address:', err);
      alert(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmittingAddress(false);
    }
  };

  // Handle Quantity Stepper
  const handleItemQuantityChange = async (vendorId, productId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeFromCart(vendorId, productId);
    } else {
      updateQuantity(vendorId, productId, newQty);
    }
  };

  // Confirm and clear cart
  const handleConfirmClearCart = () => {
    clearCart();
    setClearCartDialogOpen(false);
    navigate('/vendors');
  };

  // Handle Pay / Stripe Checkout
  const handlePay = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    if (deliveryType === 'schedule' && !deliveryDate) {
      alert('Please select a delivery date');
      return;
    }

    try {
      setPayingLoading(true);
      setError(null);

      let finalDeliveryDate =
        deliveryType === 'today'
          ? new Date().toISOString().split('T')[0]
          : deliveryDate;

      const cartIds = checkoutData.map((order) => order._id);

      const paymentData = {
        selectedAddressId: selectedAddress,
        cartIds: cartIds,
        deliveryDate: finalDeliveryDate,
        deliveryType: deliveryType,
      };

      const token = localStorage.getItem('authToken');

      const response = await apiClient.post('/app/create-stripe-checkout', paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.success && response?.url) {
        window.location.href = response.url;
      } else {
        setError(response?.message || 'Failed to create checkout session.');
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create checkout session. Please try again.'
      );
    } finally {
      setPayingLoading(false);
    }
  };

  // Calculate Grand Total across orders
  const grandTotal = useMemo(() => {
    if (!checkoutData || checkoutData.length === 0) return 0;
    return checkoutData.reduce((total, order) => total + (order.total_payable_amount || 0), 0);
  }, [checkoutData]);

  // Aggregate Price Breakdown across all orders
  const priceBreakdown = useMemo(() => {
    if (!checkoutData || checkoutData.length === 0) {
      return { subtotal: 0, discount: 0, packaging: 0, delivery: 0, convenience: 0 };
    }
    return checkoutData.reduce(
      (acc, o) => ({
        subtotal: acc.subtotal + (o.subtotal || 0),
        discount: acc.discount + (o.discount || 0),
        packaging: acc.packaging + (o.packaging_charge || 0),
        delivery: acc.delivery + (o.delivery_charge || 0),
        convenience: acc.convenience + (o.convenience_charge || 0),
      }),
      { subtotal: 0, discount: 0, packaging: 0, delivery: 0, convenience: 0 }
    );
  }, [checkoutData]);

  const totalItemsCount = useMemo(() => {
    if (!checkoutData || checkoutData.length === 0) return 0;
    return checkoutData.reduce((total, order) => total + (order.total_quantity || 0), 0);
  }, [checkoutData]);

  // Address type icons
  const getAddressIcon = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon sx={{ fontSize: 18, color: BRAND.primaryGreen }} />;
      case 'work':
        return <WorkIcon sx={{ fontSize: 18, color: BRAND.primaryGreen }} />;
      default:
        return <LocationOnIcon sx={{ fontSize: 18, color: BRAND.primaryGreen }} />;
    }
  };

  // 1. Loading State Skeletons
  if (cartLoading || checkoutLoading) {
    return (
      <Box sx={{ backgroundColor: BRAND.bgPage, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
        <Container maxWidth="lg" sx={{ maxWidth: '1200px !important', px: { xs: 2, sm: 3, md: 4 } }}>
          <Skeleton variant="text" width={180} height={36} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={320} height={22} sx={{ mb: 3 }} />

          <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
            <Grid item xs={12} md={7.5}>
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: '16px', mb: 2.5 }} />
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: '16px', mb: 2.5 }} />
              <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '16px' }} />
            </Grid>
            <Grid item xs={12} md={4.5}>
              <Skeleton variant="rectangular" height={380} sx={{ borderRadius: '16px' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  // 2. Empty Cart State
  if (cart.length === 0 || !checkoutData || checkoutData.length === 0) {
    return (
      <Box sx={{ backgroundColor: BRAND.bgPage, minHeight: '85vh', display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="sm">
          <Fade in timeout={500}>
            <Box
              sx={{
                textAlign: 'center',
                py: { xs: 5, sm: 7 },
                px: { xs: 2, sm: 4 },
                borderRadius: '20px',
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
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
                <ShoppingBagOutlinedIcon sx={{ fontSize: { xs: 42, sm: 50 }, color: BRAND.primaryGreen }} />
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
                Your Cart is Empty
              </Typography>

              <Typography
                sx={{
                  fontSize: '14px',
                  color: BRAND.textSecondary,
                  maxWidth: 360,
                  mx: 'auto',
                  mb: 3.5,
                  lineHeight: 1.5,
                }}
              >
                Looks like you haven't added anything yet. Discover fresh essentials and dishes from your neighborhood stores!
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
                Explore Local Shops →
              </Button>
            </Box>
          </Fade>
        </Container>
      </Box>
    );
  }

  // 3. Main Checkout View
  return (
    <Box
      sx={{
        backgroundColor: BRAND.bgPage,
        minHeight: '100vh',
        pb: { xs: 16, md: 8 },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          A. CHECKOUT PAGE HEADER
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: BRAND.white,
          borderBottom: `1px solid ${BRAND.border}`,
          py: { xs: 2, sm: 3 },
          mb: { xs: 2.5, md: 3.5 },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            maxWidth: '1200px !important',
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Back to store"
              sx={{
                backgroundColor: BRAND.bgPage,
                border: `1px solid ${BRAND.border}`,
                width: { xs: 38, sm: 42 },
                height: { xs: 38, sm: 42 },
                color: BRAND.primaryGreen,
                flexShrink: 0,
                '&:hover': {
                  backgroundColor: BRAND.lightGreen,
                  borderColor: BRAND.primaryGreen,
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '20px', sm: '24px', md: '28px' },
                  color: BRAND.textPrimary,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Checkout
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '12.5px', sm: '14px' },
                  color: BRAND.textSecondary,
                  mt: 0.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Review your order and complete your purchase securely
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          B. CHECKOUT CONTENT (2-COLUMN DESKTOP / 1-COLUMN MOBILE)
      ───────────────────────────────────────────────────────────── */}
      <Container
        maxWidth="lg"
        sx={{
          maxWidth: '1200px !important',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Error Alert */}
        {error && (
          <Slide direction="down" in mountOnEnter unmountOnExit>
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: '12px', border: `1px solid ${BRAND.redLight}` }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Slide>
        )}

        {/* Disabled Warning Message */}
        {isPayButtonDisabled && disableMessage && (
          <Slide direction="down" in mountOnEnter unmountOnExit>
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: BRAND.orangeLight,
                border: `1px solid rgba(255, 107, 0, 0.3)`,
                color: BRAND.textPrimary,
                fontWeight: 600,
                fontSize: '13px',
                '& .MuiAlert-icon': {
                  color: BRAND.orange,
                },
              }}
            >
              {disableMessage}
            </Alert>
          </Slide>
        )}

        <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
          {/* ═══════════════════════════════════════════════════════════
              LEFT COLUMN (CART ITEMS, ADDRESS, DELIVERY, PAYMENT)
          ═══════════════════════════════════════════════════════════ */}
          <Grid item xs={12} md={7.5}>
            <Stack spacing={{ xs: 2.5, md: 3 }}>
              {/* 1. ORDER ITEMS SECTION (GROUPED BY VENDOR) */}
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '15px', sm: '16px' },
                      color: BRAND.textPrimary,
                    }}
                  >
                    Order Items ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                  </Typography>

                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setClearCartDialogOpen(true)}
                    startIcon={<DeleteOutlineIcon sx={{ fontSize: '16px !important' }} />}
                    sx={{
                      color: BRAND.red,
                      fontWeight: 600,
                      fontSize: '12.5px',
                      textTransform: 'none',
                      px: 1,
                      py: 0.4,
                      minHeight: 0,
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      '&:hover': {
                        backgroundColor: BRAND.redLight,
                      },
                    }}
                  >
                    Clear Cart
                  </Button>
                </Box>

                <Stack spacing={2}>
                  {checkoutData.map((order, orderIndex) => {
                    const vendorName = order.vendor?.name || 'Local Store';
                    const items = Array.isArray(order.items) ? order.items : [];

                    return (
                      <Card
                        key={order._id || orderIndex}
                        elevation={0}
                        sx={{
                          borderRadius: '16px',
                          border: `1px solid ${BRAND.border}`,
                          backgroundColor: BRAND.white,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          overflow: 'hidden',
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                          {/* Store Name Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5, borderBottom: `1px solid ${BRAND.border}`, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StorefrontIcon sx={{ fontSize: 20, color: BRAND.primaryGreen }} />
                              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: BRAND.textPrimary }}>
                                {vendorName}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                              size="small"
                              sx={{
                                backgroundColor: BRAND.lightGreen,
                                color: BRAND.primaryGreen,
                                fontWeight: 700,
                                fontSize: '11px',
                                height: 22,
                              }}
                            />
                          </Box>

                          {/* Items List */}
                          <Stack spacing={1.5}>
                            {items.map((item, itemIdx) => {
                              const hasDiscount = item.special_price && item.special_price < item.main_price;
                              const unitPrice = hasDiscount ? item.special_price : item.main_price || item.price || 0;
                              const itemTotal = item.item_total != null ? item.item_total : unitPrice * item.quantity;
                              const itemImg = item.product?.image || item.image || FALLBACK_PRODUCT_IMAGE;

                              return (
                                <Box
                                  key={item.product || itemIdx}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: { xs: 1.2, sm: 1.5 },
                                    borderRadius: '12px',
                                    backgroundColor: BRAND.bgPage,
                                    border: `1px solid ${BRAND.border}`,
                                    gap: 1.5,
                                  }}
                                >
                                  {/* Left: Thumbnail & Item Name */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                                    <Avatar
                                      src={itemImg}
                                      variant="rounded"
                                      sx={{
                                        width: { xs: 52, sm: 60 },
                                        height: { xs: 52, sm: 60 },
                                        borderRadius: '10px',
                                        backgroundColor: BRAND.white,
                                        border: `1px solid ${BRAND.border}`,
                                        flexShrink: 0,
                                      }}
                                    >
                                      <ReceiptLongIcon sx={{ color: BRAND.primaryGreen }} />
                                    </Avatar>

                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: { xs: '13.5px', sm: '14.5px' },
                                          color: BRAND.textPrimary,
                                          lineHeight: 1.3,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          mb: 0.3,
                                        }}
                                      >
                                        {item.name}
                                      </Typography>

                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.primaryGreen }}>
                                          ₹{unitPrice.toFixed(0)}
                                        </Typography>
                                        {hasDiscount && (
                                          <Typography sx={{ fontSize: '11.5px', textDecoration: 'line-through', color: '#9CA3AF' }}>
                                            ₹{item.main_price.toFixed(0)}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>

                                  {/* Right: Quantity Stepper & Line Total */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
                                    {/* Quantity Stepper */}
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        backgroundColor: BRAND.white,
                                        border: `1px solid ${BRAND.border}`,
                                        borderRadius: '8px',
                                        px: 0.4,
                                        height: 32,
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        aria-label="Decrease quantity"
                                        onClick={() => handleItemQuantityChange(order.vendor?._id || order.vendor, item.product?._id || item.product, item.quantity, -1)}
                                        sx={{ p: 0.2, color: BRAND.textSecondary, '&:hover': { color: BRAND.red } }}
                                      >
                                        <RemoveIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                      <Typography sx={{ px: 0.8, fontSize: '13px', fontWeight: 800, color: BRAND.textPrimary }}>
                                        {item.quantity}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        aria-label="Increase quantity"
                                        onClick={() => handleItemQuantityChange(order.vendor?._id || order.vendor, item.product?._id || item.product, item.quantity, 1)}
                                        sx={{ p: 0.2, color: BRAND.textSecondary, '&:hover': { color: BRAND.primaryGreen } }}
                                      >
                                        <AddIcon sx={{ fontSize: 14 }} />
                                      </IconButton>
                                    </Box>

                                    {/* Line Total */}
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: '14px', sm: '15.5px' }, color: BRAND.textPrimary, minWidth: { xs: 55, sm: 65 }, textAlign: 'right' }}>
                                      ₹{itemTotal.toFixed(2)}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>

              {/* 2. DELIVERY ADDRESS SECTION */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '16px', color: BRAND.textPrimary }}>
                      Delivery Address
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                      onClick={() => setAddressDialogOpen(true)}
                      sx={{
                        color: BRAND.primaryGreen,
                        fontWeight: 700,
                        fontSize: '12.5px',
                        textTransform: 'none',
                        '&:hover': { backgroundColor: BRAND.lightGreen },
                      }}
                    >
                      Add New Address
                    </Button>
                  </Box>

                  {addresses.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '12px',
                        border: `1.5px dashed ${BRAND.border}`,
                        textAlign: 'center',
                        backgroundColor: BRAND.bgPage,
                      }}
                    >
                      <LocationOnIcon sx={{ fontSize: 36, color: BRAND.textSecondary, mb: 1 }} />
                      <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: BRAND.textPrimary, mb: 0.5 }}>
                        No saved delivery address found
                      </Typography>
                      <Typography sx={{ fontSize: '12.5px', color: BRAND.textSecondary, mb: 2 }}>
                        Please add your delivery address to proceed with checkout.
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setAddressDialogOpen(true)}
                        sx={{
                          backgroundColor: BRAND.primaryGreen,
                          color: BRAND.white,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '13px',
                          '&:hover': { backgroundColor: BRAND.darkGreen },
                        }}
                      >
                        Add Address
                      </Button>
                    </Box>
                  ) : (
                    /* Horizontal Address Carousel */
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        overflowX: 'auto',
                        pb: 1,
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                      }}
                    >
                      {addresses.map((address) => {
                        const isSelected = selectedAddress === address._id;
                        return (
                          <Box
                            key={address._id}
                            onClick={() => handleAddressChange(address._id)}
                            sx={{
                              minWidth: { xs: 230, sm: 260 },
                              maxWidth: { xs: 230, sm: 260 },
                              p: 2,
                              borderRadius: '14px',
                              border: isSelected ? `2px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
                              backgroundColor: isSelected ? BRAND.lightGreen : BRAND.white,
                              cursor: 'pointer',
                              transition: 'all 0.18s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: isSelected ? '0 4px 12px rgba(8, 127, 91, 0.12)' : 'none',
                              '&:hover': {
                                borderColor: BRAND.primaryGreen,
                                transform: 'translateY(-2px)',
                              },
                            }}
                          >
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                  {getAddressIcon(address.type)}
                                  <Typography sx={{ fontWeight: 700, fontSize: '13px', textTransform: 'capitalize', color: BRAND.textPrimary }}>
                                    {address.type || 'Address'}
                                  </Typography>
                                </Box>
                                {address.isDefault && (
                                  <Chip
                                    label="Default"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      backgroundColor: 'rgba(8, 127, 91, 0.15)',
                                      color: BRAND.primaryGreen,
                                    }}
                                  />
                                )}
                              </Box>

                              <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.textPrimary, mb: 0.3 }}>
                                {address.name}
                              </Typography>

                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  color: BRAND.textSecondary,
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 0.5,
                                }}
                              >
                                {address.address}
                                {address.city ? `, ${address.city}` : ''}
                                {address.pincode ? ` - ${address.pincode}` : ''}
                              </Typography>
                            </Box>

                            {/* Selection status */}
                            <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${isSelected ? 'rgba(8, 127, 91, 0.2)' : BRAND.border}`, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                              {isSelected ? (
                                <>
                                  <CheckCircleIcon sx={{ fontSize: 16, color: BRAND.primaryGreen }} />
                                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.primaryGreen }}>
                                    Selected
                                  </Typography>
                                </>
                              ) : (
                                <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, fontWeight: 500 }}>
                                  Click to Select
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* 3. DELIVERY OPTIONS SECTION */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '16px', color: BRAND.textPrimary, mb: 2 }}>
                    Delivery Options
                  </Typography>

                  <RadioGroup
                    value={deliveryType}
                    onChange={(e) => {
                      setDeliveryType(e.target.value);
                      if (e.target.value === 'today') {
                        setDeliveryDate('');
                      }
                    }}
                  >
                    <Stack spacing={1.5}>
                      {/* Option 1: Today Delivery */}
                      <Box
                        onClick={() => {
                          setDeliveryType('today');
                          setDeliveryDate('');
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          borderRadius: '12px',
                          border: deliveryType === 'today' ? `2px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
                          backgroundColor: deliveryType === 'today' ? BRAND.lightGreen : BRAND.white,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <Radio
                          value="today"
                          size="small"
                          sx={{ p: 0, mr: 1.2, color: BRAND.primaryGreen, '&.Mui-checked': { color: BRAND.primaryGreen } }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.textPrimary }}>
                            Today Delivery
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                            Delivered fresh directly from neighborhood stores today
                          </Typography>
                        </Box>
                        <DeliveryDiningIcon sx={{ color: BRAND.primaryGreen, fontSize: 24 }} />
                      </Box>

                      {/* Option 2: Schedule Delivery */}
                      <Box
                        onClick={() => setDeliveryType('schedule')}
                        sx={{
                          p: 1.5,
                          borderRadius: '12px',
                          border: deliveryType === 'schedule' ? `2px solid ${BRAND.primaryGreen}` : `1px solid ${BRAND.border}`,
                          backgroundColor: deliveryType === 'schedule' ? BRAND.lightGreen : BRAND.white,
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: deliveryType === 'schedule' ? 1.5 : 0 }}>
                          <Radio
                            value="schedule"
                            size="small"
                            sx={{ p: 0, mr: 1.2, color: BRAND.primaryGreen, '&.Mui-checked': { color: BRAND.primaryGreen } }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.textPrimary }}>
                              Schedule Delivery
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                              Choose your preferred delivery date in advance
                            </Typography>
                          </Box>
                          <AccessTimeIcon sx={{ color: BRAND.primaryGreen, fontSize: 22 }} />
                        </Box>

                        {/* Date Picker (shown only when schedule is active) */}
                        {deliveryType === 'schedule' && (
                          <Box sx={{ pl: 3.5, pt: 0.5 }}>
                            <TextField
                              fullWidth
                              type="date"
                              size="small"
                              value={deliveryDate}
                              onChange={(e) => setDeliveryDate(e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{
                                min: new Date(new Date().setDate(new Date().getDate() + 1))
                                  .toISOString()
                                  .split('T')[0],
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '10px',
                                  backgroundColor: BRAND.white,
                                },
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* 4. PAYMENT METHOD SECTION */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '16px', color: BRAND.textPrimary, mb: 1.5 }}>
                    Payment Method
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.6,
                      borderRadius: '12px',
                      border: `2px solid ${BRAND.primaryGreen}`,
                      backgroundColor: BRAND.lightGreen,
                      gap: 1.5,
                    }}
                  >
                    <CreditCardIcon sx={{ fontSize: 24, color: BRAND.primaryGreen }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: BRAND.textPrimary }}>
                        Secure Online Payment (Stripe)
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
                        Cards, NetBanking, UPI & Digital Wallets via 256-bit encrypted checkout
                      </Typography>
                    </Box>
                    <ShieldOutlinedIcon sx={{ color: BRAND.primaryGreen, fontSize: 20 }} />
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT COLUMN: STICKY PRICE SUMMARY & FINAL CHECKOUT CTA
          ═══════════════════════════════════════════════════════════ */}
          <Grid item xs={12} md={4.5}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 24 },
              }}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '17px', color: BRAND.textPrimary, mb: 2 }}>
                    Price Details
                  </Typography>

                  {/* Line Item Breakdown */}
                  <Stack spacing={1.2} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13.5px', color: BRAND.textSecondary }}>
                        Items Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
                      </Typography>
                      <Typography sx={{ fontSize: '13.5px', fontWeight: 600, color: BRAND.textPrimary }}>
                        ₹{priceBreakdown.subtotal.toFixed(2)}
                      </Typography>
                    </Box>

                    {priceBreakdown.discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '13.5px', color: BRAND.primaryGreen, fontWeight: 600 }}>
                          Discount
                        </Typography>
                        <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: BRAND.primaryGreen }}>
                          -₹{priceBreakdown.discount.toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    {priceBreakdown.packaging > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '13.5px', color: BRAND.textSecondary }}>Packaging Charge</Typography>
                        <Typography sx={{ fontSize: '13.5px', color: BRAND.textPrimary }}>
                          ₹{priceBreakdown.packaging.toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DeliveryDiningIcon sx={{ fontSize: 16, color: BRAND.textSecondary }} />
                        <Typography sx={{ fontSize: '13.5px', color: BRAND.textSecondary }}>Delivery Fee</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '13.5px', color: BRAND.textPrimary }}>
                        {priceBreakdown.delivery > 0 ? `₹${priceBreakdown.delivery.toFixed(2)}` : 'FREE'}
                      </Typography>
                    </Box>

                    {priceBreakdown.convenience > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '13.5px', color: BRAND.textSecondary }}>Convenience Fee</Typography>
                        <Typography sx={{ fontSize: '13.5px', color: BRAND.textPrimary }}>
                          ₹{priceBreakdown.convenience.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Total Payable Box */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      backgroundColor: BRAND.lightGreen,
                      border: `1px solid rgba(8, 127, 91, 0.2)`,
                      mb: 2.5,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Payable
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: BRAND.primaryGreen, fontWeight: 600 }}>
                        Inclusive of all taxes
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '22px', fontWeight: 800, color: BRAND.primaryGreen }}>
                      ₹{grandTotal.toFixed(2)}
                    </Typography>
                  </Box>

                  {/* Final Checkout Action Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handlePay}
                    disabled={isPayButtonDisabled || payingLoading}
                    startIcon={
                      payingLoading ? (
                        <CircularProgress size={18} sx={{ color: '#fff' }} />
                      ) : (
                        <LockOutlinedIcon sx={{ fontSize: '18px !important' }} />
                      )
                    }
                    sx={{
                      backgroundColor: isPayButtonDisabled ? '#E5E7EB' : BRAND.primaryGreen,
                      color: isPayButtonDisabled ? '#9CA3AF' : BRAND.white,
                      fontWeight: 700,
                      height: 50,
                      borderRadius: '12px',
                      fontSize: '15px',
                      textTransform: 'none',
                      boxShadow: isPayButtonDisabled ? 'none' : '0 6px 20px rgba(8, 127, 91, 0.3)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        backgroundColor: isPayButtonDisabled ? '#E5E7EB' : BRAND.darkGreen,
                        boxShadow: isPayButtonDisabled ? 'none' : '0 8px 24px rgba(8, 127, 91, 0.4)',
                        transform: isPayButtonDisabled ? 'none' : 'translateY(-2px)',
                      },
                      '&.Mui-disabled': {
                        color: '#9CA3AF',
                        backgroundColor: '#E5E7EB',
                      },
                    }}
                  >
                    {payingLoading
                      ? 'Redirecting to Payment...'
                      : isPayButtonDisabled
                      ? 'Select Address to Continue'
                      : `Place Order & Pay ₹${grandTotal.toFixed(0)} →`}
                  </Button>

                  {/* Secondary Continue Shopping Action */}
                  <Button
                    variant="text"
                    fullWidth
                    onClick={() => navigate('/vendors')}
                    sx={{
                      mt: 1.5,
                      color: BRAND.textSecondary,
                      fontWeight: 600,
                      fontSize: '13px',
                      textTransform: 'none',
                      '&:hover': {
                        color: BRAND.primaryGreen,
                        backgroundColor: BRAND.bgPage,
                      },
                    }}
                  >
                    Continue Shopping
                  </Button>

                  {/* Trust Badge */}
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${BRAND.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <ShieldOutlinedIcon sx={{ fontSize: 16, color: BRAND.primaryGreen }} />
                    <Typography sx={{ fontSize: '11.5px', color: BRAND.textSecondary, fontWeight: 500 }}>
                      100% Safe & Secure Local Delivery
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          C. MOBILE STICKY CHECKOUT BOTTOM BAR
      ───────────────────────────────────────────────────────────── */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            backgroundColor: BRAND.white,
            borderTop: `1px solid ${BRAND.border}`,
            px: 2,
            py: 1.5,
            zIndex: 1050,
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, maxWidth: 480, mx: 'auto' }}>
            <Box>
              <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, fontWeight: 600, textTransform: 'uppercase' }}>
                Total Payable
              </Typography>
              <Typography sx={{ fontSize: '18px', fontWeight: 800, color: BRAND.primaryGreen, lineHeight: 1.2 }}>
                ₹{grandTotal.toFixed(2)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handlePay}
              disabled={isPayButtonDisabled || payingLoading}
              startIcon={
                payingLoading ? (
                  <CircularProgress size={16} sx={{ color: '#fff' }} />
                ) : (
                  <LockOutlinedIcon sx={{ fontSize: '16px !important' }} />
                )
              }
              sx={{
                backgroundColor: isPayButtonDisabled ? '#E5E7EB' : BRAND.primaryGreen,
                color: isPayButtonDisabled ? '#9CA3AF' : BRAND.white,
                fontWeight: 700,
                px: 3,
                height: 44,
                borderRadius: '10px',
                fontSize: '13.5px',
                textTransform: 'none',
                flexShrink: 0,
                boxShadow: isPayButtonDisabled ? 'none' : '0 4px 12px rgba(8, 127, 91, 0.3)',
                '&:hover': {
                  backgroundColor: isPayButtonDisabled ? '#E5E7EB' : BRAND.darkGreen,
                },
                '&.Mui-disabled': {
                  color: '#9CA3AF',
                  backgroundColor: '#E5E7EB',
                },
              }}
            >
              {payingLoading
                ? 'Processing...'
                : isPayButtonDisabled
                ? 'Select Address'
                : 'Place Order →'}
            </Button>
          </Box>
        </Box>
      )}

      {/* ─────────────────────────────────────────────────────────────
          D. DIALOGS: ADD ADDRESS & CLEAR CART CONFIRMATION
      ───────────────────────────────────────────────────────────── */}
      {/* 1. Add Address Dialog */}
      <AddressFormDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        onSubmit={handleSaveAddress}
        initialData={null}
        submitting={submittingAddress}
      />

      {/* 2. Clear Cart Confirmation Dialog */}
      <Dialog
        open={clearCartDialogOpen}
        onClose={() => setClearCartDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 800, fontSize: '18px', color: BRAND.textPrimary }}>
          Clear Your Cart?
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography sx={{ fontSize: '14px', color: BRAND.textSecondary }}>
            All {totalItemsCount} items will be removed from your cart. You will need to re-add items to place an order.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setClearCartDialogOpen(false)}
            sx={{
              borderColor: BRAND.border,
              color: BRAND.textSecondary,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { borderColor: BRAND.textPrimary, color: BRAND.textPrimary },
            }}
          >
            Keep Items
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmClearCart}
            sx={{
              backgroundColor: BRAND.red,
              color: BRAND.white,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#c92a2a' },
            }}
          >
            Clear Cart
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CartPage;
