import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Paper,
  Badge,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  GridViewRounded as DashboardIcon,
  StorefrontOutlined as VendorsIcon,
  ShoppingBagOutlined as OrdersIcon,
  CategoryOutlined as ModulesIcon,
  Inventory2Outlined as ProductsIcon,
  PeopleOutlineRounded as UsersIcon,
  AdminPanelSettingsOutlined as AdminsIcon,
  SettingsOutlined as SettingsIcon,
  HeadsetMicOutlined as HelpIcon,
  NotificationsNoneOutlined as BellIcon,
  SearchRounded as SearchIcon,
  StoreOutlined as StoreIcon,
  MenuRounded as MenuIcon,
  LogoutRounded as LogoutIcon,
  PersonOutlineRounded as PersonIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  DarkModeOutlined as DarkModeIcon,
  LightModeOutlined as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useColorMode } from '../theme/ThemeContext';

const fullSidebarWidth = 256;
const collapsedSidebarWidth = 78;

// AapnuBazaar Brand Logo Component
const AapnuBazaarLogo = ({ collapsed, colors }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${colors?.primaryGreen || '#087F5B'} 0%, ${colors?.darkGreen || '#075B43'} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <StoreIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
      <Box
        sx={{
          position: 'absolute',
          top: 3,
          right: 3,
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: colors?.orange || '#FF6B00',
          border: '1.5px solid #FFFFFF',
        }}
      />
    </Box>
    {!collapsed && (
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: colors?.primaryText || '#0F172A',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}
        >
          AapnuBazaar
        </Typography>
        <Typography
          sx={{
            fontSize: '10.5px',
            color: colors?.primaryGreen || '#087F5B',
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
  const { mode, toggleTheme, isDark, colors } = useColorMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

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

  // Compute Page Title and Subtitle for Top Header
  const getHeaderMeta = () => {
    const path = location.pathname;
    const search = location.search;

    if (path === '/') {
      if (search.includes('revenue')) return { title: 'Payments & Revenue', subtitle: 'Overview of marketplace cash flow and revenue streams' };
      if (search.includes('analytics')) return { title: 'Reports & Analytics', subtitle: 'Detailed marketplace performance analytics' };
      return { title: 'Dashboard', subtitle: 'Overview of your AapnuBazaar marketplace' };
    }
    if (path.startsWith('/vendors')) {
      if (search.includes('stores')) return { title: 'Stores Directory', subtitle: 'Manage verified neighborhood stores & branches' };
      return { title: 'Vendors Management', subtitle: 'Registered merchant partners and onboarding status' };
    }
    if (path.startsWith('/products')) return { title: 'Products Catalog', subtitle: 'Manage items, inventory, categories and pricing' };
    if (path.startsWith('/orders')) {
      if (search.includes('delivery')) return { title: 'Delivery & Fulfillment', subtitle: 'Active shipments, delivery agents and live routing' };
      return { title: 'Orders Management', subtitle: 'Monitor marketplace customer orders and lifecycle' };
    }
    if (path.startsWith('/modules')) return { title: 'Categories & Modules', subtitle: 'Organize category tree, badges and store verticals' };
    if (path.startsWith('/users')) return { title: 'Customers Directory', subtitle: 'Manage customer accounts, orders and activity' };
    if (path.startsWith('/admins')) return { title: 'Staff Administration', subtitle: 'Manage team access levels, roles and security' };
    if (path.startsWith('/settings')) return { title: 'Platform Settings', subtitle: 'Marketplace configurations and account preferences' };
    return { title: 'Admin Portal', subtitle: 'AapnuBazaar Marketplace Control Center' };
  };

  const headerMeta = getHeaderMeta();

  // Active check helpers
  const isPathActive = (targetPath, checkSearch = null) => {
    if (checkSearch) {
      return location.pathname === targetPath.split('?')[0] && location.search.includes(checkSearch);
    }
    if (targetPath === '/') {
      return location.pathname === '/' && !location.search;
    }
    if (targetPath.includes('?')) {
      const [base, query] = targetPath.split('?');
      return location.pathname === base && location.search.includes(query);
    }
    return location.pathname.startsWith(targetPath) && (!location.search || location.pathname !== '/');
  };

  // Nav item component
  const NavItem = ({ label, path, icon: IconComponent, checkSearch, isSpecial = false }) => {
    const active = isPathActive(path, checkSearch);

    return (
      <Tooltip title={collapsed ? label : ''} placement="right">
        <Box
          onClick={() => handleNavigation(path)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.4,
            px: collapsed ? 1 : 1.6,
            py: 0.95,
            borderRadius: '10px',
            cursor: 'pointer',
            backgroundColor: active ? colors.lightGreen : 'transparent',
            color: active ? colors.primaryGreen : colors.secondaryText,
            fontWeight: active ? 700 : 500,
            fontSize: '13px',
            position: 'relative',
            userSelect: 'none',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: active ? colors.lightGreen : colors.paperHover,
              color: active ? colors.primaryGreen : colors.primaryText,
            },
          }}
        >
          {active && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: '22%',
                bottom: '22%',
                width: '3.5px',
                borderRadius: '0 4px 4px 0',
                backgroundColor: colors.primaryGreen,
              }}
            />
          )}
          <IconComponent sx={{ fontSize: 19, color: active ? colors.primaryGreen : colors.secondaryText, flexShrink: 0 }} />
          {!collapsed && (
            <Typography
              component="span"
              sx={{
                fontSize: '13px',
                fontWeight: active ? 700 : 500,
                color: 'inherit',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {label}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  };

  // Section Header
  const NavSectionHeader = ({ title }) => {
    if (collapsed) return <Divider sx={{ my: 1.2, borderColor: colors.divider }} />;
    return (
      <Typography
        sx={{
          fontSize: '10.5px',
          fontWeight: 800,
          letterSpacing: '0.07em',
          color: colors.secondaryText,
          textTransform: 'uppercase',
          px: 1.5,
          mt: 2,
          mb: 0.6,
        }}
      >
        {title}
      </Typography>
    );
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: collapsed ? 1.2 : 2,
        backgroundColor: colors.white,
        borderRadius: { xs: 0, md: '18px' },
        border: `1px solid ${colors.border}`,
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(20, 33, 61, 0.03)',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Sidebar Header / Brand Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 0.8,
          py: 0.5,
          mb: 2,
        }}
      >
        <Box
          onClick={() => handleNavigation(isSuperAdmin ? '/' : '/orders')}
          sx={{ cursor: 'pointer' }}
        >
          <AapnuBazaarLogo collapsed={collapsed} colors={colors} />
        </Box>

        {/* Desktop Collapse Button */}
        {!isMobile && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              display: { xs: 'none', md: 'flex' },
              color: colors.secondaryText,
              borderRadius: '8px',
              p: 0.4,
              '&:hover': { backgroundColor: colors.paperHover, color: colors.primaryText },
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* ======================================================== */}
      {/* 1. OVERVIEW */}
      {/* ======================================================== */}
      {isSuperAdmin && (
        <>
          <NavSectionHeader title="OVERVIEW" />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <NavItem label="Dashboard" path="/" icon={DashboardIcon} />
          </Box>
        </>
      )}

      {/* ======================================================== */}
      {/* 2. MARKETPLACE */}
      {/* ======================================================== */}
      <NavSectionHeader title="MARKETPLACE" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        <NavItem label="Vendors" path="/vendors" icon={VendorsIcon} checkSearch={null} />
        <NavItem label="Products" path="/products" icon={ProductsIcon} />
        {isSuperAdmin && (
          <NavItem label="Categories" path="/modules" icon={ModulesIcon} />
        )}
      </Box>

      {/* ======================================================== */}
      {/* 3. ORDERS & CUSTOMERS */}
      {/* ======================================================== */}
      <NavSectionHeader title="ORDERS & CUSTOMERS" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
        <NavItem label="Orders" path="/orders" icon={OrdersIcon} checkSearch={null} />
        {isSuperAdmin && (
          <NavItem label="Customers" path="/users" icon={UsersIcon} />
        )}
      </Box>

      {/* ======================================================== */}
      {/* 5. ADMINISTRATION */}
      {/* ======================================================== */}
      <NavSectionHeader title="ADMINISTRATION" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, mb: 'auto' }}>
        {isSuperAdmin && (
          <NavItem label="Admins" path="/admins" icon={AdminsIcon} />
        )}
        <NavItem label="Settings" path="/settings" icon={SettingsIcon} />
        <Tooltip title={collapsed ? 'Help Center' : ''} placement="right">
          <Box
            onClick={() => window.open('https://aapnubazaar.com/help', '_blank')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.4,
              px: collapsed ? 1 : 1.6,
              py: 0.95,
              borderRadius: '10px',
              cursor: 'pointer',
              color: colors.secondaryText,
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: colors.paperHover,
                color: colors.primaryText,
              },
            }}
          >
            <HelpIcon sx={{ fontSize: 19, color: colors.secondaryText, flexShrink: 0 }} />
            {!collapsed && <span>Help Center</span>}
          </Box>
        </Tooltip>
      </Box>

      {/* ======================================================== */}
      {/* USER PROFILE FOOTER */}
      {/* ======================================================== */}
      <Box sx={{ pt: 1.5, borderTop: `1px solid ${colors.border}`, mt: 2 }}>
        <Box
          onClick={handleProfileOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            p: 1,
            borderRadius: '12px',
            backgroundColor: colors.paperHover,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: isDark ? colors.border : '#F1F5F9',
              borderColor: colors.border,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, overflow: 'hidden' }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: colors.primaryGreen,
                fontSize: '13px',
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
                    fontSize: '12.5px',
                    color: colors.primaryText,
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
                    fontSize: '10.5px',
                    color: colors.secondaryText,
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {adminData.role ? adminData.role.replace('_', ' ').toUpperCase() : 'SUPER ADMIN'}
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
        backgroundColor: colors.adminBg,
        p: { xs: 1.5, sm: 2, md: 2.5 },
        display: 'flex',
      }}
    >
      {/* Desktop Sidebar (Fixed Sticky Container) */}
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

      {/* Main Workspace Area */}
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
            pt: { xs: 0.5, md: 0 },
            pb: 0.5,
          }}
        >
          {/* Left: Mobile Menu Trigger + Contextual Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              onClick={handleDrawerToggle}
              size="small"
              sx={{
                display: { md: 'none' },
                backgroundColor: colors.white,
                borderRadius: '10px',
                p: 0.8,
                border: `1px solid ${colors.border}`,
              }}
            >
              <MenuIcon sx={{ color: colors.primaryText, fontSize: 20 }} />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: colors.secondaryText }}>
                AapnuBazaar
              </Typography>
              <Typography sx={{ fontSize: '13px', color: colors.divider }}>/</Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: colors.primaryGreen }}>
                {headerMeta.title}
              </Typography>
            </Box>
          </Box>

          {/* Right Header Actions: Search, Theme Toggle, Notifications, Profile Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {/* Global Quick Search Bar */}
            <Paper
              elevation={0}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                px: 1.8,
                py: 0.6,
                borderRadius: '50px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                boxShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(20, 33, 61, 0.02)',
                width: { sm: 180, md: 240 },
                transition: 'border-color 0.15s ease',
                '&:focus-within': {
                  borderColor: colors.primaryGreen,
                },
              }}
            >
              <SearchIcon sx={{ color: colors.secondaryText, fontSize: 18, mr: 1 }} />
              <InputBase
                placeholder="Search vendors, products, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                sx={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: colors.primaryText,
                  width: '100%',
                  '& input::placeholder': { color: colors.secondaryText, opacity: 1 },
                }}
              />
            </Paper>

            {/* Dark Mode / Light Mode Toggle Button */}
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  backgroundColor: colors.white,
                  borderRadius: '12px',
                  width: 38,
                  height: 38,
                  border: `1px solid ${colors.border}`,
                  boxShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(20, 33, 61, 0.02)',
                  color: isDark ? colors.orange : colors.secondaryText,
                  transition: 'all 0.2s ease',
                  '&:hover': { backgroundColor: colors.paperHover },
                }}
              >
                {isDark ? (
                  <LightModeIcon sx={{ fontSize: 19, color: colors.orange }} />
                ) : (
                  <DarkModeIcon sx={{ fontSize: 19, color: colors.secondaryText }} />
                )}
              </IconButton>
            </Tooltip>

            {/* Notification Bell with Badge */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={handleNotificationsOpen}
                sx={{
                  backgroundColor: colors.white,
                  borderRadius: '12px',
                  width: 38,
                  height: 38,
                  border: `1px solid ${colors.border}`,
                  boxShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.2)' : '0 2px 6px rgba(20, 33, 61, 0.02)',
                  '&:hover': { backgroundColor: colors.paperHover },
                }}
              >
                <Badge
                  color="error"
                  variant="dot"
                  overlap="circular"
                  sx={{ '& .MuiBadge-badge': { backgroundColor: colors.orange } }}
                >
                  <BellIcon sx={{ fontSize: 19, color: colors.secondaryText }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar Button */}
            <Tooltip title="Account menu">
              <IconButton
                onClick={handleProfileOpen}
                sx={{
                  p: 0.3,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  backgroundColor: colors.white,
                  '&:hover': { backgroundColor: colors.paperHover },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: colors.primaryGreen,
                    fontSize: '12.5px',
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

      {/* Notifications Popover */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1.2,
            width: 290,
            borderRadius: '14px',
            backgroundColor: colors.white,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${colors.border}`,
            p: 1,
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '13px', color: colors.primaryText }}>
            Notifications
          </Typography>
          <Typography sx={{ fontSize: '11px', color: colors.primaryGreen, fontWeight: 700, cursor: 'pointer' }}>
            Mark all read
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5, borderColor: colors.divider }} />
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '12px', color: colors.secondaryText }}>
            No unread system alerts
          </Typography>
        </Box>
      </Menu>

      {/* Profile Dropdown Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleProfileClose}
        PaperProps={{
          sx: {
            mt: 1.2,
            minWidth: 230,
            borderRadius: '14px',
            backgroundColor: colors.white,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${colors.border}`,
            p: 0.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: colors.primaryText }}>
            {adminData.name || 'AapnuBazaar Admin'}
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: colors.secondaryText }}>
            {adminData.email || 'admin@aapnubazaar.com'}
          </Typography>
          <Box
            sx={{
              display: 'inline-block',
              mt: 0.8,
              px: 1,
              py: 0.3,
              borderRadius: '6px',
              backgroundColor: colors.lightGreen,
              color: colors.primaryGreen,
              fontSize: '10.5px',
              fontWeight: 700,
            }}
          >
            {adminData.role?.replace('_', ' ').toUpperCase() || 'SUPER ADMIN'}
          </Box>
        </Box>

        <Divider sx={{ my: 0.5, borderColor: colors.divider }} />

        {/* Dark Mode Toggle in Profile Menu */}
        <MenuItem
          onClick={toggleTheme}
          sx={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600, py: 0.9 }}
        >
          <ListItemIcon sx={{ color: isDark ? colors.orange : colors.secondaryText, minWidth: 30 }}>
            {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={isDark ? "Light Mode" : "Dark Mode"} />
        </MenuItem>

        {/* Profile */}
        <MenuItem
          onClick={() => {
            handleProfileClose();
            navigate('/settings');
          }}
          sx={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600, py: 0.9 }}
        >
          <ListItemIcon sx={{ color: colors.secondaryText, minWidth: 30 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>

        {/* Settings */}
        <MenuItem
          onClick={() => {
            handleProfileClose();
            navigate('/settings');
          }}
          sx={{ borderRadius: '8px', fontSize: '13px', fontWeight: 600, py: 0.9 }}
        >
          <ListItemIcon sx={{ color: colors.secondaryText, minWidth: 30 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <Divider sx={{ my: 0.5, borderColor: colors.divider }} />

        {/* Logout */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            py: 0.9,
            color: colors.error,
            '&:hover': { backgroundColor: colors.errorLight },
          }}
        >
          <ListItemIcon sx={{ color: colors.error, minWidth: 30 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
