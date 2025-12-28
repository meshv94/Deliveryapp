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
  CircularProgress,
  Alert,
  Switch,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import moduleService from '../services/moduleService';

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    active: true,
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Fetch modules on mount
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await moduleService.getAllModules();
      setModules(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (module = null) => {
    if (module) {
      // Edit mode
      setSelectedModule(module);
      setFormData({
        name: module.name || '',
        active: module.active !== undefined ? module.active : true,
        image: null,
      });
      setImagePreview(module.image || null);
    } else {
      // Add mode
      setSelectedModule(null);
      setFormData({
        name: '',
        active: true,
        image: null,
      });
      setImagePreview(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedModule(null);
    setFormData({
      name: '',
      active: true,
      image: null,
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
        image: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Create FormData for file upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('active', formData.active);

      if (formData.image) {
        data.append('image', formData.image);
      }

      if (selectedModule) {
        // Update
        await moduleService.updateModule(selectedModule._id, data);
        setSuccess('Module updated successfully!');
      } else {
        // Create
        await moduleService.createModule(data);
        setSuccess('Module created successfully!');
      }

      handleCloseDialog();
      fetchModules();
    } catch (err) {
      setError(err.message || 'Failed to save module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (module) => {
    setSelectedModule(module);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await moduleService.deleteModule(selectedModule._id);
      setSuccess('Module deleted successfully!');
      setDeleteDialog(false);
      setSelectedModule(null);
      fetchModules();
    } catch (err) {
      setError(err.message || 'Failed to delete module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (module) => {
    try {
      const data = {
        name: module.name,
        active: !module.active,
      };
      await moduleService.updateModule(module._id, data);
      setSuccess(`Module ${data.active ? 'activated' : 'deactivated'} successfully!`);
      fetchModules();
    } catch (err) {
      setError(err.message || 'Failed to update module status');
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
            Modules Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage application modules and their status
          </Typography>
        </Box>
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
          Add Module
        </Button>
      </Box>

      {/* Modules Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
              <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Module Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No modules found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              modules.map((module) => (
                <TableRow key={module._id} hover>
                  <TableCell>
                    <Avatar
                      src={module.image || ''}
                      alt={module.name}
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 2,
                        bgcolor: '#667eea',
                      }}
                      variant="rounded"
                    >
                      {!module.image && module.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{module.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={module.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={module.active ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {new Date(module.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={module.active}
                      onChange={() => handleToggleActive(module)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <IconButton size="small" color="info" onClick={() => handleOpenDialog(module)} title="Edit Module">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(module)} title="Delete Module">
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {selectedModule ? 'Edit Module' : 'Add New Module'}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Module Name */}
            <TextField
              fullWidth
              label="Module Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter module name"
            />

            {/* Image Upload */}
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                Module Image
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {formData.image ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>

              {imagePreview && (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 200,
                    height: 150,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid #e0e0e0',
                    mx: 'auto',
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Module preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Active Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Status:
              </Typography>
              <Switch
                checked={formData.active}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, active: e.target.checked }))
                }
                color="primary"
              />
              <Typography variant="body2" color="text.secondary">
                {formData.active ? 'Active' : 'Inactive'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !formData.name.trim()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : selectedModule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Module?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedModule?.name}</strong>? This action cannot be undone.
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

export default Modules;
