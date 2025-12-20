import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  LocalOffer as OffersIcon,
  DeliveryDining as DeliveryIcon,
} from '@mui/icons-material';

const ModuleCard = ({ title, description, icon, enabled }) => (
  <Card sx={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#667eea',
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <FormControlLabel
        control={<Switch defaultChecked={enabled} />}
        label={enabled ? 'Enabled' : 'Disabled'}
        sx={{ ml: 0 }}
      />
    </CardContent>
  </Card>
);

const Modules = () => {
  const modules = [
    {
      title: 'Notifications',
      description: 'Push notifications and SMS alerts',
      icon: <NotificationsIcon fontSize="large" />,
      enabled: true,
    },
    {
      title: 'Payment Gateway',
      description: 'Online payment processing',
      icon: <PaymentIcon fontSize="large" />,
      enabled: true,
    },
    {
      title: 'Security',
      description: 'Advanced security features',
      icon: <SecurityIcon fontSize="large" />,
      enabled: true,
    },
    {
      title: 'Analytics',
      description: 'Business analytics and reports',
      icon: <AnalyticsIcon fontSize="large" />,
      enabled: false,
    },
    {
      title: 'Offers & Coupons',
      description: 'Promotional offers management',
      icon: <OffersIcon fontSize="large" />,
      enabled: true,
    },
    {
      title: 'Delivery Tracking',
      description: 'Real-time delivery tracking',
      icon: <DeliveryIcon fontSize="large" />,
      enabled: true,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 800 }}>
        Modules Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Enable or disable application modules
      </Typography>

      <Grid container spacing={3}>
        {modules.map((module, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <ModuleCard {...module} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Modules;
