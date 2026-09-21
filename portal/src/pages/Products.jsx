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
  Select,
  FormControl,
  InputLabel,
  Switch,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Inventory2 as ProductIcon,
  Storefront as StoreIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  LocalOffer as SaleIcon,
  AccessTime as TimeIcon,
  LocalShipping as DeliveryIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import vendorService from '../services/vendorService';
import moduleService from '../services/moduleService';
import { brandColors } from '../theme/tokens';

const Products = () => {
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      console.error('Error fetching marketplace products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // KPI Calculations
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((p) => p.isActive).length;
  const inactiveProductsCount = products.filter((p) => !p.isActive).length;
  const onSaleProductsCount = products.filter(
    (p) => p.special_price && Number(p.special_price) < Number(p.main_price)
  ).length;

  // Filter Logic
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.vendor_id?.name && p.vendor_id.name.toLowerCase().includes(q));

      const matchesVendor =
        selectedVendorFilter === 'all' ||
        (p.vendor_id?._id || p.vendor_id || p.vendor?._id || p.vendor) === selectedVendorFilter;

      const matchesModule =
        selectedModuleFilter === 'all' ||
        (p.module_id?._id || p.module_id || p.module?._id || p.module) === selectedModuleFilter;

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = Boolean(p.isActive);
      } else if (statusFilter === 'inactive') {
        matchesStatus = !p.isActive;
      }

      return matchesSearch && matchesVendor && matchesModule && matchesStatus;
    });
  }, [products, search, selectedVendorFilter, selectedModuleFilter, statusFilter]);

  const paginatedProducts = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredProducts.slice(start, start + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage) || 1;

  useEffect(() => {
    setPage(0);
  }, [search, selectedVendorFilter, selectedModuleFilter, statusFilter, rowsPerPage]);

  // Action Menu Handlers
  const handleOpenActionMenu = (event, product) => {
    setActionMenuAnchor(event.currentTarget);
    setActiveMenuProduct(product);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActiveMenuProduct(null);
  };

  // Form Dialog
  const handleOpenForm = (product = null) => {
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
        isActive: true,
        image: null,
      });
      setImagePreview(null);
    }
    setOpenFormDialog(true);
    handleCloseActionMenu();
  };

  const handleCloseForm = () => {
    setOpenFormDialog(false);
    setSelectedProduct(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.main_price) {
      setError('Product name and main price are required');
      return;
    }
    if (!formData.vendor_id) {
      setError('Please assign this product to a vendor store');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const form = new FormData();
      form.append('name', formData.name.trim());
      form.append('description', formData.description.trim());
      form.append('main_price', formData.main_price);
      if (formData.special_price) {
        form.append('special_price', formData.special_price);
      }
      form.append('preparation_time_minute', formData.preparation_time_minute || 0);
      form.append('packaging_charge', formData.packaging_charge || 0);
      form.append('vendor_id', formData.vendor_id);
      if (formData.module_id) {
        form.append('module_id', formData.module_id);
      }
      form.append('isActive', formData.isActive);

      if (formData.image instanceof File) {
        form.append('image', formData.image);
      }

      if (selectedProduct) {
        await vendorService.updateProduct(selectedProduct._id, form);
        setSuccess(`Product "${formData.name.trim()}" updated successfully!`);
      } else {
        await vendorService.createProduct(form);
        setSuccess(`Product "${formData.name.trim()}" created successfully!`);
      }

      handleCloseForm();
      await fetchInitialData(true);
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActiveProduct = async (product) => {
    try {
      const form = new FormData();
      form.append('name', product.name);
      form.append('main_price', product.main_price);
      form.append('vendor_id', product.vendor_id?._id || product.vendor_id);
      form.append('isActive', !product.isActive);

      await vendorService.updateProduct(product._id, form);
      setSuccess(`Product "${product.name}" ${!product.isActive ? 'activated' : 'deactivated'} successfully!`);
      await fetchInitialData(true);
    } catch (err) {
      console.error('Error toggling product status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update product status');
    }
  };

  // Delete Product
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    try {
      setSubmitting(true);
      setError(null);
      await vendorService.deleteProduct(selectedProduct._id);
      setSuccess(`Product "${selectedProduct.name}" deleted successfully!`);
      setDeleteDialogOpen(false);
      if (viewDrawerOpen && selectedProduct._id === selectedProduct?._id) {
        setViewDrawerOpen(false);
      }
      setSelectedProduct(null);
      await fetchInitialData(true);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  // View Product Drawer
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewDrawerOpen(true);
    handleCloseActionMenu();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedVendorFilter('all');
    setSelectedModuleFilter('all');
    setStatusFilter('all');
    setPage(0);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedVendorFilter !== 'all' ||
    selectedModuleFilter !== 'all' ||
    statusFilter !== 'all';

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '65vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} thickness={4} sx={{ color: brandColors.primaryGreen }} />
        <Typography sx={{ color: brandColors.secondaryText, fontWeight: 600, fontSize: '0.95rem' }}>
          Loading marketplace catalog...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 6 }}>
      {/* Alert Notifications */}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{
            mb: 3,
            borderRadius: '14px',
            backgroundColor: brandColors.successLight,
            color: brandColors.success,
            fontWeight: 600,
            border: `1px solid ${brandColors.borderGreen}`,
          }}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 3,
            borderRadius: '14px',
            backgroundColor: brandColors.errorLight,
            color: brandColors.error,
            fontWeight: 600,
            border: `1px solid #FECACA`,
          }}
        >
          {error}
        </Alert>
      )}

      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.6rem', md: '2.1rem' },
                color: brandColors.primaryText,
                letterSpacing: '-0.02em',
              }}
            >
              Products
            </Typography>
            <Chip
              icon={<ProductIcon sx={{ fontSize: '16px !important', color: `${brandColors.primaryGreen} !important` }} />}
              label="Store Catalog"
              size="small"
              sx={{
                backgroundColor: brandColors.lightGreen,
                color: brandColors.primaryGreen,
                fontWeight: 700,
                fontSize: '12px',
                borderRadius: '8px',
                border: `1px solid ${brandColors.borderGreen}`,
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: brandColors.secondaryText,
              fontWeight: 500,
              mt: 0.5,
              fontSize: '0.92rem',
            }}
          >
            Manage inventory items, pricing, preparation time, and packaging fees across all merchant stores.
          </Typography>
        </Box>

        {/* Header Action Buttons */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={
              refreshing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={() => fetchInitialData(true)}
            disabled={refreshing}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderColor: brandColors.border,
              color: brandColors.primaryText,
              backgroundColor: brandColors.white,
              px: 2,
              py: 0.9,
              '&:hover': {
                borderColor: brandColors.primaryGreen,
                backgroundColor: '#F8FAFC',
              },
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>

          {canManageProducts && (
            <Button
              variant="contained"
              startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
              onClick={() => handleOpenForm()}
              sx={{
                backgroundColor: brandColors.primaryGreen,
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                px: 2.5,
                py: 1.1,
                boxShadow: '0 4px 14px rgba(8, 127, 91, 0.28)',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: brandColors.darkGreen,
                  boxShadow: '0 6px 18px rgba(8, 127, 91, 0.38)',
                },
              }}
            >
              Add Product
            </Button>
          )}
        </Stack>
      </Box>

      {/* KPI Bento Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Products */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Products
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.primaryText, fontSize: '1.85rem' }}>
                    {totalProductsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.primaryGreen, fontWeight: 700, mt: 0.5 }}>
                    Across All Vendors
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: brandColors.lightGreen,
                    color: brandColors.primaryGreen,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.borderGreen}`,
                  }}
                >
                  <ProductIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Products */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Active in Store
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', fontSize: '1.85rem' }}>
                    {activeProductsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, mt: 0.5 }}>
                    Available to Shoppers
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: '#DCFCE7',
                    color: '#16A34A',
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Inactive Products */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Inactive / Draft
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.secondaryText, fontSize: '1.85rem' }}>
                    {inactiveProductsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText, fontWeight: 700, mt: 0.5 }}>
                    Hidden from Storefront
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: '#F1F5F9',
                    color: brandColors.secondaryText,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.border}`,
                  }}
                >
                  <CancelIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* On Sale / Special Price */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: '20px',
              backgroundColor: brandColors.white,
              border: `1px solid ${brandColors.border}`,
              boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: brandColors.secondaryText, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Discounted Deals
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.orange, fontSize: '1.85rem' }}>
                    {onSaleProductsCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.orange, fontWeight: 700, mt: 0.5 }}>
                    Active Sale Prices
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: brandColors.lightOrange,
                    color: brandColors.orange,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.borderOrange}`,
                  }}
                >
                  <SaleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3.5,
          borderRadius: '20px',
          backgroundColor: brandColors.white,
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 4px 20px rgba(20, 33, 61, 0.03)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={3.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products by name or store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: brandColors.secondaryText, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& fieldset': {
                    borderColor: brandColors.border,
                  },
                  '&:hover fieldset': {
                    borderColor: brandColors.primaryGreen,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: brandColors.primaryGreen,
                  },
                },
              }}
            />
          </Grid>

          {/* Vendor Filter */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Store / Vendor</InputLabel>
              <Select
                value={selectedVendorFilter}
                label="Store / Vendor"
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: brandColors.border,
                  },
                }}
              >
                <MenuItem value="all">All Store Vendors</MenuItem>
                {vendors.map((v) => (
                  <MenuItem key={v._id} value={v._id}>
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Category Filter */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Category</InputLabel>
              <Select
                value={selectedModuleFilter}
                label="Category"
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.88rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: brandColors.border,
                  },
                }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {modules.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter & Clear */}
          <Grid item xs={12} sm={4} md={2.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.88rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: brandColors.border,
                    },
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              {hasActiveFilters && (
                <Tooltip title="Reset filters">
                  <IconButton
                    onClick={handleClearFilters}
                    size="small"
                    sx={{
                      backgroundColor: brandColors.lightOrange,
                      color: brandColors.orange,
                      borderRadius: '10px',
                      p: 1,
                      '&:hover': {
                        backgroundColor: brandColors.borderOrange,
                      },
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Filter Summary & Rows Per Page */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${brandColors.divider}`,
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 600 }}>
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            {hasActiveFilters && ' (filtered)'}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 500 }}>
              Rows per page:
            </Typography>
            <Select
              size="small"
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              sx={{
                height: 32,
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                '& .MuiSelect-select': { py: 0.5, px: 1.5 },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </Stack>
        </Box>
      </Paper>

      {/* Main Products Table Paper */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 4px 20px rgba(20, 33, 61, 0.04)',
          backgroundColor: brandColors.white,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#F8FAFC',
                  '& th': {
                    borderBottom: `1px solid ${brandColors.border}`,
                    color: brandColors.secondaryText,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    px: 2.5,
                  },
                }}
              >
                <TableCell>Product Item</TableCell>
                <TableCell>Store / Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Pricing</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Prep / Packaging</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Active Toggle</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: brandColors.adminBg,
                          color: brandColors.secondaryText,
                        }}
                      >
                        <ProductIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, color: brandColors.primaryText, fontSize: '1rem' }}>
                        No products match your filters
                      </Typography>
                      <Typography sx={{ color: brandColors.secondaryText, fontSize: '0.85rem' }}>
                        Add your first product or try adjusting search criteria.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const isActive = Boolean(product.isActive);
                  const hasSpecialPrice =
                    product.special_price && Number(product.special_price) < Number(product.main_price);

                  return (
                    <TableRow
                      key={product._id}
                      hover
                      sx={{
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          backgroundColor: '#F8FAFC',
                        },
                        '& td': {
                          borderBottom: `1px solid ${brandColors.divider}`,
                          py: 2,
                          px: 2.5,
                        },
                      }}
                    >
                      {/* Product Avatar + Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                          <Avatar
                            src={product.image || ''}
                            alt={product.name}
                            variant="rounded"
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '14px',
                              bgcolor: '#F8FAFC',
                              border: `1px solid ${brandColors.border}`,
                              objectFit: 'cover',
                            }}
                          >
                            <ProductIcon sx={{ color: brandColors.secondaryText, fontSize: 22 }} />
                          </Avatar>
                          <Box>
                            <Typography
                              onClick={() => handleViewProduct(product)}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.92rem',
                                color: brandColors.primaryText,
                                cursor: 'pointer',
                                '&:hover': {
                                  color: brandColors.primaryGreen,
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {product.name}
                            </Typography>
                            {product.description ? (
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  color: brandColors.secondaryText,
                                  maxWidth: 220,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {product.description}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                ID: {product._id?.slice(0, 8)}...
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Store / Vendor */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StoreIcon sx={{ color: brandColors.secondaryText, fontSize: 16 }} />
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: brandColors.primaryText }}>
                            {product.vendor_id?.name || product.vendor?.name || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {product.module_id?.name || product.module?.name ? (
                          <Chip
                            label={product.module_id?.name || product.module?.name}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: brandColors.lightGreen,
                              color: brandColors.primaryGreen,
                              borderRadius: '6px',
                              border: `1px solid ${brandColors.borderGreen}`,
                            }}
                          />
                        ) : (
                          <Typography sx={{ color: '#94A3B8', fontSize: '12px' }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Pricing */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                            <Typography
                              sx={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: hasSpecialPrice ? brandColors.orange : brandColors.primaryText,
                              }}
                            >
                              ₹{Number(hasSpecialPrice ? product.special_price : product.main_price).toLocaleString('en-IN')}
                            </Typography>
                            {hasSpecialPrice && (
                              <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                                ₹{Number(product.main_price).toLocaleString('en-IN')}
                              </Typography>
                            )}
                          </Box>
                          {hasSpecialPrice && (
                            <Chip
                              label="SALE"
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '9px',
                                fontWeight: 800,
                                backgroundColor: brandColors.lightOrange,
                                color: brandColors.orange,
                                mt: 0.2,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      {/* Prep / Packaging */}
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '0.82rem', color: brandColors.primaryText, fontWeight: 600 }}>
                          {product.preparation_time_minute ? `${product.preparation_time_minute} mins` : 'Immediate'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                          Pack fee: ₹{product.packaging_charge || 0}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            px: 1.2,
                            py: 0.35,
                            borderRadius: '50px',
                            backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9',
                            color: isActive ? '#16A34A' : '#64748B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: isActive ? '#22C55E' : '#94A3B8',
                            }}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>

                      {/* Active Toggle Switch */}
                      <TableCell>
                        <Switch
                          checked={isActive}
                          onChange={() => handleToggleActiveProduct(product)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: brandColors.primaryGreen,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: brandColors.primaryGreen,
                            },
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                          {/* Quick View */}
                          <Tooltip title="View Overview">
                            <IconButton
                              size="small"
                              onClick={() => handleViewProduct(product)}
                              sx={{
                                color: brandColors.blueAccent,
                                backgroundColor: brandColors.lightBlue,
                                borderRadius: '10px',
                                p: 0.85,
                                '&:hover': {
                                  backgroundColor: '#DBEAFE',
                                },
                              }}
                            >
                              <ViewIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Quick Edit */}
                          {canManageProducts && (
                            <Tooltip title="Edit Product">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenForm(product)}
                                sx={{
                                  color: brandColors.primaryGreen,
                                  backgroundColor: brandColors.lightGreen,
                                  borderRadius: '10px',
                                  p: 0.85,
                                  '&:hover': {
                                    backgroundColor: brandColors.borderGreen,
                                  },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* More Options Dropdown */}
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenActionMenu(e, product)}
                            sx={{
                              color: brandColors.secondaryText,
                              backgroundColor: '#F8FAFC',
                              borderRadius: '10px',
                              p: 0.85,
                              '&:hover': {
                                backgroundColor: '#E2E8F0',
                                color: brandColors.primaryText,
                              },
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination Footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            borderTop: `1px solid ${brandColors.divider}`,
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
            Showing <strong>{filteredProducts.length === 0 ? 0 : page * rowsPerPage + 1}</strong> to{' '}
            <strong>{Math.min((page + 1) * rowsPerPage, filteredProducts.length)}</strong> of{' '}
            <strong>{filteredProducts.length}</strong> products
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              startIcon={<ChevronLeftIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: brandColors.border,
                color: brandColors.primaryText,
                '&:hover': {
                  borderColor: brandColors.primaryGreen,
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              Previous
            </Button>

            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: brandColors.primaryText, px: 1 }}>
              Page {page + 1} of {totalPages}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              endIcon={<ChevronRightIcon />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderColor: brandColors.border,
                color: brandColors.primaryText,
                '&:hover': {
                  borderColor: brandColors.primaryGreen,
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              Next
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Row Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: {
            borderRadius: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            minWidth: 190,
            py: 0.5,
            border: `1px solid ${brandColors.border}`,
          },
        }}
      >
        <MenuItem onClick={() => handleViewProduct(activeMenuProduct)}>
          <ListItemIcon sx={{ color: brandColors.blueAccent }}>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Product Details" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        {canManageProducts && (
          <MenuItem onClick={() => handleOpenForm(activeMenuProduct)}>
            <ListItemIcon sx={{ color: brandColors.primaryGreen }}>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit Product" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
          </MenuItem>
        )}

        <MenuItem onClick={() => { const p = activeMenuProduct; handleCloseActionMenu(); if (p) handleToggleActiveProduct(p); }}>
          <ListItemIcon sx={{ color: activeMenuProduct?.isActive ? '#D97706' : '#16A34A' }}>
            {activeMenuProduct?.isActive ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText
            primary={activeMenuProduct?.isActive ? 'Deactivate Product' : 'Activate Product'}
            primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        {canManageProducts && (
          <MenuItem onClick={() => handleDeleteClick(activeMenuProduct)} sx={{ color: '#EF4444' }}>
            <ListItemIcon sx={{ color: '#EF4444' }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Delete Product" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
          </MenuItem>
        )}
      </Menu>

      {/* ======================================================== */}
      {/* PRODUCT DETAILS OVERVIEW DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500, md: 540 },
            p: 3.5,
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        {selectedProduct && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
                Product Overview
              </Typography>
              <IconButton onClick={() => setViewDrawerOpen(false)} sx={{ color: brandColors.secondaryText }}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {/* Product Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: '20px',
                  backgroundColor: '#F8FAFC',
                  border: `1px solid ${brandColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                }}
              >
                <Avatar
                  src={selectedProduct.image || ''}
                  alt={selectedProduct.name}
                  variant="rounded"
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '18px',
                    bgcolor: '#FFFFFF',
                    border: `1px solid ${brandColors.border}`,
                    objectFit: 'cover',
                  }}
                >
                  <ProductIcon sx={{ fontSize: 32, color: brandColors.secondaryText }} />
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: brandColors.primaryText }}>
                    {selectedProduct.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.2 }}>
                    Store: <strong>{selectedProduct.vendor_id?.name || 'Local Store'}</strong>
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip
                      label={selectedProduct.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: selectedProduct.isActive ? '#DCFCE7' : '#F1F5F9',
                        color: selectedProduct.isActive ? '#16A34A' : '#64748B',
                        borderRadius: '50px',
                      }}
                    />
                    {selectedProduct.special_price && Number(selectedProduct.special_price) < Number(selectedProduct.main_price) && (
                      <Chip
                        label="Special Sale"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: brandColors.lightOrange,
                          color: brandColors.orange,
                          borderRadius: '50px',
                        }}
                      />
                    )}
                  </Stack>
                </Box>
              </Paper>

              {/* Pricing Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: `1px solid ${brandColors.border}`,
                      backgroundColor: brandColors.white,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: brandColors.secondaryText, textTransform: 'uppercase' }}>
                      Regular Price
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: brandColors.primaryText, mt: 0.5 }}>
                      ₹{Number(selectedProduct.main_price || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: `1px solid ${brandColors.border}`,
                      backgroundColor: brandColors.white,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: brandColors.secondaryText, textTransform: 'uppercase' }}>
                      Sale Price
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: brandColors.orange, mt: 0.5 }}>
                      {selectedProduct.special_price
                        ? `₹${Number(selectedProduct.special_price).toLocaleString('en-IN')}`
                        : 'No Discount'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Details List */}
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: brandColors.primaryText, mb: 1.5 }}>
                Item Specifications
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: '16px',
                  border: `1px solid ${brandColors.border}`,
                  backgroundColor: brandColors.white,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Category:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: brandColors.primaryText }}>
                      {selectedProduct.module_id?.name || selectedProduct.module?.name || 'Unassigned'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Preparation Time:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: brandColors.primaryText }}>
                      {selectedProduct.preparation_time_minute ? `${selectedProduct.preparation_time_minute} minutes` : 'Immediate pickup'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Packaging Charge:
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: brandColors.primaryText }}>
                      ₹{selectedProduct.packaging_charge || 0}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                      Product Description:
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: brandColors.primaryText, fontWeight: 500, maxWidth: 260, textAlign: 'right' }}>
                      {selectedProduct.description || 'No description provided.'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>

            <Box sx={{ pt: 2, borderTop: `1px solid ${brandColors.divider}` }}>
              <Grid container spacing={1.5}>
                {canManageProducts && (
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setViewDrawerOpen(false);
                        handleOpenForm(selectedProduct);
                      }}
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        borderColor: brandColors.border,
                        color: brandColors.primaryText,
                        py: 1,
                      }}
                    >
                      Edit Product
                    </Button>
                  </Grid>
                )}
                <Grid item xs={canManageProducts ? 6 : 12}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setViewDrawerOpen(false);
                      handleToggleActiveProduct(selectedProduct);
                    }}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      backgroundColor: selectedProduct.isActive ? '#D97706' : '#16A34A',
                      color: '#FFFFFF',
                      py: 1,
                      '&:hover': {
                        backgroundColor: selectedProduct.isActive ? '#B45309' : '#15803D',
                      },
                    }}
                  >
                    {selectedProduct.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* ADD / EDIT PRODUCT DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={openFormDialog}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
              {selectedProduct ? 'Edit Product Item' : 'Add New Product'}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: brandColors.secondaryText, mt: 0.3 }}>
              {selectedProduct ? `Editing: ${selectedProduct.name}` : 'Configure pricing, store assignment, and packaging fees'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseForm} size="small" sx={{ color: brandColors.secondaryText }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: brandColors.divider }}>
          <Grid container spacing={2.5}>
            {/* Image Upload Box */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  border: `2px dashed ${brandColors.border}`,
                  borderRadius: '16px',
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  height: '100%',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                  '&:hover': { borderColor: brandColors.primaryGreen },
                }}
              >
                {imagePreview ? (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: '12px' }}
                    />
                  </Box>
                ) : (
                  <>
                    <ProductIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
                    <Typography sx={{ fontSize: '12px', color: '#94A3B8', mb: 1 }}>
                      Upload product photo
                    </Typography>
                  </>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{
                    mt: 1.5,
                    borderRadius: '10px',
                    borderColor: brandColors.border,
                    color: brandColors.primaryGreen,
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { borderColor: brandColors.primaryGreen, backgroundColor: brandColors.lightGreen },
                  }}
                >
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
              </Box>
            </Grid>

            {/* Form Fields */}
            <Grid item xs={12} sm={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Name *"
                    size="small"
                    value={formData.name}
                    onChange={(e) => setProductFormData({ ...formData, name: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Store / Vendor *</InputLabel>
                    <Select
                      value={formData.vendor_id}
                      label="Store / Vendor *"
                      onChange={(e) => setProductFormData({ ...formData, vendor_id: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      {vendors.map((v) => (
                        <MenuItem key={v._id} value={v._id}>
                          {v.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.module_id}
                      label="Category"
                      onChange={(e) => setProductFormData({ ...formData, module_id: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      {modules.map((m) => (
                        <MenuItem key={m._id} value={m._id}>
                          {m.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Main Price (₹) *"
                    type="number"
                    size="small"
                    value={formData.main_price}
                    onChange={(e) => setProductFormData({ ...formData, main_price: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Special / Sale Price (₹)"
                    type="number"
                    size="small"
                    value={formData.special_price}
                    onChange={(e) => setProductFormData({ ...formData, special_price: e.target.value })}
                    helperText="Leave empty if regular price applies"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Preparation Time (minutes)"
                    type="number"
                    size="small"
                    value={formData.preparation_time_minute}
                    onChange={(e) =>
                      setProductFormData({ ...formData, preparation_time_minute: Number(e.target.value) })
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Packaging Charge (₹)"
                    type="number"
                    size="small"
                    value={formData.packaging_charge}
                    onChange={(e) => setProductFormData({ ...formData, packaging_charge: Number(e.target.value) })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Description"
                    multiline
                    rows={2}
                    size="small"
                    value={formData.description}
                    onChange={(e) => setProductFormData({ ...formData, description: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: '12px',
                      border: `1px solid ${brandColors.border}`,
                      backgroundColor: '#FAFBFC',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: brandColors.primaryText }}>
                        Active in Store
                      </Typography>
                      <Typography sx={{ fontSize: '11.5px', color: brandColors.secondaryText }}>
                        Product will be visible to customer search and ordering
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setProductFormData({ ...formData, isActive: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: brandColors.primaryGreen },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brandColors.primaryGreen },
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseForm}
            sx={{ borderRadius: '10px', color: brandColors.secondaryText, fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProduct}
            disabled={submitting || !formData.name.trim() || !formData.main_price}
            sx={{
              borderRadius: '12px',
              backgroundColor: brandColors.primaryGreen,
              fontWeight: 700,
              px: 3,
              textTransform: 'none',
              '&:hover': { backgroundColor: brandColors.darkGreen },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : selectedProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
          Delete Product?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: brandColors.secondaryText, fontSize: '14px' }}>
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This item will be permanently removed from its vendor store.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: '10px', color: brandColors.secondaryText, fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={submitting}
            sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
