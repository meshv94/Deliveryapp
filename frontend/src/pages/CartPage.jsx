import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Chip,
  Fade,
  Slide,
  useMediaQuery,
  useTheme,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  IconButton,
  TextField,
  Zoom,
  Grow,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import apiClient from '../api/apiClient';
import AddressFormDialog from '../components/AddressFormDialog';
import confetti from 'canvas-confetti';

const CartPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { cart, loading, clearCart } = useCartContext();
  const [checkoutData, setCheckoutData] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [deliveryType, setDeliveryType] = useState('today'); // 'today' or 'schedule'
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isPayButtonDisabled, setIsPayButtonDisabled] = useState(true);
  const [disableMessage, setDisableMessage] = useState('');

  // Fetch checkout data with optional address
  const fetchCheckoutWithAddress = async (addressId = null) => {
    try {
      setCheckoutLoading(true);
      setError(null);

      // Get cart from localStorage
      const cartData = JSON.parse(localStorage.getItem('deliveryCart') || '[]');

      // Check if cart is empty
      if (!cartData.cart || cartData.cart.length === 0) {
        setCheckoutLoading(false);
        return;
      }

      // Prepare checkout payload
      const checkoutPayload = {
        cart: cartData.cart || [],
      };

      // Add selectedAddressId if provided
      if (addressId) {
        checkoutPayload.selectedAddressId = addressId;
      }

      // Get token from localStorage
      const token = localStorage.getItem('authToken');

      // Call checkout API with Bearer token
      const response = await apiClient.post('/app/checkout', checkoutPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle successful response
      if (response?.success) {
        setCheckoutData(response.data);
        // Set pay button disabled state based on API response
        setIsPayButtonDisabled(response.is_disable_pay_button || false);
        // Set disable message if present
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

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await apiClient.get('/app/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        setAddresses(response.data || []);
        // Auto-select default address if available
        const defaultAddr = response.data?.find((addr) => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr._id);
          // Fetch checkout with default address to calculate delivery charge
          await fetchCheckoutWithAddress(defaultAddr._id);
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  // Call checkout API and fetch addresses on page load
  useEffect(() => {
    if (cart.length > 0) {
      fetchCheckoutWithAddress();
      fetchAddresses();
    }
  }, [cart]);

  const handleClearCart = () => {
    clearCart();
    navigate('/vendors');
  };

  const handleAddAddress = () => {
    setAddressDialogOpen(true);
  };

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

      if (response.success) {
        setAddressDialogOpen(false);
        fetchAddresses();
        // Auto-select newly added address and recalculate delivery
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

  // Handle address change
  const handleAddressChange = async (addressId) => {
    setSelectedAddress(addressId);
    // Recalculate delivery charge with new address
    await fetchCheckoutWithAddress(addressId);
  };

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
      setCheckoutLoading(true);
      setError(null);

      // Prepare delivery date
      let finalDeliveryDate;
      if (deliveryType === 'today') {
        finalDeliveryDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
      } else {
        finalDeliveryDate = deliveryDate;
      }

      // Extract cart IDs from checkoutData
      const cartIds = checkoutData.map((order) => order._id);

      // Prepare payment data
      const paymentData = {
        selectedAddressId: selectedAddress,
        cartIds: cartIds,
        deliveryDate: finalDeliveryDate,
        deliveryType: deliveryType,
      };

      // Get token from localStorage
      const token = localStorage.getItem('authToken');

      // Call Stripe checkout API
      const response = await apiClient.post('/app/create-stripe-checkout', paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle successful response
      if (response?.success && response?.url) {
        // Redirect to Stripe checkout page
        console.log("pay now response", response)
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
      setCheckoutLoading(false);
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon sx={{ fontSize: '1.2rem' }} />;
      case 'work':
        return <WorkIcon sx={{ fontSize: '1.2rem' }} />;
      default:
        return <LocationOnIcon sx={{ fontSize: '1.2rem' }} />;
    }
  };

  const calculateGrandTotal = () => {
    if (!checkoutData || checkoutData.length === 0) return 0;
    return checkoutData.reduce((total, order) => total + (order.total_payable_amount || 0), 0);
  };

  // Loading State
  if (loading || checkoutLoading) {
    return (
      <Container sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#087F5B' }} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading your cart...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Success Screen
  if (orderSuccess) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: { xs: 4, md: 8 },
        }}
      >
        <Zoom in timeout={600}>
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 4, md: 6 },
              px: { xs: 2, md: 4 },
              width: '100%',
            }}
          >
            {/* Animated Success Icon */}
            <Box
              sx={{
                position: 'relative',
                width: { xs: 140, md: 180 },
                height: { xs: 140, md: 180 },
                margin: '0 auto',
                mb: 4,
              }}
            >
              <Zoom in timeout={600}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#087F5B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 28px rgba(8, 127, 91, 0.25)',
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: { xs: 72, md: 88 },
                      color: '#FFFFFF',
                    }}
                  />
                </Box>
              </Zoom>
            </Box>

            {/* Success Message */}
            <Fade in timeout={800}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    mb: 1.5,
                    fontWeight: 800,
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    color: '#151515',
                  }}
                >
                  Order Placed!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                    color: '#6B7280',
                    fontWeight: 500,
                  }}
                >
                  Your order has been successfully placed with the store.
                </Typography>
              </Box>
            </Fade>

            {/* Order Confirmation Card */}
            <Grow in timeout={900}>
              <Box
                sx={{
                  mb: 3.5,
                  py: 2.5,
                  px: 3,
                  borderRadius: '16px',
                  backgroundColor: '#EBFBEE',
                  border: '1px solid #B2F2BB',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    lineHeight: 1.6,
                    color: '#075B43',
                    fontWeight: 600,
                  }}
                >
                  Thank you for shopping local! We're preparing your items and will have them delivered to you shortly.
                </Typography>
              </Box>
            </Grow>

            {/* Action Buttons */}
            <Fade in timeout={1400} style={{ transitionDelay: '800ms' }}>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/my-orders')}
                  sx={{
                    backgroundColor: '#087F5B',
                    color: '#fff',
                    fontWeight: 700,
                    px: { xs: 4, md: 5 },
                    py: { xs: 1.5, md: 2 },
                    borderRadius: '12px',
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(8, 127, 91, 0.3)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      backgroundColor: '#075B43',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 30px rgba(8, 127, 91, 0.4)',
                    },
                  }}
                >
                  View My Orders
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/vendors')}
                  sx={{
                    borderColor: '#087F5B',
                    color: '#087F5B',
                    fontWeight: 600,
                    px: { xs: 4, md: 5 },
                    py: { xs: 1.5, md: 2 },
                    borderRadius: '12px',
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    textTransform: 'none',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: '#075B43',
                      backgroundColor: 'rgba(8, 127, 91, 0.05)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Continue Shopping
                </Button>
              </Stack>
            </Fade>
          </Box>
        </Zoom>
      </Container>
    );
  }

  // Empty Cart State
  if (cart.length === 0 || !checkoutData || checkoutData.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Fade in timeout={600}>
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 4, md: 6 },
              px: { xs: 2, md: 4 },
            }}
          >
            <Box
              sx={{
                width: { xs: 100, md: 120 },
                height: { xs: 100, md: 120 },
                margin: '0 auto',
                mb: 3,
                borderRadius: '50%',
                backgroundColor: 'rgba(8, 127, 91, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: { xs: 48, md: 60 }, color: '#087F5B' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                mb: 1.5,
                fontWeight: 800,
                color: '#151515',
                fontSize: { xs: '1.6rem', md: '2rem' },
              }}
            >
              Your Cart is Empty
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ mb: 4, fontSize: { xs: '0.9rem', md: '1rem' } }}
            >
              Looks like you haven't added anything to your cart yet.
              <br />
              Start discovering fresh local essentials from nearby shops!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/vendors')}
              sx={{
                backgroundColor: '#087F5B',
                color: '#fff',
                fontWeight: 700,
                px: { xs: 3.5, md: 4.5 },
                py: { xs: 1.25, md: 1.5 },
                borderRadius: '12px',
                fontSize: { xs: '0.95rem', md: '1rem' },
                textTransform: 'none',
                boxShadow: '0 6px 20px rgba(8, 127, 91, 0.25)',
                '&:hover': {
                  backgroundColor: '#075B43',
                },
              }}
            >
              Discover Stores
            </Button>
          </Box>
        </Fade>
      </Container>
    );
  }

  // Checkout View (existing code)
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 2, md: 4 },
          px: { xs: 1, md: 0 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              color: '#151515',
              mb: 0.5,
            }}
          >
            Order Summary
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
            Review your order and proceed to payment
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="medium"
          onClick={handleClearCart}
          startIcon={<DeleteOutlineIcon />}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            borderRadius: '12px',
            borderColor: '#ef5350',
            color: '#ef5350',
            fontWeight: 600,
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.25 },
            fontSize: { xs: '0.85rem', md: '0.9rem' },
            textTransform: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#d32f2f',
              backgroundColor: '#ffebee',
              color: '#d32f2f',
            },
          }}
        >
          Clear Cart
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Slide direction="down" in mountOnEnter unmountOnExit>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '12px',
              fontSize: { xs: '0.85rem', md: '0.875rem' },
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        </Slide>
      )}

      {/* Disable Payment Warning */}
      {isPayButtonDisabled && disableMessage && (
        <Slide direction="down" in mountOnEnter unmountOnExit>
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: '12px',
              fontSize: { xs: '0.85rem', md: '0.875rem' },
              backgroundColor: '#fff8e1',
              border: '2px solid #ffc107',
              color: '#f57f17',
              fontWeight: 600,
              '& .MuiAlert-icon': {
                color: '#ffc107',
              },
            }}
          >
            {disableMessage}
          </Alert>
        </Slide>
      )}

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Left: Order Details */}
        <Grid item xs={12} md={8}>
          {checkoutData.map((order, orderIndex) => (
            <Fade in timeout={600} key={order._id}>
              <Card
                sx={{
                  width: '100%',
                  mb: { xs: 2, md: 3 },
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  '&:hover': {
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  {/* Order Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 2,
                      borderBottom: '2px solid #f0f0f0',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                        Order #{orderIndex + 1}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                      >
                        ID: {order._id}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status || 'New'}
                      size="small"
                      sx={{
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        fontWeight: 600,
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                      }}
                    />
                  </Box>

                  {/* Products List */}
                  <Box sx={{ mb: 2 }}>
                    {order.items.map((item, itemIndex) => (
                      <Box
                        key={item.product}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: { xs: 1.5, md: 2 },
                          px: { xs: 1, md: 2 },
                          mb: 1,
                          borderRadius: '12px',
                          backgroundColor: itemIndex % 2 === 0 ? '#fafafa' : '#fff',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: '0.85rem', md: '0.875rem' },
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: { xs: 'nowrap', sm: 'normal' },
                            }}
                          >
                            {item.name}
                          </Typography>
                          {item.special_price && item.special_price < item.main_price && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  textDecoration: 'line-through',
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                                }}
                              >
                                ₹ {item.main_price.toFixed(2)}
                              </Typography>
                              <Chip
                                icon={<LocalOfferIcon sx={{ fontSize: { xs: 10, md: 12 } }} />}
                                label={`₹ ${item.special_price.toFixed(2)}`}
                                size="small"
                                sx={{
                                  backgroundColor: '#e8f5e9',
                                  color: '#2e7d32',
                                  height: { xs: 18, md: 20 },
                                  fontSize: { xs: '0.65rem', md: '0.7rem' },
                                  fontWeight: 700,
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 1, md: 2 },
                            ml: { xs: 1, md: 2 },
                          }}
                        >
                          <Box sx={{ textAlign: 'center', minWidth: { xs: 40, md: 50 } }}>
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', color: 'text.secondary', fontSize: { xs: '0.65rem', md: '0.7rem' } }}
                            >
                              Qty
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', md: '0.875rem' } }}
                            >
                              {item.quantity}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right', minWidth: { xs: 60, md: 80 } }}>
                            <Typography
                              variant="caption"
                              sx={{ display: 'block', color: 'text.secondary', fontSize: { xs: '0.65rem', md: '0.7rem' } }}
                            >
                              Total
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: '#087F5B',
                                fontSize: { xs: '0.9rem', md: '1rem' },
                              }}
                            >
                              ₹ {item.item_total.toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Order Pricing Summary */}
                  <Box sx={{ px: { xs: 0, md: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        Subtotal:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        ₹ {order.subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                    {order.discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                          Discount:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: '#087F5B', fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                        >
                          -₹ {order.discount.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        Packaging:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        ₹ {order.packaging_charge.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        <DeliveryDiningIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                        Delivery:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        ₹ {order.delivery_charge.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        Convenience:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                        ₹ {order.convenience_charge.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '12px',
                        backgroundColor: 'rgba(8, 127, 91, 0.06)',
                        border: '1px solid rgba(8, 127, 91, 0.15)',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.125rem' }, color: '#151515' }}>
                        Total Payable:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color: '#087F5B',
                          fontSize: { xs: '1.1rem', md: '1.25rem' },
                        }}
                      >
                        ₹ {order.total_payable_amount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: 'block', mt: 1, textAlign: 'center', fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                    >
                      <ReceiptLongIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      {order.total_quantity} {order.total_quantity === 1 ? 'item' : 'items'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          ))}
        </Grid>

        {/* Right: Delivery & Payment */}
        <Grid item xs={12} md={4}>
          {/* Delivery Address & Options Card */}
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              mb: 3,
              backgroundColor: '#FFFFFF',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {/* Delivery Address Section */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                  }}
                >
                  Delivery Address
                </Typography>

                {addresses.length === 0 ? (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: '2px dashed #e0e0e0',
                      textAlign: 'center',
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      No addresses found
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddAddress}
                      sx={{
                        borderColor: '#087F5B',
                        color: '#087F5B',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#075B43',
                          backgroundColor: 'rgba(8, 127, 91, 0.05)',
                        },
                      }}
                    >
                      Add Address
                    </Button>
                  </Box>
                ) : (
                  <>
                    {/* Horizontal Scroll - All Devices */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        overflowX: 'auto',
                        pb: 1.5,
                        mb: 2,
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#087F5B #f0f0f0',
                        '&::-webkit-scrollbar': {
                          height: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: '#f0f0f0',
                          borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#087F5B',
                          borderRadius: '10px',
                        },
                      }}
                    >
                      {addresses.map((address) => (
                        <Card
                          key={address._id}
                          sx={{
                            minWidth: { xs: 240, md: 280 },
                            maxWidth: { xs: 240, md: 280 },
                            border: selectedAddress === address._id ? '2px solid #087F5B' : '1px solid #E5E7EB',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            backgroundColor: selectedAddress === address._id ? 'rgba(8, 127, 91, 0.04)' : '#fff',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                              borderColor: '#087F5B',
                            },
                          }}
                          onClick={() => handleAddressChange(address._id)}
                        >
                          <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
                            <Box sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                {getAddressIcon(address.type)}
                                <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                                  {address.type}
                                </Typography>
                                {address.isDefault && (
                                  <Chip
                                    label="Default"
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      backgroundColor: 'rgba(8, 127, 91, 0.1)',
                                      color: '#087F5B',
                                      fontWeight: 700,
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {address.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4,
                                }}
                              >
                                {address.address}
                                {address.city && `, ${address.city}`}
                                {address.pincode && ` - ${address.pincode}`}
                              </Typography>
                            </Box>
                            {selectedAddress === address._id && (
                              <Box
                                sx={{
                                  mt: 1,
                                  pt: 1,
                                  borderTop: '1px solid #E5E7EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Chip
                                  label="Selected"
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    backgroundColor: '#087F5B',
                                    color: '#fff',
                                    fontWeight: 700,
                                  }}
                                />
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddAddress}
                      sx={{
                        mt: 1,
                        borderColor: '#087F5B',
                        color: '#087F5B',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#075B43',
                          backgroundColor: 'rgba(8, 127, 91, 0.05)',
                        },
                      }}
                    >
                      Add New Address
                    </Button>
                  </>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Delivery Options Section */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                  }}
                >
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
                    {/* Today Delivery */}
                    <Card
                      sx={{
                        border: deliveryType === 'today' ? '2px solid #087F5B' : '1px solid #E5E7EB',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: deliveryType === 'today' ? 'rgba(8, 127, 91, 0.04)' : '#fff',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                        },
                      }}
                      onClick={() => {
                        setDeliveryType('today');
                        setDeliveryDate('');
                      }}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Radio
                            value="today"
                            size="small"
                            sx={{ p: 0, mr: 1, color: '#087F5B', '&.Mui-checked': { color: '#087F5B' } }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Today Delivery
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Get your order delivered today
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {/* Schedule Delivery */}
                    <Card
                      sx={{
                        border: deliveryType === 'schedule' ? '2px solid #087F5B' : '1px solid #E5E7EB',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: deliveryType === 'schedule' ? 'rgba(8, 127, 91, 0.04)' : '#fff',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                        },
                      }}
                      onClick={() => setDeliveryType('schedule')}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: deliveryType === 'schedule' ? 1.5 : 0 }}>
                          <Radio
                            value="schedule"
                            size="small"
                            sx={{ p: 0, mr: 1, color: '#087F5B', '&.Mui-checked': { color: '#087F5B' } }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Schedule Delivery
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Choose your preferred delivery date
                            </Typography>
                          </Box>
                        </Box>

                        {/* Date Picker - Only show when schedule is selected */}
                        {deliveryType === 'schedule' && (
                          <Box sx={{ ml: 4 }}>
                            <TextField
                              fullWidth
                              type="date"
                              size="small"
                              value={deliveryDate}
                              onChange={(e) => setDeliveryDate(e.target.value)}
                              InputLabelProps={{
                                shrink: true,
                              }}
                              inputProps={{
                                min: new Date(new Date().setDate(new Date().getDate() + 1))
                                  .toISOString()
                                  .split('T')[0], // Tomorrow onwards
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1.5,
                                },
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Stack>
                </RadioGroup>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              position: { md: 'sticky' },
              top: { md: 20 },
              backgroundColor: '#FFFFFF',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                }}
              >
                Payment Summary
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                    Total Orders:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', md: '0.875rem' } }}
                  >
                    {checkoutData.length}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.85rem', md: '0.875rem' } }}>
                    Total Items:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, fontSize: { xs: '0.85rem', md: '0.875rem' } }}
                  >
                    {checkoutData.reduce((total, order) => total + order.total_quantity, 0)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{
                  mb: 3,
                  p: { xs: 2, md: 2.5 },
                  borderRadius: '14px',
                  backgroundColor: '#087F5B',
                  boxShadow: '0 6px 20px rgba(8, 127, 91, 0.25)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.85)', mb: 0.5, fontSize: { xs: '0.75rem', md: '0.8rem' }, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Grand Total
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#fff',
                    fontSize: { xs: '1.75rem', md: '2rem' },
                  }}
                >
                  ₹ {calculateGrandTotal().toFixed(2)}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handlePay}
                disabled={isPayButtonDisabled}
                sx={{
                  backgroundColor: isPayButtonDisabled ? '#E5E7EB' : '#087F5B',
                  color: isPayButtonDisabled ? '#9CA3AF' : '#fff',
                  fontWeight: 700,
                  py: { xs: 1.5, md: 1.75 },
                  borderRadius: '12px',
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  textTransform: 'none',
                  boxShadow: isPayButtonDisabled ? 'none' : '0 6px 20px rgba(8, 127, 91, 0.35)',
                  transition: 'all 0.25s ease',
                  cursor: isPayButtonDisabled ? 'not-allowed' : 'pointer',
                  '&:hover': {
                    backgroundColor: isPayButtonDisabled ? '#E5E7EB' : '#075B43',
                    transform: isPayButtonDisabled ? 'none' : 'translateY(-2px)',
                    boxShadow: isPayButtonDisabled ? 'none' : '0 8px 24px rgba(8, 127, 91, 0.45)',
                  },
                  '&.Mui-disabled': {
                    color: '#9CA3AF',
                    backgroundColor: '#E5E7EB',
                  },
                }}
              >
                {isPayButtonDisabled ? 'Select Address to Pay' : 'Pay Now'}
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="medium"
                onClick={() => navigate('/vendors')}
                sx={{
                  mt: 2,
                  borderRadius: '12px',
                  borderColor: '#E5E7EB',
                  color: '#151515',
                  fontWeight: 600,
                  py: { xs: 1, md: 1.25 },
                  fontSize: { xs: '0.85rem', md: '0.9rem' },
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#087F5B',
                    color: '#087F5B',
                    backgroundColor: 'rgba(8, 127, 91, 0.05)',
                  },
                }}
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Address Dialog */}
      <AddressFormDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        onSubmit={handleSaveAddress}
        initialData={null}
        submitting={submittingAddress}
      />
    </Container>
  );
};

export default CartPage;
