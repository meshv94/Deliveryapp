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
  Menu,
  ListItemIcon,
  Skeleton,
  InputBase,
} from '@mui/material';
import {
  VisibilityOutlined as ViewIcon,
  RefreshRounded as RefreshIcon,
  LocalShippingOutlined as DeliveryIcon,
  ShoppingBagOutlined as OrderIcon,
  CalendarTodayOutlined as CalendarIcon,
  CloseRounded as CloseIcon,
  LocationOnOutlined as LocationIcon,
  PersonOutlineRounded as PersonIcon,
  PhoneOutlined as PhoneIcon,
  StorefrontRounded as StoreIcon,
  EmailOutlined as EmailIcon,
  AccessTimeRounded as TimeIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
  SearchRounded as SearchIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  DoneAllRounded as DoneAllIcon,
  HourglassEmptyRounded as PendingIcon,
  AccountBalanceWalletOutlined as PaymentIcon,
  ReceiptLongOutlined as ReceiptIcon,
  VolumeUpRounded as SoundOnIcon,
  VolumeOffRounded as SoundOffIcon,
  ViewKanbanRounded as KdsIcon,
  TableRowsRounded as TableViewIcon,
  NotificationsActiveRounded as BellIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import vendorService from '../services/vendorService';
import { useColorMode } from '../theme/ThemeContext';
import KitchenDisplayBoard from '../components/KitchenDisplayBoard';
import {
  playOrderChime,
  startNewOrderAlertLoop,
  stopNewOrderAlertLoop,
  isAudioMuted,
  setAudioMuted,
} from '../utils/audioAlert';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

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

const StatusBadge = ({ status }) => {
  const { BRAND, isDark } = useColorMode();
  const s = String(status || '').toLowerCase();
  const map = {
    placed: { label: 'Placed', bg: BRAND.amberLight, color: BRAND.amber },
    new: { label: 'New', bg: BRAND.amberLight, color: BRAND.amber },
    pending: { label: 'Pending', bg: BRAND.amberLight, color: BRAND.amber },
    confirmed: { label: 'Confirmed', bg: BRAND.lightBlue, color: BRAND.blue },
    processing: { label: 'Processing', bg: isDark ? 'rgba(167, 139, 250, 0.16)' : '#EDE9FE', color: isDark ? '#A78BFA' : '#7C3AED' },
    preparing: { label: 'Preparing', bg: isDark ? 'rgba(167, 139, 250, 0.16)' : '#EDE9FE', color: isDark ? '#A78BFA' : '#7C3AED' },
    ready: { label: 'Out for Delivery', bg: isDark ? 'rgba(6, 182, 212, 0.16)' : '#CFFAFE', color: isDark ? '#22D3EE' : '#0E7490' },
    out_for_delivery: { label: 'Out for Delivery', bg: isDark ? 'rgba(6, 182, 212, 0.16)' : '#CFFAFE', color: isDark ? '#22D3EE' : '#0E7490' },
    'out for delivery': { label: 'Out for Delivery', bg: isDark ? 'rgba(6, 182, 212, 0.16)' : '#CFFAFE', color: isDark ? '#22D3EE' : '#0E7490' },
    delivered: { label: 'Delivered', bg: isDark ? 'rgba(52,211,153,0.15)' : '#DCFCE7', color: BRAND.success || '#16A34A' },
    cancelled: { label: 'Cancelled', bg: BRAND.redLight, color: BRAND.red },
    refunded: { label: 'Refunded', bg: BRAND.innerCard, color: BRAND.muted },
  };

  const c = map[s] || { label: status || 'Unknown', bg: BRAND.innerCard, color: BRAND.muted };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1.2,
        py: 0.35,
        borderRadius: '50px',
        backgroundColor: c.bg,
        color: c.color,
        fontSize: '11.5px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: c.color }} />
      {c.label}
    </Box>
  );
};

const Orders = () => {
  const { BRAND, isDark } = useColorMode();
  const navigate = useNavigate();
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

  // Action Menu
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

  // View mode: 'kds' (Kitchen Display) | 'table' (Data Table)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('portal_orders_view') || 'kds';
    } catch {
      return 'kds';
    }
  });
  const [muted, setMuted] = useState(isAudioMuted);

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

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('portal_orders_view', mode);
    } catch {}
  };

  const handleToggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) {
      playOrderChime();
    } else {
      stopNewOrderAlertLoop();
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVendors();

    // Auto-sync polling every 10s
    const pollInterval = setInterval(() => {
      fetchOrders(filters, true);
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      stopNewOrderAlertLoop();
    };
  }, [filters]);

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAllVendors();
      if (response && response.success) {
        setVendorsList(response.data || []);
      }
    } catch (err) {
      console.warn('Could not load vendors list:', err);
    }
  };

  const fetchOrders = async (customFilters = filters, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);

      const response = await orderService.getAllOrders(customFilters);

      if (response.success) {
        const orderList = response.data || [];
        setOrders(orderList);

        // Check for unaccepted new orders & trigger sound alert loop
        const unaccepted = orderList.filter((o) => {
          const s = String(o.status || '').toLowerCase();
          return s === 'placed' || s === 'new' || s === 'pending';
        });

        if (unaccepted.length > 0) {
          startNewOrderAlertLoop();
        } else {
          stopNewOrderAlertLoop();
        }

        if (response.stats) {
          setStats((prev) => ({
            ...prev,
            ...response.stats,
          }));
        } else {
          calculateStats(orderList);
        }
      } else {
        if (!isBackground) setError(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (!isBackground) setError(err.message || 'Failed to fetch orders');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleDirectStatusUpdate = async (order, newStatusVal) => {
    try {
      setUpdatingStatus(true);
      const res = await orderService.updateOrderStatus(order._id, newStatusVal);
      if (res.success) {
        setSuccess(`Order #${order._id.slice(-6).toUpperCase()} marked as ${newStatusVal}!`);
        fetchOrders(filters, true);
      } else {
        setError(res.message || 'Failed to update order status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    await fetchOrderDetails(order._id);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
    setOrderDetails(null);
    setNewStatus('');
  };

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

  const handleOpenCancelDialog = (order = null) => {
    if (order) {
      setSelectedOrder(order);
    }
    setCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialog(false);
    setCancelReason('');
  };

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

  // Client-side filtering
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

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const paginatedOrders = filteredOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 4 }}>
      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* ======================================================== */}
      {/* 1. PAGE HEADER */}
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
            Orders Management
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Track marketplace customer orders, live statuses and fulfillment routing
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          {/* Sound Alert Toggle */}
          <Tooltip title={muted ? 'Unmute Kitchen Audio Alerts' : 'Mute Kitchen Audio Alerts'}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleToggleSound}
              startIcon={muted ? <SoundOffIcon sx={{ color: BRAND.red }} /> : <SoundOnIcon sx={{ color: BRAND.green }} />}
              sx={{
                borderColor: muted ? BRAND.redLight : BRAND.border,
                bgcolor: muted ? (isDark ? 'rgba(239,68,68,0.1)' : BRAND.redLight) : BRAND.white,
                color: muted ? BRAND.red : BRAND.text,
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'none',
                height: 36,
              }}
            >
              {muted ? 'Sound Muted' : 'Alerts ON'}
            </Button>
          </Tooltip>

          {/* Test Chime Button */}
          <Button
            size="small"
            onClick={() => playOrderChime()}
            sx={{
              color: BRAND.muted,
              fontSize: '11.5px',
              textTransform: 'none',
              fontWeight: 600,
              display: { xs: 'none', sm: 'inline-flex' }
            }}
          >
            🔔 Test Chime
          </Button>

          {/* View Mode Switcher: Kitchen KDS vs Table */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: BRAND.innerCard,
              p: 0.4,
              borderRadius: '10px',
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Button
              size="small"
              onClick={() => handleToggleViewMode('kds')}
              startIcon={<KdsIcon sx={{ fontSize: '16px !important' }} />}
              sx={{
                borderRadius: '8px',
                px: 1.4,
                py: 0.5,
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: viewMode === 'kds' ? BRAND.green : 'transparent',
                color: viewMode === 'kds' ? '#FFFFFF' : BRAND.muted,
                '&:hover': { bgcolor: viewMode === 'kds' ? BRAND.darkGreen : 'transparent' },
              }}
            >
              Kitchen KDS
            </Button>
            <Button
              size="small"
              onClick={() => handleToggleViewMode('table')}
              startIcon={<TableViewIcon sx={{ fontSize: '16px !important' }} />}
              sx={{
                borderRadius: '8px',
                px: 1.4,
                py: 0.5,
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: viewMode === 'table' ? BRAND.green : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : BRAND.muted,
                '&:hover': { bgcolor: viewMode === 'table' ? BRAND.darkGreen : 'transparent' },
              }}
            >
              Table View
            </Button>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => fetchOrders(filters)}
            disabled={loading}
            sx={{
              borderColor: BRAND.border,
              color: BRAND.text,
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 700,
              px: 1.8,
              height: 36,
              textTransform: 'none',
              backgroundColor: BRAND.white,
              '&:hover': {
                borderColor: BRAND.green,
                color: BRAND.green,
                backgroundColor: BRAND.lightGreen,
              },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ======================================================== */}
      {/* 2. SUMMARY FILTER TABS */}
      {/* ======================================================== */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
        {[
          { label: 'All Orders', value: stats.totalOrders || orders.length, filter: 'all', bg: BRAND.lightGreen, color: BRAND.green },
          { label: 'Pending / Placed', value: stats.pendingOrders || 0, filter: 'pending', bg: BRAND.amberLight, color: BRAND.amber },
          { label: 'Processing', value: orders.filter((o) => ['processing', 'preparing'].includes(String(o.status || '').toLowerCase())).length, filter: 'processing', bg: isDark ? 'rgba(167, 139, 250, 0.16)' : '#EDE9FE', color: isDark ? '#A78BFA' : '#7C3AED' },
          { label: 'Out for Delivery', value: orders.filter((o) => ['out_for_delivery', 'out for delivery', 'ready'].includes(String(o.status || '').toLowerCase())).length, filter: 'out_for_delivery', bg: isDark ? 'rgba(6, 182, 212, 0.16)' : '#CFFAFE', color: isDark ? '#22D3EE' : '#0E7490' },
          { label: 'Delivered', value: stats.deliveredOrders || 0, filter: 'delivered', bg: isDark ? 'rgba(52,211,153,0.15)' : '#DCFCE7', color: BRAND.success || '#16A34A' },
          { label: 'Cancelled', value: stats.cancelledOrders || 0, filter: 'cancelled', bg: BRAND.redLight, color: BRAND.red },
        ].map((tab) => {
          const isSelected = statusFilter === tab.filter;
          return (
            <Box
              key={tab.filter}
              onClick={() => {
                setStatusFilter(tab.filter);
                setPage(1);
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 0.7,
                borderRadius: '50px',
                backgroundColor: isSelected ? tab.bg : BRAND.white,
                color: isSelected ? tab.color : BRAND.muted,
                border: `1px solid ${isSelected ? tab.color + '40' : BRAND.border}`,
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
                '&:hover': {
                  backgroundColor: tab.bg,
                  color: tab.color,
                },
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isSelected ? tab.color : (isDark ? '#475569' : '#CBD5E1'),
                }}
              />
              {tab.label}
              <Box
                sx={{
                  px: 0.8,
                  py: 0.1,
                  borderRadius: '6px',
                  backgroundColor: isSelected ? `${tab.color}18` : BRAND.innerCard,
                  color: isSelected ? tab.color : BRAND.muted,
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                {tab.value}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ======================================================== */}
      {/* 3. MAIN KITCHEN KDS BOARD OR DATA TABLE */}
      {/* ======================================================== */}
      {viewMode === 'kds' ? (
        <KitchenDisplayBoard
          orders={filteredOrders}
          onUpdateStatus={handleDirectStatusUpdate}
          onCancelOrder={handleOpenCancelDialog}
          onRefresh={() => fetchOrders(filters, true)}
        />
      ) : (
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          backgroundColor: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
          p: { xs: 2, sm: 2.5 },
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
              Orders Pipeline
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} in selected view
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: BRAND.innerCard,
                border: `1px solid ${BRAND.border}`,
                borderRadius: '10px',
                px: 1.5,
                py: 0.55,
                width: { xs: '100%', sm: 230 },
                transition: 'border-color 0.15s ease',
                '&:focus-within': { borderColor: BRAND.green },
              }}
            >
              <SearchIcon sx={{ color: BRAND.muted, fontSize: 17, mr: 1 }} />
              <InputBase
                placeholder="Search orders, customers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                sx={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: BRAND.text,
                  width: '100%',
                  '& input::placeholder': { color: BRAND.muted, opacity: 1 },
                }}
              />
            </Box>

            {/* Vendor Filter */}
            {vendorsList.length > 0 && (
              <Box
                component="select"
                value={vendorFilter}
                onChange={(e) => {
                  setVendorFilter(e.target.value);
                  setPage(1);
                }}
                sx={{
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: '10px',
                  px: 1.2,
                  py: 0.65,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: BRAND.text,
                  backgroundColor: BRAND.innerCard,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 140,
                  '&:hover': { borderColor: BRAND.green },
                }}
              >
                <option value="all" style={{ background: BRAND.white, color: BRAND.text }}>All Vendors</option>
                {vendorsList.map((v) => (
                  <option key={v._id} value={v._id} style={{ background: BRAND.white, color: BRAND.text }}>
                    {v.name}
                  </option>
                ))}
              </Box>
            )}

            {/* Reset Filters */}
            {(search || statusFilter !== 'all' || vendorFilter !== 'all') && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setVendorFilter('all');
                  setPage(1);
                }}
                sx={{ textTransform: 'none', color: BRAND.red, fontSize: '12px', fontWeight: 700 }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>

        {/* ======================================================== */}
        {/* DESKTOP DATA TABLE */}
        {/* ======================================================== */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 880 }}>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      borderBottom: `1.5px solid ${BRAND.border}`,
                      color: BRAND.muted,
                      fontWeight: 700,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      py: 1.3,
                      backgroundColor: BRAND.innerCard,
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Vendor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Placed Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} sx={{ py: 1.6 }}>
                        <Skeleton variant="text" width="100%" height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <OrderIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                        No orders found
                      </Typography>
                      <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3 }}>
                        Try adjusting your filters or search terms.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => {
                    return (
                      <TableRow
                        key={order._id}
                        hover
                        onClick={() => handleViewOrder(order)}
                        sx={{
                          '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.3 },
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: BRAND.innerCard },
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        {/* Order ID */}
                        <TableCell onClick={() => handleViewOrder(order)}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              color: BRAND.blue,
                              fontSize: '12.5px',
                              fontFamily: 'monospace',
                            }}
                          >
                            #{order._id.slice(-6).toUpperCase()}
                          </Typography>
                        </TableCell>

                        {/* Customer */}
                        <TableCell onClick={() => handleViewOrder(order)}>
                          <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                            {order.user?.name || 'Guest Customer'}
                          </Typography>
                          {order.user?.mobile_number && (
                            <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                              {order.user.mobile_number}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Store / Vendor */}
                        <TableCell onClick={() => handleViewOrder(order)}>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                            {order.vendor?.name || 'Store'}
                          </Typography>
                        </TableCell>

                        {/* Payable Amount */}
                        <TableCell onClick={() => handleViewOrder(order)}>
                          <Typography sx={{ fontWeight: 800, color: BRAND.text, fontSize: '13px' }}>
                            {formatCurrency(order.total_payable_amount || 0)}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell onClick={() => handleViewOrder(order)}>
                          <StatusBadge status={order.status} />
                        </TableCell>

                        {/* Date */}
                        <TableCell onClick={() => handleViewOrder(order)}>
                          <Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>
                            {formatDate(order.createdAt)}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Order Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewOrder(order)}
                                sx={{
                                  color: BRAND.blue,
                                  backgroundColor: BRAND.lightBlue,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { backgroundColor: '#DBEAFE' },
                                }}
                              >
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            {String(order.status || '').toLowerCase() !== 'delivered' &&
                              String(order.status || '').toLowerCase() !== 'cancelled' && (
                                <Tooltip title="Mark as Delivered">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMarkAsDelivered(order._id)}
                                    sx={{
                                      color: BRAND.green,
                                      backgroundColor: BRAND.lightGreen,
                                      borderRadius: '8px',
                                      width: 28,
                                      height: 28,
                                      '&:hover': { backgroundColor: '#DCFCE7' },
                                    }}
                                  >
                                    <DoneAllIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ======================================================== */}
        {/* MOBILE RESPONSIVE CARDS */}
        {/* ======================================================== */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: '12px' }} />)
          ) : paginatedOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <OrderIcon sx={{ fontSize: 36, color: BRAND.muted, display: 'block', mx: 'auto', mb: 1 }} />
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No orders found</Typography>
            </Box>
          ) : (
            paginatedOrders.map((order) => (
              <Paper
                key={order._id}
                elevation={0}
                onClick={() => handleViewOrder(order)}
                sx={{
                  p: 1.8,
                  borderRadius: '12px',
                  backgroundColor: BRAND.innerCard,
                  border: `1px solid ${BRAND.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
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
                    <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                      {order.user?.name || 'Customer'}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                      {order.vendor?.name || 'Store'}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: BRAND.text }}>
                    ₹{order.total_payable_amount || 0}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '11px', color: BRAND.muted, borderTop: `1px solid ${BRAND.divider}`, pt: 0.8 }}>
                  {formatDate(order.createdAt)}
                </Typography>
              </Paper>
            ))
          )}
        </Box>

        {/* ======================================================== */}
        {/* PAGINATION */}
        {/* ======================================================== */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mt: 2.5,
            pt: 2,
            borderTop: `1px solid ${BRAND.divider}`,
          }}
        >
          <Typography sx={{ fontSize: '12px', color: BRAND.muted, fontWeight: 600 }}>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <IconButton
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{
                border: `1px solid ${BRAND.border}`,
                borderRadius: '8px',
                width: 32,
                height: 32,
                color: BRAND.muted,
                '&:disabled': { opacity: 0.35 },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const n = start + i;
              if (n > totalPages) return null;
              return (
                <IconButton
                  key={n}
                  size="small"
                  onClick={() => setPage(n)}
                  sx={{
                    border: `1px solid ${n === page ? BRAND.green : BRAND.border}`,
                    borderRadius: '8px',
                    width: 32,
                    height: 32,
                    backgroundColor: n === page ? BRAND.green : BRAND.white,
                    color: n === page ? '#FFFFFF' : BRAND.muted,
                    fontWeight: 700,
                    fontSize: '12px',
                    '&:hover': { backgroundColor: n === page ? BRAND.darkGreen : BRAND.innerCard },
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
                border: `1px solid ${BRAND.border}`,
                borderRadius: '8px',
                width: 32,
                height: 32,
                backgroundColor: BRAND.green,
                color: '#FFFFFF',
                '&:hover': { backgroundColor: BRAND.darkGreen },
                '&:disabled': { backgroundColor: isDark ? '#1E293B' : '#E2E8F0', color: '#94A3B8' },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      )}

      {/* ======================================================== */}
      {/* 4. ORDER DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 460 },
            p: 3,
            boxSizing: 'border-box',
            backgroundColor: BRAND.white,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
            Order #{orderDetails?._id ? orderDetails._id.slice(-6).toUpperCase() : '...'}
          </Typography>
          <IconButton onClick={handleCloseDrawer} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {loadingDetails ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: BRAND.green }} />
          </Box>
        ) : orderDetails ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Status & Quick Modifier */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase' }}>
                  Current Status
                </Typography>
                <StatusBadge status={orderDetails.status} />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  InputProps={{ sx: { borderRadius: '8px', fontSize: '12.5px' } }}
                >
                  {['Placed', 'Confirmed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  disabled={updatingStatus || newStatus === orderDetails.status}
                  onClick={() => handleUpdateStatus(orderDetails._id, newStatus)}
                  sx={{
                    backgroundColor: BRAND.green,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    px: 2,
                    '&:hover': { backgroundColor: BRAND.darkGreen },
                  }}
                >
                  {updatingStatus ? <CircularProgress size={16} color="inherit" /> : 'Update'}
                </Button>
              </Box>

              {/* Wallet Auto-Refund Status Banner */}
              {orderDetails.refunded_to === 'wallet' && (
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.2,
                    borderRadius: '8px',
                    bgcolor: '#EAF7F2',
                    border: `1px solid ${BRAND.green}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: BRAND.green }}>
                    💰 Auto-Refunded to Customer Wallet
                  </Typography>
                  <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.green }}>
                    ₹{(orderDetails.refunded_amount || orderDetails.total_payable_amount || 0).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Customer & Address */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                Customer & Delivery Address
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                    {orderDetails.user?.name || 'Guest User'}
                  </Typography>
                </Box>
                {orderDetails.user?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.text }}>
                      {orderDetails.user.email}
                    </Typography>
                  </Box>
                )}
                {orderDetails.user?.mobile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.text }}>
                      {orderDetails.user.mobile}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pt: 0.5, borderTop: `1px solid ${BRAND.divider}` }}>
                  <LocationIcon sx={{ fontSize: 16, color: BRAND.muted, mt: 0.2 }} />
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.text }}>
                    {orderDetails.delivery_address?.complete_address ||
                      orderDetails.delivery_address?.address ||
                      orderDetails.address ||
                      'Standard Delivery Address'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Items Ordered */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                Items Ordered ({orderDetails.items?.length || 0})
              </Typography>
              <Stack spacing={1.2}>
                {orderDetails.items && orderDetails.items.length > 0 ? (
                  orderDetails.items.map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.text }}>
                          {item.name || item.product?.name || 'Catalog Product'}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                          Qty: {item.quantity} &times; ₹{item.price || item.item_price || 0}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.text }}>
                        ₹{item.item_total || item.total || (item.quantity * (item.price || 0))}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography sx={{ fontSize: '12px', color: BRAND.muted }}>No item details available</Typography>
                )}
              </Stack>
            </Paper>

            {/* Billing Summary */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                Payment & Billing
              </Typography>
              <Stack spacing={0.8}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Item Subtotal:</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                    ₹{orderDetails.item_total || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Delivery Charge:</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                    ₹{orderDetails.delivery_charge || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Packaging Charge:</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                    ₹{orderDetails.packaging_charge || 0}
                  </Typography>
                </Box>
                {orderDetails.discount_amount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.green }}>Discount:</Typography>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.green }}>
                      -₹{orderDetails.discount_amount}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.text }}>Total Payable:</Typography>
                  <Typography sx={{ fontSize: '15px', fontWeight: 800, color: BRAND.orange }}>
                    {formatCurrency(orderDetails.total_payable_amount || 0)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Action Buttons */}
            {String(orderDetails.status || '').toLowerCase() !== 'cancelled' && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleOpenCancelDialog(orderDetails)}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
              >
                Cancel Order
              </Button>
            )}
          </Box>
        ) : null}
      </Drawer>

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialog} onClose={handleCloseCancelDialog} PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
          Cancel Order?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted, mb: 2 }}>
            Please provide a cancellation reason for customer notification:
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Cancellation Reason *"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={2}
            InputProps={{ sx: { borderRadius: '8px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={handleCloseCancelDialog} disabled={processingAction} sx={{ textTransform: 'none', color: BRAND.muted }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCancelOrder}
            disabled={processingAction || !cancelReason.trim()}
            sx={{ bgcolor: BRAND.red, color: '#FFFFFF', fontWeight: 700, textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {processingAction ? <CircularProgress size={20} color="inherit" /> : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
