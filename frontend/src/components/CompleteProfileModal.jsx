import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
  Chip,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { userAPI } from '../api/endpoints';

const G = {
  green: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EBFBEE',
  orange: '#FF6B00',
  navy: '#14213D',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
};

const CompleteProfileModal = ({
  open,
  initialMobile = '',
  initialName = '',
  initialEmail = '',
  onSuccess,
}) => {
  const [name, setName] = useState(initialName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [mobile, setMobile] = useState(initialMobile || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (initialName && initialName.toLowerCase() !== 'customer') {
      setName(initialName);
    }
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (initialMobile) {
      setMobile(initialMobile);
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem('userData') || '{}');
        if (stored.mobile_number) setMobile(stored.mobile_number);
        if (stored.name && stored.name.toLowerCase() !== 'customer') setName(stored.name);
        if (stored.email) setEmail(stored.email);
      } catch {
        // ignore
      }
    }
  }, [initialName, initialEmail, initialMobile, open]);

  const validate = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      setLoading(true);
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      const response = await userAPI.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
      });

      if (response.success) {
        // Update stored userData
        try {
          const current = JSON.parse(localStorage.getItem('userData') || '{}');
          const updated = {
            ...current,
            name: trimmedName,
            email: trimmedEmail,
            ...(response.data || {}),
          };
          localStorage.setItem('userData', JSON.stringify(updated));
        } catch (err) {
          console.error('Error saving updated userData:', err);
        }

        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.message || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to update profile. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={Boolean(open)}
      disableEscapeKeyDown
      onClose={() => {
        // Strictly prevent dismissal on backdrop click or escape
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 99998,
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '24px',
          width: '100%',
          maxWidth: 460,
          p: { xs: 2.5, sm: 3.5 },
          backgroundColor: '#FFFFFF',
          border: `1px solid ${G.border}`,
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
          zIndex: 99999,
          overflow: 'visible',
          position: 'relative',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* AapnuBazaar Icon Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${G.green} 0%, ${G.darkGreen} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(8, 127, 91, 0.28)',
              mb: 2,
              position: 'relative',
            }}
          >
            <VerifiedUserIcon sx={{ fontSize: 34 }} />
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: G.orange,
                border: '2px solid #FFFFFF',
              }}
            />
          </Box>

          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.35rem', sm: '1.5rem' },
              color: G.text,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Complete Your Profile
          </Typography>

          <Typography
            sx={{
              color: G.muted,
              fontSize: '0.88rem',
              mt: 0.8,
              lineHeight: 1.45,
              maxWidth: 360,
            }}
          >
            Please provide your name and email to personalize your AapnuBazaar experience and receive order updates.
          </Typography>

          {mobile && (
            <Chip
              icon={<PhoneIphoneIcon sx={{ fontSize: '15px !important', color: `${G.green} !important` }} />}
              label={`+91 ${mobile.replace(/^(\+91|91)/, '')} • Verified`}
              size="small"
              sx={{
                mt: 1.8,
                backgroundColor: G.lightGreen,
                color: G.green,
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: '10px',
                border: `1px solid rgba(8, 127, 91, 0.2)`,
                py: 0.5,
              }}
            />
          )}
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              borderRadius: '14px',
              mb: 2.5,
              fontSize: '0.85rem',
              fontWeight: 600,
              border: '1px solid #FCA5A5',
            }}
          >
            {error}
          </Alert>
        )}

        {/* Input Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.2}>
            <Box>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: G.text,
                  mb: 0.8,
                }}
              >
                Full Name <span style={{ color: '#E03131' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your full name (e.g. Rahul Sharma)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: null }));
                  }
                  if (error) setError(null);
                }}
                error={Boolean(fieldErrors.name)}
                helperText={fieldErrors.name}
                disabled={loading}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: fieldErrors.name ? '#E03131' : G.muted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    fontSize: '0.92rem',
                    backgroundColor: '#F8FAFC',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#FFFFFF',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                    },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: G.text,
                  mb: 0.8,
                }}
              >
                Email Address <span style={{ color: '#E03131' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email address (e.g. rahul@example.com)"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: null }));
                  }
                  if (error) setError(null);
                }}
                error={Boolean(fieldErrors.email)}
                helperText={fieldErrors.email}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon sx={{ color: fieldErrors.email ? '#E03131' : G.muted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    fontSize: '0.92rem',
                    backgroundColor: '#F8FAFC',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#FFFFFF',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                    },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{
                mt: 1,
                py: 1.4,
                borderRadius: '14px',
                backgroundColor: G.green,
                color: '#FFFFFF',
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 8px 20px rgba(8, 127, 91, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: G.darkGreen,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 10px 24px rgba(8, 127, 91, 0.35)',
                },
                '&:disabled': {
                  backgroundColor: '#94A3B8',
                  color: '#FFFFFF',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} thickness={4} sx={{ color: '#FFFFFF' }} />
              ) : (
                'Save & Continue'
              )}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileModal;
