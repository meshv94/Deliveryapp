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
  Drawer,
  Button,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Stack,
  Tooltip,
  Avatar,
  MenuItem,
  Select,
  FormControl,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
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
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
  DoneAll as DoneAllIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import orderService from '../services/orderService';
import vendorService from '../services/vendorService';
import { brandColors } from '../theme/tokens';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Drawer & Dialog states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status update state
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Cancel dialog states
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Quick Action Menu
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionOrder, setActionOrder] = useState(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [filters, setFilters] = useState({
    orderDate: '',
    deliveryDate: '',
  });

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Statistics
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    todayDeliveries: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  // Fetch initial data
  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAllVendors();
      if (response && response.success) {
        setVendorsList(response.data || []);
      }
    } catch (err) {
      console.warn('Could not load vendors list for filter:', err);
    }
  };

  // Fetch orders from API
  const fetchOrders = async (customFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await orderService.getAllOrders(customFilters);

      if (response.success) {
        const orderList = response.data || [];
        setOrders(orderList);

        if (response.stats) {
          setStats((prev) => ({
            ...prev,
            ...response.stats,
          }));
        } else {
          calculateStats(orderList);
        }
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

  // Calculate statistics locally if backend stats not available
  const calculateStats = (ordersList) => {
    const today = new Date().toISOString().split('T')[0];

    const todayOrders = ordersList.filter(
      (order) => order.createdAt && new Date(order.createdAt).toISOString().split('T')[0] === today
    ).length;

    const todayDeliveries = ordersList.filter(
      (order) => order.delivery_date && new Date(order.delivery_date).toISOString().split('T')[0] === today
    ).length;

    const pending = ordersList.filter((o) =>
      ['placed', 'pending', 'confirmed', 'processing', 'preparing'].includes(String(o.status || '').toLowerCase())
    ).length;

    const delivered = ordersList.filter((o) => String(o.status || '').toLowerCase() === 'delivered').length;
    const cancelled = ordersList.filter((o) => String(o.status || '').toLowerCase() === 'cancelled').length;

    const totalRevenue = ordersList
      .filter((o) => ['placed', 'delivered', 'confirmed', 'processing'].includes(String(o.status || '').toLowerCase()))
      .reduce((sum, o) => sum + (Number(o.total_payable_amount) || 0), 0);

    setStats({
      totalOrders: ordersList.length,
      todayOrders,
      todayDeliveries,
      pendingOrders: pending,
      deliveredOrders: delivered,
      cancelledOrders: cancelled,
      totalRevenue,
    });
  };

  // Fetch order details
  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const response = await orderService.getOrderById(orderId);

      if (response.success) {
        setOrderDetails(response.data);
        setNewStatus(response.data.status || '');
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

  // Handle open order details drawer
  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    await fetchOrderDetails(order._id);
  };

  // Handle close details drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
    setOrderDetails(null);
    setNewStatus('');
  };

  // Handle status update
  const handleUpdateStatus = async (orderId, targetStatus) => {
    const statusToApply = targetStatus || newStatus;
    if (!statusToApply) return;

    try {
      setUpdatingStatus(true);
      setError(null);

      const response = await orderService.updateOrderStatus(orderId, statusToApply);

      if (response.success) {
        setSuccess(`Order status updated to "${statusToApply}"`);
        if (orderDetails && orderDetails._id === orderId) {
          setOrderDetails(response.data);
          setNewStatus(response.data.status);
        }
        fetchOrders();
      } else {
        setError(response.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle mark as delivered
  const handleMarkAsDelivered = async (orderId) => {
    const id = orderId || orderDetails?._id;
    if (!id) return;

    try {
      setProcessingAction(true);
      setError(null);

      const response = await orderService.markAsDelivered(id);

      if (response.success) {
        setSuccess('Order marked as delivered successfully');
        if (orderDetails && orderDetails._id === id) {
          setOrderDetails(response.data);
          setNewStatus('Delivered');
        }
        fetchOrders();
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
  const handleOpenCancelDialog = (order = null) => {
    if (order) {
      setSelectedOrder(order);
    }
    setCancelDialog(true);
  };

  // Handle close cancel dialog
  const handleCloseCancelDialog = () => {
    setCancelDialog(false);
    setCancelReason('');
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    const targetOrder = orderDetails || selectedOrder;
    if (!targetOrder) return;

    if (!cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    try {
      setProcessingAction(true);
      setError(null);

      const response = await orderService.cancelOrder(targetOrder._id, cancelReason);

      if (response.success) {
        setSuccess('Order cancelled successfully');
        setCancelDialog(false);
        setCancelReason('');
        if (orderDetails && orderDetails._id === targetOrder._id) {
          setOrderDetails(response.data);
          setNewStatus('Cancelled');
        }
        fetchOrders();
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

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyServerFilters = () => {
    setPage(1);
    fetchOrders(filters);
  };

  const handleResetServerFilters = () => {
    const reset = { orderDate: '', deliveryDate: '' };
    setFilters(reset);
    setSearch('');
    setStatusFilter('all');
    setVendorFilter('all');
    setPage(1);
    fetchOrders(reset);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Status Badge Styling and Labels
  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'placed':
      case 'new':
      case 'pending':
        return {
          bg: '#FFF4E6',
          color: '#FF6B00',
          border: '#FFD8A8',
          dot: '#FF6B00',
          label: status === 'Placed' ? 'Placed' : status === 'New' ? 'New' : 'Pending',
        };
      case 'confirmed':
        return {
          bg: '#EFF6FF',
          color: '#2563EB',
          border: '#BFDBFE',
          dot: '#2563EB',
          label: 'Confirmed',
        };
      case 'processing':
      case 'preparing':
        return {
          bg: '#EDE9FE',
          color: '#6D28D9',
          border: '#DDD6FE',
          dot: '#7C3AED',
          label: 'Processing',
        };
      case 'ready':
      case 'out_for_delivery':
      case 'out for delivery':
        return {
          bg: '#CFFAFE',
          color: '#0E7490',
          border: '#A5F3FC',
          dot: '#06B6D4',
          label: 'Out for Delivery',
        };
      case 'delivered':
        return {
          bg: '#EBFBEE',
          color: '#087F5B',
          border: '#B2F2BB',
          dot: '#087F5B',
          label: 'Delivered',
        };
      case 'cancelled':
        return {
          bg: '#FEE2E2',
          color: '#EF4444',
          border: '#FECACA',
          dot: '#EF4444',
          label: 'Cancelled',
        };
      case 'refunded':
        return {
          bg: '#F1F5F9',
          color: '#475569',
          border: '#E2E8F0',
          dot: '#64748B',
          label: 'Refunded',
        };
      default:
        return {
          bg: '#F1F5F9',
          color: '#475569',
          border: '#E2E8F0',
          dot: '#94A3B8',
          label: status || 'Unknown',
        };
    }
  };

  // Distinct vendors for dropdown
  const vendorOptions = [
    ...new Map(
      [
        ...vendorsList.map((v) => ({ id: v._id, name: v.name })),
        ...orders.map((o) => o.vendor ? { id: o.vendor._id || o.vendor.name, name: o.vendor.name } : null).filter(Boolean),
      ].map((v) => [v.name, v])
    ).values(),
  ];

  // Client-side filtering across fields
  const filteredOrders = orders.filter((order) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (order._id && order._id.toLowerCase().includes(q)) ||
      (order.user?.name && order.user.name.toLowerCase().includes(q)) ||
      (order.user?.email && order.user.email.toLowerCase().includes(q)) ||
      (order.user?.mobile_number && order.user.mobile_number.toLowerCase().includes(q)) ||
      (order.user?.mobile && order.user.mobile.toLowerCase().includes(q)) ||
      (order.vendor?.name && order.vendor.name.toLowerCase().includes(q));

    const s = String(order.status || '').toLowerCase();
    const matchesStatus =
      statusFilter === 'all' ||
      s === statusFilter.toLowerCase() ||
      (statusFilter === 'pending' && ['pending', 'placed', 'new'].includes(s)) ||
      (statusFilter === 'processing' && ['processing', 'preparing'].includes(s)) ||
      (statusFilter === 'out_for_delivery' && ['out_for_delivery', 'out for delivery', 'ready'].includes(s));

    const matchesVendor =
      vendorFilter === 'all' ||
      order.vendor?.name === vendorFilter ||
      order.vendor?._id === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const paginatedOrders = filteredOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Status timeline steps helper
  const renderStatusTimeline = (order) => {
    const steps = [
      { key: 'Placed', label: 'Placed' },
      { key: 'Confirmed', label: 'Confirmed' },
      { key: 'Processing', label: 'Processing' },
      { key: 'Out for Delivery', label: 'Out for Delivery' },
      { key: 'Delivered', label: 'Delivered' },
    ];

    const currentStatus = String(order.status || '').toLowerCase();
    const isCancelled = currentStatus === 'cancelled';
    const isRefunded = currentStatus === 'refunded';

    if (isCancelled) {
      return (
        <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CancelIcon sx={{ color: '#EF4444', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 800, color: '#B91C1C', fontSize: '14px' }}>
              Order Cancelled
            </Typography>
          </Box>
          {order.cancel_reason && (
            <Typography sx={{ color: '#7F1D1D', fontSize: '13px', mt: 0.8 }}>
              Reason: <strong>{order.cancel_reason}</strong>
            </Typography>
          )}
          {order.cancelled_at && (
            <Typography sx={{ color: '#991B1B', fontSize: '11px', mt: 0.5 }}>
              Cancelled on: {formatDate(order.cancelled_at)}
            </Typography>
          )}
        </Box>
      );
    }

    if (isRefunded) {
      return (
        <Box sx={{ p: 2, borderRadius: '16px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', mb: 3 }}>
          <Typography sx={{ fontWeight: 800, color: '#475569', fontSize: '14px' }}>
            Order Refunded
          </Typography>
        </Box>
      );
    }

    // Determine current step index
    const statusMap = {
      new: 0,
      placed: 0,
      confirmed: 1,
      processing: 2,
      preparing: 2,
      ready: 3,
      out_for_delivery: 3,
      'out for delivery': 3,
      delivered: 4,
    };
    const activeIndex = statusMap[currentStatus] ?? 0;

    return (
      <Box sx={{ p: 2.5, borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
          Order Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <Box key={step.key} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCompleted ? '#087F5B' : '#FFFFFF',
                    color: isCompleted ? '#FFFFFF' : '#94A3B8',
                    border: `2px solid ${isCompleted ? '#087F5B' : '#CBD5E1'}`,
                    fontSize: '12px',
                    fontWeight: 800,
                    boxShadow: isCurrent ? '0 0 0 4px #EBFBEE' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCompleted ? (
                    idx < activeIndex ? <DoneAllIcon sx={{ fontSize: 16 }} /> : idx + 1
                  ) : (
                    idx + 1
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? 800 : isCompleted ? 600 : 500,
                    color: isCurrent ? '#087F5B' : isCompleted ? '#14213D' : '#94A3B8',
                    mt: 0.8,
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* ── Alerts ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* ── Page Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.45rem', md: '1.75rem' },
              color: brandColors.primaryText,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            Order Management
          </Typography>
          <Typography sx={{ color: brandColors.secondaryText, fontSize: '0.88rem', fontWeight: 500, mt: 0.4 }}>
            Track and manage marketplace orders.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon sx={{ fontSize: '18px !important' }} />}
          onClick={() => fetchOrders(filters)}
          disabled={loading}
          sx={{
            borderColor: brandColors.border,
            color: brandColors.secondaryText,
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            px: 2.4,
            py: 1.1,
            textTransform: 'none',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            '&:hover': {
              borderColor: brandColors.primaryGreen,
              color: brandColors.primaryGreen,
              backgroundColor: brandColors.lightGreen,
            },
          }}
        >
          Refresh Orders
        </Button>
      </Box>

      {/* ── KPI Summary Cards ── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {[
          {
            label: 'All Orders',
            value: stats.totalOrders || orders.length,
            bg: '#F1F5F9',
            color: '#475569',
            border: '#E2E8F0',
            icon: <OrderIcon sx={{ fontSize: 16 }} />,
            filterVal: 'all',
          },
          {
            label: 'Active / Pending',
            value: stats.pendingOrders || 0,
            bg: '#FFF4E6',
            color: '#FF6B00',
            border: '#FFD8A8',
            icon: <PendingIcon sx={{ fontSize: 16 }} />,
            filterVal: 'pending',
          },
          {
            label: 'Delivered',
            value: stats.deliveredOrders || 0,
            bg: '#EBFBEE',
            color: '#087F5B',
            border: '#B2F2BB',
            icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
            filterVal: 'delivered',
          },
          {
            label: 'Cancelled',
            value: stats.cancelledOrders || 0,
            bg: '#FEE2E2',
            color: '#EF4444',
            border: '#FECACA',
            icon: <CancelIcon sx={{ fontSize: 16 }} />,
            filterVal: 'cancelled',
          },
          {
            label: "Today's Orders",
            value: stats.todayOrders || 0,
            bg: '#EFF6FF',
            color: '#2563EB',
            border: '#BFDBFE',
            icon: <CalendarIcon sx={{ fontSize: 16 }} />,
            filterVal: null,
          },
          {
            label: "Today's Deliveries",
            value: stats.todayDeliveries || 0,
            bg: '#EDE9FE',
            color: '#6D28D9',
            border: '#DDD6FE',
            icon: <DeliveryIcon sx={{ fontSize: 16 }} />,
            filterVal: null,
          },
        ].map((item) => {
          const isSelected = item.filterVal !== null && statusFilter === item.filterVal;
          return (
            <Box
              key={item.label}
              onClick={() => {
                if (item.filterVal !== null) {
                  setStatusFilter(item.filterVal);
                  setPage(1);
                }
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.1,
                px: 2,
                py: 1,
                borderRadius: '50px',
                backgroundColor: isSelected ? item.bg : '#FFFFFF',
                color: isSelected ? item.color : brandColors.secondaryText,
                border: `1.5px solid ${isSelected ? item.border : brandColors.border}`,
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: item.filterVal !== null ? 'pointer' : 'default',
                boxShadow: isSelected ? `0 2px 10px ${item.border}` : '0 2px 4px rgba(20, 33, 61, 0.02)',
                transition: 'all 0.18s ease',
                '&:hover':
                  item.filterVal !== null
                    ? {
                        backgroundColor: item.bg,
                        color: item.color,
                        borderColor: item.border,
                        transform: 'translateY(-1px)',
                      }
                    : {},
              }}
            >
              {item.icon}
              {item.label}
              <Box
                sx={{
                  px: 0.9,
                  py: 0.15,
                  borderRadius: '12px',
                  backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9',
                  color: isSelected ? item.color : brandColors.primaryText,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  ml: 0.2,
                }}
              >
                {item.value}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ── Main Table Card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 4px 20px rgba(20,33,61,0.04)',
          backgroundColor: '#FFFFFF',
          p: { xs: 2, sm: 3 },
          mb: 4,
        }}
      >
        {/* ── Filter Bar ── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: brandColors.primaryText, letterSpacing: '-0.02em' }}>
                All Orders
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: brandColors.secondaryText, mt: 0.2 }}>
                Showing {filteredOrders.length} matching order{filteredOrders.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            {(filters.orderDate || filters.deliveryDate || search || statusFilter !== 'all' || vendorFilter !== 'all') && (
              <Button
                size="small"
                onClick={handleResetServerFilters}
                sx={{
                  color: brandColors.orange,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: brandColors.lightOrange },
                }}
              >
                Clear all filters
              </Button>
            )}
          </Box>

          <Grid container spacing={1.5} alignItems="center">
            {/* Search: Order ID / Customer / Vendor */}
            <Grid item xs={12} sm={6} md={3.5}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  border: `1px solid ${brandColors.border}`,
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.6,
                  transition: 'border-color 0.15s ease',
                  '&:focus-within': {
                    borderColor: brandColors.primaryGreen,
                    backgroundColor: '#FFFFFF',
                  },
                }}
              >
                <SearchIcon sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} />
                <TextField
                  variant="standard"
                  placeholder="Search order ID, customer, vendor…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    disableUnderline: true,
                    sx: { fontSize: '13px', fontWeight: 500, color: brandColors.primaryText },
                  }}
                  sx={{ width: '100%' }}
                />
                {search && (
                  <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.3 }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  displayEmpty
                  sx={{
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: brandColors.primaryText,
                    backgroundColor: '#F8FAFC',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: brandColors.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="placed">Placed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Vendor Filter */}
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <Select
                  value={vendorFilter}
                  onChange={(e) => {
                    setVendorFilter(e.target.value);
                    setPage(1);
                  }}
                  displayEmpty
                  sx={{
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: brandColors.primaryText,
                    backgroundColor: '#F8FAFC',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: brandColors.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  }}
                >
                  <MenuItem value="all">All Vendors</MenuItem>
                  {vendorOptions.map((v) => (
                    <MenuItem key={v.name} value={v.name}>
                      {v.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Order Date */}
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                type="date"
                size="small"
                fullWidth
                label="Order Date"
                value={filters.orderDate}
                onChange={(e) => handleFilterChange('orderDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '13px', backgroundColor: '#F8FAFC' },
                  '& .MuiInputLabel-root': { fontSize: '12px', fontWeight: 600 },
                }}
              />
            </Grid>

            {/* Delivery Date */}
            <Grid item xs={6} sm={3} md={1.7}>
              <TextField
                type="date"
                size="small"
                fullWidth
                label="Delivery Date"
                value={filters.deliveryDate}
                onChange={(e) => handleFilterChange('deliveryDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: '13px', backgroundColor: '#F8FAFC' },
                  '& .MuiInputLabel-root': { fontSize: '12px', fontWeight: 600 },
                }}
              />
            </Grid>

            {/* Apply Button */}
            <Grid item xs={12} sm={6} md={0.8}>
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={handleApplyServerFilters}
                sx={{
                  backgroundColor: brandColors.primaryGreen,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  py: 1,
                  fontSize: '12px',
                  '&:hover': { backgroundColor: brandColors.darkGreen },
                }}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* ── Table ── */}
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 950 }}>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    borderBottom: `1.5px solid ${brandColors.divider}`,
                    color: '#94A3B8',
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.8,
                    backgroundColor: '#FAFBFC',
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <TableCell>Order ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={36} sx={{ color: brandColors.primaryGreen, mb: 1.5 }} />
                    <Typography sx={{ color: brandColors.secondaryText, fontWeight: 600, fontSize: '0.9rem' }}>
                      Loading orders…
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <OrderIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5, display: 'block', mx: 'auto' }} />
                    <Typography sx={{ color: brandColors.primaryText, fontWeight: 700, fontSize: '1rem' }}>
                      No orders found
                    </Typography>
                    <Typography sx={{ color: brandColors.secondaryText, fontSize: '0.85rem', mt: 0.5 }}>
                      {search || statusFilter !== 'all' || vendorFilter !== 'all' || filters.orderDate || filters.deliveryDate
                        ? 'Try adjusting your search criteria or clearing filters'
                        : 'Orders placed by customers will appear here.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const isPaid = String(order.payment_status || '').toLowerCase() === 'paid';

                  return (
                    <TableRow
                      key={order._id}
                      hover
                      sx={{
                        '& td': { borderBottom: `1px solid ${brandColors.divider}`, py: 1.6 },
                        '&:hover': { backgroundColor: '#F8FAFC' },
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Order ID */}
                      <TableCell>
                        <Typography
                          onClick={() => handleViewOrder(order)}
                          sx={{
                            fontWeight: 800,
                            fontSize: '13px',
                            color: brandColors.blueAccent,
                            fontFamily: 'monospace',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          #{order._id?.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '10px',
                              backgroundColor: '#EDE9FE',
                              color: '#6D28D9',
                              fontSize: '12px',
                              fontWeight: 800,
                            }}
                          >
                            {(order.user?.name?.[0] || 'U').toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: brandColors.primaryText, lineHeight: 1.3 }}>
                              {order.user?.name || 'Guest User'}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: brandColors.secondaryText }}>
                              {order.user?.mobile_number || order.user?.mobile || order.user?.email || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={order.vendor?.vendor_image}
                            sx={{ width: 30, height: 30, borderRadius: '8px', backgroundColor: '#F1F5F9' }}
                          >
                            <StoreIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
                          </Avatar>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: brandColors.primaryText }}>
                            {order.vendor?.name || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Items */}
                      <TableCell>
                        <Tooltip
                          title={
                            order.items && order.items.length > 0
                              ? order.items.map((it) => `${it.quantity}x ${it.product?.name || it.name || 'Item'}`).join(', ')
                              : 'No items'
                          }
                        >
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.2,
                              py: 0.35,
                              borderRadius: '8px',
                              backgroundColor: '#F1F5F9',
                              color: brandColors.primaryText,
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: brandColors.primaryText }}>
                          ₹{Number(order.total_payable_amount || 0).toFixed(2)}
                        </Typography>
                      </TableCell>

                      {/* Payment */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.2,
                            py: 0.35,
                            borderRadius: '8px',
                            backgroundColor: isPaid ? '#DCFCE7' : '#FEF3C7',
                            color: isPaid ? '#15803D' : '#B45309',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                          {order.payment_method ? `${order.payment_method} · ` : ''}
                          {order.payment_status || 'Pending'}
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.4,
                            py: 0.45,
                            borderRadius: '50px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badge.dot }} />
                          {badge.label}
                        </Box>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', color: brandColors.primaryText, fontWeight: 600 }}>
                          {formatDateOnly(order.createdAt)}
                        </Typography>
                        {order.delivery_date && (
                          <Typography sx={{ fontSize: '11px', color: brandColors.secondaryText }}>
                            Del: {formatDateOnly(order.delivery_date)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                          <Tooltip title="View Order Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrder(order)}
                              sx={{
                                color: brandColors.blueAccent,
                                backgroundColor: brandColors.lightBlue,
                                borderRadius: '10px',
                                p: 0.8,
                                '&:hover': { backgroundColor: brandColors.borderBlue },
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setActionAnchorEl(e.currentTarget);
                                setActionOrder(order);
                              }}
                              sx={{
                                color: brandColors.secondaryText,
                                backgroundColor: '#F1F5F9',
                                borderRadius: '10px',
                                p: 0.8,
                                '&:hover': { backgroundColor: '#E2E8F0' },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Table Row Actions Menu ── */}
        <Menu
          anchorEl={actionAnchorEl}
          open={Boolean(actionAnchorEl)}
          onClose={() => {
            setActionAnchorEl(null);
            setActionOrder(null);
          }}
          PaperProps={{
            sx: {
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              border: `1px solid ${brandColors.border}`,
              minWidth: 180,
              py: 0.5,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              if (actionOrder) handleViewOrder(actionOrder);
              setActionAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <ViewIcon fontSize="small" sx={{ color: brandColors.blueAccent }} />
            </ListItemIcon>
            <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: '13px', fontWeight: 600 }} />
          </MenuItem>

          {actionOrder && !['delivered', 'cancelled'].includes(String(actionOrder.status || '').toLowerCase()) && (
            <MenuItem
              onClick={() => {
                const target = actionOrder;
                setActionAnchorEl(null);
                handleMarkAsDelivered(target._id);
              }}
            >
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" sx={{ color: brandColors.primaryGreen }} />
              </ListItemIcon>
              <ListItemText primary="Mark as Delivered" primaryTypographyProps={{ fontSize: '13px', fontWeight: 600 }} />
            </MenuItem>
          )}

          {actionOrder && !['delivered', 'cancelled'].includes(String(actionOrder.status || '').toLowerCase()) && (
            <MenuItem
              onClick={() => {
                const target = actionOrder;
                setActionAnchorEl(null);
                handleOpenCancelDialog(target);
              }}
            >
              <ListItemIcon>
                <CancelIcon fontSize="small" sx={{ color: brandColors.error }} />
              </ListItemIcon>
              <ListItemText primary="Cancel Order" primaryTypographyProps={{ fontSize: '13px', fontWeight: 600, color: brandColors.error }} />
            </MenuItem>
          )}
        </Menu>

        {/* ── Pagination ── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mt: 3,
            pt: 2.5,
            borderTop: `1px solid ${brandColors.divider}`,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 0.7,
              borderRadius: '50px',
              border: `1px solid ${brandColors.border}`,
              backgroundColor: '#FFFFFF',
              color: brandColors.secondaryText,
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} · Page {page} of {totalPages}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <IconButton
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{
                border: `1px solid ${brandColors.border}`,
                borderRadius: '10px',
                width: 34,
                height: 34,
                color: brandColors.secondaryText,
                '&:disabled': { opacity: 0.35 },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const n = start + i;
              if (n > totalPages) return null;
              const isCurr = n === page;
              return (
                <IconButton
                  key={n}
                  size="small"
                  onClick={() => setPage(n)}
                  sx={{
                    border: `1px solid ${isCurr ? brandColors.primaryGreen : brandColors.border}`,
                    borderRadius: '10px',
                    width: 34,
                    height: 34,
                    backgroundColor: isCurr ? brandColors.primaryGreen : '#FFFFFF',
                    color: isCurr ? '#FFFFFF' : brandColors.secondaryText,
                    fontWeight: 700,
                    fontSize: '13px',
                    '&:hover': {
                      backgroundColor: isCurr ? brandColors.darkGreen : '#F8FAFC',
                    },
                  }}
                >
                  {n}
                </IconButton>
              );
            })}

            <IconButton
              size="small"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              sx={{
                border: `1px solid ${brandColors.border}`,
                borderRadius: '10px',
                width: 34,
                height: 34,
                backgroundColor: page >= totalPages ? '#F8FAFC' : brandColors.primaryGreen,
                color: page >= totalPages ? '#94A3B8' : '#FFFFFF',
                '&:hover': { backgroundColor: brandColors.darkGreen },
                '&:disabled': { opacity: 0.35, backgroundColor: '#F8FAFC', color: '#94A3B8' },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ── Order Detail Drawer ─────────────────────────────────────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 540, md: 620 },
            p: 0,
            backgroundColor: '#FFFFFF',
            boxShadow: '-10px 0 40px rgba(20, 33, 61, 0.08)',
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${brandColors.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAFBFC',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText, letterSpacing: '-0.02em' }}>
                Order Details
              </Typography>
              {orderDetails && (() => {
                const badge = getStatusBadge(orderDetails.status);
                return (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1.4,
                      py: 0.3,
                      borderRadius: '50px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: badge.dot }} />
                    {badge.label}
                  </Box>
                );
              })()}
            </Box>
            {orderDetails && (
              <Typography sx={{ fontSize: '0.8rem', color: brandColors.secondaryText, mt: 0.3 }}>
                #{orderDetails._id?.slice(-8).toUpperCase()} · Placed on {formatDate(orderDetails.createdAt)}
              </Typography>
            )}
          </Box>

          <IconButton onClick={handleCloseDrawer} size="small" sx={{ color: brandColors.secondaryText, '&:hover': { backgroundColor: '#F1F5F9' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Drawer Content */}
        <Box sx={{ p: { xs: 2.5, sm: 3.5 }, overflowY: 'auto', flex: 1 }}>
          {loadingDetails ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress sx={{ color: brandColors.primaryGreen }} />
              <Typography sx={{ color: brandColors.secondaryText, mt: 1.5, fontWeight: 600, fontSize: '0.9rem' }}>
                Loading order details…
              </Typography>
            </Box>
          ) : orderDetails ? (
            <Box>
              {/* Timeline Progress */}
              {renderStatusTimeline(orderDetails)}

              {/* Status Update Bar (Only if not cancelled/refunded) */}
              {orderDetails.status !== 'Cancelled' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    backgroundColor: '#F8FAFC',
                    border: `1px solid ${brandColors.border}`,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: brandColors.secondaryText, textTransform: 'uppercase' }}>
                      Update Status
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: brandColors.primaryText }}>
                      Change order progression
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Select
                      size="small"
                      value={newStatus || orderDetails.status || ''}
                      onChange={(e) => setNewStatus(e.target.value)}
                      sx={{
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        backgroundColor: '#FFFFFF',
                        minWidth: 150,
                      }}
                    >
                      <MenuItem value="Placed">Placed</MenuItem>
                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                      <MenuItem value="Processing">Processing</MenuItem>
                      <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                      <MenuItem value="Delivered">Delivered</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>

                    <Button
                      variant="contained"
                      size="small"
                      disabled={updatingStatus || newStatus === orderDetails.status}
                      onClick={() => handleUpdateStatus(orderDetails._id, newStatus)}
                      sx={{
                        backgroundColor: brandColors.primaryGreen,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.85,
                        px: 2,
                        '&:hover': { backgroundColor: brandColors.darkGreen },
                      }}
                    >
                      {updatingStatus ? <CircularProgress size={16} color="inherit" /> : 'Save'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Customer & Delivery Card */}
              <Box sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${brandColors.border}`, backgroundColor: '#FAFBFC', mb: 2.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '11px', color: brandColors.secondaryText, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.8 }}>
                  Customer & Delivery
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#EDE9FE', color: '#6D28D9', fontWeight: 800 }}>
                    {(orderDetails.user?.name?.[0] || 'U').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '14px', color: brandColors.primaryText }}>
                      {orderDetails.user?.name || 'Guest User'}
                    </Typography>
                    {orderDetails.user?.email && (
                      <Typography sx={{ fontSize: '12px', color: brandColors.secondaryText }}>
                        {orderDetails.user.email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Stack spacing={1}>
                  {(orderDetails.user?.mobile_number || orderDetails.user?.mobile) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                      <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, fontWeight: 500 }}>
                        {orderDetails.user.mobile_number || orderDetails.user.mobile}
                      </Typography>
                    </Box>
                  )}

                  {orderDetails.delivery_address && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#94A3B8', mt: 0.3 }} />
                      <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, lineHeight: 1.4 }}>
                        {orderDetails.delivery_address.address || orderDetails.delivery_address.street}
                        {orderDetails.delivery_address.city && `, ${orderDetails.delivery_address.city}`}
                        {orderDetails.delivery_address.state && `, ${orderDetails.delivery_address.state}`}
                        {orderDetails.delivery_address.pincode && ` - ${orderDetails.delivery_address.pincode}`}
                      </Typography>
                    </Box>
                  )}

                  {orderDetails.deliveryDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                      <Typography sx={{ fontSize: '12px', color: brandColors.secondaryText }}>
                        Expected Delivery: <strong>{formatDateOnly(orderDetails.deliveryDate || orderDetails.delivery_date)}</strong>
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Vendor Card */}
              {orderDetails.vendor && (
                <Box sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${brandColors.border}`, backgroundColor: '#FAFBFC', mb: 2.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '11px', color: brandColors.secondaryText, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.8 }}>
                    Vendor Details
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.8 }}>
                    <Avatar
                      src={orderDetails.vendor.vendor_image}
                      sx={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: '#F1F5F9' }}
                    >
                      <StoreIcon sx={{ color: '#94A3B8' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '14px', color: brandColors.primaryText }}>
                        {orderDetails.vendor.name}
                      </Typography>
                      {orderDetails.vendor.email && (
                        <Typography sx={{ fontSize: '12px', color: brandColors.secondaryText }}>
                          {orderDetails.vendor.email}
                        </Typography>
                      )}
                      {orderDetails.vendor.mobile_number && (
                        <Typography sx={{ fontSize: '12px', color: brandColors.secondaryText, mt: 0.3 }}>
                          Phone: {orderDetails.vendor.mobile_number}
                        </Typography>
                      )}
                      {orderDetails.vendor.address && (
                        <Typography sx={{ fontSize: '12px', color: brandColors.secondaryText, mt: 0.3 }}>
                          {orderDetails.vendor.address}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Order Items Table */}
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '11px', color: brandColors.secondaryText, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                  Items Ordered ({orderDetails.items?.length || 0})
                </Typography>

                <Box sx={{ border: `1px solid ${brandColors.border}`, borderRadius: '14px', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          '& th': {
                            backgroundColor: '#F8FAFC',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            borderBottom: `1px solid ${brandColors.divider}`,
                            py: 1.2,
                          },
                        }}
                      >
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetails.items?.map((item, idx) => (
                        <TableRow key={idx} sx={{ '& td': { borderBottom: `1px solid ${brandColors.divider}`, py: 1.2 } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                              {item.product?.image && (
                                <Avatar
                                  src={item.product.image}
                                  variant="rounded"
                                  sx={{ width: 32, height: 32, borderRadius: '8px' }}
                                />
                              )}
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: brandColors.primaryText }}>
                                  {item.product?.name || item.name || 'Item'}
                                </Typography>
                                {item.product?.description && (
                                  <Typography sx={{ fontSize: '11px', color: brandColors.secondaryText, maxWidth: 200, noWrap: true }}>
                                    {item.product.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1,
                                py: 0.2,
                                borderRadius: '6px',
                                backgroundColor: '#F1F5F9',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: brandColors.primaryText,
                              }}
                            >
                              {item.quantity}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              sx={{
                                fontSize: '12.5px',
                                fontWeight: 700,
                                color: item.special_price > 0 ? brandColors.orange : brandColors.primaryText,
                              }}
                            >
                              ₹{item.special_price > 0 ? item.special_price.toFixed(2) : Number(item.main_price || item.price || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontSize: '13px', fontWeight: 800, color: brandColors.primaryText }}>
                              ₹{Number(item.item_total || (item.quantity * (item.special_price || item.main_price || item.price || 0))).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              {/* Price Breakdown */}
              <Box sx={{ p: 2.5, borderRadius: '16px', border: `1px solid ${brandColors.border}`, backgroundColor: '#FAFBFC', mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '11px', color: brandColors.secondaryText, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                  Payment & Bill Summary
                </Typography>

                <Stack spacing={1.1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Payment Method</Typography>
                    <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, fontWeight: 700, textTransform: 'capitalize' }}>
                      {orderDetails.payment_method || 'Cash on Delivery'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Payment Status</Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.2,
                        borderRadius: '6px',
                        backgroundColor: orderDetails.payment_status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                        color: orderDetails.payment_status === 'paid' ? '#15803D' : '#B45309',
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'capitalize',
                      }}
                    >
                      {orderDetails.payment_status || 'Pending'}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Items Subtotal</Typography>
                    <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, fontWeight: 600 }}>
                      ₹{Number(orderDetails.subtotal || 0).toFixed(2)}
                    </Typography>
                  </Box>

                  {Number(orderDetails.packaging_charge || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Packaging Charge</Typography>
                      <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, fontWeight: 600 }}>
                        ₹{Number(orderDetails.packaging_charge).toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  {Number(orderDetails.delivery_charge || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Delivery Charge</Typography>
                      <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, fontWeight: 600 }}>
                        ₹{Number(orderDetails.delivery_charge).toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  {Number(orderDetails.convenience_charge || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Convenience Charge</Typography>
                      <Typography sx={{ fontSize: '13px', color: brandColors.primaryText, fontWeight: 600 }}>
                        ₹{Number(orderDetails.convenience_charge).toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  {Number(orderDetails.discount || 0) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '13px', color: brandColors.secondaryText }}>Discount Applied</Typography>
                      <Typography sx={{ fontSize: '13px', color: '#15803D', fontWeight: 700 }}>
                        -₹{Number(orderDetails.discount).toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 0.8 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '15px', fontWeight: 800, color: brandColors.primaryText }}>
                      Total Amount
                    </Typography>
                    <Typography sx={{ fontSize: '17px', fontWeight: 800, color: brandColors.primaryGreen }}>
                      ₹{Number(orderDetails.total_payable_amount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: brandColors.secondaryText, fontWeight: 600 }}>No details available</Typography>
            </Box>
          )}
        </Box>

        {/* Drawer Footer Actions */}
        <Box
          sx={{
            p: 2.5,
            borderTop: `1px solid ${brandColors.divider}`,
            backgroundColor: '#FAFBFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Button
            onClick={handleCloseDrawer}
            sx={{
              borderRadius: '10px',
              color: brandColors.secondaryText,
              fontWeight: 700,
              textTransform: 'none',
            }}
          >
            Close
          </Button>

          {orderDetails && !['cancelled', 'delivered'].includes(String(orderDetails.status || '').toLowerCase()) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleOpenCancelDialog(orderDetails)}
                disabled={processingAction}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
              >
                Cancel Order
              </Button>

              <Button
                variant="contained"
                startIcon={processingAction ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                onClick={() => handleMarkAsDelivered(orderDetails._id)}
                disabled={processingAction}
                sx={{
                  backgroundColor: brandColors.primaryGreen,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { backgroundColor: brandColors.darkGreen },
                }}
              >
                Mark Delivered
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* ── Cancel Order Dialog ── */}
      <Dialog
        open={cancelDialog}
        onClose={handleCloseCancelDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brandColors.primaryText, pb: 1 }}>
          Cancel Order #{(orderDetails || selectedOrder)?._id?.slice(-8).toUpperCase()}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brandColors.secondaryText, fontSize: '13.5px', mb: 2 }}>
            Please specify the reason for cancelling this order. This information will be saved and visible on the order record.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Cancellation Reason *"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Out of stock, customer requested cancellation, address unreachable..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '12px' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={handleCloseCancelDialog}
            disabled={processingAction}
            sx={{ borderRadius: '10px', color: brandColors.secondaryText, textTransform: 'none', fontWeight: 600 }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={processingAction || !cancelReason.trim()}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2.5 }}
          >
            {processingAction ? <CircularProgress size={18} color="inherit" /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
