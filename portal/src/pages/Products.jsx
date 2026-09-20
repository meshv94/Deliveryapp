import React, { useState, useEffect } from 'react';
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
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  MenuItem,
  InputBase,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Storefront as StorefrontIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import vendorService from '../services/vendorService';
import moduleService from '../services/moduleService';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog State
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [productsRes, vendorsRes, modulesRes] = await Promise.all([
        vendorService.getAllProducts(),
        vendorService.getAllVendors(),
        moduleService.getAllModules(),
      ]);

      setProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
      setModules(modulesRes.data || []);
    } catch (err) {
      console.error('Error fetching marketplace products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

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
        vendor_id: product.vendor_id?._id || product.vendor_id || '',
        module_id: product.module_id?._id || product.module_id || '',
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

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.main_price) {
      setError('Product name and main price are required');
      return;
    }
    if (!formData.vendor_id) {
      setError('Please assign this product to a vendor');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
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
        setSuccess('Product updated successfully');
      } else {
        await vendorService.createProduct(form);
        setSuccess('Product created successfully');
      }

      handleCloseForm();
      const updated = await vendorService.getAllProducts();
      setProducts(updated.data || []);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    try {
      setSubmitting(true);
      await vendorService.deleteProduct(selectedProduct._id);
      setSuccess('Product deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      const updated = await vendorService.getAllProducts();
      setProducts(updated.data || []);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor_id?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesVendor =
      selectedVendorFilter === 'all' ||
      (p.vendor_id?._id || p.vendor_id) === selectedVendorFilter;

    const matchesModule =
      selectedModuleFilter === 'all' ||
      (p.module_id?._id || p.module_id) === selectedModuleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive);

    return matchesSearch && matchesVendor && matchesModule && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const paginatedProducts = filteredProducts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} thickness={4} sx={{ color: '#087F5B' }} />
        <Typography sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem' }}>Loading products…</Typography>
      </Box>
    );
  }

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '14px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.45rem', md: '1.75rem' }, color: '#14213D', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Products
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 500, mt: 0.4 }}>
            Manage products across AapnuBazaar vendors
          </Typography>
        </Box>
        {canManageProducts && (
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => handleOpenForm()}
            sx={{ backgroundColor: '#087F5B', color: '#FFFFFF', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, px: 2.5, py: 1.2, minHeight: 44, boxShadow: '0 4px 14px rgba(8, 127, 91, 0.28)', textTransform: 'none', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#075B43', boxShadow: '0 6px 18px rgba(8, 127, 91, 0.38)' } }}
          >
            Add Product
          </Button>
        )}
      </Box>

      {/* ── Status summary chips ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {[
          { label: 'All Products', value: products.length, filter: 'all', bg: '#F1F5F9', color: '#475569' },
          { label: 'Active', value: activeCount, filter: 'active', bg: '#DCFCE7', color: '#15803D' },
          { label: 'Inactive', value: inactiveCount, filter: 'inactive', bg: '#F1F5F9', color: '#64748B' },
        ].map((c) => (
          <Box
            key={c.filter}
            onClick={() => { setStatusFilter(c.filter); setPage(1); }}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.9, borderRadius: '50px', backgroundColor: statusFilter === c.filter ? c.bg : '#FFFFFF', color: statusFilter === c.filter ? c.color : '#64748B', border: `1.5px solid ${statusFilter === c.filter ? c.color + '50' : '#E2E8F0'}`, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s ease', '&:hover': { backgroundColor: c.bg, color: c.color } }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: statusFilter === c.filter ? c.color : '#CBD5E1' }} />
            {c.label}
            <Box sx={{ px: 0.9, py: 0.1, borderRadius: '6px', backgroundColor: statusFilter === c.filter ? `${c.color}20` : '#F1F5F9', color: statusFilter === c.filter ? c.color : '#94A3B8', fontSize: '0.75rem', fontWeight: 800 }}>{c.value}</Box>
          </Box>
        ))}
      </Box>

      {/* ── Main Card ─────────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(20,33,61,0.04)', backgroundColor: '#FFFFFF', p: { xs: 2, sm: 3.5 }, mb: 4 }}>

        {/* ── Toolbar ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem', color: '#14213D', letterSpacing: '-0.02em' }}>All Products</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.3 }}>{filteredProducts.length} results</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Search */}
            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.8, py: 0.7, width: { xs: '100%', sm: 240 } }}>
              <SearchIcon sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} />
              <InputBase
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                sx={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', width: '100%', '& input::placeholder': { color: '#94A3B8', opacity: 1 } }}
              />
            </Box>

            {/* Vendor filter */}
            {vendors.length > 0 && (
              <Box
                component="select"
                value={selectedVendorFilter}
                onChange={(e) => { setSelectedVendorFilter(e.target.value); setPage(1); }}
                sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.5, py: 0.85, fontSize: '13px', fontWeight: 600, color: '#64748B', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none', minWidth: 150, '&:hover': { borderColor: '#CBD5E1' } }}
              >
                <option value="all">All Vendors</option>
                {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </Box>
            )}

            {/* Category filter */}
            {modules.length > 0 && (
              <Box
                component="select"
                value={selectedModuleFilter}
                onChange={(e) => { setSelectedModuleFilter(e.target.value); setPage(1); }}
                sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.5, py: 0.85, fontSize: '13px', fontWeight: 600, color: '#64748B', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none', minWidth: 140, '&:hover': { borderColor: '#CBD5E1' } }}
              >
                <option value="all">All Categories</option>
                {modules.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </Box>
            )}

            {/* Status filter */}
            <Box
              component="select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', px: 1.5, py: 0.85, fontSize: '13px', fontWeight: 600, color: '#64748B', backgroundColor: '#FFFFFF', cursor: 'pointer', outline: 'none', minWidth: 120, '&:hover': { borderColor: '#CBD5E1' } }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Box>
          </Box>
        </Box>

        {/* ── Table ── */}
        <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1.5px solid #F1F5F9', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.6, backgroundColor: '#FAFBFC', whiteSpace: 'nowrap' } }}>
                <TableCell>Product</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Prep / Pack</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <InventoryIcon sx={{ fontSize: 48, color: '#E2E8F0', mb: 1.5, display: 'block', mx: 'auto' }} />
                    <Typography sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.95rem' }}>No products found</Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.5 }}>
                      {search ? `No results for "${search}"` : 'Add your first product to get started'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const isActive = Boolean(product.isActive);
                  const hasSpecialPrice = product.special_price && Number(product.special_price) < Number(product.main_price);
                  return (
                    <TableRow
                      key={product._id}
                      hover
                      sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.6 }, '&:hover': { backgroundColor: '#FAFCFF' }, transition: 'background-color 0.12s ease' }}
                    >
                      {/* Product Image + Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                          <Avatar
                            src={product.image}
                            alt={product.name}
                            variant="rounded"
                            sx={{ width: 46, height: 46, borderRadius: '12px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', objectFit: 'cover' }}
                          >
                            <InventoryIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#14213D', lineHeight: 1.3, maxWidth: 180 }}>
                              {product.name}
                            </Typography>
                            {product.description && (
                              <Typography sx={{ fontSize: '11px', color: '#94A3B8', mt: 0.2, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {product.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StorefrontIcon sx={{ color: '#94A3B8', fontSize: 16, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                            {product.vendor_id?.name || 'Unassigned'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        {product.module_id?.name ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.4, py: 0.4, borderRadius: '8px', backgroundColor: '#EBFBEE', color: '#087F5B', fontSize: '12px', fontWeight: 700 }}>
                            {product.module_id.name}
                          </Box>
                        ) : (
                          <Typography sx={{ color: '#94A3B8', fontSize: '12px' }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Price */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                          <Typography sx={{ fontSize: '13.5px', fontWeight: 800, color: hasSpecialPrice ? '#FF6B00' : '#14213D' }}>
                            ₹{hasSpecialPrice ? product.special_price : product.main_price}
                          </Typography>
                          {hasSpecialPrice && (
                            <Typography sx={{ fontSize: '11.5px', color: '#94A3B8', textDecoration: 'line-through' }}>
                              ₹{product.main_price}
                            </Typography>
                          )}
                        </Box>
                        {hasSpecialPrice && (
                          <Box sx={{ display: 'inline-flex', px: 0.9, py: 0.1, borderRadius: '6px', backgroundColor: '#FFF3E8', color: '#FF6B00', fontSize: '10px', fontWeight: 800, mt: 0.3 }}>
                            SALE
                          </Box>
                        )}
                      </TableCell>

                      {/* Prep Time + Packaging Charge */}
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                          {product.preparation_time_minute ? `${product.preparation_time_minute} min` : '—'} prep
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                          ₹{product.packaging_charge || 0} pack
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.4, py: 0.4, borderRadius: '50px', backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9', color: isActive ? '#15803D' : '#64748B', fontSize: '12px', fontWeight: 700 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isActive ? '#16A34A' : '#94A3B8' }} />
                          {isActive ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {canManageProducts && (
                          <>
                            <Tooltip title="Edit Product">
                              <IconButton size="small" onClick={() => handleOpenForm(product)} sx={{ color: '#087F5B', backgroundColor: '#EBFBEE', borderRadius: '10px', mr: 0.8, '&:hover': { backgroundColor: '#DCFCE7' } }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Product">
                              <IconButton size="small" onClick={() => handleDeleteClick(product)} sx={{ color: '#EF4444', backgroundColor: '#FEE2E2', borderRadius: '10px', '&:hover': { backgroundColor: '#FECACA' } }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 3, pt: 2.5, borderTop: '1px solid #F1F5F9' }}>
          <Box sx={{ px: 2, py: 0.7, borderRadius: '50px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '12px', fontWeight: 700 }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} · Page {page} of {totalPages}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', width: 34, height: 34, color: '#64748B', '&:disabled': { opacity: 0.35 } }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const n = start + i;
              if (n > totalPages) return null;
              return (
                <IconButton key={n} size="small" onClick={() => setPage(n)} sx={{ border: `1px solid ${n === page ? '#087F5B' : '#E2E8F0'}`, borderRadius: '10px', width: 34, height: 34, backgroundColor: n === page ? '#087F5B' : '#FFFFFF', color: n === page ? '#FFFFFF' : '#64748B', fontWeight: 700, fontSize: '13px', '&:hover': { backgroundColor: n === page ? '#075B43' : '#F8FAFC' } }}>
                  {n}
                </IconButton>
              );
            })}
            <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} sx={{ border: '1px solid #E2E8F0', borderRadius: '10px', width: 34, height: 34, backgroundColor: '#087F5B', color: '#FFFFFF', '&:hover': { backgroundColor: '#075B43' }, '&:disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' } }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ── Add / Edit Product Modal ──────────────────────────────────────────── */}
      <Dialog open={openFormDialog} onClose={handleCloseForm} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#14213D' }}>
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748B', mt: 0.3 }}>
              {selectedProduct ? `Editing: ${selectedProduct.name}` : 'Fill in product details below'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseForm} size="small" sx={{ color: '#64748B', '&:hover': { backgroundColor: '#F1F5F9' } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
          <Grid container spacing={2.5}>
            {/* Image Upload */}
            <Grid item xs={12} sm={4}>
              <Box
                sx={{ border: '2px dashed #CBD5E1', borderRadius: '16px', p: 2, textAlign: 'center', backgroundColor: '#F8FAFC', height: '100%', minHeight: 190, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s ease', '&:hover': { borderColor: '#087F5B' } }}
              >
                {imagePreview ? (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: '12px' }} />
                  </Box>
                ) : (
                  <>
                    <InventoryIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
                    <Typography sx={{ fontSize: '12px', color: '#94A3B8', mb: 1 }}>Click to upload product image</Typography>
                  </>
                )}
                <Button variant="outlined" component="label" startIcon={<UploadIcon />} size="small" sx={{ mt: 1.5, borderRadius: '10px', borderColor: '#CBD5E1', color: '#087F5B', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: '#087F5B', backgroundColor: '#EBFBEE' } }}>
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
              </Box>
            </Grid>

            {/* Form Fields */}
            <Grid item xs={12} sm={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Product Name *" size="small" value={formData.name} onChange={(e) => setProductFormData({ ...formData, name: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Store / Vendor *</InputLabel>
                    <Select value={formData.vendor_id} label="Store / Vendor *" onChange={(e) => setProductFormData({ ...formData, vendor_id: e.target.value })} sx={{ borderRadius: '12px' }}>
                      {vendors.map((v) => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={formData.module_id} label="Category" onChange={(e) => setProductFormData({ ...formData, module_id: e.target.value })} sx={{ borderRadius: '12px' }}>
                      {modules.map((m) => <MenuItem key={m._id} value={m._id}>{m.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Main Price (₹) *" type="number" size="small" value={formData.main_price} onChange={(e) => setProductFormData({ ...formData, main_price: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Special / Sale Price (₹)" type="number" size="small" value={formData.special_price} onChange={(e) => setProductFormData({ ...formData, special_price: e.target.value })} helperText="Leave empty if no discount" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Preparation Time (minutes)" type="number" size="small" value={formData.preparation_time_minute} onChange={(e) => setProductFormData({ ...formData, preparation_time_minute: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Packaging Charge (₹)" type="number" size="small" value={formData.packaging_charge} onChange={(e) => setProductFormData({ ...formData, packaging_charge: Number(e.target.value) })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>

                <Grid item xs={12}>
                  <TextField fullWidth label="Product Description" multiline rows={2} size="small" value={formData.description} onChange={(e) => setProductFormData({ ...formData, description: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#FAFBFC' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#14213D' }}>Active in Store</Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#64748B' }}>Product will be visible to customers</Typography>
                    </Box>
                    <Switch checked={formData.isActive} onChange={(e) => setProductFormData({ ...formData, isActive: e.target.checked })} sx={{ '& .MuiSwitch-thumb': { backgroundColor: formData.isActive ? '#087F5B' : '#CBD5E1' }, '& .Mui-checked + .MuiSwitch-track': { backgroundColor: '#087F5B' } }} />
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button onClick={handleCloseForm} sx={{ borderRadius: '10px', color: '#64748B', fontWeight: 600, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveProduct} disabled={submitting} sx={{ borderRadius: '12px', backgroundColor: '#087F5B', fontWeight: 700, px: 3, textTransform: 'none', '&:hover': { backgroundColor: '#075B43' } }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : selectedProduct ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#14213D' }}>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#64748B', fontSize: '14px' }}>
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This item will be permanently removed from its vendor store.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: '10px', color: '#64748B', fontWeight: 600, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={submitting} sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
