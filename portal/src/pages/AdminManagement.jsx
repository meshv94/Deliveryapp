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
  MenuItem,
  FormControlLabel,
  Switch,
  Autocomplete,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  Tooltip,
  Skeleton,
  InputBase,
} from '@mui/material';
import {
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  AddRounded as AddIcon,
  CloseRounded as CloseIcon,
  AdminPanelSettingsOutlined as AdminIcon,
  SupervisorAccountOutlined as SuperAdminIcon,
  VerifiedUserOutlined as VerifiedIcon,
  BlockRounded as BlockIcon,
  SearchRounded as SearchIcon,
  RefreshRounded as RefreshIcon,
  StorefrontRounded as StoreIcon,
  ShoppingBagOutlined as OrderIcon,
  Inventory2Outlined as ProductIcon,
  EmailOutlined as EmailIcon,
  CalendarTodayOutlined as CalendarIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  VisibilityOutlined as ViewIcon,
  LockOutlined as LockIcon,
  SecurityOutlined as SecurityIcon,
  PersonOutlineRounded as PersonIcon,
} from '@mui/icons-material';
import adminService from '../services/adminService';
import vendorService from '../services/vendorService';
import { useColorMode } from '../theme/ThemeContext';

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

const AdminManagement = () => {
  const { BRAND, isDark } = useColorMode();
  // Core Data State
  const [admins, setAdmins] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog & Drawer States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignVendorsDialogOpen, setAssignVendorsDialogOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    isActive: true,
    canManageOrders: false,
    canManageProducts: false,
    canUpdateVendor: false,
  });
  const [selectedVendors, setSelectedVendors] = useState([]);

  // Fetch data on mount
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

      const [adminsRes, vendorsRes] = await Promise.allSettled([
        adminService.getAllAdmins(),
        vendorService.getAllVendors(),
      ]);

      if (adminsRes.status === 'fulfilled') {
        setAdmins(adminsRes.value?.data || []);
      } else {
        throw new Error(adminsRes.reason?.message || 'Failed to fetch administrators');
      }

      if (vendorsRes.status === 'fulfilled') {
        setVendors(vendorsRes.value?.data || []);
      }
    } catch (err) {
      console.error('Error loading admin management data:', err);
      setError(err.message || 'Failed to load administrator records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Open Form
  const handleOpenFormDialog = (admin = null) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        password: '',
        role: admin.role || 'admin',
        isActive: admin.isActive !== undefined ? admin.isActive : true,
        canManageOrders: admin.permissions?.canManageOrders || false,
        canManageProducts: admin.permissions?.canManageProducts || false,
        canUpdateVendor: admin.permissions?.canUpdateVendor || false,
      });

      const currentVendors = admin.assignedVendors || admin.vendor_ids || [];
      const matched = vendors.filter((v) =>
        currentVendors.some((cv) => (cv?._id || cv) === v._id)
      );
      setSelectedVendors(matched);
    } else {
      setSelectedAdmin(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        isActive: true,
        canManageOrders: true,
        canManageProducts: true,
        canUpdateVendor: false,
      });
      setSelectedVendors([]);
    }
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedAdmin(null);
  };

  const handleOpenViewDrawer = (admin) => {
    setSelectedAdmin(admin);
    setViewDrawerOpen(true);
  };

  const handleCloseViewDrawer = () => {
    setViewDrawerOpen(false);
    setSelectedAdmin(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.name.trim()) throw new Error('Staff name is required.');
      if (!formData.email.trim()) throw new Error('Email address is required.');

      const assignedIds = selectedVendors.map((v) => v._id);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        isActive: formData.isActive,
        permissions: {
          canManageOrders: formData.role === 'super_admin' ? true : formData.canManageOrders,
          canManageProducts: formData.role === 'super_admin' ? true : formData.canManageProducts,
          canUpdateVendor: formData.role === 'super_admin' ? true : formData.canUpdateVendor,
        },
        vendor_ids: assignedIds,
        assignedVendors: assignedIds,
      };

      if (formData.password) {
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        payload.password = formData.password;
      }

      if (selectedAdmin) {
        await adminService.updateAdmin(selectedAdmin._id, payload);
        setSuccess('Administrator profile updated successfully!');
      } else {
        if (!formData.password) {
          throw new Error('Password is required for new administrator accounts.');
        }
        await adminService.createAdmin(payload);
        setSuccess('Administrator created successfully!');
      }

      handleCloseFormDialog();
      loadAllData(true);
    } catch (err) {
      console.error('Error saving admin:', err);
      setError(err.message || 'Failed to save administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await adminService.deleteAdmin(selectedAdmin._id);
      setSuccess('Administrator deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
      loadAllData(true);
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError(err.message || 'Failed to delete administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'SUPER_ADMIN' && a.role === 'super_admin') ||
        (roleFilter === 'ADMIN' && a.role !== 'super_admin');

      return matchesSearch && matchesRole;
    });
  }, [admins, searchQuery, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / rowsPerPage));
  const paginatedAdmins = filteredAdmins.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const superAdminCount = admins.filter((a) => a.role === 'super_admin').length;
  const storeAdminCount = admins.filter((a) => a.role !== 'super_admin').length;

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
            Staff Administration
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Manage team members, administrator roles, granular permissions and store assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
          onClick={() => handleOpenFormDialog()}
          sx={{
            backgroundColor: BRAND.green,
            color: '#FFFFFF',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            px: 2.2,
            py: 0.9,
            minHeight: 40,
            boxShadow: '0 4px 12px rgba(8, 127, 91, 0.24)',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            '&:hover': {
              backgroundColor: BRAND.darkGreen,
              boxShadow: '0 6px 16px rgba(8, 127, 91, 0.32)',
            },
          }}
        >
          + Add Administrator
        </Button>
      </Box>

      {/* ======================================================== */}
      {/* 2. SUMMARY FILTER TABS */}
      {/* ======================================================== */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
        {[
          { label: 'All Staff', value: admins.length, filter: 'ALL', bg: BRAND.lightGreen, color: BRAND.green },
          { label: 'Super Admins', value: superAdminCount, filter: 'SUPER_ADMIN', bg: isDark ? 'rgba(124,58,237,0.18)' : '#EDE9FE', color: isDark ? '#A78BFA' : '#7C3AED' },
          { label: 'Store Admins', value: storeAdminCount, filter: 'ADMIN', bg: BRAND.lightBlue, color: BRAND.blue },
        ].map((tab) => {
          const isSelected = roleFilter === tab.filter;
          return (
            <Box
              key={tab.filter}
              onClick={() => {
                setRoleFilter(tab.filter);
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
              Staff Directory
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              {filteredAdmins.length} {filteredAdmins.length === 1 ? 'account' : 'accounts'} registered
            </Typography>
          </Box>

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
              placeholder="Search staff members..."
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
                  <TableCell>Staff Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell align="center">Assigned Stores</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} sx={{ py: 1.6 }}>
                        <Skeleton variant="text" width="100%" height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <AdminIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                        No administrators found
                      </Typography>
                      <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3 }}>
                        {searchQuery ? `No results matching "${searchQuery}"` : 'Add team members to delegate access.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAdmins.map((admin) => {
                    const isSuper = admin.role === 'super_admin';
                    const currentVendors = admin.assignedVendors || admin.vendor_ids || [];
                    const assignedCount = currentVendors.length;

                    return (
                      <TableRow
                        key={admin._id}
                        hover
                        sx={{
                          '& td': { borderBottom: `1px solid ${BRAND.border}`, py: 1.3 },
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: BRAND.tableHover },
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        {/* Member */}
                        <TableCell onClick={() => handleOpenViewDrawer(admin)}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: isSuper ? (isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE') : BRAND.lightBlue,
                                color: isSuper ? (isDark ? '#A78BFA' : '#7C3AED') : BRAND.blue,
                                fontSize: '13px',
                                fontWeight: 700,
                              }}
                            >
                              {admin.name ? admin.name[0].toUpperCase() : 'A'}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                                {admin.name}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                                {admin.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Role */}
                        <TableCell onClick={() => handleOpenViewDrawer(admin)}>
                          <Chip
                            icon={isSuper ? <SuperAdminIcon sx={{ fontSize: '14px !important', color: `${isDark ? '#A78BFA' : '#7C3AED'} !important` }} /> : <AdminIcon sx={{ fontSize: '14px !important', color: `${BRAND.blue} !important` }} />}
                            label={isSuper ? 'Super Admin' : 'Store Admin'}
                            size="small"
                            sx={{
                              bgcolor: isSuper ? (isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE') : BRAND.lightBlue,
                              color: isSuper ? (isDark ? '#A78BFA' : '#7C3AED') : BRAND.blue,
                              fontWeight: 700,
                              fontSize: '11px',
                              height: 24,
                            }}
                          />
                        </TableCell>

                        {/* Permissions */}
                        <TableCell onClick={() => handleOpenViewDrawer(admin)}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {isSuper ? (
                              <Chip label="Full Access" size="small" sx={{ bgcolor: BRAND.lightGreen, color: BRAND.green, fontWeight: 700, fontSize: '10.5px', height: 20 }} />
                            ) : (
                              <>
                                {admin.permissions?.canManageOrders && (
                                  <Chip label="Orders" size="small" sx={{ bgcolor: BRAND.innerCard, color: BRAND.text, fontWeight: 600, fontSize: '10.5px', height: 20, border: `1px solid ${BRAND.border}` }} />
                                )}
                                {admin.permissions?.canManageProducts && (
                                  <Chip label="Products" size="small" sx={{ bgcolor: BRAND.innerCard, color: BRAND.text, fontWeight: 600, fontSize: '10.5px', height: 20, border: `1px solid ${BRAND.border}` }} />
                                )}
                                {admin.permissions?.canUpdateVendor && (
                                  <Chip label="Vendors" size="small" sx={{ bgcolor: BRAND.innerCard, color: BRAND.text, fontWeight: 600, fontSize: '10.5px', height: 20, border: `1px solid ${BRAND.border}` }} />
                                )}
                                {!admin.permissions?.canManageOrders && !admin.permissions?.canManageProducts && !admin.permissions?.canUpdateVendor && (
                                  <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>View Only</Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </TableCell>

                        {/* Assigned stores */}
                        <TableCell align="center" onClick={() => handleOpenViewDrawer(admin)}>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: isSuper ? BRAND.green : BRAND.text }}>
                            {isSuper ? 'All Stores' : `${assignedCount} store${assignedCount !== 1 ? 's' : ''}`}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell onClick={() => handleOpenViewDrawer(admin)}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.2,
                              py: 0.3,
                              borderRadius: '50px',
                              backgroundColor: admin.isActive ? BRAND.lightGreen : BRAND.redLight,
                              color: admin.isActive ? BRAND.green : BRAND.red,
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: admin.isActive ? BRAND.green : BRAND.red }} />
                            {admin.isActive ? 'Active' : 'Disabled'}
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDrawer(admin)}
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

                            <Tooltip title="Edit Permissions">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenFormDialog(admin)}
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

                            <Tooltip title="Delete Administrator">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(admin)}
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
          ) : paginatedAdmins.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AdminIcon sx={{ fontSize: 36, color: BRAND.muted, display: 'block', mx: 'auto', mb: 1 }} />
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No staff members found</Typography>
            </Box>
          ) : (
            paginatedAdmins.map((admin) => {
              const isSuper = admin.role === 'super_admin';

              return (
                <Paper
                  key={admin._id}
                  elevation={0}
                  onClick={() => handleOpenViewDrawer(admin)}
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
                      <Avatar sx={{ width: 34, height: 34, bgcolor: isSuper ? (isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE') : BRAND.lightBlue, color: isSuper ? (isDark ? '#A78BFA' : '#7C3AED') : BRAND.blue, fontSize: '13px', fontWeight: 700 }}>
                        {admin.name ? admin.name[0].toUpperCase() : 'A'}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                          {admin.name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                          {admin.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={isSuper ? 'Super Admin' : 'Admin'}
                      size="small"
                      sx={{
                        bgcolor: isSuper ? (isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE') : BRAND.lightBlue,
                        color: isSuper ? (isDark ? '#A78BFA' : '#7C3AED') : BRAND.blue,
                        fontWeight: 700,
                        height: 20,
                        fontSize: '10.5px',
                      }}
                    />
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
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredAdmins.length)} of {filteredAdmins.length} staff
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
      {/* 4. VIEW ADMIN DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={viewDrawerOpen}
        onClose={handleCloseViewDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
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
            Administrator Profile
          </Typography>
          <IconButton onClick={handleCloseViewDrawer} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedAdmin && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  bgcolor: selectedAdmin.role === 'super_admin' ? (isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE') : BRAND.lightBlue,
                  color: selectedAdmin.role === 'super_admin' ? (isDark ? '#A78BFA' : '#7C3AED') : BRAND.blue,
                  fontSize: '24px',
                  fontWeight: 800,
                  borderRadius: '16px',
                }}
              >
                {selectedAdmin.name ? selectedAdmin.name[0].toUpperCase() : 'A'}
              </Avatar>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text, mt: 1.5 }}>
                {selectedAdmin.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={selectedAdmin.role === 'super_admin' ? 'Super Administrator' : 'Store Administrator'}
                  size="small"
                  sx={{
                    bgcolor: selectedAdmin.role === 'super_admin' ? (isDark ? 'rgba(124,58,237,0.2)' : '#EDE9FE') : BRAND.lightBlue,
                    color: selectedAdmin.role === 'super_admin' ? (isDark ? '#A78BFA' : '#7C3AED') : BRAND.blue,
                    fontWeight: 700,
                    height: 20,
                  }}
                />
              </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                Account & Security
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                  <Typography sx={{ fontSize: '13px', color: BRAND.text, fontWeight: 600 }}>
                    {selectedAdmin.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>
                    Created: {formatDate(selectedAdmin.createdAt)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              {(() => {
                const assignedList = selectedAdmin.assignedVendors || selectedAdmin.vendor_ids || [];
                return (
                  <>
                    <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.2 }}>
                      Assigned Stores ({assignedList.length})
                    </Typography>
                    {selectedAdmin.role === 'super_admin' ? (
                      <Typography sx={{ fontSize: '13px', color: BRAND.green, fontWeight: 700 }}>
                        Full Access across all marketplace stores
                      </Typography>
                    ) : assignedList.length > 0 ? (
                      <Stack spacing={0.8}>
                        {assignedList.map((v) => {
                          const vName = v.name || (vendors.find((item) => item._id === (v._id || v))?.name) || 'Store Partner';
                          return (
                            <Box key={v._id || v} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StoreIcon sx={{ fontSize: 15, color: BRAND.muted }} />
                              <Typography sx={{ fontSize: '12.5px', color: BRAND.text, fontWeight: 600 }}>
                                {vName}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>
                        No specific stores assigned
                      </Typography>
                    )}
                  </>
                );
              })()}
            </Paper>

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  const a = selectedAdmin;
                  handleCloseViewDrawer();
                  handleOpenFormDialog(a);
                }}
                sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: BRAND.border, color: BRAND.text }}
              >
                Edit Admin
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* 5. ADD / EDIT ADMIN MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            margin: { xs: 1.5, sm: 3 },
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', color: BRAND.text }}>
              {selectedAdmin ? 'Edit Administrator' : 'Add New Administrator'}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
              {selectedAdmin ? 'Update staff member access levels and store management' : 'Grant admin portal credentials to a team member'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseFormDialog} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 }, borderColor: BRAND.border }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                InputProps={{
                  sx: {
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: BRAND.innerCard,
                    color: BRAND.text,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                InputProps={{
                  sx: {
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: BRAND.innerCard,
                    color: BRAND.text,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label={selectedAdmin ? 'Change Password (Optional)' : 'Password *'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!selectedAdmin}
                InputProps={{
                  sx: {
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: BRAND.innerCard,
                    color: BRAND.text,
                  },
                }}
                helperText={selectedAdmin ? 'Leave blank to keep unchanged' : 'Minimum 6 characters'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Role *"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                InputProps={{
                  sx: {
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: BRAND.innerCard,
                    color: BRAND.text,
                  },
                }}
              >
                <MenuItem value="admin">Store Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </TextField>
            </Grid>

            {formData.role !== 'super_admin' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5, borderColor: BRAND.border }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1, mt: 1 }}>
                    Module Permissions
                  </Typography>
                  <Stack spacing={0.5}>
                    <FormControlLabel
                      control={<Switch checked={formData.canManageOrders} onChange={handleInputChange} name="canManageOrders" color="primary" />}
                      label={<Typography sx={{ fontSize: '13px', color: BRAND.text }}>Can Manage Orders & Delivery</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={formData.canManageProducts} onChange={handleInputChange} name="canManageProducts" color="primary" />}
                      label={<Typography sx={{ fontSize: '13px', color: BRAND.text }}>Can Manage Products & Catalog</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={formData.canUpdateVendor} onChange={handleInputChange} name="canUpdateVendor" color="primary" />}
                      label={<Typography sx={{ fontSize: '13px', color: BRAND.text }}>Can Edit Store Settings</Typography>}
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 0.5, borderColor: BRAND.border }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1, mt: 1 }}>
                    Assigned Stores
                  </Typography>
                  <Autocomplete
                    multiple
                    size="small"
                    options={vendors}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => (option?._id || option) === (value?._id || value)}
                    value={selectedVendors}
                    onChange={(event, newValue) => setSelectedVendors(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select stores to assign or remove..."
                        InputProps={{
                          ...params.InputProps,
                          sx: {
                            borderRadius: '8px',
                            fontSize: '13px',
                            backgroundColor: BRAND.innerCard,
                            color: BRAND.text,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${BRAND.border}`, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseFormDialog} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              backgroundColor: BRAND.green,
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              px: 3,
              py: 0.8,
              '&:hover': { backgroundColor: BRAND.darkGreen },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : selectedAdmin ? 'Save Changes' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '14px',
            p: 1,
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
          Delete Administrator?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to delete <strong style={{ color: BRAND.text }}>{selectedAdmin?.name}</strong>? This administrator will immediately lose access to the portal.
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagement;
