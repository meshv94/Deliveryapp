import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

// AapnuBazaar Brand Design Tokens
const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#055C41',
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
};

const WalletPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState(0); // 0: All, 1: Credits (Refunds), 2: Debits (Payments)

  const [walletData, setWalletData] = useState({
    currentBalance: 0,
    totalCredited: 0,
    totalDebited: 0,
    transactions: [],
    pagination: { total: 0, page: 1, limit: 20 },
  });

  // Fetch Wallet Data
  const fetchWallet = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      let typeParam = '';
      if (filterTab === 1) typeParam = '&type=CREDIT';
      if (filterTab === 2) typeParam = '&type=DEBIT';

      const res = await apiClient.get(`/app/wallet/ledger?page=1&limit=50${typeParam}`);

      if (res.success && res.data) {
        setWalletData(res.data);
      } else {
        setError(res.message || 'Could not load wallet data');
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError(err.response?.data?.message || 'Failed to connect to wallet server.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [filterTab]);

  // Format Date Helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ backgroundColor: BRAND.bgPage, minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        {/* Page Header */}
        <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <AccountBalanceWalletIcon sx={{ color: BRAND.primaryGreen, fontSize: 30 }} />
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '22px', sm: '28px' }, color: BRAND.textPrimary, letterSpacing: '-0.02em' }}>
                AapnuBazaar Wallet
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13.5px', color: BRAND.textSecondary, mt: 0.5 }}>
              Instant order cancellation refunds, 1-click checkout, and complete transaction ledger.
            </Typography>
          </Box>

          <Tooltip title="Refresh Wallet Balance">
            <IconButton
              onClick={() => fetchWallet(true)}
              disabled={refreshing || loading}
              sx={{
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                '&:hover': { backgroundColor: BRAND.lightGreen },
              }}
            >
              <RefreshIcon sx={{ color: BRAND.primaryGreen, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3.5}>
          {/* LEFT COLUMN: HERO BALANCE CARD & TRANSACTIONS */}
          <Grid item xs={12} md={7.5}>
            {/* 1. HERO BALANCE CARD */}
            <Card
              elevation={0}
              sx={{
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #087F5B 0%, #055C41 55%, #033B2A 100%)',
                color: '#ffffff',
                p: { xs: 2.5, sm: 3.5 },
                mb: 3.5,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 16px 36px rgba(8, 127, 91, 0.28)',
              }}
            >
              {/* Background Geometric Rings */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: '50%',
                  border: '32px solid rgba(255, 255, 255, 0.06)',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -60,
                  right: 80,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '24px solid rgba(255, 255, 255, 0.04)',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: '14px !important', color: '#ffffff !important' }} />}
                    label="AapnuBazaar Secure Wallet"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.18)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '11.5px',
                    }}
                  />
                  <Typography sx={{ fontSize: '12px', opacity: 0.85, fontWeight: 600 }}>
                    100% Usable at Checkout
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '13px', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available Wallet Balance
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.8 }}>
                  <Typography sx={{ fontSize: { xs: '34px', sm: '44px' }, fontWeight: 900, lineHeight: 1 }}>
                    ₹{(walletData.currentBalance || 0).toFixed(2)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.18)' }} />

                {/* Quick Stats Grid */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ArrowDownwardIcon sx={{ fontSize: 18, color: '#A7F3D0' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '11px', opacity: 0.8 }}>Total Refunded</Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 800 }}>
                          ₹{(walletData.totalCredited || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ArrowUpwardIcon sx={{ fontSize: 18, color: '#FECDD3' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '11px', opacity: 0.8 }}>Total Spent</Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 800 }}>
                          ₹{(walletData.totalDebited || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* 2. TRANSACTION HISTORY LEDGER */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: '20px',
                border: `1px solid ${BRAND.border}`,
                backgroundColor: BRAND.white,
                p: { xs: 2.5, sm: 3 },
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '17px', color: BRAND.textPrimary }}>
                  Transaction History & Ledger
                </Typography>

                {/* Filter Tabs */}
                <Tabs
                  value={filterTab}
                  onChange={(_, val) => setFilterTab(val)}
                  sx={{
                    minHeight: 36,
                    '& .MuiTabs-indicator': { backgroundColor: BRAND.primaryGreen, height: 3, borderRadius: '3px' },
                    '& .MuiTab-root': {
                      minHeight: 36,
                      py: 0.5,
                      px: 1.5,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      textTransform: 'none',
                      color: BRAND.textSecondary,
                      '&.Mui-selected': { color: BRAND.primaryGreen },
                    },
                  }}
                >
                  <Tab label="All" />
                  <Tab label="Refunds (Credits)" />
                  <Tab label="Order Payments" />
                </Tabs>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: BRAND.primaryGreen }} />
                </Box>
              ) : walletData.transactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <ReceiptLongIcon sx={{ fontSize: 44, color: '#D1D5DB', mb: 1.5 }} />
                  <Typography sx={{ fontSize: '15px', fontWeight: 700, color: BRAND.textPrimary, mb: 0.5 }}>
                    No Transactions Yet
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: BRAND.textSecondary, maxWidth: 360, mx: 'auto' }}>
                    When you receive order cancellation refunds or use wallet balance for purchases, your history will appear here.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {walletData.transactions.map((tx) => {
                    const isCredit = tx.type === 'CREDIT';
                    const isRefund = tx.category === 'ORDER_REFUND';

                    return (
                      <Box
                        key={tx._id}
                        sx={{
                          p: 1.8,
                          borderRadius: '14px',
                          border: `1px solid ${BRAND.border}`,
                          backgroundColor: isCredit ? '#F0FDF4' : BRAND.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            borderColor: BRAND.primaryGreen,
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                          },
                        }}
                      >
                        {/* Icon & Details */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '12px',
                              backgroundColor: isCredit ? BRAND.lightGreen : BRAND.redLight,
                              color: isCredit ? BRAND.primaryGreen : BRAND.red,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isCredit ? <ArrowDownwardIcon sx={{ fontSize: 20 }} /> : <ArrowUpwardIcon sx={{ fontSize: 20 }} />}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.textPrimary }}>
                                {isCredit ? 'Wallet Refund / Credit' : 'Order Payment (Debit)'}
                              </Typography>
                              <Chip
                                label={isRefund ? 'Cancellation Refund' : tx.category.replace('_', ' ')}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  backgroundColor: isCredit ? 'rgba(8, 127, 91, 0.15)' : 'rgba(224, 49, 49, 0.12)',
                                  color: isCredit ? BRAND.primaryGreen : BRAND.red,
                                }}
                              />
                            </Box>

                            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, mt: 0.2 }}>
                              {tx.description || (isCredit ? 'Amount credited' : 'Amount debited')}
                            </Typography>

                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF', mt: 0.2 }}>
                              {formatDateTime(tx.createdAt)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Amount & Balance */}
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography
                            sx={{
                              fontWeight: 900,
                              fontSize: '15px',
                              color: isCredit ? BRAND.primaryGreen : BRAND.textPrimary,
                            }}
                          >
                            {isCredit ? `+₹${tx.amount.toFixed(2)}` : `-₹${tx.amount.toFixed(2)}`}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary }}>
                            Bal: ₹{tx.balanceAfter.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* RIGHT COLUMN: HOW IT WORKS & QUICK ACTIONS */}
          <Grid item xs={12} md={4.5}>
            <Stack spacing={3}>
              {/* FAQ & VALUE PROPS CARD */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                  p: { xs: 2.5, sm: 3 },
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: '16px', color: BRAND.textPrimary, mb: 2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <HelpOutlineIcon sx={{ color: BRAND.primaryGreen, fontSize: 20 }} />
                  How AapnuBazaar Wallet Works
                </Typography>

                <Stack spacing={2.2}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: BRAND.lightGreen,
                        color: BRAND.primaryGreen,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: '13px',
                      }}
                    >
                      1
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.textPrimary }}>
                        Instant Cancellation Refunds
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, mt: 0.3, lineHeight: 1.4 }}>
                        If your order is cancelled by the merchant or system, 100% of your paid amount is instantly refunded directly to your wallet.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: BRAND.lightGreen,
                        color: BRAND.primaryGreen,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: '13px',
                      }}
                    >
                      2
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.textPrimary }}>
                        1-Click Checkout with Balance
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, mt: 0.3, lineHeight: 1.4 }}>
                        Use your wallet balance at checkout for zero OTP friction. If wallet covers 100%, order is confirmed in a single click!
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: BRAND.lightGreen,
                        color: BRAND.primaryGreen,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: '13px',
                      }}
                    >
                      3
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.textPrimary }}>
                        Hybrid & Split Payment Support
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary, mt: 0.3, lineHeight: 1.4 }}>
                        If order total exceeds your balance, apply available wallet balance and pay the rest smoothly via COD or Online Stripe.
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ShoppingBagOutlinedIcon />}
                  onClick={() => navigate('/modules')}
                  sx={{
                    backgroundColor: BRAND.primaryGreen,
                    color: '#ffffff',
                    fontWeight: 700,
                    borderRadius: '12px',
                    height: 44,
                    textTransform: 'none',
                    fontSize: '13.5px',
                    '&:hover': { backgroundColor: BRAND.darkGreen },
                  }}
                >
                  Start Shopping & Use Wallet
                </Button>
              </Card>

              {/* QUICK LINKS */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '16px',
                  border: `1px solid ${BRAND.border}`,
                  backgroundColor: BRAND.white,
                }}
              >
                <Button
                  fullWidth
                  onClick={() => navigate('/my-orders')}
                  endIcon={<ArrowForwardIosIcon sx={{ fontSize: '12px !important' }} />}
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    color: BRAND.textPrimary,
                    fontWeight: 700,
                    fontSize: '13.5px',
                    py: 1,
                  }}
                >
                  View My Orders
                </Button>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default WalletPage;
