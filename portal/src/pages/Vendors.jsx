import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
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
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import vendorService from '../services/vendorService';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mobile_number: '',
    address: '',
    city: '',
    pincode: '',
    packaging_charge: 0,
    delivery_charge: 0,
    convenience_charge: 0,
    vendor_image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Fetch vendors on mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAllVendors();
      setVendors(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (vendor = null) => {
    if (vendor) {
      // Edit mode
      setSelectedVendor(vendor);
      setFormData({
        name: vendor.name || '',
        description: vendor.description || '',
        mobile_number: vendor.mobile_number || '',
        address: vendor.address || '',
        city: vendor.city || '',
        pincode: vendor.pincode || '',
        packaging_charge: vendor.packaging_charge || 0,
        delivery_charge: vendor.delivery_charge || 0,
        convenience_charge: vendor.convenience_charge || 0,
        vendor_image: null,
      });
      setImagePreview(vendor.vendor_image || null);
    } else {
      // Add mode
      setSelectedVendor(null);
      setFormData({
        name: '',
        description: '',
        mobile_number: '',
        address: '',
        city: '',
        pincode: '',
        packaging_charge: 0,
        delivery_charge: 0,
        convenience_charge: 0,
        vendor_image: null,
      });
      setImagePreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVendor(null);
    setFormData({
      name: '',
      description: '',
      mobile_number: '',
      address: '',
      city: '',
      pincode: '',
      packaging_charge: 0,
      delivery_charge: 0,
      convenience_charge: 0,
      vendor_image: null,
    });
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        vendor_image: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Create FormData
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('mobile_number', formData.mobile_number);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('pincode', formData.pincode);
      data.append('packaging_charge', formData.packaging_charge);
      data.append('delivery_charge', formData.delivery_charge);
      data.append('convenience_charge', formData.convenience_charge);

      if (formData.vendor_image) {
        data.append('vendor_image', formData.vendor_image);
      }

      if (selectedVendor) {
        // Update
        await vendorService.updateVendor(selectedVendor._id, data);
        setSuccess('Vendor updated successfully!');
      } else {
        // Create
        await vendorService.createVendor(data);
        setSuccess('Vendor created successfully!');
      }

      handleCloseDialog();
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await vendorService.deleteVendor(selectedVendor._id);
      setSuccess('Vendor deleted successfully!');
      setDeleteDialog(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to delete vendor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Box>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Vendors Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Add Vendor
        </Button>
      </Box>

      {/* Vendors Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
              <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vendor Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No vendors found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor._id} hover>
                  <TableCell>
                    <Avatar src={vendor.vendor_image} alt={vendor.name} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{vendor.name}</TableCell>
                  <TableCell>{vendor.mobile_number}</TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell>
                    <Chip
                      label={vendor.isBlocked ? 'Blocked' : 'Active'}
                      size="small"
                      color={vendor.isBlocked ? 'error' : 'success'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="info" onClick={() => handleOpenDialog(vendor)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(vendor)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Image Upload */}
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                {imagePreview && (
                  <Avatar
                    src={imagePreview}
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
                  />
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                >
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Packaging Charge"
                name="packaging_charge"
                type="number"
                value={formData.packaging_charge}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Delivery Charge"
                name="delivery_charge"
                type="number"
                value={formData.delivery_charge}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Convenience Charge"
                name="convenience_charge"
                type="number"
                value={formData.convenience_charge}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : selectedVendor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Vendor?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedVendor?.name}</strong>? This action cannot be undone.
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
    </Box>
  );
};

export default Vendors;
