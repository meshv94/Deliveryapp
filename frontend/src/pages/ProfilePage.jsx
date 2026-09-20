import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Fade,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get('/app/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        setUserData(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
        });
      } else {
        setError(response.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setEditMode(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Prepare update data (only send changed fields)
      const updateData = {};
      if (formData.name && formData.name !== userData.name) {
        updateData.name = formData.name;
      }
      if (formData.email && formData.email !== userData.email) {
        updateData.email = formData.email;
      }

      // Check if there are any changes
      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      const response = await apiClient.put('/app/profile/update', updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.success) {
        setUserData(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
        });
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Loading State
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
            Loading your profile...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error State (No user data)
  if (!userData) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || 'Failed to load profile'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Fade in timeout={600}>
        <Box>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', md: '2.125rem' },
                color: '#151515',
                mb: 0.5,
              }}
            >
              My Profile
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage your personal information
            </Typography>
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

          {/* Profile Card */}
          <Card
            elevation={0}
            sx={{
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Card Header with AapnuBazaar Identity */}
            <Box
              sx={{
                backgroundColor: '#087F5B',
                p: 4,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 96, md: 110 },
                  height: { xs: 96, md: 110 },
                  margin: '0 auto',
                  backgroundColor: '#FFFFFF',
                  color: '#087F5B',
                  fontSize: { xs: '2.25rem', md: '2.75rem' },
                  fontWeight: 800,
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.1)',
                  border: '3px solid #FFFFFF',
                }}
              >
                {userData.name
                  ? userData.name.charAt(0).toUpperCase()
                  : userData.mobile_number.charAt(0)}
              </Avatar>
              <Typography
                variant="h5"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  mt: 2,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                {userData.name || 'User'}
              </Typography>
            </Box>

            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                {/* Mobile Number (Read-only) */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    Mobile Number
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: '#FAFAF7',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <PhoneIcon sx={{ color: '#087F5B', fontSize: '1.5rem' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {userData.mobile_number}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Name Field */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    Full Name
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <PersonIcon sx={{ color: '#087F5B', mr: 1 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#FAFAF7',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <PersonIcon sx={{ color: '#087F5B', fontSize: '1.5rem' }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {userData.name || 'Not provided'}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Email Field */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    Email Address
                  </Typography>
                  {editMode ? (
                    <TextField
                      fullWidth
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <EmailIcon sx={{ color: '#087F5B', mr: 1 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: '#FAFAF7',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <EmailIcon sx={{ color: '#087F5B', fontSize: '1.5rem' }} />
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {userData.email || 'Not provided'}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                  {editMode ? (
                    <>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                          backgroundColor: '#087F5B',
                          color: '#fff',
                          fontWeight: 700,
                          py: 1.5,
                          borderRadius: '10px',
                          textTransform: 'none',
                          boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
                          '&:hover': {
                            backgroundColor: '#075B43',
                          },
                        }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={saving}
                        sx={{
                          borderColor: '#E5E7EB',
                          color: '#6B7280',
                          fontWeight: 600,
                          py: 1.5,
                          borderRadius: '10px',
                          textTransform: 'none',
                          '&:hover': {
                            borderColor: '#9CA3AF',
                            backgroundColor: '#FAFAF7',
                          },
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      sx={{
                        backgroundColor: '#087F5B',
                        color: '#fff',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: '10px',
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
                        '&:hover': {
                          backgroundColor: '#075B43',
                        },
                      }}
                    >
                      Edit Profile
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Container>
  );
};

export default ProfilePage;
