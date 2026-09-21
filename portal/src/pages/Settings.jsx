import React, { useState, useEffect } from 'react';
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
  Alert,
  Tabs,
  Tab,
  Switch,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
  Storefront as StoreIcon,
  LocalShipping as DeliveryIcon,
  NotificationsActive as NotificationIcon,
  Security as SecurityIcon,
  Tune as AppSettingsIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  CurrencyRupee as CurrencyRupeeIcon,
  AccessTime as TimeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PaletteOutlined as ThemeIcon,
  DarkModeOutlined as DarkModeIcon,
  LightModeOutlined as LightModeIcon,
} from '@mui/icons-material';
import adminService from '../services/adminService';
import { useColorMode } from '../theme/ThemeContext';

const DEFAULT_SETTINGS = {
  appName: 'AapnuBazaar',
  tagline: 'Our Local Marketplace',
  supportEmail: 'support@aapnubazaar.com',
  supportPhone: '+91 9876543210',
  currencySymbol: '₹',
  defaultDeliveryCharge: 30,
  defaultPackagingCharge: 10,
  defaultConvenienceCharge: 5,
  defaultPrepTimeMinutes: 20,
  operatingTimezone: 'Asia/Kolkata',
  orderSoundAlert: true,
  emailNotifications: true,
  smsNotifications: true,
  sessionTimeoutMinutes: 60,
  maintenanceMode: false,
};

const Settings = () => {
  const { mode, setMode, toggleTheme, isDark, colors } = useColorMode();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Current logged in admin state
  const [adminProfile, setAdminProfile] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // General App & Marketplace Settings
  const [appSettings, setAppSettings] = useState(DEFAULT_SETTINGS);

  // Load Admin Data and Settings on Mount
  useEffect(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem('adminData') || '{}');
      if (storedAdmin) {
        setAdminProfile((prev) => ({
          ...prev,
          id: storedAdmin._id || storedAdmin.id || '',
          name: storedAdmin.name || 'Administrator',
          email: storedAdmin.email || 'admin@aapnubazaar.com',
          role: storedAdmin.role === 'super_admin' ? 'Super Administrator' : 'Store Admin',
        }));
      }

      const storedSettings = localStorage.getItem('aapnubazaar_platform_settings');
      if (storedSettings) {
        setAppSettings((prev) => ({
          ...prev,
          ...JSON.parse(storedSettings),
        }));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  // Update Profile & Password
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validate password if new password entered
      if (adminProfile.newPassword) {
        if (adminProfile.newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }
        if (adminProfile.newPassword !== adminProfile.confirmPassword) {
          throw new Error('New password and confirmation password do not match.');
        }
      }

      // If we have an active admin ID, update on backend
      if (adminProfile.id) {
        const payload = {
          name: adminProfile.name.trim(),
          email: adminProfile.email.trim(),
        };
        if (adminProfile.newPassword) {
          payload.password = adminProfile.newPassword.trim();
        }

        await adminService.updateAdmin(adminProfile.id, payload);

        // Update local storage
        const currentStored = JSON.parse(localStorage.getItem('adminData') || '{}');
        const updatedStored = { ...currentStored, name: adminProfile.name.trim(), email: adminProfile.email.trim() };
        localStorage.setItem('adminData', JSON.stringify(updatedStored));
      }

      setSuccess('Profile and security credentials updated successfully!');
      setAdminProfile((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Update Platform & Marketplace Settings
  const handleSaveAppSettings = (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      localStorage.setItem('aapnubazaar_platform_settings', JSON.stringify(appSettings));
      setSuccess('Platform and marketplace configuration saved successfully!');
    } catch (err) {
      setError('Failed to save application settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 6 }}>
      {/* Alert Notifications */}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{
            mb: 3,
            borderRadius: '14px',
            backgroundColor: colors.successLight,
            color: colors.success,
            fontWeight: 600,
            border: `1px solid ${colors.borderGreen}`,
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
            backgroundColor: colors.errorLight,
            color: colors.error,
            fontWeight: 600,
            border: `1px solid ${colors.border}`,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.6rem', md: '2.1rem' },
              color: colors.primaryText,
              letterSpacing: '-0.02em',
            }}
          >
            Platform Settings
          </Typography>
          <Chip
            icon={<AppSettingsIcon sx={{ fontSize: '16px !important', color: `${colors.primaryGreen} !important` }} />}
            label="System Configuration"
            size="small"
            sx={{
              backgroundColor: colors.lightGreen,
              color: colors.primaryGreen,
              fontWeight: 700,
              fontSize: '12px',
              borderRadius: '8px',
              border: `1px solid ${colors.borderGreen}`,
            }}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: colors.secondaryText,
            fontWeight: 500,
            mt: 0.5,
            fontSize: '0.92rem',
          }}
        >
          Configure administrator credentials, dark mode theme preferences, store defaults, order delivery policies, and system preferences.
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.white,
          mb: 3.5,
          px: 1,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: colors.primaryGreen,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.92rem',
              color: colors.secondaryText,
              minHeight: 52,
              '&.Mui-selected': {
                color: colors.primaryGreen,
              },
            },
          }}
        >
          <Tab icon={<PersonIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Admin Profile" />
          <Tab icon={<ThemeIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Appearance & Theme" />
          <Tab icon={<StoreIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Marketplace & Store" />
          <Tab icon={<DeliveryIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Delivery Defaults" />
          <Tab icon={<NotificationIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Notifications & Audio" />
          <Tab icon={<SecurityIcon sx={{ fontSize: 18, mr: 0.5 }} />} iconPosition="start" label="Security & Sessions" />
        </Tabs>
      </Paper>

      {/* TAB 0: ADMIN PROFILE & SECURITY */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Profile Details Card */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: '24px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.white,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 3 }}>
                Administrator Profile
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3.5 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '22px',
                    background: `linear-gradient(135deg, ${colors.primaryGreen} 0%, ${colors.darkGreen} 100%)`,
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                  }}
                >
                  {adminProfile.name ? adminProfile.name[0].toUpperCase() : 'A'}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: colors.primaryText }}>
                    {adminProfile.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: colors.secondaryText, mt: 0.3 }}>
                    Role: <strong>{adminProfile.role}</strong>
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3.5, borderColor: colors.divider }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Administrator Name"
                    value={adminProfile.name}
                    onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Login Email"
                    type="email"
                    value={adminProfile.email}
                    onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Role"
                    value={adminProfile.role}
                    disabled
                    helperText="Super Admin role assignment is managed by platform owners"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: colors.paperHover,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3.5 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading || !adminProfile.name.trim() || !adminProfile.email.trim()}
                  sx={{
                    backgroundColor: colors.primaryGreen,
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 3.5,
                    py: 1.1,
                    boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                    '&:hover': {
                      backgroundColor: colors.darkGreen,
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Profile Changes'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Change Password Card */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                borderRadius: '24px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.white,
                boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 1 }}>
                Update Password
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: colors.secondaryText, mb: 3 }}>
                Ensure your administrative password uses at least 6 characters.
              </Typography>

              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={adminProfile.newPassword}
                  onChange={(e) => setAdminProfile({ ...adminProfile, newPassword: e.target.value })}
                  placeholder="Enter at least 6 characters"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                          {showNewPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={adminProfile.confirmPassword}
                  onChange={(e) => setAdminProfile({ ...adminProfile, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <Button
                  variant="contained"
                  startIcon={<LockIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading || !adminProfile.newPassword}
                  sx={{
                    backgroundColor: colors.blueAccent,
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1.2,
                    mt: 1,
                    '&:hover': {
                      backgroundColor: '#1D4ED8',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: APPEARANCE & THEME (DARK / LIGHT MODE) */}
      {activeTab === 1 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '24px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.white,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 1 }}>
            Appearance & Interface Theme
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: colors.secondaryText, mb: 3.5 }}>
            Personalize your AapnuBazaar admin dashboard viewing experience. Choose between modern light and sleek dark mode.
          </Typography>

          <Grid container spacing={3}>
            {/* Light Mode Option */}
            <Grid item xs={12} sm={6}>
              <Box
                onClick={() => setMode('light')}
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  border: `2px solid ${!isDark ? colors.primaryGreen : colors.border}`,
                  backgroundColor: !isDark ? colors.lightGreen : colors.paperHover,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.primaryGreen,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {!isDark && (
                  <Chip
                    label="Active Theme"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      backgroundColor: colors.primaryGreen,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FF6B00',
                    }}
                  >
                    <LightModeIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: colors.primaryText }}>
                      Light Mode
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.secondaryText }}>
                      Crisp, high-contrast bright interface
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    height: 80,
                    borderRadius: '12px',
                    backgroundColor: '#F3F7FB',
                    border: '1px solid #E2E8F0',
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ width: '40%', height: 10, borderRadius: '4px', backgroundColor: '#087F5B' }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: '30%', height: 36, borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }} />
                    <Box sx={{ width: '70%', height: 36, borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }} />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Dark Mode Option */}
            <Grid item xs={12} sm={6}>
              <Box
                onClick={() => setMode('dark')}
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  border: `2px solid ${isDark ? colors.primaryGreen : colors.border}`,
                  backgroundColor: isDark ? colors.lightGreen : colors.paperHover,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.primaryGreen,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {isDark && (
                  <Chip
                    label="Active Theme"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      backgroundColor: colors.primaryGreen,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      backgroundColor: '#1C2541',
                      border: '1px solid #2D3D66',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60A5FA',
                    }}
                  >
                    <DarkModeIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: colors.primaryText }}>
                      Dark Mode
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.secondaryText }}>
                      Sleek, eye-friendly midnight interface
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    height: 80,
                    borderRadius: '12px',
                    backgroundColor: '#0B132B',
                    border: '1px solid #2D3D66',
                    p: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ width: '40%', height: 10, borderRadius: '4px', backgroundColor: '#10B981' }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: '30%', height: 36, borderRadius: '8px', backgroundColor: '#1C2541', border: '1px solid #2D3D66' }} />
                    <Box sx={{ width: '70%', height: 36, borderRadius: '8px', backgroundColor: '#1C2541', border: '1px solid #2D3D66' }} />
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* TAB 2: MARKETPLACE & STORE SETTINGS */}
      {activeTab === 2 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '24px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.white,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 1 }}>
            Marketplace Identity & Support
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: colors.secondaryText, mb: 3.5 }}>
            Public marketplace details displayed in customer app headers, receipts, and order notifications.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marketplace App Name"
                value={appSettings.appName}
                onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand Tagline"
                value={appSettings.tagline}
                onChange={(e) => setAppSettings({ ...appSettings, tagline: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Support Contact Email"
                type="email"
                value={appSettings.supportEmail}
                onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Support Phone Helpline"
                value={appSettings.supportPhone}
                onChange={(e) => setAppSettings({ ...appSettings, supportPhone: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Currency Symbol"
                value={appSettings.currencySymbol}
                onChange={(e) => setAppSettings({ ...appSettings, currencySymbol: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Operating Timezone"
                value={appSettings.operatingTimezone}
                onChange={(e) => setAppSettings({ ...appSettings, operatingTimezone: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAppSettings}
              disabled={loading}
              sx={{
                backgroundColor: colors.primaryGreen,
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                px: 3.5,
                py: 1.1,
                boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                '&:hover': {
                  backgroundColor: colors.darkGreen,
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Marketplace Settings'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* TAB 3: DELIVERY & ORDER DEFAULTS */}
      {activeTab === 3 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '24px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.white,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 1 }}>
            Delivery & Fee Policies
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: colors.secondaryText, mb: 3.5 }}>
            Default marketplace rates used when initializing new merchant store contracts.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Default Delivery Charge (₹)"
                type="number"
                value={appSettings.defaultDeliveryCharge}
                onChange={(e) => setAppSettings({ ...appSettings, defaultDeliveryCharge: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Default Packaging Fee (₹)"
                type="number"
                value={appSettings.defaultPackagingCharge}
                onChange={(e) => setAppSettings({ ...appSettings, defaultPackagingCharge: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Default Platform Fee (₹)"
                type="number"
                value={appSettings.defaultConvenienceCharge}
                onChange={(e) => setAppSettings({ ...appSettings, defaultConvenienceCharge: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Default Prep Time (Mins)"
                type="number"
                value={appSettings.defaultPrepTimeMinutes}
                onChange={(e) => setAppSettings({ ...appSettings, defaultPrepTimeMinutes: Number(e.target.value) })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAppSettings}
              disabled={loading}
              sx={{
                backgroundColor: colors.primaryGreen,
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                px: 3.5,
                py: 1.1,
                boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                '&:hover': {
                  backgroundColor: colors.darkGreen,
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Delivery Defaults'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* TAB 4: NOTIFICATIONS & AUDIO */}
      {activeTab === 4 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '24px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.white,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 1 }}>
            Notification & Audio Preferences
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: colors.secondaryText, mb: 3.5 }}>
            Manage portal ringers, dispatch chime alerts, and email notifications.
          </Typography>

          <Stack spacing={2.5}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                backgroundColor: colors.paperHover,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: colors.primaryText }}>
                  Incoming Order Audio Chime
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.secondaryText }}>
                  Play an audible sound chime on the Order Management screen when a new order is received.
                </Typography>
              </Box>
              <Switch
                checked={appSettings.orderSoundAlert}
                onChange={(e) => setAppSettings({ ...appSettings, orderSoundAlert: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primaryGreen },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.primaryGreen },
                }}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                backgroundColor: colors.paperHover,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: colors.primaryText }}>
                  Email Digest & Critical Alerts
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.secondaryText }}>
                  Send email notifications for high-priority platform events, cancellations, and daily summaries.
                </Typography>
              </Box>
              <Switch
                checked={appSettings.emailNotifications}
                onChange={(e) => setAppSettings({ ...appSettings, emailNotifications: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primaryGreen },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.primaryGreen },
                }}
              />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                backgroundColor: colors.paperHover,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: colors.primaryText }}>
                  Customer SMS Updates
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.secondaryText }}>
                  Trigger automated order confirmation and delivery status SMS to shopper mobile numbers.
                </Typography>
              </Box>
              <Switch
                checked={appSettings.smsNotifications}
                onChange={(e) => setAppSettings({ ...appSettings, smsNotifications: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: colors.primaryGreen },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.primaryGreen },
                }}
              />
            </Paper>
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAppSettings}
              disabled={loading}
              sx={{
                backgroundColor: colors.primaryGreen,
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                px: 3.5,
                py: 1.1,
                boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                '&:hover': {
                  backgroundColor: colors.darkGreen,
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Notification Preferences'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* TAB 5: SECURITY & SESSIONS */}
      {activeTab === 5 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '24px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.white,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: colors.primaryText, mb: 1 }}>
            Security & Authentication Policies
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: colors.secondaryText, mb: 3.5 }}>
            Configure session timeouts and portal access security safeguards.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Admin Portal Session Expiry (Minutes)"
                type="number"
                value={appSettings.sessionTimeoutMinutes}
                onChange={(e) => setAppSettings({ ...appSettings, sessionTimeoutMinutes: Number(e.target.value) })}
                helperText="Inactive administrator tokens expire automatically after this duration"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  backgroundColor: colors.paperHover,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: colors.primaryText }}>
                    Marketplace Maintenance Mode
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.secondaryText }}>
                    Temporarily pause storefront checkouts for scheduled maintenance upgrades.
                  </Typography>
                </Box>
                <Switch
                  checked={appSettings.maintenanceMode}
                  onChange={(e) => setAppSettings({ ...appSettings, maintenanceMode: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: colors.orange },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.orange },
                  }}
                />
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveAppSettings}
              disabled={loading}
              sx={{
                backgroundColor: colors.primaryGreen,
                color: '#FFFFFF',
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                px: 3.5,
                py: 1.1,
                boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
                '&:hover': {
                  backgroundColor: colors.darkGreen,
                },
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Save Security Policies'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Settings;
