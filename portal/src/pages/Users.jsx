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
} from '@mui/icons-material';
import userService from '../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [blockDialog, setBlockDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isBlocked: false,
    isVerified: false,
  });

  // Fetch users and stats on mount
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await userService.getUserStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      isBlocked: user.isBlocked || false,
      isVerified: user.isVerified || false,
    });
    setEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialog(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      isBlocked: false,
      isVerified: false,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateUser = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const updateData = {
        name: formData.name,
        email: formData.email || undefined,
      };

      await userService.updateUser(selectedUser._id, updateData);
      setSuccess('User updated successfully!');
      handleCloseEditDialog();
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await userService.deleteUser(selectedUser._id);
      setSuccess('User deleted successfully!');
      setDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlockClick = (user) => {
    setSelectedUser(user);
    setBlockDialog(true);
  };

  const handleBlockConfirm = async () => {
    try {
      setSubmitting(true);
      await userService.toggleBlockUser(selectedUser._id);
      setSuccess(
        `User ${selectedUser.isBlocked ? 'unblocked' : 'blocked'} successfully!`
      );
      setBlockDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setSubmitting(false);
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
      <Box sx={{ mb: 3.5 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.5rem', md: '2rem' },
            color: '#0F172A',
            mb: 0.5,
          }}
        >
          Users Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mb: 3 }}>
          Monitor, verify, and manage registered marketplace customers
        </Typography>

        {/* Statistics Bento Cards */}
        {stats && (
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
                        Total Users
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {stats.totalUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#EBF5FF', color: '#0088FF', width: 48, height: 48, borderRadius: '14px' }}>
                      <GroupsIcon sx={{ fontSize: 26 }} />
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
                        Verified Users
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {stats.verifiedUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#DCFCE7', color: '#16A34A', width: 48, height: 48, borderRadius: '14px' }}>
                      <VerifiedUserIcon sx={{ fontSize: 26 }} />
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
                        Blocked Users
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {stats.blockedUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#FEE2E2', color: '#DC2626', width: 48, height: 48, borderRadius: '14px' }}>
                      <PersonOffIcon sx={{ fontSize: 26 }} />
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
                        Active Users
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {stats.activeUsers}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: '#F3E8FF', color: '#9333EA', width: 48, height: 48, borderRadius: '14px' }}>
                      <PersonIcon sx={{ fontSize: 26 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Users Table Bento Card */}
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
                <TableCell>Mobile Number</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                <TableCell>Verified</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: '#64748B', fontWeight: 500 }}>No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 2, px: 2.5 } }}>
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
                          {user.name ? user.name[0].toUpperCase() : 'U'}
                        </Avatar>
                        <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                          {user.name || 'No Name'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{user.mobile_number}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: '#64748B' }}>
                      {user.email || '-'}
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
                          backgroundColor: user.isVerified ? '#DCFCE7' : '#FEF3C7',
                          color: user.isVerified ? '#15803D' : '#B45309',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: user.isVerified ? '#22C55E' : '#F59E0B',
                          }}
                        />
                        {user.isVerified ? 'Verified' : 'Unverified'}
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
                          backgroundColor: user.isBlocked ? '#FEE2E2' : '#DCFCE7',
                          color: user.isBlocked ? '#B91C1C' : '#15803D',
                          fontSize: '0.78rem',
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
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, color: '#64748B', fontSize: '0.85rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEditDialog(user)}
                          title="Edit User"
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
                          onClick={() => handleBlockClick(user)}
                          title={user.isBlocked ? 'Unblock User' : 'Block User'}
                          sx={{
                            color: user.isBlocked ? '#10B981' : '#F59E0B',
                            backgroundColor: user.isBlocked ? '#DCFCE7' : '#FEF3C7',
                            borderRadius: '10px',
                            '&:hover': { backgroundColor: user.isBlocked ? '#BBF7D0' : '#FDE68A' },
                          }}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(user)}
                          title="Delete User"
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

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Edit User
          </Typography>
          <IconButton onClick={handleCloseEditDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={selectedUser?.mobile_number || ''}
                disabled
                helperText="Mobile number cannot be changed"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action
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

      {/* Block/Unblock Confirmation Dialog */}
      <Dialog open={blockDialog} onClose={() => setBlockDialog(false)}>
        <DialogTitle>
          {selectedUser?.isBlocked ? 'Unblock User?' : 'Block User?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {selectedUser?.isBlocked ? 'unblock' : 'block'}{' '}
            <strong>{selectedUser?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedUser?.isBlocked ? 'success' : 'warning'}
            onClick={handleBlockConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : selectedUser?.isBlocked ? (
              'Unblock'
            ) : (
              'Block'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
