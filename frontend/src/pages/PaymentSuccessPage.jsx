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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCartContext } from '../context/CartContext';
import apiClient from '../api/apiClient';
import confetti from 'canvas-confetti';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCartContext();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' or 'failed'
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setPaymentStatus('failed');
        setLoading(false);
        return;
      }

      try {
        // Get token
        const token = localStorage.getItem('authToken');
        if (!token) {
          navigate('/login');
          return;
        }

        // Verify payment with backend
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
          // Payment verified and order placed
          setPaymentStatus('success');

          // Clear cart from localStorage
          clearCart();

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

    verifyPayment();
  }, [searchParams, clearCart, navigate]);

  if (loading) {
    return (
      <Container sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#087F5B' }} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Processing your payment...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (paymentStatus === 'success') {
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
                  Payment Successful!
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
                  Your order has been successfully confirmed and sent to the store.
                </Typography>
              </Box>
            </Fade>

            {/* Confirmation Banner */}
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
                  Thank you for your payment! The shop is packing your items and will have them delivered soon.
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
                    boxShadow: '0 6px 20px rgba(8, 127, 91, 0.3)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      backgroundColor: '#075B43',
                      transform: 'translateY(-2px)',
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

  // Payment Failed
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
          {/* Error Icon */}
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
                  backgroundColor: '#E03131',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 28px rgba(224, 49, 49, 0.25)',
                }}
              >
                <ErrorOutlineIcon
                  sx={{
                    fontSize: { xs: 72, md: 88 },
                    color: '#FFFFFF',
                  }}
                />
              </Box>
            </Zoom>
          </Box>

          {/* Error Message */}
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
                Payment Failed
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
                Your payment could not be processed at this time.
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontWeight: 600 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Fade>

          {/* Action Buttons */}
          <Fade in timeout={1400} style={{ transitionDelay: '800ms' }}>
            <Stack spacing={2}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/cart')}
                sx={{
                  backgroundColor: '#087F5B',
                  color: '#fff',
                  fontWeight: 700,
                  px: { xs: 4, md: 5 },
                  py: { xs: 1.5, md: 2 },
                  borderRadius: '12px',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  textTransform: 'none',
                  boxShadow: '0 6px 20px rgba(8, 127, 91, 0.3)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    backgroundColor: '#075B43',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Try Again
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
};

export default PaymentSuccessPage;
