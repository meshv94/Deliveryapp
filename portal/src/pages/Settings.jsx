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
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Profile Settings
            </Typography>

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  AD
                </Avatar>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Change Photo
                </Button>
              </Box>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    defaultValue="Admin User"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    defaultValue="admin@deliveryapp.com"
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    defaultValue="+91 9876543210"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    defaultValue="Super Admin"
                    variant="outlined"
                    disabled
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Change Password
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" sx={{ textTransform: 'none' }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textTransform: 'none',
                  }}
                >
                  Save Changes
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Application Settings */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Application Settings
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="App Name"
                defaultValue="DeliveryApp"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Support Email"
                defaultValue="support@deliveryapp.com"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Support Phone"
                defaultValue="+91 9876543210"
                variant="outlined"
              />
              <Button
                variant="contained"
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  mt: 2,
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
