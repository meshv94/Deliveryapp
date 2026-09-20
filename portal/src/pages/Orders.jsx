import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Stack,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as DeliveryIcon,
  ShoppingCart as OrderIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Store as StoreIcon,
  Email as EmailIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import orderService from '../services/orderService';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cancel dialog states
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    orderDate: '',
    deliveryDate: '',
  });

  // Statistics
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayDeliveries: 0,
    totalOrders: 0,
  });

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await orderService.getAllOrders(filters);

      if (response.success) {
        setOrders(response.data || []);
        calculateStats(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (ordersList) => {
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = ordersList.filter(
      (order) => new Date(order.createdAt).toISOString().split('T')[0] === today
    ).length;

    const todayDeliveries = ordersList.filter(
      (order) => order.deliveryDate && order.deliveryDate.split('T')[0] === today
    ).length;

    setStats({
      todayOrders,
      todayDeliveries,
      totalOrders: ordersList.length,
    });
  };

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const response = await orderService.getOrderById(orderId);

      if (response.success) {
        setOrderDetails(response.data);
      } else {
        setError(response.message || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle view order details
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setDetailsDialog(true);
    await fetchOrderDetails(order._id);
  };

  // Handle close details dialog
  const handleCloseDetails = () => {
    setDetailsDialog(false);
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle apply filters
  const handleApplyFilters = () => {
    fetchOrders();
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({
      orderDate: '',
      deliveryDate: '',
    });
    setTimeout(() => {
      fetchOrders();
    }, 100);
  };

  // Handle mark as delivered
  const handleMarkAsDelivered = async () => {
    if (!orderDetails) return;

    try {
      setProcessingAction(true);
      setError(null);

      const response = await orderService.markAsDelivered(orderDetails._id);

      if (response.success) {
        setSuccess('Order marked as delivered successfully');
        setDetailsDialog(false);
        fetchOrders();
        setOrderDetails(null);
      } else {
        setError(response.message || 'Failed to mark order as delivered');
      }
    } catch (err) {
      console.error('Error marking order as delivered:', err);
      setError(err.response?.data?.message || 'Failed to mark order as delivered');
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle open cancel dialog
  const handleOpenCancelDialog = () => {
    setCancelDialog(true);
  };

  // Handle close cancel dialog
  const handleCloseCancelDialog = () => {
    setCancelDialog(false);
    setCancelReason('');
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!orderDetails) return;

    if (!cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    try {
      setProcessingAction(true);
      setError(null);

      const response = await orderService.cancelOrder(orderDetails._id, cancelReason);

      if (response.success) {
        setSuccess('Order cancelled successfully');
        setCancelDialog(false);
        setDetailsDialog(false);
        fetchOrders();
        setOrderDetails(null);
        setCancelReason('');
      } else {
        setError(response.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessingAction(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'secondary',
      out_for_delivery: 'info',
      delivered: 'success',
      cancelled: 'error',
    };
    return statusColors[status] || 'default';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format date only
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ── Local search / filter state (client-side, complements server filters) ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Unique vendor names from loaded orders
  const vendorNames = [...new Set(orders.map((o) => o.vendor?.name).filter(Boolean))];

  // Status config
  const statusConfig = {
    pending:          { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B', label: 'Pending' },
    placed:           { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B', label: 'Placed' },
    confirmed:        { bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6', label: 'Confirmed' },
    preparing:        { bg: '#EDE9FE', color: '#6D28D9', dot: '#7C3AED', label: 'Preparing' },
    ready:            { bg: '#CFFAFE', color: '#0E7490', dot: '#06B6D4', label: 'Ready' },
    out_for_delivery: { bg: '#DBEAFE', color: '#1D4ED8', dot: '#2563EB', label: 'Out for Delivery' },
    delivered:        { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E', label: 'Delivered' },
    cancelled:        { bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444', label: 'Cancelled' },
  };

  const getStatusConfig = (status) => statusConfig[String(status).toLowerCase()] || { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8', label: status || 'Unknown' };

  // Client-side filter
  const filteredOrders = orders.filter((o) => {
    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      o._id?.toLowerCase().includes(s) ||
      o.user?.name?.toLowerCase().includes(s) ||
      o.user?.email?.toLowerCase().includes(s) ||
      o.vendor?.name?.toLowerCase().includes(s);
    const matchesStatus =
      statusFilter === 'all' || String(o.status).toLowerCase() === statusFilter;
    const matchesVendor =
      vendorFilter === 'all' || o.vendor?.name === vendorFilter;
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const paginatedOrders = filteredOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Count by status
  const pendingCount = orders.filter((o) => ['pending', 'placed', 'confirmed', 'preparing'].includes(String(o.status).toLowerCase())).length;
  const deliveredCount = orders.filter((o) => String(o.status).toLowerCase() === 'delivered').length;
  const cancelledCount = orders.filter((o) => String(o.status).toLowerCase() === 'cancelled').length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} thickness={4} sx={{ color: '#087F5B' }} />
        <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>Loading orders…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* ── Alerts ── */}
      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px' }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px' }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.45rem', md: '1.75rem' }, color: '#14213D', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Order Management
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 500, mt: 0.4 }}>
            Track and manage marketplace orders
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon sx={{ fontSize: '17px !important' }} />}
          onClick={fetchOrders}
          sx={{ borderColor: '#E2E8F0', color: '#64748B', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, px: 2.2, py: 1.1, textTransform: 'none', '&:hover': { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' } }}
        >
          Refresh
        </Button>
      </Box>

      {/* ── KPI Summary Chips ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {[
          { label: 'Total Orders', value: stats.totalOrders, bg: '#F1F5F9', color: '#475569', icon: <OrderIcon sx={{ fontSize: 15 }} />, filter: 'all' },
          { label: 'Today', value: stats.todayOrders, bg: '#DBEAFE', color: '#1D4ED8', icon: <CalendarIcon sx={{ fontSize: 15 }} />, filter: null },
          { label: 'Active', value: pendingCount, bg: '#FEF3C7', color: '#B45309', icon: <TimeIcon sx={{ fontSize: 15 }} />, filter: null },
          { label: 'Delivered', value: deliveredCount, bg: '#DCFCE7', color: '#15803D', icon: <CheckCircleIcon sx={{ fontSize: 15 }} />, filter: 'delivered' },
          { label: 'Cancelled', value: cancelledCount, bg: '#FEE2E2', color: '#B91C1C', icon: <CancelIcon sx={{ fontSize: 15 }} />, filter: 'cancelled' },
          { label: "Today's Deliveries", value: stats.todayDeliveries, bg: '#FFF4E6', color: '#FF6B00', icon: <DeliveryIcon sx={{ fontSize: 15 }} />, filter: null },
        ].map((c) => (
          <Box
            key={c.label}
            onClick={() => { if (c.filter !== null) { setStatusFilter(c.filter); setPage(1); } }}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.9, borderRadius: '50px', backgroundColor: (c.filter !== null && statusFilter === c.filter) ? c.bg : '#FFFFFF', color: (c.filter !== null && statusFilter === c.filter) ? c.color : '#64748B', border: `1.5px solid ${(c.filter !== null && statusFilter === c.filter) ? c.color + '50' : '#E2E8F0'}`, fontWeight: 700, fontSize: '0.82rem', cursor: c.filter !== null ? 'pointer' : 'default', transition: 'all 0.15s ease', '&:hover': c.filter !== null ? { backgroundColor: c.bg, color: c.color } : {} }}
          >
            {c.icon}
            {c.label}
            <Box sx={{ px: 0.9, py: 0.1, borderRadius: '6px', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '0.75rem', fontWeight: 800 }}>{c.value}</Box>
          </Box>
        ))}
      </Box>

      {/* ── Main Table Card ── */}
      <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(20,33,61,0.04)', backgroundColor: '#FFFFFF', p: { xs: 2, sm: 3.5 }, mb: 4 }}>

        {/* ── Toolbar ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: '#14213D', letterSpacing: '-0.02em' }}>All Orders</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.3 }}>{filteredOrders.length} results</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.8, py: 0.7, width: { xs: '100%', sm: 240 } }}>
              <OrderIcon sx={{ color: '#94A3B8', fontSize: 17, mr: 1 }} />
              <TextField
                variant="standard"
                placeholder="Search order / customer…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ disableUnderline: true, sx: { fontSize: '13px', fontWeight: 500, color: '#1E293B' } }}
                sx={{ width: '100%' }}
              />
            </Box>

            {/* Status filter */}
            <Box component="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.5, py: 0.85, fontSize: '13px', fontWeight: 600, color: '#64748B', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none', minWidth: 140, '&:hover': { borderColor: '#CBD5E1' } }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </Box>

            {/* Vendor filter */}
            {vendorNames.length > 0 && (
              <Box component="select" value={vendorFilter} onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.5, py: 0.85, fontSize: '13px', fontWeight: 600, color: '#64748B', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none', minWidth: 150, '&:hover': { borderColor: '#CBD5E1' } }}>
                <option value="all">All Vendors</option>
                {vendorNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </Box>
            )}

            {/* Date filters */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                type="date"
                size="small"
                label="Order Date"
                value={filters.orderDate}
                onChange={(e) => handleFilterChange('orderDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '13px' }, '& .MuiInputLabel-root': { fontSize: '12px' }, minWidth: 150 }}
              />
              <TextField
                type="date"
                size="small"
                label="Delivery Date"
                value={filters.deliveryDate}
                onChange={(e) => handleFilterChange('deliveryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '13px' }, '& .MuiInputLabel-root': { fontSize: '12px' }, minWidth: 150 }}
              />
              {(filters.orderDate || filters.deliveryDate) && (
                <Button size="small" onClick={handleApplyFilters} variant="contained" sx={{ backgroundColor: '#087F5B', borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2, py: 0.85, whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#075B43' } }}>Apply</Button>
              )}
              {(filters.orderDate || filters.deliveryDate) && (
                <Button size="small" onClick={handleResetFilters} variant="outlined" sx={{ borderColor: '#E2E8F0', color: '#64748B', borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 1.5, py: 0.85, '&:hover': { backgroundColor: '#F8FAFC' } }}>Reset</Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Table ── */}
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1.5px solid #F1F5F9', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.6, backgroundColor: '#FAFBFC', whiteSpace: 'nowrap' } }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Items</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <OrderIcon sx={{ fontSize: 48, color: '#E2E8F0', mb: 1.5, display: 'block', mx: 'auto' }} />
                    <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.95rem' }}>No orders found</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.5 }}>
                      {search ? `No results for "${search}"` : 'Orders will appear here once customers start placing them'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const sc = getStatusConfig(order.status);
                  return (
                    <TableRow key={order._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.6 }, '&:hover': { backgroundColor: '#FAFCFF' }, transition: 'background-color 0.12s ease' }}>
                      {/* Order ID */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '13px', color: '#2563EB', fontFamily: 'monospace' }}>
                          #{order._id?.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: '#EDE9FE', color: '#6D28D9', fontSize: '12px', fontWeight: 800 }}>
                            {(order.user?.name?.[0] || 'U').toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#14213D', lineHeight: 1.3 }}>
                              {order.user?.name || 'Guest'}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                              {order.user?.email || order.user?.mobile_number || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar src={order.vendor?.vendor_image} sx={{ width: 30, height: 30, borderRadius: '8px', backgroundColor: '#F1F5F9' }}>
                            <StoreIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                          </Avatar>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                            {order.vendor?.name || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Items */}
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.2, py: 0.3, borderRadius: '8px', backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '12px', fontWeight: 700 }}>
                          {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </Box>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: '#14213D' }}>
                          ₹{order.total_payable_amount?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>

                      {/* Payment */}
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.3, borderRadius: '8px', backgroundColor: order.payment_status === 'paid' ? '#DCFCE7' : '#FEF3C7', color: order.payment_status === 'paid' ? '#15803D' : '#B45309', fontSize: '11px', fontWeight: 700 }}>
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                          {order.payment_method ? `${order.payment_method} · ` : ''}{order.payment_status || 'pending'}
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.4, py: 0.4, borderRadius: '50px', backgroundColor: sc.bg, color: sc.color, fontSize: '12px', fontWeight: 700 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sc.dot }} />
                          {order.status?.replace(/_/g, ' ') || 'Pending'}
                        </Box>
                      </TableCell>

                      {/* Date */}
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{formatDateOnly(order.createdAt)}</Typography>
                        {order.delivery_date && (
                          <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>Del: {formatDateOnly(order.delivery_date)}</Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Tooltip title="View Order Details">
                          <IconButton size="small" onClick={() => handleViewOrder(order)} sx={{ color: '#2563EB', backgroundColor: '#EFF6FF', borderRadius: '10px', '&:hover': { backgroundColor: '#DBEAFE' } }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 3, pt: 2.5, borderTop: '1px solid #F1F5F9' }}>
          <Box sx={{ px: 2, py: 0.7, borderRadius: '50px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: 700 }}>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} · Page {page} of {totalPages}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', width: 34, height: 34, color: '#64748B', '&:disabled': { opacity: 0.35 } }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const n = start + i;
              if (n > totalPages) return null;
              return (
                <IconButton key={n} size="small" onClick={() => setPage(n)} sx={{ border: `1px solid ${n === page ? '#087F5B' : '#E2E8F0'}`, borderRadius: '10px', width: 34, height: 34, backgroundColor: n === page ? '#087F5B' : '#FFFFFF', color: n === page ? '#FFFFFF' : '#64748B', fontWeight: 700, fontSize: '13px', '&:hover': { backgroundColor: n === page ? '#075B43' : '#F8FAFC' } }}>
                  {n}
                </IconButton>
              );
            })}
            <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', width: 34, height: 34, backgroundColor: '#087F5B', color: '#FFFFFF', '&:hover': { backgroundColor: '#075B43' }, '&:disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' } }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ── Order Detail Dialog ─────────────────────────────────────────────── */}
      <Dialog open={detailsDialog} onClose={handleCloseDetails} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 0.5 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#14213D' }}>Order Details</Typography>
            {orderDetails && (
              <Typography sx={{ fontSize: '0.8rem', color: '#64748B', mt: 0.3 }}>
                #{orderDetails._id?.slice(-8).toUpperCase()} · {formatDate(orderDetails.createdAt)}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {orderDetails && (() => { const sc = getStatusConfig(orderDetails.status); return (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.5, borderRadius: '50px', backgroundColor: sc.bg, color: sc.color, fontSize: '12px', fontWeight: 700 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sc.dot }} />
                {orderDetails.status?.replace(/_/g, ' ') || 'Pending'}
              </Box>
            ); })()}
            <IconButton onClick={handleCloseDetails} size="small" sx={{ color: '#64748B', '&:hover': { backgroundColor: '#F1F5F9' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#F1F5F9', p: { xs: 2, sm: 3 } }}>
          {loadingDetails ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#087F5B' }} />
              <Typography sx={{ color: '#64748B', mt: 1.5, fontWeight: 600, fontSize: '0.9rem' }}>Loading order details…</Typography>
            </Box>
          ) : orderDetails ? (
            <Box>
              {/* ── Cancellation Alert ── */}
              {String(orderDetails.status).toLowerCase() === 'cancelled' && orderDetails.cancel_reason && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '13px', mb: 0.5 }}>Order Cancelled</Typography>
                  <Typography sx={{ fontSize: '13px' }}>{orderDetails.cancel_reason}</Typography>
                  {orderDetails.cancelled_at && (
                    <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.5 }}>Cancelled on: {formatDate(orderDetails.cancelled_at)}</Typography>
                  )}
                </Alert>
              )}

              {/* ── Customer + Order Info ── */}
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC', height: '100%' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Customer</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#EDE9FE', color: '#6D28D9', fontWeight: 800 }}>
                        {(orderDetails.user?.name?.[0] || 'U').toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#14213D' }}>{orderDetails.user?.name || 'N/A'}</Typography>
                        <Typography sx={{ fontSize: '12px', color: '#64748B' }}>{orderDetails.user?.email || ''}</Typography>
                      </Box>
                    </Box>
                    <Stack spacing={1}>
                      {orderDetails.user?.mobile_number && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
                          <Typography sx={{ fontSize: '13px', color: '#475569' }}>{orderDetails.user.mobile_number}</Typography>
                        </Box>
                      )}
                      {orderDetails.delivery_address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationIcon sx={{ fontSize: 15, color: '#94A3B8', mt: 0.3 }} />
                          <Typography sx={{ fontSize: '13px', color: '#475569' }}>
                            {orderDetails.delivery_address.address}
                            {orderDetails.delivery_address.city && `, ${orderDetails.delivery_address.city}`}
                            {orderDetails.delivery_address.pincode && ` - ${orderDetails.delivery_address.pincode}`}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC', height: '100%' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Order Info</Typography>
                    <Stack spacing={1.2}>
                      {[
                        { label: 'Order ID', value: `#${orderDetails._id?.slice(-8).toUpperCase()}` },
                        { label: 'Order Date', value: formatDate(orderDetails.createdAt) },
                        { label: 'Delivery Date', value: formatDateOnly(orderDetails.deliveryDate || orderDetails.delivery_date) },
                        { label: 'Payment Method', value: orderDetails.payment_method || '—' },
                        { label: 'Payment Status', value: orderDetails.payment_status || '—' },
                      ].map(({ label, value }) => (
                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600 }}>{label}</Typography>
                          <Typography sx={{ fontSize: '13px', color: '#14213D', fontWeight: 600 }}>{value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>

              {/* ── Vendor ── */}
              {orderDetails.vendor && (
                <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC', mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Vendor</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={orderDetails.vendor.vendor_image} sx={{ width: 48, height: 48, borderRadius: '14px', backgroundColor: '#F1F5F9' }}>
                      <StoreIcon sx={{ color: '#94A3B8' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#14213D' }}>{orderDetails.vendor.name}</Typography>
                      {orderDetails.vendor.email && <Typography sx={{ fontSize: '12px', color: '#64748B' }}>{orderDetails.vendor.email}</Typography>}
                      {orderDetails.vendor.mobile_number && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                          <Typography sx={{ fontSize: '12px', color: '#64748B' }}>{orderDetails.vendor.mobile_number}</Typography>
                        </Box>
                      )}
                    </Box>
                    {orderDetails.vendor.open_time && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: '8px', backgroundColor: '#EBFBEE', color: '#087F5B', fontSize: '12px', fontWeight: 700 }}>
                        <TimeIcon sx={{ fontSize: 13 }} />
                        {orderDetails.vendor.open_time} – {orderDetails.vendor.close_time}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* ── Order Items ── */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>Order Items</Typography>
                <Box sx={{ border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { backgroundColor: '#F8FAFC', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #F1F5F9' } }}>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetails.items?.map((item, idx) => (
                        <TableRow key={idx} sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.3 } }}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#14213D' }}>{item.product?.name || item.name || 'Unknown'}</Typography>
                            {item.product?.description && <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{item.product.description}</Typography>}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: '6px', backgroundColor: '#F1F5F9', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                              {item.quantity}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: item.special_price > 0 ? '#FF6B00' : '#14213D' }}>
                              ₹{item.special_price > 0 ? item.special_price.toFixed(2) : item.main_price?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#14213D' }}>₹{item.item_total?.toFixed(2) || '0.00'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* ── Price Breakdown ── */}
              <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>Price Breakdown</Typography>
                <Stack spacing={1.2}>
                  {[
                    { label: 'Subtotal', value: orderDetails.subtotal },
                    { label: 'Packaging Charge', value: orderDetails.packaging_charge },
                    { label: 'Delivery Charge', value: orderDetails.delivery_charge },
                    { label: 'Convenience Charge', value: orderDetails.convenience_charge },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13px', color: '#64748B' }}>{label}</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#14213D', fontWeight: 600 }}>₹{value?.toFixed(2) || '0.00'}</Typography>
                    </Box>
                  ))}
                  {orderDetails.discount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13px', color: '#64748B' }}>Discount</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#15803D', fontWeight: 700 }}>-₹{orderDetails.discount?.toFixed(2) || '0.00'}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '15px', fontWeight: 800, color: '#14213D' }}>Total Payable</Typography>
                    <Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#087F5B' }}>₹{orderDetails.total_payable_amount?.toFixed(2) || '0.00'}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ color: '#64748B', fontWeight: 600 }}>No details available</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseDetails} sx={{ borderRadius: '10px', color: '#64748B', fontWeight: 600, textTransform: 'none' }}>Close</Button>
          <Box sx={{ flex: 1 }} />
          {orderDetails && !['cancelled', 'delivered'].includes(String(orderDetails.status).toLowerCase()) && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleOpenCancelDialog}
                disabled={processingAction}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
              >
                Cancel Order
              </Button>
              <Button
                variant="contained"
                startIcon={processingAction ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                onClick={handleMarkAsDelivered}
                disabled={processingAction}
                sx={{ backgroundColor: '#087F5B', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#075B43' } }}
              >
                Mark as Delivered
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── Cancel Order Dialog ── */}
      <Dialog open={cancelDialog} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 0.5 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#14213D' }}>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748B', fontSize: '14px', mb: 2 }}>
            Please provide a reason for cancelling this order:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g., Out of stock, Customer request, etc."
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseCancelDialog} disabled={processingAction} sx={{ borderRadius: '10px', color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={processingAction || !cancelReason.trim()}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            {processingAction ? <CircularProgress size={20} color="inherit" /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Orders Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage all customer orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchOrders}
          sx={{
            background: '#0088FF',
            color: '#fff',
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Bento Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
              backgroundColor: '#FFFFFF',
              p: 1,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Total Orders
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1E293B', fontSize: { xs: '1.75rem', md: '2.1rem' } }}>
                    {stats.totalOrders}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EBF5FF', color: '#0088FF', width: 54, height: 54, borderRadius: '16px' }}>
                  <OrderIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
              backgroundColor: '#FFFFFF',
              p: 1,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Orders Placed Today
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1E293B', fontSize: { xs: '1.75rem', md: '2.1rem' } }}>
                    {stats.todayOrders}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#DCFCE7', color: '#16A34A', width: 54, height: 54, borderRadius: '16px' }}>
                  <TrendingUpIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: '24px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
              backgroundColor: '#FFFFFF',
              p: 1,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Deliveries for Today
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#1E293B', fontSize: { xs: '1.75rem', md: '2.1rem' } }}>
                    {stats.todayDeliveries}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FFF4E6', color: '#FF6B00', width: 54, height: 54, borderRadius: '16px' }}>
                  <DeliveryIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Bento */}
      <Paper
        sx={{
          p: 3,
          mb: 3.5,
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
          Filter Orders
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Order Date"
              type="date"
              size="small"
              value={filters.orderDate}
              onChange={(e) => handleFilterChange('orderDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Delivery Date"
              type="date"
              size="small"
              value={filters.deliveryDate}
              onChange={(e) => handleFilterChange('deliveryDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
              sx={{
                background: '#0088FF',
                borderRadius: '12px',
                py: 1,
                fontWeight: 700,
              }}
            >
              Apply Filters
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              sx={{
                borderRadius: '12px',
                py: 1,
                borderColor: '#E2E8F0',
                color: '#64748B',
                fontWeight: 700,
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '16px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Orders Table Bento */}
      <Paper
        sx={{
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid #F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '0.82rem', py: 2, px: 2.5, backgroundColor: '#FFFFFF' } }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={40} sx={{ color: '#0088FF' }} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500 }}>
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  let pillBg = '#F1F5F9';
                  let pillColor = '#475569';
                  let pillDot = '#94A3B8';
                  const st = String(order.status || '').toLowerCase();
                  if (st === 'delivered') {
                    pillBg = '#DCFCE7';
                    pillColor = '#15803D';
                    pillDot = '#22C55E';
                  } else if (st === 'pending' || st === 'confirmed' || st === 'preparing' || st === 'placed') {
                    pillBg = '#FEF3C7';
                    pillColor = '#B45309';
                    pillDot = '#F59E0B';
                  } else if (st === 'ready' || st === 'out_for_delivery') {
                    pillBg = '#EBF5FF';
                    pillColor = '#0088FF';
                    pillDot = '#0088FF';
                  } else if (st === 'cancelled') {
                    pillBg = '#FEE2E2';
                    pillColor = '#B91C1C';
                    pillDot = '#EF4444';
                  }

                  return (
                    <TableRow key={order._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 2, px: 2.5 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0088FF' }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {order.user?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {order.user?.email || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={order.vendor?.vendor_image} sx={{ width: 34, height: 34, borderRadius: '10px' }}>
                            <StoreIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {order.vendor?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>{formatDate(order.createdAt)}</TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>{formatDateOnly(order.delivery_date)}</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{order.items?.length || 0} items</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          ₹{order.total_payable_amount?.toFixed(2) || '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '50px',
                            backgroundColor: pillBg,
                            color: pillColor,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: pillDot }} />
                          {order.status?.replace(/_/g, ' ') || 'Pending'}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrder(order)}
                            sx={{
                              color: '#0088FF',
                              backgroundColor: '#EBF5FF',
                              borderRadius: '10px',
                              '&:hover': {
                                backgroundColor: '#D6EBFF',
                              },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Order Details
          </Typography>
          <IconButton onClick={handleCloseDetails} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orderDetails ? (
            <Box>
              {/* Order Info */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f7fa' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      Order Information
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          Order ID:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          #{orderDetails._id.slice(-8).toUpperCase()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          Order Date:
                        </Typography>
                        <Typography variant="body2">{formatDate(orderDetails.createdAt)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          Delivery Date:
                        </Typography>
                        <Typography variant="body2">{formatDateOnly(orderDetails.deliveryDate)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          Status:
                        </Typography>
                        <Chip
                          label={orderDetails.status}
                          size="small"
                          color={getStatusColor(orderDetails.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                      {orderDetails.status === 'Cancelled' && orderDetails.cancel_reason && (
                        <Box sx={{ mt: 2 }}>
                          <Alert severity="error" sx={{ borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                              Cancellation Reason:
                            </Typography>
                            <Typography variant="body2">{orderDetails.cancel_reason}</Typography>
                            {orderDetails.cancelled_at && (
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                Cancelled on: {formatDate(orderDetails.cancelled_at)}
                              </Typography>
                            )}
                          </Alert>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: '#f5f7fa' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      Customer Information
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{orderDetails.user?.name || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{orderDetails.user?.mobile_number || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                        <LocationIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
                        <Typography variant="body2">
                          {orderDetails.delivery_address?.address || 'N/A'}
                          {orderDetails.delivery_address?.city && `, ${orderDetails.delivery_address.city}`}
                          {orderDetails.delivery_address?.pincode && ` - ${orderDetails.delivery_address.pincode}`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Vendor Information */}
              {orderDetails.vendor && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0088FF' }}>
                    Vendor Information
                  </Typography>
                  <Paper
                    sx={{
                      p: 2.5,
                      backgroundColor: '#f5f7fa',
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Avatar
                        src={orderDetails.vendor.vendor_image}
                        sx={{ width: 56, height: 56 }}
                      >
                        <StoreIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {orderDetails.vendor.name || 'N/A'}
                        </Typography>
                        {orderDetails.vendor.email && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            {orderDetails.vendor.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Stack spacing={1.5}>
                      {orderDetails.vendor.mobile_number && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 18, color: '#0088FF' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {orderDetails.vendor.mobile_number}
                          </Typography>
                        </Box>
                      )}
                      {orderDetails.vendor.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationIcon sx={{ fontSize: 18, color: '#0088FF', mt: 0.2 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {orderDetails.vendor.address}
                          </Typography>
                        </Box>
                      )}
                      {(orderDetails.vendor.open_time || orderDetails.vendor.close_time) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon sx={{ fontSize: 18, color: '#0088FF' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {orderDetails.vendor.open_time || 'N/A'} - {orderDetails.vendor.close_time || 'N/A'}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>
              )}

              {/* Order Items */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Order Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetails.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product?.name || item.name || 'N/A'}</TableCell>
                          {/* <TableCell>₹{item.price?.toFixed(2) || '0.00'}</TableCell> */}
                          <TableCell>
                            ₹{
                              item.special_price > 0
                                ? item.special_price.toFixed(2)
                                : item.main_price?.toFixed(2) || "0.00"
                            }
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.item_total?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Price Breakdown */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Price Breakdown
                </Typography>
                <Paper sx={{ p: 2, backgroundColor: '#f5f7fa' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">
                        Subtotal:
                      </Typography>
                      <Typography variant="body2">₹{orderDetails.subtotal?.toFixed(2) || '0.00'}</Typography>
                    </Box>
                    {orderDetails.discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">
                          Discount:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          -₹{orderDetails.discount?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">
                        Packaging Charge:
                      </Typography>
                      <Typography variant="body2">₹{orderDetails.packaging_charge?.toFixed(2) || '0.00'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">
                        Delivery Charge:
                      </Typography>
                      <Typography variant="body2">₹{orderDetails.delivery_charge?.toFixed(2) || '0.00'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">
                        Convenience Charge:
                      </Typography>
                      <Typography variant="body2">₹{orderDetails.convenience_charge?.toFixed(2) || '0.00'}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Total Payable:
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0088FF' }}>
                        ₹{orderDetails.total_payable_amount?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              No details available
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleCloseDetails} color="inherit">
            Close
          </Button>
          <Box sx={{ flex: 1 }} />
          {orderDetails && orderDetails.status !== 'Cancelled' && orderDetails.status !== 'Delivered' && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleOpenCancelDialog}
                disabled={processingAction}
              >
                Cancel Order
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleMarkAsDelivered}
                disabled={processingAction}
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                }}
              >
                Mark as Delivered
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialog} onClose={handleCloseCancelDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Please provide a reason for cancelling this order:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g., Out of stock, Customer request, etc."
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={processingAction}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={processingAction || !cancelReason.trim()}
          >
            {processingAction ? <CircularProgress size={24} /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
