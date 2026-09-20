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
  FormControlLabel,
  Switch,
  Autocomplete,
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
} from '@mui/icons-material';
import adminService from '../services/adminService';
import vendorService from '../services/vendorService';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [assignVendorsDialog, setAssignVendorsDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
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

  // Vendor assignment
  const [selectedVendors, setSelectedVendors] = useState([]);

  // Fetch admins and vendors on mount
  useEffect(() => {
    fetchAdmins();
    fetchVendors();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllAdmins();
      setAdmins(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAllVendors();
      setVendors(response.data || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      isActive: true,
      canManageOrders: false,
      canManageProducts: false,
      canUpdateVendor: false,
    });
    setSelectedVendors([]);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialog(false);
    resetForm();
  };

  const handleOpenEditDialog = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '', // Don't pre-fill password
      role: admin.role || 'admin',
      isActive: admin.isActive !== false,
      canManageOrders: admin.permissions?.canManageOrders || false,
      canManageProducts: admin.permissions?.canManageProducts || false,
      canUpdateVendor: admin.permissions?.canUpdateVendor || false,
    });
    setEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setSelectedAdmin(null);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddAdmin = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const adminData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        vendor_ids: selectedVendors.map(v => v._id),
        permissions: {
          canManageOrders: formData.canManageOrders,
          canManageProducts: formData.canManageProducts,
          canUpdateVendor: formData.canUpdateVendor,
        },
      };

      await adminService.addAdmin(adminData);
      setSuccess('Admin created successfully!');
      handleCloseAddDialog();
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: formData.isActive,
        permissions: {
          canManageOrders: formData.canManageOrders,
          canManageProducts: formData.canManageProducts,
          canUpdateVendor: formData.canUpdateVendor,
        },
      };

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password;
      }

      await adminService.updateAdmin(selectedAdmin._id, updateData);
      setSuccess('Admin updated successfully!');
      handleCloseEditDialog();
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to update admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await adminService.deleteAdmin(selectedAdmin._id);
      setSuccess('Admin deleted successfully!');
      setDeleteDialog(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to delete admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAssignVendors = (admin) => {
    setSelectedAdmin(admin);
    setSelectedVendors(admin.vendor_ids || []);
    setAssignVendorsDialog(true);
  };

  const handleAssignVendors = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const vendorIds = selectedVendors.map(v => v._id);
      await adminService.assignVendors(selectedAdmin._id, vendorIds);

      setSuccess('Vendors assigned successfully!');
      setAssignVendorsDialog(false);
      setSelectedAdmin(null);
      setSelectedVendors([]);
      fetchAdmins();
    } catch (err) {
      setError(err.message || 'Failed to assign vendors');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <SuperAdminIcon />;
      case 'admin':
        return <AdminIcon />;
      default:
        return <VerifiedIcon />;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.5rem', md: '2rem' },
              color: '#0F172A',
            }}
          >
            Admin Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontWeight: 500 }}>
            Configure administrators, system permissions, and vendor assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{
            background: '#0088FF',
            color: '#fff',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '12px',
            px: 2.5,
            py: 1.1,
            boxShadow: '0 4px 14px rgba(0, 136, 255, 0.25)',
            '&:hover': {
              background: '#0077E6',
            },
          }}
        >
          Add Admin
        </Button>
      </Box>

      {/* Statistics Bento Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #F1F5F9',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Total Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {admins.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#EBF5FF', color: '#0088FF', width: 48, height: 48, borderRadius: '14px' }}>
                  <AdminIcon sx={{ fontSize: 26 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #F1F5F9',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Active Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {admins.filter((a) => a.isActive).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#DCFCE7', color: '#16A34A', width: 48, height: 48, borderRadius: '14px' }}>
                  <CheckCircleIcon sx={{ fontSize: 26 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #F1F5F9',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Super Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {admins.filter((a) => a.role === 'super_admin').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#F3E8FF', color: '#9333EA', width: 48, height: 48, borderRadius: '14px' }}>
                  <SuperAdminIcon sx={{ fontSize: 26 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #F1F5F9',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                    Blocked Admins
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {admins.filter((a) => a.isBlocked).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#FEE2E2', color: '#DC2626', width: 48, height: 48, borderRadius: '14px' }}>
                  <BlockIcon sx={{ fontSize: 26 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admins Table Bento Card */}
      <Paper
        sx={{
          borderRadius: '24px',
          border: '1px solid #F1F5F9',
          boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid #F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '0.82rem', py: 2, px: 2.5, backgroundColor: '#FFFFFF' } }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Vendors</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: '#64748B', fontWeight: 500 }}>No admins found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 2, px: 2.5 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: '#EBF5FF',
                            color: '#0088FF',
                            fontWeight: 800,
                            borderRadius: '12px',
                            width: 38,
                            height: 38,
                            fontSize: '0.9rem',
                          }}
                        >
                          {admin.name ? admin.name[0].toUpperCase() : 'A'}
                        </Avatar>
                        <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                          {admin.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{admin.email}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '50px',
                          backgroundColor: admin.role === 'super_admin' ? '#F3E8FF' : '#EBF5FF',
                          color: admin.role === 'super_admin' ? '#7E22CE' : '#0088FF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </Box>
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
                          backgroundColor: admin.isBlocked ? '#FEE2E2' : admin.isActive ? '#DCFCE7' : '#FEF3C7',
                          color: admin.isBlocked ? '#B91C1C' : admin.isActive ? '#15803D' : '#B45309',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: admin.isBlocked ? '#EF4444' : admin.isActive ? '#22C55E' : '#F59E0B',
                          }}
                        />
                        {admin.isBlocked ? 'Blocked' : admin.isActive ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${admin.vendor_ids?.length || 0} vendors`}
                        size="small"
                        onClick={() => handleOpenAssignVendors(admin)}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: 700,
                          backgroundColor: '#F1F5F9',
                          color: '#475569',
                          borderRadius: '8px',
                          '&:hover': { backgroundColor: '#E2E8F0' },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, color: '#64748B', fontSize: '0.85rem' }}>
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(admin)}
                          title="Edit Admin"
                          sx={{
                            color: '#0088FF',
                            backgroundColor: '#EBF5FF',
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: '#D6EBFF' },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(admin)}
                          title="Delete Admin"
                          sx={{
                            color: '#EF4444',
                            backgroundColor: '#FEE2E2',
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: '#FECACA' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add Admin Dialog */}
      <Dialog open={addDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Add New Admin
          </Typography>
          <IconButton onClick={handleCloseAddDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                helperText="Minimum 6 characters"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Assign Vendors {formData.role === 'admin' && '(Required for Admin role)'}
              </Typography>
              <Autocomplete
                multiple
                options={vendors}
                getOptionLabel={(option) => option.name}
                value={selectedVendors}
                onChange={(event, newValue) => {
                  setSelectedVendors(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select vendors"
                    helperText={formData.role === 'admin' ? "Admins can only manage assigned vendors" : "Super admins have access to all vendors"}
                  />
                )}
                disabled={formData.role === 'super_admin'}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Permissions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.canManageOrders}
                        onChange={handleInputChange}
                        name="canManageOrders"
                      />
                    }
                    label="Can Manage Orders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.canManageProducts}
                        onChange={handleInputChange}
                        name="canManageProducts"
                      />
                    }
                    label="Can Manage Products"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.canUpdateVendor}
                        onChange={handleInputChange}
                        name="canUpdateVendor"
                      />
                    }
                    label="Can Update Vendor"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddAdmin}
            disabled={submitting || !formData.name || !formData.email || !formData.password}
            sx={{
              background: '#0088FF',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              '&:hover': { background: '#0077E6' },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Admin Dialog */}
      <Dialog open={editDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Edit Admin
          </Typography>
          <IconButton onClick={handleCloseEditDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                helperText="Leave blank to keep current password"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Permissions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.canManageOrders}
                        onChange={handleInputChange}
                        name="canManageOrders"
                      />
                    }
                    label="Can Manage Orders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.canManageProducts}
                        onChange={handleInputChange}
                        name="canManageProducts"
                      />
                    }
                    label="Can Manage Products"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.canUpdateVendor}
                        onChange={handleInputChange}
                        name="canUpdateVendor"
                      />
                    }
                    label="Can Update Vendor"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateAdmin}
            disabled={submitting}
            sx={{
              background: '#0088FF',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              '&:hover': { background: '#0077E6' },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Admin?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedAdmin?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Vendors Dialog */}
      <Dialog open={assignVendorsDialog} onClose={() => setAssignVendorsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Assign Vendors
          </Typography>
          <IconButton onClick={() => setAssignVendorsDialog(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Select vendors to assign to <strong>{selectedAdmin?.name}</strong>
          </Typography>
          <Autocomplete
            multiple
            options={vendors}
            getOptionLabel={(option) => option.name}
            value={selectedVendors}
            onChange={(event, newValue) => {
              setSelectedVendors(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Vendors"
                placeholder="Search vendors..."
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#EBF5FF', color: '#0088FF', fontWeight: 700 }}>
                    {option.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignVendorsDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignVendors}
            disabled={submitting}
            sx={{
              background: '#0088FF',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '12px',
              px: 2.5,
              '&:hover': { background: '#0077E6' },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminManagement;
