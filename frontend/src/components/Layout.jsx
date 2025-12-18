import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header/AppBar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <LocalShippingIcon
            sx={{
              mr: 1.5,
              fontSize: '1.8rem',
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              cursor: 'pointer',
              flexGrow: 1,
            }}
            onClick={() => navigate('/')}
          >
            DeliveryApp
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          background: '#f9f9f9',
          borderTop: '1px solid #e0e0e0',
          py: 4,
          mt: 6,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            © 2025 DeliveryApp. All rights reserved. Fast, reliable delivery from local vendors.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
