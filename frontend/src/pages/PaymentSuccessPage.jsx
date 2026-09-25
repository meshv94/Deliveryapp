import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  CircularProgress,
  Zoom,
  Fade,
  Grow,
  Stack,
  Alert,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import apiClient from '../api/apiClient';
import confetti from 'canvas-confetti';

const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  orangeLight: '#FFF4E6',
  blue: '#1971C2',
  blueLight: '#E7F5FF',
  white: '#FFFFFF',
  bgPage: '#F7F9F8',
  textPrimary: '#17221D',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

const triggerConfetti = () => {
  const duration = 2500;
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
    const particleCount = 45 * (timeLeft / duration);
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
  }, 220);
};

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartContext();

  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('success'); // 'success' | 'failed'
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Extract order info from router state or search params
  const locationState = location.state || {};
  const sessionId = searchParams.get('session_id');
  const queryMethod = searchParams.get('method');
  const queryOrderId = searchParams.get('order_id');

  const [orderDetails, setOrderDetails] = useState({
    method: locationState.method || queryMethod || 'online',
    orderId: locationState.orderId || queryOrderId || '',
    totalAmount: locationState.totalAmount || 0,
    itemsCount: locationState.itemsCount || 0,
    deliveryType: locationState.deliveryType || 'today',
    deliveryDate: locationState.deliveryDate || '',
  });

  useEffect(() => {
    // 1. If coming from COD or Wallet placement (has location state or query method without session_id)
    if (!sessionId) {
      clearCart();
      setPaymentStatus('success');
      setLoading(false);
      triggerConfetti();
      return;
    }

    // 2. If coming from Stripe redirect with session_id
    const verifyStripePayment = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await apiClient.post(
          '/app/verify-stripe-payment',
          { sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response?.success) {
          clearCart();
          const carts = Array.isArray(response.data) ? response.data : [response.data];
          const firstCart = carts[0] || {};

          setOrderDetails((prev) => ({
            ...prev,
            method: 'online',
            orderId: firstCart._id || prev.orderId,
            totalAmount: carts.reduce((sum, c) => sum + (c.total_payable_amount || 0), 0),
          }));

          setPaymentStatus('success');
          triggerConfetti();
        } else {
          setPaymentStatus('failed');
          setError(response?.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setPaymentStatus('failed');
        setError(err.response?.data?.message || 'Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verifyStripePayment();
  }, [sessionId, clearCart, navigate]);

  const handleCopyOrderId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for Payment Method Badge
  const renderPaymentBadge = () => {
    const m = (orderDetails.method || '').toLowerCase();
    if (m === 'wallet') {
      return (
        <Chip
          icon={<AccountBalanceWalletIcon sx={{ fontSize: '16px !important', color: `${BRAND.primaryGreen} !important` }} />}
          label="100% Paid via AapnuBazaar Wallet"
          sx={{
            backgroundColor: BRAND.lightGreen,
            color: BRAND.primaryGreen,
            fontWeight: 800,
            fontSize: '12px',
            py: 0.5,
            px: 0.5,
            borderRadius: '999px',
            border: `1px solid rgba(8, 127, 91, 0.3)`,
          }}
        />
      );
    }
    if (m === 'cod') {
      return (
        <Chip
          icon={<PaymentsIcon sx={{ fontSize: '16px !important', color: `${BRAND.orange} !important` }} />}
          label="Cash on Delivery (Pay at Doorstep)"
          sx={{
            backgroundColor: BRAND.orangeLight,
            color: BRAND.orange,
            fontWeight: 800,
            fontSize: '12px',
            py: 0.5,
            px: 0.5,
            borderRadius: '999px',
            border: `1px solid rgba(255, 107, 0, 0.25)`,
          }}
        />
      );
    }
    return (
      <Chip
        icon={<CreditCardIcon sx={{ fontSize: '16px !important', color: `${BRAND.blue} !important` }} />}
        label="Paid Online (256-bit Stripe Secure)"
        sx={{
          backgroundColor: BRAND.blueLight,
          color: BRAND.blue,
          fontWeight: 800,
          fontSize: '12px',
          py: 0.5,
          px: 0.5,
          borderRadius: '999px',
          border: `1px solid rgba(25, 113, 194, 0.25)`,
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          backgroundColor: BRAND.bgPage,
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={56} thickness={4} sx={{ color: BRAND.primaryGreen }} />
          <Typography variant="body1" sx={{ mt: 2.5, color: BRAND.textSecondary, fontWeight: 600 }}>
            Confirming your order...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (paymentStatus === 'success') {
    const isWallet = orderDetails.method === 'wallet';
    const isCod = orderDetails.method === 'cod';

    return (
      <Box
        sx={{
          backgroundColor: BRAND.bgPage,
          minHeight: '90vh',
          py: { xs: 4, md: 7 },
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Zoom in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4.5 },
                borderRadius: '24px',
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
                textAlign: 'center',
              }}
            >
              {/* 1. ANIMATED CELEBRATION ICON */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 88, sm: 104 },
                  height: { xs: 88, sm: 104 },
                  margin: '0 auto',
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: BRAND.primaryGreen,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 32px rgba(8, 127, 91, 0.35)',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(8, 127, 91, 0.4)' },
                      '70%': { transform: 'scale(1.04)', boxShadow: '0 0 0 16px rgba(8, 127, 91, 0)' },
                      '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(8, 127, 91, 0)' },
                    },
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: { xs: 54, sm: 64 }, color: BRAND.white }} />
                </Box>
              </Box>

              {/* 2. SUCCESS HEADINGS */}
              <Fade in timeout={700}>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '1.65rem', sm: '2rem' },
                      color: BRAND.textPrimary,
                      letterSpacing: '-0.02em',
                      mb: 1,
                    }}
                  >
                    {isWallet
                      ? 'Order Placed with Wallet!'
                      : isCod
                      ? 'Order Placed Successfully!'
                      : 'Payment & Order Placed!'}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: '13.5px', sm: '15px' },
                      color: BRAND.textSecondary,
                      lineHeight: 1.5,
                      mb: 3,
                      maxWidth: '440px',
                      mx: 'auto',
                    }}
                  >
                    Your order has been sent to the store. The merchant is packing your items and a delivery rider will be assigned shortly.
                  </Typography>
                </Box>
              </Fade>

              {/* 3. ORDER DETAILS SUMMARY CARD */}
              <Grow in timeout={800}>
                <Box
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: '16px',
                    backgroundColor: '#F9FAFB',
                    border: `1px solid ${BRAND.border}`,
                    mb: 3.5,
                    textAlign: 'left',
                  }}
                >
                  <Stack spacing={1.6}>
                    {/* Payment Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      {renderPaymentBadge()}
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {/* Order ID */}
                    {orderDetails.orderId && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>Order ID</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Typography sx={{ fontSize: '13.5px', fontWeight: 800, fontFamily: 'monospace', color: BRAND.textPrimary }}>
                            #{orderDetails.orderId.slice(-8).toUpperCase()}
                          </Typography>
                          <Tooltip title={copied ? 'Copied!' : 'Copy ID'}>
                            <IconButton size="small" onClick={() => handleCopyOrderId(orderDetails.orderId)} sx={{ p: 0.3 }}>
                              <ContentCopyIcon sx={{ fontSize: 14, color: copied ? BRAND.primaryGreen : BRAND.textSecondary }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    )}

                    {/* Delivery Time */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: BRAND.primaryGreen }} />
                        <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary }}>Delivery</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.textPrimary }}>
                        {orderDetails.deliveryType === 'today' ? 'Today Delivery' : `Scheduled (${orderDetails.deliveryDate || 'Upcoming'})`}
                      </Typography>
                    </Box>

                    {/* Total Amount */}
                    {orderDetails.totalAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: `1px dashed ${BRAND.border}` }}>
                        <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: BRAND.textPrimary }}>Total Amount</Typography>
                        <Typography sx={{ fontSize: '16px', fontWeight: 900, color: BRAND.primaryGreen }}>
                          ₹{Number(orderDetails.totalAmount).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Grow>

              {/* 4. ACTION CTA BUTTONS */}
              <Fade in timeout={1000}>
                <Stack spacing={1.6}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/my-orders')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      backgroundColor: BRAND.primaryGreen,
                      color: '#ffffff',
                      fontWeight: 800,
                      py: 1.6,
                      borderRadius: '12px',
                      fontSize: '15px',
                      textTransform: 'none',
                      boxShadow: '0 6px 20px rgba(8, 127, 91, 0.3)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        backgroundColor: BRAND.darkGreen,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(8, 127, 91, 0.4)',
                      },
                    }}
                  >
                    Track Order & View Details
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/vendors')}
                    startIcon={<ShoppingBagOutlinedIcon />}
                    sx={{
                      borderColor: BRAND.border,
                      color: BRAND.textPrimary,
                      fontWeight: 700,
                      py: 1.4,
                      borderRadius: '12px',
                      fontSize: '14px',
                      textTransform: 'none',
                      backgroundColor: '#FFFFFF',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: BRAND.primaryGreen,
                        backgroundColor: BRAND.lightGreen,
                        color: BRAND.primaryGreen,
                      },
                    }}
                  >
                    Continue Shopping
                  </Button>
                </Stack>
              </Fade>
            </Paper>
          </Zoom>
        </Container>
      </Box>
    );
  }

  // Payment / Order Failed State
  return (
    <Box
      sx={{
        backgroundColor: BRAND.bgPage,
        minHeight: '85vh',
        py: { xs: 4, md: 8 },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Zoom in timeout={500}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: '24px',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#FFF5F5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 48, color: '#E03131' }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: BRAND.textPrimary, mb: 1 }}>
              Order Could Not Be Completed
            </Typography>

            <Typography sx={{ fontSize: '14px', color: BRAND.textSecondary, mb: 3 }}>
              There was an issue processing your order. Please try again.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontWeight: 600, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

            <Stack spacing={1.5}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => navigate('/cart')}
                sx={{
                  backgroundColor: BRAND.primaryGreen,
                  color: '#fff',
                  fontWeight: 700,
                  py: 1.4,
                  borderRadius: '12px',
                  textTransform: 'none',
                }}
              >
                Return to Cart
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={() => navigate('/vendors')}
                sx={{
                  borderColor: BRAND.border,
                  color: BRAND.textSecondary,
                  fontWeight: 600,
                  py: 1.3,
                  borderRadius: '12px',
                  textTransform: 'none',
                }}
              >
                Browse Stores
              </Button>
            </Stack>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default PaymentSuccessPage;
