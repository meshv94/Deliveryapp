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
  Tooltip,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Skeleton,
  InputBase,
} from '@mui/material';
import {
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  BlockRounded as BlockIcon,
  CheckCircleRounded as CheckCircleIcon,
  CloseRounded as CloseIcon,
  PersonOutlineRounded as PersonIcon,
  VerifiedUserOutlined as VerifiedUserIcon,
  GroupsOutlined as GroupsIcon,
  SearchRounded as SearchIcon,
  RefreshRounded as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  ShoppingBagOutlined as OrderIcon,
  PhoneOutlined as PhoneIcon,
  EmailOutlined as EmailIcon,
  CalendarTodayOutlined as CalendarIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  FilterListRounded as FilterIcon,
  AccountBalanceWalletOutlined as WalletIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import orderService from '../services/orderService';
import { useColorMode } from '../theme/ThemeContext';

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
  });
};

const Users = () => {
  const { BRAND, isDark } = useColorMode();
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
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog & Drawer States
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

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

  // Map customer total spend and order counts
  const userOrderStatsMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(orders)) return map;

    orders.forEach((ord) => {
      if (!ord || !ord.user) return;
      const uid = ord.user._id || ord.user;
      if (!uid) return;

      if (!map[uid]) {
        map[uid] = { count: 0, totalSpent: 0, ordersList: [] };
      }
      map[uid].count += 1;
      map[uid].totalSpent += Number(ord.total_payable_amount) || 0;
      map[uid].ordersList.push(ord);
    });

    return map;
  }, [orders]);

  const handleOpenDetailDrawer = (user) => {
    setSelectedUser(user);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetailDrawer = () => {
    setDetailDrawerOpen(false);
    setSelectedUser(null);
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleEditSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.name.trim()) {
        throw new Error('Customer name is required.');
      }

      await userService.updateUser(selectedUser._id, formData);
      setSuccess('Customer profile updated successfully!');
      handleCloseEditDialog();
      loadAllData(true);
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err.message || 'Failed to update customer details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const handleBlockConfirm = async () => {
    try {
      setSubmitting(true);
      await userService.toggleUserBlock(selectedUser._id);
      setSuccess(`Customer ${selectedUser.isBlocked ? 'unblocked' : 'blocked'} successfully!`);
      setBlockDialogOpen(false);
      setSelectedUser(null);
      loadAllData(true);
    } catch (err) {
      console.error('Error toggling block status:', err);
      setError(err.message || 'Failed to update customer status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await userService.deleteUser(selectedUser._id);
      setSuccess('Customer account deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      if (detailDrawerOpen) setDetailDrawerOpen(false);
      loadAllData(true);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete customer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const phone = (user.mobile || user.mobile_number || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || email.includes(query) || phone.includes(query);

      const isBlocked = Boolean(user.isBlocked);
      const isVerified = Boolean(user.isVerified ?? true);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !isBlocked) ||
        (statusFilter === 'UNVERIFIED' && !isVerified && !isBlocked) ||
        (statusFilter === 'BLOCKED' && isBlocked);

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const activeCount = users.filter((u) => !u.isBlocked).length;
  const blockedCount = users.filter((u) => u.isBlocked).length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 4 }}>
      {/* Alerts */}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
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
            Customers Directory
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Manage registered marketplace customer accounts, orders and activity history
          </Typography>
        </Box>
        <Tooltip title="Refresh customers list">
          <IconButton
            onClick={() => loadAllData(true)}
            sx={{
              backgroundColor: BRAND.white,
              border: `1px solid ${BRAND.border}`,
              borderRadius: '10px',
              width: 36,
              height: 36,
              '&:hover': { backgroundColor: BRAND.innerCard, borderColor: BRAND.green },
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
      </Box>

      {/* ======================================================== */}
      {/* 2. SUMMARY FILTER TABS */}
      {/* ======================================================== */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
        {[
          { label: 'All Customers', value: users.length, filter: 'ALL', bg: BRAND.lightGreen, color: BRAND.green },
          { label: 'Active', value: activeCount, filter: 'ACTIVE', bg: isDark ? 'rgba(16,185,129,0.18)' : '#DCFCE7', color: '#10B981' },
          { label: 'Blocked', value: blockedCount, filter: 'BLOCKED', bg: BRAND.redLight, color: BRAND.red },
        ].map((tab) => {
          const isSelected = (statusFilter === 'ALL' && tab.filter === 'ALL') || (statusFilter === tab.filter);
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
                backgroundColor: isSelected ? (isDark ? 'rgba(16,185,129,0.18)' : tab.bg) : BRAND.white,
                color: isSelected ? tab.color : BRAND.muted,
                border: `1px solid ${isSelected ? tab.color + '40' : BRAND.border}`,
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : tab.bg,
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
                  backgroundColor: isSelected ? `${tab.color}25` : BRAND.innerCard,
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
      {/* 3. MAIN TABLE & TOOLBAR CARD */}
      {/* ======================================================== */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          backgroundColor: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
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
              Registered Accounts
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'customer' : 'customers'} listed
            </Typography>
          </Box>

          {/* Search */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: BRAND.innerCard,
              border: `1px solid ${BRAND.border}`,
              borderRadius: '10px',
              px: 1.5,
              py: 0.55,
              width: { xs: '100%', sm: 240 },
              transition: 'border-color 0.15s ease',
              '&:focus-within': { borderColor: BRAND.green },
            }}
          >
            <SearchIcon sx={{ color: BRAND.muted, fontSize: 17, mr: 1 }} />
            <InputBase
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
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
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact Details</TableCell>
                  <TableCell align="center">Total Orders</TableCell>
                  <TableCell>Total Spent</TableCell>
                  <TableCell>Registered Date</TableCell>
                  <TableCell>Status</TableCell>
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
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <PersonIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                        No customers found
                      </Typography>
                      <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3 }}>
                        {searchQuery ? `No results for "${searchQuery}"` : 'Customer records will appear here.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => {
                    const statsData = userOrderStatsMap[user._id] || { count: 0, totalSpent: 0 };
                    const isBlocked = Boolean(user.isBlocked);

                    return (
                      <TableRow
                        key={user._id}
                        hover
                        sx={{
                          '& td': { borderBottom: `1px solid ${BRAND.border}`, py: 1.3 },
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: BRAND.tableHover },
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        {/* Customer */}
                        <TableCell onClick={() => handleOpenDetailDrawer(user)}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: BRAND.lightGreen,
                                color: BRAND.green,
                                fontSize: '13px',
                                fontWeight: 700,
                              }}
                            >
                              {user.name ? user.name[0].toUpperCase() : 'U'}
                            </Avatar>
                            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                              {user.name || 'AapnuBazaar Customer'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Contact info */}
                        <TableCell onClick={() => handleOpenDetailDrawer(user)}>
                          <Typography sx={{ fontSize: '12.5px', color: BRAND.text, fontWeight: 600 }}>
                            {user.email || '—'}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                            {user.mobile || user.mobile_number || '—'}
                          </Typography>
                        </TableCell>

                        {/* Total Orders */}
                        <TableCell align="center" onClick={() => handleOpenDetailDrawer(user)}>
                          <Chip
                            icon={<OrderIcon sx={{ fontSize: '13px !important', color: statsData.count > 0 ? `${BRAND.blue} !important` : `${BRAND.muted} !important` }} />}
                            label={`${statsData.count} ${statsData.count === 1 ? 'order' : 'orders'}`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '11px',
                              backgroundColor: statsData.count > 0 ? BRAND.lightBlue : BRAND.innerCard,
                              color: statsData.count > 0 ? BRAND.blue : BRAND.muted,
                              borderRadius: '6px',
                              height: 24,
                            }}
                          />
                        </TableCell>

                        {/* Total Spent */}
                        <TableCell onClick={() => handleOpenDetailDrawer(user)}>
                          <Typography sx={{ fontWeight: 800, color: statsData.totalSpent > 0 ? BRAND.green : BRAND.muted, fontSize: '13px' }}>
                            {formatCurrency(statsData.totalSpent)}
                          </Typography>
                        </TableCell>

                        {/* Registered date */}
                        <TableCell onClick={() => handleOpenDetailDrawer(user)}>
                          <Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>
                            {formatDate(user.createdAt)}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell onClick={() => handleOpenDetailDrawer(user)}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.2,
                              py: 0.3,
                              borderRadius: '50px',
                              backgroundColor: isBlocked ? BRAND.redLight : BRAND.lightGreen,
                              color: isBlocked ? BRAND.red : BRAND.green,
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: isBlocked ? BRAND.red : BRAND.green }} />
                            {isBlocked ? 'Blocked' : 'Active'}
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDetailDrawer(user)}
                                sx={{
                                  color: BRAND.blue,
                                  backgroundColor: BRAND.lightBlue,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { opacity: 0.8 },
                                }}
                              >
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Customer">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(user)}
                                sx={{
                                  color: BRAND.muted,
                                  backgroundColor: BRAND.innerCard,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { backgroundColor: BRAND.border, color: BRAND.text },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={isBlocked ? 'Unblock User' : 'Block User'}>
                              <IconButton
                                size="small"
                                onClick={() => handleBlockClick(user)}
                                sx={{
                                  color: isBlocked ? BRAND.green : BRAND.amber,
                                  backgroundColor: isBlocked ? BRAND.lightGreen : BRAND.amberLight,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { opacity: 0.8 },
                                }}
                              >
                                <BlockIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Account">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(user)}
                                sx={{
                                  color: BRAND.red,
                                  backgroundColor: BRAND.redLight,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { opacity: 0.8 },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
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
        </Box>

        {/* ======================================================== */}
        {/* MOBILE RESPONSIVE CARDS */}
        {/* ======================================================== */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: '12px' }} />)
          ) : paginatedUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 36, color: BRAND.muted, display: 'block', mx: 'auto', mb: 1 }} />
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No customers found</Typography>
            </Box>
          ) : (
            paginatedUsers.map((user) => {
              const statsData = userOrderStatsMap[user._id] || { count: 0, totalSpent: 0 };
              const isBlocked = Boolean(user.isBlocked);

              return (
                <Paper
                  key={user._id}
                  elevation={0}
                  onClick={() => handleOpenDetailDrawer(user)}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: BRAND.lightGreen, color: BRAND.green, fontSize: '13px', fontWeight: 700 }}>
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                          {user.name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                          {user.email || user.mobile || 'No contact'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={isBlocked ? 'Blocked' : 'Active'}
                      size="small"
                      sx={{
                        bgcolor: isBlocked ? BRAND.redLight : BRAND.lightGreen,
                        color: isBlocked ? BRAND.red : BRAND.green,
                        fontWeight: 700,
                        height: 20,
                        fontSize: '10.5px',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5, borderTop: `1px solid ${BRAND.border}`, fontSize: '12px' }}>
                    <Typography sx={{ color: BRAND.muted }}>
                      Orders: <strong style={{ color: BRAND.blue }}>{statsData.count}</strong>
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: BRAND.text }}>
                      Spent: {formatCurrency(statsData.totalSpent)}
                    </Typography>
                  </Box>
                </Paper>
              );
            })
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
            borderTop: `1px solid ${BRAND.border}`,
          }}
        >
          <Typography sx={{ fontSize: '12px', color: BRAND.muted, fontWeight: 600 }}>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredUsers.length)} of {filteredUsers.length} customers
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
                    '&:hover': { backgroundColor: n === page ? BRAND.darkGreen : BRAND.tableHover },
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
                '&:disabled': { backgroundColor: BRAND.innerCard, color: BRAND.muted },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ======================================================== */}
      {/* 4. CUSTOMER DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440 },
            p: 3,
            boxSizing: 'border-box',
            backgroundColor: BRAND.white,
            color: BRAND.text,
            borderLeft: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
            Customer Profile
          </Typography>
          <IconButton onClick={handleCloseDetailDrawer} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedUser && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  bgcolor: BRAND.lightGreen,
                  color: BRAND.green,
                  fontSize: '24px',
                  fontWeight: 800,
                  borderRadius: '16px',
                }}
              >
                {selectedUser.name ? selectedUser.name[0].toUpperCase() : 'U'}
              </Avatar>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text, mt: 1.5 }}>
                {selectedUser.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={selectedUser.isBlocked ? 'Blocked Account' : 'Active Account'}
                  size="small"
                  sx={{
                    bgcolor: selectedUser.isBlocked ? BRAND.redLight : BRAND.lightGreen,
                    color: selectedUser.isBlocked ? BRAND.red : BRAND.green,
                    fontWeight: 700,
                    height: 20,
                  }}
                />
              </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                Account Information
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                  <Typography sx={{ fontSize: '13px', color: BRAND.text, fontWeight: 600 }}>
                    {selectedUser.email || 'Email not registered'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                  <Typography sx={{ fontSize: '13px', color: BRAND.text, fontWeight: 600 }}>
                    {selectedUser.mobile || selectedUser.mobile_number || 'Mobile not registered'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>
                    Joined: {formatDate(selectedUser.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                Purchase Activity
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Total Orders Placed:</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: BRAND.blue }}>
                  {userOrderStatsMap[selectedUser._id]?.count || 0} orders
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Total Lifetime Spend:</Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.green }}>
                  {formatCurrency(userOrderStatsMap[selectedUser._id]?.totalSpent || 0)}
                </Typography>
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  const u = selectedUser;
                  handleCloseDetailDrawer();
                  handleOpenEditDialog(u);
                }}
                sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: BRAND.border, color: BRAND.text }}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                color={selectedUser.isBlocked ? 'success' : 'warning'}
                onClick={() => {
                  const u = selectedUser;
                  handleCloseDetailDrawer();
                  handleBlockClick(u);
                }}
                sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
              >
                {selectedUser.isBlocked ? 'Unblock' : 'Block'}
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Edit Customer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '14px',
            p: 0.5,
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
          Edit Customer Profile
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, borderColor: BRAND.border }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              InputProps={{
                sx: {
                  borderRadius: '8px',
                  backgroundColor: BRAND.innerCard,
                  color: BRAND.text,
                },
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              InputProps={{
                sx: {
                  borderRadius: '8px',
                  backgroundColor: BRAND.innerCard,
                  color: BRAND.text,
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, justifyContent: 'space-between', borderColor: BRAND.border }}>
          <Button onClick={handleCloseEditDialog} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={submitting}
            sx={{ bgcolor: BRAND.green, textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: BRAND.darkGreen } }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1,
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: BRAND.text }}>
          {selectedUser?.isBlocked ? 'Unblock Customer Account?' : 'Block Customer Account?'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to {selectedUser?.isBlocked ? 'unblock' : 'block'}{' '}
            <strong style={{ color: BRAND.text }}>{selectedUser?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setBlockDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBlockConfirm}
            disabled={submitting}
            sx={{
              bgcolor: selectedUser?.isBlocked ? BRAND.green : BRAND.amber,
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { opacity: 0.9 },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 1,
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: BRAND.text }}>
          Delete Customer Account?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to delete <strong style={{ color: BRAND.text }}>{selectedUser?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={submitting}
            sx={{ bgcolor: BRAND.red, color: '#FFFFFF', fontWeight: 700, textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
