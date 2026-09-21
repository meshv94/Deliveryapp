import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, Phone, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../api/endpoints';
import CompleteProfileModal from '../components/CompleteProfileModal';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loading, error, otpSent, sendOtp, verifyOtp, isAuthenticated, setOtpSent } = useAuth();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalData, setProfileModalData] = useState({ mobile: '', name: '', email: '' });

  const inputRefs = useRef([]);

  const heroSlides = [
    {
      image: '/aapnubazaar-hero-1.jpg',
      headline: 'Connecting you with fresh delights from local vendors.',
      caption: 'AapnuBazaar — Our Local Marketplace. Fast, trusted delivery at your doorstep.',
      tag: 'Local Marketplace',
      page: '01-04',
    },
    {
      image: '/aapnubazaar-hero-2.jpg',
      headline: 'Fresh artisanal goods and daily essentials delivered.',
      caption: 'Supporting local neighborhood stores with lightning-speed delivery.',
      tag: 'Fresh Delivery',
      page: '02-04',
    },
  ];

  // Redirect if already authenticated ONLY if profile is complete
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (isAuthenticated()) {
        try {
          const res = await userAPI.getProfile();
          if (res?.success && res?.data) {
            const p = res.data;
            const isNameEmpty = !p.name || p.name.trim() === '' || p.name.trim().toLowerCase() === 'customer';
            const isEmailEmpty = !p.email || p.email.trim() === '';
            if (isNameEmpty || isEmailEmpty) {
              setProfileModalData({
                mobile: p.mobile_number || '',
                name: p.name && p.name.toLowerCase() !== 'customer' ? p.name : '',
                email: p.email || '',
              });
              setShowProfileModal(true);
              return;
            }
          }
        } catch {
          // ignore
        }
        navigate('/');
      }
    };
    checkAuthStatus();
  }, [isAuthenticated, navigate]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Focus first OTP box when OTP is sent
  useEffect(() => {
    if (otpSent && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [otpSent]);

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    if (localError) setLocalError('');
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    const cleanNumber = mobileNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number');
      return;
    }

    const result = await sendOtp(cleanNumber);
    if (result.success) {
      setSuccessMessage(`OTP sent successfully to +91 ${cleanNumber}`);
      setTimer(60);
      setOtpBoxes(['', '', '', '', '', '']);
    } else {
      setLocalError(result.message || 'Failed to send OTP. Please try again.');
    }
  };

  // Handle 6-Box OTP Input changes
  const handleOtpBoxChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');

    // Handle paste of full 6-digit code
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      const newBoxes = [...otpBoxes];
      pasted.forEach((char, idx) => {
        if (idx < 6) newBoxes[idx] = char;
      });
      setOtpBoxes(newBoxes);

      // Focus last filled box or verify if 6 digits
      const lastIndex = Math.min(pasted.length - 1, 5);
      if (inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex].focus();
      }
      if (newBoxes.every((d) => d !== '')) {
        handleVerifyOtp(newBoxes.join(''));
      }
      return;
    }

    const newBoxes = [...otpBoxes];
    newBoxes[index] = cleanVal.slice(-1);
    setOtpBoxes(newBoxes);

    // Auto-advance to next box
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (cleanVal && index === 5) {
      const fullCode = newBoxes.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  // Handle Backspace navigation across boxes
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpBoxes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    setLocalError('');
    setSuccessMessage('');

    const otpCode = typeof codeToVerify === 'string' ? codeToVerify : otpBoxes.join('');

    if (otpCode.length !== 6) {
      setLocalError('Please enter all 6 digits of the OTP');
      return;
    }

    const result = await verifyOtp(mobileNumber, otpCode);

    if (result.success) {
      // API call to check user profile status
      let userProfile = result.userData || {};
      try {
        const profileRes = await userAPI.getProfile();
        if (profileRes?.success && profileRes?.data) {
          userProfile = profileRes.data;
        }
      } catch (profileErr) {
        console.warn('Could not fetch latest profile on login:', profileErr);
      }

      const isNameEmpty = !userProfile?.name || userProfile.name.trim() === '' || userProfile.name.trim().toLowerCase() === 'customer';
      const isEmailEmpty = !userProfile?.email || userProfile.email.trim() === '';

      if (isNameEmpty || isEmailEmpty) {
        // Show forced profile completion popup before redirecting
        setProfileModalData({
          mobile: mobileNumber,
          name: userProfile?.name && userProfile.name.toLowerCase() !== 'customer' ? userProfile.name : '',
          email: userProfile?.email || '',
        });
        setShowProfileModal(true);
      } else {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 600);
      }
    } else {
      setLocalError(result.message || 'Invalid OTP code. Please try again.');
    }
  };

  const handleProfileCompleteSuccess = () => {
    setShowProfileModal(false);
    window.dispatchEvent(new Event('profile_updated'));
    setSuccessMessage('Profile saved successfully! Redirecting...');
    setTimeout(() => {
      navigate('/');
    }, 400);
  };

  const handleEditMobile = () => {
    setOtpSent(false);
    setOtpBoxes(['', '', '', '', '', '']);
    setLocalError('');
    setSuccessMessage('');
  };

  const currentSlide = heroSlides[activeSlide % heroSlides.length];

  return (
    <Box
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDE: LOGIN / OTP FORM (FITS 100vh WITH NO SCROLLBAR)
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '0 0 50%' },
          width: { xs: '100%', md: '50%' },
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          px: { xs: 3, sm: 6, md: 8, lg: 12 },
          py: { xs: 2.5, sm: 3.5, md: 4 },
          backgroundColor: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* TOP BAR: Back Link & Centered AapnuBazaar Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Box
            onClick={() => {
              if (otpSent) {
                handleEditMobile();
              } else {
                navigate('/');
              }
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: '#555555',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'color 0.2s ease',
              '&:hover': { color: '#000000' },
            }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Back
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: { md: 'absolute' },
              left: { md: '50%' },
              transform: { md: 'translateX(-50%)' },
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img
                src="/aapnubazaar-logo.png"
                alt="AapnuBazaar"
                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
              />
              <Typography
                sx={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#087F5B' }}>Aapnu</span>
                <span style={{ color: '#ff5500' }}>Bazaar</span>
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: '#666666',
                textTransform: 'uppercase',
                mt: -0.2,
              }}
            >
              — Our Local Marketplace —
            </Typography>
          </Box>

          <Box sx={{ width: 40 }} />
        </Box>

        {/* CENTER FORM CONTAINER */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '380px',
            mx: 'auto',
            my: 'auto',
          }}
        >
          {/* TITLE & SUBTITLE */}
          <Typography
            component="h1"
            sx={{
              fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
              fontSize: { xs: '36px', md: '42px' },
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: '#111111',
              lineHeight: 1.1,
              mb: 1,
            }}
          >
            Login
          </Typography>

          <Typography
            sx={{
              fontSize: '13.5px',
              color: '#666666',
              mb: 3,
            }}
          >
            {!otpSent
              ? 'Enter your mobile number to receive a 6-digit OTP'
              : `Enter the 6-digit code sent to +91 ${mobileNumber}`}
          </Typography>

          {/* ALERTS */}
          {(error || localError) && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: '8px',
                fontSize: '13px',
                py: 0.5,
                backgroundColor: '#fff1f0',
                color: '#d32f2f',
                border: '1px solid #ffccc7',
              }}
            >
              {error || localError}
            </Alert>
          )}

          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: '8px',
                fontSize: '13px',
                py: 0.5,
                backgroundColor: '#f6ffed',
                color: '#389e0d',
                border: '1px solid #b7eb8f',
              }}
            >
              {successMessage}
            </Alert>
          )}

          {/* STEP 1: MOBILE NUMBER INPUT */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f3f3f5',
                  borderRadius: '8px',
                  border: '1.5px solid transparent',
                  height: '50px',
                  px: 1.5,
                  mb: 2.5,
                  transition: 'all 0.2s ease',
                  '&:focus-within': {
                    borderColor: '#087F5B',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 10px rgba(14, 91, 66, 0.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    pr: 1.5,
                    mr: 1.5,
                    borderRight: '1px solid #d8d8de',
                    color: '#333333',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <Phone size={16} style={{ marginRight: '6px', color: '#087F5B' }} />
                  +91
                </Box>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder="Enter 10-digit mobile number"
                  autoFocus
                  required
                  disabled={loading}
                  maxLength={10}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '15px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    color: '#1a1a1a',
                    letterSpacing: '0.04em',
                  }}
                />
              </Box>

              <Box
                component="button"
                type="submit"
                disabled={loading || mobileNumber.length !== 10}
                sx={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: mobileNumber.length === 10 ? '#111111' : '#888888',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  cursor: loading || mobileNumber.length !== 10 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: mobileNumber.length === 10 ? '#262626' : '#888888',
                    transform: mobileNumber.length === 10 ? 'translateY(-1px)' : 'none',
                    boxShadow: mobileNumber.length === 10 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Get OTP'}
              </Box>
            </form>
          ) : (
            /* STEP 2: 6-BOX OTP VERIFICATION */
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} style={{ width: '100%' }}>
              {/* 6 OTP BOXES */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 1.2 },
                  mb: 2.5,
                }}
              >
                {otpBoxes.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    style={{
                      width: '46px',
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      color: '#111111',
                      backgroundColor: digit ? '#ffffff' : '#f3f3f5',
                      border: digit ? '1.5px solid #087F5B' : '1.5px solid transparent',
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#087F5B';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 2px 8px rgba(14, 91, 66, 0.15)';
                    }}
                    onBlur={(e) => {
                      if (!otpBoxes[idx]) {
                        e.target.style.borderColor = 'transparent';
                        e.target.style.backgroundColor = '#f3f3f5';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  />
                ))}
              </Box>

              {/* ACTION LINKS: Resend & Edit Number */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Typography
                  onClick={handleEditMobile}
                  sx={{
                    fontSize: '12.5px',
                    color: '#555555',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    '&:hover': { color: '#111111' },
                  }}
                >
                  Change Number
                </Typography>

                <Typography
                  onClick={() => {
                    if (timer === 0) handleSendOtp();
                  }}
                  sx={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: timer > 0 ? '#999999' : '#087F5B',
                    cursor: timer > 0 ? 'default' : 'pointer',
                    textDecoration: timer > 0 ? 'none' : 'underline',
                    '&:hover': { opacity: timer > 0 ? 1 : 0.8 },
                  }}
                >
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                </Typography>
              </Box>

              {/* VERIFY BUTTON */}
              <Box
                component="button"
                type="submit"
                disabled={loading || otpBoxes.some((d) => d === '')}
                sx={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: otpBoxes.every((d) => d !== '') ? '#111111' : '#888888',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  cursor: loading || otpBoxes.some((d) => d === '') ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: otpBoxes.every((d) => d !== '') ? '#262626' : '#888888',
                    transform: otpBoxes.every((d) => d !== '') ? 'translateY(-1px)' : 'none',
                    boxShadow: otpBoxes.every((d) => d !== '') ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                  },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Verify & Login'}
              </Box>
            </form>
          )}

          {/* PRIVACY / FOOTER TEXT */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '11.5px', color: '#888888', lineHeight: 1.4 }}>
              By logging in, you agree to AapnuBazaar&apos;s Terms of Service & Privacy Policy.
            </Typography>
          </Box>
        </Box>

        {/* BOTTOM SPACER FOR EQUAL MARGINS */}
        <Box sx={{ height: 10 }} />
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SIDE: AAPNUBAZAAR HERO IMAGE (FITS 100vh WITH NO SCROLLBAR)
      ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 50%',
          width: '50%',
          height: '100vh',
          maxHeight: '100vh',
          position: 'sticky',
          top: 0,
          backgroundImage: `url(${currentSlide.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 5, lg: 6 },
          color: '#ffffff',
          overflow: 'hidden',
          boxSizing: 'border-box',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(14,91,66,0.2) 40%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          },
        }}
      >
        {/* TOP OVERLAY BAR */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1.5,
              borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {currentSlide.tag}
            </Typography>

            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveSlide((prev) => prev + 1)}
            >
              {currentSlide.page}
            </Typography>
          </Box>
        </Box>

        {/* CENTER / MID SECTION QUOTES */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            my: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Main Headline */}
          <Typography
            sx={{
              fontSize: { md: '28px', lg: '34px' },
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              maxWidth: '380px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {currentSlide.headline}
          </Typography>

          {/* Secondary Quote (Right Aligned in lower section) */}
          <Box sx={{ alignSelf: 'flex-end', maxWidth: '210px', mt: 2 }}>
            <Typography
              sx={{
                fontSize: '12.5px',
                lineHeight: 1.45,
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: '0.01em',
              }}
            >
              {currentSlide.caption}
            </Typography>
          </Box>
        </Box>

        {/* BOTTOM OVERLAY BAR */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1.5,
              borderTop: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '0.03em',
                color: 'rgba(255, 255, 255, 0.85)',
              }}
            >
              @2026 AapnuBazaar
            </Typography>

            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.85)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveSlide((prev) => prev + 1)}
            >
              {currentSlide.page}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Mandatory Uncloseable Profile Completion Popup */}
      <CompleteProfileModal
        open={showProfileModal}
        initialMobile={profileModalData.mobile}
        initialName={profileModalData.name}
        initialEmail={profileModalData.email}
        onSuccess={handleProfileCompleteSuccess}
      />
    </Box>
  );
};

export default LoginPage;
