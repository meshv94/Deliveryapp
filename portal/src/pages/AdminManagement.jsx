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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  Autocomplete,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperAdminIcon,
  VerifiedUser as VerifiedIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Storefront as StoreIcon,
  ShoppingBag as OrderIcon,
  Inventory2 as ProductIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import adminService from '../services/adminService';
import vendorService from '../services/vendorService';
import { brandColors } from '../theme/tokens';

const AdminManagement = () => {
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
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog & Drawer States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignVendorsDialogOpen, setAssignVendorsDialogOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Action Menu State
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [activeMenuAdmin, setActiveMenuAdmin] = useState(null);

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

  // KPI Calculations
  const totalAdminsCount = admins.length;
  const superAdminsCount = admins.filter((a) => a.role === 'super_admin').length;
  const standardAdminsCount = admins.filter((a) => a.role === 'admin').length;
  const activeAdminsCount = admins.filter((a) => a.isActive !== false && !a.isBlocked).length;

  // Filter and Search Admins
  const filteredAdmins = useMemo(() => {
    if (!Array.isArray(admins)) return [];

    return admins.filter((adm) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (adm.name && adm.name.toLowerCase().includes(q)) ||
        (adm.email && adm.email.toLowerCase().includes(q)) ||
        (adm._id && adm._id.toLowerCase().includes(q));

      let matchesRole = true;
      if (roleFilter === 'SUPER_ADMIN') {
        matchesRole = adm.role === 'super_admin';
      } else if (roleFilter === 'ADMIN') {
        matchesRole = adm.role === 'admin';
      }

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = adm.isActive !== false && !adm.isBlocked;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = adm.isActive === false || adm.isBlocked;
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchQuery, roleFilter, statusFilter]);

  // Paginated records
  const paginatedAdmins = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAdmins.slice(start, start + rowsPerPage);
  }, [filteredAdmins, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage) || 1;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, roleFilter, statusFilter, rowsPerPage]);

  // Action Menu Handlers
  const handleOpenActionMenu = (event, admin) => {
    setActionMenuAnchor(event.currentTarget);
    setActiveMenuAdmin(admin);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActiveMenuAdmin(null);
  };

  // Open Form Dialog (Add / Edit)
  const handleOpenAddDialog = () => {
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
    setFormDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleOpenEditDialog = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '', // Leave blank unless updating
      role: admin.role || 'admin',
      isActive: admin.isActive !== false && !admin.isBlocked,
      canManageOrders: admin.permissions?.canManageOrders || false,
      canManageProducts: admin.permissions?.canManageProducts || false,
      canUpdateVendor: admin.permissions?.canUpdateVendor || false,
    });

    // Populate selected vendors
    if (Array.isArray(admin.vendor_ids)) {
      const matchedVendors = vendors.filter((v) =>
        admin.vendor_ids.some((av) => (av._id || av) === v._id)
      );
      setSelectedVendors(matchedVendors);
    } else {
      setSelectedVendors([]);
    }

    setFormDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedAdmin(null);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      if (selectedAdmin) {
        // Update Admin
        const updatePayload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          isActive: formData.isActive,
          permissions: {
            canManageOrders: formData.canManageOrders,
            canManageProducts: formData.canManageProducts,
            canUpdateVendor: formData.canUpdateVendor,
          },
        };

        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        await adminService.updateAdmin(selectedAdmin._id, updatePayload);

        // Update assigned vendors if role is admin
        if (formData.role === 'admin') {
          const vendorIds = selectedVendors.map((v) => v._id);
          await adminService.assignVendors(selectedAdmin._id, vendorIds);
        }

        setSuccess(`Administrator "${formData.name.trim()}" updated successfully!`);
      } else {
        // Create Admin
        if (!formData.password.trim()) {
          throw new Error('Password is required for new administrators.');
        }

        const createPayload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
          vendor_ids: selectedVendors.map((v) => v._id),
          permissions: {
            canManageOrders: formData.canManageOrders,
            canManageProducts: formData.canManageProducts,
            canUpdateVendor: formData.canUpdateVendor,
          },
        };

        await adminService.addAdmin(createPayload);
        setSuccess(`Administrator "${formData.name.trim()}" created successfully!`);
      }

      handleCloseFormDialog();
      await loadAllData(true);
    } catch (err) {
      console.error('Error saving administrator:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign Vendors Dialog Handlers
  const handleOpenAssignVendors = (admin) => {
    setSelectedAdmin(admin);
    if (Array.isArray(admin.vendor_ids)) {
      const matchedVendors = vendors.filter((v) =>
        admin.vendor_ids.some((av) => (av._id || av) === v._id)
      );
      setSelectedVendors(matchedVendors);
    } else {
      setSelectedVendors([]);
    }
    setAssignVendorsDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleSaveAssignVendors = async () => {
    if (!selectedAdmin) return;
    try {
      setSubmitting(true);
      setError(null);

      const vendorIds = selectedVendors.map((v) => v._id);
      await adminService.assignVendors(selectedAdmin._id, vendorIds);

      setSuccess(`Vendor access updated for "${selectedAdmin.name}".`);
      setAssignVendorsDialogOpen(false);
      setSelectedAdmin(null);
      await loadAllData(true);
    } catch (err) {
      console.error('Error assigning vendors:', err);
      setError(err.response?.data?.message || err.message || 'Failed to assign vendors.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Block / Active
  const handleToggleActiveAdmin = async (admin) => {
    try {
      const updateData = {
        name: admin.name,
        isActive: admin.isActive === false ? true : false,
      };
      await adminService.updateAdmin(admin._id, updateData);
      setSuccess(`Administrator "${admin.name}" ${updateData.isActive ? 'activated' : 'deactivated'} successfully!`);
      await loadAllData(true);
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update admin status.');
    }
  };

  // Delete Admin
  const handleOpenDeleteDialog = (admin) => {
    setSelectedAdmin(admin);
    setDeleteDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdmin) return;
    try {
      setSubmitting(true);
      setError(null);

      await adminService.deleteAdmin(selectedAdmin._id);
      setSuccess(`Administrator "${selectedAdmin.name}" deleted successfully!`);
      setDeleteDialogOpen(false);
      if (viewDrawerOpen && selectedAdmin._id === selectedAdmin?._id) {
        setViewDrawerOpen(false);
      }
      setSelectedAdmin(null);
      await loadAllData(true);
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete admin.');
    } finally {
      setSubmitting(false);
    }
  };

  // View Admin Overview Drawer
  const handleViewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setViewDrawerOpen(true);
    handleCloseActionMenu();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setPage(0);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

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
          Loading administrator accounts...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 6 }}>
      {/* Notifications */}
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
              Admin Management
            </Typography>
            <Chip
              icon={<SecurityIcon sx={{ fontSize: '16px !important', color: `${brandColors.primaryGreen} !important` }} />}
              label="Staff & Permissions"
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
            Manage platform administrators, roles, granular permissions, and assigned vendor stores.
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

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={handleOpenAddDialog}
            sx={{
              backgroundColor: brandColors.primaryGreen,
              color: '#FFFFFF',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 700,
              px: 2.5,
              py: 1.1,
              boxShadow: '0 4px 14px rgba(8, 127, 91, 0.28)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: brandColors.darkGreen,
                boxShadow: '0 6px 18px rgba(8, 127, 91, 0.38)',
              },
            }}
          >
            Add Administrator
          </Button>
        </Stack>
      </Box>

      {/* KPI Bento Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Administrators */}
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
                    Total Staff
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.primaryText, fontSize: '1.85rem' }}>
                    {totalAdminsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.primaryGreen, fontWeight: 700, mt: 0.5 }}>
                    Platform Administrators
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
                  <SecurityIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Super Admins */}
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
                    Super Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.orange, fontSize: '1.85rem' }}>
                    {superAdminsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.orange, fontWeight: 700, mt: 0.5 }}>
                    Full System Access
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: brandColors.lightOrange,
                    color: brandColors.orange,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.borderOrange}`,
                  }}
                >
                  <SuperAdminIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Standard Admins */}
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
                    Store Managers
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.blueAccent, fontSize: '1.85rem' }}>
                    {standardAdminsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.blueAccent, fontWeight: 700, mt: 0.5 }}>
                    Assigned Store Access
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
                  <AdminIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Accounts */}
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
                    Active Status
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', fontSize: '1.85rem' }}>
                    {activeAdminsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, mt: 0.5 }}>
                    Can Authenticate
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
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by admin name or email..."
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

          {/* Role Filter */}
          <Grid item xs={12} sm={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Role Filter</InputLabel>
              <Select
                value={roleFilter}
                label="Role Filter"
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: brandColors.border,
                  },
                }}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin Only</MenuItem>
                <MenuItem value="ADMIN">Store Manager (Admin) Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter & Reset */}
          <Grid item xs={12} sm={6} md={3.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
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
                  <MenuItem value="INACTIVE">Inactive Only</MenuItem>
                </Select>
              </FormControl>

              {hasActiveFilters && (
                <Tooltip title="Reset filters">
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

        {/* Filter Summary & Rows Per Page */}
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
            Showing <strong>{filteredAdmins.length}</strong> of <strong>{admins.length}</strong> administrators
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
            </Select>
          </Stack>
        </Box>
      </Paper>

      {/* Main Admins Table Paper */}
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
                <TableCell>Administrator</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Permissions / Access</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: brandColors.adminBg,
                          color: brandColors.secondaryText,
                        }}
                      >
                        <SecurityIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, color: brandColors.primaryText, fontSize: '1rem' }}>
                        No administrators found
                      </Typography>
                      <Typography sx={{ color: brandColors.secondaryText, fontSize: '0.85rem' }}>
                        Create a new administrator or adjust search filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAdmins.map((admin) => {
                  const isSuper = admin.role === 'super_admin';
                  const isActive = admin.isActive !== false && !admin.isBlocked;
                  const assignedCount = Array.isArray(admin.vendor_ids) ? admin.vendor_ids.length : 0;

                  return (
                    <TableRow
                      key={admin._id}
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
                      {/* Name & Avatar */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: '14px',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              background: isSuper
                                ? 'linear-gradient(135deg, #FF6B00 0%, #D97706 100%)'
                                : `linear-gradient(135deg, ${brandColors.blueAccent} 0%, #1D4ED8 100%)`,
                              color: '#FFFFFF',
                              boxShadow: isSuper
                                ? '0 4px 10px rgba(255, 107, 0, 0.2)'
                                : '0 4px 10px rgba(37, 99, 235, 0.2)',
                            }}
                          >
                            {admin.name ? admin.name[0].toUpperCase() : 'A'}
                          </Avatar>
                          <Box>
                            <Typography
                              onClick={() => handleViewAdmin(admin)}
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
                              {admin.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText, mt: 0.2 }}>
                              ID: {admin._id ? `${admin._id.slice(0, 8)}...` : '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <EmailIcon sx={{ fontSize: 15, color: brandColors.secondaryText }} />
                          <Typography sx={{ fontSize: '0.85rem', color: brandColors.primaryText, fontWeight: 500 }}>
                            {admin.email}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell>
                        <Chip
                          icon={
                            isSuper ? (
                              <SuperAdminIcon sx={{ fontSize: '15px !important', color: `${brandColors.orange} !important` }} />
                            ) : (
                              <AdminIcon sx={{ fontSize: '15px !important', color: `${brandColors.blueAccent} !important` }} />
                            )
                          }
                          label={isSuper ? 'Super Admin' : 'Store Admin'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '11.5px',
                            backgroundColor: isSuper ? brandColors.lightOrange : brandColors.lightBlue,
                            color: isSuper ? brandColors.orange : brandColors.blueAccent,
                            borderRadius: '8px',
                            border: isSuper ? `1px solid ${brandColors.borderOrange}` : `1px solid ${brandColors.borderBlue}`,
                          }}
                        />
                      </TableCell>

                      {/* Permissions / Assigned Stores */}
                      <TableCell>
                        {isSuper ? (
                          <Chip
                            label="All Platform Access"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: brandColors.lightGreen,
                              color: brandColors.primaryGreen,
                              borderRadius: '6px',
                              border: `1px solid ${brandColors.borderGreen}`,
                            }}
                          />
                        ) : (
                          <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                            {admin.permissions?.canManageOrders && (
                              <Chip label="Orders" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 600, bgcolor: '#F1F5F9' }} />
                            )}
                            {admin.permissions?.canManageProducts && (
                              <Chip label="Products" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 600, bgcolor: '#F1F5F9' }} />
                            )}
                            {admin.permissions?.canUpdateVendor && (
                              <Chip label="Vendors" size="small" sx={{ height: 20, fontSize: '10px', fontWeight: 600, bgcolor: '#F1F5F9' }} />
                            )}
                            <Chip
                              label={`${assignedCount} store${assignedCount !== 1 ? 's' : ''}`}
                              size="small"
                              onClick={() => handleOpenAssignVendors(admin)}
                              clickable
                              sx={{
                                height: 20,
                                fontSize: '10px',
                                fontWeight: 700,
                                bgcolor: brandColors.lightBlue,
                                color: brandColors.blueAccent,
                              }}
                            />
                          </Stack>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.2,
                            py: 0.35,
                            borderRadius: '50px',
                            backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                            color: isActive ? '#16A34A' : '#DC2626',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: isActive ? '#22C55E' : '#EF4444',
                            }}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 600 }}>
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                          {/* Quick View */}
                          <Tooltip title="View Overview">
                            <IconButton
                              size="small"
                              onClick={() => handleViewAdmin(admin)}
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

                          {/* Quick Edit */}
                          <Tooltip title="Edit Administrator">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(admin)}
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
                            onClick={(e) => handleOpenActionMenu(e, admin)}
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
            Showing <strong>{filteredAdmins.length === 0 ? 0 : page * rowsPerPage + 1}</strong> to{' '}
            <strong>{Math.min((page + 1) * rowsPerPage, filteredAdmins.length)}</strong> of{' '}
            <strong>{filteredAdmins.length}</strong> administrators
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
        <MenuItem onClick={() => handleViewAdmin(activeMenuAdmin)}>
          <ListItemIcon sx={{ color: brandColors.blueAccent }}>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Admin Overview" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => handleOpenEditDialog(activeMenuAdmin)}>
          <ListItemIcon sx={{ color: brandColors.primaryGreen }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Administrator" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        {activeMenuAdmin?.role !== 'super_admin' && (
          <MenuItem onClick={() => handleOpenAssignVendors(activeMenuAdmin)}>
            <ListItemIcon sx={{ color: brandColors.orange }}>
              <StoreIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Assign Stores" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
          </MenuItem>
        )}

        <MenuItem onClick={() => { const a = activeMenuAdmin; handleCloseActionMenu(); if (a) handleToggleActiveAdmin(a); }}>
          <ListItemIcon sx={{ color: a => a?.isActive !== false ? '#D97706' : '#16A34A' }}>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={activeMenuAdmin?.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
            primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => handleOpenDeleteDialog(activeMenuAdmin)} sx={{ color: '#EF4444' }}>
          <ListItemIcon sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete Administrator" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* ======================================================== */}
      {/* ADMIN DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500, md: 540 },
            p: 3.5,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        {selectedAdmin && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
                Administrator Overview
              </Typography>
              <IconButton
                onClick={() => setViewDrawerOpen(false)}
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
                    background:
                      selectedAdmin.role === 'super_admin'
                        ? 'linear-gradient(135deg, #FF6B00 0%, #D97706 100%)'
                        : `linear-gradient(135deg, ${brandColors.blueAccent} 0%, #1D4ED8 100%)`,
                    color: '#FFFFFF',
                  }}
                >
                  {selectedAdmin.name ? selectedAdmin.name[0].toUpperCase() : 'A'}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: brandColors.primaryText }}>
                    {selectedAdmin.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.3 }}>
                    {selectedAdmin.email}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip
                      label={selectedAdmin.role === 'super_admin' ? 'Super Administrator' : 'Store Admin'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          selectedAdmin.role === 'super_admin' ? brandColors.lightOrange : brandColors.lightBlue,
                        color:
                          selectedAdmin.role === 'super_admin' ? brandColors.orange : brandColors.blueAccent,
                        borderRadius: '6px',
                      }}
                    />
                    <Chip
                      label={selectedAdmin.isActive !== false && !selectedAdmin.isBlocked ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor:
                          selectedAdmin.isActive !== false && !selectedAdmin.isBlocked ? '#DCFCE7' : '#FEE2E2',
                        color:
                          selectedAdmin.isActive !== false && !selectedAdmin.isBlocked ? '#16A34A' : '#DC2626',
                        borderRadius: '50px',
                      }}
                    />
                  </Stack>
                </Box>
              </Paper>

              {/* Permissions Summary */}
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: brandColors.primaryText, mb: 1.5 }}>
                Granular Permissions
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
                {selectedAdmin.role === 'super_admin' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <VerifiedIcon sx={{ color: brandColors.primaryGreen, fontSize: 24 }} />
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: brandColors.primaryText }}>
                      Unrestricted Master Access: Can manage orders, products, categories, users, stores, and platform administrators.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.85rem', color: brandColors.primaryText, fontWeight: 600 }}>
                        Manage Orders
                      </Typography>
                      <Chip
                        label={selectedAdmin.permissions?.canManageOrders ? 'Granted' : 'Denied'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: selectedAdmin.permissions?.canManageOrders ? '#DCFCE7' : '#F1F5F9',
                          color: selectedAdmin.permissions?.canManageOrders ? '#16A34A' : '#64748B',
                        }}
                      />
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.85rem', color: brandColors.primaryText, fontWeight: 600 }}>
                        Manage Products & Catalog
                      </Typography>
                      <Chip
                        label={selectedAdmin.permissions?.canManageProducts ? 'Granted' : 'Denied'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: selectedAdmin.permissions?.canManageProducts ? '#DCFCE7' : '#F1F5F9',
                          color: selectedAdmin.permissions?.canManageProducts ? '#16A34A' : '#64748B',
                        }}
                      />
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.85rem', color: brandColors.primaryText, fontWeight: 600 }}>
                        Update Store Settings
                      </Typography>
                      <Chip
                        label={selectedAdmin.permissions?.canUpdateVendor ? 'Granted' : 'Denied'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: selectedAdmin.permissions?.canUpdateVendor ? '#DCFCE7' : '#F1F5F9',
                          color: selectedAdmin.permissions?.canUpdateVendor ? '#16A34A' : '#64748B',
                        }}
                      />
                    </Box>
                  </Stack>
                )}
              </Paper>

              {/* Assigned Stores */}
              {selectedAdmin.role !== 'super_admin' && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: brandColors.primaryText }}>
                      Assigned Stores ({Array.isArray(selectedAdmin.vendor_ids) ? selectedAdmin.vendor_ids.length : 0})
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setViewDrawerOpen(false);
                        handleOpenAssignVendors(selectedAdmin);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', color: brandColors.blueAccent }}
                    >
                      Modify Stores
                    </Button>
                  </Box>

                  {Array.isArray(selectedAdmin.vendor_ids) && selectedAdmin.vendor_ids.length > 0 ? (
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                      {selectedAdmin.vendor_ids.map((v) => {
                        const vObj = vendors.find((vend) => vend._id === (v._id || v)) || v;
                        return (
                          <Paper
                            key={vObj._id || v}
                            elevation={0}
                            sx={{
                              p: 1.8,
                              borderRadius: '14px',
                              border: `1px solid ${brandColors.border}`,
                              backgroundColor: '#F8FAFC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={vObj.vendor_image || ''}
                                variant="rounded"
                                sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#FFFFFF', border: `1px solid ${brandColors.border}` }}
                              >
                                <StoreIcon sx={{ fontSize: 18, color: brandColors.primaryGreen }} />
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: brandColors.primaryText }}>
                                  {vObj.name || 'Store Name'}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                                  {vObj.city || 'Local Marketplace Store'}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        );
                      })}
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
                        No specific stores assigned yet. This admin cannot view orders until stores are linked.
                      </Typography>
                    </Paper>
                  )}
                </>
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
                      setViewDrawerOpen(false);
                      handleOpenEditDialog(selectedAdmin);
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
                    Edit Admin
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setViewDrawerOpen(false);
                      handleToggleActiveAdmin(selectedAdmin);
                    }}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      backgroundColor:
                        selectedAdmin.isActive !== false && !selectedAdmin.isBlocked ? '#D97706' : '#16A34A',
                      color: '#FFFFFF',
                      py: 1,
                      '&:hover': {
                        backgroundColor:
                          selectedAdmin.isActive !== false && !selectedAdmin.isBlocked ? '#B45309' : '#15803D',
                      },
                    }}
                  >
                    {selectedAdmin.isActive !== false && !selectedAdmin.isBlocked ? 'Deactivate' : 'Activate'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* ADD / EDIT ADMIN DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="md"
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
              {selectedAdmin ? 'Edit Administrator' : 'Add New Administrator'}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.2 }}>
              Configure administrator profile, platform role, and store-level permissions
            </Typography>
          </Box>
          <IconButton onClick={handleCloseFormDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: brandColors.divider, py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Administrator Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Vikram Mehta"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address (Login ID)"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="e.g. vikram@aapnubazaar.com"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            {/* Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={selectedAdmin ? 'New Password (leave blank to keep current)' : 'Account Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedAdmin}
                placeholder="Minimum 6 characters"
                helperText={selectedAdmin ? 'Only enter a password if you want to reset it' : 'Used for portal login'}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Administrator Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Administrator Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="admin">Store Admin (Scoped Access)</MenuItem>
                  <MenuItem value="super_admin">Super Administrator (Full System Access)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Granular Permissions Section */}
            {formData.role === 'admin' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: brandColors.primaryText, mb: 1.5 }}>
                    Granular Access Permissions
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      backgroundColor: '#F8FAFC',
                      border: `1px solid ${brandColors.border}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: brandColors.primaryText }}>
                          Manage Orders
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                          View & update status
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.canManageOrders}
                        onChange={(e) => setFormData({ ...formData, canManageOrders: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: brandColors.primaryGreen },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brandColors.primaryGreen },
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      backgroundColor: '#F8FAFC',
                      border: `1px solid ${brandColors.border}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: brandColors.primaryText }}>
                          Manage Products
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                          Create & edit items
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.canManageProducts}
                        onChange={(e) => setFormData({ ...formData, canManageProducts: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: brandColors.primaryGreen },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brandColors.primaryGreen },
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      backgroundColor: '#F8FAFC',
                      border: `1px solid ${brandColors.border}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: brandColors.primaryText }}>
                          Update Store Info
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                          Edit vendor profile
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.canUpdateVendor}
                        onChange={(e) => setFormData({ ...formData, canUpdateVendor: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: brandColors.primaryGreen },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brandColors.primaryGreen },
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* Assign Vendors Autocomplete */}
                <Grid item xs={12}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: brandColors.primaryText, mb: 1 }}>
                    Assign Store Vendors
                  </Typography>
                  <Autocomplete
                    multiple
                    options={vendors}
                    getOptionLabel={(option) => option.name || option.email || ''}
                    value={selectedVendors}
                    onChange={(_, newValue) => setSelectedVendors(newValue)}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select vendor stores this admin can manage..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          key={option._id}
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          sx={{
                            backgroundColor: brandColors.lightGreen,
                            color: brandColors.primaryGreen,
                            fontWeight: 700,
                            borderRadius: '8px',
                          }}
                        />
                      ))
                    }
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseFormDialog}
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
            onClick={handleSubmitForm}
            disabled={submitting || !formData.name.trim() || !formData.email.trim()}
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
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : selectedAdmin ? (
              'Update Administrator'
            ) : (
              'Create Administrator'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* ASSIGN VENDORS DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={assignVendorsDialogOpen}
        onClose={() => setAssignVendorsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: brandColors.primaryText }}>
          Assign Store Vendors to {selectedAdmin?.name}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, mb: 2 }}>
            Select which merchant vendor stores this administrator has permission to view and manage.
          </Typography>

          <Autocomplete
            multiple
            options={vendors}
            getOptionLabel={(option) => option.name || ''}
            value={selectedVendors}
            onChange={(_, newValue) => setSelectedVendors(newValue)}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assigned Vendors"
                placeholder="Search and select vendor stores..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option._id}
                  label={option.name}
                  size="small"
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: brandColors.lightGreen,
                    color: brandColors.primaryGreen,
                    fontWeight: 700,
                    borderRadius: '8px',
                  }}
                />
              ))
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setAssignVendorsDialogOpen(false)}
            disabled={submitting}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: brandColors.secondaryText }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAssignVendors}
            disabled={submitting}
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Save Store Assignments'}
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
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
          Delete Administrator?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: brandColors.secondaryText, lineHeight: 1.5 }}>
            Are you sure you want to permanently remove administrator{' '}
            <strong>{selectedAdmin?.name}</strong> ({selectedAdmin?.email})?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.82rem' }}>
            This action immediately revokes all administrative and portal access.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: brandColors.secondaryText }}
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Administrator'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagement;
