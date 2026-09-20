import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Fade,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import AddressFormDialog from '../components/AddressFormDialog';

const AddressPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get('/app/addresses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        setAddresses(response.data || []);
      } else {
        setError(response.message || 'Failed to load addresses');
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError(err.response?.data?.message || 'Failed to load addresses');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedAddress(null);
    setDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (address) => {
    setSelectedAddress(address);
    setDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = (address) => {
    setSelectedAddress(address);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.delete(`/app/addresses/${selectedAddress._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        setSuccess('Address deleted successfully!');
        setDeleteDialogOpen(false);
        setSelectedAddress(null);
        fetchAddresses();
      } else {
        setError(response.message || 'Failed to delete address');
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      setError(err.response?.data?.message || 'Failed to delete address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      let response;
      if (selectedAddress) {
        // Update existing address
        response = await apiClient.put(
          `/app/addresses/${selectedAddress._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Add new address
        response = await apiClient.post('/app/addresses', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (response.success) {
        setSuccess(
          selectedAddress ? 'Address updated successfully!' : 'Address added successfully!'
        );
        setDialogOpen(false);
        setSelectedAddress(null);
        fetchAddresses();
      } else {
        setError(response.message || 'Failed to save address');
      }
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'home':
        return <HomeIcon sx={{ fontSize: '1.5rem' }} />;
      case 'work':
        return <WorkIcon sx={{ fontSize: '1.5rem' }} />;
      default:
        return <LocationOnIcon sx={{ fontSize: '1.5rem' }} />;
    }
  };

  if (loading) {
    return (
      <Container
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#087F5B' }} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading addresses...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box
            sx={{
              mb: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', md: '2.125rem' },
                  color: '#151515',
                  mb: 0.5,
                }}
              >
                My Addresses
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage your delivery addresses
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{
                backgroundColor: '#087F5B',
                color: '#fff',
                fontWeight: 700,
                px: 3,
                py: 1.25,
                borderRadius: '10px',
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
                '&:hover': {
                  backgroundColor: '#075B43',
                },
              }}
            >
              Add New Address
            </Button>
          </Box>

          {/* Success/Error Messages */}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Addresses List */}
          {addresses.length === 0 ? (
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                py: 8,
              }}
            >
              <Box
                sx={{
                  fontSize: '4rem',
                  mb: 2,
                  filter: 'grayscale(1)',
                  opacity: 0.5,
                }}
              >
                📍
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                No Addresses Found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Add your first delivery address to get started
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{
                  borderColor: '#087F5B',
                  color: '#087F5B',
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#075B43',
                    backgroundColor: 'rgba(8, 127, 91, 0.05)',
                  },
                }}
              >
                Add Address
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {addresses.map((address) => (
                <Grid item xs={12} md={6} key={address._id}>
                  <Card
                    sx={{
                      borderRadius: '16px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      height: '100%',
                      position: 'relative',
                      border: address.isDefault ? '2px solid #087F5B' : '1px solid #E5E7EB',
                      backgroundColor: address.isDefault ? 'rgba(8, 127, 91, 0.02)' : '#fff',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-2px)',
                        borderColor: '#087F5B',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header with Type and Default Badge */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: '10px',
                              backgroundColor: 'rgba(8, 127, 91, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#087F5B',
                            }}
                          >
                            {getAddressIcon(address.type)}
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                color: '#151515',
                              }}
                            >
                              {address.type || 'Address'}
                            </Typography>
                            {address.isDefault && (
                              <Chip
                                label="Default"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(8, 127, 91, 0.1)',
                                  color: '#087F5B',
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(address)}
                            sx={{
                              color: '#087F5B',
                              '&:hover': { backgroundColor: 'rgba(8, 127, 91, 0.1)' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(address)}
                            sx={{
                              color: '#ef5350',
                              '&:hover': { backgroundColor: 'rgba(239, 83, 80, 0.1)' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Address Details */}
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PersonIcon sx={{ color: '#087F5B', fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {address.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PhoneIcon sx={{ color: '#087F5B', fontSize: '1.2rem' }} />
                          <Typography variant="body2">{address.mobile_number}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <LocationOnIcon sx={{ color: '#087F5B', fontSize: '1.2rem' }} />
                          <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#6B7280' }}>
                            {address.address}
                            {address.city && `, ${address.city}`}
                            {address.pincode && ` - ${address.pincode}`}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Fade>

      {/* Add/Edit Address Dialog */}
      <AddressFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedAddress}
        submitting={submitting}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Address?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to delete this address? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{
              borderColor: '#E5E7EB',
              color: '#6B7280',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#9CA3AF',
                backgroundColor: '#FAFAF7',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: '#ef5350',
              color: '#fff',
              fontWeight: 700,
              '&:hover': {
                backgroundColor: '#d32f2f',
              },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AddressPage;
