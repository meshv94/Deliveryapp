import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  MenuItem,
  Tooltip,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  Skeleton,
  InputBase,
} from '@mui/material';
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  CloseRounded as CloseIcon,
  CloudUploadRounded as UploadIcon,
  SearchRounded as SearchIcon,
  Inventory2Outlined as ProductIcon,
  StorefrontRounded as StoreIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  FilterListRounded as FilterListIcon,
  RefreshRounded as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  LocalOfferOutlined as SaleIcon,
  AccessTimeRounded as TimeIcon,
  CategoryOutlined as CategoryIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import vendorService from '../services/vendorService';
import moduleService from '../services/moduleService';
import { useColorMode } from '../theme/ThemeContext';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const Products = () => {
  const { BRAND, isDark } = useColorMode();
  const navigate = useNavigate();

  // Core Data State
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog & Drawer States
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Action Menu State
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [activeMenuProduct, setActiveMenuProduct] = useState(null);

  // Form State
  const [formData, setProductFormData] = useState({
    name: '',
    description: '',
    main_price: '',
    special_price: '',
    preparation_time_minute: 0,
    packaging_charge: 0,
    vendor_id: '',
    module_id: '',
    dietary_type: 'none',
    tags: '',
    isActive: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Permissions Check
  const adminData = (() => {
    try {
      return JSON.parse(localStorage.getItem('adminData') || '{}');
    } catch {
      return {};
    }
  })();
  const isSuperAdmin = adminData.role === 'super_admin';
  const canManageProducts = isSuperAdmin || Boolean(adminData.permissions?.canManageProducts);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [productsRes, vendorsRes, modulesRes] = await Promise.allSettled([
        vendorService.getAllProducts(),
        vendorService.getAllVendors(),
        moduleService.getAllModules(),
      ]);

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value?.data || []);
      } else {
        throw new Error(productsRes.reason?.message || 'Failed to fetch products');
      }

      if (vendorsRes.status === 'fulfilled') {
        setVendors(vendorsRes.value?.data || []);
      }

      if (modulesRes.status === 'fulfilled') {
        setModules(modulesRes.value?.data || []);
      }
    } catch (err) {
      console.error('Error loading products data:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Open Form for Add or Edit
  const handleOpenFormDialog = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setProductFormData({
        name: product.name || '',
        description: product.description || '',
        main_price: product.main_price || '',
        special_price: product.special_price || '',
        preparation_time_minute: product.preparation_time_minute || 0,
        packaging_charge: product.packaging_charge || 0,
        vendor_id: product.vendor_id?._id || product.vendor_id || product.vendor?._id || product.vendor || '',
        module_id: product.module_id?._id || product.module_id || product.module?._id || product.module || '',
        dietary_type: product.dietary_type || 'none',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        isActive: product.isActive !== undefined ? product.isActive : true,
        image: null,
      });
      setImagePreview(product.image || null);
    } else {
      setSelectedProduct(null);
      setProductFormData({
        name: '',
        description: '',
        main_price: '',
        special_price: '',
        preparation_time_minute: 0,
        packaging_charge: 0,
        vendor_id: vendors[0]?._id || '',
        module_id: modules[0]?._id || '',
        dietary_type: 'none',
        tags: '',
        isActive: true,
        image: null,
      });
      setImagePreview(null);
    }
    setOpenFormDialog(true);
  };

  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setSelectedProduct(null);
    setImagePreview(null);
  };

  const handleOpenViewDrawer = (product) => {
    setSelectedProduct(product);
    setViewDrawerOpen(true);
  };

  const handleCloseViewDrawer = () => {
    setViewDrawerOpen(false);
    setSelectedProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.name.trim()) {
        throw new Error('Product name is required.');
      }
      if (!formData.main_price || Number(formData.main_price) <= 0) {
        throw new Error('Please specify a valid main price.');
      }
      if (!formData.vendor_id) {
        throw new Error('Please select an associated store/vendor.');
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description || '');
      data.append('main_price', formData.main_price);
      data.append('special_price', formData.special_price || '');
      data.append('preparation_time_minute', formData.preparation_time_minute || 0);
      data.append('packaging_charge', formData.packaging_charge || 0);
      data.append('vendor_id', formData.vendor_id);
      data.append('module_id', formData.module_id || '');
      data.append('dietary_type', formData.dietary_type || 'none');
      if (formData.tags) {
        const tagList = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
        tagList.forEach(tag => data.append('tags[]', tag));
      }
      data.append('isActive', formData.isActive);

      if (formData.image) {
        data.append('image', formData.image);
      }

      if (selectedProduct) {
        await vendorService.updateProduct(selectedProduct._id, data);
        setSuccess('Product updated successfully!');
      } else {
        await vendorService.createProduct(data);
        setSuccess('Product created successfully!');
      }

      handleCloseFormDialog();
      fetchInitialData(true);
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await vendorService.deleteProduct(selectedProduct._id);
      setSuccess('Product deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchInitialData(true);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickToggleStock = async (product, e) => {
    e.stopPropagation();
    const nextState = !product.isActive;
    // Optimistic local state update
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, isActive: nextState } : p))
    );
    try {
      const data = new FormData();
      data.append('isActive', nextState);
      await vendorService.updateProduct(product._id, data);
      setSuccess(`"${product.name}" is now marked as ${nextState ? 'In Stock (Active)' : 'Out of Stock (Inactive)'}`);
    } catch (err) {
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, isActive: !nextState } : p))
      );
      setError('Failed to update stock availability');
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.vendor_id?.name || p.vendor?.name)?.toLowerCase().includes(q);

      const vendorId = p.vendor_id?._id || p.vendor_id || p.vendor?._id || p.vendor;
      const matchesVendor = selectedVendorFilter === 'all' || vendorId === selectedVendorFilter;

      const moduleId = p.module_id?._id || p.module_id || p.module?._id || p.module;
      const matchesModule = selectedModuleFilter === 'all' || moduleId === selectedModuleFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive);

      return matchesSearch && matchesVendor && matchesModule && matchesStatus;
    });
  }, [products, search, selectedVendorFilter, selectedModuleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const paginatedProducts = filteredProducts.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 4 }}>
      {/* Alerts */}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ======================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ======================================================== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.6rem' },
              color: BRAND.text,
              letterSpacing: '-0.025em',
              lineHeight: 1.2,
            }}
          >
            Products Catalog
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Manage marketplace catalog items, pricing, inventory and categories
          </Typography>
        </Box>
        {canManageProducts && (
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => handleOpenFormDialog()}
            sx={{
              backgroundColor: BRAND.green,
              color: '#FFFFFF',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              px: 2.2,
              py: 0.9,
              minHeight: 40,
              boxShadow: '0 4px 12px rgba(8, 127, 91, 0.24)',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: BRAND.darkGreen,
                boxShadow: '0 6px 16px rgba(8, 127, 91, 0.32)',
              },
            }}
          >
            + Add Product
          </Button>
        )}
      </Box>

      {/* ======================================================== */}
      {/* 2. SUMMARY FILTER TABS */}
      {/* ======================================================== */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
        {[
          { label: 'All Products', value: products.length, filter: 'all', bg: BRAND.lightGreen, color: BRAND.green, active: statusFilter === 'all' },
          { label: 'Active', value: activeCount, filter: 'active', bg: isDark ? 'rgba(52,211,153,0.15)' : '#DCFCE7', color: BRAND.success || '#16A34A', active: statusFilter === 'active' },
          { label: 'Inactive', value: inactiveCount, filter: 'inactive', bg: BRAND.redLight, color: BRAND.red, active: statusFilter === 'inactive' },
        ].map((tab) => (
          <Box
            key={tab.filter}
            onClick={() => {
              setStatusFilter(tab.filter);
              setPage(1);
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.8,
              py: 0.7,
              borderRadius: '50px',
              backgroundColor: tab.active ? tab.bg : BRAND.white,
              color: tab.active ? tab.color : BRAND.muted,
              border: `1px solid ${tab.active ? tab.color + '40' : BRAND.border}`,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              boxShadow: tab.active ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
              '&:hover': {
                backgroundColor: tab.bg,
                color: tab.color,
              },
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: tab.active ? tab.color : (isDark ? '#475569' : '#CBD5E1'),
              }}
            />
            {tab.label}
            <Box
              sx={{
                px: 0.8,
                py: 0.1,
                borderRadius: '6px',
                backgroundColor: tab.active ? `${tab.color}18` : BRAND.innerCard,
                color: tab.active ? tab.color : BRAND.muted,
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {tab.value}
            </Box>
          </Box>
        ))}
      </Box>

      {/* ======================================================== */}
      {/* 3. MAIN TABLE & TOOLBAR CARD */}
      {/* ======================================================== */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          backgroundColor: BRAND.white,
          border: `1px solid ${BRAND.border}`,
          boxShadow: '0 2px 10px rgba(20, 33, 61, 0.02)',
          p: { xs: 2, sm: 2.5 },
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
              Products List
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: BRAND.innerCard,
                border: `1px solid ${BRAND.border}`,
                borderRadius: '10px',
                px: 1.5,
                py: 0.55,
                width: { xs: '100%', sm: 220 },
                transition: 'border-color 0.15s ease',
                '&:focus-within': { borderColor: BRAND.green },
              }}
            >
              <SearchIcon sx={{ color: BRAND.muted, fontSize: 17, mr: 1 }} />
              <InputBase
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                sx={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: BRAND.text,
                  width: '100%',
                  '& input::placeholder': { color: BRAND.muted, opacity: 1 },
                }}
              />
            </Box>

            {/* Vendor Filter */}
            {vendors.length > 0 && (
              <Box
                component="select"
                value={selectedVendorFilter}
                onChange={(e) => {
                  setSelectedVendorFilter(e.target.value);
                  setPage(1);
                }}
                sx={{
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: '10px',
                  px: 1.2,
                  py: 0.65,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: BRAND.text,
                  backgroundColor: BRAND.innerCard,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 130,
                  '&:hover': { borderColor: BRAND.green },
                }}
              >
                <option value="all" style={{ background: BRAND.white, color: BRAND.text }}>All Stores</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id} style={{ background: BRAND.white, color: BRAND.text }}>
                    {v.name}
                  </option>
                ))}
              </Box>
            )}

            {/* Category Filter */}
            {modules.length > 0 && (
              <Box
                component="select"
                value={selectedModuleFilter}
                onChange={(e) => {
                  setSelectedModuleFilter(e.target.value);
                  setPage(1);
                }}
                sx={{
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: '10px',
                  px: 1.2,
                  py: 0.65,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: BRAND.text,
                  backgroundColor: BRAND.innerCard,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 130,
                  '&:hover': { borderColor: BRAND.green },
                }}
              >
                <option value="all" style={{ background: BRAND.white, color: BRAND.text }}>All Categories</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id} style={{ background: BRAND.white, color: BRAND.text }}>
                    {m.name}
                  </option>
                ))}
              </Box>
            )}

            {/* Refresh Button */}
            <Tooltip title="Refresh catalog">
              <IconButton
                size="small"
                onClick={() => fetchInitialData(true)}
                sx={{
                  backgroundColor: BRAND.white,
                  border: `1px solid ${BRAND.border}`,
                  borderRadius: '8px',
                  width: 34,
                  height: 34,
                  '&:hover': { backgroundColor: BRAND.innerCard, borderColor: BRAND.green },
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: 17,
                    color: BRAND.muted,
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ======================================================== */}
        {/* DESKTOP DATA TABLE */}
        {/* ======================================================== */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table size="small" sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      borderBottom: `1.5px solid ${BRAND.border}`,
                      color: BRAND.muted,
                      fontWeight: 700,
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      py: 1.3,
                      backgroundColor: BRAND.innerCard,
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Store / Vendor</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Special Price</TableCell>
                  <TableCell>Prep Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8} sx={{ py: 1.6 }}>
                        <Skeleton variant="text" width="100%" height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <ProductIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                        No products found
                      </Typography>
                      <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3, mb: 1.5 }}>
                        {search || selectedVendorFilter !== 'all' || selectedModuleFilter !== 'all' || statusFilter !== 'all'
                          ? 'No products match your current search or filters.'
                          : 'Add your first product to get started.'}
                      </Typography>
                      {(search || selectedVendorFilter !== 'all' || selectedModuleFilter !== 'all' || statusFilter !== 'all') && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSearch('');
                            setSelectedVendorFilter('all');
                            setSelectedModuleFilter('all');
                            setStatusFilter('all');
                          }}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '12px', color: BRAND.green }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => {
                    const vendorName = product.vendor_id?.name || product.vendor?.name || 'Store';
                    const categoryName = product.module_id?.name || product.module?.name || 'General';

                    return (
                      <TableRow
                        key={product._id}
                        hover
                        sx={{
                          '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.3 },
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: BRAND.innerCard },
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        {/* Product info */}
                        <TableCell onClick={() => handleOpenViewDrawer(product)}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={product.image}
                              alt={product.name}
                              variant="rounded"
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '8px',
                                backgroundColor: BRAND.innerCard,
                                border: `1px solid ${BRAND.border}`,
                              }}
                            >
                              <ProductIcon sx={{ color: BRAND.muted, fontSize: 20 }} />
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text, lineHeight: 1.2 }}>
                                {product.name}
                              </Typography>
                              {product.description && (
                                <Typography
                                  sx={{
                                    fontSize: '11px',
                                    color: BRAND.muted,
                                    maxWidth: 220,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    mt: 0.2,
                                  }}
                                >
                                  {product.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Category */}
                        <TableCell onClick={() => handleOpenViewDrawer(product)}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.2,
                              py: 0.3,
                              borderRadius: '6px',
                              backgroundColor: BRAND.lightGreen,
                              color: BRAND.green,
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}
                          >
                            {categoryName}
                          </Box>
                        </TableCell>

                        {/* Store / Vendor */}
                        <TableCell onClick={() => handleOpenViewDrawer(product)}>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                            {vendorName}
                          </Typography>
                        </TableCell>

                        {/* Main Price */}
                        <TableCell onClick={() => handleOpenViewDrawer(product)}>
                          <Typography sx={{ fontWeight: 800, color: BRAND.text, fontSize: '13px' }}>
                            {formatCurrency(product.main_price)}
                          </Typography>
                        </TableCell>

                        {/* Special Price */}
                        <TableCell onClick={() => handleOpenViewDrawer(product)}>
                          <Typography sx={{ fontWeight: 700, color: BRAND.orange, fontSize: '12.5px' }}>
                            {product.special_price ? formatCurrency(product.special_price) : '—'}
                          </Typography>
                        </TableCell>

                        {/* Prep time */}
                        <TableCell onClick={() => handleOpenViewDrawer(product)}>
                          <Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>
                            {product.preparation_time_minute || 0} min
                          </Typography>
                        </TableCell>

                        {/* Status (1-Click Out-of-Stock Quick Toggle) */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip title={product.isActive ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}>
                            <Box
                              onClick={(e) => handleQuickToggleStock(product, e)}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.8,
                                px: 1.3,
                                py: 0.4,
                                borderRadius: '50px',
                                cursor: 'pointer',
                                backgroundColor: product.isActive
                                  ? isDark
                                    ? 'rgba(52,211,153,0.15)'
                                    : '#DCFCE7'
                                  : isDark
                                  ? 'rgba(239,68,68,0.15)'
                                  : '#FEE2E2',
                                color: product.isActive ? BRAND.success || '#16A34A' : BRAND.red,
                                border: `1px solid ${
                                  product.isActive ? 'rgba(22, 163, 74, 0.3)' : 'rgba(220, 38, 38, 0.3)'
                                }`,
                                fontSize: '11px',
                                fontWeight: 800,
                                userSelect: 'none',
                                transition: 'all 0.15s ease',
                                '&:hover': { transform: 'scale(1.04)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                              }}
                            >
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: product.isActive ? BRAND.success || '#16A34A' : BRAND.red,
                                }}
                              />
                              {product.isActive ? 'IN STOCK' : 'OUT OF STOCK'}
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDrawer(product)}
                                sx={{
                                  color: BRAND.blue,
                                  backgroundColor: BRAND.lightBlue,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { backgroundColor: isDark ? 'rgba(96,165,250,0.25)' : '#DBEAFE' },
                                }}
                              >
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            {canManageProducts && (
                              <>
                                <Tooltip title="Edit Product">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenFormDialog(product)}
                                    sx={{
                                      color: BRAND.muted,
                                      backgroundColor: BRAND.innerCard,
                                      borderRadius: '8px',
                                      width: 28,
                                      height: 28,
                                      '&:hover': { backgroundColor: BRAND.border, color: BRAND.text },
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete Product">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteClick(product)}
                                    sx={{
                                      color: BRAND.red,
                                      backgroundColor: BRAND.redLight,
                                      borderRadius: '8px',
                                      width: 28,
                                      height: 28,
                                      '&:hover': { backgroundColor: isDark ? 'rgba(248,113,113,0.25)' : '#FECACA' },
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* ======================================================== */}
        {/* MOBILE RESPONSIVE CARDS */}
        {/* ======================================================== */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: '12px' }} />)
          ) : paginatedProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ProductIcon sx={{ fontSize: 36, color: BRAND.muted, display: 'block', mx: 'auto', mb: 1 }} />
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No products found</Typography>
            </Box>
          ) : (
            paginatedProducts.map((product) => (
              <Paper
                key={product._id}
                elevation={0}
                onClick={() => handleOpenViewDrawer(product)}
                sx={{
                  p: 1.8,
                  borderRadius: '12px',
                  backgroundColor: BRAND.innerCard,
                  border: `1px solid ${BRAND.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar
                      src={product.image}
                      alt={product.name}
                      variant="rounded"
                      sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${BRAND.border}` }}
                    >
                      <ProductIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.text }}>
                        {product.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: 0.2 }}>
                        <Box sx={{ fontSize: '11px', fontWeight: 700, color: BRAND.green }}>
                          {product.module_id?.name || product.module?.name || 'General'}
                        </Box>
                        <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>&bull;</Typography>
                        <Typography sx={{ fontSize: '11px', color: product.isActive ? (BRAND.success || '#16A34A') : BRAND.red, fontWeight: 700 }}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: BRAND.muted, pt: 0.5, borderTop: `1px solid ${BRAND.divider}` }}>
                  <Box>
                    <Typography sx={{ fontSize: '11.5px', color: BRAND.text, fontWeight: 600 }}>
                      {product.vendor_id?.name || product.vendor?.name || 'Store'}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                      Prep: {product.preparation_time_minute || 0} min
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.text }}>
                      {formatCurrency(product.main_price)}
                    </Typography>
                    {product.special_price && (
                      <Typography sx={{ fontSize: '11px', color: BRAND.orange, fontWeight: 700 }}>
                        {formatCurrency(product.special_price)}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: `1px solid ${BRAND.divider}` }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    onClick={() => handleOpenViewDrawer(product)}
                    sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 700, color: BRAND.blue, borderRadius: '6px', px: 1, py: 0.3, border: `1px solid ${BRAND.border}` }}
                  >
                    View
                  </Button>
                  {canManageProducts && (
                    <Button
                      size="small"
                      onClick={() => handleOpenFormDialog(product)}
                      sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 700, color: BRAND.text, borderRadius: '6px', px: 1, py: 0.3, border: `1px solid ${BRAND.border}` }}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* ======================================================== */}
        {/* PAGINATION */}
        {/* ======================================================== */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            mt: 2.5,
            pt: 2,
            borderTop: `1px solid ${BRAND.divider}`,
          }}
        >
          <Typography sx={{ fontSize: '12px', color: BRAND.muted, fontWeight: 600 }}>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredProducts.length)} of {filteredProducts.length} items
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <IconButton
              size="small"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{
                border: `1px solid ${BRAND.border}`,
                borderRadius: '8px',
                width: 32,
                height: 32,
                color: BRAND.muted,
                '&:disabled': { opacity: 0.35 },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const n = start + i;
              if (n > totalPages) return null;
              return (
                <IconButton
                  key={n}
                  size="small"
                  onClick={() => setPage(n)}
                  sx={{
                    border: `1px solid ${n === page ? BRAND.green : BRAND.border}`,
                    borderRadius: '8px',
                    width: 32,
                    height: 32,
                    backgroundColor: n === page ? BRAND.green : BRAND.white,
                    color: n === page ? '#FFFFFF' : BRAND.muted,
                    fontWeight: 700,
                    fontSize: '12px',
                    '&:hover': { backgroundColor: n === page ? BRAND.darkGreen : BRAND.innerCard },
                  }}
                >
                  {n}
                </IconButton>
              );
            })}
            <IconButton
              size="small"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              sx={{
                border: `1px solid ${BRAND.border}`,
                borderRadius: '8px',
                width: 32,
                height: 32,
                backgroundColor: BRAND.green,
                color: '#FFFFFF',
                '&:hover': { backgroundColor: BRAND.darkGreen },
                '&:disabled': { backgroundColor: isDark ? '#1E293B' : '#E2E8F0', color: '#94A3B8' },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ======================================================== */}
      {/* 4. VIEW PRODUCT DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={viewDrawerOpen}
        onClose={handleCloseViewDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 420 },
            p: 3,
            boxSizing: 'border-box',
            backgroundColor: BRAND.white,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
            Product Details
          </Typography>
          <IconButton onClick={handleCloseViewDrawer} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedProduct && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={selectedProduct.image}
                alt={selectedProduct.name}
                variant="rounded"
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  borderRadius: '12px',
                  border: `1px solid ${BRAND.border}`,
                }}
              />
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text, mt: 1.5 }}>
                {selectedProduct.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                <Chip label={selectedProduct.module_id?.name || selectedProduct.module?.name || 'General'} size="small" sx={{ bgcolor: BRAND.lightGreen, color: BRAND.green, fontWeight: 700, height: 20 }} />
                <Chip label={selectedProduct.isActive ? 'Active' : 'Inactive'} size="small" sx={{ bgcolor: selectedProduct.isActive ? (isDark ? 'rgba(52,211,153,0.15)' : '#DCFCE7') : BRAND.redLight, color: selectedProduct.isActive ? (BRAND.success || '#16A34A') : BRAND.red, fontWeight: 700, height: 20 }} />
              </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.5 }}>
                Pricing & Preparation
              </Typography>
              <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Main Price:</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.text }}>
                    {formatCurrency(selectedProduct.main_price)}
                  </Typography>
                </Box>
                {selectedProduct.special_price && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Special Discount Price:</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.orange }}>
                      {formatCurrency(selectedProduct.special_price)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Prep Time:</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                    {selectedProduct.preparation_time_minute || 0} minutes
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Packaging Fee:</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                    ₹{selectedProduct.packaging_charge || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Store / Vendor:</Typography>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.green }}>
                    {selectedProduct.vendor_id?.name || selectedProduct.vendor?.name || 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {selectedProduct.description && (
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 0.5 }}>
                  Description
                </Typography>
                <Typography sx={{ fontSize: '13px', color: BRAND.text, lineHeight: 1.4 }}>
                  {selectedProduct.description}
                </Typography>
              </Box>
            )}

            {canManageProducts && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const p = selectedProduct;
                    handleCloseViewDrawer();
                    handleOpenFormDialog(p);
                  }}
                  sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: BRAND.border, color: BRAND.text }}
                >
                  Edit Product
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    const p = selectedProduct;
                    handleCloseViewDrawer();
                    handleDeleteClick(p);
                  }}
                  sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: BRAND.red, '&:hover': { bgcolor: '#B91C1C' } }}
                >
                  Delete
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* 5. ADD / EDIT PRODUCT FORM MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={openFormDialog}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            margin: { xs: 1.5, sm: 3 },
            backgroundColor: BRAND.white,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', color: BRAND.text }}>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
              {selectedProduct ? 'Update product pricing, images and inventory parameters' : 'Create a new marketplace item in your catalog'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseFormDialog} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Grid container spacing={2}>
            {/* Image upload */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              {imagePreview ? (
                <Avatar
                  src={imagePreview}
                  variant="rounded"
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 1, borderRadius: '10px', border: `1px solid ${BRAND.border}` }}
                />
              ) : (
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 1,
                    borderRadius: '10px',
                    border: `1.5px dashed ${BRAND.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: BRAND.innerCard,
                  }}
                >
                  <ProductIcon sx={{ color: BRAND.muted, fontSize: 28 }} />
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={<UploadIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  borderRadius: '8px',
                  borderColor: BRAND.border,
                  color: BRAND.text,
                }}
              >
                {imagePreview ? 'Replace Image' : 'Upload Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Product Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Store / Vendor *"
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleInputChange}
                required
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              >
                {vendors.map((v) => (
                  <MenuItem key={v._id} value={v._id}>
                    {v.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Category / Module"
                name="module_id"
                value={formData.module_id}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              >
                {modules.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Main Price (₹) *"
                name="main_price"
                type="number"
                value={formData.main_price}
                onChange={handleInputChange}
                required
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Special Discount Price (₹)"
                name="special_price"
                type="number"
                value={formData.special_price}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
                helperText="Leave empty if no promotional price"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Prep Time (mins)"
                name="preparation_time_minute"
                type="number"
                value={formData.preparation_time_minute}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Packaging Fee (₹)"
                name="packaging_charge"
                type="number"
                value={formData.packaging_charge}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                select
                label="Status"
                name="isActive"
                value={formData.isActive.toString()}
                onChange={(e) => setProductFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Dietary Classification"
                name="dietary_type"
                value={formData.dietary_type || 'none'}
                onChange={handleInputChange}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              >
                <MenuItem value="none">Standard / None</MenuItem>
                <MenuItem value="veg">🟢 Pure Veg</MenuItem>
                <MenuItem value="non_veg">🔴 Non-Veg</MenuItem>
                <MenuItem value="vegan">🌱 Vegan</MenuItem>
                <MenuItem value="egg">🥚 Contains Egg</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Search Tags / Keywords"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g. spicy, cheesy, thin crust, gluten free"
                helperText="Comma-separated keywords for smart discovery"
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
                InputProps={{ sx: { borderRadius: '8px', fontSize: '13px' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #F1F5F9', justifyContent: 'space-between' }}>
          <Button onClick={handleCloseFormDialog} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              backgroundColor: BRAND.green,
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              px: 3,
              py: 0.8,
              '&:hover': { backgroundColor: BRAND.darkGreen },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : selectedProduct ? 'Save Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. DELETE PRODUCT CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
          Delete Product?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={submitting}
            sx={{
              bgcolor: BRAND.red,
              color: '#FFFFFF',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
