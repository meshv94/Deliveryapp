import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingBag as CartIcon,
  People as PeopleIcon,
  Storefront as StoreIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Storefront as AddStoreIcon,
  PersonAdd as AddUserIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';

const G = {
  green: '#087F5B',
  lightGreen: '#EBFBEE',
  orange: '#FF6B00',
  blue: '#2563EB',
  navy: '#14213D',
  bg: '#F3F7FB',
  white: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
};

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

const StatusPill = ({ status }) => {
  const map = {
    pending: { label: 'Pending', bg: '#FEF3C7', color: '#D97706' },
    processing: { label: 'Processing', bg: '#DBEAFE', color: '#2563EB' },
    shipped: { label: 'Out for Delivery', bg: '#EDE9FE', color: '#7C3AED' },
    delivered: { label: 'Delivered', bg: '#DCFCE7', color: '#16A34A' },
    cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#DC2626' },
    active: { label: 'Active', bg: '#DCFCE7', color: '#16A34A' },
    inactive: { label: 'Inactive', bg: '#F1F5F9', color: '#64748B' },
  };
  const c = map[status?.toLowerCase()] || { label: status || 'Unknown', bg: '#F1F5F9', color: '#64748B' };
  return (
    <Chip
      label={c.label}
      size="small"
      sx={{
        backgroundColor: c.bg,
        color: c.color,
        fontWeight: 700,
        fontSize: '0.73rem',
        borderRadius: '8px',
        height: 24,
        px: 0.5,
      }}
    />
  );
};

const KpiCard = ({ title, value, icon, color, bgLight, subtitle, todayValue, todayLabel }) => (
  <Paper
    sx={{
      p: { xs: 2, sm: 2.5, md: 3 },
      borderRadius: '20px',
      backgroundColor: G.white,
      border: `1px solid ${G.border}`,
      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: G.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, fontWeight: 800, color: G.text, mt: 0.5, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '14px',
          backgroundColor: bgLight || G.lightGreen,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color || G.green,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Box>
    {todayValue !== undefined && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, pt: 1.5, borderTop: `1px solid ${G.border}` }}>
        <Chip label={`+${todayValue}`} size="small" sx={{ bgcolor: G.lightGreen, color: G.green, fontWeight: 800, fontSize: '0.72rem', height: 20, borderRadius: '6px' }} />
        <Typography sx={{ fontSize: '0.78rem', color: G.muted, fontWeight: 600 }}>{todayLabel || 'today'}</Typography>
      </Box>
    )}
  </Paper>
);

const MiniCard = ({ label, value, icon, iconBg, iconColor }) => (
  <Paper
    sx={{
      p: { xs: 1.5, sm: 2 },
      borderRadius: '16px',
      backgroundColor: G.white,
      border: `1px solid ${G.border}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    }}
  >
    <Box sx={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.75rem', color: G.muted, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Typography>
      <Typography sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' }, fontWeight: 800, color: G.text, lineHeight: 1.2 }}>{value}</Typography>
    </Box>
  </Paper>
);

const QuickActions = ({ navigate }) => {
  const actions = [
    { label: 'View Orders', path: '/orders', icon: <CartIcon sx={{ fontSize: 20 }} />, color: G.green, bg: G.lightGreen },
    { label: 'Manage Stores', path: '/vendors', icon: <AddStoreIcon sx={{ fontSize: 20 }} />, color: G.orange, bg: '#FFF3E8' },
    { label: 'Manage Customers', path: '/users', icon: <AddUserIcon sx={{ fontSize: 20 }} />, color: G.blue, bg: '#DBEAFE' },
    { label: 'Module Categories', path: '/modules', icon: <StoreIcon sx={{ fontSize: 20 }} />, color: '#7C3AED', bg: '#EDE9FE' },
  ];

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', mb: 3 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: G.text, mb: 2 }}>Quick Operations</Typography>
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {actions.map((a) => (
          <Grid item xs={6} sm={3} key={a.label}>
            <Box
              onClick={() => navigate(a.path)}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: '14px',
                border: `1px solid ${G.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                minHeight: 44,
                '&:hover': {
                  borderColor: a.color,
                  backgroundColor: a.bg,
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                },
              }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color }}>{a.icon}</Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: G.text, textAlign: 'center' }}>{a.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState('7days');
  const [revenueData, setRevenueData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDashboardOverview();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
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

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => { fetchRevenueStats(revenuePeriod); }, [revenuePeriod, fetchRevenueStats]);

  const { overview, today, topVendors, topProducts, topUsers, dailyOrders, recentOrders } = dashboardData || {};

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
  const periodTotalRevenue = revenueData?.totalRevenue !== undefined
    ? revenueData.totalRevenue
    : chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const periodTotalOrders = revenueData?.totalOrders !== undefined
    ? revenueData.totalOrders
    : chartData.reduce((sum, item) => sum + (item.count || 0), 0);

  const maxCount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.count || 0), 1) : 1;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} thickness={4} sx={{ color: G.green }} />
        <Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.9rem' }}>Loading marketplace data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: '14px', mb: 3 }} action={<Button color="inherit" size="small" onClick={fetchDashboardData}>Retry</Button>}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* -- Page Header with Date Filter Tabs */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.35rem', sm: '1.6rem', md: '1.75rem' }, color: G.text, letterSpacing: '-0.025em', lineHeight: 1.2 }}>Dashboard</Typography>
          <Typography sx={{ color: G.muted, fontSize: { xs: '0.82rem', sm: '0.9rem' }, fontWeight: 500, mt: 0.4 }}>Overview of your AapnuBazaar marketplace</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          <Box sx={{ display: 'flex', borderRadius: '12px', border: `1px solid ${G.border}`, overflow: 'hidden', backgroundColor: G.white, flexWrap: 'wrap', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            {DATE_RANGES.map((dr) => {
              const isSelected = revenuePeriod === dr.value;
              return (
                <Box
                  key={dr.value}
                  onClick={() => setRevenuePeriod(dr.value)}
                  sx={{
                    px: { xs: 1.4, sm: 2 },
                    py: 1,
                    fontSize: { xs: '0.75rem', sm: '0.82rem' },
                    fontWeight: 700,
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: isSelected ? G.white : G.text,
                    backgroundColor: isSelected ? G.green : 'transparent',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? G.green : '#F8FAFC',
                      color: isSelected ? G.white : G.green,
                    },
                  }}
                >
                  {dr.label}
                </Box>
              );
            })}
          </Box>
          <Tooltip title="Refresh marketplace data">
            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                backgroundColor: G.white,
                border: `1px solid ${G.border}`,
                borderRadius: '12px',
                p: 1,
                minWidth: 40,
                minHeight: 40,
                '&:hover': { backgroundColor: G.bg, borderColor: G.green },
              }}
            >
              <RefreshIcon sx={{ fontSize: 18, color: G.muted, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* -- Primary KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Total Revenue" value={formatCurrency(overview?.totalRevenue || 0)} icon={<MoneyIcon sx={{ fontSize: 26 }} />} color={G.orange} bgLight="#FFF3E8" todayValue={formatCurrency(today?.revenue || 0)} todayLabel="Today" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Total Orders" value={(overview?.totalOrders || 0).toLocaleString()} icon={<CartIcon sx={{ fontSize: 26 }} />} color={G.green} bgLight={G.lightGreen} todayValue={today?.orders || 0} todayLabel="Today" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Total Vendors" value={(overview?.totalVendors || 0).toLocaleString()} icon={<StoreIcon sx={{ fontSize: 26 }} />} color="#7C3AED" bgLight="#EDE9FE" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard title="Total Customers" value={(overview?.totalUsers || 0).toLocaleString()} icon={<PeopleIcon sx={{ fontSize: 26 }} />} color={G.blue} bgLight="#DBEAFE" />
        </Grid>
      </Grid>

      {/* -- Secondary Mini Metrics */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3.5 }}>
        <Grid item xs={6} sm={3}><MiniCard label="Pending Orders" value={overview?.pendingOrders || 0} icon={<PendingIcon sx={{ fontSize: 22 }} />} iconBg="#FEF3C7" iconColor="#D97706" /></Grid>
        <Grid item xs={6} sm={3}><MiniCard label="Delivered Orders" value={overview?.deliveredOrders || 0} icon={<CheckCircleIcon sx={{ fontSize: 22 }} />} iconBg="#DCFCE7" iconColor="#16A34A" /></Grid>
        <Grid item xs={6} sm={3}><MiniCard label="Cancelled Orders" value={overview?.cancelledOrders || 0} icon={<CancelIcon sx={{ fontSize: 22 }} />} iconBg="#FEE2E2" iconColor="#DC2626" /></Grid>
        <Grid item xs={6} sm={3}><MiniCard label="Today's Deliveries" value={today?.deliveries || 0} icon={<DeliveryIcon sx={{ fontSize: 22 }} />} iconBg={G.lightGreen} iconColor={G.green} /></Grid>
      </Grid>

      {/* -- Quick Actions */}
      <QuickActions navigate={navigate} />

      {/* -- Charts: Daily Orders + Top Vendors */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, sm: 3, md: 3.5 }, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Daily Orders & Revenue</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: G.muted, mt: 0.3 }}>
                  {selectedPeriodLabel} performance &bull; {periodTotalOrders} orders placed
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography sx={{ fontSize: '0.75rem', color: G.muted, fontWeight: 600 }}>{selectedPeriodLabel} Revenue</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: G.orange }}>{formatCurrency(periodTotalRevenue)}</Typography>
              </Box>
            </Box>
            <Box sx={{ minHeight: 280, position: 'relative' }}>
              {loadingRevenue && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 2, borderRadius: '12px' }}>
                  <CircularProgress size={32} sx={{ color: G.green }} />
                </Box>
              )}
              {chartData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {chartData.map((day, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.7, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 0.5, sm: 1 } }}>
                        <Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.82rem', minWidth: { xs: 50, sm: 60 } }}>{formatDate(day.date)}</Typography>
                        <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2 }, minWidth: { xs: 100, sm: 120 }, height: 10, bgcolor: G.border, borderRadius: '50px', overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.min(((day.count || 0) / maxCount) * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${G.green} 0%, #34D399 100%)`, borderRadius: '50px', transition: 'width 0.4s ease' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.82rem', minWidth: { xs: 'auto', sm: 120 }, textAlign: { xs: 'left', sm: 'right' } }}>
                          {day.count || 0} orders <span style={{ color: G.orange }}>({formatCurrency(day.revenue || 0)})</span>
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, flexDirection: 'column', gap: 1 }}>
                  <CartIcon sx={{ fontSize: 40, color: G.border }} />
                  <Typography sx={{ color: G.muted, fontSize: '0.9rem' }}>No order activity in this period</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: { xs: 2, sm: 3, md: 3.5 }, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Top Vendors</Typography>
              <Tooltip title="View all vendors"><IconButton size="small" onClick={() => navigate('/vendors')} sx={{ color: G.muted, minWidth: 36, minHeight: 36, '&:hover': { color: G.green } }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
            {topVendors && topVendors.length > 0 ? (
              <List disablePadding>
                {topVendors.map((vendor, index) => (
                  <React.Fragment key={vendor._id}>
                    <ListItem sx={{ px: 0, py: 1.4 }} secondaryAction={<Box sx={{ textAlign: 'right' }}><Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: G.green }}>{formatCurrency(vendor.totalRevenue)}</Typography><Typography sx={{ fontSize: '0.73rem', color: G.muted }}>{vendor.totalOrders} orders</Typography></Box>}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: index === 0 ? G.green : index === 1 ? G.orange : '#E2E8F0', color: index < 2 ? G.white : G.muted, width: 36, height: 36, fontSize: '0.85rem', fontWeight: 800, borderRadius: '10px' }}>{index + 1}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.87rem' }}>{vendor.name}</Typography>}
                        secondary={vendor.status ? <StatusPill status={vendor.status} /> : null}
                        secondaryTypographyProps={{ component: 'div', sx: { mt: 0.3 } }}
                      />
                    </ListItem>
                    {index < topVendors.length - 1 && <Divider sx={{ borderColor: '#F1F5F9' }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, flexDirection: 'column', gap: 1 }}>
                <StoreIcon sx={{ fontSize: 36, color: G.border }} />
                <Typography sx={{ color: G.muted, fontSize: '0.85rem' }}>No vendor data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* -- Top Products + Top Customers */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3, md: 3.5 }, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Top Products</Typography>
              <Tooltip title="View all products"><IconButton size="small" onClick={() => navigate('/products')} sx={{ color: G.muted, minWidth: 36, minHeight: 36, '&:hover': { color: G.green } }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 320 }}>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${G.border}`, color: G.muted, fontWeight: 700, fontSize: '0.78rem', py: 1.3, letterSpacing: '0.02em', whiteSpace: 'nowrap' } }}>
                    <TableCell>#</TableCell><TableCell>Product</TableCell><TableCell>Sold</TableCell><TableCell>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts && topProducts.length > 0 ? topProducts.map((product, index) => (
                    <TableRow key={product._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.4 } }}>
                      <TableCell><Chip label={`${index + 1}`} size="small" sx={{ bgcolor: G.lightGreen, color: G.green, fontWeight: 800, borderRadius: '8px', fontSize: '0.73rem', height: 22 }} /></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.85rem' }}>{product.name}</Typography></TableCell>
                      <TableCell><Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{product.totalQuantity} units</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 800, color: G.orange, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatCurrency(product.totalRevenue)}</Typography></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><Typography sx={{ color: G.muted, fontSize: '0.85rem' }}>No products data available</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: { xs: 2, sm: 3, md: 3.5 }, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Top Customers</Typography>
              <Tooltip title="View all customers"><IconButton size="small" onClick={() => navigate('/users')} sx={{ color: G.muted, minWidth: 36, minHeight: 36, '&:hover': { color: G.green } }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 320 }}>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${G.border}`, color: G.muted, fontWeight: 700, fontSize: '0.78rem', py: 1.3, letterSpacing: '0.02em', whiteSpace: 'nowrap' } }}>
                    <TableCell>#</TableCell><TableCell>Customer</TableCell><TableCell>Orders</TableCell><TableCell>Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUsers && topUsers.length > 0 ? topUsers.map((user, index) => (
                    <TableRow key={user._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.4 } }}>
                      <TableCell><Chip label={`${index + 1}`} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 800, borderRadius: '8px', fontSize: '0.73rem', height: 22 }} /></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.85rem' }}>{user.name}</Typography><Typography sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>{user.email}</Typography></TableCell>
                      <TableCell><Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{user.totalOrders}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 800, color: G.blue, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatCurrency(user.totalSpent)}</Typography></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}><Typography sx={{ color: G.muted, fontSize: '0.85rem' }}>No customer data available</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* -- Recent Orders */}
      <Paper sx={{ p: { xs: 2, sm: 3, md: 3.5 }, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Recent Orders</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: G.muted, mt: 0.3 }}>Latest {recentOrders?.length || 0} marketplace orders</Typography>
          </Box>
          <Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => navigate('/orders')} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', color: G.green, borderRadius: '10px', px: 1.8, py: 0.8, minHeight: 38, '&:hover': { backgroundColor: G.lightGreen } }}>View All Orders</Button>
        </Box>
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: `1px solid ${G.border}`, color: G.muted, fontWeight: 700, fontSize: '0.8rem', py: 1.6, letterSpacing: '0.02em', whiteSpace: 'nowrap', backgroundColor: '#FAFBFC' } }}>
                <TableCell>Order ID</TableCell><TableCell>Customer</TableCell><TableCell>Vendor</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell><TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentOrders && recentOrders.length > 0 ? recentOrders.map((order) => (
                <TableRow key={order._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.6 }, cursor: 'pointer', '&:hover': { backgroundColor: '#FAFCFF' } }}>
                  <TableCell><Typography sx={{ fontWeight: 700, color: G.blue, fontSize: '0.82rem', fontFamily: 'monospace', letterSpacing: '0.02em' }}>#{order._id.slice(-8).toUpperCase()}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.85rem' }}>{order.user?.name || 'N/A'}</Typography>{order.user?.email && <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>{order.user.email}</Typography>}</TableCell>
                  <TableCell><Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>{order.vendor?.name || 'N/A'}</Typography></TableCell>
                  <TableCell><Typography sx={{ fontWeight: 800, color: G.text, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{formatCurrency(order.total_payable_amount || 0)}</Typography></TableCell>
                  <TableCell><StatusPill status={order.status} /></TableCell>
                  <TableCell><Typography sx={{ color: G.muted, fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatDateFull(order.createdAt)}</Typography></TableCell>
                  <TableCell align="center"><Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/orders'); }} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: G.green, borderRadius: '8px', px: 1.5, py: 0.5, border: `1px solid ${G.border}`, minHeight: 32, '&:hover': { backgroundColor: G.lightGreen, borderColor: G.green } }}>View</Button></TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CartIcon sx={{ fontSize: 40, color: G.border, display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography sx={{ color: G.muted, fontSize: '0.9rem' }}>No recent orders</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard;
