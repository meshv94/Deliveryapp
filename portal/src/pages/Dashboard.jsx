import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Avatar, Chip, Stack, Divider,
  List, ListItem, ListItemAvatar, ListItemText,
  Button, Tooltip, IconButton,
} from '@mui/material';
import {
  Store as StoreIcon,
  ShoppingCart as CartIcon,
  LocalShipping as DeliveryIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Storefront as StorefrontIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  ArrowUpward as ArrowUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';

const G = {
  green: '#087F5B', greenDark: '#075B43', orange: '#FF6B00',
  blue: '#2563EB', bg: '#F3F7FB', white: '#FFFFFF',
  text: '#14213D', muted: '#64748B', border: '#E2E8F0', lightGreen: '#EBFBEE',
};

const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(1)}K`;
  return `\u20B9${n.toFixed(0)}`;
};

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const formatDateFull = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const StatusPill = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    delivered: { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
    pending: { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B' },
    placed: { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
    cancelled: { bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444' },
  };
  const st = map[s] || { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' };
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.4, py: 0.5, borderRadius: '50px', backgroundColor: st.bg, color: st.color, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: st.dot, flexShrink: 0 }} />
      {status}
    </Box>
  );
};

const KpiCard = ({ title, value, icon, color, bgLight, todayValue, todayLabel }) => (
  <Card sx={{ height: '100%', borderRadius: '18px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.07)' } }}>
    <CardContent sx={{ p: 2.8, '&:last-child': { pb: 2.8 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ width: 50, height: 50, borderRadius: '14px', backgroundColor: bgLight || `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </Box>
        {todayValue !== undefined && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.3, borderRadius: '8px', backgroundColor: G.lightGreen, color: G.green, fontSize: '0.72rem', fontWeight: 700 }}>
            <ArrowUpIcon sx={{ fontSize: 12 }} />Today
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: G.muted, mb: 0.5 }}>{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, color: G.text, letterSpacing: '-0.03em', fontSize: { xs: '1.5rem', md: '1.85rem' } }}>{value}</Typography>
      {todayValue !== undefined && (
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: G.muted, mt: 0.6 }}>
          {todayLabel}: <span style={{ color: G.green, fontWeight: 700 }}>{todayValue}</span>
        </Typography>
      )}
    </CardContent>
  </Card>
);

const MiniCard = ({ label, value, icon, iconBg, iconColor }) => (
  <Card sx={{ height: '100%', borderRadius: '16px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
    <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
      <Stack direction="row" alignItems="center" spacing={1.8}>
        <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 44, height: 44, borderRadius: '13px' }}>{icon}</Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: G.text, lineHeight: 1.2 }}>{value}</Typography>
          <Typography variant="caption" sx={{ color: G.muted, fontWeight: 600 }}>{label}</Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const DATE_RANGES = [
  { label: 'Today', value: '1day' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
];

const QuickActions = ({ navigate }) => {
  const actions = [
    { label: 'Add Vendor', icon: <StorefrontIcon sx={{ fontSize: 20 }} />, path: '/vendors', color: G.green, bg: G.lightGreen },
    { label: 'View Orders', icon: <CartIcon sx={{ fontSize: 20 }} />, path: '/orders', color: G.blue, bg: '#DBEAFE' },
    { label: 'Add Product', icon: <AddIcon sx={{ fontSize: 20 }} />, path: '/products', color: G.orange, bg: '#FFF3E8' },
    { label: 'Categories', icon: <CategoryIcon sx={{ fontSize: 20 }} />, path: '/modules', color: '#7C3AED', bg: '#EDE9FE' },
  ];
  return (
    <Paper sx={{ p: 3, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', mb: 3 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: G.text, mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={1.5}>
        {actions.map((a) => (
          <Grid item xs={6} sm={3} key={a.label}>
            <Box onClick={() => navigate(a.path)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 1.8, borderRadius: '14px', border: `1px solid ${G.border}`, cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { backgroundColor: a.bg, borderColor: a.color, transform: 'translateY(-2px)' } }}>
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
      const response = await dashboardService.getRevenueStats(period);
      if (response.success) setRevenueData(response.data);
    } catch (err) {
      console.error('Revenue stats error:', err);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => { fetchRevenueStats(revenuePeriod); }, [revenuePeriod, fetchRevenueStats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} thickness={4} sx={{ color: G.green }} />
        <Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.9rem' }}>Loading marketplace data…</Typography>
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

  const { overview, today, thisMonth, topVendors, topProducts, topUsers, dailyOrders, recentOrders } = dashboardData || {};
  const chartData = revenueData?.dailyStats || dailyOrders || [];
  const maxCount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.count || 0), 1) : 1;

  return (
    <Box>
      {/* -- Page Header */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.75rem' }, color: G.text, letterSpacing: '-0.025em', lineHeight: 1.2 }}>Dashboard</Typography>
          <Typography sx={{ color: G.muted, fontSize: '0.9rem', fontWeight: 500, mt: 0.4 }}>Overview of your AapnuBazaar marketplace</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Box sx={{ display: 'flex', borderRadius: '12px', border: `1px solid ${G.border}`, overflow: 'hidden', backgroundColor: G.white }}>
            {DATE_RANGES.map((dr) => (
              <Box key={dr.value} onClick={() => setRevenuePeriod(dr.value)} sx={{ px: 1.8, py: 1, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: revenuePeriod === dr.value ? G.white : G.muted, backgroundColor: revenuePeriod === dr.value ? G.green : 'transparent', transition: 'all 0.15s ease', '&:hover': { backgroundColor: revenuePeriod === dr.value ? G.green : G.bg, color: revenuePeriod === dr.value ? G.white : G.text } }}>
                {dr.label}
              </Box>
            ))}
          </Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} size="small" sx={{ backgroundColor: G.white, border: `1px solid ${G.border}`, borderRadius: '10px', p: 1, '&:hover': { backgroundColor: G.bg } }}>
              <RefreshIcon sx={{ fontSize: 18, color: G.muted, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* -- Primary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
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
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        <Grid item xs={6} sm={3}><MiniCard label="Pending Orders" value={overview?.pendingOrders || 0} icon={<PendingIcon sx={{ fontSize: 22 }} />} iconBg="#FEF3C7" iconColor="#D97706" /></Grid>
        <Grid item xs={6} sm={3}><MiniCard label="Delivered Orders" value={overview?.deliveredOrders || 0} icon={<CheckCircleIcon sx={{ fontSize: 22 }} />} iconBg="#DCFCE7" iconColor="#16A34A" /></Grid>
        <Grid item xs={6} sm={3}><MiniCard label="Cancelled Orders" value={overview?.cancelledOrders || 0} icon={<CancelIcon sx={{ fontSize: 22 }} />} iconBg="#FEE2E2" iconColor="#DC2626" /></Grid>
        <Grid item xs={6} sm={3}><MiniCard label="Today's Deliveries" value={today?.deliveries || 0} icon={<DeliveryIcon sx={{ fontSize: 22 }} />} iconBg={G.lightGreen} iconColor={G.green} /></Grid>
      </Grid>

      {/* -- Quick Actions */}
      <QuickActions navigate={navigate} />

      {/* -- Charts: Daily Orders + Top Vendors */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3.5, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Daily Orders & Revenue</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: G.muted, mt: 0.3 }}>{DATE_RANGES.find((d) => d.value === revenuePeriod)?.label} overview</Typography>
              </Box>
              {thisMonth && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: G.muted, fontWeight: 600 }}>This Month</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.orange }}>{formatCurrency(thisMonth?.revenue || 0)}</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ minHeight: 280 }}>
              {chartData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {chartData.map((day, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.7, alignItems: 'center' }}>
                        <Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.82rem', minWidth: 60 }}>{formatDate(day.date)}</Typography>
                        <Box sx={{ flexGrow: 1, mx: 2, height: 10, bgcolor: G.border, borderRadius: '50px', overflow: 'hidden' }}>
                          <Box sx={{ width: `${Math.min(((day.count || 0) / maxCount) * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${G.green} 0%, #34D399 100%)`, borderRadius: '50px', transition: 'width 0.4s ease' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.82rem', minWidth: 110, textAlign: 'right' }}>
                          {day.count || 0} orders&nbsp;<span style={{ color: G.orange }}>• {formatCurrency(day.revenue || 0)}</span>
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
          <Paper sx={{ p: 3.5, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Top Vendors</Typography>
              <Tooltip title="View all vendors"><IconButton size="small" onClick={() => navigate('/vendors')} sx={{ color: G.muted, '&:hover': { color: G.green } }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3.5, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Top Products</Typography>
              <Tooltip title="View all products"><IconButton size="small" onClick={() => navigate('/products')} sx={{ color: G.muted, '&:hover': { color: G.green } }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${G.border}`, color: G.muted, fontWeight: 700, fontSize: '0.78rem', py: 1.3, letterSpacing: '0.02em' } }}>
                    <TableCell>#</TableCell><TableCell>Product</TableCell><TableCell>Sold</TableCell><TableCell>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts && topProducts.length > 0 ? topProducts.map((product, index) => (
                    <TableRow key={product._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.4 } }}>
                      <TableCell><Chip label={`${index + 1}`} size="small" sx={{ bgcolor: G.lightGreen, color: G.green, fontWeight: 800, borderRadius: '8px', fontSize: '0.73rem', height: 22 }} /></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.85rem' }}>{product.name}</Typography></TableCell>
                      <TableCell><Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.82rem' }}>{product.totalQuantity} units</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 800, color: G.orange, fontSize: '0.85rem' }}>{formatCurrency(product.totalRevenue)}</Typography></TableCell>
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
          <Paper sx={{ p: 3.5, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Top Customers</Typography>
              <Tooltip title="View all customers"><IconButton size="small" onClick={() => navigate('/users')} sx={{ color: G.muted, '&:hover': { color: G.green } }}><OpenInNewIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1px solid ${G.border}`, color: G.muted, fontWeight: 700, fontSize: '0.78rem', py: 1.3, letterSpacing: '0.02em' } }}>
                    <TableCell>#</TableCell><TableCell>Customer</TableCell><TableCell>Orders</TableCell><TableCell>Spent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topUsers && topUsers.length > 0 ? topUsers.map((user, index) => (
                    <TableRow key={user._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.4 } }}>
                      <TableCell><Chip label={`${index + 1}`} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 800, borderRadius: '8px', fontSize: '0.73rem', height: 22 }} /></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 700, color: G.text, fontSize: '0.85rem' }}>{user.name}</Typography><Typography sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>{user.email}</Typography></TableCell>
                      <TableCell><Typography sx={{ color: G.muted, fontWeight: 600, fontSize: '0.82rem' }}>{user.totalOrders}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 800, color: G.blue, fontSize: '0.85rem' }}>{formatCurrency(user.totalSpent)}</Typography></TableCell>
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
      <Paper sx={{ p: 3.5, borderRadius: '20px', backgroundColor: G.white, border: `1px solid ${G.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: G.text }}>Recent Orders</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: G.muted, mt: 0.3 }}>Latest {recentOrders?.length || 0} marketplace orders</Typography>
          </Box>
          <Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => navigate('/orders')} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', color: G.green, borderRadius: '10px', px: 1.8, py: 0.8, '&:hover': { backgroundColor: G.lightGreen } }}>View All Orders</Button>
        </Box>
        <TableContainer>
          <Table>
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
                  <TableCell><Typography sx={{ fontWeight: 800, color: G.text, fontSize: '0.88rem' }}>&#x20B9;{(order.total_payable_amount || 0).toFixed(2)}</Typography></TableCell>
                  <TableCell><StatusPill status={order.status} /></TableCell>
                  <TableCell><Typography sx={{ color: G.muted, fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatDateFull(order.createdAt)}</Typography></TableCell>
                  <TableCell align="center"><Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/orders'); }} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', color: G.green, borderRadius: '8px', px: 1.5, py: 0.5, border: `1px solid ${G.border}`, '&:hover': { backgroundColor: G.lightGreen, borderColor: G.green } }}>View</Button></TableCell>
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
