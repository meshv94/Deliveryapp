import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Skeleton,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Button,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ShoppingBagRounded as CartIcon,
  PeopleRounded as PeopleIcon,
  StorefrontRounded as StoreIcon,
  AccountBalanceWalletRounded as RevenueIcon,
  LocalShippingRounded as DeliveryIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
  HourglassEmptyRounded as PendingIcon,
  RefreshRounded as RefreshIcon,
  ArrowForwardRounded as ArrowForwardIcon,
  AddRounded as AddIcon,
  CategoryRounded as CategoryIcon,
  WarningAmberRounded as AlertIcon,
  TrendingUpRounded as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import { useColorMode } from '../theme/ThemeContext';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const DATE_RANGES = [
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: '90 Days', value: '90days' },
  { label: 'Year', value: '1year' },
];

const StatusBadge = ({ status }) => {
  const { BRAND } = useColorMode();
  const map = {
    placed: { label: 'Placed', bg: BRAND.amberLight, color: BRAND.amber },
    pending: { label: 'Pending', bg: BRAND.amberLight, color: BRAND.amber },
    processing: { label: 'Processing', bg: BRAND.lightBlue, color: BRAND.blue },
    shipped: { label: 'Out for Delivery', bg: BRAND.lightPurple, color: BRAND.purple },
    delivered: { label: 'Delivered', bg: BRAND.lightGreen, color: BRAND.green },
    cancelled: { label: 'Cancelled', bg: BRAND.redLight, color: BRAND.red },
    active: { label: 'Active', bg: BRAND.lightGreen, color: BRAND.green },
    inactive: { label: 'Inactive', bg: BRAND.innerCard, color: BRAND.muted },
  };
  const c = map[status?.toLowerCase()] || { label: status || 'Unknown', bg: BRAND.innerCard, color: BRAND.muted };
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.2,
        py: 0.35,
        borderRadius: '6px',
        backgroundColor: c.bg,
        color: c.color,
        fontWeight: 700,
        fontSize: '11.5px',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </Box>
  );
};

// =========================================================================
// 1. PRIMARY KPI CARD COMPONENT
// =========================================================================
const KpiCard = ({ title, value, icon: IconComponent, color, bgLight, trendBadge, subtitle, loading }) => {
  const { BRAND } = useColorMode();
  if (loading) {
    return (
      <Paper
        sx={{
          p: 2.5,
          borderRadius: '16px',
          backgroundColor: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ width: '60%' }}>
            <Skeleton variant="text" width="70%" height={18} />
            <Skeleton variant="text" width="90%" height={36} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '12px' }} />
        </Box>
        <Skeleton variant="text" width="50%" height={20} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: '16px',
        backgroundColor: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(20, 33, 61, 0.04)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: BRAND.muted,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.45rem', sm: '1.7rem', md: '1.85rem' },
              fontWeight: 800,
              color: BRAND.text,
              mt: 0.3,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            backgroundColor: bgLight || BRAND.lightGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color || BRAND.green,
            flexShrink: 0,
            ml: 1.5,
          }}
        >
          <IconComponent sx={{ fontSize: 22 }} />
        </Box>
      </Box>

      {/* Supporting context / trend */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, pt: 1, borderTop: `1px solid ${BRAND.bg}` }}>
        {trendBadge && (
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: '6px',
              backgroundColor: BRAND.lightGreen,
              color: BRAND.green,
              fontWeight: 700,
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.3,
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 13 }} />
            {trendBadge}
          </Box>
        )}
        <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      </Box>
    </Paper>
  );
};

// =========================================================================
// 2. OPERATIONAL STATUS ROW ITEM
// =========================================================================
const StatusMetricItem = ({ label, value, icon: IconComponent, color, bg, onClick }) => {
  const { BRAND } = useColorMode();
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: '12px',
        backgroundColor: BRAND.white,
        border: `1px solid ${BRAND.border}`,
        boxShadow: '0 2px 6px rgba(20, 33, 61, 0.02)',
        display: 'flex',
        alignItems: 'center',
        gap: 1.3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        '&:hover': onClick
          ? {
              borderColor: color,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(20, 33, 61, 0.05)',
            }
          : {},
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          backgroundColor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          flexShrink: 0,
        }}
      >
        <IconComponent sx={{ fontSize: 19 }} />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          sx={{
            fontSize: '11px',
            color: BRAND.muted,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: BRAND.text,
            lineHeight: 1.15,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
};

// =========================================================================
// 3. QUICK ACTIONS BAR
// =========================================================================
const QuickActionsBar = ({ navigate }) => {
  const { BRAND } = useColorMode();
  const actions = [
    { label: 'Add Product', path: '/products', icon: AddIcon, color: BRAND.green, bg: BRAND.lightGreen },
    { label: 'Add Vendor', path: '/vendors', icon: AddIcon, color: BRAND.orange, bg: BRAND.lightOrange },
    { label: 'View Orders', path: '/orders', icon: CartIcon, color: BRAND.blue, bg: BRAND.lightBlue },
    { label: 'Categories', path: '/modules', icon: CategoryIcon, color: BRAND.purple, bg: BRAND.lightPurple },
    { label: 'Customers', path: '/users', icon: PeopleIcon, color: BRAND.blue, bg: BRAND.lightBlue },
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '13px', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick Actions
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1.2,
          overflowX: 'auto',
          pb: 0.5,
          '::-webkit-scrollbar': { height: 4 },
          '::-webkit-scrollbar-thumb': { backgroundColor: BRAND.border, borderRadius: 4 },
        }}
      >
        {actions.map((act) => {
          const IconComp = act.icon;
          return (
            <Paper
              key={act.label}
              elevation={0}
              onClick={() => navigate(act.path)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 1,
                borderRadius: '10px',
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                boxShadow: '0 2px 6px rgba(20, 33, 61, 0.02)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: act.color,
                  backgroundColor: act.bg,
                  color: act.color,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '7px',
                  backgroundColor: act.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: act.color,
                }}
              >
                <IconComp sx={{ fontSize: 16 }} />
              </Box>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                {act.label}
              </Typography>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

// =========================================================================
// 4. MAIN DASHBOARD PAGE
// =========================================================================
const Dashboard = () => {
  const { BRAND, isDark } = useColorMode();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState('7days');
  const [revenueData, setRevenueData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDashboardOverview();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to fetch marketplace data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Unable to connect to marketplace server');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRevenueStats = useCallback(async (period) => {
    try {
      setLoadingRevenue(true);
      const response = await dashboardService.getRevenueStats(period);
      if (response.success) {
        setRevenueData(response.data);
      }
    } catch (err) {
      console.error('Revenue stats error:', err);
    } finally {
      setLoadingRevenue(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardData(), fetchRevenueStats(revenuePeriod)]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchRevenueStats(revenuePeriod);
  }, [revenuePeriod, fetchRevenueStats]);

  const { overview, today, topVendors, topProducts, topUsers, dailyOrders, hourlyDistribution, recentOrders } = dashboardData || {};

  // Compute peak hour stats
  const maxHourlyOrders = useMemo(() => {
    if (!hourlyDistribution || hourlyDistribution.length === 0) return 1;
    return Math.max(...hourlyDistribution.map((h) => h.orders), 1);
  }, [hourlyDistribution]);

  // Derive dynamic chartData according to selected date range
  const chartData = useMemo(() => {
    if (revenueData?.dailyStats && Array.isArray(revenueData.dailyStats)) {
      return revenueData.dailyStats;
    }
    if (Array.isArray(revenueData)) {
      return revenueData.map((r) => ({
        date: r.date || r._id,
        count: r.count || r.orders || 0,
        revenue: r.revenue || 0,
      }));
    }
    return dailyOrders || [];
  }, [revenueData, dailyOrders]);

  const selectedPeriodLabel = DATE_RANGES.find((d) => d.value === revenuePeriod)?.label || '7 Days';
  const periodTotalRevenue =
    revenueData?.totalRevenue !== undefined
      ? revenueData.totalRevenue
      : chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const periodTotalOrders =
    revenueData?.totalOrders !== undefined
      ? revenueData.totalOrders
      : chartData.reduce((sum, item) => sum + (item.count || item.orders || 0), 0);

  const maxCount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.count || d.orders || 0), 1) : 1;
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.revenue || 0), 1) : 1;

  if (error && !dashboardData) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Alert
          severity="error"
          sx={{ borderRadius: '14px', border: `1px solid ${BRAND.redLight}` }}
          action={
            <Button color="inherit" size="small" onClick={fetchDashboardData} sx={{ fontWeight: 700 }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', pb: 4 }}>
      {/* ======================================================== */}
      {/* 1. DASHBOARD HEADER + TIME RANGE FILTER */}
      {/* ======================================================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.6rem' },
              color: BRAND.text,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            Dashboard
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Monitor marketplace activity, orders and revenue
          </Typography>
        </Box>

        {/* Date Filter Segmented Controls + Refresh */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}
        >
          <Box
            sx={{
              display: 'flex',
              p: 0.4,
              borderRadius: '10px',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 2px 6px rgba(20, 33, 61, 0.02)',
            }}
          >
            {DATE_RANGES.map((dr) => {
              const isSelected = revenuePeriod === dr.value;
              return (
                <Box
                  key={dr.value}
                  onClick={() => setRevenuePeriod(dr.value)}
                  sx={{
                    px: { xs: 1.2, sm: 1.6 },
                    py: 0.6,
                    borderRadius: '7px',
                    fontSize: { xs: '0.72rem', sm: '0.78rem' },
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: isSelected ? '#FFFFFF' : BRAND.muted,
                    backgroundColor: isSelected ? BRAND.green : 'transparent',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      color: isSelected ? '#FFFFFF' : BRAND.text,
                    },
                  }}
                >
                  {dr.label}
                </Box>
              );
            })}
          </Box>

          <Tooltip title="Refresh data">
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                backgroundColor: BRAND.white,
                border: `1px solid ${BRAND.border}`,
                borderRadius: '10px',
                width: 36,
                height: 36,
                boxShadow: '0 2px 6px rgba(20, 33, 61, 0.02)',
                '&:hover': { backgroundColor: BRAND.bg, borderColor: BRAND.green },
              }}
            >
              <RefreshIcon
                sx={{
                  fontSize: 18,
                  color: BRAND.muted,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                }}
              />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ======================================================== */}
      {/* 2. PENDING ATTENTION BANNER (If pending orders exist) */}
      {/* ======================================================== */}
      {!loading && overview?.pendingOrders > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2.5,
            borderRadius: '12px',
            backgroundColor: BRAND.amberLight,
            border: `1px solid ${BRAND.borderOrange}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <AlertIcon sx={{ color: BRAND.amber, fontSize: 20 }} />
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.amber }}>
              {overview.pendingOrders} order{overview.pendingOrders > 1 ? 's' : ''} awaiting fulfillment and processing
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => navigate('/orders')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12px',
              color: BRAND.amber,
              backgroundColor: BRAND.white,
              borderRadius: '7px',
              px: 1.5,
              py: 0.4,
              border: `1px solid ${BRAND.borderOrange}`,
              '&:hover': { backgroundColor: BRAND.amberLight },
            }}
          >
            Review Orders &rarr;
          </Button>
        </Paper>
      )}

      {/* ======================================================== */}
      {/* 3. PRIMARY KPI METRICS (4 EQUAL CARDS) */}
      {/* ======================================================== */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 2 }}>
        {/* Total Revenue */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(overview?.totalRevenue || 0)}
            icon={RevenueIcon}
            color={BRAND.orange}
            bgLight={BRAND.lightOrange}
            trendBadge={today?.revenue ? `+${formatCurrency(today.revenue)}` : undefined}
            subtitle={today?.revenue ? 'Today' : 'Lifetime sales'}
            loading={loading}
          />
        </Grid>

        {/* Total Orders */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Total Orders"
            value={(overview?.totalOrders || 0).toLocaleString()}
            icon={CartIcon}
            color={BRAND.green}
            bgLight={BRAND.lightGreen}
            trendBadge={today?.orders ? `+${today.orders}` : undefined}
            subtitle={today?.orders ? 'Today' : 'Placed orders'}
            loading={loading}
          />
        </Grid>

        {/* Total Vendors */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Total Vendors"
            value={(overview?.totalVendors || 0).toLocaleString()}
            icon={StoreIcon}
            color={BRAND.purple}
            bgLight={BRAND.lightPurple}
            subtitle="Active partners"
            loading={loading}
          />
        </Grid>

        {/* Total Customers */}
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            title="Total Customers"
            value={(overview?.totalUsers || 0).toLocaleString()}
            icon={PeopleIcon}
            color={BRAND.blue}
            bgLight={BRAND.lightBlue}
            subtitle="Registered accounts"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ======================================================== */}
      {/* 4. OPERATIONAL STATUS MONITORING STRIP */}
      {/* ======================================================== */}
      <Grid container spacing={{ xs: 1.5, sm: 1.8 }} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatusMetricItem
            label="Pending Orders"
            value={overview?.pendingOrders || 0}
            icon={PendingIcon}
            color={BRAND.amber}
            bg={BRAND.amberLight}
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatusMetricItem
            label="Delivered Orders"
            value={overview?.deliveredOrders || 0}
            icon={CheckCircleIcon}
            color={BRAND.green}
            bg={BRAND.lightGreen}
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatusMetricItem
            label="Cancelled Orders"
            value={overview?.cancelledOrders || 0}
            icon={CancelIcon}
            color={BRAND.red}
            bg={BRAND.redLight}
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatusMetricItem
            label="Today's Deliveries"
            value={today?.deliveries || 0}
            icon={DeliveryIcon}
            color={BRAND.blue}
            bg={BRAND.lightBlue}
            onClick={() => navigate('/orders?tab=delivery')}
          />
        </Grid>
      </Grid>

      {/* ======================================================== */}
      {/* 5. QUICK ACTIONS */}
      {/* ======================================================== */}
      <QuickActionsBar navigate={navigate} />

      {/* ======================================================== */}
      {/* 6. MAIN ANALYTICS AREA (65% Chart / 35% Top Vendors) */}
      {/* ======================================================== */}
      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {/* Left 65%: Daily Orders & Revenue Data Visualization */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '16px',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Chart Title Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                  Daily Orders & Revenue
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
                  {selectedPeriodLabel} activity &bull; {periodTotalOrders} orders completed
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography sx={{ fontSize: '11px', color: BRAND.muted, fontWeight: 600 }}>
                  Period Revenue
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: BRAND.orange }}>
                  {formatCurrency(periodTotalRevenue)}
                </Typography>
              </Box>
            </Box>

            {/* Chart Container */}
            <Box sx={{ flexGrow: 1, minHeight: 260, position: 'relative' }}>
              {loadingRevenue && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? 'rgba(10,14,26,0.85)' : 'rgba(255,255,255,0.7)',
                    zIndex: 2,
                    borderRadius: '10px',
                  }}
                >
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: BRAND.green }}>
                    Updating analytics...
                  </Typography>
                </Box>
              )}

              {chartData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Legend */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: BRAND.green }} />
                      <Typography sx={{ fontSize: '11px', color: BRAND.muted, fontWeight: 600 }}>Orders Count</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: BRAND.orange }} />
                      <Typography sx={{ fontSize: '11px', color: BRAND.muted, fontWeight: 600 }}>Revenue Value</Typography>
                    </Box>
                  </Box>

                  {/* Visual Day Bars */}
                  {chartData.map((day, idx) => {
                    const countVal = day.count || day.orders || 0;
                    const revVal = day.revenue || 0;
                    const countPercent = Math.min((countVal / maxCount) * 100, 100);
                    const isHovered = hoveredIndex === idx;

                    return (
                      <Box
                        key={idx}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        sx={{
                          p: 0.8,
                          borderRadius: '8px',
                          backgroundColor: isHovered ? BRAND.paperHover : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: BRAND.muted, minWidth: 60 }}>
                            {formatDate(day.date)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.text }}>
                              {countVal} {countVal === 1 ? 'order' : 'orders'}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.orange }}>
                              {formatCurrency(revVal)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Dual Progress Bar Indicator */}
                        <Box sx={{ width: '100%', height: 7, bgcolor: BRAND.divider, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                          <Box
                            sx={{
                              width: `${Math.max(countPercent, countVal > 0 ? 4 : 0)}%`,
                              height: '100%',
                              backgroundColor: countVal > 0 ? BRAND.green : 'transparent',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, flexDirection: 'column', gap: 1 }}>
                  <CartIcon sx={{ fontSize: 32, color: BRAND.muted }} />
                  <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>
                    No order activity in this time range
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right 35%: Top Vendors Ranking */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '16px',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                Top Vendors
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                onClick={() => navigate('/vendors')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  color: BRAND.green,
                  p: 0,
                  minWidth: 0,
                  '&:hover': { backgroundColor: 'transparent', color: BRAND.darkGreen },
                }}
              >
                View All
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rounded" height={48} sx={{ borderRadius: '10px' }} />
                ))}
              </Box>
            ) : topVendors && topVendors.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {topVendors.map((vendor, idx) => (
                  <Box
                    key={vendor._id}
                    onClick={() => navigate('/vendors')}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.2,
                      borderRadius: '10px',
                      backgroundColor: BRAND.innerCard,
                      border: `1px solid ${BRAND.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: BRAND.green,
                        backgroundColor: BRAND.lightGreen,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '6px',
                          backgroundColor: idx === 0 ? BRAND.green : idx === 1 ? BRAND.orange : BRAND.border,
                          color: idx < 2 ? '#FFFFFF' : BRAND.muted,
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: BRAND.text,
                            fontSize: '12.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {vendor.name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                          {vendor.totalOrders || 0} orders
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '12.5px', color: BRAND.green, flexShrink: 0, pl: 1 }}>
                      {formatCurrency(vendor.totalRevenue || 0)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, flexDirection: 'column', gap: 1 }}>
                <StoreIcon sx={{ fontSize: 32, color: BRAND.muted }} />
                <Typography sx={{ color: BRAND.muted, fontSize: '12.5px' }}>
                  No vendor statistics available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ======================================================== */}
      {/* 7. RECENT ORDERS SECTION */}
      {/* ======================================================== */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '16px',
          backgroundColor: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
              Recent Orders
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              Latest {recentOrders?.length || 0} transactions placed on AapnuBazaar
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
            onClick={() => navigate('/orders')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12px',
              color: BRAND.green,
              p: 0,
              minWidth: 0,
              '&:hover': { backgroundColor: 'transparent', color: BRAND.darkGreen },
            }}
          >
            View All Orders
          </Button>
        </Box>

        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderBottom: `1px solid ${BRAND.border}`, color: BRAND.muted, fontWeight: 700, fontSize: '11px', py: 1.2, letterSpacing: '0.04em', textTransform: 'uppercase' } }}>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} sx={{ py: 1.5 }}>
                        <Skeleton variant="text" width="100%" height={24} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow
                      key={order._id}
                      hover
                      sx={{
                        '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.4 },
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: BRAND.tableHover },
                      }}
                      onClick={() => navigate('/orders')}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: BRAND.blue, fontSize: '12px', fontFamily: 'monospace' }}>
                          #{order._id.slice(-6).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: BRAND.text, fontSize: '12.5px' }}>
                          {order.user?.name || 'Customer'}
                        </Typography>
                        {order.user?.email && (
                          <Typography sx={{ color: BRAND.muted, fontSize: '11px' }}>
                            {order.user.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: BRAND.text, fontWeight: 600, fontSize: '12.5px' }}>
                          {order.vendor?.name || 'Marketplace Store'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, color: BRAND.text, fontSize: '13px' }}>
                          {formatCurrency(order.total_payable_amount || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: BRAND.muted, fontSize: '12px', fontWeight: 500 }}>
                          {formatDate(order.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/orders');
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            color: BRAND.green,
                            borderRadius: '6px',
                            px: 1.2,
                            py: 0.3,
                            border: `1px solid ${BRAND.border}`,
                            '&:hover': { backgroundColor: BRAND.lightGreen, borderColor: BRAND.green },
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CartIcon sx={{ fontSize: 32, color: BRAND.muted, display: 'block', mx: 'auto', mb: 0.5 }} />
                      <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No orders placed yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile Stacked Card View */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.2 }}>
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '10px' }} />)
          ) : recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <Paper
                key={order._id}
                elevation={0}
                onClick={() => navigate('/orders')}
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  backgroundColor: BRAND.innerCard,
                  border: `1px solid ${BRAND.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.8,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: BRAND.blue, fontSize: '12px', fontFamily: 'monospace' }}>
                    #{order._id.slice(-6).toUpperCase()}
                  </Typography>
                  <StatusBadge status={order.status} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: BRAND.text, fontSize: '13px' }}>
                      {order.vendor?.name || 'Marketplace Store'}
                    </Typography>
                    <Typography sx={{ color: BRAND.muted, fontSize: '11px' }}>
                      {order.user?.name || 'Customer'} &bull; {formatDate(order.createdAt)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: BRAND.text, fontSize: '13.5px' }}>
                    {formatCurrency(order.total_payable_amount || 0)}
                  </Typography>
                </Box>
              </Paper>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No orders placed yet</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* ======================================================== */}
      {/* 8. PEAK ORDERING HOURS (RUSH HOUR HEATMAP) */}
      {/* ======================================================== */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: '16px',
          backgroundColor: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
              Peak Ordering Hours & Rush Hour Trends
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              24-hour marketplace order frequency to help vendors prep kitchen capacity & staff
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              size="small"
              label="Lunch Peak: 12 PM - 2 PM"
              sx={{ bgcolor: BRAND.lightOrange, color: BRAND.orange, fontWeight: 700, fontSize: '11px' }}
            />
            <Chip
              size="small"
              label="Dinner Peak: 7 PM - 10 PM"
              sx={{ bgcolor: BRAND.lightGreen, color: BRAND.green, fontWeight: 700, fontSize: '11px' }}
            />
          </Box>
        </Box>

        {hourlyDistribution && hourlyDistribution.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(6, 1fr)', sm: 'repeat(12, 1fr)', md: 'repeat(24, 1fr)' },
              gap: 0.8,
              pt: 2,
              pb: 1,
            }}
          >
            {hourlyDistribution.map((slot) => {
              const heightPercent = Math.max((slot.orders / maxHourlyOrders) * 100, slot.orders > 0 ? 15 : 6);
              const isPeak = (slot.hour >= 12 && slot.hour <= 14) || (slot.hour >= 19 && slot.hour <= 22);

              return (
                <Tooltip
                  key={slot.hour}
                  title={`${slot.label}: ${slot.orders} orders (${formatCurrency(slot.revenue)})`}
                  arrow
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.8,
                      p: 0.5,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: BRAND.paperHover },
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: 90,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        bgcolor: BRAND.innerCard,
                        borderRadius: '6px',
                        p: '2px',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          borderRadius: '4px',
                          bgcolor: isPeak ? BRAND.orange : slot.orders > 0 ? BRAND.green : BRAND.border,
                          transition: 'height 0.4s ease',
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '9.5px',
                        fontWeight: isPeak ? 800 : 600,
                        color: isPeak ? BRAND.orange : BRAND.muted,
                      }}
                    >
                      {slot.hour}h
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography sx={{ color: BRAND.muted, fontSize: '12.5px' }}>
              Hourly analytics will populate as customer orders arrive
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ======================================================== */}
      {/* 9. TOP PRODUCTS & TOP CUSTOMERS COMPACT CARDS */}
      {/* ======================================================== */}
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '16px',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                Top Products
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                onClick={() => navigate('/products')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  color: BRAND.green,
                  p: 0,
                  minWidth: 0,
                  '&:hover': { backgroundColor: 'transparent', color: BRAND.darkGreen },
                }}
              >
                View Catalog
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${BRAND.border}`, color: BRAND.muted, fontWeight: 700, fontSize: '11px', py: 1 } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts && topProducts.length > 0 ? (
                    topProducts.map((product, idx) => (
                      <TableRow key={product._id} hover sx={{ '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.2 } }}>
                        <TableCell sx={{ width: 28 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '4px', bgcolor: BRAND.lightGreen, color: BRAND.green, fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {idx + 1}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: BRAND.text, fontSize: '12.5px' }}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: BRAND.muted, fontWeight: 600, fontSize: '12px' }}>
                            {product.totalQuantity} units
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 800, color: BRAND.orange, fontSize: '12.5px' }}>
                            {formatCurrency(product.totalRevenue)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>No product sales recorded</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Top Customers */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '16px',
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                Top Customers
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                onClick={() => navigate('/users')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  color: BRAND.green,
                  p: 0,
                  minWidth: 0,
                  '&:hover': { backgroundColor: 'transparent', color: BRAND.darkGreen },
                }}
              >
                View Directory
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${BRAND.border}`, color: BRAND.muted, fontWeight: 700, fontSize: '11px', py: 1 } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUsers && topUsers.length > 0 ? (
                    topUsers.map((user, idx) => (
                      <TableRow key={user._id} hover sx={{ '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.2 } }}>
                        <TableCell sx={{ width: 28 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '4px', bgcolor: BRAND.lightPurple, color: BRAND.purple, fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {idx + 1}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: BRAND.text, fontSize: '12.5px' }}>
                            {user.name}
                          </Typography>
                          {user.email && (
                            <Typography sx={{ color: BRAND.muted, fontSize: '10.5px' }}>
                              {user.email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ color: BRAND.muted, fontWeight: 600, fontSize: '12px' }}>
                            {user.totalOrders}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 800, color: BRAND.blue, fontSize: '12.5px' }}>
                            {formatCurrency(user.totalSpent)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>No customer data recorded</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
