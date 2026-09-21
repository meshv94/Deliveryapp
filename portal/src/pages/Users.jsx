import React, { useState, useEffect, useMemo } from 'react';
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
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Card,
  CardContent,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  VerifiedUser as VerifiedUserIcon,
  Groups as GroupsIcon,
  PersonOff as PersonOffIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  ShoppingBag as OrderIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  ReceiptLong as ReceiptIcon,
  AccountCircle as CustomerRoleIcon,
  Store as StoreIcon,
  AdminPanelSettings as AdminIcon,
  InfoOutlined as InfoIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import orderService from '../services/orderService';
import { brandColors } from '../theme/tokens';

const Users = () => {
  const navigate = useNavigate();

  // Core Data State
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [ordersFilter, setOrdersFilter] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog & Drawer States
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Action Menu State
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [activeMenuUser, setActiveMenuUser] = useState(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  // Initial Data Fetching
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch users, stats, and orders in parallel
      const [usersRes, statsRes, ordersRes] = await Promise.allSettled([
        userService.getAllUsers(),
        userService.getUserStats(),
        orderService.getAllOrders(),
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value?.data || []);
      } else {
        throw new Error(usersRes.reason?.message || 'Failed to fetch users');
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data || null);
      }

      if (ordersRes.status === 'fulfilled') {
        setOrders(ordersRes.value?.data || []);
      }
    } catch (err) {
      console.error('Error loading customers data:', err);
      setError(err.message || 'Failed to load customer management data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Map orders per customer ID for instant lookup
  const userOrderMetrics = useMemo(() => {
    const metrics = {};
    if (!Array.isArray(orders)) return metrics;

    orders.forEach((order) => {
      if (!order) return;
      // Get user ID from populated user object or direct id
      const userId = order.user?._id || order.user;
      if (!userId) return;

      if (!metrics[userId]) {
        metrics[userId] = {
          count: 0,
          totalSpent: 0,
          ordersList: [],
        };
      }

      const total = Number(order.final_total || order.total || order.sub_total || 0);
      metrics[userId].count += 1;
      metrics[userId].totalSpent += isNaN(total) ? 0 : total;
      metrics[userId].ordersList.push(order);
    });

    return metrics;
  }, [orders]);

  // Overall marketplace customer order calculations
  const totalMarketplaceSpent = useMemo(() => {
    return Object.values(userOrderMetrics).reduce((acc, curr) => acc + curr.totalSpent, 0);
  }, [userOrderMetrics]);

  const totalMarketplaceCustomerOrders = useMemo(() => {
    return Object.values(userOrderMetrics).reduce((acc, curr) => acc + curr.count, 0);
  }, [userOrderMetrics]);

  // Filter and Search Customers
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];

    return users.filter((user) => {
      // Search matching (name, email, mobile_number)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.mobile_number && user.mobile_number.includes(q)) ||
        (user._id && user._id.toLowerCase().includes(q));

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = !user.isBlocked;
      } else if (statusFilter === 'BLOCKED') {
        matchesStatus = !!user.isBlocked;
      }

      // Verification filter
      let matchesVerification = true;
      if (verificationFilter === 'VERIFIED') {
        matchesVerification = !!user.isVerified;
      } else if (verificationFilter === 'UNVERIFIED') {
        matchesVerification = !user.isVerified;
      }

      // Orders filter
      let matchesOrders = true;
      const orderCount = userOrderMetrics[user._id]?.count || 0;
      if (ordersFilter === 'WITH_ORDERS') {
        matchesOrders = orderCount > 0;
      } else if (ordersFilter === 'NO_ORDERS') {
        matchesOrders = orderCount === 0;
      }

      return matchesSearch && matchesStatus && matchesVerification && matchesOrders;
    });
  }, [users, searchQuery, statusFilter, verificationFilter, ordersFilter, userOrderMetrics]);

  // Paginated records
  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, verificationFilter, ordersFilter, rowsPerPage]);

  // Action Menu Handlers
  const handleOpenActionMenu = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setActiveMenuUser(user);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActiveMenuUser(null);
  };

  // View Customer Details
  const handleViewCustomer = (user) => {
    setSelectedUser(user);
    setDetailDrawerOpen(true);
    handleCloseActionMenu();
  };

  // Edit Customer Dialog
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setEditDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '' });
  };

  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      setError(null);

      const updatePayload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
      };

      await userService.updateUser(selectedUser._id, updatePayload);
      setSuccess(`Customer "${formData.name.trim()}" updated successfully!`);
      handleCloseEditDialog();
      await loadAllData(true);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update customer details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Block / Unblock Customer
  const handleOpenBlockDialog = (user) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleConfirmToggleBlock = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      setError(null);

      await userService.toggleBlockUser(selectedUser._id);
      const actionText = selectedUser.isBlocked ? 'activated / unblocked' : 'deactivated / blocked';
      setSuccess(`Customer "${selectedUser.name || selectedUser.mobile_number}" has been ${actionText} successfully.`);
      setBlockDialogOpen(false);
      setSelectedUser(null);
      await loadAllData(true);
    } catch (err) {
      console.error('Error toggling block status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update customer status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer
  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      setError(null);

      await userService.deleteUser(selectedUser._id);
      setSuccess(`Customer "${selectedUser.name || selectedUser.mobile_number}" deleted successfully.`);
      setDeleteDialogOpen(false);
      if (detailDrawerOpen && selectedUser._id === selectedUser?._id) {
        setDetailDrawerOpen(false);
      }
      setSelectedUser(null);
      await loadAllData(true);
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete customer.');
    } finally {
      setSubmitting(false);
    }
  };

  // View Customer Orders
  const handleViewCustomerOrders = (user) => {
    handleCloseActionMenu();
    // Navigate to Orders page with search query or open detail drawer on orders
    navigate(`/orders`);
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setVerificationFilter('ALL');
    setOrdersFilter('ALL');
    setPage(0);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    verificationFilter !== 'ALL' ||
    ordersFilter !== 'ALL';

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '65vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} thickness={4} sx={{ color: brandColors.primaryGreen }} />
        <Typography sx={{ color: brandColors.secondaryText, fontWeight: 600, fontSize: '0.95rem' }}>
          Loading AapnuBazaar customer records...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 6 }}>
      {/* Alert Notifications */}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{
            mb: 3,
            borderRadius: '14px',
            backgroundColor: brandColors.successLight,
            color: brandColors.success,
            fontWeight: 600,
            border: `1px solid ${brandColors.borderGreen}`,
          }}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 3,
            borderRadius: '14px',
            backgroundColor: brandColors.errorLight,
            color: brandColors.error,
            fontWeight: 600,
            border: `1px solid #FECACA`,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.6rem', md: '2.1rem' },
                color: brandColors.primaryText,
                letterSpacing: '-0.02em',
              }}
            >
              Customers
            </Typography>
            <Chip
              icon={<CustomerRoleIcon sx={{ fontSize: '16px !important', color: `${brandColors.primaryGreen} !important` }} />}
              label="Shopper Accounts"
              size="small"
              sx={{
                backgroundColor: brandColors.lightGreen,
                color: brandColors.primaryGreen,
                fontWeight: 700,
                fontSize: '12px',
                borderRadius: '8px',
                border: `1px solid ${brandColors.borderGreen}`,
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: brandColors.secondaryText,
              fontWeight: 500,
              mt: 0.5,
              fontSize: '0.92rem',
            }}
          >
            Manage customers using the AapnuBazaar marketplace.
          </Typography>
        </Box>

        {/* Header Action Buttons */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={
              refreshing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderColor: brandColors.border,
              color: brandColors.primaryText,
              backgroundColor: brandColors.white,
              px: 2,
              py: 0.9,
              '&:hover': {
                borderColor: brandColors.primaryGreen,
                backgroundColor: '#F8FAFC',
              },
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Stack>
      </Box>

      {/* Role Distinction Notice Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3.5,
          borderRadius: '16px',
          backgroundColor: '#F8FAFC',
          border: `1px solid ${brandColors.border}`,
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: brandColors.lightBlue,
              color: brandColors.blueAccent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <InfoIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: brandColors.primaryText }}>
              Platform Role Segregation
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: brandColors.secondaryText, fontWeight: 500 }}>
              This section is dedicated exclusively to end-user <strong>Customers</strong>. Store merchants and platform staff are maintained separately in their respective hubs.
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Chip
            icon={<StoreIcon sx={{ fontSize: '14px !important', color: `${brandColors.orange} !important` }} />}
            label="Merchant Vendors"
            onClick={() => navigate('/vendors')}
            clickable
            size="small"
            sx={{
              backgroundColor: brandColors.lightOrange,
              color: brandColors.orange,
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '6px',
              border: `1px solid ${brandColors.borderOrange}`,
            }}
          />
          <Chip
            icon={<AdminIcon sx={{ fontSize: '14px !important', color: `${brandColors.blueAccent} !important` }} />}
            label="Admin Staff"
            onClick={() => navigate('/admins')}
            clickable
            size="small"
            sx={{
              backgroundColor: brandColors.lightBlue,
              color: brandColors.blueAccent,
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '6px',
              border: `1px solid ${brandColors.borderBlue}`,
            }}
          />
        </Stack>
      </Paper>

      {/* KPI Bento Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Customers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.primaryText, fontSize: '1.85rem' }}>
                    {stats?.totalUsers ?? users.length}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.primaryGreen, fontWeight: 700, mt: 0.5 }}>
                    Registered Shoppers
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: brandColors.lightGreen,
                    color: brandColors.primaryGreen,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.borderGreen}`,
                  }}
                >
                  <GroupsIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active Accounts
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', fontSize: '1.85rem' }}>
                    {stats?.activeUsers ?? users.filter((u) => !u.isBlocked).length}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, mt: 0.5 }}>
                    Unrestricted access
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: '#DCFCE7',
                    color: '#16A34A',
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Verified Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Verified (OTP/KYC)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.blueAccent, fontSize: '1.85rem' }}>
                    {stats?.verifiedUsers ?? users.filter((u) => u.isVerified).length}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.blueAccent, fontWeight: 700, mt: 0.5 }}>
                    Phone Authenticated
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: brandColors.lightBlue,
                    color: brandColors.blueAccent,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.borderBlue}`,
                  }}
                >
                  <VerifiedUserIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Blocked / Inactive Customers */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Blocked Accounts
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#DC2626', fontSize: '1.85rem' }}>
                    {stats?.blockedUsers ?? users.filter((u) => u.isBlocked).length}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, mt: 0.5 }}>
                    Suspended / Restricted
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: '#FEE2E2',
                    color: '#DC2626',
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: '1px solid #FECACA',
                  }}
                >
                  <PersonOffIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: '20px',
          backgroundColor: brandColors.white,
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={4.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by customer name, email, or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: brandColors.secondaryText, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& fieldset': {
                    borderColor: brandColors.border,
                  },
                  '&:hover fieldset': {
                    borderColor: brandColors.primaryGreen,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: brandColors.primaryGreen,
                  },
                },
              }}
            />
          </Grid>

          {/* Account Status Filter */}
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Account Status</InputLabel>
              <Select
                value={statusFilter}
                label="Account Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: brandColors.border,
                  },
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active Only</MenuItem>
                <MenuItem value="BLOCKED">Blocked Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Verification Filter */}
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Verification</InputLabel>
              <Select
                value={verificationFilter}
                label="Verification"
                onChange={(e) => setVerificationFilter(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: brandColors.border,
                  },
                }}
              >
                <MenuItem value="ALL">All Accounts</MenuItem>
                <MenuItem value="VERIFIED">Verified (OTP)</MenuItem>
                <MenuItem value="UNVERIFIED">Unverified</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Orders Filter & Clear Button */}
          <Grid item xs={12} sm={4} md={2.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Orders</InputLabel>
                <Select
                  value={ordersFilter}
                  label="Orders"
                  onChange={(e) => setOrdersFilter(e.target.value)}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.88rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: brandColors.border,
                    },
                  }}
                >
                  <MenuItem value="ALL">All Shoppers</MenuItem>
                  <MenuItem value="WITH_ORDERS">With Orders</MenuItem>
                  <MenuItem value="NO_ORDERS">No Orders</MenuItem>
                </Select>
              </FormControl>

              {hasActiveFilters && (
                <Tooltip title="Reset all filters">
                  <IconButton
                    onClick={handleClearFilters}
                    size="small"
                    sx={{
                      backgroundColor: brandColors.lightOrange,
                      color: brandColors.orange,
                      borderRadius: '10px',
                      p: 1,
                      '&:hover': {
                        backgroundColor: brandColors.borderOrange,
                      },
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Filter Summary & Matching Results Count */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${brandColors.divider}`,
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 600 }}>
            Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> customers
            {hasActiveFilters && ' (filtered)'}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 500 }}>
              Rows per page:
            </Typography>
            <Select
              size="small"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              sx={{
                height: 32,
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                '& .MuiSelect-select': { py: 0.5, px: 1.5 },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </Stack>
        </Box>
      </Paper>

      {/* Main Customers Table Paper */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 4px 20px rgba(20, 33, 61, 0.04)',
          backgroundColor: brandColors.white,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#F8FAFC',
                  '& th': {
                    borderBottom: `1px solid ${brandColors.border}`,
                    color: brandColors.secondaryText,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    px: 2.5,
                  },
                }}
              >
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="center">Orders</TableCell>
                <TableCell align="right">Total Spent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: brandColors.adminBg,
                          color: brandColors.secondaryText,
                        }}
                      >
                        <GroupsIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, color: brandColors.primaryText, fontSize: '1rem' }}>
                        No customers match your criteria
                      </Typography>
                      <Typography sx={{ color: brandColors.secondaryText, fontSize: '0.85rem' }}>
                        Try clearing search terms or adjusting the status filters.
                      </Typography>
                      {hasActiveFilters && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleClearFilters}
                          sx={{
                            mt: 1,
                            borderRadius: '10px',
                            textTransform: 'none',
                            borderColor: brandColors.primaryGreen,
                            color: brandColors.primaryGreen,
                            fontWeight: 700,
                          }}
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => {
                  const customerMetrics = userOrderMetrics[user._id] || { count: 0, totalSpent: 0 };
                  const initial = user.name ? user.name[0].toUpperCase() : 'C';

                  return (
                    <TableRow
                      key={user._id}
                      hover
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: '#F8FAFC',
                        },
                        '& td': {
                          borderBottom: `1px solid ${brandColors.divider}`,
                          py: 2,
                          px: 2.5,
                        },
                      }}
                    >
                      {/* Customer Info (Avatar, Name, Role Badge) */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: '14px',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              background: user.isBlocked
                                ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                                : `linear-gradient(135deg, ${brandColors.primaryGreen} 0%, ${brandColors.darkGreen} 100%)`,
                              color: '#FFFFFF',
                              boxShadow: user.isBlocked
                                ? '0 4px 10px rgba(239, 68, 68, 0.2)'
                                : '0 4px 10px rgba(8, 127, 91, 0.2)',
                            }}
                          >
                            {initial}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                onClick={() => handleViewCustomer(user)}
                                sx={{
                                  fontWeight: 700,
                                  color: brandColors.primaryText,
                                  fontSize: '0.92rem',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: brandColors.primaryGreen,
                                    textDecoration: 'underline',
                                  },
                                }}
                              >
                                {user.name || 'Unnamed Customer'}
                              </Typography>
                              <Chip
                                label="Customer"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  backgroundColor: brandColors.lightGreen,
                                  color: brandColors.primaryGreen,
                                  borderRadius: '4px',
                                  border: `1px solid ${brandColors.borderGreen}`,
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText, mt: 0.3 }}>
                              ID: {user._id ? `${user._id.slice(0, 8)}...` : '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        {user.email ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <EmailIcon sx={{ fontSize: 15, color: brandColors.secondaryText }} />
                            <Typography sx={{ fontSize: '0.85rem', color: brandColors.primaryText, fontWeight: 500 }}>
                              {user.email}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>
                            Not provided
                          </Typography>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PhoneIcon sx={{ fontSize: 15, color: brandColors.primaryGreen }} />
                          <Typography sx={{ fontSize: '0.88rem', color: brandColors.primaryText, fontWeight: 600 }}>
                            {user.mobile_number || '-'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Orders Count */}
                      <TableCell align="center">
                        <Chip
                          icon={<OrderIcon sx={{ fontSize: '14px !important', color: customerMetrics.count > 0 ? `${brandColors.primaryGreen} !important` : `${brandColors.secondaryText} !important` }} />}
                          label={`${customerMetrics.count} ${customerMetrics.count === 1 ? 'order' : 'orders'}`}
                          size="small"
                          onClick={() => handleViewCustomer(user)}
                          clickable
                          sx={{
                            fontWeight: 700,
                            fontSize: '12px',
                            backgroundColor: customerMetrics.count > 0 ? brandColors.lightGreen : '#F1F5F9',
                            color: customerMetrics.count > 0 ? brandColors.primaryGreen : brandColors.secondaryText,
                            borderRadius: '8px',
                            border: customerMetrics.count > 0 ? `1px solid ${brandColors.borderGreen}` : 'none',
                          }}
                        />
                      </TableCell>

                      {/* Total Spent */}
                      <TableCell align="right">
                        <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: customerMetrics.totalSpent > 0 ? brandColors.primaryText : brandColors.secondaryText }}>
                          ₹{customerMetrics.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>

                      {/* Status (Active/Blocked + Verified/Unverified) */}
                      <TableCell>
                        <Stack spacing={0.6} alignItems="flex-start">
                          {/* Block Status */}
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.2,
                              py: 0.35,
                              borderRadius: '50px',
                              backgroundColor: user.isBlocked ? '#FEE2E2' : '#DCFCE7',
                              color: user.isBlocked ? '#DC2626' : '#16A34A',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: user.isBlocked ? '#EF4444' : '#22C55E',
                              }}
                            />
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </Box>

                          {/* Verification Status */}
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.2,
                              py: 0.35,
                              borderRadius: '50px',
                              backgroundColor: user.isVerified ? brandColors.lightBlue : '#FEF3C7',
                              color: user.isVerified ? brandColors.blueAccent : '#D97706',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            <Box
                              sx={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                backgroundColor: user.isVerified ? brandColors.blueAccent : '#F59E0B',
                              }}
                            />
                            {user.isVerified ? 'Verified' : 'Unverified'}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: brandColors.secondaryText }} />
                          <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 600 }}>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                          {/* Quick View Button */}
                          <Tooltip title="View Customer Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewCustomer(user)}
                              sx={{
                                color: brandColors.blueAccent,
                                backgroundColor: brandColors.lightBlue,
                                borderRadius: '10px',
                                p: 0.85,
                                '&:hover': {
                                  backgroundColor: '#DBEAFE',
                                },
                              }}
                            >
                              <ViewIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Quick Edit Button */}
                          <Tooltip title="Edit Customer">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(user)}
                              sx={{
                                color: brandColors.primaryGreen,
                                backgroundColor: brandColors.lightGreen,
                                borderRadius: '10px',
                                p: 0.85,
                                '&:hover': {
                                  backgroundColor: brandColors.borderGreen,
                                },
                              }}
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* More Options Dropdown */}
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenActionMenu(e, user)}
                            sx={{
                              color: brandColors.secondaryText,
                              backgroundColor: '#F8FAFC',
                              borderRadius: '10px',
                              p: 0.85,
                              '&:hover': {
                                backgroundColor: '#E2E8F0',
                                color: brandColors.primaryText,
                              },
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination Footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            borderTop: `1px solid ${brandColors.divider}`,
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
            Showing <strong>{filteredUsers.length === 0 ? 0 : page * rowsPerPage + 1}</strong> to{' '}
            <strong>{Math.min((page + 1) * rowsPerPage, filteredUsers.length)}</strong> of{' '}
            <strong>{filteredUsers.length}</strong> customers
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              startIcon={<ChevronLeftIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: brandColors.border,
                color: brandColors.primaryText,
                '&:hover': {
                  borderColor: brandColors.primaryGreen,
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              Previous
            </Button>

            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: brandColors.primaryText, px: 1 }}>
              Page {page + 1} of {totalPages}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              endIcon={<ChevronRightIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: brandColors.border,
                color: brandColors.primaryText,
                '&:hover': {
                  borderColor: brandColors.primaryGreen,
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              Next
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Row Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: {
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            minWidth: 190,
            py: 0.5,
            border: `1px solid ${brandColors.border}`,
          },
        }}
      >
        <MenuItem onClick={() => handleViewCustomer(activeMenuUser)}>
          <ListItemIcon sx={{ color: brandColors.blueAccent }}>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => handleOpenEditDialog(activeMenuUser)}>
          <ListItemIcon sx={{ color: brandColors.primaryGreen }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Customer" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => handleViewCustomerOrders(activeMenuUser)}>
          <ListItemIcon sx={{ color: brandColors.orange }}>
            <OrderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Orders" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => handleOpenBlockDialog(activeMenuUser)}>
          <ListItemIcon sx={{ color: activeMenuUser?.isBlocked ? '#16A34A' : '#D97706' }}>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={activeMenuUser?.isBlocked ? 'Activate Account' : 'Deactivate Account'}
            primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
          />
        </MenuItem>

        <MenuItem onClick={() => handleOpenDeleteDialog(activeMenuUser)} sx={{ color: '#EF4444' }}>
          <ListItemIcon sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete Customer" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* ======================================================== */}
      {/* CUSTOMER DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500, md: 540 },
            p: 3.5,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        {selectedUser && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
                Customer Overview
              </Typography>
              <IconButton
                onClick={() => setDetailDrawerOpen(false)}
                sx={{
                  color: brandColors.secondaryText,
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: '#F1F5F9' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Scrollable Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {/* Profile Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: '20px',
                  backgroundColor: '#F8FAFC',
                  border: `1px solid ${brandColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '20px',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    background: selectedUser.isBlocked
                      ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                      : `linear-gradient(135deg, ${brandColors.primaryGreen} 0%, ${brandColors.darkGreen} 100%)`,
                    color: '#FFFFFF',
                  }}
                >
                  {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'C'}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: brandColors.primaryText }}>
                      {selectedUser.name || 'Unnamed Customer'}
                    </Typography>
                    <Chip
                      label="Customer"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: brandColors.lightGreen,
                        color: brandColors.primaryGreen,
                        borderRadius: '6px',
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.5 }}>
                    ID: {selectedUser._id}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip
                      label={selectedUser.isBlocked ? 'Blocked' : 'Active'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: selectedUser.isBlocked ? '#FEE2E2' : '#DCFCE7',
                        color: selectedUser.isBlocked ? '#DC2626' : '#16A34A',
                        borderRadius: '50px',
                      }}
                    />
                    <Chip
                      label={selectedUser.isVerified ? 'Verified' : 'Unverified'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: selectedUser.isVerified ? brandColors.lightBlue : '#FEF3C7',
                        color: selectedUser.isVerified ? brandColors.blueAccent : '#D97706',
                        borderRadius: '50px',
                      }}
                    />
                  </Stack>
                </Box>
              </Paper>

              {/* Customer Stats Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: `1px solid ${brandColors.border}`,
                      backgroundColor: brandColors.white,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: brandColors.secondaryText, textTransform: 'uppercase' }}>
                      Orders Placed
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: brandColors.primaryText, mt: 0.5 }}>
                      {userOrderMetrics[selectedUser._id]?.count || 0}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: `1px solid ${brandColors.border}`,
                      backgroundColor: brandColors.white,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: brandColors.secondaryText, textTransform: 'uppercase' }}>
                      Total Spend
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: brandColors.primaryGreen, mt: 0.5 }}>
                      ₹{(userOrderMetrics[selectedUser._id]?.totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Contact & Profile Details */}
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: brandColors.primaryText, mb: 2 }}>
                Account Information
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: '16px',
                  border: `1px solid ${brandColors.border}`,
                  backgroundColor: brandColors.white,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Mobile Phone:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: brandColors.primaryText }}>
                      {selectedUser.mobile_number}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Email Address:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: brandColors.primaryText }}>
                      {selectedUser.email || 'Not configured'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Joined Marketplace:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: brandColors.primaryText }}>
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Account Status:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: selectedUser.isBlocked ? '#DC2626' : '#16A34A' }}>
                      {selectedUser.isBlocked ? 'Blocked / Inactive' : 'Active & Verified'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Order History Preview */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: brandColors.primaryText }}>
                  Recent Orders ({userOrderMetrics[selectedUser._id]?.count || 0})
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    navigate('/orders');
                  }}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: brandColors.primaryGreen,
                  }}
                >
                  View All Orders
                </Button>
              </Box>

              {userOrderMetrics[selectedUser._id]?.ordersList?.length > 0 ? (
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  {userOrderMetrics[selectedUser._id].ordersList.slice(0, 5).map((order) => (
                    <Paper
                      key={order._id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '14px',
                        border: `1px solid ${brandColors.border}`,
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: brandColors.primaryText }}>
                          #{order._id.slice(-6).toUpperCase()}
                        </Typography>
                        <Chip
                          label={order.status || 'Placed'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              order.status === 'Delivered'
                                ? '#DCFCE7'
                                : order.status === 'Cancelled'
                                ? '#FEE2E2'
                                : brandColors.lightOrange,
                            color:
                              order.status === 'Delivered'
                                ? '#16A34A'
                                : order.status === 'Cancelled'
                                ? '#DC2626'
                                : brandColors.orange,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.78rem', color: brandColors.secondaryText }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'} • {order.items?.length || 1} item(s)
                        </Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: brandColors.primaryText }}>
                          ₹{Number(order.final_total || order.sub_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 3,
                    textAlign: 'center',
                    borderRadius: '14px',
                    border: `1px dashed ${brandColors.border}`,
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                    No orders placed yet by this customer.
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Drawer Bottom Actions */}
            <Box sx={{ pt: 2, borderTop: `1px solid ${brandColors.divider}` }}>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      handleOpenEditDialog(selectedUser);
                    }}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: brandColors.border,
                      color: brandColors.primaryText,
                      py: 1,
                    }}
                  >
                    Edit Profile
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<BlockIcon />}
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      handleOpenBlockDialog(selectedUser);
                    }}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      backgroundColor: selectedUser.isBlocked ? '#16A34A' : '#D97706',
                      color: '#FFFFFF',
                      py: 1,
                      '&:hover': {
                        backgroundColor: selectedUser.isBlocked ? '#15803D' : '#B45309',
                      },
                    }}
                  >
                    {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* EDIT CUSTOMER DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
              Edit Customer Profile
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.2 }}>
              Update customer display name and contact email address
            </Typography>
          </Box>
          <IconButton onClick={handleCloseEditDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: brandColors.divider, py: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Rahul Sharma"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rahul@example.com"
                helperText="Optional: used for receipts and order communication"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Registered Mobile Number"
                value={selectedUser?.mobile_number || ''}
                disabled
                helperText="Mobile number is the primary authenticated ID and cannot be changed"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseEditDialog}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              color: brandColors.secondaryText,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={submitting || !formData.name.trim()}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: brandColors.primaryGreen,
              color: '#FFFFFF',
              px: 3,
              '&:hover': {
                backgroundColor: brandColors.darkGreen,
              },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* BLOCK / UNBLOCK CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brandColors.primaryText }}>
          {selectedUser?.isBlocked ? 'Activate Customer Account?' : 'Deactivate / Block Customer?'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: brandColors.secondaryText, lineHeight: 1.5 }}>
            Are you sure you want to {selectedUser?.isBlocked ? 'unblock and reactivate' : 'block'}{' '}
            <strong>{selectedUser?.name || selectedUser?.mobile_number}</strong>?
            {selectedUser?.isBlocked
              ? ' This customer will immediately regain access to place orders on AapnuBazaar.'
              : ' This customer will be prevented from signing in and placing orders.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setBlockDialogOpen(false)}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              color: brandColors.secondaryText,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmToggleBlock}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: selectedUser?.isBlocked ? '#16A34A' : '#D97706',
              color: '#FFFFFF',
              px: 2.5,
              '&:hover': {
                backgroundColor: selectedUser?.isBlocked ? '#15803D' : '#B45309',
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : selectedUser?.isBlocked ? (
              'Reactivate Customer'
            ) : (
              'Block Customer'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
          Delete Customer Account?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: brandColors.secondaryText, lineHeight: 1.5 }}>
            Are you sure you want to permanently delete customer{' '}
            <strong>{selectedUser?.name || selectedUser?.mobile_number}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.82rem' }}>
            This action cannot be undone. Customer profile and records will be removed.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              color: brandColors.secondaryText,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              px: 2.5,
              '&:hover': {
                backgroundColor: '#DC2626',
              },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
