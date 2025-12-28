import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Skeleton,
  Alert,
  Button,
  Fade,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import apiClient from '../services/api';
import CanvasBackground from '../components/CanvasBackground';

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
    // Navigate to vendors page with module ID as query parameter
    navigate(`/vendors?moduleId=${module._id}`);
  };

  const skeletonCount = 6;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa', position: 'relative' }}>
      {/* Canvas Background */}
      <CanvasBackground useGradient={false} />

      {/* Main Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            py: { xs: 6, sm: 8, md: 10 },
            mb: 5,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            },
          }}
        >
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 900,
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '2.75rem', md: '3.5rem' },
                  lineHeight: 1.2,
                  textShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome to Delivery App
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 500,
                  opacity: 0.95,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  maxWidth: 600,
                  mx: 'auto',
                }}
              >
                Select a module to explore local vendors and start ordering
              </Typography>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ pb: 8 }}>
          {/* Error State */}
          {error && !loading && (
            <Fade in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  p: 4,
                  background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
                  border: '2px solid #ffcdd2',
                  textAlign: 'center',
                }}
              >
                <Box sx={{ fontSize: '3rem', mb: 2 }}>⚠️</Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#d32f2f',
                    mb: 1,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  }}
                >
                  Oops! Something went wrong
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    mb: 3,
                    maxWidth: 500,
                    mx: 'auto',
                    lineHeight: 1.7,
                  }}
                >
                  {error}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={fetchActiveModules}
                  sx={{
                    backgroundColor: '#d32f2f',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                    '&:hover': {
                      backgroundColor: '#b71c1c',
                      boxShadow: '0 6px 16px rgba(211, 47, 47, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Try Again
                </Button>
              </Paper>
            </Fade>
          )}

          {/* Loading State */}
          {loading ? (
            <>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  color: '#1a1a1a',
                  textAlign: 'center',
                }}
              >
                <Skeleton width="300px" sx={{ mx: 'auto' }} />
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                {Array.from({ length: skeletonCount }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card elevation={0} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 4 }}>
                        <Skeleton variant="circular" width={60} height={60} sx={{ mb: 2 }} />
                        <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                        <Skeleton variant="text" height={20} width="80%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : modules.length > 0 ? (
            <>
              {/* Section Header */}
              <Fade in timeout={800}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: '#1a1a1a',
                      fontSize: { xs: '1.75rem', sm: '2rem' },
                      mb: 1,
                    }}
                  >
                    Choose Your Module
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#666',
                      fontSize: '1rem',
                    }}
                  >
                    {modules.length} module{modules.length !== 1 ? 's' : ''} available
                  </Typography>
                </Box>
              </Fade>

              {/* Modules Grid */}
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                {modules.map((module, index) => (
                  <Grid item xs={12} sm={6} md={4} key={module._id || index}>
                    <Fade in timeout={600} style={{ transitionDelay: `${index * 100}ms` }}>
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          border: '2px solid #f0f0f0',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 12px 24px rgba(102, 126, 234, 0.2)',
                            borderColor: '#667eea',
                          },
                        }}
                      >
                        <CardActionArea
                          onClick={() => handleModuleClick(module)}
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            p: 4,
                          }}
                        >
                          <Box
                            sx={{
                              width: 70,
                              height: 70,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 3,
                              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                            }}
                          >
                            <StorefrontIcon sx={{ fontSize: 36, color: '#fff' }} />
                          </Box>

                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: '#1a1a1a',
                              mb: 2,
                              fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            }}
                          >
                            {module.name}
                          </Typography>

                          <Box
                            sx={{
                              mt: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#667eea',
                              fontWeight: 600,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, mr: 1 }}
                            >
                              Explore Vendors
                            </Typography>
                            <ArrowForwardIcon sx={{ fontSize: 18 }} />
                          </Box>
                        </CardActionArea>
                      </Card>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            /* Empty State */
            <Fade in timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  textAlign: 'center',
                  py: 12,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  border: '2px dashed #e0e0e0',
                }}
              >
                <Box
                  sx={{
                    fontSize: '5rem',
                    mb: 3,
                    filter: 'grayscale(1)',
                    opacity: 0.5,
                  }}
                >
                  📦
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#1a1a1a',
                    mb: 1.5,
                    fontSize: { xs: '1.35rem', sm: '1.6rem' },
                  }}
                >
                  No Modules Available
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#666',
                    mb: 4,
                    maxWidth: 450,
                    mx: 'auto',
                    lineHeight: 1.8,
                  }}
                >
                  There are currently no active modules available. Please check back later.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={fetchActiveModules}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Refresh
                </Button>
              </Paper>
            </Fade>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default ModulesPage;
