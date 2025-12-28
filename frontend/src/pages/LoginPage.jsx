import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Phone, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CanvasBackground from '../components/CanvasBackground';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loading, error, otpSent, sendOtp, verifyOtp, isAuthenticated, setOtpSent } = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timer, setTimer] = useState(0);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/modules');
    }
  }, [isAuthenticated, navigate]);

  // Timer for resend OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Validate mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }

    const result = await sendOtp(mobileNumber, name);

    if (result.success) {
      setSuccessMessage('OTP sent successfully to your mobile number');
      setTimer(120); // 2 minutes countdown
    } else {
      setLocalError(result.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Validate OTP
    if (otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }

    const result = await verifyOtp(mobileNumber, otp);

    if (result.success) {
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/modules');
      }, 1000);
    } else {
      setLocalError(result.message);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setLocalError('');
    setSuccessMessage('');

    const result = await sendOtp(mobileNumber, name);

    if (result.success) {
      setSuccessMessage('OTP resent successfully');
      setTimer(120);
    } else {
      setLocalError(result.message);
    }
  };

  const handleGoBack = () => {
    setOtpSent(false);
    setOtp('');
    setLocalError('');
    setSuccessMessage('');
    setTimer(0);
  };

  return (
    <>
      <CanvasBackground />
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {otpSent ? 'Enter the OTP sent to your mobile' : 'Login or Register with your mobile number'}
              </Typography>
            </Box>

            {(error || localError) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || localError}
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter your 10-digit mobile number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  disabled={loading}
                  required
                />

                <TextField
                  fullWidth
                  label="Name (Optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  sx={{ mb: 3 }}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #603d87 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OTP sent to: <strong>+91 {mobileNumber}</strong>
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                  disabled={loading}
                  required
                  inputProps={{ maxLength: 6 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #603d87 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                </Button>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="text"
                    onClick={handleGoBack}
                    disabled={loading}
                    sx={{ color: 'text.secondary' }}
                  >
                    Change Number
                  </Button>

                  <Button
                    variant="text"
                    onClick={handleResendOtp}
                    disabled={loading || timer > 0}
                    sx={{ color: timer > 0 ? 'text.disabled' : 'primary.main' }}
                  >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                  </Button>
                </Box>
              </form>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default LoginPage;
