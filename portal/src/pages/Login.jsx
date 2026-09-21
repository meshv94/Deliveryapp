import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Storefront as StoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';
import { brandColors } from '../theme/tokens';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.loginAdmin(formData);

      const token = response.token || response.data?.token;
      const adminData = response.data?.admin || response.data?.user || response.data;

      if (response.success && token) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        navigate('/');
      } else {
        setError(response.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brandColors.adminBg,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 650,
          height: 650,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8, 127, 91, 0.07) 0%, rgba(243, 247, 251, 0) 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 4.5 },
            borderRadius: '24px',
            backgroundColor: brandColors.white,
            border: `1px solid ${brandColors.border}`,
            boxShadow: '0 20px 50px rgba(20, 33, 61, 0.05)',
          }}
        >
          {/* AapnuBazaar Brand Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3.5,
            }}
          >
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${brandColors.primaryGreen} 0%, ${brandColors.darkGreen} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(8, 127, 91, 0.25)',
                position: 'relative',
                mb: 2,
              }}
            >
              <StoreIcon sx={{ color: '#FFFFFF', fontSize: 30 }} />
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: brandColors.orange,
                  border: '2px solid #FFFFFF',
                }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: brandColors.primaryText,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                mb: 0.5,
              }}
            >
              AapnuBazaar
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: brandColors.secondaryText,
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Admin & Operations Portal
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: '14px' }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    '& fieldset': { borderColor: brandColors.border },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: brandColors.primaryGreen },
                  },
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={loading}
                        size="small"
                        sx={{ color: '#94A3B8' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: '#F8FAFC',
                    '& fieldset': { borderColor: brandColors.border },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: brandColors.primaryGreen },
                  },
                }}
              />

              {/* Login Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.4,
                  borderRadius: '14px',
                  backgroundColor: brandColors.primaryGreen,
                  boxShadow: '0 8px 24px rgba(8, 127, 91, 0.25)',
                  textTransform: 'none',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  mt: 1,
                  '&:hover': {
                    backgroundColor: brandColors.darkGreen,
                    boxShadow: '0 10px 28px rgba(8, 127, 91, 0.35)',
                  },
                  '&:disabled': {
                    background: '#CBD5E1',
                    color: '#94A3B8',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  'Sign In to Dashboard'
                )}
              </Button>
            </Stack>
          </form>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              &copy; {new Date().getFullYear()} AapnuBazaar &bull; All Rights Reserved
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
