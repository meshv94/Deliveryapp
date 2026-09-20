import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

const Settings = () => {
  return (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' }, color: '#0F172A', mb: 0.5 }}>
          Platform Settings
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
          Manage your administrator profile and general platform configurations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Settings Bento */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: '#0F172A' }}>
              Profile Settings
            </Typography>

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #00A3FF 0%, #0077E6 100%)',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                  }}
                >
                  AD
                </Avatar>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#E2E8F0',
                    color: '#0088FF',
                    '&:hover': {
                      borderColor: '#0088FF',
                      backgroundColor: '#EBF5FF',
                    },
                  }}
                >
                  Change Photo
                </Button>
              </Box>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    defaultValue="Admin User"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    defaultValue="admin@deliveryapp.com"
                    variant="outlined"
                    type="email"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    defaultValue="+91 9876543210"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    defaultValue="Super Admin"
                    variant="outlined"
                    disabled
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: '#F1F5F9' }} />

              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Change Password
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 1 }}>
                <Button
                  variant="outlined"
                  sx={{
                    borderRadius: '12px',
                    borderColor: '#E2E8F0',
                    color: '#64748B',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    '&:hover': { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    background: '#0088FF',
                    color: '#fff',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3,
                    boxShadow: '0 4px 14px rgba(0, 136, 255, 0.25)',
                    '&:hover': {
                      background: '#0077E6',
                    },
                  }}
                >
                  Save Changes
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Application Settings Bento */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3.5,
              borderRadius: '24px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 800, color: '#0F172A' }}>
              Application Settings
            </Typography>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="App Name"
                defaultValue="AapnuBazaar"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Support Email"
                defaultValue="support@aapnubazaar.com"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <TextField
                fullWidth
                label="Support Phone"
                defaultValue="+91 9876543210"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
              <Button
                variant="contained"
                fullWidth
                sx={{
                  background: '#0088FF',
                  color: '#fff',
                  borderRadius: '12px',
                  py: 1.2,
                  fontWeight: 700,
                  textTransform: 'none',
                  mt: 2,
                  boxShadow: '0 4px 14px rgba(0, 136, 255, 0.25)',
                  '&:hover': {
                    background: '#0077E6',
                  },
                }}
              >
                Update Settings
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
