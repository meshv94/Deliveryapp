import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  Stack,
  Divider,
  TextField,
  Tooltip,
  Paper,
  Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StarIcon from '@mui/icons-material/Star';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import confetti from 'canvas-confetti';

const BRAND = {
  primaryGreen: '#087F5B',
  darkGreen: '#075B43',
  lightGreen: '#EAF7F2',
  orange: '#FF6B00',
  orangeLight: '#FFF4E6',
  amber: '#D97706',
  amberLight: '#FEF3C7',
  blue: '#1971C2',
  blueLight: '#E7F5FF',
  red: '#E03131',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  white: '#FFFFFF',
  bgDark: '#0B132B',
};

// Preset Rider Quick Instruction Pills
const QUICK_INSTRUCTIONS = [
  { id: 'nobell', label: "🔕 Don't ring doorbell", active: false },
  { id: 'guard', label: '🛡️ Leave with security guard', active: false },
  { id: 'call', label: '📞 Call before reaching', active: false },
  { id: 'door', label: '🚪 Leave at doorstep', active: false },
];

// Preset Tipping Options
const TIP_OPTIONS = [20, 30, 50, 100];

export default function LiveRiderTrackingModal({ open, onClose, order }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'chat'
  const [instructions, setInstructions] = useState(QUICK_INSTRUCTIONS);
  const [selectedTip, setSelectedTip] = useState(null);
  const [customTip, setCustomTip] = useState('');
  const [tipConfirmed, setTipConfirmed] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [riderProgress, setRiderProgress] = useState(35);
  const [etaMins, setEtaMins] = useState(12);

  // Chat messages initialized and reset when order changes
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (order) {
      setMessages([
        {
          id: 1,
          sender: 'rider',
          text: `Hello! I'm on my way with your order #${order._id ? order._id.slice(-6).toUpperCase() : ''}. Should reach in ~12 mins.`,
          time: 'Just now',
        },
      ]);
    }
  }, [order?._id]);

  // Simulated rider motion along route
  useEffect(() => {
    if (!open || !order) return;

    const interval = setInterval(() => {
      setRiderProgress((prev) => {
        if (prev >= 92) return 92;
        const next = prev + 1.5;
        setEtaMins(Math.max(2, Math.round(15 * (1 - next / 100))));
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [open, order]);

  if (!order) return null;

  // Delivery partner details (with deterministic fallback based on order id)
  const riderName = 'Vikram Rathore';
  const riderPhone = '+91 98765 43210';
  const vehicleNo = 'GJ-01-EB-4491';
  const riderRating = '4.92';
  const vendorName = order.vendor?.name || 'Local Marketplace Store';
  const customerAddress = order.address?.address || order.address?.city || 'Delivery Address';
  const orderShortId = order._id ? order._id.slice(-6).toUpperCase() : 'ORDER';

  const toggleInstruction = (id) => {
    setInstructions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item))
    );
  };

  const handleSendChatMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'customer',
      text: newMessage.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');

    // Automated simulated response from delivery partner
    setTimeout(() => {
      const riderReplies = [
        'Got it! Will take care of this.',
        'Noted! Reaching soon.',
        'Thanks for the instruction, on my way!',
      ];
      const randomReply = riderReplies[Math.floor(Math.random() * riderReplies.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'rider',
          text: randomReply,
          time: 'Just now',
        },
      ]);
    }, 1400);
  };

  const handleApplyTip = (amt) => {
    setSelectedTip(amt);
    setTipConfirmed(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#087F5B', '#FF6B00', '#FFD43B'],
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '18px', sm: '24px' },
          overflow: 'hidden',
          backgroundColor: BRAND.white,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
          maxHeight: '92vh',
        },
      }}
    >
      {/* ── 1. MODAL HEADER ── */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${BRAND.border}`,
          bgcolor: '#FAFAF8',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: BRAND.lightGreen,
              color: BRAND.primaryGreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TwoWheelerIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '15px', sm: '17px' }, color: BRAND.textPrimary, lineHeight: 1.2 }}>
              Live Order Tracking #{orderShortId}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: BRAND.textSecondary }}>
              {vendorName} &bull; {order.total_quantity || order.items?.length || 1} items
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: BRAND.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* ── 2. LEFT: INTERACTIVE LIVE ROUTE MAP SIMULATION ── */}
        <Box
          sx={{
            flex: { xs: 'none', md: 1.2 },
            height: { xs: 280, sm: 340, md: 480 },
            position: 'relative',
            backgroundColor: '#E5E9F0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Simulated Map Visual Canvas */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
              backgroundImage: `
                radial-gradient(#94A3B8 1px, transparent 1px),
                radial-gradient(#94A3B8 1px, #E2E8F0 1px)
              `,
              backgroundSize: '32px 32px',
              backgroundPosition: '0 0, 16px 16px',
            }}
          >
            {/* Curving Highway Polyline Route */}
            <svg
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <defs>
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#087F5B" />
                  <stop offset="100%" stopColor="#FF6B00" />
                </linearGradient>
              </defs>

              {/* Road Path Base */}
              <path
                d="M 60 70 Q 180 120 220 240 T 400 380"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M 60 70 Q 180 120 220 240 T 400 380"
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="6"
                strokeDasharray="8 4"
                strokeLinecap="round"
              />
            </svg>

            {/* Store Pin (Start) */}
            <Box
              sx={{
                position: 'absolute',
                left: { xs: '15%', sm: '12%' },
                top: { xs: '18%', sm: '14%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.3,
                  borderRadius: '6px',
                  bgcolor: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                🏬 {vendorName.slice(0, 14)}
              </Box>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: BRAND.primaryGreen,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 6px rgba(8, 127, 91, 0.25)',
                }}
              >
                <StorefrontIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>

            {/* Animated Delivery Partner Rider Pin */}
            <Box
              sx={{
                position: 'absolute',
                left: `${15 + riderProgress * 0.65}%`,
                top: `${18 + riderProgress * 0.62}%`,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 4,
                transition: 'all 2.4s ease-in-out',
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.3,
                  borderRadius: '12px',
                  bgcolor: '#FF6B00',
                  color: '#FFFFFF',
                  fontSize: '10.5px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                  boxShadow: '0 4px 12px rgba(255, 107, 0, 0.4)',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.06)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              >
                🛵 Vikram ({etaMins}m away)
              </Box>

              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  bgcolor: '#FF6B00',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 8px rgba(255, 107, 0, 0.28)',
                }}
              >
                <TwoWheelerIcon sx={{ fontSize: 24 }} />
              </Box>
            </Box>

            {/* Customer Home Pin (Destination) */}
            <Box
              sx={{
                position: 'absolute',
                right: { xs: '15%', sm: '18%' },
                bottom: { xs: '15%', sm: '18%' },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 3,
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.3,
                  borderRadius: '6px',
                  bgcolor: '#0F172A',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                🏠 Your Location
              </Box>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: '#1971C2',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 6px rgba(25, 113, 194, 0.25)',
                }}
              >
                <LocationOnIcon sx={{ fontSize: 20 }} />
              </Box>
            </Box>
          </Box>

          {/* Floating ETA Overlay Card */}
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              right: { xs: 16, sm: 'auto' },
              p: 1.5,
              borderRadius: '14px',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${BRAND.border}`,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: BRAND.orangeLight,
                color: BRAND.orange,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '16px',
              }}
            >
              {etaMins}m
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '13px', color: BRAND.textPrimary }}>
                Arriving in {etaMins} mins
              </Typography>
              <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary }}>
                Distance: ~{(2.5 * (1 - riderProgress / 100)).toFixed(1)} km &bull; On time
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* ── 3. RIGHT: RIDER PROFILE, QUICK INSTRUCTIONS, CHAT & TIPPING ── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            bgcolor: BRAND.white,
            overflowY: 'auto',
            maxHeight: { md: 480 },
          }}
        >
          {/* Tab Switcher: Details vs Chat */}
          <Box sx={{ display: 'flex', bgcolor: '#F1F5F9', p: 0.4, borderRadius: '10px', mb: 2 }}>
            <Button
              size="small"
              fullWidth
              onClick={() => setActiveTab('map')}
              sx={{
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: activeTab === 'map' ? BRAND.white : 'transparent',
                color: activeTab === 'map' ? BRAND.textPrimary : BRAND.textSecondary,
                boxShadow: activeTab === 'map' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Rider & Instructions
            </Button>
            <Button
              size="small"
              fullWidth
              onClick={() => setActiveTab('chat')}
              startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: '15px !important' }} />}
              sx={{
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: activeTab === 'chat' ? BRAND.white : 'transparent',
                color: activeTab === 'chat' ? BRAND.textPrimary : BRAND.textSecondary,
                boxShadow: activeTab === 'chat' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              Direct Chat
            </Button>
          </Box>

          {activeTab === 'map' ? (
            <Stack spacing={2}>
              {/* Delivery Partner Profile Card */}
              <Box
                sx={{
                  p: 1.8,
                  borderRadius: '14px',
                  bgcolor: '#F8FAFC',
                  border: `1px solid ${BRAND.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: BRAND.primaryGreen,
                      fontSize: '16px',
                      fontWeight: 800,
                    }}
                  >
                    VR
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.textPrimary }}>
                        {riderName}
                      </Typography>
                      <VerifiedUserIcon sx={{ fontSize: 15, color: BRAND.primaryGreen }} />
                    </Box>
                    <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary }}>
                      {vehicleNo} &bull; ⭐ {riderRating}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PhoneIcon sx={{ fontSize: '15px !important' }} />}
                  onClick={() => window.open(`tel:${riderPhone}`, '_self')}
                  sx={{
                    bgcolor: BRAND.primaryGreen,
                    color: '#fff',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12px',
                    textTransform: 'none',
                    px: 1.5,
                    '&:hover': { bgcolor: BRAND.darkGreen },
                  }}
                >
                  Call
                </Button>
              </Box>

              {/* Quick Delivery Instructions */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '12.5px', color: BRAND.textPrimary, mb: 1 }}>
                  Delivery Instructions for Rider
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                  {instructions.map((inst) => (
                    <Chip
                      key={inst.id}
                      label={inst.label}
                      clickable
                      onClick={() => toggleInstruction(inst.id)}
                      sx={{
                        fontSize: '11.5px',
                        fontWeight: inst.active ? 800 : 600,
                        bgcolor: inst.active ? BRAND.lightGreen : '#F1F5F9',
                        color: inst.active ? BRAND.primaryGreen : BRAND.textPrimary,
                        border: `1px solid ${inst.active ? BRAND.primaryGreen : 'transparent'}`,
                        transition: 'all 0.15s ease',
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Divider sx={{ borderColor: BRAND.border }} />

              {/* Rider Tipping Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '12.5px', color: BRAND.textPrimary }}>
                    Tip Delivery Partner
                  </Typography>
                  {tipConfirmed && (
                    <Typography sx={{ fontSize: '11.5px', color: BRAND.primaryGreen, fontWeight: 700 }}>
                      🎉 ₹{selectedTip} Tip Added!
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: '11px', color: BRAND.textSecondary, mb: 1.2 }}>
                  100% of your tip goes directly to Vikram for safe and fast delivery.
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  {TIP_OPTIONS.map((amt) => (
                    <Button
                      key={amt}
                      size="small"
                      variant={selectedTip === amt ? 'contained' : 'outlined'}
                      onClick={() => handleApplyTip(amt)}
                      sx={{
                        flex: 1,
                        py: 0.6,
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '12.5px',
                        textTransform: 'none',
                        borderColor: selectedTip === amt ? BRAND.primaryGreen : BRAND.border,
                        bgcolor: selectedTip === amt ? BRAND.primaryGreen : 'transparent',
                        color: selectedTip === amt ? '#FFFFFF' : BRAND.textPrimary,
                        '&:hover': {
                          borderColor: BRAND.primaryGreen,
                          bgcolor: selectedTip === amt ? BRAND.darkGreen : BRAND.lightGreen,
                        },
                      }}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </Box>
              </Box>
            </Stack>
          ) : (
            /* ── CHAT WITH DELIVERY PARTNER ── */
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, mb: 2 }}>
                <Stack spacing={1.2}>
                  {messages.map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        alignSelf: m.sender === 'customer' ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        p: 1.2,
                        borderRadius: m.sender === 'customer' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        bgcolor: m.sender === 'customer' ? BRAND.primaryGreen : '#F1F5F9',
                        color: m.sender === 'customer' ? '#FFFFFF' : BRAND.textPrimary,
                      }}
                    >
                      <Typography sx={{ fontSize: '12.5px', lineHeight: 1.35 }}>
                        {m.text}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '9.5px',
                          color: m.sender === 'customer' ? 'rgba(255,255,255,0.7)' : BRAND.textSecondary,
                          textAlign: 'right',
                          mt: 0.3,
                        }}
                      >
                        {m.time}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {/* Chat Input */}
              <Box component="form" onSubmit={handleSendChatMessage} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Send a note or instruction..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '10px', fontSize: '12.5px' },
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={!newMessage.trim()}
                  sx={{
                    bgcolor: BRAND.primaryGreen,
                    color: '#fff',
                    borderRadius: '10px',
                    '&:hover': { bgcolor: BRAND.darkGreen },
                    '&:disabled': { opacity: 0.4 },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
