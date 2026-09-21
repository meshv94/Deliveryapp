import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  InputBase,
  Paper,
  Badge,
  Tooltip,
  Collapse,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  GridViewRounded as DashboardIcon,
  StorefrontOutlined as VendorsIcon,
  ShoppingBagOutlined as OrdersIcon,
  AppsOutlined as ModulesIcon,
  Inventory2Outlined as ProductsIcon,
  PeopleOutlineRounded as UsersIcon,
  AdminPanelSettingsOutlined as AdminsIcon,
  SettingsOutlined as SettingsIcon,
  HeadsetMicOutlined as HelpIcon,
  NotificationsNoneOutlined as BellIcon,
  SearchRounded as SearchIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  LocalShippingOutlined as DeliveryIcon,
  AccountBalanceWalletOutlined as RevenueIcon,
  TrendingUpRounded as AnalyticsIcon,
  StoreOutlined as StoreIcon,
  MenuRounded as MenuIcon,
  LogoutRounded as LogoutIcon,
  PersonOutlineRounded as PersonIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { brandColors } from '../theme/tokens';

const fullSidebarWidth = 260;
const collapsedSidebarWidth = 84;

// AapnuBazaar Brand Logo
const AapnuBazaarLogo = ({ collapsed }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${brandColors.primaryGreen} 0%, ${brandColors.darkGreen} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(8, 127, 91, 0.3)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <VendorsIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
      <Box
        sx={{
          position: 'absolute',
          top: 3,
          right: 3,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: brandColors.orange,
          border: '1.5px solid #FFFFFF',
        }}
      />
    </Box>
    {!collapsed && (
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.2rem',
            color: brandColors.primaryText,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}
        >
          AapnuBazaar
        </Typography>
        <Typography
          sx={{
            fontSize: '11px',
            color: brandColors.primaryGreen,
            fontWeight: 700,
            letterSpacing: '0.04em',
            mt: 0.2,
            whiteSpace: 'nowrap',
          }}
        >
          Admin Portal
        </Typography>
      </Box>
    )}
  </Box>
);

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [marketplaceOpen, setMarketplaceOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  // Automatically keep Marketplace group open if visiting a marketplace sub-page
  useEffect(() => {
    if (
      location.pathname.startsWith('/vendors') ||
      location.pathname.startsWith('/products') ||
      location.pathname.startsWith('/modules')
    ) {
      setMarketplaceOpen(true);
    }
  }, [location.pathname]);

  // Adjust collapse on tablet
  useEffect(() => {
    if (isTablet) {
      setCollapsed(true);
    } else if (!isMobile) {
      setCollapsed(false);
    }
  }, [isTablet, isMobile]);

  // Get admin profile
  const adminData = (() => {
    try {
      return JSON.parse(localStorage.getItem('adminData') || '{}');
    } catch {
      return {};
    }
  })();
  const isSuperAdmin = adminData.role === 'super_admin';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileOpen = (event) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  // Quick jump search handler
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (q.includes('order')) handleNavigation('/orders');
      else if (q.includes('deliver')) handleNavigation('/orders?tab=delivery');
      else if (q.includes('store')) handleNavigation('/vendors?view=stores');
      else if (q.includes('vendor')) handleNavigation('/vendors');
      else if (q.includes('product') || q.includes('item')) handleNavigation('/products');
      else if (q.includes('cat') || q.includes('module')) handleNavigation('/modules');
      else if (q.includes('user') || q.includes('customer')) handleNavigation('/users');
      else if (q.includes('admin') || q.includes('staff')) handleNavigation('/admins');
      else if (q.includes('setting') || q.includes('profile')) handleNavigation('/settings');
      else if (q.includes('pay') || q.includes('rev')) handleNavigation('/?view=revenue');
      else if (q.includes('rep') || q.includes('analy')) handleNavigation('/?view=analytics');
      else handleNavigation(isSuperAdmin ? '/' : '/orders');
      setSearchQuery('');
    }
  };

  // Compute Page Title for Top Header
  const getPageTitle = () => {
    const path = location.pathname;
    const search = location.search;

    if (path === '/') {
      if (search.includes('revenue')) return 'Payments & Revenue';
      if (search.includes('analytics')) return 'Reports & Analytics';
      return 'Dashboard';
    }
    if (path.startsWith('/vendors')) {
      if (search.includes('stores')) return 'Stores Directory';
      return 'Vendors Management';
    }
    if (path.startsWith('/products')) return 'Products Catalog';
    if (path.startsWith('/orders')) {
      if (search.includes('delivery')) return 'Delivery & Fulfillment';
      return 'Orders & Fulfillment';
    }
    if (path.startsWith('/modules')) return 'Categories & Modules';
    if (path.startsWith('/users')) return 'Customer Accounts';
    if (path.startsWith('/admins')) return 'Staff Administration';
    if (path.startsWith('/settings')) return 'Platform Settings';
    return 'Admin Portal';
  };

  // Route active checks
  const isDashboardActive = location.pathname === '/' && !location.search;
  const isRevenueActive = location.search.includes('revenue');
  const isAnalyticsActive = location.search.includes('analytics');
  const isVendorsActive = location.pathname === '/vendors' && !location.search.includes('stores');
  const isStoresActive = location.pathname === '/vendors' && location.search.includes('stores');
  const isProductsActive = location.pathname === '/products';
  const isCategoriesActive = location.pathname === '/modules';
  const isOrdersActive = location.pathname === '/orders' && !location.search.includes('delivery');
  const isDeliveryActive = location.pathname === '/orders' && location.search.includes('delivery');
  const isUsersActive = location.pathname === '/users';
  const isAdminsActive = location.pathname === '/admins';
  const isSettingsActive = location.pathname === '/settings';

  // Navigation Items Definitions
  const marketplaceSubItems = [
    { text: 'Vendors', path: '/vendors', active: isVendorsActive, icon: <VendorsIcon sx={{ fontSize: 18 }} /> },
    { text: 'Products', path: '/products', active: isProductsActive, icon: <ProductsIcon sx={{ fontSize: 18 }} /> },
    ...(isSuperAdmin
      ? [{ text: 'Categories', path: '/modules', active: isCategoriesActive, icon: <ModulesIcon sx={{ fontSize: 18 }} /> }]
      : []),
    { text: 'Stores', path: '/vendors?view=stores', active: isStoresActive, icon: <StoreIcon sx={{ fontSize: 18 }} /> },
  ];

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: collapsed ? 1.5 : 2.5,
        backgroundColor: '#FFFFFF',
        borderRadius: { xs: 0, md: '20px' },
        border: `1px solid ${brandColors.border}`,
        boxShadow: '0 4px 20px rgba(20, 33, 61, 0.04)',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Sidebar Header / Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          cursor: 'pointer',
          px: collapsed ? 0 : 1,
          py: 0.5,
          mb: 3,
        }}
      >
        <Box onClick={() => handleNavigation(isSuperAdmin ? '/' : '/orders')}>
          <AapnuBazaarLogo collapsed={collapsed} />
        </Box>

        {/* Desktop Collapse Toggle */}
        {!isMobile && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              display: { xs: 'none', md: 'flex' },
              color: brandColors.secondaryText,
              borderRadius: '8px',
              p: 0.5,
              '&:hover': { backgroundColor: '#F8FAFC', color: brandColors.primaryText },
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* ======================================================== */}
      {/* MAIN NAVIGATION GROUP */}
      {/* ======================================================== */}
      {!collapsed && (
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#94A3B8',
            textTransform: 'uppercase',
            px: 1.5,
            mb: 1,
          }}
        >
          MAIN
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2.5 }}>
        {/* Dashboard (Super Admin Only) */}
        {isSuperAdmin && (
          <Tooltip title={collapsed ? 'Dashboard' : ''} placement="right">
            <Box
              onClick={() => handleNavigation('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1.5,
                px: collapsed ? 1 : 1.8,
                py: 1.1,
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: location.pathname === '/' ? brandColors.lightGreen : 'transparent',
                color: location.pathname === '/' ? brandColors.primaryGreen : brandColors.secondaryText,
                fontWeight: location.pathname === '/' ? 700 : 600,
                fontSize: '13.5px',
                position: 'relative',
                transition: 'all 0.18s ease',
                '&:hover': {
                  backgroundColor: location.pathname === '/' ? brandColors.lightGreen : '#F8FAFC',
                  color: location.pathname === '/' ? brandColors.primaryGreen : brandColors.primaryText,
                },
              }}
            >
              {location.pathname === '/' && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: brandColors.primaryGreen,
                  }}
                />
              )}
              <DashboardIcon sx={{ fontSize: 20 }} />
              {!collapsed && <span>Dashboard</span>}
            </Box>
          </Tooltip>
        )}

        {/* Marketplace (Expandable Group) */}
        <Tooltip title={collapsed ? 'Marketplace' : ''} placement="right">
          <Box
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setMarketplaceOpen(true);
              } else {
                setMarketplaceOpen(!marketplaceOpen);
              }
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              px: collapsed ? 1 : 1.8,
              py: 1.1,
              borderRadius: '12px',
              cursor: 'pointer',
              color:
                location.pathname.startsWith('/vendors') ||
                location.pathname.startsWith('/products') ||
                location.pathname.startsWith('/modules')
                  ? brandColors.primaryGreen
                  : brandColors.secondaryText,
              fontWeight: 600,
              fontSize: '13.5px',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: '#F8FAFC',
                color: brandColors.primaryText,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VendorsIcon sx={{ fontSize: 20 }} />
              {!collapsed && <span>Marketplace</span>}
            </Box>
            {!collapsed && (
              marketplaceOpen ? <ArrowUpIcon sx={{ fontSize: 18 }} /> : <ArrowDownIcon sx={{ fontSize: 18 }} />
            )}
          </Box>
        </Tooltip>

        {/* Marketplace Sub-Items Collapse */}
        {!collapsed && (
          <Collapse in={marketplaceOpen} timeout="auto" unmountOnExit>
            <Box sx={{ pl: 3.5, pr: 0.5, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
              {marketplaceSubItems.map((sub) => {
                const isActive = location.pathname === sub.path && sub.text !== 'Stores';
                return (
                  <Box
                    key={sub.text}
                    onClick={() => handleNavigation(sub.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      px: 1.4,
                      py: 0.85,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: isActive ? brandColors.lightGreen : 'transparent',
                      color: isActive ? brandColors.primaryGreen : brandColors.secondaryText,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '13px',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isActive ? brandColors.lightGreen : '#F8FAFC',
                        color: isActive ? brandColors.primaryGreen : brandColors.primaryText,
                      },
                    }}
                  >
                    {isActive && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: '25%',
                          bottom: '25%',
                          width: '3px',
                          borderRadius: '0 4px 4px 0',
                          backgroundColor: brandColors.primaryGreen,
                        }}
                      />
                    )}
                    {sub.icon}
                    <span>{sub.text}</span>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        )}

        {/* Orders */}
        <Tooltip title={collapsed ? 'Orders' : ''} placement="right">
          <Box
            onClick={() => handleNavigation('/orders')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.5,
              px: collapsed ? 1 : 1.8,
              py: 1.1,
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: location.pathname === '/orders' ? brandColors.lightGreen : 'transparent',
              color: location.pathname === '/orders' ? brandColors.primaryGreen : brandColors.secondaryText,
              fontWeight: location.pathname === '/orders' ? 700 : 600,
              fontSize: '13.5px',
              position: 'relative',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: location.pathname === '/orders' ? brandColors.lightGreen : '#F8FAFC',
                color: location.pathname === '/orders' ? brandColors.primaryGreen : brandColors.primaryText,
              },
            }}
          >
            {location.pathname === '/orders' && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '3.5px',
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: brandColors.primaryGreen,
                }}
              />
            )}
            <OrdersIcon sx={{ fontSize: 20 }} />
            {!collapsed && <span>Orders</span>}
          </Box>
        </Tooltip>

        {/* Customers (Super Admin Only) */}
        {isSuperAdmin && (
          <Tooltip title={collapsed ? 'Customers' : ''} placement="right">
            <Box
              onClick={() => handleNavigation('/users')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1.5,
                px: collapsed ? 1 : 1.8,
                py: 1.1,
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: location.pathname === '/users' ? brandColors.lightGreen : 'transparent',
                color: location.pathname === '/users' ? brandColors.primaryGreen : brandColors.secondaryText,
                fontWeight: location.pathname === '/users' ? 700 : 600,
                fontSize: '13.5px',
                position: 'relative',
                transition: 'all 0.18s ease',
                '&:hover': {
                  backgroundColor: location.pathname === '/users' ? brandColors.lightGreen : '#F8FAFC',
                  color: location.pathname === '/users' ? brandColors.primaryGreen : brandColors.primaryText,
                },
              }}
            >
              {location.pathname === '/users' && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: brandColors.primaryGreen,
                  }}
                />
              )}
              <UsersIcon sx={{ fontSize: 20 }} />
              {!collapsed && <span>Customers</span>}
            </Box>
          </Tooltip>
        )}

        {/* Delivery (Navigates to Orders Fulfillment pipeline) */}
        <Tooltip title={collapsed ? 'Delivery' : ''} placement="right">
          <Box
            onClick={() => handleNavigation('/orders')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.5,
              px: collapsed ? 1 : 1.8,
              py: 1.1,
              borderRadius: '12px',
              cursor: 'pointer',
              color: brandColors.secondaryText,
              fontWeight: 600,
              fontSize: '13.5px',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: '#F8FAFC',
                color: brandColors.primaryText,
              },
            }}
          >
            <DeliveryIcon sx={{ fontSize: 20 }} />
            {!collapsed && <span>Delivery</span>}
          </Box>
        </Tooltip>

        {/* Payments / Revenue (Directs to Dashboard Revenue section or Orders) */}
        <Tooltip title={collapsed ? 'Payments / Revenue' : ''} placement="right">
          <Box
            onClick={() => handleNavigation(isSuperAdmin ? '/' : '/orders')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.5,
              px: collapsed ? 1 : 1.8,
              py: 1.1,
              borderRadius: '12px',
              cursor: 'pointer',
              color: brandColors.secondaryText,
              fontWeight: 600,
              fontSize: '13.5px',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: '#F8FAFC',
                color: brandColors.primaryText,
              },
            }}
          >
            <RevenueIcon sx={{ fontSize: 20 }} />
            {!collapsed && <span>Payments / Revenue</span>}
          </Box>
        </Tooltip>

        {/* Reports / Analytics (Super Admin) */}
        {isSuperAdmin && (
          <Tooltip title={collapsed ? 'Reports / Analytics' : ''} placement="right">
            <Box
              onClick={() => handleNavigation('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1.5,
                px: collapsed ? 1 : 1.8,
                py: 1.1,
                borderRadius: '12px',
                cursor: 'pointer',
                color: brandColors.secondaryText,
                fontWeight: 600,
                fontSize: '13.5px',
                transition: 'all 0.18s ease',
                '&:hover': {
                  backgroundColor: '#F8FAFC',
                  color: brandColors.primaryText,
                },
              }}
            >
              <AnalyticsIcon sx={{ fontSize: 20 }} />
              {!collapsed && <span>Reports / Analytics</span>}
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* ======================================================== */}
      {/* ADMIN GROUP */}
      {/* ======================================================== */}
      {!collapsed && (
        <Typography
          sx={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#94A3B8',
            textTransform: 'uppercase',
            px: 1.5,
            mb: 1,
            mt: 1,
          }}
        >
          ADMIN
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 'auto' }}>
        {/* Admins Management (Super Admin Only) */}
        {isSuperAdmin && (
          <Tooltip title={collapsed ? 'Staff Admins' : ''} placement="right">
            <Box
              onClick={() => handleNavigation('/admins')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 1.5,
                px: collapsed ? 1 : 1.8,
                py: 1.1,
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: location.pathname === '/admins' ? brandColors.lightGreen : 'transparent',
                color: location.pathname === '/admins' ? brandColors.primaryGreen : brandColors.secondaryText,
                fontWeight: location.pathname === '/admins' ? 700 : 600,
                fontSize: '13.5px',
                position: 'relative',
                transition: 'all 0.18s ease',
                '&:hover': {
                  backgroundColor: location.pathname === '/admins' ? brandColors.lightGreen : '#F8FAFC',
                  color: location.pathname === '/admins' ? brandColors.primaryGreen : brandColors.primaryText,
                },
              }}
            >
              {location.pathname === '/admins' && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3.5px',
                    borderRadius: '0 4px 4px 0',
                    backgroundColor: brandColors.primaryGreen,
                  }}
                />
              )}
              <AdminsIcon sx={{ fontSize: 20 }} />
              {!collapsed && <span>Admins</span>}
            </Box>
          </Tooltip>
        )}

        {/* Settings */}
        <Tooltip title={collapsed ? 'Settings' : ''} placement="right">
          <Box
            onClick={() => handleNavigation('/settings')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.5,
              px: collapsed ? 1 : 1.8,
              py: 1.1,
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: location.pathname === '/settings' ? brandColors.lightGreen : 'transparent',
              color: location.pathname === '/settings' ? brandColors.primaryGreen : brandColors.secondaryText,
              fontWeight: location.pathname === '/settings' ? 700 : 600,
              fontSize: '13.5px',
              position: 'relative',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: location.pathname === '/settings' ? brandColors.lightGreen : '#F8FAFC',
                color: location.pathname === '/settings' ? brandColors.primaryGreen : brandColors.primaryText,
              },
            }}
          >
            {location.pathname === '/settings' && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: '20%',
                  bottom: '20%',
                  width: '3.5px',
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: brandColors.primaryGreen,
                }}
              />
            )}
            <SettingsIcon sx={{ fontSize: 20 }} />
            {!collapsed && <span>Settings</span>}
          </Box>
        </Tooltip>

        {/* Help Center */}
        <Tooltip title={collapsed ? 'Help Center' : ''} placement="right">
          <Box
            onClick={() => window.open('https://aapnubazaar.com/help', '_blank')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.5,
              px: collapsed ? 1 : 1.8,
              py: 1.1,
              borderRadius: '12px',
              cursor: 'pointer',
              color: brandColors.secondaryText,
              fontWeight: 600,
              fontSize: '13.5px',
              transition: 'all 0.18s ease',
              '&:hover': {
                backgroundColor: '#F8FAFC',
                color: brandColors.primaryText,
              },
            }}
          >
            <HelpIcon sx={{ fontSize: 20 }} />
            {!collapsed && <span>Help Center</span>}
          </Box>
        </Tooltip>
      </Box>

      {/* ======================================================== */}
      {/* BOTTOM USER PROFILE PILL */}
      {/* ======================================================== */}
      <Box sx={{ pt: 2, borderTop: `1px solid ${brandColors.border}`, mt: 2 }}>
        <Box
          onClick={handleProfileOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            p: 1.2,
            borderRadius: '14px',
            backgroundColor: '#F8FAFC',
            border: `1px solid ${brandColors.border}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: '#F1F5F9',
              borderColor: '#CBD5E1',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, overflow: 'hidden' }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: brandColors.primaryGreen,
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {adminData.name ? adminData.name[0].toUpperCase() : 'A'}
            </Avatar>
            {!collapsed && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: brandColors.primaryText,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {adminData.name || 'AapnuBazaar Admin'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: brandColors.secondaryText,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {adminData.email || 'admin@aapnubazaar.com'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: brandColors.adminBg,
        p: { xs: 1.5, sm: 2, md: 2.5 },
        display: 'flex',
      }}
    >
      {/* Desktop Sidebar (Floating Card) */}
      <Box
        sx={{
          width: collapsed ? collapsedSidebarWidth : fullSidebarWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          height: 'calc(100vh - 40px)',
          position: 'sticky',
          top: '20px',
          transition: 'width 0.2s ease',
        }}
      >
        {sidebarContent}
      </Box>

      {/* Mobile Sidebar (Drawer) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: fullSidebarWidth,
            backgroundColor: 'transparent',
            border: 'none',
            p: 1.5,
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          ml: { xs: 0, md: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          maxWidth: '1600px',
          mx: 'auto',
          width: '100%',
        }}
      >
        {/* Top Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            pt: { xs: 1, md: 0.5 },
          }}
        >
          {/* Left: Mobile Menu Toggle + Page Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                display: { md: 'none' },
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                p: 1,
                border: `1px solid ${brandColors.border}`,
              }}
            >
              <MenuIcon sx={{ color: brandColors.primaryText }} />
            </IconButton>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.4rem', sm: '1.75rem', md: '1.9rem' },
                color: brandColors.primaryText,
                letterSpacing: '-0.02em',
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>

          {/* Right Header Actions: Search, Notifications, Profile Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {/* Global Search Bar */}
            <Paper
              elevation={0}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                px: 2,
                py: 0.7,
                borderRadius: '50px',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${brandColors.border}`,
                boxShadow: '0 2px 8px rgba(20, 33, 61, 0.03)',
                width: { sm: 190, md: 240 },
              }}
            >
              <SearchIcon sx={{ color: brandColors.secondaryText, fontSize: 19, mr: 1 }} />
              <InputBase
                placeholder="Search portal..."
                sx={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: brandColors.primaryText,
                  '& input::placeholder': { color: '#94A3B8', opacity: 1 },
                }}
              />
            </Paper>

            {/* Notification Bell with Badge */}
            <Tooltip title="Notifications">
              <IconButton
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  width: 42,
                  height: 42,
                  border: `1px solid ${brandColors.border}`,
                  boxShadow: '0 2px 8px rgba(20, 33, 61, 0.03)',
                  '&:hover': { backgroundColor: '#F8FAFC' },
                }}
              >
                <Badge
                  color="error"
                  variant="dot"
                  overlap="circular"
                  sx={{ '& .MuiBadge-badge': { backgroundColor: brandColors.orange } }}
                >
                  <BellIcon sx={{ fontSize: 20, color: brandColors.secondaryText }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar Button (Opens Profile Menu) */}
            <Tooltip title="Account menu">
              <IconButton
                onClick={handleProfileOpen}
                sx={{
                  p: 0.4,
                  border: `1px solid ${brandColors.border}`,
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  '&:hover': { backgroundColor: '#F8FAFC' },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: brandColors.primaryGreen,
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {adminData.name ? adminData.name[0].toUpperCase() : 'A'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Page Content Container */}
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
      </Box>

      {/* Profile Dropdown Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleProfileClose}
        PaperProps={{
          sx: {
            mt: 1.2,
            minWidth: 230,
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(20, 33, 61, 0.08)',
            border: `1px solid ${brandColors.border}`,
            p: 0.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '14px', color: brandColors.primaryText }}>
            {adminData.name || 'AapnuBazaar Admin'}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: brandColors.secondaryText }}>
            {adminData.email || 'admin@aapnubazaar.com'}
          </Typography>
          <Box
            sx={{
              display: 'inline-block',
              mt: 1,
              px: 1.2,
              py: 0.3,
              borderRadius: '6px',
              backgroundColor: brandColors.lightGreen,
              color: brandColors.primaryGreen,
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {adminData.role?.replace('_', ' ').toUpperCase() || 'SUPER ADMIN'}
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: '#F1F5F9' }} />

        {/* Profile Item */}
        <MenuItem
          onClick={() => {
            handleProfileClose();
            navigate('/settings');
          }}
          sx={{ borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, py: 1 }}
        >
          <ListItemIcon sx={{ color: brandColors.secondaryText, minWidth: 32 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>

        {/* Settings Item */}
        <MenuItem
          onClick={() => {
            handleProfileClose();
            navigate('/settings');
          }}
          sx={{ borderRadius: '10px', fontSize: '13.5px', fontWeight: 600, py: 1 }}
        >
          <ListItemIcon sx={{ color: brandColors.secondaryText, minWidth: 32 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <Divider sx={{ my: 0.5, borderColor: '#F1F5F9' }} />

        {/* Logout Item */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            py: 1,
            color: '#EF4444',
            '&:hover': { backgroundColor: '#FEF2F2' },
          }}
        >
          <ListItemIcon sx={{ color: '#EF4444', minWidth: 32 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
