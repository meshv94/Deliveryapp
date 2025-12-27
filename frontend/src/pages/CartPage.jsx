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
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  // Call checkout API and fetch addresses on page load
  useEffect(() => {
    const fetchCheckout = async () => {
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

    if (cart.length > 0) {
      fetchCheckout();
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
        // Auto-select newly added address
        if (response.data?._id) {
          setSelectedAddress(response.data._id);
        }
      }
    } catch (err) {
      console.error('Error saving address:', err);
      alert(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmittingAddress(false);
    }
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

      // Call place order API
      const response = await apiClient.post('/app/place-order', paymentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Handle successful response
      if (response?.success) {
        // Clear cart from localStorage
        clearCart();

        // Show success screen
        setOrderSuccess(true);

        // Trigger confetti animation
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        function randomInRange(min, max) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      } else {
        setError(response?.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Place order error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to place order. Please try again.'
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
          <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
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
              <Zoom in timeout={800} style={{ transitionDelay: '200ms' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 15px 50px rgba(76, 175, 80, 0.4)',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(1)',
                        boxShadow: '0 15px 50px rgba(76, 175, 80, 0.4)',
                      },
                      '50%': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 20px 60px rgba(76, 175, 80, 0.6)',
                      },
                      '100%': {
                        transform: 'scale(1)',
                        boxShadow: '0 15px 50px rgba(76, 175, 80, 0.4)',
                      },
                    },
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: { xs: 80, md: 100 },
                      color: '#fff',
                    }}
                  />
                </Box>
              </Zoom>
            </Box>

            {/* Success Message */}
            <Fade in timeout={1000} style={{ transitionDelay: '400ms' }}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    mb: 2,
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'slideUp 0.8s ease-out',
                    '@keyframes slideUp': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(20px)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                  }}
                >
                  Order Placed!
                </Typography>
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{
                    mb: 4,
                    fontSize: { xs: '1rem', md: '1.25rem' },
                    fontWeight: 500,
                  }}
                >
                  Your order has been successfully placed
                </Typography>
              </Box>
            </Fade>

            {/* Animated Decorative Elements */}
            <Grow in timeout={1200} style={{ transitionDelay: '600ms' }}>
              <Box
                sx={{
                  mb: 4,
                  py: 3,
                  px: 2,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '2px solid #bae6fd',
                }}
              >
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                    lineHeight: 1.8,
                  }}
                >
                  Thank you for your order! We're preparing your items and will have them delivered soon.
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    px: { xs: 4, md: 5 },
                    py: { xs: 1.5, md: 2 },
                    borderRadius: '12px',
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    textTransform: 'none',
                    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 15px 40px rgba(102, 126, 234, 0.5)',
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
                    borderColor: '#667eea',
                    color: '#667eea',
                    fontWeight: 600,
                    px: { xs: 4, md: 5 },
                    py: { xs: 1.5, md: 2 },
                    borderRadius: '12px',
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      backgroundColor: '#667eea10',
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
                width: { xs: 120, md: 160 },
                height: { xs: 120, md: 160 },
                margin: '0 auto',
                mb: 3,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: { xs: 60, md: 80 }, color: '#fff' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                mb: 2,
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.125rem' },
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
              Start exploring delicious food from our vendors!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/vendors')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontWeight: 600,
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 1.75 },
                borderRadius: '12px',
                fontSize: { xs: '0.9rem', md: '1rem' },
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                },
              }}
            >
              Browse Vendors
            </Button>
          </Box>
        </Fade>
      </Container>
    );
  }

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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
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

      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Left: Order Details */}
        <Grid item xs={12} md={8}>
          {checkoutData.map((order, orderIndex) => (
            <Fade in timeout={600} key={order._id}>
              <Card
                sx={{
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
                                color: '#667eea',
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
                          sx={{ color: '#4caf50', fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.875rem' } }}
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
                        p: { xs: 1.5, md: 2 },
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.125rem' } }}>
                        Total Payable:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
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

        {/* Right: Payment Summary */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              position: { md: 'sticky' },
              top: { md: 20 },
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
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
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5568d3',
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
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
                        scrollbarColor: '#667eea #f0f0f0',
                        '&::-webkit-scrollbar': {
                          height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: '#f0f0f0',
                          borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: '#667eea',
                          borderRadius: '10px',
                          '&:hover': {
                            backgroundColor: '#5568d3',
                          },
                        },
                      }}
                    >
                      {addresses.map((address) => (
                        <Card
                          key={address._id}
                          sx={{
                            minWidth: { xs: 240, md: 280 },
                            maxWidth: { xs: 240, md: 280 },
                            border: selectedAddress === address._id ? '2px solid #667eea' : '1px solid #e0e0e0',
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                            backgroundColor: selectedAddress === address._id ? 'rgba(102, 126, 234, 0.05)' : '#fff',
                            '&:hover': {
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                          onClick={() => setSelectedAddress(address._id)}
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
                                      backgroundColor: '#e8f5e9',
                                      color: '#2e7d32',
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
                                  borderTop: '1px solid #e0e0e0',
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
                                    backgroundColor: '#667eea',
                                    color: '#fff',
                                    fontWeight: 600,
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
                        mt: 2,
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5568d3',
                          backgroundColor: 'rgba(102, 126, 234, 0.05)',
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
                        border: deliveryType === 'today' ? '2px solid #667eea' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
                            sx={{ p: 0, mr: 1 }}
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
                        border: deliveryType === 'schedule' ? '2px solid #667eea' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                      onClick={() => setDeliveryType('schedule')}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: deliveryType === 'schedule' ? 1.5 : 0 }}>
                          <Radio
                            value="schedule"
                            size="small"
                            sx={{ p: 0, mr: 1 }}
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

              <Divider sx={{ mb: 3 }} />

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
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ color: '#fff', opacity: 0.9, mb: 1, fontSize: { xs: '0.75rem', md: '0.8rem' } }}
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
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  py: { xs: 1.5, md: 1.75 },
                  borderRadius: '12px',
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  textTransform: 'none',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(102, 126, 234, 0.5)',
                  },
                }}
              >
                Pay Now
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="medium"
                onClick={() => navigate('/vendors')}
                sx={{
                  mt: 2,
                  borderRadius: '12px',
                  borderColor: '#667eea',
                  color: '#667eea',
                  fontWeight: 600,
                  py: { xs: 1, md: 1.25 },
                  fontSize: { xs: '0.85rem', md: '0.9rem' },
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#667eea',
                    backgroundColor: '#667eea10',
                    transform: 'translateY(-2px)',
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
