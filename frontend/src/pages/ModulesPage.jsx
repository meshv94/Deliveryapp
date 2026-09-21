import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardActionArea,
  Skeleton,
  Button,
  Fade,
  Paper,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import apiClient from '../services/api';

const ModulesPage = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveModules();
  }, []);

  const fetchActiveModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/app/modules/active/list');

      if (response.success && response.data) {
        setModules(response.data);
      } else {
        setModules([]);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.message || 'Failed to load modules. Please try again.');
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    navigate(`/vendors?moduleId=${module._id}`);
  };

  const skeletonCount = 3;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafbfc', pb: 10 }}>
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN AAPNUBAZAAR COVER BANNER (NO OVERLAPPING TEXT)
      ───────────────────────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '180px', sm: '280px', md: '380px', lg: '440px' },
            borderRadius: { xs: '16px', sm: '24px' },
            overflow: 'hidden',
            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.06)',
            border: '1px solid #eaecef',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          <img
            src="/cover_img.png"
            alt="AapnuBazaar - Our Local Marketplace"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        </Box>

        {/* Value Proposition Strip below Banner */}
        <Box
          sx={{
            mt: 3,
            mb: { xs: 4, sm: 6 },
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          <Chip
            icon={<LocalShippingOutlinedIcon style={{ color: '#087F5B', fontSize: '18px' }} />}
            label="Express 15-30 Min Delivery"
            sx={{
              backgroundColor: '#ffffff',
              color: '#222222',
              border: '1px solid #e8e8ec',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              fontWeight: 600,
              fontSize: '12.5px',
              py: 2,
              px: 1,
            }}
          />
          <Chip
            icon={<SpaOutlinedIcon style={{ color: '#087F5B', fontSize: '18px' }} />}
            label="100% Fresh Local Products"
            sx={{
              backgroundColor: '#ffffff',
              color: '#222222',
              border: '1px solid #e8e8ec',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              fontWeight: 600,
              fontSize: '12.5px',
              py: 2,
              px: 1,
            }}
          />
          <Chip
            icon={<VerifiedOutlinedIcon style={{ color: '#ff5500', fontSize: '18px' }} />}
            label="Verified Neighborhood Stores"
            sx={{
              backgroundColor: '#ffffff',
              color: '#222222',
              border: '1px solid #e8e8ec',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              fontWeight: 600,
              fontSize: '12.5px',
              py: 2,
              px: 1,
            }}
          />
          <Chip
            icon={<LocationOnOutlinedIcon style={{ color: '#087F5B', fontSize: '18px' }} />}
            label="Live Order Tracking"
            sx={{
              backgroundColor: '#ffffff',
              color: '#222222',
              border: '1px solid #e8e8ec',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              fontWeight: 600,
              fontSize: '12.5px',
              py: 2,
              px: 1,
            }}
          />
        </Box>
      </Container>

      {/* ─────────────────────────────────────────────────────────────
          2. MODULE SELECTION SECTION
      ───────────────────────────────────────────────────────────── */}
      <Container maxWidth="lg">
        {/* Error State */}
        {error && !loading && (
          <Fade in timeout={600}>
            <Paper
              elevation={0}
              sx={{
                mb: 4,
                borderRadius: '16px',
                p: 4,
                background: '#fff1f0',
                border: '1px solid #ffccc7',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#d32f2f',
                  mb: 1,
                }}
              >
                Unable to load marketplace modules
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  mb: 2.5,
                  maxWidth: 500,
                  mx: 'auto',
                }}
              >
                {error}
              </Typography>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchActiveModules}
                sx={{
                  backgroundColor: '#111111',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  '&:hover': {
                    backgroundColor: '#262626',
                  },
                }}
              >
                Try Again
              </Button>
            </Paper>
          </Fade>
        )}

        {/* Section Title Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5 } }}>
          <Typography
            sx={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#087F5B',
              mb: 1,
            }}
          >
            Marketplace Categories
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '26px', sm: '36px' },
              color: '#151515',
              letterSpacing: '-0.02em',
              mb: 1.2,
            }}
          >
            Explore Categories
          </Typography>

          <Typography
            sx={{
              fontSize: '15px',
              color: '#6B7280',
              maxWidth: '540px',
              mx: 'auto',
            }}
          >
            Select a category to discover local shops, fresh food, and daily essentials around you.
          </Typography>
        </Box>

        {/* Skeletons Loading */}
        {loading ? (
          <Grid container spacing={{ xs: 2.5, sm: 3, md: 4 }} justifyContent="center">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: '20px',
                    p: 4,
                    border: '1px solid #eaeaea',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <Skeleton
                    variant="circular"
                    width={100}
                    height={100}
                    sx={{ mx: 'auto', mb: 2 }}
                  />
                  <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto', mb: 1 }} />
                  <Skeleton variant="text" width="40%" height={20} sx={{ mx: 'auto', mb: 3 }} />
                  <Skeleton variant="rounded" width="80%" height={42} sx={{ mx: 'auto' }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : modules.length > 0 ? (
          /* MODULES GRID */
          <Grid container spacing={{ xs: 2.5, sm: 3, md: 4 }} justifyContent="center">
            {modules.map((module, index) => (
              <Grid item xs={12} sm={6} md={4} key={module._id || index}>
                <Fade in timeout={500} style={{ transitionDelay: `${index * 80}ms` }}>
                  <Card
                    elevation={0}
                    onClick={() => handleModuleClick(module)}
                    sx={{
                      borderRadius: '20px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #eef0f2',
                      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 28px -4px rgba(8, 127, 91, 0.15)',
                        borderColor: '#087F5B',
                        '& .module-cta-btn': {
                          backgroundColor: '#087F5B',
                          color: '#ffffff',
                        },
                        '& .module-img-container': {
                          transform: 'scale(1.04)',
                        },
                        '& .arrow-icon': {
                          transform: 'translateX(4px)',
                        },
                      },
                    }}
                  >
                    <CardActionArea sx={{ p: { xs: 3, sm: 4 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Active Status Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 18,
                          right: 18,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.7,
                          backgroundColor: '#f0f9f5',
                          border: '1px solid #d1ecde',
                          borderRadius: '20px',
                          px: 1.3,
                          py: 0.4,
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#087F5B',
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#087F5B',
                          }}
                        >
                          Active
                        </Typography>
                      </Box>

                      {/* Module Image / Icon Container */}
                      <Box
                        className="module-img-container"
                        sx={{
                          width: { xs: 96, sm: 110 },
                          height: { xs: 96, sm: 110 },
                          borderRadius: '50%',
                          backgroundColor: '#f8faf9',
                          border: '2px solid #eef5f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2.5,
                          mt: 1,
                          p: 1.5,
                          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {module.image ? (
                          <img
                            src={module.image}
                            alt={module.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              borderRadius: '50%',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <StorefrontIcon
                          sx={{
                            fontSize: '48px',
                            color: '#087F5B',
                            display: module.image ? 'none' : 'block',
                          }}
                        />
                      </Box>

                      {/* Module Title */}
                      <Typography
                        variant="h5"
                        component="h3"
                        sx={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 800,
                          fontSize: { xs: '19px', sm: '21px' },
                          color: '#111111',
                          mb: 0.8,
                          letterSpacing: '-0.01em',
                          textAlign: 'center',
                        }}
                      >
                        {module.name}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: '13px',
                          color: '#777777',
                          textAlign: 'center',
                          mb: 3,
                        }}
                      >
                        Explore verified {module.name.toLowerCase()} stores & products
                      </Typography>

                      {/* CTA Button */}
                      <Box
                        className="module-cta-btn"
                        sx={{
                          width: '100%',
                          py: 1.3,
                          px: 2.5,
                          borderRadius: '10px',
                          backgroundColor: '#111111',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          fontSize: '13.5px',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          transition: 'all 0.25s ease',
                          mt: 'auto',
                        }}
                      >
                        <span>Explore Stores</span>
                        <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: '16px', transition: 'transform 0.25s ease' }} />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        ) : (
          /* Empty State */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <StorefrontIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#444', fontWeight: 600 }}>
              No categories available at the moment
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
              Please check back soon as our marketplace continues to expand.
            </Typography>
          </Box>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. AAPNUBAZAAR PROMISES / EDITORIAL FEATURE STRIP
        ───────────────────────────────────────────────────────────── */}
        <Box sx={{ mt: { xs: 8, md: 10 } }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef0f2',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    backgroundColor: '#f0f9f5',
                    color: '#087F5B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StorefrontIcon sx={{ fontSize: '24px' }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '17px', color: '#111111' }}>
                  Neighborhood First
                </Typography>
                <Typography sx={{ fontSize: '13.5px', color: '#666666', lineHeight: 1.6 }}>
                  Directly order from your trusted local grocers, bakery artisans, and top neighborhood kitchens.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef0f2',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    backgroundColor: '#fff4ec',
                    color: '#ff5500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalShippingOutlinedIcon sx={{ fontSize: '24px' }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '17px', color: '#111111' }}>
                  Lightning Fast Delivery
                </Typography>
                <Typography sx={{ fontSize: '13.5px', color: '#666666', lineHeight: 1.6 }}>
                  Our optimized local dispatch ensures orders reach your doorstep fresh and hot within minutes.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef0f2',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '10px',
                    backgroundColor: '#f3f3f5',
                    color: '#111111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VerifiedOutlinedIcon sx={{ fontSize: '24px' }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '17px', color: '#111111' }}>
                  Verified Quality & Hygiene
                </Typography>
                <Typography sx={{ fontSize: '13.5px', color: '#666666', lineHeight: 1.6 }}>
                  Every merchant and vendor on AapnuBazaar goes through a strict hygiene & quality assurance check.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ModulesPage;
